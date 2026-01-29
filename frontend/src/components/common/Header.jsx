import React, { useState, useEffect } from "react";
import { Menu, X, HelpCircle, Globe } from "lucide-react";
import { Link } from "react-router-dom";

export default function RideShareHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={` top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-white"
      }`}
    >
      {/* MAIN HEADER BAR */}
      <div className="px-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-between h-20">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-10">
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-black rounded-lg">
                <span className="text-lg font-bold text-white">R</span>
              </div>
              <div>
                <p className="text-xl font-bold leading-none">RIDEX</p>
                <p className="text-[10px] tracking-wide text-gray-500">
                  GO ANYWHERE WITH ANYONE
                </p>
              </div>
            </Link>

            {/* NAVIGATION (VISIBLE ON LAPTOP+) */}
            <nav className="items-center hidden gap-8 md:flex">
              <a href="#ride" className="text-sm font-medium hover:text-gray-600">
                Ride
              </a>
              <a href="#drive" className="text-sm font-medium hover:text-gray-600">
                Drive
              </a>
              <a href="#about" className="text-sm font-medium hover:text-gray-600">
                About
              </a>
              <a href="#pricing" className="text-sm font-medium hover:text-gray-600">
                Pricing
              </a>
            </nav>
          </div>

          {/* RIGHT SIDE ACTIONS (VISIBLE ON LAPTOP+) */}
          <div className="items-center hidden gap-4 md:flex">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <HelpCircle className="w-5 h-5" />
            </button>

            <button className="p-2 rounded-full hover:bg-gray-100">
              <Globe className="w-5 h-5" />
            </button>

            <div className="w-px h-8 mx-2 bg-gray-300" />

            <Link
              to="/login"
              className="px-5 py-2 text-sm font-medium rounded-full hover:bg-gray-100"
            >
              Rider Login
            </Link>

            <Link
              to="/captain-login"
              className="px-5 py-2 text-sm font-medium rounded-full hover:bg-gray-100"
            >
              Captain Login
            </Link>

            <Link
              to="/signup"
              className="px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800"
            >
              Sign up
            </Link>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg md:hidden hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 border-t ${
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-4 space-y-3 bg-white">
          <a href="#ride" className="block py-2">Ride</a>
          <a href="#drive" className="block py-2">Drive</a>
          <a href="#about" className="block py-2">About</a>

          <div className="pt-4 space-y-3 border-t">
            <Link to="/login" className="block py-2">Rider Login</Link>
            <Link to="/captain-login" className="block py-2">Captain Login</Link>
            <Link
              to="/signup"
              className="block py-3 text-center text-white bg-black rounded-full"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>

      {/* BOTTOM BORDER */}
      <div className="h-px bg-gray-200" />
    </header>
  );
}
