import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader } from 'lucide-react';
import Header from '../../components/common/Header';
import { paymentsAPI } from '../../services/api';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rideIdFromQuery = searchParams.get('rideId');
  const pendingRaw = sessionStorage.getItem('pendingRidePayment');
  const pending = useMemo(() => {
    try {
      return pendingRaw ? JSON.parse(pendingRaw) : null;
    } catch {
      return null;
    }
  }, [pendingRaw]);

  const rideId = rideIdFromQuery || pending?.rideId;
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const cancelPending = async () => {
      if (!rideId) return;
      setIsCancelling(true);
      try {
        await paymentsAPI.cancelPendingPayment(rideId);
      } catch {
        // No-op: cancellation is best-effort for UX consistency.
      } finally {
        setIsCancelling(false);
      }
    };

    cancelPending();
  }, [rideId]);

  const handleBack = () => {
    sessionStorage.removeItem('pendingRidePayment');
    navigate('/ride-search');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-xl mx-auto px-4 pt-28 pb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Payment Cancelled</h1>
              <p className="text-sm text-slate-500">No charge was completed.</p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm font-medium text-amber-700">
            {isCancelling ? (
              <span className="inline-flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Cleaning up pending payment...
              </span>
            ) : (
              'You can try booking again and choose the same or a different payment method.'
            )}
          </div>

          {pending && (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold">Ride:</span> #{pending.rideId}</p>
              <p><span className="font-semibold">Vehicle:</span> {pending.vehicleName}</p>
              <p><span className="font-semibold">Fare:</span> ₹{Number(pending.fare || 0).toFixed(0)}</p>
            </div>
          )}

          <button
            onClick={handleBack}
            className="mt-6 w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold"
          >
            Back to Ride Search
          </button>
        </div>
      </main>
    </div>
  );
}
