import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Loader, ArrowRight, AlertCircle } from "lucide-react";
import Header from "../../components/common/Header";

export default function PaymentTab() {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentData, setPaymentData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get payment data from session storage or location state
    const pendingPayment = sessionStorage.getItem("pendingRidePayment");
    const locState = location.state;

    if (pendingPayment) {
      try {
        setPaymentData(JSON.parse(pendingPayment));
      } catch (e) {
        setError("Failed to load payment data");
      }
    } else if (locState?.paymentData) {
      setPaymentData(locState.paymentData);
    } else {
      setError("No payment data found. Redirecting to home...");
      setTimeout(() => navigate("/"), 2000);
    }
  }, [navigate, location]);

  const handleProceedToCheckout = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      // If checkoutUrl already present, use it
      if (paymentData?.checkoutUrl) {
        window.location.href = paymentData.checkoutUrl;
        return;
      }

      // Otherwise request backend to create a checkout session
      const { paymentsAPI } = await import("../../services/api");
      const resp = await paymentsAPI.createCheckoutSession(paymentData?.rideId);
      if (resp && resp.checkoutUrl) {
        // persist updated info
        const updated = { ...paymentData, checkoutUrl: resp.checkoutUrl, sessionId: resp.sessionId };
        sessionStorage.setItem('pendingRidePayment', JSON.stringify(updated));
        setPaymentData(updated);
        window.location.href = resp.checkoutUrl;
        return;
      }

      setError('Checkout URL not available. Please try again.');
    } catch (e) {
      console.error('Checkout creation failed:', e);
      setError(e.message || 'Failed to create checkout session');
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <div className="fixed inset-0 -z-10 bg-linear-to-br from-blue-50 to-purple-50" />
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20 mt-16">
          <div className="max-w-md w-full rounded-3xl shadow-2xl overflow-hidden border border-red-200 bg-white">
            <div className="bg-red-50 px-8 py-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-red-600">Error</h2>
              <p className="text-red-600 mt-2">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <div className="fixed inset-0 -z-10 bg-linear-to-br from-blue-50 to-purple-50" />
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20 mt-16">
          <div className="max-w-md w-full rounded-3xl shadow-2xl overflow-hidden border border-slate-200 bg-white">
            <div className="px-8 py-12 text-center">
              <Loader className="w-8 h-8 mx-auto text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600 font-semibold">Loading payment details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-purple-50 to-slate-50" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-linear-to-br from-blue-400 via-blue-500 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-purple-400 via-purple-500 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
      </div>

      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20 mt-16">
        <div className="max-w-md w-full rounded-3xl shadow-2xl shadow-blue-500/20 overflow-hidden border border-slate-200/60 bg-white/90 backdrop-blur-sm">
          {/* Header */}
          <div className="bg-linear-to-br from-blue-600 via-purple-600 to-purple-700 px-8 py-12 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-white/30 animate-pulse">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Rider Accepted!</h2>
            <p className="text-white/70 mt-1 text-sm">
              Complete payment to start your ride
            </p>
          </div>

          {/* Payment Details */}
          <div className="px-8 py-6 space-y-4">
            {/* Ride Info */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Ride ID</span>
                <span className="font-bold text-slate-900">#{paymentData.rideId}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Vehicle</span>
                <span className="font-bold text-slate-900">{paymentData.vehicleType}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pickup</span>
                <span className="font-bold text-slate-900 text-right text-xs">
                  {paymentData.pickup?.split(",")[0]}
                </span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Destination</span>
                <span className="font-bold text-slate-900 text-right text-xs">
                  {paymentData.destination?.split(",")[0]}
                </span>
              </div>
            </div>

            {/* Driver Info */}
            {paymentData.riderName && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">
                  Your Driver
                </p>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">{paymentData.riderName}</p>
                  {paymentData.riderPhone && (
                    <p className="text-xs text-slate-600">{paymentData.riderPhone}</p>
                  )}
                  {paymentData.vehiclePlate && (
                    <p className="text-xs font-mono font-bold text-blue-700 mt-2">
                      {paymentData.vehiclePlate}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fare Section */}
            <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Fare Amount</span>
                <span className="text-3xl font-extrabold text-transparent bg-linear-to-r from-blue-600 to-purple-700 bg-clip-text">
                  ₹{parseFloat(paymentData.fare || 0).toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Payment method: <span className="font-semibold text-slate-700">{paymentData.paymentMethod?.toUpperCase()}</span>
              </p>
            </div>

            {/* Payment Status */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Ready to Pay</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Click below to proceed to secure payment
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 pb-8 flex gap-3">
            <button
              onClick={() => navigate("/ride-search")}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleProceedToCheckout}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl bg-linear-to-r from-blue-600 via-purple-600 to-purple-700 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg shadow-blue-500/30 disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay Now
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
