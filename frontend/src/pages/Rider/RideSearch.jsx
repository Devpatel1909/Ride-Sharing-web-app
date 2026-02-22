import React, { useState, useMemo, useEffect } from "react";
import { MapPin, ArrowRight, Car, Bike, Truck, Users, DollarSign, Navigation, Loader } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import Header from "../../components/common/Header";
import { ridesAPI } from "../../services/api";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default marker icons in webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Green marker for pickup
const pickupMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red marker for destination
const destMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Auto-fit map to show both markers
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [bounds, map]);
  return null;
}

// Vehicle options with pricing per km
const VEHICLES = [
  {
    id: "bike",
    name: "Bike",
    icon: Bike,
    sharedRate: 8,
    personalRate: 12,
    capacity: 1,
    description: "Quick and economical"
  },
  {
    id: "auto",
    name: "Auto",
    icon: Truck,
    sharedRate: 12,
    personalRate: 18,
    capacity: 3,
    description: "Perfect for short trips"
  },
  {
    id: "car",
    name: "Car",
    icon: Car,
    sharedRate: 15,
    personalRate: 25,
    capacity: 4,
    description: "Comfortable sedan"
  },
  {
    id: "suv",
    name: "SUV",
    icon: Car,
    sharedRate: 20,
    personalRate: 35,
    capacity: 6,
    description: "Spacious and luxury"
  }
];

export default function RideSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [pickup, setPickup] = useState(location.state?.pickup || "");
  const [destination, setDestination] = useState(location.state?.drop || "");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [rideType, setRideType] = useState("shared");
  const [distance, setDistance] = useState(0);
  const [calculationDone, setCalculationDone] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  
  // New states for availability
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [sharedRideAvailable, setSharedRideAvailable] = useState(true);
  const [personalRideAvailable, setPersonalRideAvailable] = useState(true);
  const [searchResults, setSearchResults] = useState(null);

  const searchForRides = async () => {
    if (!pickup || !destination) {
      alert("Please enter both pickup and destination");
      return;
    }

    setIsCalculating(true);
    setSearchResults(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use backend geocoding API to avoid CORS issues
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
      console.log('🌍 Geocoding pickup location...');
      const pickupResponse = await fetch(
        `${API_BASE_URL}/geocoding/geocode?address=${encodeURIComponent(pickup)}`
      );

      if (!pickupResponse.ok) {
        const error = await pickupResponse.json();
        throw new Error(error.message || 'Failed to geocode pickup location');
      }
      const pickupResult = await pickupResponse.json();

      if (!pickupResult.success) {
        throw new Error('Failed to geocode pickup location');
      }

      console.log('🌍 Geocoding destination...');
      await new Promise(resolve => setTimeout(resolve, 500));

      const destResponse = await fetch(
        `${API_BASE_URL}/geocoding/geocode?address=${encodeURIComponent(destination)}`
      );

      if (!destResponse.ok) {
        const error = await destResponse.json();
        throw new Error(error.message || 'Failed to geocode destination');
      }
      const destResult = await destResponse.json();

      if (!destResult.success) {
        throw new Error('Failed to geocode destination');
      }

      const lat1 = pickupResult.location.lat;
      const lon1 = pickupResult.location.lon;
      const lat2 = destResult.location.lat;
      const lon2 = destResult.location.lon;

      // Calculate distance using Haversine formula
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const calculatedDistance = R * c;

      const dist = Math.round(calculatedDistance * 10) / 10;
      setDistance(dist);
      setPickupCoords({ lat: lat1, lng: lon1 });
      setDestCoords({ lat: lat2, lng: lon2 });

      // Get route using backend API
      try {
        console.log('🗺️ Getting route...');
        const routeResp = await fetch(
          `${API_BASE_URL}/geocoding/route?fromLat=${lat1}&fromLon=${lon1}&toLat=${lat2}&toLon=${lon2}`
        );
        
        if (routeResp.ok) {
          const routeResult = await routeResp.json();
          if (routeResult.success && routeResult.route.coordinates) {
            const coords = routeResult.route.coordinates.map(([lng, lat]) => [lat, lng]);
            setRouteCoordinates(coords);
          } else {
            setRouteCoordinates([[lat1, lon1], [lat2, lon2]]);
          }
        } else {
          setRouteCoordinates([[lat1, lon1], [lat2, lon2]]);
        }
      } catch {
        setRouteCoordinates([[lat1, lon1], [lat2, lon2]]);
      }

      // Check ride availability with backend API
      await checkRideAvailability(dist);
      setCalculationDone(true);
    } catch (error) {
      console.error("Error searching for rides:", error);
      const manualDistance = prompt("Unable to calculate distance automatically. Please enter the distance in kilometers manually:", "10");
      if (manualDistance && !isNaN(manualDistance) && parseFloat(manualDistance) > 0) {
        const dist = parseFloat(manualDistance);
        setDistance(dist);
        await checkRideAvailability(dist);
        setCalculationDone(true);
      } else {
        alert("Please enter a valid distance to continue.");
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Function to check ride availability using real API
  const checkRideAvailability = async (dist) => {
    try {
      // Call actual backend API to check availability
      const availabilityData = await ridesAPI.checkAvailability(
        pickup,
        destination,
        dist
      );

      // Update state with real availability data
      setAvailableVehicles(availabilityData.availableVehicles || []);
      setSharedRideAvailable(availabilityData.sharedAvailable || false);
      setPersonalRideAvailable(availabilityData.personalAvailable || false);

      // Set search results summary
      setSearchResults({
        totalVehicles: availabilityData.availableVehicles?.length || 0,
        sharedAvailable: availabilityData.sharedAvailable || false,
        personalAvailable: availabilityData.personalAvailable || false,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Failed to check availability:', error);
      // Fallback to showing no availability if API fails
      setAvailableVehicles([]);
      setSharedRideAvailable(false);
      setPersonalRideAvailable(false);
      setSearchResults({
        totalVehicles: 0,
        sharedAvailable: false,
        personalAvailable: false,
        timestamp: new Date().toLocaleTimeString()
      });
      alert('Failed to check ride availability. Please try again.');
    }
  };

  const { sharedPrice, personalPrice } = useMemo(() => {
    if (selectedVehicle && distance > 0) {
      const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
      if (vehicle) {
        const baseFare = 30;
        return {
          sharedPrice: Math.round(baseFare + (distance * vehicle.sharedRate)),
          personalPrice: Math.round(baseFare + (distance * vehicle.personalRate))
        };
      }
    }
    return { sharedPrice: 0, personalPrice: 0 };
  }, [selectedVehicle, distance]);

  const handleBookRide = () => {
    if (!selectedVehicle) {
      alert("Please select a vehicle");
      return;
    }

    navigate("/map", {
      state: {
        booking: {
          pickup,
          destination,
          vehicle: VEHICLES.find(v => v.id === selectedVehicle).name,
          rideType,
          distance,
          price: rideType === "shared" ? sharedPrice : personalPrice,
          pickupCoords,
          destCoords,
          routeCoordinates,
        }
      }
    });
  };

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Background Map Pattern */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl px-4 py-12 mx-auto mt-24">
        {/* Hero Title */}
        <div className="mb-12 text-center animate-fade-in">
          <div className="inline-block px-4 py-2 mb-4 text-sm font-bold text-transparent border-2 rounded-full shadow-lg bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-blue-500/20">
            ✨ Premium Ride Booking
          </div>
          <h1 className="mb-3 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 font-display">
            Book Your Perfect Ride
          </h1>
          <p className="text-xl text-slate-600 font-display">Choose your vehicle and get instant fare estimates</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Location Details */}
            <div className="relative p-8 overflow-hidden transition-all border-2 shadow-2xl bg-white/80 backdrop-blur-xl hover:shadow-3xl rounded-3xl border-blue-100/50">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 opacity-20 blur-3xl"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 shadow-lg rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 shadow-blue-500/30">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 font-display">Trip Details</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block mb-3 text-sm font-bold tracking-wide uppercase text-slate-700 font-display">
                    🟢 Pickup Location
                  </label>
                  <div className="relative group">
                    <MapPin className="absolute w-5 h-5 text-green-600 transition-transform -translate-y-1/2 left-4 top-1/2 group-focus-within:scale-110" />
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Enter pickup location"
                      className="w-full py-4 pl-12 pr-4 transition-all bg-white border-2 text-slate-900 placeholder-slate-400 border-slate-200 rounded-2xl focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-100 font-display"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-3 text-sm font-bold tracking-wide uppercase text-slate-700 font-display">
                    🔴 Destination
                  </label>
                  <div className="relative group">
                    <MapPin className="absolute w-5 h-5 text-red-600 transition-transform -translate-y-1/2 left-4 top-1/2 group-focus-within:scale-110" />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Where are you going?"
                      className="w-full py-4 pl-12 pr-4 transition-all bg-white border-2 text-slate-900 placeholder-slate-400 border-slate-200 rounded-2xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100 font-display"
                    />
                  </div>
                </div>

                <button
                  onClick={searchForRides}
                  disabled={isCalculating}
                  className="relative flex items-center justify-center w-full gap-3 py-4 mt-2  overflow-hidden font-bold text-white transition-all transform bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-2xl hover:scale-[1.02] hover:shadow-2xl shadow-lg shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group font-display"
                >
                  <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-r from-purple-700 via-purple-600 to-blue-600 group-hover:opacity-100"></div>
                  {isCalculating ? (
                    <Loader className="relative w-6 h-6 animate-spin" />
                  ) : (
                    <Navigation className="relative w-6 h-6" />
                  )}
                  <span className="relative text-lg">{isCalculating ? 'Searching for Rides...' : 'Search for Rides'}</span>
                </button>

                {searchResults && calculationDone && distance > 0 && (
                  <div className="space-y-3">
                    {/* Distance Display */}
                    <div className="relative p-6 overflow-hidden border-2 border-blue-300 bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-2xl shadow-xl transform animate-[fadeIn_0.5s_ease-in-out]">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400 rounded-full opacity-20 blur-2xl"></div>
                      <div className="relative flex items-center justify-between mb-4">
                        <span className="text-base font-bold text-blue-900 font-display">Distance:</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-display">{distance}</span>
                          <span className="text-xl font-bold text-blue-600 font-display">km</span>
                        </div>
                      </div>
                      
                      {/* Availability Summary */}
                      <div className="pt-4 mt-4 border-t-2 border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700 font-display">🚗 Available Vehicles:</span>
                          <span className="px-3 py-1 text-sm font-black text-white rounded-full bg-gradient-to-r from-green-600 to-emerald-600 font-display">
                            {searchResults.totalVehicles} of {VEHICLES.length}
                          </span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <div className={`flex-1 px-3 py-2 rounded-lg text-center ${sharedRideAvailable ? 'bg-green-100 border-2 border-green-400' : 'bg-red-100 border-2 border-red-400'}`}>
                            <span className={`text-xs font-bold ${sharedRideAvailable ? 'text-green-800' : 'text-red-800'} font-display`}>
                              {sharedRideAvailable ? '✓ Shared Available' : '✗ Shared Unavailable'}
                            </span>
                          </div>
                          <div className={`flex-1 px-3 py-2 rounded-lg text-center ${personalRideAvailable ? 'bg-green-100 border-2 border-green-400' : 'bg-red-100 border-2 border-red-400'}`}>
                            <span className={`text-xs font-bold ${personalRideAvailable ? 'text-green-800' : 'text-red-800'} font-display`}>
                              {personalRideAvailable ? '✓ Personal Available' : '✗ Personal Unavailable'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-center text-slate-500 font-display">
                          Last updated: {searchResults.timestamp}
                        </p>
                      </div>
                    </div>

                    {/* No rides available message */}
                    {searchResults.totalVehicles === 0 && (
                      <div className="relative p-4 overflow-hidden border-2 shadow-lg border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-300 rounded-full opacity-20 blur-2xl"></div>
                        <p className="relative text-sm font-bold text-center text-amber-900 font-display">
                          😔 No vehicles available for this route at the moment. Please try again later or adjust your route.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Selection */}
            {calculationDone && distance > 0 && (
              <div className="relative p-8 overflow-hidden transition-all bg-white/80 backdrop-blur-xl shadow-2xl hover:shadow-3xl rounded-3xl border-2 border-purple-100/50 animate-[slideUp_0.5s_ease-out]">
                <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 opacity-20 blur-3xl"></div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 shadow-lg rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-purple-500/30">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 font-display">Choose Your Vehicle</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  {VEHICLES.map((vehicle) => {
                    const VehicleIcon = vehicle.icon;
                    const isSelected = selectedVehicle === vehicle.id;
                    const isAvailable = availableVehicles.includes(vehicle.id);
                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => isAvailable && setSelectedVehicle(vehicle.id)}
                        disabled={!isAvailable}
                        className={`relative p-6 rounded-2xl border-2 transition-all ${
                          !isAvailable 
                            ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                            : isSelected
                              ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-500/20 transform hover:scale-105 hover:shadow-xl"
                              : "border-slate-200 bg-white hover:border-purple-300 transform hover:scale-105 hover:shadow-xl"
                        }`}
                      >
                        {/* Availability Badge */}
                        {!isAvailable && (
                          <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg top-2 right-2 font-display">
                            Unavailable
                          </div>
                        )}
                        {isAvailable && isSelected && (
                          <div className="absolute flex items-center justify-center rounded-full shadow-lg top-3 right-3 w-7 h-7 bg-gradient-to-br from-purple-600 to-pink-500">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {isAvailable && !isSelected && (
                          <div className="absolute px-2 py-1 text-xs font-bold text-green-700 bg-green-100 border border-green-400 rounded-full shadow top-2 right-2 font-display">
                            Available
                          </div>
                        )}
                        <div className="flex flex-col items-center text-center">
                          <div className={`p-3 rounded-xl mb-3 ${
                            !isAvailable 
                              ? 'bg-slate-200' 
                              : isSelected 
                                ? 'bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg' 
                                : 'bg-slate-100'
                          }`}>
                            <VehicleIcon className={`w-10 h-10 ${
                              !isAvailable 
                                ? 'text-slate-400' 
                                : isSelected 
                                  ? 'text-white' 
                                  : 'text-slate-600'
                            }`} />
                          </div>
                          <h3 className={`text-lg font-black font-display ${
                            !isAvailable ? 'text-slate-400' : 'text-slate-900'
                          }`}>{vehicle.name}</h3>
                          <p className={`mb-2 text-xs font-display ${
                            !isAvailable ? 'text-slate-400' : 'text-slate-600'
                          }`}>{vehicle.description}</p>
                          <div className={`flex items-center gap-1.5 px-3 py-1 mt-1 text-xs font-semibold rounded-full font-display ${
                            !isAvailable 
                              ? 'text-slate-400 bg-slate-100' 
                              : 'text-purple-700 bg-purple-100'
                          }`}>
                            <Users className="w-3 h-3" />
                            <span>{vehicle.capacity} seats</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ride Type Selection */}
            {selectedVehicle && (
              <div className="relative p-8 overflow-hidden transition-all bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border-2 border-green-100/50 animate-[slideUp_0.6s_ease-out]">
                <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-green-200 to-blue-200 opacity-20 blur-3xl"></div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 shadow-lg rounded-xl bg-gradient-to-br from-green-600 to-blue-500 shadow-green-500/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 font-display">Select Ride Type</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <button
                    onClick={() => sharedRideAvailable && setRideType("shared")}
                    disabled={!sharedRideAvailable}
                    className={`relative p-8 rounded-2xl border-2 transition-all ${
                      !sharedRideAvailable
                        ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                        : rideType === "shared"
                          ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-500/20 transform hover:scale-105 hover:shadow-xl"
                          : "border-slate-200 bg-white hover:border-green-300 transform hover:scale-105 hover:shadow-xl"
                    }`}
                  >
                    {!sharedRideAvailable && (
                      <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg top-3 right-3 font-display">
                        Not Available
                      </div>
                    )}
                    {sharedRideAvailable && rideType === "shared" && (
                      <div className="absolute px-2 py-1 text-xs font-bold text-green-700 bg-green-200 rounded-full top-3 right-3 font-display">
                        SELECTED
                      </div>
                    )}
                    {sharedRideAvailable && rideType !== "shared" && (
                      <div className="absolute px-2 py-1 text-xs font-bold text-green-700 bg-green-100 border border-green-400 rounded-full shadow top-3 right-3 font-display">
                        Available
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-4 rounded-xl mb-3 ${
                        !sharedRideAvailable 
                          ? 'bg-slate-200' 
                          : rideType === "shared" 
                            ? 'bg-gradient-to-br from-green-600 to-emerald-500 shadow-lg' 
                            : 'bg-green-100'
                      }`}>
                        <Users className={`w-12 h-12 ${
                          !sharedRideAvailable 
                            ? 'text-slate-400' 
                            : rideType === "shared" 
                              ? 'text-white' 
                              : 'text-green-600'
                        }`} />
                      </div>
                      <h3 className={`mb-2 text-xl font-black font-display ${
                        !sharedRideAvailable ? 'text-slate-400' : 'text-slate-900'
                      }`}>Shared Ride</h3>
                      <p className={`mb-3 text-sm font-display ${
                        !sharedRideAvailable ? 'text-slate-400' : 'text-slate-600'
                      }`}>💰 Save money by sharing</p>
                      {sharedRideAvailable ? (
                        <div className="flex items-center gap-1 px-4 py-2 font-black text-white rounded-full shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 font-display">
                          <span className="text-2xl">₹{sharedPrice}</span>
                        </div>
                      ) : (
                        <div className="px-4 py-2 text-sm font-semibold text-slate-400 rounded-full bg-slate-100 font-display">
                          Unavailable
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => personalRideAvailable && setRideType("personal")}
                    disabled={!personalRideAvailable}
                    className={`relative p-8 rounded-2xl border-2 transition-all ${
                      !personalRideAvailable
                        ? "border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed"
                        : rideType === "personal"
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg shadow-blue-500/20 transform hover:scale-105 hover:shadow-xl"
                          : "border-slate-200 bg-white hover:border-blue-300 transform hover:scale-105 hover:shadow-xl"
                    }`}
                  >
                    {!personalRideAvailable && (
                      <div className="absolute px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg top-3 right-3 font-display">
                        Not Available
                      </div>
                    )}
                    {personalRideAvailable && rideType === "personal" && (
                      <div className="absolute px-2 py-1 text-xs font-bold text-blue-700 bg-blue-200 rounded-full top-3 right-3 font-display">
                        SELECTED
                      </div>
                    )}
                    {personalRideAvailable && rideType !== "personal" && (
                      <div className="absolute px-2 py-1 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-400 rounded-full shadow top-3 right-3 font-display">
                        Available
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-4 rounded-xl mb-3 ${
                        !personalRideAvailable 
                          ? 'bg-slate-200' 
                          : rideType === "personal" 
                            ? 'bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg' 
                            : 'bg-blue-100'
                      }`}>
                        <Car className={`w-12 h-12 ${
                          !personalRideAvailable 
                            ? 'text-slate-400' 
                            : rideType === "personal" 
                              ? 'text-white' 
                              : 'text-blue-600'
                        }`} />
                      </div>
                      <h3 className={`mb-2 text-xl font-black font-display ${
                        !personalRideAvailable ? 'text-slate-400' : 'text-slate-900'
                      }`}>Personal Ride</h3>
                      <p className={`mb-3 text-sm font-display ${
                        !personalRideAvailable ? 'text-slate-400' : 'text-slate-600'
                      }`}>⭐ Private & comfortable</p>
                      {personalRideAvailable ? (
                        <div className="flex items-center gap-1 px-4 py-2 font-black text-white rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-cyan-600 font-display">
                          <span className="text-2xl">₹{personalPrice}</span>
                        </div>
                      ) : (
                        <div className="px-4 py-2 text-sm font-semibold text-slate-400 rounded-full bg-slate-100 font-display">
                          Unavailable
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Price Summary */}
          {selectedVehicle && (
            <div className="lg:col-span-1">
              <div className="sticky p-8 overflow-hidden transition-all bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border-2 border-yellow-100/50 top-28 hover:shadow-3xl animate-[slideUp_0.7s_ease-out]">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 opacity-20 blur-3xl"></div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 shadow-lg rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-yellow-500/30">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 font-display">Fare Summary</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b-2 border-slate-100">
                    <span className="font-semibold text-slate-600 font-display">Vehicle:</span>
                    <span className="font-black text-slate-900 font-display">{VEHICLES.find(v => v.id === selectedVehicle)?.name}</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b-2 border-slate-100">
                    <span className="font-semibold text-slate-600 font-display">Distance:</span>
                    <span className="font-black text-slate-900 font-display">{distance} km</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b-2 border-slate-100">
                    <span className="font-semibold text-slate-600 font-display">Ride Type:</span>
                    <span className="px-3 py-1 text-sm font-black text-white capitalize rounded-full bg-gradient-to-r from-blue-600 to-purple-600 font-display">{rideType}</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b-2 border-slate-100">
                    <span className="font-semibold text-slate-600 font-display">Base Fare:</span>
                    <span className="font-black text-slate-900 font-display">₹30</span>
                  </div>
                  
                  <div className="flex justify-between py-3 border-b-2 border-slate-100">
                    <span className="font-semibold text-slate-600 font-display">Per km rate:</span>
                    <span className="font-black text-slate-900 font-display">
                      ₹{rideType === "shared" 
                        ? VEHICLES.find(v => v.id === selectedVehicle)?.sharedRate 
                        : VEHICLES.find(v => v.id === selectedVehicle)?.personalRate}
                    </span>
                  </div>
                  
                  <div className="relative p-5 mt-4 overflow-hidden border-2 border-green-300 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-400 rounded-full opacity-20 blur-2xl"></div>
                    <div className="relative flex items-center justify-between">
                      <span className="text-xl font-black text-slate-900 font-display">Total Fare:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold text-green-600 font-display">₹</span>
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 font-display">
                          {rideType === "shared" ? sharedPrice : personalPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBookRide}
                  className="relative flex items-center justify-center w-full gap-3 py-5 mt-6 overflow-hidden font-black text-white transition-all transform bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-2xl hover:scale-[1.02] hover:shadow-2xl shadow-lg shadow-blue-500/40 group font-display"
                >
                  <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-r from-purple-700 via-purple-600 to-blue-600 group-hover:opacity-100"></div>
                  <span className="relative text-lg">Book Ride Now</span>
                  <ArrowRight className="relative w-6 h-6 transition-transform group-hover:translate-x-1" />
                </button>

                {rideType === "shared" && (
                  <div className="relative p-4 mt-4 overflow-hidden border-2 shadow-lg border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-300 rounded-full opacity-20 blur-2xl"></div>
                    <p className="relative text-sm font-bold text-center text-amber-900 font-display">
                      💰 You're saving ₹{personalPrice - sharedPrice} with shared ride!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Route Map */}
        {selectedVehicle && pickupCoords && destCoords && (
          <div className="mt-12 overflow-hidden transition-all bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border-2 border-blue-100/50 hover:shadow-3xl animate-[slideUp_0.8s_ease-out]">
            <div className="relative flex items-center justify-between p-6 overflow-hidden border-b-2 border-slate-100 bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-pink-50/80">
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-gradient-to-br from-blue-300 to-purple-300 opacity-20 blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 shadow-lg rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 shadow-blue-500/30">
                    <Navigation className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 font-display">Route Preview</h2>
                </div>
                <p className="text-sm font-semibold text-slate-600 pl-14 font-display">{pickup} → {destination}</p>
              </div>
              <div className="relative px-5 py-3 font-black text-blue-700 rounded-full shadow-lg bg-gradient-to-br from-blue-100 to-purple-100 font-display">
                <span className="text-2xl">{distance}</span>
                <span className="ml-1 text-sm">km</span>
              </div>
            </div>

            <MapContainer
              center={[(pickupCoords.lat + destCoords.lat) / 2, (pickupCoords.lng + destCoords.lng) / 2]}
              zoom={12}
              style={{ height: "420px", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FitBounds bounds={[[pickupCoords.lat, pickupCoords.lng], [destCoords.lat, destCoords.lng]]} />

              <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupMarkerIcon}>
                <Popup>
                  <div className="text-center">
                    <strong className="text-green-700">🟢 Pickup</strong>
                    <br />
                    <span className="text-sm">{pickup}</span>
                  </div>
                </Popup>
              </Marker>

              <Marker position={[destCoords.lat, destCoords.lng]} icon={destMarkerIcon}>
                <Popup>
                  <div className="text-center">
                    <strong className="text-red-700">🔴 Destination</strong>
                    <br />
                    <span className="text-sm">{destination}</span>
                  </div>
                </Popup>
              </Marker>

              {routeCoordinates.length > 0 && (
                <Polyline positions={routeCoordinates} color="#3b82f6" weight={5} opacity={0.75} />
              )}
            </MapContainer>

            <div className="flex flex-wrap items-center gap-6 p-6 bg-gradient-to-r from-slate-50 via-blue-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500 font-display">Pickup</span>
                  <p className="text-sm font-black text-slate-900 font-display">{pickup}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-500 font-display">Destination</span>
                  <p className="text-sm font-black text-slate-900 font-display">{destination}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <div className="w-8 h-1.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full shadow"></div>
                <span className="text-sm font-bold text-slate-700 font-display">Driving Route</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
