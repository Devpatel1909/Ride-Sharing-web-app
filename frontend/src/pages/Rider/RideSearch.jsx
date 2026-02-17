import React, { useState, useMemo } from "react";
import { MapPin, ArrowRight, Car, Bike, Truck, Users, DollarSign, Navigation, Loader } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

// Vehicle options with pricing per km (moved outside component to avoid re-creation)
const VEHICLES = [
  {
    id: "bike",
    name: "Bike",
    icon: Bike,
    sharedRate: 8, // ₹8 per km
    personalRate: 12, // ₹12 per km
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
  
  // Get locations from navigation state
  const [pickup, setPickup] = useState(location.state?.pickup || "");
  const [destination, setDestination] = useState(location.state?.drop || "");
  
  // Vehicle and ride type states
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [rideType, setRideType] = useState("shared"); // "shared" or "personal"
  
  // Distance and pricing states
  const [distance, setDistance] = useState(0);
  const [calculationDone, setCalculationDone] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate distance between two locations using Haversine formula
  const calculateDistance = async () => {
    if (!pickup || !destination) {
      alert("Please enter both pickup and destination");
      return;
    }

    setIsCalculating(true);

    try {
      // Add a small delay to respect Nominatim usage policy
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Geocode pickup location
      const pickupResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickup)}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!pickupResponse.ok) {
        throw new Error('Failed to geocode pickup location');
      }

      const pickupData = await pickupResponse.json();

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Geocode destination location
      const destResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!destResponse.ok) {
        throw new Error('Failed to geocode destination');
      }

      const destData = await destResponse.json();

      if (pickupData.length === 0 || destData.length === 0) {
        // Fallback: Ask user to enter distance manually
        const manualDistance = prompt(
          "Could not find one or both locations. Please enter the distance in kilometers manually:",
          "10"
        );
        
        if (manualDistance && !isNaN(manualDistance) && parseFloat(manualDistance) > 0) {
          setDistance(parseFloat(manualDistance));
          setCalculationDone(true);
        }
        setIsCalculating(false);
        return;
      }

      const lat1 = parseFloat(pickupData[0].lat);
      const lon1 = parseFloat(pickupData[0].lon);
      const lat2 = parseFloat(destData[0].lat);
      const lon2 = parseFloat(destData[0].lon);

      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const calculatedDistance = R * c;

      setDistance(Math.round(calculatedDistance * 10) / 10); // Round to 1 decimal
      setCalculationDone(true);
    } catch (error) {
      console.error("Error calculating distance:", error);
      
      // Fallback: Allow manual distance entry
      const manualDistance = prompt(
        "Unable to calculate distance automatically. Please enter the distance in kilometers manually:",
        "10"
      );
      
      if (manualDistance && !isNaN(manualDistance) && parseFloat(manualDistance) > 0) {
        setDistance(parseFloat(manualDistance));
        setCalculationDone(true);
      } else {
        alert("Please enter a valid distance to continue.");
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Convert degrees to radians
  const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  // Calculate prices using useMemo to avoid unnecessary recalculations
  const { sharedPrice, personalPrice } = useMemo(() => {
    if (selectedVehicle && distance > 0) {
      const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
      if (vehicle) {
        const baseFare = 30; // ₹30 base fare
        const shared = baseFare + (distance * vehicle.sharedRate);
        const personal = baseFare + (distance * vehicle.personalRate);
        
        return {
          sharedPrice: Math.round(shared),
          personalPrice: Math.round(personal)
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
    
    const bookingData = {
      pickup,
      destination,
      vehicle: VEHICLES.find(v => v.id === selectedVehicle).name,
      rideType,
      distance,
      price: rideType === "shared" ? sharedPrice : personalPrice
    };
    
    console.log("Booking ride:", bookingData);
    // TODO: Navigate to booking confirmation or call API
    alert(`Booking ${rideType} ride with ${bookingData.vehicle} for ₹${bookingData.price}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("riderToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rider");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
            <Link to="/" className="text-sm font-medium hover:text-gray-300 transition-colors">
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Book Your Ride</h1>
          <p className="text-gray-600">Choose your vehicle and get instant fare estimate</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Location & Vehicle Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-black mb-4">Trip Details</h2>
              
              <div className="space-y-4">
                {/* Pickup Location */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute w-5 h-5 text-green-500 -translate-y-1/2 left-4 top-1/2" />
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Enter pickup location"
                      className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin className="absolute w-5 h-5 text-red-500 -translate-y-1/2 left-4 top-1/2" />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Where are you going?"
                      className="w-full py-3 pl-12 pr-4 border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                {/* Calculate Distance Button */}
                <button
                  onClick={calculateDistance}
                  disabled={isCalculating}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCalculating ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                  {isCalculating ? 'Calculating...' : 'Calculate Distance'}
                </button>

                {/* Distance Display */}
                {calculationDone && distance > 0 && (
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">Estimated Distance:</span>
                      <span className="text-2xl font-bold text-blue-600">{distance} km</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Selection */}
            {calculationDone && distance > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-black mb-4">Choose Your Vehicle</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {VEHICLES.map((vehicle) => {
                    const VehicleIcon = vehicle.icon;
                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedVehicle === vehicle.id
                            ? "border-black bg-gray-50"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <VehicleIcon className="w-10 h-10 mb-2" />
                          <h3 className="font-bold text-black">{vehicle.name}</h3>
                          <p className="text-xs text-gray-600 mb-1">{vehicle.description}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
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
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-black mb-4">Ride Type</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Shared Ride */}
                  <button
                    onClick={() => setRideType("shared")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      rideType === "shared"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Users className="w-10 h-10 mb-2 text-green-600" />
                      <h3 className="font-bold text-black mb-1">Shared Ride</h3>
                      <p className="text-xs text-gray-600 mb-2">Save money by sharing</p>
                      <div className="flex items-center gap-1 text-green-600 font-bold">
                        <DollarSign className="w-4 h-4" />
                        <span>₹{sharedPrice}</span>
                      </div>
                    </div>
                  </button>

                  {/* Personal Ride */}
                  <button
                    onClick={() => setRideType("personal")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      rideType === "personal"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Car className="w-10 h-10 mb-2 text-blue-600" />
                      <h3 className="font-bold text-black mb-1">Personal Ride</h3>
                      <p className="text-xs text-gray-600 mb-2">Private & comfortable</p>
                      <div className="flex items-center gap-1 text-blue-600 font-bold">
                        <DollarSign className="w-4 h-4" />
                        <span>₹{personalPrice}</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Price Summary */}
          {selectedVehicle && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold text-black mb-4">Fare Breakdown</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-semibold">{VEHICLES.find(v => v.id === selectedVehicle)?.name}</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-semibold">{distance} km</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Ride Type:</span>
                    <span className="font-semibold capitalize">{rideType}</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Base Fare:</span>
                    <span className="font-semibold">₹30</span>
                  </div>
                  
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Per km rate:</span>
                    <span className="font-semibold">
                      ₹{rideType === "shared" 
                        ? VEHICLES.find(v => v.id === selectedVehicle)?.sharedRate 
                        : VEHICLES.find(v => v.id === selectedVehicle)?.personalRate}
                    </span>
                  </div>
                  
                  <div className="flex justify-between py-3 mt-3 bg-gray-50 rounded-lg px-3">
                    <span className="text-lg font-bold">Total Fare:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{rideType === "shared" ? sharedPrice : personalPrice}
                    </span>
                  </div>
                </div>

                {/* Book Ride Button */}
                <button
                  onClick={handleBookRide}
                  className="w-full mt-6 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Book Ride</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Price Comparison */}
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800 text-center">
                    💡 Save ₹{personalPrice - sharedPrice} by choosing shared ride!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
