import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Users, DollarSign, MapPin, Clock } from 'lucide-react';
import { ridesAPI } from '../../services/api';

/**
 * Create Shared Ride Page - For Riders
 * Allows riders to post shared rides and accept passengers
 */
export default function CreateSharedRide() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Review, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    pickupTime: '',
    vehicleType: 'sedan',
    estimatedFare: 0,
    maxPassengers: 3,
    description: ''
  });

  const [createdRide, setCreatedRide] = useState(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleCreateRide = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.pickupLocation || !formData.dropoffLocation || !formData.pickupTime) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.maxPassengers < 1 || formData.maxPassengers > 5) {
      setError('Maximum passengers must be between 1 and 5');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create ride via API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rides/shared/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('riderToken')}`
          },
          body: JSON.stringify({
            ...formData,
            estimatedFare: parseFloat(formData.estimatedFare),
            maxPassengers: parseInt(formData.maxPassengers)
          })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create ride');
      }

      const data = await response.json();
      setCreatedRide(data.ride);
      setSuccessMessage('✅ Shared ride created successfully!');
      setStep(3);

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate(`/rider-dashboard/ride/${data.ride.rideId}`);
      }, 3000);
    } catch (err) {
      console.error('Error creating ride:', err);
      setError(err.message || 'Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/rider-dashboard')}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            ✏️ Create Shared Ride
          </h1>
          <p className="text-lg text-slate-600">
            Post a shared ride and start earning by accepting passengers
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div className="flex items-center justify-center">
                <div
                  className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all ${
                    step >= stepNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {stepNum}
                </div>
              </div>
              {stepNum < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded transition-all ${
                    step > stepNum ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mb-4 text-center">
          <p className="text-sm text-slate-600">
            {step === 1 && '📍 Step 1: Basic Information'}
            {step === 2 && '👁️ Step 2: Review Details'}
            {step === 3 && '✅ Step 3: Confirmation'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-900">
            <p className="font-bold">{successMessage}</p>
            <p className="text-sm">Redirecting to ride dashboard...</p>
          </div>
        )}

        {/* Form - Step 1: Basic Info */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6 bg-white rounded-lg shadow-sm border border-slate-200 p-8">
            {/* Pickup Location */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                📍 Pickup Location *
              </label>
              <input
                type="text"
                name="pickupLocation"
                placeholder="Enter pickup location or address"
                value={formData.pickupLocation}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Dropoff Location */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                📍 Dropoff Location *
              </label>
              <input
                type="text"
                name="dropoffLocation"
                placeholder="Enter dropoff location or address"
                value={formData.dropoffLocation}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Pickup Time */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                🕐 Pickup Time *
              </label>
              <input
                type="datetime-local"
                name="pickupTime"
                value={formData.pickupTime}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                🚗 Vehicle Type
              </label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
                <option value="van">Van</option>
              </select>
            </div>

            {/* Estimated Fare */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                💰 Estimated Fare (₹)
              </label>
              <input
                type="number"
                name="estimatedFare"
                placeholder="Enter total estimated fare"
                value={formData.estimatedFare}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
              />
            </div>

            {/* Max Passengers */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                👥 Maximum Passengers (1-5)
              </label>
              <input
                type="number"
                name="maxPassengers"
                value={formData.maxPassengers}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="5"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                📝 Additional Notes (Optional)
              </label>
              <textarea
                name="description"
                placeholder="e.g., Will wait 5 mins, prefer music off, etc."
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              />
            </div>

            {/* Next Button */}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Next: Review Details →
            </button>
          </form>
        )}

        {/* Form - Step 2: Review */}
        {step === 2 && (
          <div className="space-y-6 bg-white rounded-lg shadow-sm border border-slate-200 p-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-slate-600 text-sm mb-1">Pickup</p>
                <p className="font-bold text-slate-900">{formData.pickupLocation}</p>
                <p className="text-sm text-slate-600 mt-2">{new Date(formData.pickupTime).toLocaleString()}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-slate-600 text-sm mb-1">Dropoff</p>
                <p className="font-bold text-slate-900">{formData.dropoffLocation}</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-600 text-sm mb-1">Vehicle & Passengers</p>
                <p className="font-bold text-slate-900">{formData.vehicleType.charAt(0).toUpperCase() + formData.vehicleType.slice(1)} - Up to {formData.maxPassengers} passengers</p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm mb-1">Estimated Fare</p>
                <p className="font-bold text-slate-900">₹{formData.estimatedFare}</p>
                <p className="text-sm text-green-600">₹{(formData.estimatedFare / formData.maxPassengers).toFixed(2)}/person</p>
              </div>
            </div>

            {/* Notes */}
            {formData.description && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-600 text-sm mb-1">Additional Notes</p>
                <p className="font-semibold text-slate-900">{formData.description}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-lg transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                Confirm & Create →
              </button>
            </div>
          </div>
        )}

        {/* Form - Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-6 bg-white rounded-lg shadow-sm border border-slate-200 p-8">
            {successMessage ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Ride Created Successfully!</h2>
                <p className="text-slate-600 mb-4">Your shared ride has been posted and is now visible to passengers.</p>
                
                {createdRide && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-6 text-left space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ride ID:</span>
                      <span className="font-bold">#{createdRide.rideId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">From:</span>
                      <span className="font-bold">{createdRide.pickupLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">To:</span>
                      <span className="font-bold">{createdRide.dropoffLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span className="font-bold text-green-600">🟢 Active</span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-slate-500 mt-6">Redirecting to your ride dashboard...</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <button
                  onClick={handleCreateRide}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Creating...' : '✅ Create Shared Ride'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
