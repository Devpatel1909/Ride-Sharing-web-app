import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader } from 'lucide-react';
import Header from '../../components/common/Header';
import { paymentsAPI } from '../../services/api';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState('');

  const pendingRidePayment = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('pendingRidePayment');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const rideId = Number(searchParams.get('rideId') || pendingRidePayment?.rideId);

  const retryPayment = async () => {
    if (!rideId) return;

    try {
      setError('');
      setIsRetrying(true);
      const result = await paymentsAPI.createCheckoutSession(rideId);
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setError('Could not open payment gateway. Please try again.');
    } catch (e) {
      setError(e.message || 'Failed to retry payment');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 pt-28 pb-12">
        <div className="rounded-3xl border border-rose-200 bg-white shadow-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-rose-600" />
            <h1 className="text-2xl font-bold text-slate-900">Payment Not Completed</h1>
          </div>

          <p className="text-slate-600 mb-6">
            Your rider is waiting. Complete payment to continue with this ride.
          </p>

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 mb-6 text-sm text-amber-700 font-semibold">
            Ride ID: #{rideId || 'N/A'}
          </div>

          {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={retryPayment}
              disabled={isRetrying || !rideId}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
            >
              {isRetrying ? 'Opening gateway...' : 'Retry Payment'}
            </button>
            <button
              onClick={() => navigate('/ride-search')}
              className="px-4 py-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Ride Search
            </button>
          </div>

          {isRetrying && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Loader className="w-4 h-4 animate-spin" />
              Redirecting to Stripe checkout...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
