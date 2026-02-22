import React, { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Phone, Camera, Car, CreditCard, Palette, Users, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

/**
 * ============================================
 * VEHICLE & LICENSE API CONFIGURATION STATUS
 * ============================================
 * 
 * 📖 See detailed setup guide: /API_CONFIGURATION_GUIDE.md
 * 
 * ⚠️ VEHICLE API: CONFIGURED BUT API PROVIDER HAS ISSUES
 * API: Vehicle RC Information V2 (RapidAPI)
 * Endpoint: https://vehicle-rc-information-v2.p.rapidapi.com/
 * Status: API experiencing "Provider configuration error" 
 * Issue: The API provider's backend is having issues parsing responses
 * Workaround: Users can manually enter vehicle details
 * Location: fetchVehicleDetails() function (line ~220)
 * Auto-fetch: Currently disabled to prevent failed API spam
 * 
 * ⚠️ LICENSE API: MOCK MODE (Format validation only)
 * Status: Validates license number format, no real API verification yet
 * Location: verifyLicenseDetails() function (line ~90)
 * To enable: Replace placeholder URL with actual license verification API
 * 
 * How Vehicle Fetch Works (when API is functional):
 * 1. User enters vehicle number (e.g., DL01AB1234)
 * 2. Clicks "Search Vehicle Details" button
 * 3. API attempts to fetch: Model, Color, Capacity, Type
 * 4. If successful: Fields auto-fill (user can edit if needed)
 * 5. If failed: User enters details manually
 */

export default function RiderAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  // Check if rider is already logged in and redirect to dashboard
  useEffect(() => {
    const riderToken = localStorage.getItem('riderToken');
    const rider = localStorage.getItem('rider');
    
    if (riderToken && rider) {
      // Rider is already logged in, redirect to dashboard
      navigate('/rider/dashboard', { replace: true });
    }
  }, [navigate]);
  
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
  const [fetchingLicenseDetails, setFetchingLicenseDetails] = useState(false);
  const [licenseFetchError, setLicenseFetchError] = useState("");
  const [licenseFetchSuccess, setLicenseFetchSuccess] = useState("");
  const [licenseVerified, setLicenseVerified] = useState(false);
  const [licenseHolderName, setLicenseHolderName] = useState("");
  
  // Vehicle state
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleCapacity, setVehicleCapacity] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [fetchingVehicleDetails, setFetchingVehicleDetails] = useState(false);
  const [vehicleFetchError, setVehicleFetchError] = useState("");
  const [vehicleFetchSuccess, setVehicleFetchSuccess] = useState("");

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

  // Function to verify license details from Indian driving license API
  const verifyLicenseDetails = async (licenseNo) => {
    setFetchingLicenseDetails(true);
    setLicenseFetchError("");
    setLicenseFetchSuccess("");
    setLicenseVerified(false);

    try {
      // Format the license number (remove spaces and hyphens)
      const formattedNumber = licenseNo.replace(/[\s-]+/g, '').toUpperCase();

      // Note: This is a placeholder. You'll need to replace this with an actual API
      // Popular options:
      // 1. Parivahan Sarthi API (Official Government API)
      // 2. RapidAPI Driving License Verification
      // 3. Vahan/Sarathi API (https://parivahan.gov.in/)
      
      const response = await fetch(`https://api.example.com/license-verify/${formattedNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add your API key here
          // 'X-RapidAPI-Key': 'YOUR_API_KEY',
        },
      });

      if (!response.ok) {
        throw new Error('License verification failed');
      }

      const data = await response.json();

      // Check if license is valid and active
      if (data.isValid || data.status === 'ACTIVE') {
        setLicenseVerified(true);
        
        // Store license holder name if available
        if (data.holderName || data.name) {
          setLicenseHolderName(data.holderName || data.name);
        }
        
        // Check if name matches with signup name
        const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
        const holderName = (data.holderName || data.name || '').toLowerCase();
        
        if (holderName && fullName && holderName.includes(fullName.split(' ')[0])) {
          setLicenseFetchSuccess('License verified successfully! Name matches.');
        } else if (holderName) {
          setLicenseFetchSuccess(`License verified! Holder: ${data.holderName || data.name}`);
        } else {
          setLicenseFetchSuccess('License verified successfully!');
        }
        
        setTimeout(() => setLicenseFetchSuccess(''), 5000);
      } else {
        throw new Error('License is not valid or expired');
      }
    } catch (error) {
      console.error('Error verifying license:', error);
      
      // For demo purposes, provide mock verification if API fails
      // Remove this in production
      if (licenseNo.trim().length > 0 && isValidIndianLicenseNumber(licenseNo)) {
        setLicenseVerified(true);
        setLicenseFetchSuccess('License format is valid (API not configured for full verification)');
        setTimeout(() => setLicenseFetchSuccess(''), 5000);
      } else {
        setLicenseFetchError('Invalid license number or verification failed. Please check the format.');
        setTimeout(() => setLicenseFetchError(''), 5000);
      }
    } finally {
      setFetchingLicenseDetails(false);
    }
  };

  // Handle license number change
  const handleLicenseNumberChange = (e) => {
    const value = e.target.value.toUpperCase();
    setLicenseNumber(value);
    setLicenseVerified(false);
    setLicenseFetchError("");
    setLicenseFetchSuccess("");
  };

  // Handle manual license verification button click
  const handleVerifyLicense = () => {
    if (!licenseNumber.trim()) {
      setLicenseFetchError('Please enter a license number first');
      setTimeout(() => setLicenseFetchError(''), 3000);
      return;
    }

    if (!isValidIndianLicenseNumber(licenseNumber)) {
      setLicenseFetchError('Invalid Indian license format (e.g., DL0120220012345)');
      setTimeout(() => setLicenseFetchError(''), 3000);
      return;
    }

    verifyLicenseDetails(licenseNumber);
  };

  // Function to validate Indian driving license format
  const isValidIndianLicenseNumber = (number) => {
    // Indian driving license format: XX##-YYYY####### or XX##YYYY#######
    // Example: DL0120220012345 (Delhi, RTO 01, Issued in 2022, Serial 0012345)
    // XX = State code (2 letters), ## = RTO code (2 digits), YYYY = Year of issue, ####### = Serial number (7 digits)
    const pattern = /^[A-Z]{2}\s?\d{2}\s?-?\s?\d{4}\s?\d{7}$/i;
    return pattern.test(number.trim());
  };

  // Function to validate Indian vehicle number format
  const isValidIndianVehicleNumber = (number) => {
    // Indian vehicle number format: XX ## XX #### or XX##XX####
    const pattern = /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{1,4}$/i;
    return pattern.test(number.trim());
  };

  // Function to fetch vehicle details from Indian vehicle registration API
  const fetchVehicleDetails = async (registrationNumber) => {
    setFetchingVehicleDetails(true);
    setVehicleFetchError("");
    setVehicleFetchSuccess("");

    try {
      // Format the registration number (remove spaces)
      const formattedNumber = registrationNumber.replace(/\s+/g, '').toUpperCase();

      // ============================================
      // RapidAPI - Vehicle RC Information V2
      // ============================================
      // API: https://rapidapi.com/suneetk92/api/vehicle-rc-information-v2
      // Using your RapidAPI key for vehicle registration details
      
      // Prefer using an environment variable injected by Vite.
      // Set your RapidAPI key in a `.env` file at the project root as:
      // VITE_RAPIDAPI_KEY=your_rapidapi_key
      const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '5ee5ed2c5amsh256b99057ea4d2bp1db86ajsndcfaffe8cb85';

      if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key_here') {
        throw new Error('API key not configured. Please add VITE_RAPIDAPI_KEY to your .env file.');
      }

      const response = await fetch('https://vehicle-rc-information-v2.p.rapidapi.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'vehicle-rc-information-v2.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        },
        body: JSON.stringify({
          vehicle_number: formattedNumber
        })
      });
      
      // Check for API errors
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your RapidAPI configuration.');
      }
      
      if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      
      if (!response.ok) {
        // Try to get error details from response
        let errorData = {};
        const responseText = await response.text();
        
        try {
          errorData = JSON.parse(responseText);
        } catch {
          console.error('Failed to parse error response:', responseText);
        }
        
        throw new Error(errorData.message || 'Vehicle details not found');
      }
      
      // Parse response with better error handling
      let data;
      const responseText = await response.text();
      
      try {
        data = JSON.parse(responseText);
        console.log('API Response:', data); // For debugging
      } catch {
        console.error('Failed to parse API response:', responseText);
        throw new Error('API_PARSE_ERROR');
      }
      
      // Check for RapidAPI provider errors
      if (data.message && data.message.includes('Provider configuration error')) {
        throw new Error('API_PROVIDER_ERROR');
      }
      
      // Check for error in response
      if (data.error || data.status === 'error') {
        throw new Error(data.message || 'Vehicle not found in database');
      }
      
      // Map RapidAPI response to form fields
      // Adjust field names based on actual API response structure
      if (data.result || data.data) {
        const vehicleData = data.result || data.data;
        
        // Vehicle Model/Make
        if (vehicleData.maker_model || vehicleData.model || vehicleData.vehicle_manufacturer_name) {
          setVehicleModel(vehicleData.maker_model || vehicleData.model || vehicleData.vehicle_manufacturer_name || '');
        }
        
        // Vehicle Color
        if (vehicleData.color || vehicleData.vehicle_color) {
          setVehicleColor(vehicleData.color || vehicleData.vehicle_color || '');
        }
        
        // Seating Capacity
        if (vehicleData.seating_capacity || vehicleData.capacity) {
          setVehicleCapacity(String(vehicleData.seating_capacity || vehicleData.capacity || ''));
        }
        
        // Vehicle Type - Map from vehicle class description
        const vehicleClass = (vehicleData.vehicle_class_desc || vehicleData.vehicle_class || vehicleData.class || '').toLowerCase();
        const vehicleCategory = (vehicleData.vehicle_category || vehicleData.category || '').toLowerCase();
        
        if (vehicleClass.includes('motor car') || vehicleCategory.includes('car')) {
          setVehicleType('car');
        } else if (vehicleClass.includes('motor cycle') || vehicleClass.includes('motorcycle') || vehicleCategory.includes('bike')) {
          setVehicleType('moto');
        } else if (vehicleClass.includes('auto') || vehicleCategory.includes('auto rickshaw')) {
          setVehicleType('auto');
        } else if (vehicleClass.includes('suv')) {
          setVehicleType('suv');
        } else {
          // Default based on seating capacity
          const capacity = parseInt(vehicleData.seating_capacity || vehicleData.capacity || '0');
          if (capacity <= 2) setVehicleType('moto');
          else if (capacity <= 3) setVehicleType('auto');
          else if (capacity <= 5) setVehicleType('car');
          else setVehicleType('suv');
        }
        
        setVehicleFetchSuccess('Vehicle details fetched successfully!');
        setTimeout(() => setVehicleFetchSuccess(''), 3000);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      
      // Show specific error messages
      let errorMessage = 'Unable to fetch vehicle details. Please enter manually.';
      
      if (error.message === 'API_PROVIDER_ERROR') {
        errorMessage = '⚠️ API service temporarily unavailable. Please enter vehicle details manually.';
        console.warn('RapidAPI Provider Error: The Vehicle RC Information API is experiencing issues.');
        console.info('This is not an issue with your code. The API provider needs to fix their service.');
      } else if (error.message === 'API_PARSE_ERROR') {
        errorMessage = '⚠️ API returned invalid data. Please enter vehicle details manually.';
        console.warn('API returned data that could not be parsed as JSON.');
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message.includes('not found') || error.message.includes('not found in database')) {
        errorMessage = 'Vehicle not found. Please check the number or enter details manually.';
      } else if (error.message.includes('Provider configuration error')) {
        errorMessage = '⚠️ API service issue. Please enter vehicle details manually.';
        console.warn('RapidAPI Provider configuration error detected.');
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setVehicleFetchError(errorMessage);
      setTimeout(() => setVehicleFetchError(''), 8000);
    } finally {
      setFetchingVehicleDetails(false);
    }
  };

  // Handle vehicle plate change with auto-fetch
  const handleVehiclePlateChange = (e) => {
    const value = e.target.value.toUpperCase();
    setVehiclePlate(value);
    
    // Clear previous messages
    setVehicleFetchError("");
    setVehicleFetchSuccess("");
  };

  // Debounce auto-fetch when user types a valid vehicle plate
  // NOTE: Auto-fetch is currently disabled due to API instability
  // Users can manually click "Search Vehicle Details" button instead
  const plateDebounceRef = useRef(null);
  useEffect(() => {
    // clear any pending debounce
    if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current);

    // debug log for plate changes
    console.debug('[Rider Signup] vehiclePlate changed:', vehiclePlate);

    // AUTO-FETCH DISABLED: Uncomment below to re-enable when API is stable
    // only attempt auto-fetch for non-empty valid plates
    // if (!vehiclePlate || !isValidIndianVehicleNumber(vehiclePlate)) return;

    // wait 600ms after typing stops, then fetch
    // plateDebounceRef.current = setTimeout(() => {
    //   console.debug('[Rider Signup] auto-fetching vehicle details for', vehiclePlate);
    //   fetchVehicleDetails(vehiclePlate).catch((err) => console.error('Auto-fetch error:', err));
    // }, 600);

    return () => {
      const timeoutId = plateDebounceRef.current;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [vehiclePlate]);

  // Handle manual fetch button click
  const handleFetchVehicleDetails = () => {
    if (!vehiclePlate.trim()) {
      setVehicleFetchError('Please enter a vehicle number first');
      setTimeout(() => setVehicleFetchError(''), 3000);
      return;
    }

    if (!isValidIndianVehicleNumber(vehiclePlate)) {
      setVehicleFetchError('Invalid Indian vehicle number format (e.g., DL01AB1234)');
      setTimeout(() => setVehicleFetchError(''), 3000);
      return;
    }

    fetchVehicleDetails(vehiclePlate);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/rider/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('riderToken', data.token);
        localStorage.setItem('rider', JSON.stringify(data.rider));
        navigate('/rider/dashboard', { replace: true });
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Network error. Please try again.');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Convert profile photo to base64 if exists
    let profilePhotoBase64 = null;
    if (profilePhoto) {
      const reader = new FileReader();
      profilePhotoBase64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(profilePhoto);
      });
    }

    const signupData = {
      firstName,
      lastName,
      email: signupEmail,
      phone: signupPhone,
      password: signupPassword,
      profilePhoto: profilePhotoBase64,
      licenseNumber,
      vehicle: {
        plate: vehiclePlate,
        color: vehicleColor,
        capacity: vehicleCapacity,
        type: vehicleType,
        model: vehicleModel,
      },
    };

    try {
      const response = await fetch('http://localhost:3000/api/rider/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('riderToken', data.token);
        localStorage.setItem('rider', JSON.stringify(data.rider));
        navigate('/rider/dashboard', { replace: true });
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      alert('Network error. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <style>{`
        body {
          font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
      `}</style>
      
      {/* Left Side - Form */}
      <div className="flex items-start justify-center w-full p-8 overflow-y-auto lg:w-1/2">
        <div className="w-full max-w-md py-8">
          {/* Logo */}
          <Link to="/" className="flex items-center mb-8 space-x-3 group">
            <div className="relative flex items-center justify-center w-12 h-12 text-xl font-bold text-white transition-all duration-300 ease-out shadow-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 rounded-xl shadow-purple-500/50 group-hover:shadow-blue-600/70 group-hover:scale-110 group-hover:rotate-3">
              <span className="relative z-10 font-display">R</span>
              <div className="absolute inset-0 transition-opacity duration-300 ease-out opacity-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl group-hover:opacity-100"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none tracking-tight text-transparent transition-all duration-300 ease-out bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 bg-clip-text font-display group-hover:scale-105">
                RIDEX
              </span>
              <span className="text-[10px] text-slate-500 leading-none tracking-wider font-bold uppercase font-display">
                Rider Portal
              </span>
            </div>
          </Link>

          {/* Tab Switcher */}
          <div className="flex p-1 mb-8 border-2 border-purple-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ease-out font-display ${
                isLogin
                  ? "bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-600 hover:text-purple-700"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ease-out font-display ${
                !isLogin
                  ? "bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-600 hover:text-purple-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 bg-clip-text font-display">
              {isLogin ? "Welcome back" : "Become a Rider"}
            </h1>
            <p className="font-medium text-slate-600">
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
                  className="block mb-2 text-sm font-bold text-slate-700 font-display"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute w-5 h-5 transition-colors duration-300 ease-out -translate-y-1/2 text-slate-400 left-4 top-1/2" />
                  <input
                    type="email"
                    id="login-email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full py-4 pl-12 pr-4 font-medium transition-all duration-300 ease-out bg-white border-2 border-slate-200 rounded-xl focus:border-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-100 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block mb-2 text-sm font-bold text-slate-700 font-display"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute w-5 h-5 transition-colors duration-300 ease-out -translate-y-1/2 text-slate-400 left-4 top-1/2" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    id="login-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full py-4 pl-12 pr-12 font-medium transition-all duration-300 ease-out bg-white border-2 border-slate-200 rounded-xl focus:border-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-100 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute transition-all duration-300 ease-out -translate-y-1/2 text-slate-400 right-4 top-1/2 hover:text-purple-600 hover:scale-110"
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
                className="relative flex items-center justify-center w-full py-5 space-x-3 overflow-hidden font-bold text-white transition-all duration-500 ease-out shadow-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 shadow-purple-500/50 hover:shadow-blue-600/80 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-3xl group font-display"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 transition-opacity duration-500 ease-out opacity-0 bg-gradient-to-r from-blue-700 via-purple-600 to-blue-600 group-hover:opacity-100"></div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 transition-transform duration-700 ease-out -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full"></div>
                
                <span className="relative z-10 text-lg tracking-wide">Sign in</span>
                <ArrowRight className="relative z-10 w-6 h-6 transition-all duration-500 ease-out group-hover:translate-x-2 group-hover:scale-110" />
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
                  {fetchingLicenseDetails && <span className="ml-2 text-xs text-blue-600">(Verifying...)</span>}
                  {licenseVerified && <span className="ml-2 text-xs text-green-600">✓ Verified</span>}
                </label>
                <div className="relative">
                  <CreditCard className="absolute z-10 w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="text"
                    id="license-number"
                    value={licenseNumber}
                    onChange={handleLicenseNumberChange}
                    placeholder="e.g., DL0120220012345"
                    className={`w-full py-4 pl-12 pr-24 transition-colors border-2 rounded-xl focus:outline-none ${
                      licenseVerified 
                        ? 'border-green-500 bg-green-50' 
                        : licenseFetchError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-200 focus:border-black'
                    } ${fetchingLicenseDetails ? 'opacity-60' : ''}`}
                    required
                    disabled={fetchingLicenseDetails}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyLicense}
                    disabled={fetchingLicenseDetails || !licenseNumber.trim() || licenseVerified}
                    className="absolute p-2 text-black transition-colors -translate-y-1/2 bg-gray-100 rounded-lg right-2 top-1/2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Verify license"
                  >
                    {fetchingLicenseDetails ? (
                      <div className="w-5 h-5 border-2 border-black rounded-full border-t-transparent animate-spin"></div>
                    ) : licenseVerified ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* Status Messages */}
                {licenseFetchError && (
                  <p className="mt-2 text-xs text-red-600">{licenseFetchError}</p>
                )}
                {licenseFetchSuccess && (
                  <p className="mt-2 text-xs text-green-600">{licenseFetchSuccess}</p>
                )}
                {!licenseFetchError && !licenseFetchSuccess && licenseNumber && !licenseVerified && (
                  <p className="mt-2 text-xs text-gray-500">
                    Click the search icon to verify your license (Format: XX##YYYY#######)
                  </p>
                )}
                {licenseHolderName && licenseVerified && (
                  <p className="mt-2 text-xs text-gray-600">
                    License Holder: <span className="font-semibold">{licenseHolderName}</span>
                  </p>
                )}
              </div>

              {/* Vehicle Information Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-black">Vehicle Information</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Enter your vehicle plate number and click the search icon to auto-fill details
                  </p>
                </div>
                
                {/* Vehicle Type & Model */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="vehicle-type"
                      className="block mb-2 text-sm font-semibold text-black"
                    >
                      Vehicle Type
                      {fetchingVehicleDetails && <span className="ml-2 text-xs text-blue-600">(Auto-filling...)</span>}
                    </label>
                    <div className="relative">
                      <Car className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                      <select
                        id="vehicle-type"
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        disabled={fetchingVehicleDetails}
                        className={`w-full py-4 pl-12 pr-4 transition-colors bg-white border-2 border-gray-200 appearance-none rounded-xl focus:border-black focus:outline-none ${
                          fetchingVehicleDetails ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
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
                      {fetchingVehicleDetails && <span className="ml-2 text-xs text-blue-600">(Auto-filling...)</span>}
                    </label>
                    <div className="relative">
                      <Car className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                      <input
                        type="text"
                        id="vehicle-model"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        disabled={fetchingVehicleDetails}
                        placeholder="e.g., Toyota Camry"
                        className={`w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none ${
                          fetchingVehicleDetails ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''
                        }`}
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
                      <CreditCard className="absolute z-10 w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                      <input
                        type="text"
                        id="vehicle-plate"
                        value={vehiclePlate}
                        onChange={handleVehiclePlateChange}
                        placeholder="e.g., DL01AB1234"
                        className="w-full py-4 pl-12 pr-24 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleFetchVehicleDetails}
                        disabled={fetchingVehicleDetails || !vehiclePlate.trim()}
                        className="absolute p-2 text-black transition-colors -translate-y-1/2 bg-gray-100 rounded-lg right-2 top-1/2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Fetch vehicle details"
                      >
                        {fetchingVehicleDetails ? (
                          <div className="w-5 h-5 border-2 border-black rounded-full border-t-transparent animate-spin"></div>
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    {/* Status Messages */}
                    {vehicleFetchError && (
                      <p className="mt-2 text-xs text-red-600">{vehicleFetchError}</p>
                    )}
                    {vehicleFetchSuccess && (
                      <p className="mt-2 text-xs text-green-600">{vehicleFetchSuccess}</p>
                    )}
                    {!vehicleFetchError && !vehicleFetchSuccess && vehiclePlate && (
                      <p className="mt-2 text-xs text-gray-500">
                        Click the search icon to auto-fill vehicle details
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="vehicle-color"
                      className="block mb-2 text-sm font-semibold text-black"
                    >
                      Vehicle Color
                      {fetchingVehicleDetails && <span className="ml-2 text-xs text-blue-600">(Auto-filling...)</span>}
                    </label>
                    <div className="relative">
                      <Palette className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                      <input
                        type="text"
                        id="vehicle-color"
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                        disabled={fetchingVehicleDetails}
                        placeholder="e.g., Black"
                        className={`w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none ${
                          fetchingVehicleDetails ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''
                        }`}
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
                    {fetchingVehicleDetails && <span className="ml-2 text-xs text-blue-600">(Auto-filling...)</span>}
                  </label>
                  <div className="relative">
                    <Users className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                    <select
                      id="vehicle-capacity"
                      value={vehicleCapacity}
                      onChange={(e) => setVehicleCapacity(e.target.value)}
                      disabled={fetchingVehicleDetails}
                      className={`w-full py-4 pl-12 pr-4 transition-colors bg-white border-2 border-gray-200 appearance-none rounded-xl focus:border-black focus:outline-none ${
                        fetchingVehicleDetails ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
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
                  className="w-4 h-4 mt-1 transition-all duration-300 ease-out border-2 rounded cursor-pointer border-slate-300 accent-purple-600"
                  required
                />
                <label
                  htmlFor="terms"
                  className="ml-2 text-sm font-medium transition-colors duration-300 ease-out cursor-pointer text-slate-600 hover:text-slate-800"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="font-bold text-transparent transition-all duration-300 ease-out bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text hover:from-purple-700 hover:to-blue-700"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="font-bold text-transparent transition-all duration-300 ease-out bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text hover:from-purple-700 hover:to-blue-700"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="relative flex items-center justify-center w-full py-5 space-x-3 overflow-hidden font-bold text-white transition-all duration-500 ease-out shadow-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 shadow-purple-500/50 hover:shadow-blue-600/80 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-3xl group font-display"
                style={{ fontFamily: "'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 transition-opacity duration-500 ease-out opacity-0 bg-gradient-to-r from-blue-700 via-purple-600 to-blue-600 group-hover:opacity-100"></div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 transition-transform duration-700 ease-out -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full"></div>
                
                {/* Pulse ring on hover */}
                <div className="absolute inset-0 transition-all duration-500 ease-out scale-100 opacity-0 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 group-hover:scale-105 group-hover:opacity-20 blur-xl"></div>
                
                {/* Button content */}
                <span className="relative z-10 text-lg tracking-wide">Create Rider Account</span>
                <ArrowRight className="relative z-10 w-6 h-6 transition-all duration-500 ease-out group-hover:translate-x-2 group-hover:scale-110" />
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
          <p className="mt-8 font-medium text-center text-slate-600">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="font-bold text-transparent transition-all duration-300 ease-out bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text hover:from-purple-700 hover:to-blue-700 font-display"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="font-bold text-transparent transition-all duration-300 ease-out bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text hover:from-purple-700 hover:to-blue-700 font-display"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="relative hidden bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 lg:block lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80"
          alt="Riders on the road"
          className="absolute inset-0 object-cover w-full h-full opacity-50 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-blue-600/80 to-purple-700/80"></div>

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <h2 className="mb-4 text-5xl font-bold font-display">
            {isLogin
              ? "Go anywhere with anyone"
              : "Start earning on your schedule"}
          </h2>
          <p className="mb-8 text-xl font-medium text-blue-100">
            {isLogin
              ? "Join thousands of riders sharing rides and saving money every day."
              : "Become a rider and earn flexible income while helping people get around."}
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg font-medium">Flexible working hours</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg font-medium">Competitive earnings</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg font-medium">Instant payouts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}