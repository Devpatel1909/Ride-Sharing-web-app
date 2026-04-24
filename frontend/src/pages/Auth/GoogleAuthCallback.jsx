import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from 'lucide-react';

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Fetch user profile with the token
      fetch('http://localhost:3000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            // Navigate to home page
            navigate('/', { replace: true });
          } else {
            navigate('/login?error=profile_fetch_failed', { replace: true });
          }
        })
        .catch(err => {
          console.error('Error fetching profile:', err);
          navigate('/login?error=profile_fetch_failed', { replace: true });
        });
    } else if (error) {
      navigate(`/login?error=${error}`, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-full animate-ping opacity-20"></div>
          <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 rounded-full">
            <Loader className="w-10 h-10 text-white animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text font-display mb-2">
          Signing you in...
        </h2>
        <p className="text-slate-600 font-medium">
          Please wait while we complete your authentication
        </p>
      </div>
    </div>
  );
}
