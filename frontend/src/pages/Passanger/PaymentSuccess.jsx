import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, Car, ArrowRight } from 'lucide-react';
import Header from '../../components/common/Header';
import { ridesAPI } from '../../services/api';

export default function PaymentSuccess() {
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
  const [isChecking, setIsChecking] = useState(false);
  const [statusText, setStatusText] = useState('Payment successful. Waiting for rider acceptance...');

  const checkStatus = async () => {
    if (!rideId) return;
    setIsChecking(true);
    try {
      const result = await ridesAPI.getRideDetails(rideId);
      const ride = result?.ride;

      if (!ride) {
        setStatusText('Ride not found yet. Please refresh in a moment.');
        return;
      }

      if (ride.status === 'accepted' || ride.status === 'in-progress') {
        sessionStorage.removeItem('pendingRidePayment');
        navigate('/tracking', {
          state: {
            rideId,
            role: 'passenger',
            riderName: ride.rider_name || '',
            riderPhone: ride.rider_phone || '',
            vehicleType: ride.vehicle_type || '',
            vehiclePlate: ride.vehicle_number || '',
            pickup: pending?.pickup || '',
            destination: pending?.destination || '',
            pickupCoords: pending?.pickupCoords || null,
            destCoords: pending?.destCoords || null,
          }
        });
        return;
      }

      setStatusText(`Ride status: ${ride.status}. Riders are being notified.`);
    } catch {
      setStatusText('Could not fetch ride status right now. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!rideId) return;
    const timer = setInterval(checkStatus, 5000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  if (!rideId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-xl mx-auto px-4 pt-28 pb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-slate-700 font-semibold">Payment completed, but ride details were not found.</p>
            <button
              onClick={() => navigate('/ride-search')}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
            >
              Back to Ride Search
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-xl mx-auto px-4 pt-28 pb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Payment Successful</h1>
              <p className="text-sm text-slate-500">Ride #{rideId}</p>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
            <p className="text-sm font-semibold text-emerald-700">{statusText}</p>
          </div>

          {pending && (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold">Vehicle:</span> {pending.vehicleName}</p>
              <p><span className="font-semibold">Fare:</span> ₹{Number(pending.fare || 0).toFixed(0)}</p>
              <p><span className="font-semibold">Payment:</span> {(pending.paymentMethod || 'card').toUpperCase()}</p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={checkStatus}
              disabled={isChecking}
              className="px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isChecking ? <Loader className="w-4 h-4 animate-spin" /> : <Car className="w-4 h-4" />}
              Check Ride Status
            </button>

            <button
              onClick={() => navigate('/ride-search')}
              className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold flex items-center justify-center gap-2"
            >
              New Ride
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
