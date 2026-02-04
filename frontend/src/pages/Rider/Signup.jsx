import React, { useState, useRef } from "react";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Phone, Camera, Car, CreditCard, Palette, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function RiderAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // License state
  const [licenseNumber, setLicenseNumber] = useState("");
  
  // Vehicle state
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleCapacity, setVehicleCapacity] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Login:", { loginEmail, loginPassword, rememberMe });
    localStorage.setItem("isLoggedIn", "true");
    navigate("/ride-search", { replace: true });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    const formData = {
      firstName,
      lastName,
      email: signupEmail,
      phone: signupPhone,
      password: signupPassword,
      profilePhoto,
      licenseNumber,
      vehicle: {
        plate: vehiclePlate,
        color: vehicleColor,
        capacity: vehicleCapacity,
        type: vehicleType,
        model: vehicleModel,
      },
    };
    console.log("Signup:", formData);
    localStorage.setItem("isLoggedIn", "true");
    navigate("/ride-search", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Form */}
      <div className="flex items-start justify-center w-full p-8 overflow-y-auto lg:w-1/2">
        <div className="w-full max-w-md py-8">
          {/* Logo */}
          <Link to="/" className="flex items-center mb-8 space-x-2">
            <div className="relative">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="black" />
                <path
                  d="M12 20L18 14L24 20L30 14"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 26L18 20L24 26L30 20"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-black">
                RIDEX
              </span>
            </div>
          </Link>

          {/* Tab Switcher */}
          <div className="flex p-1 mb-8 bg-gray-100 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
                isLogin
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
                !isLogin
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-black">
              {isLogin ? "Welcome back" : "Become a Rider"}
            </h1>
            <p className="text-gray-600">
              {isLogin
                ? "Sign in to continue your journey"
                : "Create your rider account and start earning"}
            </p>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block mb-2 text-sm font-semibold text-black"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="email"
                    id="login-email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block mb-2 text-sm font-semibold text-black"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    id="login-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full py-4 pl-12 pr-12 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute text-gray-400 transition-colors -translate-y-1/2 right-4 top-1/2 hover:text-black"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-sm text-gray-600 cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-black transition-colors hover:text-gray-600"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="flex items-center justify-center w-full py-4 space-x-2 font-semibold text-white transition-all duration-200 bg-black rounded-xl hover:bg-gray-800 group"
              >
                <span>Sign in</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Profile Photo Upload */}
              <div className="flex flex-col items-center mb-6">
                <label className="block mb-3 text-sm font-semibold text-black">
                  Profile Photo
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 overflow-hidden transition-all border-2 border-gray-200 border-dashed rounded-full cursor-pointer hover:border-black group"
                >
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Profile preview" 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-50 group-hover:bg-gray-100">
                      <Camera className="w-8 h-8 text-gray-400" />
                      <span className="mt-1 text-xs text-gray-500">Upload</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden"
                />
                <p className="mt-2 text-xs text-gray-500">Click to upload your photo</p>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="first-name"
                    className="block mb-2 text-sm font-semibold text-black"
                  >
                    First name
                  </label>
                  <div className="relative">
                    <User className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                    <input
                      type="text"
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="last-name"
                    className="block mb-2 text-sm font-semibold text-black"
                  >
                    Last name
                  </label>
                  <div className="relative">
                    <User className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                    <input
                      type="text"
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block mb-2 text-sm font-semibold text-black"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="email"
                    id="signup-email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label
                  htmlFor="signup-phone"
                  className="block mb-2 text-sm font-semibold text-black"
                >
                  Phone number
                </label>
                <div className="relative">
                  <Phone className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="tel"
                    id="signup-phone"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block mb-2 text-sm font-semibold text-black"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    id="signup-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full py-4 pl-12 pr-12 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute text-gray-400 transition-colors -translate-y-1/2 right-4 top-1/2 hover:text-black"
                  >
                    {showSignupPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* License Number */}
              <div>
                <label
                  htmlFor="license-number"
                  className="block mb-2 text-sm font-semibold text-black"
                >
                  Driver's License Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="text"
                    id="license-number"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Enter your license number"
                    className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Vehicle Information Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="mb-4 text-lg font-semibold text-black">Vehicle Information</h3>
                
                {/* Vehicle Type & Model */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="vehicle-type"
                      className="block mb-2 text-sm font-semibold text-black"
                    >
                      Vehicle Type
                    </label>
                    <div className="relative">
                      <Car className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                      <select
                        id="vehicle-type"
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full py-4 pl-12 pr-4 transition-colors bg-white border-2 border-gray-200 appearance-none rounded-xl focus:border-black focus:outline-none"
                        required
                      >
                        <option value="" disabled>Select type</option>
                        <option value="car">Car</option>
                        <option value="auto">Auto</option>
                        <option value="moto">Motorcycle</option>
                        <option value="suv">SUV</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="vehicle-model"
                      className="block mb-2 text-sm font-semibold text-black"
                    >
                      Vehicle Model
                    </label>
                    <div className="relative">
                      <Car className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                      <input
                        type="text"
                        id="vehicle-model"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="e.g., Toyota Camry"
                        className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Plate & Color */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="vehicle-plate"
                      className="block mb-2 text-sm font-semibold text-black"
                    >
                      Plate Number
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                      <input
                        type="text"
                        id="vehicle-plate"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        placeholder="e.g., ABC 1234"
                        className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="vehicle-color"
                      className="block mb-2 text-sm font-semibold text-black"
                    >
                      Vehicle Color
                    </label>
                    <div className="relative">
                      <Palette className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                      <input
                        type="text"
                        id="vehicle-color"
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                        placeholder="e.g., Black"
                        className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Capacity */}
                <div>
                  <label
                    htmlFor="vehicle-capacity"
                    className="block mb-2 text-sm font-semibold text-black"
                  >
                    Passenger Capacity
                  </label>
                  <div className="relative">
                    <Users className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                    <select
                      id="vehicle-capacity"
                      value={vehicleCapacity}
                      onChange={(e) => setVehicleCapacity(e.target.value)}
                      className="w-full py-4 pl-12 pr-4 transition-colors bg-white border-2 border-gray-200 appearance-none rounded-xl focus:border-black focus:outline-none"
                      required
                    >
                      <option value="" disabled>Select capacity</option>
                      <option value="1">1 passenger</option>
                      <option value="2">2 passengers</option>
                      <option value="3">3 passengers</option>
                      <option value="4">4 passengers</option>
                      <option value="5">5 passengers</option>
                      <option value="6">6+ passengers</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 border-2 border-gray-300 rounded cursor-pointer"
                  required
                />
                <label
                  htmlFor="terms"
                  className="ml-2 text-sm text-gray-600 cursor-pointer"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="font-semibold text-black hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="font-semibold text-black hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="flex items-center justify-center w-full py-4 space-x-2 font-semibold text-white transition-all duration-200 bg-black rounded-xl hover:bg-gray-800 group"
              >
                <span>Create Rider Account</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or continue with</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>


          {/* Toggle Link */}
          <p className="mt-8 text-center text-gray-600">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="font-semibold text-black transition-colors hover:text-gray-600"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="font-semibold text-black transition-colors hover:text-gray-600"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="relative hidden bg-black lg:block lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80"
          alt="Riders on the road"
          className="absolute inset-0 object-cover w-full h-full opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-transparent"></div>

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <h2 className="mb-4 text-4xl font-bold">
            {isLogin
              ? "Go anywhere with anyone"
              : "Start earning on your schedule"}
          </h2>
          <p className="mb-8 text-xl text-gray-200">
            {isLogin
              ? "Join thousands of riders sharing rides and saving money every day."
              : "Become a rider and earn flexible income while helping people get around."}
          </p>
          <div className="flex items-center space-x-8">
            <div>
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm text-gray-300">Active riders</div>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div>
              <div className="text-3xl font-bold">
                {isLogin ? "60%" : "$2.5M"}
              </div>
              <div className="text-sm text-gray-300">
                {isLogin ? "Avg. savings" : "Weekly earnings"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}