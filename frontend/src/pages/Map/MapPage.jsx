import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link, useNavigate } from "react-router-dom";
import { Navigation, MapPin, Locate, ZoomIn, ZoomOut } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom marker icon for destination
const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to handle map centering on user location
function LocationMarker({ position, setPosition }) {
  const map = useMap();

  const handleLocate = () => {
    map.locate();
  };

  useEffect(() => {
    map.on("locationfound", (e) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15);
    });

    map.on("locationerror", (e) => {
      console.error("Location error:", e.message);
      alert("Unable to find your location. Please enable location services.");
    });
  }, [map, setPosition]);

  return position ? (
    <Marker position={position} icon={userLocationIcon}>
      <Popup>
        <div className="text-center">
          <strong>Your Location</strong>
          <br />
          <span className="text-sm text-gray-600">
            {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
          </span>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

// Map Controls Component
function MapControls({ onLocate }) {
  const map = useMap();

  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="p-2 transition-colors bg-white rounded-lg shadow-lg hover:bg-gray-100"
        title="Zoom In"
      >
        <ZoomIn size={20} className="text-gray-700" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="p-2 transition-colors bg-white rounded-lg shadow-lg hover:bg-gray-100"
        title="Zoom Out"
      >
        <ZoomOut size={20} className="text-gray-700" />
      </button>
      <button
        onClick={onLocate}
        className="p-2 transition-colors bg-white rounded-lg shadow-lg hover:bg-gray-100"
        title="Find My Location"
      >
        <Locate size={20} className="text-gray-700" />
      </button>
    </div>
  );
}

// Component to fly map to position when it changes
function FlyToLocation({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 15);
    }
  }, [position, map]);

  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [userPosition, setUserPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [destination, setDestination] = useState(null);
  
  // Default center (you can change this to your preferred location)
  const defaultCenter = [28.6139, 77.2090]; // New Delhi, India

  // Get user's current location on page load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login", { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For demo purposes, setting a random nearby location
      // In production, you'd use a geocoding API here
      const randomOffset = () => (Math.random() - 0.5) * 0.05;
      const center = userPosition || { lat: defaultCenter[0], lng: defaultCenter[1] };
      setDestination({
        lat: center.lat + randomOffset(),
        lng: center.lng + randomOffset(),
        name: searchQuery,
      });
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enable location services.");
        }
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white z-[1001]">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl">
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="white" />
                <path
                  d="M12 20L18 14L24 20L30 14"
                  stroke="black"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 26L18 20L24 26L30 20"
                  stroke="black"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">RIDEX</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link to="/ride-search" className="text-sm font-medium transition-colors hover:text-gray-300">
              Search Rides
            </Link>
            <Link to="/my-rides" className="text-sm font-medium transition-colors hover:text-gray-300">
              My Rides
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-black transition-colors bg-white rounded-lg hover:bg-gray-200"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Search Bar Overlay */}
      <div className="absolute top-20 left-4 right-4 md:left-auto md:right-auto md:w-96 md:mx-auto z-[1000]">
        <form onSubmit={handleSearch} className="p-4 bg-white shadow-lg rounded-2xl">
          <div className="flex items-center gap-3">
            <MapPin className="flex-shrink-0 text-gray-500" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a destination..."
              className="flex-1 text-gray-800 placeholder-gray-400 outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-black rounded-lg hover:bg-gray-800"
            >
              <Navigation size={16} />
              <span className="hidden sm:inline">Go</span>
            </button>
          </div>
        </form>
      </div>

      {/* Map Container */}
      <div className="relative flex-1">
        <MapContainer
          center={userPosition ? [userPosition.lat, userPosition.lng] : defaultCenter}
          zoom={13}
          style={{ height: "100%", width: "100%", minHeight: "calc(100vh - 72px)" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <FlyToLocation position={userPosition} />
          <LocationMarker position={userPosition} setPosition={setUserPosition} />
          
          {destination && (
            <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
              <Popup>
                <div className="text-center">
                  <strong>{destination.name}</strong>
                  <br />
                  <button
                    onClick={() => navigate(`/ride-search?destination=${encodeURIComponent(destination.name)}`)}
                    className="px-3 py-1 mt-2 text-sm text-white bg-black rounded hover:bg-gray-800"
                  >
                    Book Ride Here
                  </button>
                </div>
              </Popup>
            </Marker>
          )}
          
          <MapControls onLocate={handleLocateMe} />
        </MapContainer>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-[1000]">
        <div className="flex items-center justify-between max-w-4xl gap-4 mx-auto">
          <button
            onClick={handleLocateMe}
            className="flex items-center gap-2 px-4 py-3 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
          >
            <Locate size={20} className="text-gray-700" />
            <span className="text-sm font-medium text-gray-700">Find Me</span>
          </button>
          
          <Link
            to="/ride-search"
            className="flex items-center justify-center flex-1 gap-2 px-6 py-3 text-white transition-colors bg-black rounded-xl hover:bg-gray-800"
          >
            <Navigation size={20} />
            <span className="font-medium">Book a Ride</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
