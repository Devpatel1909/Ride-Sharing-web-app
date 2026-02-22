import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Navigation, MapPin, Locate, ZoomIn, ZoomOut, Car, ArrowLeft, CheckCircle } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Blue marker — user location
const userLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// Green marker — pickup
const pickupMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// Red marker — destination
const destMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// Auto-fit map to show both markers
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) map.fitBounds(bounds, { padding: [80, 80] });
  }, [bounds, map]);
  return null;
}

// Location marker for browser mode
function LocationMarker({ position, setPosition }) {
  const map = useMap();
  useEffect(() => {
    map.on("locationfound", (e) => { setPosition(e.latlng); map.flyTo(e.latlng, 15); });
    map.on("locationerror", (e) => console.error("Location error:", e.message));
  }, [map, setPosition]);
  return position ? (
    <Marker position={position} icon={userLocationIcon}>
      <Popup><strong>Your Location</strong></Popup>
    </Marker>
  ) : null;
}

// Map zoom + locate controls
function MapControls({ onLocate }) {
  const map = useMap();
  return (
    <div className="absolute right-4 top-4 z-1000 flex flex-col gap-2">
      <button onClick={() => map.zoomIn()} className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100" title="Zoom In">
        <ZoomIn size={20} className="text-gray-700" />
      </button>
      <button onClick={() => map.zoomOut()} className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100" title="Zoom Out">
        <ZoomOut size={20} className="text-gray-700" />
      </button>
      {onLocate && (
        <button onClick={onLocate} className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100" title="Find My Location">
          <Locate size={20} className="text-gray-700" />
        </button>
      )}
    </div>
  );
}

// Fly to position
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 15);
  }, [position, map]);
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const booking = state?.booking || null;

  // Booking-mode
  const [confirmed, setConfirmed] = useState(false);

  // Browser-mode
  const [userPosition, setUserPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [browseDestination, setBrowseDestination] = useState(null);
  const defaultCenter = [28.6139, 77.209];

  useEffect(() => {
    if (!booking && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geolocation:", err)
      );
    }
  }, [booking]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert("Unable to get your location. Please enable location services.")
      );
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const randomOffset = () => (Math.random() - 0.5) * 0.05;
      const center = userPosition || { lat: defaultCenter[0], lng: defaultCenter[1] };
      setBrowseDestination({ lat: center.lat + randomOffset(), lng: center.lng + randomOffset(), name: searchQuery });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("riderToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rider");
    navigate("/", { replace: true });
  };

  const handleConfirmBooking = () => setConfirmed(true);

  // Map center & bounds
  const mapCenter = booking?.pickupCoords
    ? [(booking.pickupCoords.lat + booking.destCoords.lat) / 2, (booking.pickupCoords.lng + booking.destCoords.lng) / 2]
    : userPosition ? [userPosition.lat, userPosition.lng] : defaultCenter;

  const mapBounds = booking?.pickupCoords
    ? [[booking.pickupCoords.lat, booking.pickupCoords.lng], [booking.destCoords.lat, booking.destCoords.lng]]
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 72px)" }}>
          <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%", minHeight: "calc(100vh - 72px)" }} className="z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Booking mode: route + markers */}
            {booking?.pickupCoords && (
              <>
                <FitBounds bounds={mapBounds} />
                <Marker position={[booking.pickupCoords.lat, booking.pickupCoords.lng]} icon={pickupMarkerIcon}>
                  <Popup><div className="text-center"><strong className="text-green-700">🟢 Pickup</strong><br /><span className="text-sm">{booking.pickup}</span></div></Popup>
                </Marker>
                <Marker position={[booking.destCoords.lat, booking.destCoords.lng]} icon={destMarkerIcon}>
                  <Popup><div className="text-center"><strong className="text-red-700">🔴 Destination</strong><br /><span className="text-sm">{booking.destination}</span></div></Popup>
                </Marker>
                {booking.routeCoordinates?.length > 0 && (
                  <Polyline positions={booking.routeCoordinates} color="#2563EB" weight={5} opacity={0.75} />
                )}
              </>
            )}

            {/* Browser mode: user position + search destination */}
            {!booking && (
              <>
                <FlyToLocation position={userPosition} />
                <LocationMarker position={userPosition} setPosition={setUserPosition} />
                {browseDestination && (
                  <Marker position={[browseDestination.lat, browseDestination.lng]} icon={destMarkerIcon}>
                    <Popup>
                      <div className="text-center">
                        <strong>{browseDestination.name}</strong><br />
                        <button onClick={() => navigate(`/ride-search?destination=${encodeURIComponent(browseDestination.name)}`)} className="px-3 py-1 mt-2 text-sm text-white bg-black rounded hover:bg-gray-800">Book Ride Here</button>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </>
            )}

            <MapControls onLocate={!booking ? handleLocateMe : null} />
          </MapContainer>

          {/* Search bar — browser mode only */}
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
        </div>

        {/* Booking Summary Panel */}
        {booking && (
          <div className="lg:w-96 bg-white shadow-xl border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col z-1000">
            {confirmed ? (
              /* Success screen */
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
              /* Summary */
              <div className="flex flex-col flex-1 p-6 overflow-y-auto">
                <h2 className="text-xl font-bold text-black mb-1">Confirm Your Ride</h2>
                <p className="text-sm text-gray-500 mb-6">Review your trip details before confirming</p>

                {/* Route visual */}
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

                {/* Trip details */}
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

                {/* ETA */}
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

        {/* Bottom bar — browser mode only */}
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
