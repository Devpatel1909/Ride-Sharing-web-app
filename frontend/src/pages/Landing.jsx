import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";
export default function Landing() {
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [images.length]);

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
                <h3 className="mb-4 text-lg font-bold">
                  Find a shared ride now
                </h3>

                <div className="space-y-3">
                  <div className="relative">
                    <MapPin className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                    <input
                      type="text"
                      placeholder="Pickup location"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                    <input
                      type="text"
                      placeholder="Drop location"
                      value={dropLocation}
                      onChange={(e) => setDropLocation(e.target.value)}
                      className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    />
                  </div>

                  <button className="flex items-center justify-center w-full py-4 space-x-2 font-semibold text-white transition-all duration-200 bg-black rounded-xl hover:bg-gray-800 group">
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
              <Link to="/rider_login">Become a rider</Link>
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
