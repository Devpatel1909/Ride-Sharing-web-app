import React, { useState, useEffect } from "react";
import { HelpCircle, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function RideShareHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      {/* MAIN HEADER BAR */}
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LEFT SIDE */}
          <div className="flex items-center">
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-10 h-10 text-xl font-bold text-white transition-colors bg-black rounded-lg group-hover:bg-gray-800">
                R
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-none">RIDEX</span>
                <span className="text-[10px] text-gray-600 leading-none">
                  GO ANYWHERE WITH ANYONE
                </span>
              </div>
            </Link>
          </div>

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex items-center gap-3">
            {/* Help & Language Icons (Always visible) */}
            <button className="p-2 transition-colors rounded-lg hover:bg-gray-100">
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 transition-colors rounded-lg hover:bg-gray-100">
              <Globe className="w-5 h-5 text-gray-600" />
            </button>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2">
              <Link
                to="/rider-login"
                className="px-4 py-2 font-medium text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
              >
                Login as a Rider 
              </Link>
           
              <Link
                to="/signup"
                className="px-4 py-2 font-medium text-white transition-colors bg-black rounded-lg hover:bg-gray-800"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BORDER */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
    </header>
  );
}