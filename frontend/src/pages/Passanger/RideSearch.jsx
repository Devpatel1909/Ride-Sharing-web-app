import React, { useState } from "react";
import { MapPin, Calendar, Clock, Users, Car, ArrowRight, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function RideSearch() {
  const navigate = useNavigate();
  const [rideType, setRideType] = useState("sharing"); // "sharing" or "personal"
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState(1);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for ride:", {
      rideType,
      pickup,
      destination,
      date,
      time,
      passengers,
    });
    // TODO: Navigate to results or call API
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/rider-login", { replace: true });
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
            <Link to="/my-rides" className="text-sm font-medium hover:text-gray-300 transition-colors">
              My Rides
            </Link>
            <Link to="/profile" className="text-sm font-medium hover:text-gray-300 transition-colors">
              Profile
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
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-black mb-2">Where would you like to go?</h1>
          <p className="text-gray-600">Find the perfect ride for your journey</p>
        </div>

        {/* Ride Type Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-lg font-semibold text-black mb-4">Choose your ride type</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Sharing Option */}
            <button
              onClick={() => setRideType("sharing")}
              className={`relative p-6 rounded-xl border-2 transition-all ${
                rideType === "sharing"
                  ? "border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {rideType === "sharing" && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Shared Ride</h3>
                <p className="text-gray-600 text-sm">
                  Share your ride with others going the same way. Save money and reduce carbon footprint.
                </p>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-green-600 font-semibold">Save up to 60%</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 text-sm">Eco-friendly</span>
                </div>
              </div>
            </button>

            {/* Personal Option */}
            <button
              onClick={() => setRideType("personal")}
              className={`relative p-6 rounded-xl border-2 transition-all ${
                rideType === "personal"
                  ? "border-black bg-gray-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {rideType === "personal" && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Car className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Personal Ride</h3>
                <p className="text-gray-600 text-sm">
                  Get a private ride just for you. Direct routes with no stops in between.
                </p>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-blue-600 font-semibold">Fastest option</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 text-sm">Private</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-semibold text-black mb-6">Enter your trip details</h2>
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Pickup Location */}
            <div>
              <label htmlFor="pickup" className="block mb-2 text-sm font-semibold text-black">
                Pickup Location
              </label>
              <div className="relative">
                <MapPin className="absolute w-5 h-5 text-green-500 -translate-y-1/2 left-4 top-1/2" />
                <input
                  type="text"
                  id="pickup"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Enter pickup location"
                  className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label htmlFor="destination" className="block mb-2 text-sm font-semibold text-black">
                Destination
              </label>
              <div className="relative">
                <MapPin className="absolute w-5 h-5 text-red-500 -translate-y-1/2 left-4 top-1/2" />
                <input
                  type="text"
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where are you going?"
                  className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block mb-2 text-sm font-semibold text-black">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="time" className="block mb-2 text-sm font-semibold text-black">
                  Time
                </label>
                <div className="relative">
                  <Clock className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="time"
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Passengers (for shared rides) */}
            {rideType === "sharing" && (
              <div>
                <label htmlFor="passengers" className="block mb-2 text-sm font-semibold text-black">
                  Number of Passengers
                </label>
                <div className="relative">
                  <Users className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <select
                    id="passengers"
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none appearance-none bg-white"
                  >
                    <option value={1}>1 Passenger</option>
                    <option value={2}>2 Passengers</option>
                    <option value={3}>3 Passengers</option>
                    <option value={4}>4 Passengers</option>
                  </select>
                </div>
              </div>
            )}

            {/* Search Button */}
            <button
              type="submit"
              className="flex items-center justify-center w-full py-4 space-x-2 font-semibold text-white transition-all duration-200 bg-black rounded-xl hover:bg-gray-800 group"
            >
              <Search className="w-5 h-5" />
              <span>Search {rideType === "sharing" ? "Shared" : "Personal"} Rides</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        </div>

        {/* Quick Info */}
        <div className="mt-8 grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-black mb-1">500+</div>
            <div className="text-sm text-gray-500">Drivers available</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-black mb-1">4.9★</div>
            <div className="text-sm text-gray-500">Average rating</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-black mb-1">2 min</div>
            <div className="text-sm text-gray-500">Avg. pickup time</div>
          </div>
        </div>
      </main>
    </div>
  );
}
