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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
export default function Landing() {
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [authWarning, setAuthWarning] = useState("");
  
  // Location search states
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [nearbyDestinations, setNearbyDestinations] = useState([]);
  const [pickupCoords, setPickupCoords] = useState(null);
  
  // Geolocation states (coordinates stored for future features like distance calculation)
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
      // First try to get nearby places using search with coordinates
      const searchResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&lat=${lat}&lon=${lon}&limit=1&addressdetails=1&extratags=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'RideSharingApp/1.0'
          }
        }
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.length > 0) {
          return searchData[0].display_name;
        }
      }
      
      // Fallback to reverse geocoding for the address
      const reverseResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'RideSharingApp/1.0'
          }
        }
      );
      
      if (!reverseResponse.ok) {
        throw new Error('Geocoding failed');
      }
      
      const reverseData = await reverseResponse.json();
      
      // Try to extract the most specific location info
      const address = reverseData.address || {};
      const name = reverseData.name;
      
      // Prioritize landmarks, buildings, and specific places
      if (name && name !== reverseData.display_name) {
        return name;
      }
      
      // Build a readable address from components
      const parts = [];
      if (address.building) parts.push(address.building);
      if (address.road) parts.push(address.road);
      if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
      if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
      
      if (parts.length > 0) {
        return parts.join(', ');
      }
      
      return reverseData.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (error) {
      console.error('Error finding nearest place:', error);
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
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
          
          // Find and set the nearest place as default pickup location
          const nearestPlace = await findNearestPlace(latitude, longitude);
          setPickupLocation(nearestPlace);
          setLocationLoading(false);
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = '';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. You can still search manually.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Please enter address manually.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please enter address manually.';
              break;
            default:
              errorMessage = 'Unable to get location. Please enter address manually.';
          }
          
          setLocationError(errorMessage);
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    };

    // Only try to get location once on mount
    getCurrentLocation();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  // Helper function to get place type icon and label
  const getPlaceType = (item) => {
    const type = item.type || '';
    const category = item.class || '';
    
    // Map OSM types to readable labels
    const typeMap = {
      'hospital': '🏥 Hospital',
      'clinic': '🏥 Clinic',
      'college': '🎓 College',
      'university': '🎓 University',
      'school': '🏫 School',
      'restaurant': '🍽️ Restaurant',
      'cafe': '☕ Cafe',
      'hotel': '🏨 Hotel',
      'bank': '🏦 Bank',
      'atm': '🏧 ATM',
      'pharmacy': '💊 Pharmacy',
      'supermarket': '🛒 Supermarket',
      'mall': '🏬 Mall',
      'shopping': '🛍️ Shopping',
      'bus_station': '🚌 Bus Station',
      'train_station': '🚂 Train Station',
      'airport': '✈️ Airport',
      'park': '🌳 Park',
      'stadium': '🏟️ Stadium',
      'museum': '🏛️ Museum',
      'library': '📚 Library',
      'cinema': '🎬 Cinema',
      'police': '👮 Police',
      'fuel': '⛽ Fuel Station',
      'parking': '🅿️ Parking',
    };
    
    if (typeMap[type]) return typeMap[type];
    if (typeMap[category]) return typeMap[category];
    if (category === 'amenity') return '📍 Place';
    if (category === 'building') return '🏢 Building';
    if (category === 'highway') return '🛣️ Road';
    
    return '📍 Location';
  };

  // Search for locations using OpenStreetMap Nominatim API
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
      // Add a small delay to respect API rate limits
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=10&addressdetails=1&extratags=1&namedetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'RideSharingApp/1.0'
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
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
      console.error('Error searching location:', error);
      // Silently fail for better UX - user can still type manually
    }
  }, []);

  // Function to find nearby destinations based on pickup coordinates
  const findNearbyDestinations = useCallback(async (lat, lon) => {
    try {
      // Search for popular places within ~5km radius
      const categories = [
        'hospital',
        'college',
        'university',
        'shopping',
        'restaurant',
        'park',
        'station',
        'airport',
        'hotel',
        'mall'
      ];
      
      const allNearby = [];
      
      // Search for different categories
      for (let i = 0; i < Math.min(3, categories.length); i++) {
        const category = categories[i];
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${category}&lat=${lat}&lon=${lon}&limit=3&addressdetails=1&extratags=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'RideSharingApp/1.0'
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            // Filter places within 10km radius
            const nearby = data.filter(item => {
              const distance = calculateDistance(lat, lon, item.lat, item.lon);
              return distance <= 10; // Within 10km
            }).map(item => ({
              id: item.place_id,
              name: item.display_name,
              lat: item.lat,
              lon: item.lon,
              type: getPlaceType(item),
              category: item.class,
              distance: calculateDistance(lat, lon, item.lat, item.lon),
              isNearby: true
            }));
            
            allNearby.push(...nearby);
          }
          
          // Small delay to respect API limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          console.error('Error fetching nearby places:', err);
        }
      }
      
      // Remove duplicates and sort by distance
      const uniqueNearby = Array.from(
        new Map(allNearby.map(item => [item.id, item])).values()
      ).sort((a, b) => a.distance - b.distance).slice(0, 8);
      
      setNearbyDestinations(uniqueNearby);
      
      if (uniqueNearby.length > 0) {
        setDropSuggestions(uniqueNearby);
        setShowDropSuggestions(true);
      }
    } catch (error) {
      console.error('Error finding nearby destinations:', error);
    }
  }, []);

  // Helper function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
        // Only search if user is typing, don't override nearby suggestions
        searchLocation(dropLocation, false);
      } else if (dropLocation.length === 0 && nearbyDestinations.length > 0) {
        // Show nearby destinations when drop location is cleared
        setDropSuggestions(nearbyDestinations);
        setShowDropSuggestions(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [dropLocation, searchLocation, nearbyDestinations]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.location-input-container')) {
        setShowPickupSuggestions(false);
        setShowDropSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle suggestion selection
  const handlePickupSelect = async (suggestion) => {
    setPickupLocation(suggestion.name);
    const coords = { lat: parseFloat(suggestion.lat), lon: parseFloat(suggestion.lon) };
    setCurrentCoords(coords);
    setPickupCoords(coords);
    setShowPickupSuggestions(false);
    
    // Find nearby destinations for drop location
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
    const token = localStorage.getItem('token');
    const riderToken = localStorage.getItem('riderToken');
    
    if (!token && !riderToken) {
      setAuthWarning('Please sign up or login to search for rides');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Please login to search for rides' } });
      }, 2000);
      return;
    }
    
    // If authenticated, proceed to ride search page
    navigate('/ride-search', { 
      state: { 
        pickup: pickupLocation, 
        drop: dropLocation 
      } 
    });
  };
  
  // Manually trigger current location retrieval
  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentCoords({ lat: latitude, lon: longitude });
        
        // Find and set the nearest place from current location
        const nearestPlace = await findNearestPlace(latitude, longitude);
        setPickupLocation(nearestPlace);
        setLocationLoading(false);
        setLocationError(null);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = '';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable permissions and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Please enter address manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'Unable to get location. Please enter address manually.';
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
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <main className="relative pt-24 pb-16 overflow-hidden">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <section className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block px-4 py-2 bg-gray-100 rounded-full">
                  <span className="text-sm font-semibold text-black">
                    Share rides, Save money
                  </span>
                </div>

                <h1 className="text-5xl font-extrabold leading-tight text-black sm:text-6xl">
                  Go anywhere,
                  <span className="block mt-2">with anyone</span>
                </h1>

                <p className="max-w-xl text-lg leading-relaxed text-gray-600 sm:text-xl">
                  Join ongoing rides in your area and split the cost. Save up to
                  60% on every trip while making new connections.
                </p>
              </div>

              {/* Quick Booking Card */}
              <div className="p-6 bg-white border-2 border-black shadow-lg rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">
                    Find a shared ride now
                  </h3>
                  
                  {/* Current Location Button */}
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={locationLoading}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-black transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Use my current location"
                  >
                    {locationLoading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crosshair className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {locationLoading ? 'Getting...' : 'Use my location'}
                    </span>
                  </button>
                </div>
                
                {/* Location Error Message */}
                {locationError && (
                  <div className="p-3 mb-3 text-sm text-orange-700 border border-orange-200 rounded-lg bg-orange-50">
                    {locationError}
                  </div>
                )}
                
                {/* Auth Warning Message */}
                {authWarning && (
                  <div className="flex items-center gap-2 p-3 mb-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
                    <Shield className="w-4 h-4" />
                    {authWarning}
                  </div>
                )}

                <div className="space-y-3">
                  {/* Pickup Location */}
                  <div className="relative location-input-container">
                    <MapPin className="absolute z-10 w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                    <input
                      type="text"
                      placeholder="Pickup location"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      onFocus={() => pickupSuggestions.length > 0 && setShowPickupSuggestions(true)}
                      className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    />
                    
                    {/* Pickup Suggestions Dropdown */}
                    {showPickupSuggestions && pickupSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 overflow-y-auto bg-white border-2 border-gray-200 shadow-lg rounded-xl max-h-96">
                        {pickupSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.id}
                            onClick={() => handlePickupSelect(suggestion)}
                            className="flex items-start gap-3 px-4 py-3 transition-colors border-b border-gray-100 cursor-pointer hover:bg-gray-50 last:border-b-0"
                          >
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="mb-1 text-xs font-medium text-blue-600">{suggestion.type}</div>
                              <div className="text-sm text-gray-700 break-words">{suggestion.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Drop Location */}
                  <div className="relative location-input-container">
                    <MapPin className="absolute z-10 w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                    <input
                      type="text"
                      placeholder={pickupCoords ? "Drop location (nearby suggestions available)" : "Drop location"}
                      value={dropLocation}
                      onChange={(e) => setDropLocation(e.target.value)}
                      onFocus={() => {
                        if (dropSuggestions.length > 0) {
                          setShowDropSuggestions(true);
                        } else if (pickupCoords && nearbyDestinations.length === 0) {
                          findNearbyDestinations(pickupCoords.lat, pickupCoords.lon);
                        }
                      }}
                      className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    />
                    
                    {/* Drop Suggestions Dropdown */}
                    {showDropSuggestions && dropSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 overflow-y-auto bg-white border-2 border-gray-200 shadow-lg rounded-xl max-h-96">
                        {/* Header for nearby destinations */}
                        {dropSuggestions.some(s => s.isNearby) && (
                          <div className="sticky top-0 px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200 bg-gray-50">
                            📍 Nearby Destinations (within 10km)
                          </div>
                        )}
                        
                        {dropSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.id}
                            onClick={() => handleDropSelect(suggestion)}
                            className="flex items-start gap-3 px-4 py-3 transition-colors border-b border-gray-100 cursor-pointer hover:bg-gray-50 last:border-b-0"
                          >
                            <MapPin className={`w-5 h-5 mt-0.5 shrink-0 ${suggestion.isNearby ? 'text-green-500' : 'text-gray-400'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-blue-600">{suggestion.type}</span>
                                {suggestion.isNearby && suggestion.distance && (
                                  <span className="text-xs font-medium text-green-600">
                                    ~{suggestion.distance.toFixed(1)} km
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-700 break-words">{suggestion.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleSearchRide}
                    className="flex items-center justify-center w-full py-4 space-x-2 font-semibold text-white transition-all duration-200 bg-black rounded-xl hover:bg-gray-800 group"
                  >
                    <Search className="w-5 h-5" />
                    <span>Search available rides</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-black">50K+</div>
                  <div className="text-sm text-gray-600">Active riders</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div>
                  <div className="text-3xl font-bold text-black">1M+</div>
                  <div className="text-sm text-gray-600">Rides shared</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div>
                  <div className="text-3xl font-bold text-black">60%</div>
                  <div className="text-sm text-gray-600">Avg. savings</div>
                </div>
              </div>
            </section>

            {/* Right Image Carousel */}
            <section className="relative">
              <div className="relative overflow-hidden shadow-2xl rounded-3xl">
                {/* Image Carousel */}
                <div className="relative h-[600px]">
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={image.alt}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                        index === currentImageIndex
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation Dots */}
                <div className="absolute z-20 flex space-x-2 -translate-x-1/2 bottom-24 left-1/2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex
                          ? "bg-white w-8"
                          : "bg-white/50 hover:bg-white/75"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Floating Card */}
                <div className="absolute z-10 p-6 bg-white border border-gray-100 shadow-xl bottom-8 left-8 right-8 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 bg-black rounded-full">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-black">
                          3 riders going your way
                        </div>
                        <div className="text-sm text-gray-600">
                          Mumbai to Pune
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-2xl font-bold text-black">₹250</div>
                    <div className="text-sm text-gray-600 line-through">
                      ₹600
                    </div>
                    <div className="px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded-full">
                      Save 58%
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Element */}
              <div className="absolute w-32 h-32 bg-gray-100 rounded-full -top-4 -right-4 -z-10"></div>
              <div className="absolute w-24 h-24 bg-black rounded-full -bottom-4 -left-4 -z-10"></div>
            </section>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-black">
              How RIDEX works
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              Join rides already on the way and split costs with fellow
              travelers
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="p-8 transition-colors duration-300 bg-white border-2 border-gray-200 rounded-2xl hover:border-black">
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-black rounded-2xl">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-black">
                1. Search rides
              </h3>
              <p className="leading-relaxed text-gray-600">
                Enter your pickup and drop location. See all available rides
                going your way in real-time.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 transition-colors duration-300 bg-white border-2 border-gray-200 rounded-2xl hover:border-black">
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-black rounded-2xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-black">
                2. Join a ride
              </h3>
              <p className="leading-relaxed text-gray-600">
                Choose a ride based on time, price, and driver ratings. Book
                your seat instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 transition-colors duration-300 bg-white border-2 border-gray-200 rounded-2xl hover:border-black">
              <div className="flex items-center justify-center w-16 h-16 mb-6 bg-black rounded-2xl">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-black">
                3. Split & save
              </h3>
              <p className="leading-relaxed text-gray-600">
                Share the ride, share the cost. Pay only your fair share and
                save up to 60%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-bold text-black">
                Why choose shared rides?
              </h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-bold">
                      Save money on every trip
                    </h3>
                    <p className="text-gray-600">
                      Cut your travel costs by up to 60% by sharing rides with
                      others going the same way.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-bold">Meet new people</h3>
                    <p className="text-gray-600">
                      Connect with like-minded travelers and build your network
                      while commuting.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-bold">
                      Eco-friendly travel
                    </h3>
                    <p className="text-gray-600">
                      Reduce carbon emissions by sharing rides instead of taking
                      individual trips.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-bold">Safe & verified</h3>
                    <p className="text-gray-600">
                      All drivers are background-checked and rides are tracked
                      in real-time for your safety.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1556742393-d75f468bfcb0?auto=format&fit=crop&w=1200&q=80"
                alt="Happy riders"
                className="w-full h-[500px] object-cover rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-white bg-black">
        <div className="px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
          <h2 className="mb-6 text-4xl font-bold sm:text-5xl">
            Ready to start saving?
          </h2>
          <p className="max-w-2xl mx-auto mb-10 text-xl text-gray-300">
            Join thousands of riders who are already sharing rides and cutting
            costs
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="flex items-center px-8 py-4 space-x-2 font-semibold text-black transition-all duration-200 bg-white rounded-xl hover:bg-gray-100 group">
              <Link to="/login">Get a ride</Link>

              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="px-8 py-4 font-semibold text-white transition-all duration-200 border-2 border-white rounded-xl hover:bg-white hover:text-black">
              <Link to="/rider-login">Become a rider</Link>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 text-gray-400">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-white">4.8/5</span>
              <span>rating</span>
            </div>
            <div className="w-px h-6 bg-gray-700"></div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Verified drivers</span>
            </div>
            <div className="w-px h-6 bg-gray-700"></div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h4 className="mb-4 font-bold text-black">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    About us
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Press
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-black">Products</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Ride
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Drive
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Business
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-black">Support</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Help center
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Safety
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-black">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-black">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 mt-12 text-center text-gray-600 border-t border-gray-200">
            <p>
              &copy; 2024 RIDEX. All rights reserved. Go anywhere with anyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
