import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Car,
  ArrowRight,
  Search,
  Loader,
  CheckCircle,
  ChevronRight,
  Zap,
  Shield,
  Star,
  Sparkles,
  Clock,
  Crosshair,
  MapPin,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import io from "socket.io-client";
import Header from "../../components/common/Header";
import { ridesAPI } from "../../services/api";

// ─── Map background (outside component to avoid remount on re-render) ─────────
function MapBg({ center }) {
  return (
    <div className="fixed inset-0 -z-10">
      <MapContainer
        key={`${center[0]}-${center[1]}`}
        center={center}
        zoom={13}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapContainer>
      {/* Frosted overlay for readability */}
      <div className="absolute inset-0 bg-white/65 backdrop-blur-[2px]" />
      {/* Gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-linear-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-cyan-400 via-cyan-500 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-linear-to-br from-purple-400 via-purple-500 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" />
    </div>
  );
}

// ─── Step progress indicator ──────────────────────────────────────────────────
function Stepper({ step }) {
  const steps = ["Trip Details", "Choose Vehicle", "Confirmed"];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  done || active
                    ? "bg-linear-to-br from-blue-600 via-purple-600 to-purple-700 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white/60 text-slate-400 border border-slate-200"
                } ${active ? "ring-4 ring-blue-300/40 scale-110" : ""}`}
              >
                {done ? <CheckCircle className="w-5 h-5" /> : num}
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap ${
                  active
                    ? "text-transparent bg-linear-to-r from-blue-600 to-purple-700 bg-clip-text"
                    : done
                    ? "text-slate-500"
                    : "text-slate-300"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-16 mb-5 rounded-full transition-all duration-500 ${
                  step > num
                    ? "bg-linear-to-r from-blue-600 to-purple-700"
                    : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Vehicle meta ─────────────────────────────────────────────────────────────
const VEHICLE_META = {
  bike: { icon: "🏍️", etaMin: 2, etaMax: 4,  tag: "Fastest",  tagColor: "bg-amber-100 text-amber-700"  },
  auto: { icon: "🛺", etaMin: 3, etaMax: 6,  tag: "Budget",   tagColor: "bg-emerald-100 text-emerald-700" },
  car:  { icon: "🚗", etaMin: 4, etaMax: 8,  tag: "Popular",  tagColor: "bg-blue-100 text-blue-700"    },
  suv:  { icon: "🚙", etaMin: 5, etaMax: 10, tag: "Premium",  tagColor: "bg-violet-100 text-violet-700" },
};

// ─── Vehicle card ─────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, fare, isAvailable, isSelected, onSelect, riderCount, nearestRiders }) {
  const meta = VEHICLE_META[vehicle.id] || {};
  return (
    <button
      disabled={!isAvailable}
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 outline-none ${
        isSelected
          ? "border-transparent bg-linear-to-br from-blue-600 via-purple-600 to-purple-700 text-white shadow-2xl shadow-blue-500/30 scale-[1.01]"
          : isAvailable
          ? "border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 bg-white/80 backdrop-blur-sm"
          : "border-slate-100 bg-slate-50/60 opacity-40 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
            isSelected ? "bg-white/15" : "bg-linear-to-br from-blue-50 to-purple-50"
          }`}
        >
          {meta.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold">{vehicle.name}</span>
            {meta.tag && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : meta.tagColor
                }`}
              >
                {meta.tag}
              </span>
            )}
            {/* Rider availability badge */}
            {riderCount != null && (
              riderCount > 0 ? (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isSelected ? "bg-white/20 text-green-200" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {riderCount} rider{riderCount !== 1 ? "s" : ""} nearby
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                  No riders nearby
                </span>
              )
            )}
            {!isAvailable && riderCount == null && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                Unavailable
              </span>
            )}
          </div>
          <p className={`text-sm mt-0.5 ${
            isSelected ? "text-white/70" : "text-slate-500"
          }`}>
            Up to {vehicle.capacity} passenger{vehicle.capacity > 1 ? "s" : ""} •{" "}
            {meta.etaMin}–{meta.etaMax} min ETA
          </p>
          {/* Show nearest rider name + distance when available */}
          {isAvailable && !isSelected && nearestRiders && nearestRiders.length > 0 && nearestRiders[0].distanceKm != null && (
            <p className="text-xs text-blue-600 font-semibold mt-1">
              Nearest: {nearestRiders[0].name || "Rider"} · {nearestRiders[0].distanceKm} km away
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-extrabold">₹{fare.toFixed(0)}</div>
          <div className={`text-xs mt-0.5 ${isSelected ? "text-white/60" : "text-slate-400"}`}>
            ₹{vehicle.baseRate} base + ₹{vehicle.perKm}/km
          </div>
          {isSelected && (
            <div className="mt-1 flex items-center justify-end gap-1 text-xs font-semibold text-green-300">
              <CheckCircle className="w-3.5 h-3.5" /> Selected
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Trip summary sidebar ─────────────────────────────────────────────────────
function TripSummary({ pickup, destination, distance, vehicle, fare }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-xl shadow-blue-500/10 border border-slate-200/60 bg-white/80 backdrop-blur-sm">
      <div className="px-5 py-4 bg-linear-to-r from-blue-600 via-purple-600 to-purple-700 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-white/80" />
        <span className="text-white font-bold text-sm tracking-wide uppercase">
          Trip Summary
        </span>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex gap-3 items-stretch">
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <div className="w-0.5 flex-1 bg-slate-200 min-h-6" />
            <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
                Pickup
              </p>
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {pickup || "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">
                Destination
              </p>
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                {destination || "—"}
              </p>
            </div>
          </div>
        </div>

        {distance && (
          <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-3">
            <span className="text-slate-500">Distance</span>
            <span className="font-bold text-slate-800">{distance} km</span>
          </div>
        )}

        {vehicle && (
          <>
            <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-3">
              <span className="text-slate-500">Vehicle</span>
              <span className="font-bold text-slate-800">{vehicle.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Est. fare</span>
              <span className="font-extrabold text-transparent bg-linear-to-r from-blue-600 to-purple-700 bg-clip-text text-lg">
                ₹{fare?.toFixed(0)}
              </span>
            </div>
          </>
        )}

        <div className="border-t border-slate-100 pt-3 grid grid-cols-3 gap-2">
          {[["🔒", "Secure"], ["⭐", "4.9 rated"], ["⚡", "Fast match"]].map(
            ([icon, label]) => (
              <div key={label} className="flex flex-col items-center text-center gap-0.5">
                <span className="text-base">{icon}</span>
                <span className="text-[10px] text-slate-500 font-medium">{label}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Detail row (success page) ────────────────────────────────────────────────
function Detail({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-3">
      <span className="text-slate-500">{label}</span>
      <span
        className={`font-bold ${
          highlight
            ? "text-transparent bg-linear-to-r from-blue-600 to-purple-700 bg-clip-text text-base"
            : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RideSearch() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [rideType, setRideType] = useState("personal");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India default
  const [searchResults, setSearchResults] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [booked, setBooked] = useState(null);

  // ── Socket: listen for ride-accepted after booking ───────────────────────
  useEffect(() => {
    if (step !== 3 || !booked?.rideId) return;

    const userRaw = localStorage.getItem("user");
    const userData = userRaw ? JSON.parse(userRaw) : null;
    const userId = userData?.id;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    const socketUrl = API_BASE_URL.replace("/api", "");

    // Guard so socket event and polling don't both trigger navigate
    let didNavigate = false;

    const goToTracking = (rideId, riderName, riderPhone, vehicleType, vehiclePlate) => {
      if (didNavigate) return;
      didNavigate = true;
      navigate("/tracking", {
        state: {
          rideId,
          role:         "passenger",
          riderName:    riderName    || "",
          riderPhone:   riderPhone   || "",
          vehicleType:  vehicleType  || "",
          vehiclePlate: vehiclePlate || "",
          pickup,
          destination,
          pickupCoords,
          destCoords,
        },
      });
    };

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("✅ Passenger socket connected, waiting for ride acceptance…");
      if (userId) socket.emit("passenger-join", userId);
    });

    // Real-time path: rider accepts → backend emits ride-accepted → navigate
    socket.on("ride-accepted", (data) => {
      console.log("🚗 Ride accepted (socket):", data);
      socket.disconnect();
      goToTracking(
        data.rideId || booked.rideId,
        data.riderName,
        data.riderPhone,
        data.vehicleType,
        data.vehiclePlate
      );
    });

    // Fallback polling: check DB every 5 s in case socket event was missed
    const pollInterval = setInterval(async () => {
      if (didNavigate) { clearInterval(pollInterval); return; }
      try {
        const result = await ridesAPI.getRideDetails(booked.rideId);
        const ride = result?.ride;
        if (ride && (ride.status === "accepted" || ride.status === "in-progress")) {
          clearInterval(pollInterval);
          socket.disconnect();
          goToTracking(
            booked.rideId,
            ride.rider_name,
            ride.rider_phone,
            ride.vehicle_type,
            ride.vehicle_number
          );
        }
      } catch (e) {
        console.warn("Ride status poll failed:", e.message);
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, [step, booked?.rideId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!navigator.geolocation) { setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setMapCenter([lat, lon]);
        setPickupCoords({ lat, lng: lon });
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
          const res = await fetch(`${API_BASE_URL}/geocoding/reverse?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.place?.address || {};
            const parts = [];
            if (addr.road) parts.push(addr.road);
            if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
            if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
            if (parts.length > 0) setPickup(parts.join(", "));
            else if (data.place?.display_name) setPickup(data.place.display_name);
          }
        } catch {
          setPickup(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setMapCenter([lat, lon]);
        setPickupCoords({ lat, lng: lon });
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
          const res = await fetch(`${API_BASE_URL}/geocoding/reverse?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.place?.address || {};
            const parts = [];
            if (addr.road) parts.push(addr.road);
            if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
            if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
            if (parts.length > 0) setPickup(parts.join(", "));
            else if (data.place?.display_name) setPickup(data.place.display_name);
          }
        } catch { /* ignore */ }
        setLocationLoading(false);
      },
      () => setLocationLoading(false)
    );
  };

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showPickupSugg, setShowPickupSugg] = useState(false);
  const [showDestSugg, setShowDestSugg] = useState(false);
  const [pickupSearching, setPickupSearching] = useState(false);
  const [destSearching, setDestSearching] = useState(false);
  const pickupRef = useRef(null);
  const destRef = useRef(null);

  // ── Suggestion search via backend geocoding API ──────────────────────
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) return [];
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
    try {
      const res = await fetch(
        `${API_BASE_URL}/geocoding/geocode?address=${encodeURIComponent(query)}&limit=5`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || (data.success && data.location
        ? [{ name: data.location.display_name, shortName: data.location.display_name.split(",").slice(0,2).join(",").trim(), lat: data.location.lat, lon: data.location.lon }]
        : []);
    } catch { return []; }
  }, []);

  // Debounced pickup suggestions
  useEffect(() => {
    if (!pickup || pickup.trim().length < 2) { setPickupSuggestions([]); setShowPickupSugg(false); return; }
    setPickupSearching(true);
    const timer = setTimeout(async () => {
      const results = await fetchSuggestions(pickup);
      setPickupSuggestions(results);
      setShowPickupSugg(results.length > 0);
      setPickupSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [pickup, fetchSuggestions]);

  // Debounced destination suggestions
  useEffect(() => {
    if (!destination || destination.trim().length < 2) { setDestSuggestions([]); setShowDestSugg(false); return; }
    setDestSearching(true);
    const timer = setTimeout(async () => {
      const results = await fetchSuggestions(destination);
      setDestSuggestions(results);
      setShowDestSugg(results.length > 0);
      setDestSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [destination, fetchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (pickupRef.current && !pickupRef.current.contains(e.target)) setShowPickupSugg(false);
      if (destRef.current && !destRef.current.contains(e.target)) setShowDestSugg(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const vehicleOptions = [
    { id: "bike", name: "Bike", baseRate: 8,  perKm: 5,  capacity: 1 },
    { id: "auto", name: "Auto", baseRate: 15, perKm: 10, capacity: 3 },
    { id: "car",  name: "Car",  baseRate: 25, perKm: 15, capacity: 4 },
    { id: "suv",  name: "SUV",  baseRate: 40, perKm: 20, capacity: 6 },
  ];

  const selectedVehicleObj = vehicleOptions.find((v) => v.id === selectedVehicle);
  const selectedFare =
    selectedVehicleObj && searchResults
      ? selectedVehicleObj.baseRate +
        selectedVehicleObj.perKm * parseFloat(searchResults.distance)
      : null;

  const handleSearch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login as a passenger first");
      navigate("/login");
      return;
    }
    setIsLoading(true);
    setSearchResults(null);
    setSelectedVehicle(null);
    try {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
      const [pickupRes, destRes] = await Promise.all([
        fetch(`${API_BASE_URL}/geocoding/geocode?address=${encodeURIComponent(pickup)}`),
        fetch(`${API_BASE_URL}/geocoding/geocode?address=${encodeURIComponent(destination)}`),
      ]);
      if (!pickupRes.ok || !destRes.ok) throw new Error("Geocoding request failed");
      const [pickupResult, destResult] = await Promise.all([
        pickupRes.json(),
        destRes.json(),
      ]);
      if (!pickupResult.success) throw new Error("Could not find pickup location");
      if (!destResult.success) throw new Error("Could not find destination");
      setPickupCoords({ lat: pickupResult.location.lat, lng: pickupResult.location.lon });
      setDestCoords({ lat: destResult.location.lat, lng: destResult.location.lon });
      const pLat = pickupResult.location.lat;
      const pLon = pickupResult.location.lon;
      const R = 6371;
      const dLat = ((destResult.location.lat - pLat) * Math.PI) / 180;
      const dLon = ((destResult.location.lon - pLon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((pLat * Math.PI) / 180) *
          Math.cos((destResult.location.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      // Pass geocoded pickup coords so backend can filter riders within 2 km
      const availability = await ridesAPI.checkAvailability(pickup, destination, distance.toFixed(2), pLat, pLon);
      setSearchResults({
        distance: distance.toFixed(2),
        availableVehicles: availability.availableVehicles || [],
        vehicleAvailability: availability.vehicleAvailability || {},
        sharedAvailable: availability.sharedAvailable,
        personalAvailable: availability.personalAvailable,
        totalNearbyRiders: availability.totalNearbyRiders || 0,
        radiusKm: availability.radiusKm || 2,
        hasPickupCoords: availability.hasPickupCoords || false,
      });
      setStep(2);
    } catch (error) {
      alert("Search error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookRide = async () => {
    if (!selectedVehicle) return;
    try {
      setIsLoading(true);
      const result = await ridesAPI.bookRide({
        pickup,
        destination,
        distance: parseFloat(searchResults.distance),
        fare: selectedFare.toFixed(2),
        rideType,
        vehicleType: selectedVehicle,
        pickupCoordinates: pickupCoords,
      });
      if (result.success) {
        setBooked({
          rideId: result.rideId,
          fare: selectedFare,
          vehicleName: selectedVehicleObj.name,
          nearbyRiders: result.nearbyRiders,
        });
        setStep(3);
      }
    } catch (error) {
      alert("Failed to book ride: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setPickup(""); setDestination("");
    setSearchResults(null); setSelectedVehicle(null);
    setPickupCoords(null); setDestCoords(null); setBooked(null);
  };

  // Manual ride-status check (fallback for passenger)
  const handleCheckStatus = async () => {
    if (!booked?.rideId) return;
    setIsLoading(true);
    try {
      const result = await ridesAPI.getRideDetails(booked.rideId);
      const ride = result?.ride;
      if (ride && (ride.status === "accepted" || ride.status === "in-progress")) {
        navigate("/tracking", {
          state: {
            rideId:       booked.rideId,
            role:         "passenger",
            riderName:    ride.rider_name    || "",
            riderPhone:   ride.rider_phone   || "",
            vehicleType:  ride.vehicle_type  || "",
            vehiclePlate: ride.vehicle_number || "",
            pickup,
            destination,
            pickupCoords,
            destCoords,
          },
        });
      } else {
        alert(`Ride status: ${ride?.status || "unknown"} — still waiting for a rider.`);
      }
    } catch {
      alert("Could not check ride status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (step === 3 && booked) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <MapBg center={mapCenter} />
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20 mt-16">
          <div className="max-w-md w-full rounded-3xl shadow-2xl shadow-blue-500/20 overflow-hidden border border-slate-200/60 bg-white/80 backdrop-blur-sm">
            <div className="bg-linear-to-br from-blue-600 via-purple-600 to-purple-700 px-8 py-12 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-white/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Ride Requested!</h2>
              <p className="text-white/70 mt-1 text-sm">
                Your request has been sent to nearby riders
              </p>
            </div>
            <div className="px-8 py-6 space-y-4">
              <Detail label="Ride ID"        value={`#${booked.rideId}`} />
              <Detail label="Vehicle"         value={booked.vehicleName} />
              <Detail label="Fare"            value={`₹${booked.fare.toFixed(0)}`} highlight />
              <Detail label="Riders notified" value={`${booked.nearbyRiders} rider(s)`} />

              {/* Live waiting indicator – auto-navigates when rider accepts */}
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
                <Loader className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-800">Waiting for a rider to accept…</p>
                  <p className="text-xs text-blue-500 mt-0.5">You'll be taken to the live map automatically.</p>
                </div>
                <button
                  onClick={handleCheckStatus}
                  disabled={isLoading}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white disabled:opacity-60 hover:bg-blue-700 transition"
                >
                  {isLoading ? "…" : "Check"}
                </button>
              </div>
            </div>
            <div className="px-8 pb-8 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
              >
                New Ride
              </button>
              <Link
                to="/"
                className="flex-1 py-3 rounded-xl bg-linear-to-r from-blue-600 via-purple-600 to-purple-700 text-white font-bold text-sm flex items-center justify-center hover:opacity-90 transition shadow-lg shadow-blue-500/30"
              >
                Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen">
      <MapBg center={mapCenter} />
      <Header />

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-16">
        {/* Page title */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 via-purple-600 to-purple-700 text-white rounded-full text-sm font-semibold shadow-xl shadow-blue-500/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Book your ride in seconds</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Where would you like to{" "}
            <span className="text-transparent bg-linear-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text">
              go?
            </span>
          </h1>
        </div>

        <Stepper step={step} />

        <div className="flex gap-8 items-start">
          {/* ── Left column ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Step 1 — Trip Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-slate-200/60">
              <div className="px-6 py-4 border-b border-slate-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-linear-to-br from-blue-600 to-purple-700 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-500/30">
                    1
                  </span>
                  <h2 className="font-bold text-slate-900">Trip Details</h2>
                </div>
                {step > 1 && (
                  <button
                    onClick={() => { setStep(1); setSearchResults(null); setSelectedVehicle(null); }}
                    className="text-xs font-semibold text-transparent bg-linear-to-r from-blue-600 to-purple-700 bg-clip-text hover:opacity-70 transition"
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="p-6 space-y-5">
                {/* Ride type */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "personal", icon: <Car className="w-5 h-5" />,   label: "Personal", sub: "Private ride"   },
                    { id: "sharing",  icon: <Users className="w-5 h-5" />, label: "Shared",   sub: "Save up to 60%" },
                  ].map(({ id, icon, label, sub }) => (
                    <button
                      key={id}
                      onClick={() => setRideType(id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        rideType === id
                          ? "border-transparent bg-linear-to-br from-blue-600 via-purple-600 to-purple-700 text-white shadow-lg shadow-blue-500/30"
                          : "border-slate-200 hover:border-blue-300 text-slate-700 bg-white/60"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${rideType === id ? "bg-white/20" : "bg-slate-100"}`}>
                        {icon}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">{label}</p>
                        <p className={`text-xs ${rideType === id ? "text-white/70" : "text-slate-400"}`}>
                          {sub}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                  {/* Pickup */}
                  <div className="relative" ref={pickupRef}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 pointer-events-none" />
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      onFocus={() => pickupSuggestions.length > 0 && setShowPickupSugg(true)}
                      placeholder={locationLoading ? "Detecting your location..." : "Pickup location"}
                      required
                      className="w-full py-4 pl-10 pr-10 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm transition bg-white/70 text-slate-800 placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      title="Use my current location"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-blue-50 transition text-slate-400 hover:text-blue-600"
                    >
                      {locationLoading || pickupSearching ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Crosshair className="w-4 h-4" />
                      )}
                    </button>
                    {/* Pickup suggestion dropdown */}
                    {showPickupSugg && pickupSuggestions.length > 0 && (
                      <ul className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl shadow-blue-500/15 border border-slate-200 overflow-hidden">
                        {pickupSuggestions.map((s, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setPickup(s.shortName || s.name);
                                setShowPickupSugg(false);
                                if (s.lat && s.lon) setPickupCoords({ lat: s.lat, lng: s.lon });
                              }}
                              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition text-left group"
                            >
                              <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0 group-hover:text-blue-700" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{s.shortName || s.name.split(",")[0]}</p>
                                <p className="text-xs text-slate-400 truncate">{s.name}</p>
                              </div>
                            </button>
                            {i < pickupSuggestions.length - 1 && <div className="h-px bg-slate-100 mx-4" />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Swap divider */}
                  <div className="relative flex items-center">
                    <div className="flex-1 border-t border-dashed border-slate-200" />
                    <div className="mx-3 w-8 h-8 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-slate-400 text-sm font-bold select-none">
                      ↕
                    </div>
                    <div className="flex-1 border-t border-dashed border-slate-200" />
                  </div>

                  {/* Destination */}
                  <div className="relative" ref={destRef}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200 pointer-events-none" />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      onFocus={() => destSuggestions.length > 0 && setShowDestSugg(true)}
                      placeholder="Destination"
                      required
                      className="w-full py-4 pl-10 pr-10 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm transition bg-white/70 text-slate-800 placeholder-slate-400"
                    />
                    {destSearching && (
                      <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin pointer-events-none" />
                    )}
                    {/* Destination suggestion dropdown */}
                    {showDestSugg && destSuggestions.length > 0 && (
                      <ul className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl shadow-blue-500/15 border border-slate-200 overflow-hidden">
                        {destSuggestions.map((s, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setDestination(s.shortName || s.name);
                                setShowDestSugg(false);
                                if (s.lat && s.lon) setDestCoords({ lat: s.lat, lng: s.lon });
                              }}
                              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition text-left group"
                            >
                              <MapPin className="w-4 h-4 text-red-400 mt-0.5 shrink-0 group-hover:text-red-600" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{s.shortName || s.name.split(",")[0]}</p>
                                <p className="text-xs text-slate-400 truncate">{s.name}</p>
                              </div>
                            </button>
                            {i < destSuggestions.length - 1 && <div className="h-px bg-slate-100 mx-4" />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Passengers (shared only) */}
                  {rideType === "sharing" && (
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={passengers}
                        onChange={(e) => setPassengers(Number(e.target.value))}
                        className="w-full py-4 pl-10 pr-4 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:outline-none text-sm bg-white/70 appearance-none transition"
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n} Passenger{n > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-linear-to-r from-blue-600 via-purple-600 to-purple-700 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm"
                  >
                    {isLoading ? (
                      <><Loader className="w-5 h-5 animate-spin" /> Searching...</>
                    ) : (
                      <><Search className="w-5 h-5" /> Search Rides <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Step 2 — Vehicle selection */}
            {searchResults && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-500/10 border border-slate-200/60">
                <div className="px-6 py-4 border-b border-slate-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-linear-to-br from-blue-600 to-purple-700 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-500/30">
                      2
                    </span>
                    <h2 className="font-bold text-slate-900">Choose Your Vehicle</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                      {searchResults.distance} km
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${searchResults.personalAvailable ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {searchResults.hasPickupCoords
                        ? `${searchResults.totalNearbyRiders} rider${searchResults.totalNearbyRiders !== 1 ? 's' : ''} within ${searchResults.radiusKm}km`
                        : searchResults.personalAvailable ? "Riders online" : "No riders online"}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {vehicleOptions.map((vehicle) => {
                    // All vehicles are always selectable — isAvailable only gates
                    // the book button (via personalAvailable), not selection itself
                    const vData = searchResults.vehicleAvailability?.[vehicle.id];
                    // If we have per-vehicle data from nearby search, use it;
                    // otherwise fall back to true so selection is never blocked
                    const hasNearbyData = searchResults.hasPickupCoords && vData != null;
                    const isAvailable = hasNearbyData ? vData.count > 0 : true;
                    const riderCount = hasNearbyData ? vData.count : null;
                    const nearestRiders = vData?.riders || [];
                    const fare = vehicle.baseRate + vehicle.perKm * parseFloat(searchResults.distance);
                    return (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        fare={fare}
                        isAvailable={isAvailable}
                        isSelected={selectedVehicle === vehicle.id}
                        onSelect={() => isAvailable && setSelectedVehicle(vehicle.id)}
                        riderCount={riderCount}
                        nearestRiders={nearestRiders}
                      />
                    );
                  })}
                </div>

                  {/* Warn when no riders are currently online */}
                  {!searchResults.personalAvailable && (
                    <div className="mx-6 mb-2 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
                      <span>⚠️</span> No riders are online right now. You can still book — a rider will be notified when they come online.
                    </div>
                  )}

                <div className="px-6 pb-6">
                  <button
                    onClick={handleBookRide}
                    disabled={!selectedVehicle || isLoading}
                    className="w-full py-4 bg-linear-to-r from-blue-600 via-purple-600 to-purple-700 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-base"
                  >
                    {isLoading ? (
                      <><Loader className="w-5 h-5 animate-spin" /> Booking...</>
                    ) : selectedVehicle ? (
                      <>
                        <Car className="w-5 h-5" />
                        Book {selectedVehicleObj?.name} · ₹{selectedFare?.toFixed(0)}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      "Select a Vehicle to Continue"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right sidebar (desktop) ── */}
          <div className="w-72 shrink-0 hidden lg:block space-y-5">
            <TripSummary
              pickup={pickup}
              destination={destination}
              distance={searchResults?.distance}
              vehicle={selectedVehicleObj}
              fare={selectedFare}
            />

            {/* Why RIDEX */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl shadow-blue-500/10 p-5 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Why RIDEX
              </p>
              {[
                { icon: <Zap className="w-4 h-4 text-amber-500" />,    label: "2-min avg pickup", sub: "Fastest in the city" },
                { icon: <Shield className="w-4 h-4 text-blue-500" />,  label: "Safety first",     sub: "Verified drivers"   },
                { icon: <Star className="w-4 h-4 text-violet-500" />,  label: "4.9★ rated",       sub: "10k+ happy rides"   },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center shrink-0 border border-slate-100">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile stats footer */}
        <div className="mt-8 grid grid-cols-3 gap-3 lg:hidden">
          {[["500+", "Drivers"], ["4.9★", "Rating"], ["2 min", "Avg pickup"]].map(
            ([val, lbl]) => (
              <div
                key={lbl}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center border border-slate-200/60 shadow-lg shadow-blue-500/10"
              >
                <p className="text-xl font-extrabold text-transparent bg-linear-to-r from-blue-600 to-purple-700 bg-clip-text">
                  {val}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{lbl}</p>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
