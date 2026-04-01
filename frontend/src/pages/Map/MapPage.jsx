import React, { useState, useEffect, useRef, useMemo } from "react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Navigation, MapPin, Locate, ZoomIn, ZoomOut, Car, ArrowLeft, CheckCircle } from "lucide-react";

const mapContainerStyle = {
  height: "100%",
  width: "100%",
  minHeight: "calc(100vh - 72px)",
};

export default function MapPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const booking = state?.booking || null;

  const [confirmed, setConfirmed] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [browseDestination, setBrowseDestination] = useState(null);

  const mapRef = useRef(null);
  const hasFittedMapRef = useRef(false);

  const defaultCenter = { lat: 28.6139, lng: 77.209 };

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "map-page-google-map",
    googleMapsApiKey: mapsApiKey,
  });

  useEffect(() => {
    if (!booking && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation:", err)
      );
    }
  }, [booking]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || booking || !userPosition) return;
    mapRef.current.panTo(userPosition);
    mapRef.current.setZoom(15);
  }, [isLoaded, booking, userPosition]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !booking?.pickupCoords || typeof window === "undefined" || !window.google) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(booking.pickupCoords);
    bounds.extend(booking.destCoords);
    mapRef.current.fitBounds(bounds, 80);
    hasFittedMapRef.current = true;
  }, [isLoaded, booking?.pickupCoords, booking?.destCoords]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPosition(loc);
          if (mapRef.current) {
            mapRef.current.panTo(loc);
            mapRef.current.setZoom(15);
          }
        },
        () => alert("Unable to get your location. Please enable location services.")
      );
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const randomOffset = () => (Math.random() - 0.5) * 0.05;
      const center = userPosition || defaultCenter;
      const target = { lat: center.lat + randomOffset(), lng: center.lng + randomOffset(), name: searchQuery };
      setBrowseDestination(target);
      if (mapRef.current) {
        mapRef.current.panTo({ lat: target.lat, lng: target.lng });
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("riderToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("rider");
    navigate("/", { replace: true });
  };

  const handleConfirmBooking = () => setConfirmed(true);

  const mapCenter = booking?.pickupCoords
    ? {
        lat: (booking.pickupCoords.lat + booking.destCoords.lat) / 2,
        lng: (booking.pickupCoords.lng + booking.destCoords.lng) / 2,
      }
    : userPosition || defaultCenter;

  const bookingRoutePath = useMemo(() => {
    if (!booking?.routeCoordinates?.length) return [];
    return booking.routeCoordinates
      .map((p) => {
        if (Array.isArray(p) && p.length >= 2) return { lat: p[0], lng: p[1] };
        if (p && typeof p === "object" && typeof p.lat === "number" && typeof p.lng === "number") return p;
        return null;
      })
      .filter(Boolean);
  }, [booking?.routeCoordinates]);

  const markerDot = (fillColor, scale = 7) => {
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-black text-white z-1001">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <Link to="/" className="flex items-center space-x-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="white" />
              <path d="M12 20L18 14L24 20L30 14" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 26L18 20L24 26L30 20" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-2xl font-bold tracking-tight">RIDEX</span>
          </Link>
          <nav className="flex items-center space-x-6">
            {booking ? (
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium hover:text-gray-300 transition-colors">
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <Link to="/ride-search" className="text-sm font-medium hover:text-gray-300 transition-colors">Search Rides</Link>
            )}
            <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-black bg-white rounded-lg hover:bg-gray-200 transition-colors">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 relative">
        <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 72px)" }}>
          {!mapsApiKey ? (
            <div className="flex items-center justify-center h-[calc(100vh-72px)] bg-slate-100 text-slate-600 text-sm font-semibold">
              Add VITE_GOOGLE_MAPS_API_KEY to show map.
            </div>
          ) : loadError ? (
            <div className="flex items-center justify-center h-[calc(100vh-72px)] bg-slate-100 text-red-500 text-sm font-semibold">
              Unable to load Google Maps.
            </div>
          ) : !isLoaded ? (
            <div className="flex items-center justify-center h-[calc(100vh-72px)] bg-slate-100 text-slate-500 text-sm font-semibold">
              Loading map...
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={13}
              onLoad={(map) => {
                mapRef.current = map;
                if (!booking && userPosition) {
                  map.panTo(userPosition);
                  map.setZoom(15);
                }
              }}
              onUnmount={() => {
                mapRef.current = null;
              }}
              options={{
                fullscreenControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                zoomControl: false,
              }}
            >
              {booking?.pickupCoords && (
                <>
                  <Marker
                    position={booking.pickupCoords}
                    icon={markerDot("#10b981", 7)}
                    title={booking.pickup || "Pickup"}
                  />
                  <Marker
                    position={booking.destCoords}
                    icon={markerDot("#ef4444", 7)}
                    title={booking.destination || "Destination"}
                  />
                  {bookingRoutePath.length > 0 && (
                    <Polyline
                      path={bookingRoutePath}
                      options={{
                        strokeColor: "#2563EB",
                        strokeOpacity: 0.75,
                        strokeWeight: 5,
                      }}
                    />
                  )}
                </>
              )}

              {!booking && (
                <>
                  {userPosition && (
                    <Marker
                      position={userPosition}
                      icon={markerDot("#2563eb", 8)}
                      title="Your Location"
                    />
                  )}
                  {browseDestination && (
                    <Marker
                      position={{ lat: browseDestination.lat, lng: browseDestination.lng }}
                      icon={markerDot("#ef4444", 7)}
                      title={browseDestination.name}
                    />
                  )}
                </>
              )}
            </GoogleMap>
          )}

          <div className="absolute right-4 top-4 z-1000 flex flex-col gap-2">
            <button
              onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 13) + 1)}
              className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100"
              title="Zoom In"
            >
              <ZoomIn size={20} className="text-gray-700" />
            </button>
            <button
              onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 13) - 1)}
              className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100"
              title="Zoom Out"
            >
              <ZoomOut size={20} className="text-gray-700" />
            </button>
            {!booking && (
              <button
                onClick={handleLocateMe}
                className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100"
                title="Find My Location"
              >
                <Locate size={20} className="text-gray-700" />
              </button>
            )}
          </div>

          {!booking && (
            <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 z-1000">
              <form onSubmit={handleSearchSubmit} className="p-4 bg-white shadow-lg rounded-2xl">
                <div className="flex items-center gap-3">
                  <MapPin className="shrink-0 text-gray-500" size={20} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for a destination..." className="flex-1 text-gray-800 placeholder-gray-400 outline-none" />
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-800">
                    <Navigation size={16} /><span className="hidden sm:inline">Go</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {!booking && browseDestination && (
            <div className="absolute left-4 bottom-20 z-1000 rounded-xl bg-white shadow-lg px-4 py-3 max-w-xs">
              <p className="text-sm font-semibold text-slate-800 truncate">{browseDestination.name}</p>
              <button
                onClick={() => navigate(`/ride-search?destination=${encodeURIComponent(browseDestination.name)}`)}
                className="px-3 py-1 mt-2 text-sm text-white bg-black rounded hover:bg-gray-800"
              >
                Book Ride Here
              </button>
            </div>
          )}
        </div>

        {booking && (
          <div className="lg:w-96 bg-white shadow-xl border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col z-1000">
            {confirmed ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-black mb-2">Ride Confirmed!</h2>
                <p className="text-gray-500 mb-6">Your <strong>{booking.rideType}</strong> ride with a <strong>{booking.vehicle}</strong> has been booked.</p>
                <div className="w-full p-4 bg-gray-50 rounded-xl text-left space-y-2 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Pickup</span><span className="font-medium text-right max-w-[55%]">{booking.pickup}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Destination</span><span className="font-medium text-right max-w-[55%]">{booking.destination}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Total Fare</span><span className="font-bold text-green-600 text-base">₹{booking.price}</span></div>
                </div>
                <button onClick={() => navigate("/")} className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors">Back to Home</button>
              </div>
            ) : (
              <div className="flex flex-col flex-1 p-6 overflow-y-auto">
                <h2 className="text-xl font-bold text-black mb-1">Confirm Your Ride</h2>
                <p className="text-sm text-gray-500 mb-6">Review your trip details before confirming</p>

                <div className="relative pl-8 mb-6">
                  <div className="absolute left-2.75 top-4 bottom-4 w-0.5 bg-gray-300"></div>
                  <div className="flex items-start gap-3 mb-6">
                    <div className="absolute left-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div><p className="text-xs text-gray-400 uppercase tracking-wide">Pickup</p><p className="font-semibold text-gray-800">{booking.pickup}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="absolute left-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div><p className="text-xs text-gray-400 uppercase tracking-wide">Destination</p><p className="font-semibold text-gray-800">{booking.destination}</p></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600"><Car size={16} /><span className="text-sm">Vehicle</span></div>
                    <span className="font-semibold text-sm">{booking.vehicle}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="text-sm text-gray-600">Ride Type</span>
                    <span className="font-semibold text-sm capitalize">{booking.rideType}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="text-sm text-gray-600">Distance</span>
                    <span className="font-semibold text-sm">{booking.distance} km</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="text-sm font-bold text-gray-800">Total Fare</span>
                    <span className="text-xl font-bold text-green-600">₹{booking.price}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-6">
                  <Navigation size={18} className="text-blue-600 shrink-0" />
                  <p className="text-sm text-blue-800">Estimated pickup: <strong>3–5 minutes</strong></p>
                </div>

                <div className="mt-auto space-y-3">
                  <button onClick={handleConfirmBooking} className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle size={20} /> Confirm Booking
                  </button>
                  <button onClick={() => navigate(-1)} className="w-full py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-colors">
                    Go Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!booking && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-1000">
            <div className="flex items-center justify-between max-w-4xl gap-4 mx-auto">
              <button onClick={handleLocateMe} className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                <Locate size={20} className="text-gray-700" />
                <span className="text-sm font-medium text-gray-700">Find Me</span>
              </button>
              <Link to="/ride-search" className="flex items-center justify-center flex-1 gap-2 px-6 py-3 text-white bg-black rounded-xl hover:bg-gray-800 transition-colors">
                <Navigation size={20} /><span className="font-medium">Book a Ride</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
