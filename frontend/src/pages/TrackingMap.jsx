import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
} from "lucide-react";
import Header from "../components/common/Header";
import { riderAPI } from "../services/api";

// ── Leaflet icon fix ──────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ── Inject pulse-ring CSS once ────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.querySelector("#trk-pulse-style")) {
  const s = document.createElement("style");
  s.id = "trk-pulse-style";
  s.innerHTML = `
    @keyframes trkPulse { 0%{transform:scale(.85);opacity:.9} 70%{transform:scale(2.1);opacity:0} 100%{transform:scale(.85);opacity:0} }
    .trk-pulse::after { content:''; position:absolute; inset:0; border-radius:50%;
      animation:trkPulse 1.8s ease-out infinite; }
    .trk-pulse-blue::after  { background:rgba(37,99,235,.45); }
    .trk-pulse-green::after { background:rgba(5,150,105,.45); }
  `;
  document.head.appendChild(s);
}

const riderIcon = new L.DivIcon({
  html: `<div class="trk-pulse trk-pulse-blue" style="
    position:relative;
    background:linear-gradient(135deg,#2563eb,#7c3aed);
    width:42px;height:42px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:3px solid #fff;
    box-shadow:0 4px 16px rgba(37,99,235,.6);
    display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);font-size:20px;line-height:1;">🚗</span>
  </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -44],
  className: "",
});

const passengerIcon = new L.DivIcon({
  html: `<div class="trk-pulse trk-pulse-green" style="
    position:relative;
    background:linear-gradient(135deg,#059669,#10b981);
    width:38px;height:38px;border-radius:50%;
    border:3px solid #fff;
    box-shadow:0 4px 16px rgba(5,150,105,.6);
    display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;">
    👤
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -22],
  className: "",
});

const pickupPinIcon = new L.DivIcon({
  html: `<div style="
    background:#10b981;
    width:18px;height:18px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:2px solid #fff;
    box-shadow:0 2px 8px rgba(16,185,129,.5);">
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -20],
  className: "",
});

const destPinIcon = new L.DivIcon({
  html: `<div style="
    background:#ef4444;
    width:18px;height:18px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:2px solid #fff;
    box-shadow:0 2px 8px rgba(239,68,68,.5);">
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -20],
  className: "",
});

// Auto-fit/pan map when locations change
function LiveMapController({ riderLoc, passengerLoc, pickupCoords, destCoords }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    const pts = [riderLoc, passengerLoc, pickupCoords, destCoords]
      .filter(Boolean)
      .map((p) => [p.lat, p.lng]);

    if (pts.length >= 2) {
      map.fitBounds(pts, { padding: [70, 70], maxZoom: 16 });
      fitted.current = true;
    } else if (!fitted.current && pts.length === 1) {
      map.setView(pts[0], 15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderLoc?.lat, riderLoc?.lng, passengerLoc?.lat, passengerLoc?.lng]);

  return null;
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
  const [routeCoords, setRouteCoords] = useState([]);       // [[lat,lng],...] road path
  const [mapCenter] = useState(
    pickupCoords ? [pickupCoords.lat, pickupCoords.lng] : [20.5937, 78.9629]
  );

  const socketRef = useRef(null);
  const gpsIntervalRef = useRef(null);

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

  // ── Live distance between rider & passenger (Haversine) ──────────────────
  useEffect(() => {
    if (!riderLoc || !passengerLoc) { setLiveDistance(null); return; }
    const R = 6371;
    const dLat = ((passengerLoc.lat - riderLoc.lat) * Math.PI) / 180;
    const dLon = ((passengerLoc.lng - riderLoc.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((riderLoc.lat * Math.PI) / 180) *
        Math.cos((passengerLoc.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    setLiveDistance(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, [riderLoc?.lat, riderLoc?.lng, passengerLoc?.lat, passengerLoc?.lng]); // eslint-disable-line

  // ── Fetch real road route (OSRM) when rider or other party location updates ─
  const lastRouteFetch = useRef({ rLat: null, rLng: null });

  useEffect(() => {
    if (!riderLoc) return;

    // Choose destination: passenger location while going to pick up, dest when in-progress
    const target = rideStatus === "in-progress"
      ? (destCoords || passengerLoc)
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
          // OSRM returns [lon, lat] — Leaflet needs [lat, lon]
          setRouteCoords(data.route.coordinates.map(([lon, lat]) => [lat, lon]));
        }
      })
      .catch(() => {}); // Silently fall back to straight line
  }, [riderLoc?.lat, riderLoc?.lng, passengerLoc?.lat, passengerLoc?.lng, rideStatus]); // eslint-disable-line

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
    accepted:    "Rider on the way",
    "in-progress": "Ride in progress",
    completed:   "Ride completed",
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
      <div className="fixed top-16 left-0 right-0 z-40 px-4 py-3 border-b shadow-md bg-white/95 backdrop-blur-sm border-slate-200">
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

          {/* Right: connection status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
            <span className="text-xs font-semibold text-slate-500">
              {socketConnected ? "Live" : "Connecting…"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 mt-28">
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: "calc(100vh - 7rem)", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LiveMapController
            riderLoc={riderLoc}
            passengerLoc={passengerLoc}
            pickupCoords={pickupCoords}
            destCoords={destCoords}
          />

          {/* ── Pickup pin ───────────────────────────────────────── */}
          {pickupCoords && (
            <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupPinIcon}>
              <Popup>
                <div className="text-center py-1">
                  <span className="font-bold text-emerald-700">📍 Pickup</span>
                  {pickup && <p className="text-xs text-slate-500 mt-0.5 max-w-40">{pickup}</p>}
                </div>
              </Popup>
            </Marker>
          )}

          {/* ── Destination pin ──────────────────────────────────── */}
          {destCoords && (
            <Marker position={[destCoords.lat, destCoords.lng]} icon={destPinIcon}>
              <Popup>
                <div className="text-center py-1">
                  <span className="font-bold text-red-600">🏁 Destination</span>
                  {destination && <p className="text-xs text-slate-500 mt-0.5 max-w-40">{destination}</p>}
                </div>
              </Popup>
            </Marker>
          )}

          {/* ── Rider marker ─────────────────────────────────────── */}
          {riderLoc && (
            <Marker position={[riderLoc.lat, riderLoc.lng]} icon={riderIcon}>
              <Popup>
                <div className="text-center py-1">
                  <span className="font-bold text-blue-700">🚗 {role === "rider" ? "You (Rider)" : (riderName || "Rider")}</span>
                  {vehicleType && <p className="text-xs text-slate-500 mt-1">{vehicleType}{vehiclePlate ? ` · ${vehiclePlate}` : ""}</p>}
                </div>
              </Popup>
            </Marker>
          )}

          {/* ── Passenger marker ─────────────────────────────────── */}
          {passengerLoc && (
            <Marker position={[passengerLoc.lat, passengerLoc.lng]} icon={passengerIcon}>
              <Popup>
                <div className="text-center py-1">
                  <span className="font-bold text-emerald-700">👤 {role === "passenger" ? "You" : "Passenger"}</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* ── Road route (OSRM) — rider → passenger/destination ── */}
          {routeCoords.length > 1 ? (
            <>
              {/* White glow under route */}
              <Polyline
                positions={routeCoords}
                color="#ffffff"
                weight={8}
                opacity={0.55}
              />
              {/* Solid gradient-like route */}
              <Polyline
                positions={routeCoords}
                color="#4f46e5"
                weight={5}
                opacity={0.88}
              />
            </>
          ) : (
            /* Fallback straight dashed line when OSRM not yet loaded */
            riderLoc && passengerLoc && (
              <>
                <Polyline
                  positions={[[riderLoc.lat, riderLoc.lng], [passengerLoc.lat, passengerLoc.lng]]}
                  color="#ffffff"
                  weight={6}
                  opacity={0.4}
                />
                <Polyline
                  positions={[[riderLoc.lat, riderLoc.lng], [passengerLoc.lat, passengerLoc.lng]]}
                  color="#4f46e5"
                  weight={3}
                  opacity={0.7}
                  dashArray="10, 8"
                />
              </>
            )
          )}

          {/* ── Faint pickup → destination guide line ────────────── */}
          {pickupCoords && destCoords && (
            <Polyline
              positions={[
                [pickupCoords.lat, pickupCoords.lng],
                [destCoords.lat, destCoords.lng],
              ]}
              color="#94a3b8"
              weight={2}
              opacity={0.3}
              dashArray="6, 10"
            />
          )}
        </MapContainer>
      </div>

      {/* ── Bottom info card ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-3 border-t shadow-2xl bg-white/95 backdrop-blur-sm border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* My location status */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-linear-to-r from-blue-50 to-purple-50 border border-blue-100">
              {myLocation ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Loader className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your location</p>
                <p className="text-sm font-semibold text-slate-800">
                  {myLocation ? `${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}` : "Acquiring GPS…"}
                </p>
              </div>
            </div>

            {/* Other party status */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-100">
              {otherLocation ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Loader className="w-5 h-5 text-emerald-500 animate-spin shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{otherLabel}'s location</p>
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

          {/* Live distance / ETA between rider and passenger */}
          {liveDistance !== null && (
            <div className="flex items-center gap-4 mt-3 px-4 py-2.5 rounded-2xl bg-linear-to-r from-violet-50 to-blue-50 border border-violet-100">
              <Navigation className="w-4 h-4 text-violet-500 shrink-0" />
              <div className="flex items-center gap-1 text-sm font-bold text-violet-700">
                {liveDistance < 1
                  ? `${Math.round(liveDistance * 1000)} m`
                  : `${liveDistance.toFixed(2)} km`}
                <span className="font-normal text-slate-400 text-xs ml-1">apart</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-blue-700 ml-auto">
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
            <div className="flex items-center gap-3 p-3 mt-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-linear-to-br from-blue-600 to-purple-600">
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
            <div className="flex items-center gap-3 p-3 mt-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-linear-to-br from-emerald-500 to-teal-500">
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
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white bg-linear-to-r from-amber-500 to-orange-500 disabled:opacity-60 transition active:scale-95"
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
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white bg-linear-to-r from-emerald-500 to-teal-500 disabled:opacity-60 transition active:scale-95"
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
            <div className="flex items-center justify-center gap-2 mt-3 py-3 rounded-2xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">Ride Completed!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
