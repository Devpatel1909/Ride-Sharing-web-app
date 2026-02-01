import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Phone } from "lucide-react";
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
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Login:", { loginEmail, loginPassword, rememberMe });
    navigate("/dashboard", { replace: true });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    console.log("Signup:", { signupName, signupEmail, signupPhone, signupPassword });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center w-full p-8 lg:w-1/2">
        <div className="w-full max-w-md">
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
              {isLogin ? "Welcome back" : "Get started"}
            </h1>
            <p className="text-gray-600">
              {isLogin
                ? "Sign in to continue your journey"
                : "Create your rider account today"}
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
              {/* Name Field */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block mb-2 text-sm font-semibold text-black"
                >
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="text"
                    id="signup-name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full py-4 pl-12 pr-4 transition-colors border-2 border-gray-200 rounded-xl focus:border-black focus:outline-none"
                    required
                  />
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
                <span>Create account</span>
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

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center py-3 space-x-2 transition-colors border-2 border-gray-200 rounded-xl hover:border-black">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-semibold">Google</span>
            </button>

            <button className="flex items-center justify-center py-3 space-x-2 transition-colors border-2 border-gray-200 rounded-xl hover:border-black">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-semibold">Facebook</span>
            </button>
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