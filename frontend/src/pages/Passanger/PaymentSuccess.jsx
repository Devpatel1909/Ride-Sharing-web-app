import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, MapPin } from 'lucide-react';
import Header from '../../components/common/Header';
import { paymentsAPI } from '../../services/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [statusText, setStatusText] = useState('Confirming your payment...');
  const [rideData, setRideData] = useState(null);

  const rideId = searchParams.get('rideId');

  const pendingRidePayment = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('pendingRidePayment');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      const resolvedRideId = Number(rideId || pendingRidePayment?.rideId);
      if (!resolvedRideId) {
        setStatusText('Missing ride information.');
        setIsChecking(false);
        return;
      }

      try {
        const result = await paymentsAPI.getPaymentStatus(resolvedRideId);
        if (!mounted) return;

        const ride = result?.ride;
        setRideData(ride);

        if (ride?.payment_status === 'completed' && (ride?.status === 'accepted' || ride?.status === 'in-progress')) {
          setStatusText('Payment confirmed. Redirecting to live tracking...');
          sessionStorage.removeItem('pendingRidePayment');
          setTimeout(() => {
            navigate('/tracking', {
              state: {
                rideId: resolvedRideId,
                role: 'passenger',
                riderName: ride?.rider_name || pendingRidePayment?.riderName || '',
                riderPhone: ride?.rider_phone || pendingRidePayment?.riderPhone || '',
                vehicleType: ride?.vehicle_type || pendingRidePayment?.vehicleType || '',
                vehiclePlate: ride?.vehicle_number || pendingRidePayment?.vehiclePlate || '',
                pickup: pendingRidePayment?.pickup || '',
                destination: pendingRidePayment?.destination || '',
                pickupCoords: pendingRidePayment?.pickupCoords || null,
                destCoords: pendingRidePayment?.destCoords || null,
              },
            });
          }, 1200);
          return;
        }

        if (ride?.payment_status === 'completed') {
          setStatusText('Payment confirmed. Waiting for ride status update...');
        } else {
          setStatusText('Payment received. Finalizing confirmation...');
        }
      } catch {
        if (!mounted) return;
        setStatusText('Could not confirm payment right now. Retrying...');
      } finally {
        if (mounted) setIsChecking(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [navigate, pendingRidePayment, rideId]);

  const goToTrackingNow = () => {
    const resolvedRideId = Number(rideId || pendingRidePayment?.rideId);
    if (!resolvedRideId || !rideData) return;

    navigate('/tracking', {
      state: {
        rideId: resolvedRideId,
        role: 'passenger',
        riderName: rideData?.rider_name || pendingRidePayment?.riderName || '',
        riderPhone: rideData?.rider_phone || pendingRidePayment?.riderPhone || '',
        vehicleType: rideData?.vehicle_type || pendingRidePayment?.vehicleType || '',
        vehiclePlate: rideData?.vehicle_number || pendingRidePayment?.vehiclePlate || '',
        pickup: pendingRidePayment?.pickup || '',
        destination: pendingRidePayment?.destination || '',
        pickupCoords: pendingRidePayment?.pickupCoords || null,
        destCoords: pendingRidePayment?.destCoords || null,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 pt-28 pb-12">
        <div className="rounded-3xl border border-emerald-200 bg-white shadow-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Payment Successful</h1>
          </div>

          <p className="text-slate-600 mb-6">{statusText}</p>

          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 mb-6">
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
              <MapPin className="w-4 h-4" />
              Ride ID: #{rideId || pendingRidePayment?.rideId || 'N/A'}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={goToTrackingNow}
              disabled={!rideData || rideData.payment_status !== 'completed'}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              Go to Live Tracking
            </button>
            <button
              onClick={() => navigate('/ride-search')}
              className="px-4 py-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          </div>

          {isChecking && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Loader className="w-4 h-4 animate-spin" />
              Checking payment and ride status...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
