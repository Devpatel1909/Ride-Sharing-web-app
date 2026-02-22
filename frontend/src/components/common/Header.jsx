import React, { useState, useEffect } from "react";
import { HelpCircle, Globe, User, LogOut, Settings, UserCircle, Sparkles, Car, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function RideShareHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const riderToken = localStorage.getItem('riderToken');
      const user = localStorage.getItem('user');
      const rider = localStorage.getItem('rider');

      if (token || riderToken) {
        setIsAuthenticated(true);
        
        // Get user name
        if (user) {
          try {
            const userData = JSON.parse(user);
            setUserName(userData.name || userData.email || "User");
          } catch {
            setUserName("User");
          }
        } else if (rider) {
          try {
            const riderData = JSON.parse(rider);
            setUserName(riderData.name || riderData.email || "Rider");
          } catch {
            setUserName("Rider");
          }
        }
      } else {
        setIsAuthenticated(false);
        setUserName("");
      }
    };

    checkAuth();
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('riderToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rider');
    setIsAuthenticated(false);
    setUserName("");
    setShowProfileMenu(false);
    navigate('/');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userName) return "U";
    const names = userName.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* UberMove font is loaded globally via uber-move.css */}
      <style>{`
        /* Additional UberMove optimizations for header */
        header {
          font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
      `}</style>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-2xl shadow-2xl shadow-slate-900/10 border-b-2 border-blue-100/50" 
            : "bg-white/60 backdrop-blur-xl border-b border-slate-200/50"
        }`}
      >
        {/* Gradient Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700"></div>

        {/* MAIN HEADER BAR */}
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* LEFT SIDE */}
            <div className="flex items-center">
              {/* LOGO */}
              <Link to="/" className="flex items-center gap-4 group">
                <div className="relative flex items-center justify-center text-2xl font-bold text-white transition-all shadow-2xl w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 rounded-2xl shadow-blue-500/50 group-hover:shadow-blue-600/70 group-hover:scale-110 group-hover:rotate-3">
                  <span className="relative z-10 font-display">R</span>
                  <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl group-hover:opacity-100"></div>
                  
                  {/* Sparkle effect */}
                  <div className="absolute w-3 h-3 transition-opacity bg-yellow-400 rounded-full opacity-0 -top-1 -right-1 group-hover:opacity-100 animate-ping"></div>
                  <div className="absolute w-2 h-2 transition-opacity rounded-full opacity-0 -bottom-1 -left-1 bg-cyan-400 group-hover:opacity-100 animate-ping animation-delay-300"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold leading-none tracking-tight text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text font-display">
                    RIDEX
                  </span>
                  <span className="text-[10px] text-slate-500 leading-none tracking-wider font-bold uppercase font-display">
                    Go Anywhere With Anyone
                  </span>
                </div>
              </Link>
            </div>

            {/* RIGHT SIDE ACTIONS */}
            <div className="flex items-center gap-3">
              {/* Help & Language Icons */}
              <button 
                className="relative p-3 overflow-hidden transition-all rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 text-slate-600 hover:text-blue-600 group"
                aria-label="Help"
              >
                <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:opacity-10"></div>
                <HelpCircle className="relative z-10 w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              </button>
              
              <button 
                className="relative p-3 overflow-hidden transition-all rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 text-slate-600 hover:text-blue-600 group"
                aria-label="Language"
              >
                <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:opacity-10"></div>
                <Globe className="relative z-10 w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              </button>

              {/* Gradient Divider */}
              <div className="w-px h-8 mx-2 bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>

              {/* Auth Buttons / Profile */}
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <div className="relative profile-menu-container">
                    {/* Profile Button */}
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center gap-3 px-5 py-3 font-semibold transition-all text-slate-700 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 group"
                    >
                      <div className="relative flex items-center justify-center w-10 h-10 text-sm font-bold text-white transition-all shadow-lg bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 rounded-xl shadow-blue-500/30 group-hover:shadow-blue-600/50 group-hover:scale-105">
                        {getUserInitials()}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                      </div>
                      <span className="hidden font-display sm:inline">{userName}</span>
                      <svg 
                        className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                      <div className="absolute right-0 w-64 mt-3 overflow-hidden border-2 border-blue-100 shadow-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-slate-900/20 animate-fade-in">
                        {/* Gradient Top Border */}
                        <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700"></div>
                        
                        {/* User Info */}
                        <div className="px-5 py-4 border-b-2 border-blue-100 bg-gradient-to-br from-blue-50 via-purple-50 to-purple-100">
                          <div className="flex items-center gap-4">
                            <div className="relative flex items-center justify-center w-12 h-12 text-base font-bold text-white shadow-lg bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 rounded-xl shadow-blue-500/30">
                              {getUserInitials()}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate text-slate-900 font-display">
                                {userName}
                              </p>
                              <p className="text-xs font-semibold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                                Signed in
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            to="/profile"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-4 px-5 py-3 text-sm font-semibold transition-all text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 group"
                          >
                            <div className="flex items-center justify-center w-10 h-10 transition-all bg-slate-100 rounded-xl group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-purple-600 group-hover:shadow-lg">
                              <UserCircle className="w-5 h-5 transition-colors text-slate-600 group-hover:text-white" />
                            </div>
                            <span className="font-display">My Profile</span>
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-4 px-5 py-3 text-sm font-semibold transition-all text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 group"
                          >
                            <div className="flex items-center justify-center w-10 h-10 transition-all bg-slate-100 rounded-xl group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-purple-600 group-hover:shadow-lg">
                              <Settings className="w-5 h-5 transition-colors text-slate-600 group-hover:text-white" />
                            </div>
                            <span className="font-display">Settings</span>
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t-2 border-blue-100">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full gap-4 px-5 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 group"
                          >
                            <div className="flex items-center justify-center w-10 h-10 transition-all bg-red-100 rounded-xl group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-rose-600 group-hover:shadow-lg">
                              <LogOut className="w-5 h-5 text-red-600 transition-all group-hover:text-white group-hover:translate-x-1" />
                            </div>
                            <span className="font-display">Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center gap-2 px-5 py-3 font-semibold transition-all duration-300 ease-out text-slate-700 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 group font-display"
                    >
                      <div className="flex items-center justify-center w-8 h-8 transition-all duration-300 ease-out bg-blue-100 rounded-lg group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-purple-600 group-hover:shadow-lg group-hover:scale-110">
                        <Users className="w-4 h-4 text-blue-600 transition-colors group-hover:text-white" />
                      </div>
                      <span className="hidden md:inline">User Login</span>
                      <span className="md:hidden">User</span>
                    </Link>

                    <Link
                      to="/rider-login"
                      className="flex items-center gap-2 px-5 py-3 font-semibold text-purple-700 transition-all duration-300 ease-out border-2 border-purple-200 rounded-2xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 hover:border-purple-400 group font-display"
                    >
                      <div className="flex items-center justify-center w-8 h-8 transition-all duration-300 ease-out bg-purple-100 rounded-lg group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:to-blue-600 group-hover:shadow-lg group-hover:scale-110">
                        <Car className="w-4 h-4 text-purple-600 transition-colors group-hover:text-white" />
                      </div>
                      <span className="hidden md:inline">Rider Login</span>
                      <span className="md:hidden">Rider</span>
                    </Link>
               
                    <Link
                      to="/signup"
                      className="relative px-6 py-3 overflow-hidden font-bold text-white transition-all duration-300 ease-out shadow-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-purple-800 shadow-blue-500/50 hover:shadow-blue-600/70 hover:-translate-y-1 hover:scale-105 group font-display"
                    >
                      {/* Animated gradient background */}
                      <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-r from-purple-700 via-purple-600 to-blue-600 group-hover:opacity-100"></div>
                      
                      {/* Sparkle effect */}
                      <Sparkles className="absolute w-4 h-4 text-yellow-300 transition-opacity opacity-0 top-1 right-1 group-hover:opacity-100 animate-pulse" />
                      
                      <span className="relative z-10">Sign up</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM GRADIENT BORDER */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>

        <style>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .animation-delay-300 {
            animation-delay: 0.3s;
          }
          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          .animate-ping {
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}</style>
      </header>
    </>
  );
}