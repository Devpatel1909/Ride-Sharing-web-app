import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/common/Header";
import {
  MapPin,
  DollarSign,
  Users,
  Clock,
  ArrowRight,
  Search,
  TrendingUp,
  Shield,
  Star,
  Crosshair,
  Loader,
  Sparkles,
  Check,
  ChevronRight,
  Zap,
  Heart,
  Award,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [authWarning, setAuthWarning] = useState("");

  // Check if rider is already logged in and redirect to dashboard
  useEffect(() => {
    const riderToken = localStorage.getItem('riderToken');
    const rider = localStorage.getItem('rider');
    
    if (riderToken && rider) {
      // Rider is logged in, redirect to dashboard
      navigate('/rider/dashboard', { replace: true });
    }
  }, [navigate]);

  // Location search states
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [nearbyDestinations, setNearbyDestinations] = useState([]);
  const [pickupCoords, setPickupCoords] = useState(null);

  // Geolocation states
  const [currentCoords, setCurrentCoords] = useState(null); // eslint-disable-line no-unused-vars
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  const images = [
    {
      url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
      alt: "People sharing a ride together",
    },
    {
      url: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80",
      alt: "Happy passengers in a car",
    },
    {
      url: "https://images.unsplash.com/photo-1552642986-ccb41e7059e7?auto=format&fit=crop&w=1200&q=80",
      alt: "Friends traveling together",
    },
    {
      url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
      alt: "Commuters sharing a ride",
    },
    {
      url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
      alt: "City ride sharing experience",
    },
  ];

  // Function to find nearest place/landmark from coordinates
  const findNearestPlace = async (lat, lon) => {
    try {
      // Wait 1 second before making request (Nominatim rate limiting)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

      // Use backend reverse geocoding API to avoid CORS issues
      const reverseResponse = await fetch(
        `${API_BASE_URL}/geocoding/reverse?lat=${lat}&lon=${lon}`
      ).catch(() => null);

      if (reverseResponse && reverseResponse.ok) {
        const reverseResult = await reverseResponse.json();
        const reverseData = reverseResult.place || {};
        const address = reverseData.address || {};
        const name = reverseData.name;

        if (name && name !== reverseData.display_name) {
          return name;
        }

        const parts = [];
        if (address.building) parts.push(address.building);
        if (address.road) parts.push(address.road);
        if (address.suburb || address.neighbourhood)
          parts.push(address.suburb || address.neighbourhood);
        if (address.city || address.town || address.village)
          parts.push(address.city || address.town || address.village);

        if (parts.length > 0) {
          return parts.join(", ");
        }

        if (reverseData.display_name) {
          return reverseData.display_name;
        }
      }

      // Fallback to coordinates if API fails
      return `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (error) {
      console.error("Error finding nearest place:", error);
      return `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  };

  // Get user's current location on component mount
  useEffect(() => {
    const getCurrentLocation = async () => {
      if (!navigator.geolocation) {
        setLocationLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentCoords({ lat: latitude, lon: longitude });

          const nearestPlace = await findNearestPlace(latitude, longitude);
          setPickupLocation(nearestPlace);
          setLocationLoading(false);
          setLocationError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location access denied. You can still search manually.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage =
                "Location unavailable. Please enter address manually.";
              break;
            case error.TIMEOUT:
              errorMessage =
                "Location request timed out. Please enter address manually.";
              break;
            default:
              errorMessage =
                "Unable to get location. Please enter address manually.";
          }
          setLocationError(errorMessage);
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    };

    getCurrentLocation();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Helper function to get place type icon and label
  const getPlaceType = (item) => {
    const type = item.type || "";
    const category = item.class || "";

    const typeMap = {
      hospital: "🏥 Hospital",
      clinic: "🏥 Clinic",
      college: "🎓 College",
      university: "🎓 University",
      school: "🏫 School",
      restaurant: "🍽️ Restaurant",
      cafe: "☕ Cafe",
      hotel: "🏨 Hotel",
      bank: "🏦 Bank",
      atm: "🏧 ATM",
      pharmacy: "💊 Pharmacy",
      supermarket: "🛒 Supermarket",
      mall: "🏬 Mall",
      shopping: "🛍️ Shopping",
      bus_station: "🚌 Bus Station",
      train_station: "🚂 Train Station",
      airport: "✈️ Airport",
      park: "🌳 Park",
      stadium: "🏟️ Stadium",
      museum: "🏛️ Museum",
      library: "📚 Library",
      cinema: "🎬 Cinema",
      police: "👮 Police",
      fuel: "⛽ Fuel Station",
      parking: "🅿️ Parking",
    };

    if (typeMap[type]) return typeMap[type];
    if (typeMap[category]) return typeMap[category];
    if (category === "amenity") return "📍 Place";
    if (category === "building") return "🏢 Building";
    if (category === "highway") return "🛣️ Road";
    return "📍 Location";
  };

  // Search for locations using OpenStreetMap Nominatim API (India only)
  const searchLocation = useCallback(async (query, isPickup) => {
    if (query.length < 2) {
      if (isPickup) {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDropSuggestions([]);
        setShowDropSuggestions(false);
      }
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=in&limit=10&addressdetails=1&extratags=1&namedetails=1`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "RideSharingApp/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      const suggestions = data.map((item) => ({
        id: item.place_id,
        name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        type: getPlaceType(item),
        category: item.class,
      }));

      if (isPickup) {
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(true);
      } else {
        setDropSuggestions(suggestions);
        setShowDropSuggestions(true);
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  }, []);

  // Function to find nearby destinations based on pickup coordinates (India only)
  const findNearbyDestinations = useCallback(async (lat, lon) => {
    try {
      const categories = [
        "hospital",
        "college",
        "university",
        "shopping",
        "restaurant",
        "park",
        "station",
        "airport",
        "hotel",
        "mall",
      ];
      const allNearby = [];

      for (let i = 0; i < Math.min(3, categories.length); i++) {
        const category = categories[i];
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${category}&countrycodes=in&lat=${lat}&lon=${lon}&limit=3&addressdetails=1&extratags=1`,
            {
              headers: {
                Accept: "application/json",
                "User-Agent": "RideSharingApp/1.0",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const nearby = data
              .filter((item) => {
                const distance = calculateDistance(lat, lon, item.lat, item.lon);
                return distance <= 10;
              })
              .map((item) => ({
                id: item.place_id,
                name: item.display_name,
                lat: item.lat,
                lon: item.lon,
                type: getPlaceType(item),
                category: item.class,
                distance: calculateDistance(lat, lon, item.lat, item.lon),
                isNearby: true,
              }));

            allNearby.push(...nearby);
          }

          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (err) {
          console.error("Error fetching nearby places:", err);
        }
      }

      const uniqueNearby = Array.from(
        new Map(allNearby.map((item) => [item.id, item])).values()
      )
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8);

      setNearbyDestinations(uniqueNearby);
      if (uniqueNearby.length > 0) {
        setDropSuggestions(uniqueNearby);
        setShowDropSuggestions(true);
      }
    } catch (error) {
      console.error("Error finding nearby destinations:", error);
    }
  }, []);

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Debounced search for pickup location
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pickupLocation) {
        searchLocation(pickupLocation, true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [pickupLocation, searchLocation]);

  // Debounced search for drop location
  useEffect(() => {
    const timer = setTimeout(() => {
      if (dropLocation && dropLocation.length >= 2) {
        searchLocation(dropLocation, false);
      } else if (dropLocation.length === 0 && nearbyDestinations.length > 0) {
        setDropSuggestions(nearbyDestinations);
        setShowDropSuggestions(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [dropLocation, searchLocation, nearbyDestinations]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".location-input-container")) {
        setShowPickupSuggestions(false);
        setShowDropSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle suggestion selection
  const handlePickupSelect = async (suggestion) => {
    setPickupLocation(suggestion.name);
    const coords = {
      lat: parseFloat(suggestion.lat),
      lon: parseFloat(suggestion.lon),
    };
    setCurrentCoords(coords);
    setPickupCoords(coords);
    setShowPickupSuggestions(false);

    if (coords.lat && coords.lon) {
      await findNearbyDestinations(coords.lat, coords.lon);
    }
  };

  const handleDropSelect = (suggestion) => {
    setDropLocation(suggestion.name);
    setShowDropSuggestions(false);
  };

  // Check if user is authenticated
  const handleSearchRide = () => {
    const token = localStorage.getItem("token");
    const riderToken = localStorage.getItem("riderToken");

    if (!token && !riderToken) {
      setAuthWarning("Please sign up or login to search for rides");
      setTimeout(() => {
        navigate("/login", {
          state: { message: "Please login to search for rides" },
        });
      }, 2000);
      return;
    }

    if (!token && riderToken) {
      setAuthWarning("Passenger login is required to request a ride");
      setTimeout(() => {
        navigate("/rider/dashboard");
      }, 1500);
      return;
    }

    navigate("/ride-search", {
      state: { pickup: pickupLocation, drop: dropLocation },
    });
  };

  // Manually trigger current location retrieval
  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentCoords({ lat: latitude, lon: longitude });

        const nearestPlace = await findNearestPlace(latitude, longitude);
        setPickupLocation(nearestPlace);
        setLocationLoading(false);
        setLocationError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable permissions and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please enter address manually.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
          default:
            errorMessage = "Unable to get location. Please enter address manually.";
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans antialiased">
      {/* Google Fonts & Custom Styles */}
      <style>{`
        /* UberMove font is loaded via uber-move.css */
        
        * {
          font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        h1, h2, h3 {
          font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          letter-spacing: -0.02em;
          font-weight: 700;
        }
        
        .font-display {
          font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-weight: 500;
        }

        /* Custom Scrollbar Styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #faf5ff, #fdf4ff);
          border-radius: 100px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #2563EB, #7C3AED);
          border-radius: 100px;
          border: 2px solid #faf5ff;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #1d4ed8, #6d28d9);
        }

        /* Smooth Animations */
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-in-from-top-2 {
          from {
            transform: translateY(-8px);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: fade-in 0.2s ease-out, slide-in-from-top-2 0.2s ease-out;
        }
      `}</style>
      
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
      </div>

      <Header />

      {/* Hero Section */}
      <section className="relative px-4 pt-32 pb-40 overflow-hidden sm:px-6 lg:px-8">
        {/* Enhanced Gradient Orbs */}
        <div className="absolute top-0 left-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full w-[600px] h-[600px] mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500 rounded-full w-[600px] h-[600px] mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-full left-1/2 w-[600px] h-[600px] mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 grid items-center gap-16 mx-auto max-w-7xl lg:grid-cols-2">
          {/* Left Content */}
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white rounded-full text-sm font-semibold shadow-2xl shadow-blue-500/50 hover:shadow-blue-600/70 transition-all hover:scale-105">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="font-display">Share rides, Save money</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-6xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-7xl lg:text-8xl">
                Go anywhere,
                <span className="block mt-3 text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text animate-gradient">
                  with anyone
                </span>
              </h1>
              
              <div className="h-1.5 w-32 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-full"></div>
            </div>

            <p className="max-w-xl text-xl font-medium leading-relaxed text-slate-600">
              Join ongoing rides in your area and split the cost.{" "}
              <span className="font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text">
                Save up to 60%
              </span>{" "}
              on every trip while making new connections.
            </p>

            {/* Quick Booking Card */}
            <div className="relative p-8 border shadow-2xl bg-white/80 backdrop-blur-xl border-white/60 shadow-slate-900/10 rounded-3xl">
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-3xl blur-xl group-hover:opacity-100 -z-10"></div>
              
              <div className="absolute w-40 h-40 rounded-full -top-10 -right-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 opacity-20 blur-3xl"></div>
              
              <h3 className="mb-8 text-2xl font-bold text-slate-900 font-display">
                Find a shared ride now
              </h3>

              {/* Current Location Button */}
              <button
                onClick={handleGetCurrentLocation}
                disabled={locationLoading}
                className="flex items-center justify-center w-full gap-3 px-5 py-4 mb-6 text-sm font-semibold transition-all border-2 text-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 rounded-2xl hover:from-white hover:to-slate-50 hover:border-slate-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {locationLoading ? (
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <Crosshair className="w-5 h-5 text-blue-600 transition-transform group-hover:scale-110" />
                )}
                <span className="font-display">{locationLoading ? "Getting location..." : "Use my location"}</span>
              </button>

              {/* Location Error Message */}
              {locationError && (
                <div className="p-4 mb-6 text-sm font-medium text-red-700 border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl">
                  {locationError}
                </div>
              )}

              {/* Auth Warning Message */}
              {authWarning && (
                <div className="p-4 mb-6 text-sm font-medium border-2 text-amber-800 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl">
                  {authWarning}
                </div>
              )}

              <div className="space-y-5">
                {/* Pickup Location */}
                <div className="relative location-input-container">
                  <div className="absolute flex items-center justify-center w-10 h-10 shadow-lg left-4 top-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <input
                    type="text"
                    placeholder="Pickup location"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    onFocus={() =>
                      pickupSuggestions.length > 0 &&
                      setShowPickupSuggestions(true)
                    }
                    className="w-full py-5 pl-20 pr-6 font-medium transition-all border-2 text-slate-800 bg-gradient-to-r from-slate-50 to-white border-slate-200 rounded-2xl focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
                  />

                  {/* Pickup Suggestions Dropdown */}
                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-3 overflow-hidden transition-all duration-300 ease-out border shadow-2xl bg-white/98 backdrop-blur-2xl border-blue-200/50 rounded-3xl animate-in fade-in slide-in-from-top-2">
                      {/* Header */}
                      <div className="px-5 py-3 border-b bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-purple-100/80 border-blue-100/50">
                        <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-blue-700 uppercase font-display">
                          <MapPin className="w-3.5 h-3.5" />
                          Suggested Locations (India)
                        </p>
                      </div>
                      
                      {/* Suggestions List */}
                      <div className="overflow-y-auto max-h-80 custom-scrollbar">
                        {pickupSuggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.id}
                            onClick={() => handlePickupSelect(suggestion)}
                            className="relative flex items-start gap-4 px-5 py-4 transition-all duration-300 ease-out border-b cursor-pointer border-slate-100/50 hover:bg-gradient-to-r hover:from-blue-50 hover:via-purple-50 hover:to-purple-100 last:border-b-0 group"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            {/* Icon and Badge */}
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                              <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 ease-out rounded-xl bg-blue-50 group-hover:bg-gradient-to-br group-hover:from-blue-200 group-hover:to-purple-200 group-hover:scale-110 group-hover:shadow-md">
                                <span className="text-xl transition-transform duration-300 ease-out group-hover:scale-110">
                                  {suggestion.type.split(' ')[0]}
                                </span>
                              </div>
                              {suggestion.category && (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-200 group-hover:text-blue-700 transition-all duration-300 ease-out">
                                  {suggestion.category}
                                </span>
                              )}
                            </div>
                            
                            {/* Location Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold leading-snug transition-colors duration-300 ease-out text-slate-900 group-hover:text-blue-600 line-clamp-2">
                                    {suggestion.name.split(',')[0]}
                                  </p>
                                  {suggestion.name.split(',').length > 1 && (
                                    <p className="mt-1 text-xs font-medium transition-colors duration-300 ease-out text-slate-500 group-hover:text-slate-700 line-clamp-1">
                                      {suggestion.name.split(',').slice(1).join(',').trim()}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight className="flex-shrink-0 w-4 h-4 transition-all duration-300 ease-out text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1" />
                              </div>
                            </div>
                            
                            {/* Hover Effect Border */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Drop Location */}
                <div className="relative location-input-container">
                  <div className="absolute flex items-center justify-center w-10 h-10 shadow-lg left-4 top-5 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <input
                    type="text"
                    placeholder="Drop location"
                    value={dropLocation}
                    onChange={(e) => setDropLocation(e.target.value)}
                    onFocus={() => {
                      if (dropSuggestions.length > 0) {
                        setShowDropSuggestions(true);
                      } else if (
                        pickupCoords &&
                        nearbyDestinations.length === 0
                      ) {
                        findNearbyDestinations(pickupCoords.lat, pickupCoords.lon);
                      }
                    }}
                    className="w-full py-5 pl-20 pr-6 font-medium transition-all border-2 text-slate-800 bg-gradient-to-r from-slate-50 to-white border-slate-200 rounded-2xl focus:border-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-100 placeholder:text-slate-400"
                  />

                  {/* Drop Suggestions Dropdown */}
                  {showDropSuggestions && dropSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-3 overflow-hidden transition-all duration-300 ease-out border shadow-2xl bg-white/98 backdrop-blur-2xl border-purple-200/50 rounded-3xl animate-in fade-in slide-in-from-top-2">
                      {/* Header */}
                      <div className="px-5 py-3 border-b bg-gradient-to-r from-purple-50/80 via-purple-100/80 to-purple-200/80 border-purple-100/50">
                        {dropSuggestions.some((s) => s.isNearby) ? (
                          <div className="flex items-center justify-between">
                            <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-purple-700 uppercase font-display">
                              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                              Nearby Destinations
                            </p>
                            <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                              Within 10km
                            </span>
                          </div>
                        ) : (
                          <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-purple-700 uppercase font-display">
                            <MapPin className="w-3.5 h-3.5" />
                            Search Results
                          </p>
                        )}
                      </div>
                      
                      {/* Suggestions List */}
                      <div className="overflow-y-auto max-h-80 custom-scrollbar">
                        {dropSuggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.id}
                            onClick={() => handleDropSelect(suggestion)}
                            className="relative flex items-start gap-4 px-5 py-4 transition-all duration-300 ease-out border-b cursor-pointer border-slate-100/50 hover:bg-gradient-to-r hover:from-purple-50 hover:via-purple-100 hover:to-purple-200 last:border-b-0 group hover:shadow-inner"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            {/* Icon and Badge */}
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                              <div className="flex items-center justify-center w-10 h-10 transition-all duration-300 ease-out rounded-xl bg-purple-50 group-hover:bg-gradient-to-br group-hover:from-purple-200 group-hover:to-purple-300 group-hover:scale-110 group-hover:shadow-md">
                                <span className="text-xl transition-transform duration-300 ease-out group-hover:scale-110">
                                  {suggestion.type.split(' ')[0]}
                                </span>
                              </div>
                              {suggestion.category && !suggestion.isNearby && (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 text-slate-600 group-hover:bg-purple-200 group-hover:text-purple-700 transition-all duration-300 ease-out">
                                  {suggestion.category}
                                </span>
                              )}
                            </div>
                            
                            {/* Location Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="flex-1 text-sm font-bold leading-snug transition-colors duration-300 ease-out text-slate-900 group-hover:text-purple-600 line-clamp-2">
                                      {suggestion.name.split(',')[0]}
                                    </p>
                                    {suggestion.isNearby && suggestion.distance && (
                                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200 group-hover:from-emerald-200 group-hover:to-green-200 group-hover:border-emerald-300 transition-all duration-300 ease-out flex-shrink-0">
                                        <TrendingUp className="w-3 h-3 text-emerald-700" />
                                        <span className="text-xs font-extrabold text-emerald-700">
                                          {suggestion.distance.toFixed(1)} km
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {suggestion.name.split(',').length > 1 && (
                                    <p className="text-xs font-medium transition-colors duration-300 ease-out text-slate-500 group-hover:text-slate-700 line-clamp-1">
                                      {suggestion.name.split(',').slice(1).join(',').trim()}
                                    </p>
                                  )}
                                  {suggestion.isNearby && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                      <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                                        Nearby Location
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="flex-shrink-0 w-4 h-4 transition-all duration-300 ease-out text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1" />
                              </div>
                            </div>
                            
                            {/* Hover Effect Border */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSearchRide}
                  className="flex items-center justify-center w-full gap-3 px-8 py-5 text-lg font-bold text-white transition-all bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-purple-800 shadow-2xl shadow-blue-500/50 hover:shadow-blue-600/70 hover:-translate-y-1 hover:scale-[1.02] group font-display"
                >
                  <Search className="w-6 h-6" />
                  Search available rides
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 mt-8 border-t-2 border-slate-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">50K+</div>
                  <div className="mt-1 text-xs font-semibold text-slate-600">Active riders</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text">1M+</div>
                  <div className="mt-1 text-xs font-semibold text-slate-600">Rides shared</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text">60%</div>
                  <div className="mt-1 text-xs font-semibold text-slate-600">Avg. savings</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image Carousel */}
          <div className="relative lg:h-[750px] h-96">
            {/* Image Carousel */}
            <div className="relative w-full h-full overflow-hidden shadow-2xl rounded-3xl ring-4 ring-white/50">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.alt}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === currentImageIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent"></div>

              {/* Navigation Dots */}
              <div className="absolute flex gap-3 transform -translate-x-1/2 bottom-8 left-1/2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? "bg-white w-12 shadow-lg"
                        : "bg-white/50 hover:bg-white/75 w-2.5"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Floating Card */}
            <div className="absolute p-8 transition-transform border-2 border-white shadow-2xl bg-white/90 backdrop-blur-xl -bottom-8 -left-8 rounded-3xl ring-4 ring-white/20 hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 border-4 border-white rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-blue-600"></div>
                  <div className="w-10 h-10 border-4 border-white rounded-full shadow-lg bg-gradient-to-br from-purple-500 to-purple-600"></div>
                  <div className="w-10 h-10 border-4 border-white rounded-full shadow-lg bg-gradient-to-br from-cyan-500 to-cyan-600"></div>
                </div>
                <span className="text-sm font-bold text-slate-900 font-display">
                  3 riders going your way
                </span>
              </div>
              <div className="mb-3 text-base font-semibold text-slate-600">
                Mumbai to Pune
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text">₹250</span>
                <span className="text-base font-medium line-through text-slate-400">₹600</span>
                <span className="px-3 py-1.5 text-sm font-bold text-green-700 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl shadow-md">
                  Save 58%
                </span>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute rounded-full -z-10 -bottom-16 -right-16 w-80 h-80 bg-gradient-to-br from-blue-400 via-purple-400 to-purple-600 opacity-30 blur-3xl animate-pulse"></div>
            <div className="absolute w-64 h-64 rounded-full -z-10 -top-16 -left-16 bg-gradient-to-br from-cyan-400 to-blue-500 opacity-30 blur-3xl animate-pulse animation-delay-2000"></div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative px-4 py-32 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 mb-6 text-sm font-bold text-blue-700 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 font-display">
              <Zap className="w-4 h-4" />
              SIMPLE PROCESS
            </div>
            <h2 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              How RIDEX works
            </h2>
            <div className="h-1.5 w-32 mx-auto bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-full mb-6"></div>
            <p className="max-w-3xl mx-auto text-xl font-medium text-slate-600">
              Join rides already on the way and split costs with fellow travelers
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative p-10 transition-all bg-white border-2 shadow-xl group border-slate-200 rounded-3xl hover:shadow-2xl hover:-translate-y-3 hover:border-blue-400">
              <div className="absolute top-0 right-0 w-40 h-40 transition-opacity rounded-full opacity-0 bg-gradient-to-br from-blue-400 to-cyan-400 blur-3xl group-hover:opacity-40"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-8 transition-transform shadow-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 rounded-2xl shadow-blue-500/40 group-hover:scale-110">
                  <Search className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inline-flex items-center justify-center text-lg font-bold text-white rounded-full shadow-xl -top-4 -right-4 w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-700">
                  1
                </div>
                <h3 className="mb-4 text-2xl font-bold text-slate-900">Search rides</h3>
                <p className="text-base font-medium leading-relaxed text-slate-600">
                  Enter your pickup and drop location. See all available rides going
                  your way in real-time.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative p-10 transition-all bg-white border-2 shadow-xl group border-slate-200 rounded-3xl hover:shadow-2xl hover:-translate-y-3 hover:border-purple-400">
              <div className="absolute top-0 right-0 w-40 h-40 transition-opacity rounded-full opacity-0 bg-gradient-to-br from-purple-400 to-purple-600 blur-3xl group-hover:opacity-40"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-8 transition-transform shadow-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl shadow-purple-500/40 group-hover:scale-110">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inline-flex items-center justify-center text-lg font-bold text-white rounded-full shadow-xl -top-4 -right-4 w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-700">
                  2
                </div>
                <h3 className="mb-4 text-2xl font-bold text-slate-900">Join a ride</h3>
                <p className="text-base font-medium leading-relaxed text-slate-600">
                  Choose a ride based on time, price, and driver ratings. Book your
                  seat instantly.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative p-10 transition-all bg-white border-2 shadow-xl group border-slate-200 rounded-3xl hover:shadow-2xl hover:-translate-y-3 hover:border-green-300">
              <div className="absolute top-0 right-0 w-40 h-40 transition-opacity rounded-full opacity-0 bg-gradient-to-br from-green-400 to-emerald-400 blur-3xl group-hover:opacity-40"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-8 transition-transform shadow-2xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl shadow-green-500/40 group-hover:scale-110">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inline-flex items-center justify-center text-lg font-bold text-white rounded-full shadow-xl -top-4 -right-4 w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-700">
                  3
                </div>
                <h3 className="mb-4 text-2xl font-bold text-slate-900">Split & save</h3>
                <p className="text-base font-medium leading-relaxed text-slate-600">
                  Share the ride, share the cost. Pay only your fair share and save up
                  to 60%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative px-4 py-32 overflow-hidden sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 bg-blue-500 rounded-full w-96 h-96 mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 bg-purple-500 rounded-full w-96 h-96 mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 mb-6 text-sm font-bold text-blue-300 rounded-full bg-white/10 backdrop-blur-sm font-display">
              <Heart className="w-4 h-4" />
              WHY CHOOSE US
            </div>
            <h2 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Why choose shared rides?
            </h2>
            <div className="h-1.5 w-32 mx-auto bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 rounded-full"></div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative p-8 transition-all border group bg-white/5 backdrop-blur-sm border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-2">
              <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl group-hover:opacity-100"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-8 transition-transform shadow-2xl bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl shadow-green-500/40 group-hover:scale-110">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-white">Save money on every trip</h3>
                <p className="font-medium leading-relaxed text-slate-300">
                  Cut your travel costs by up to 60% by sharing rides with others going
                  the same way.
                </p>
              </div>
            </div>

            <div className="relative p-8 transition-all border group bg-white/5 backdrop-blur-sm border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-2">
              <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl group-hover:opacity-100"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-8 transition-transform shadow-2xl bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl shadow-blue-500/40 group-hover:scale-110">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-white">Meet new people</h3>
                <p className="font-medium leading-relaxed text-slate-300">
                  Connect with like-minded travelers and build your network while
                  commuting.
                </p>
              </div>
            </div>

            <div className="relative p-8 transition-all border group bg-white/5 backdrop-blur-sm border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-2">
              <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-br from-purple-500/10 to-purple-700/10 rounded-3xl group-hover:opacity-100"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-8 transition-transform shadow-2xl bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-purple-500/40 group-hover:scale-110">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-white">Eco-friendly travel</h3>
                <p className="font-medium leading-relaxed text-slate-300">
                  Reduce carbon emissions by sharing rides instead of taking individual
                  trips.
                </p>
              </div>
            </div>

            <div className="relative p-8 transition-all border group bg-white/5 backdrop-blur-sm border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-2">
              <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl group-hover:opacity-100"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-8 transition-transform shadow-2xl bg-gradient-to-br from-orange-400 to-red-600 rounded-2xl shadow-orange-500/40 group-hover:scale-110">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-white">Safe & verified</h3>
                <p className="font-medium leading-relaxed text-slate-300">
                  All drivers are background-checked and rides are tracked in real-time
                  for your safety.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-32 overflow-hidden sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700">
        <div className="absolute top-0 left-0 rounded-full bg-cyan-400 w-96 h-96 mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-0 bg-purple-400 rounded-full w-96 h-96 mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 mb-8 text-sm font-bold text-white rounded-full bg-white/20 backdrop-blur-sm font-display">
            <Award className="w-4 h-4" />
            JOIN THE COMMUNITY
          </div>
          
          <h2 className="mb-8 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl drop-shadow-2xl">
            Ready to start saving?
          </h2>
          
          <p className="max-w-3xl mx-auto mb-12 text-2xl font-medium leading-relaxed text-white/90">
            Join thousands of riders who are already sharing rides and cutting costs
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <Link
              to="/ride-search"
              className="inline-flex items-center gap-3 px-10 py-5 text-xl font-bold text-blue-700 transition-all bg-white shadow-2xl rounded-2xl hover:bg-slate-50 shadow-white/30 hover:shadow-white/50 hover:-translate-y-2 hover:scale-105 group font-display"
            >
              Get a ride
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
            </Link>
            <Link
              to="/become-rider"
              className="inline-flex items-center gap-3 px-10 py-5 text-xl font-bold text-white transition-all border-2 shadow-2xl bg-white/10 backdrop-blur-sm border-white/40 rounded-2xl hover:bg-white/20 hover:border-white/60 hover:-translate-y-2 hover:scale-105 group font-display"
            >
              Become a rider
              <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-12">
            <div className="flex items-center gap-3 text-white">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              </div>
              <span className="text-lg font-bold font-display">4.8/5 rating</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                <Check className="w-6 h-6 text-green-300" />
              </div>
              <span className="text-lg font-bold font-display">Verified drivers</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                <Clock className="w-6 h-6 text-blue-300" />
              </div>
              <span className="text-lg font-bold font-display">24/7 support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-20 bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 mb-16 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-6 text-sm font-bold tracking-wider uppercase text-slate-400 font-display">
                Company
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    About us
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Press
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-sm font-bold tracking-wider uppercase text-slate-400 font-display">
                Products
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Ride
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Drive
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Business
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-sm font-bold tracking-wider uppercase text-slate-400 font-display">
                Support
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Help center
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Safety
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-sm font-bold tracking-wider uppercase text-slate-400 font-display">
                Legal
              </h3>
              <ul className="space-y-4">
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-base font-medium transition-colors text-slate-300 hover:text-white">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-slate-800">
            <p className="text-base font-medium text-center text-slate-400">
              © 2024 RIDEX. All rights reserved. Go anywhere with anyone.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(40px, -60px) scale(1.15);
          }
          66% {
            transform: translate(-30px, 30px) scale(0.95);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}