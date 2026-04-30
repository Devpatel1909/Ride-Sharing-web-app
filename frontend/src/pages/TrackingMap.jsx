import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import io from "socket.io-client";
import {
  Navigation,
  MapPin,
  User,
  Car,
  Phone,
  CheckCircle,
  Loader,
  AlertCircle,
  ArrowLeft,
  PlayCircle,
  Flag,
  Clock,
  ExternalLink,
} from "lucide-react";
import Header from "../components/common/Header";
import { riderAPI } from "../services/api";

const mapContainerStyle = {
  height: "calc(100vh - 10rem)",
  width: "100%",
};

const VEHICLE_LABELS = {
  bike: "BIKE",
  moto: "BIKE",
  auto: "AUTO",
  car: "CAR",
  suv: "SUV",
};

const VEHICLE_COLORS = {
  bike: "#f59e0b",
  moto: "#f59e0b",
  auto: "#10b981",
  car: "#2563eb",
  suv: "#7c3aed",
};

const normalizeVehicleType = (value) => String(value || "car").toLowerCase();

const getBearing = (from, to) => {
  if (!from || !to) return 0;

  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLon = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
};

const getVehicleMarkerIcon = (vehicleType, heading) => {
  if (typeof window === "undefined" || !window.google) return undefined;

  const normalizedType = normalizeVehicleType(vehicleType);
  const label = VEHICLE_LABELS[normalizedType] || VEHICLE_LABELS.car;
  const fillColor = VEHICLE_COLORS[normalizedType] || VEHICLE_COLORS.car;
  const rotation = Number.isFinite(heading) ? heading : 0;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
      <g transform="rotate(${rotation} 36 36)">
        <circle cx="36" cy="36" r="26" fill="${fillColor}" opacity="0.18"/>
        <path d="M36 10 L48 30 L36 24 L24 30 Z" fill="${fillColor}" opacity="0.95"/>
        <rect x="24" y="28" width="24" height="18" rx="6" fill="${fillColor}" opacity="0.95"/>
        <rect x="28" y="31" width="16" height="7" rx="3" fill="#ffffff" opacity="0.96"/>
        <circle cx="29" cy="49" r="4" fill="#0f172a"/>
        <circle cx="43" cy="49" r="4" fill="#0f172a"/>
      </g>
      <text x="36" y="63" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="${fillColor}">${label}</text>
    </svg>
  `.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(44, 44),
    anchor: new window.google.maps.Point(22, 22),
  };
};

function fitMapToPoints(map, points, hasFittedRef) {
  if (!map || !points?.length || typeof window === "undefined" || !window.google) return;

  if (points.length >= 2) {
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 70);
    hasFittedRef.current = true;
    return;
  }

  if (!hasFittedRef.current && points.length === 1) {
    map.setCenter(points[0]);
    map.setZoom(15);
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TrackingMap() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Extract data passed via navigation state
  const {
    rideId,
    role,          // "rider" | "passenger"
    riderName,
    riderPhone,
    vehicleType,
    vehiclePlate,
    pickup,
    destination,
    pickupCoords,
    destCoords,
  } = state || {};

  const [myLocation, setMyLocation] = useState(null);
  const [otherLocation, setOtherLocation] = useState(null);
  const [otherConnected, setOtherConnected] = useState(false);
  const [rideStatus, setRideStatus] = useState("accepted"); // accepted | in-progress | completed
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveDistance, setLiveDistance] = useState(null);   // km between rider & passenger
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);       // [{lat,lng},...] road path
  const [riderHeading, setRiderHeading] = useState(0);
  const [mapCenter] = useState(
    pickupCoords ? { lat: pickupCoords.lat, lng: pickupCoords.lng } : { lat: 20.5937, lng: 78.9629 }
  );

  const socketRef = useRef(null);
  const gpsIntervalRef = useRef(null);
  const mapRef = useRef(null);
  const hasFittedMapRef = useRef(false);
  const riderPreviousLocationRef = useRef(null);

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "ride-tracking-google-map",
    googleMapsApiKey: mapsApiKey,
  });

  // Determine which token to use
  const token = role === "rider"
    ? localStorage.getItem("riderToken")
    : localStorage.getItem("token");

  // ── Broadcast own GPS location ────────────────────────────────────────────
  const broadcastLocation = useCallback(() => {
    if (!navigator.geolocation || !socketRef.current?.connected) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude };
        setMyLocation(loc);
        socketRef.current.emit("location-update", {
          rideId,
          lat: loc.lat,
          lng: loc.lng,
          role,
        });
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [rideId, role]);

  // ── Socket.IO setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!rideId || !role || !token) {
      navigate("/");
      return;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const socketUrl = API_BASE_URL.replace("/api", "");

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      console.log("✅ TrackingMap socket connected:", socket.id);

      // Join the ride room
      socket.emit("join-ride", { rideId, role });

      // Also register in personal room for compatibility
      if (role === "rider") socket.emit("rider-online", localStorage.getItem("rider") ? JSON.parse(localStorage.getItem("rider"))?.id : null);
      else socket.emit("passenger-join", localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user"))?.id : null);

      // Start broadcasting location immediately + every 3s (guard against duplicate intervals)
      broadcastLocation();
      if (!gpsIntervalRef.current) {
        gpsIntervalRef.current = setInterval(broadcastLocation, 3000);
      }
    });

    // Receive other party's location
    socket.on("location-update", ({ lat, lng, role: fromRole }) => {
      if (fromRole !== role) setOtherLocation({ lat, lng });
    });

    // Other party joined the room
    socket.on("party-connected", ({ role: connectedRole }) => {
      if (connectedRole !== role) setOtherConnected(true);
    });

    // Ride status updates
    socket.on("ride-status-change", ({ status }) => {
      setRideStatus(status);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      console.log("❌ TrackingMap socket disconnected");
    });

    return () => {
      clearInterval(gpsIntervalRef.current);
      if (role === "rider") socket.emit("rider-offline", null);
      socket.disconnect();
    };
  }, [rideId, role, token, broadcastLocation, navigate]);

  // ── Determine marker positions ───────────────────────────────────────────
  const riderLoc  = role === "rider"  ? myLocation  : otherLocation;
  const passengerLoc = role === "passenger" ? myLocation : otherLocation;

  useEffect(() => {
    if (!riderLoc) return;

    const previous = riderPreviousLocationRef.current;
    const target = rideStatus === "in-progress"
      ? destCoords
      : (passengerLoc || destCoords);

    if (previous) {
      setRiderHeading(getBearing(previous, riderLoc));
    } else if (target) {
      setRiderHeading(getBearing(riderLoc, target));
    }

    riderPreviousLocationRef.current = riderLoc;
  }, [riderLoc?.lat, riderLoc?.lng, passengerLoc?.lat, passengerLoc?.lng, destCoords?.lat, destCoords?.lng, rideStatus]);

  // ── Live distance: to passenger when accepted, to destination when in-progress ──
  useEffect(() => {
    const from = riderLoc;
    const to   = rideStatus === "in-progress" ? destCoords : passengerLoc;
    if (!from || !to) { setLiveDistance(null); return; }
    const R = 6371;
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLon = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    setLiveDistance(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, [riderLoc?.lat, riderLoc?.lng, passengerLoc?.lat, passengerLoc?.lng, destCoords?.lat, destCoords?.lng, rideStatus]); // eslint-disable-line

  // ── Fetch real road route (OSRM) when rider or other party location updates ─
  const lastRouteFetch = useRef({ rLat: null, rLng: null });

  useEffect(() => {
    if (!riderLoc) return;

    // When in-progress: route to destination
    // When accepted (going to pick up): route to passenger location
    const target = rideStatus === "in-progress"
      ? destCoords
      : (passengerLoc || destCoords);

    if (!target) return;

    // Only re-fetch if rider moved >50 m to avoid hammering the API
    const prev = lastRouteFetch.current;
    const movedKm = prev.rLat == null ? Infinity :
      Math.abs(riderLoc.lat - prev.rLat) * 111 + Math.abs(riderLoc.lng - prev.rLng) * 111;
    if (movedKm < 0.05) return;

    lastRouteFetch.current = { rLat: riderLoc.lat, rLng: riderLoc.lng };

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    fetch(
      `${API_BASE_URL}/geocoding/route?fromLat=${riderLoc.lat}&fromLon=${riderLoc.lng}&toLat=${target.lat}&toLon=${target.lng}`
    )
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.success && data.route?.coordinates?.length) {
          // OSRM returns [lon, lat] — Google Maps expects {lat, lng}
          setRouteCoords(data.route.coordinates.map(([lon, lat]) => ({ lat, lng: lon })));
        }
      })
      .catch(() => {}); // Silently fall back to straight line
  }, [riderLoc?.lat, riderLoc?.lng, passengerLoc?.lat, passengerLoc?.lng, rideStatus]); // eslint-disable-line

  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const points = (rideStatus === "in-progress"
      ? [riderLoc, destCoords]
      : [riderLoc, passengerLoc, pickupCoords, destCoords]
    ).filter(Boolean);

    fitMapToPoints(mapRef.current, points, hasFittedMapRef);
  }, [
    isLoaded,
    rideStatus,
    riderLoc?.lat,
    riderLoc?.lng,
    passengerLoc?.lat,
    passengerLoc?.lng,
    pickupCoords?.lat,
    pickupCoords?.lng,
    destCoords?.lat,
    destCoords?.lng,
  ]);

  // ── Google Maps navigation link ─────────────────────────────────────
  const googleMapsUrl = destCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${destCoords.lat},${destCoords.lng}&travelmode=driving`
    : destination
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`
      : null;

  // ── Rider status change handler ───────────────────────────────────────────
  const handleStatusChange = useCallback(async (newStatus) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      setRideStatus(newStatus);
      if (socketRef.current?.connected) {
        socketRef.current.emit("ride-status-change", { rideId, status: newStatus });
      }
      // Best-effort persist to backend
      await riderAPI.updateRideStatus(rideId, newStatus).catch((e) =>
        console.warn("Status update failed:", e)
      );
      if (newStatus === "completed") {
        setTimeout(() => navigate("/rider/dashboard"), 2500);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [rideId, isUpdatingStatus, navigate]);

  const otherLabel = role === "rider" ? "Passenger" : "Rider";

  // ── Status helpers ────────────────────────────────────────────────────────
  const statusColor = {
    accepted:    "bg-blue-100 text-blue-700 border-blue-300",
    "in-progress": "bg-amber-100 text-amber-700 border-amber-300",
    completed:   "bg-green-100 text-green-700 border-green-300",
  };

  const statusLabel = {
    accepted:    "Rider on the way to pickup",
    "in-progress": "En route to destination",
    completed:   "Ride completed",
  };

  const getCircleIcon = (fillColor, scale = 8) => {
    if (!isLoaded || typeof window === "undefined" || !window.google) return undefined;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale,
    };
  };

  if (!rideId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-lg font-semibold text-slate-700">No tracking data found.</p>
        <button onClick={() => navigate("/")} className="px-6 py-2 text-white rounded-xl bg-linear-to-r from-blue-600 to-purple-600">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      {/* ── Info bar ──────────────────────────────────────────────────────── */}
      <div className="fixed left-0 right-0 z-40 px-4 py-3 border-b shadow-md top-24 bg-white/95 backdrop-blur-sm border-slate-200">
        <div className="flex flex-wrap items-center justify-between max-w-5xl gap-3 mx-auto">
          {/* Left: ride status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 transition rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className={`px-3 py-1 text-xs font-bold border rounded-full ${statusColor[rideStatus] || statusColor.accepted}`}>
              {statusLabel[rideStatus] || rideStatus}
            </span>
            <span className="text-sm font-semibold text-slate-600">
              Ride <span className="font-black text-slate-900">#{String(rideId).slice(0, 8)}</span>
            </span>
          </div>

          {/* Right: navigate button (in-progress) or connection status */}
          <div className="flex items-center gap-3">
            {rideStatus === "in-progress" && googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-xl bg-linear-to-r from-blue-600 to-purple-600 hover:opacity-90 transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                Navigate
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
              <span className="text-xs font-semibold text-slate-500">
                {socketConnected ? "Live" : "Connecting…"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 mt-40">
        {!mapsApiKey ? (
          <div className="flex items-center justify-center h-[calc(100vh-10rem)] bg-slate-100 text-slate-600 text-sm font-semibold">
            Add VITE_GOOGLE_MAPS_API_KEY to show live map.
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-center h-[calc(100vh-10rem)] bg-slate-100 text-red-500 text-sm font-semibold">
            Unable to load Google Maps.
          </div>
        ) : !isLoaded ? (
          <div className="flex items-center justify-center h-[calc(100vh-10rem)] bg-slate-100">
            <Loader className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={14}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onUnmount={() => {
              mapRef.current = null;
            }}
            options={{
              fullscreenControl: false,
              mapTypeControl: false,
              streetViewControl: false,
            }}
          >
            {/* ── Pickup pin ───────────────────────────────────────── */}
            {pickupCoords && (
              <Marker
                position={pickupCoords}
                icon={getCircleIcon("#10b981", 7)}
                title={pickup || "Pickup"}
              />
            )}

            {/* ── Destination pin ──────────────────────────────────── */}
            {destCoords && (
              <Marker
                position={destCoords}
                icon={getCircleIcon("#ef4444", 7)}
                title={destination || "Destination"}
              />
            )}

            {/* ── Rider marker ─────────────────────────────────────── */}
            {riderLoc && (
              <Marker
                position={riderLoc}
                icon={getVehicleMarkerIcon(vehicleType, riderHeading)}
                title={role === "rider" ? "You (Rider)" : (riderName || "Rider")}
              />
            )}

            {/* ── Passenger marker ─────────────────────────────────── */}
            {passengerLoc && (
              <Marker
                position={passengerLoc}
                icon={getCircleIcon("#059669", 9)}
                label={{
                  text: "P",
                  color: "#ffffff",
                  fontWeight: "700",
                }}
                title={role === "passenger" ? "You" : "Passenger"}
              />
            )}

            {/* ── Road route (OSRM) — rider → passenger/destination ── */}
            {routeCoords.length > 1 ? (
              <>
                <Polyline
                  path={routeCoords}
                  options={{
                    strokeColor: "#ffffff",
                    strokeOpacity: 0.55,
                    strokeWeight: 8,
                  }}
                />
                <Polyline
                  path={routeCoords}
                  options={{
                    strokeColor: rideStatus === "in-progress" ? "#10b981" : "#4f46e5",
                    strokeOpacity: 0.9,
                    strokeWeight: 5,
                  }}
                />
              </>
            ) : (
              riderLoc && (passengerLoc || destCoords) && (
                <>
                  <Polyline
                    path={[riderLoc, passengerLoc || destCoords]}
                    options={{
                      strokeColor: "#ffffff",
                      strokeOpacity: 0.4,
                      strokeWeight: 6,
                    }}
                  />
                  <Polyline
                    path={[riderLoc, passengerLoc || destCoords]}
                    options={{
                      strokeColor: rideStatus === "in-progress" ? "#10b981" : "#4f46e5",
                      strokeOpacity: 0.7,
                      strokeWeight: 3,
                      icons: [{
                        icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
                        offset: "0",
                        repeat: "12px",
                      }],
                    }}
                  />
                </>
              )
            )}

            {/* ── Full journey line pickup → destination (always shown as guide) ── */}
            {pickupCoords && destCoords && (
              <Polyline
                path={[pickupCoords, destCoords]}
                options={{
                  strokeColor: "#94a3b8",
                  strokeOpacity: 0.3,
                  strokeWeight: 2,
                  icons: [{
                    icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
                    offset: "0",
                    repeat: "14px",
                  }],
                }}
              />
            )}
          </GoogleMap>
        )}
      </div>

      {/* ── Bottom info card ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 pb-4 border-t shadow-2xl bg-white/95 backdrop-blur-sm border-slate-200 max-h-[50vh] overflow-y-auto">
        <div className="max-w-5xl mx-auto pb-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* My location status */}
            <div className="flex items-center gap-3 p-3 border border-blue-100 rounded-2xl bg-linear-to-r from-blue-50 to-purple-50">
              {myLocation ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Loader className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold tracking-wide uppercase text-slate-500">Your location</p>
                <p className="text-sm font-semibold text-slate-800">
                  {myLocation ? `${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}` : "Acquiring GPS…"}
                </p>
              </div>
            </div>

            {/* Other party status */}
            <div className="flex items-center gap-3 p-3 border rounded-2xl bg-linear-to-r from-emerald-50 to-teal-50 border-emerald-100">
              {otherLocation ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Loader className="w-5 h-5 text-emerald-500 animate-spin shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold tracking-wide uppercase text-slate-500">{otherLabel}'s location</p>
                <p className="text-sm font-semibold text-slate-800">
                  {otherLocation
                    ? `${otherLocation.lat.toFixed(4)}, ${otherLocation.lng.toFixed(4)}`
                    : otherConnected
                      ? "Waiting for GPS…"
                      : `Waiting for ${otherLabel} to connect…`}
                </p>
              </div>
            </div>
          </div>

          {/* Ride route summary */}
          {(pickup || destination) && (
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-semibold truncate">{pickup}</span>
              <span className="text-slate-400 shrink-0">→</span>
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-semibold truncate">{destination}</span>
            </div>
          )}

          {/* ── Navigate to destination button (both rider & passenger when in-progress) ── */}
          {rideStatus === "in-progress" && googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 mt-3 text-sm font-bold text-white transition shadow-lg rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-700 shadow-blue-500/30 hover:opacity-90 active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              Navigate to Destination
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          )}

          {/* Live distance / ETA between rider and passenger */}
          {liveDistance !== null && (
            <div className="flex items-center gap-4 mt-3 px-4 py-2.5 rounded-2xl bg-linear-to-r from-violet-50 to-blue-50 border border-violet-100">
              <Navigation className="w-4 h-4 text-violet-500 shrink-0" />
              <div className="flex items-center gap-1 text-sm font-bold text-violet-700">
                {liveDistance < 1
                  ? `${Math.round(liveDistance * 1000)} m`
                  : `${liveDistance.toFixed(2)} km`}
                <span className="ml-1 text-xs font-normal text-slate-400">
                  {rideStatus === "in-progress" ? "to destination" : "to pickup"}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-auto text-sm font-bold text-blue-700">
                <Clock className="w-3.5 h-3.5" />
                {/* ETA based on avg 30 km/h */}
                {liveDistance < 0.05
                  ? "Arrived"
                  : `~${Math.max(1, Math.round((liveDistance / 30) * 60))} min`}
              </div>
            </div>
          )}

          {/* Rider info (shown to passenger) */}
          {role === "passenger" && riderName && (
            <div className="flex items-center gap-3 p-3 mt-3 border rounded-2xl bg-slate-50 border-slate-200">
              <div className="flex items-center justify-center rounded-full w-9 h-9 bg-linear-to-br from-blue-600 to-purple-600">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900">{riderName}</p>
                <p className="text-xs text-slate-500">{vehicleType}{vehiclePlate ? ` · ${vehiclePlate}` : ""}</p>
              </div>
              {riderPhone && (
                <a
                  href={`tel:${riderPhone}`}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white rounded-xl bg-linear-to-r from-emerald-500 to-teal-500"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
            </div>
          )}

          {/* Passenger info (shown to rider) */}
          {role === "rider" && (
            <div className="flex items-center gap-3 p-3 mt-3 border rounded-2xl bg-slate-50 border-slate-200">
              <div className="flex items-center justify-center rounded-full w-9 h-9 bg-linear-to-br from-emerald-500 to-teal-500">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900">Passenger</p>
                <p className="text-xs text-slate-500">{otherConnected ? "Connected on map" : "Waiting to connect…"}</p>
              </div>
            </div>
          )}

          {/* ── Rider action buttons ─────────────────────────────────────── */}
          {role === "rider" && rideStatus !== "completed" && (
            <div className="flex gap-3 mt-3">
              {rideStatus === "accepted" && (
                <button
                  onClick={() => handleStatusChange("in-progress")}
                  disabled={isUpdatingStatus}
                  className="flex items-center justify-center flex-1 gap-2 py-3 text-sm font-bold text-white transition rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 disabled:opacity-60 active:scale-95"
                >
                  {isUpdatingStatus ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlayCircle className="w-4 h-4" />
                  )}
                  Start Ride
                </button>
              )}
              {rideStatus === "in-progress" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  disabled={isUpdatingStatus}
                  className="flex items-center justify-center flex-1 gap-2 py-3 text-sm font-bold text-white transition rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 disabled:opacity-60 active:scale-95"
                >
                  {isUpdatingStatus ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Flag className="w-4 h-4" />
                  )}
                  Complete Ride
                </button>
              )}
            </div>
          )}

          {/* Ride completed banner */}
          {rideStatus === "completed" && (
            <div className="flex items-center justify-center gap-2 py-3 mt-3 border rounded-2xl bg-linear-to-r from-emerald-50 to-teal-50 border-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">Ride Completed!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
