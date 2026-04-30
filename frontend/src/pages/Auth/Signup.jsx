import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to home
        navigate('/', { replace: true });
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <style>{`
        body {
          font-family: 'UberMove', 'UberMoveText', system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
      `}</style>
      
      {/* Left Side - Image */}
      <div className="relative hidden bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 lg:block lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1556742393-d75f468bfcb0?auto=format&fit=crop&w=1200&q=80"
          alt="Happy riders"
          className="absolute inset-0 object-cover w-full h-full opacity-50 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 via-purple-600/80 to-purple-700/80"></div>
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
          <h2 className="mb-4 text-5xl font-bold font-display">Start saving on rides today</h2>
          <p className="mb-8 text-xl font-medium text-blue-100">
            Share rides with others and cut your travel costs by up to 60%.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg font-medium">Verified and safe drivers</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg font-medium">Real-time ride tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg font-medium">24/7 customer support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center w-full p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center mb-8 space-x-3 group">
            <div className="relative flex items-center justify-center w-12 h-12 text-xl font-bold text-white transition-all duration-300 ease-out shadow-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 rounded-xl shadow-blue-500/50 group-hover:shadow-blue-600/70 group-hover:scale-110 group-hover:rotate-3">
              <span className="relative z-10 font-display">R</span>
              <div className="absolute inset-0 transition-opacity duration-300 ease-out opacity-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl group-hover:opacity-100"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none tracking-tight text-transparent transition-all duration-300 ease-out bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text font-display group-hover:scale-105">
                RIDEX
              </span>
              <span className="text-[10px] text-slate-500 leading-none tracking-wider font-bold uppercase font-display">
                Passenger Signup
              </span>
            </div>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text font-display">Create account</h1>
            <p className="font-medium text-slate-600">Join RIDEX and start saving today</p>
          </div>

          {error && (
            <div className="p-4 mb-4 text-red-700 border-2 border-red-200 bg-red-50 rounded-xl animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block mb-2 text-sm font-bold text-slate-700 font-display">
                Full name
              </label>
              <div className="relative">
                <User className="absolute w-5 h-5 transition-colors duration-300 ease-out -translate-y-1/2 text-slate-400 left-4 top-1/2" />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full py-4 pl-12 pr-4 font-medium transition-all duration-300 ease-out bg-white border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-bold text-slate-700 font-display">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute w-5 h-5 transition-colors duration-300 ease-out -translate-y-1/2 text-slate-400 left-4 top-1/2" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full py-4 pl-12 pr-4 font-medium transition-all duration-300 ease-out bg-white border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block mb-2 text-sm font-bold text-slate-700 font-display">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute w-5 h-5 transition-colors duration-300 ease-out -translate-y-1/2 text-slate-400 left-4 top-1/2" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full py-4 pl-12 pr-4 font-medium transition-all duration-300 ease-out bg-white border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-bold text-slate-700 font-display">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute w-5 h-5 transition-colors duration-300 ease-out -translate-y-1/2 text-slate-400 left-4 top-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full py-4 pl-12 pr-12 font-medium transition-all duration-300 ease-out bg-white border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute transition-all duration-300 ease-out -translate-y-1/2 text-slate-400 right-4 top-1/2 hover:text-blue-600 hover:scale-110"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block mb-2 text-sm font-bold text-slate-700 font-display">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute w-5 h-5 transition-colors duration-300 ease-out -translate-y-1/2 text-slate-400 left-4 top-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full py-4 pl-12 pr-12 font-medium transition-all duration-300 ease-out bg-white border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute transition-all duration-300 ease-out -translate-y-1/2 text-slate-400 right-4 top-1/2 hover:text-blue-600 hover:scale-110"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-1 transition-all duration-300 ease-out border-2 rounded cursor-pointer border-slate-300 accent-blue-600"
                required
              />
              <label htmlFor="terms" className="ml-2 text-sm font-medium transition-colors duration-300 ease-out cursor-pointer text-slate-600 hover:text-slate-800">
                I agree to the{' '}
                <Link to="/terms" className="font-bold text-transparent transition-all duration-300 ease-out bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text hover:from-blue-700 hover:to-purple-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-bold text-transparent transition-all duration-300 ease-out bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text hover:from-blue-700 hover:to-purple-700">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative flex items-center justify-center w-full py-5 space-x-3 overflow-hidden font-bold text-white transition-all duration-500 ease-out shadow-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-purple-800 shadow-blue-500/50 hover:shadow-purple-600/80 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-3xl group disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100 font-display"
            >
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 transition-opacity duration-500 ease-out opacity-0 bg-gradient-to-r from-purple-700 via-blue-600 to-purple-600 group-hover:opacity-100"></div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 transition-transform duration-700 ease-out -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full"></div>
              
              {/* Button content */}
              {loading ? (
                <div className="relative z-10 flex items-center space-x-3">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg tracking-wide">Creating your account...</span>
                </div>
              ) : (
                <>
                  <span className="relative z-10 text-lg tracking-wide">Create account</span>
                  <ArrowRight className="relative z-10 w-6 h-6 transition-all duration-500 ease-out group-hover:translate-x-2 group-hover:scale-110" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            <span className="px-4 text-sm font-medium text-slate-500">or sign up with</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          </div>

          {/* Social Sign Up */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => window.location.href = 'http://localhost:3000/api/auth/google'}
              type="button"
              className="flex items-center justify-center py-3 space-x-2 font-medium transition-all duration-300 ease-out bg-white border-2 border-slate-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 hover:shadow-lg hover:-translate-y-1"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-semibold">Google</span>
            </button>

            <button className="flex items-center justify-center py-3 space-x-2 font-medium transition-all duration-300 ease-out bg-white border-2 border-slate-200 rounded-xl hover:border-purple-600 hover:bg-purple-50 hover:shadow-lg hover:-translate-y-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-semibold">Facebook</span>
            </button>
          </div>

          {/* Login Link */}
          <p className="mt-6 font-medium text-center text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-transparent transition-all duration-300 ease-out bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text hover:from-blue-700 hover:to-purple-700 font-display">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}