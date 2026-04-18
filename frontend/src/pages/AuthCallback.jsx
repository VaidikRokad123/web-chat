import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    console.log('🔍 AuthCallback mounted');
    console.log('Search params:', window.location.search);
    
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('Error:', error);

    if (error) {
      console.log('❌ Error in callback, redirecting to login');
      navigate('/login?error=' + error, { replace: true });
      return;
    }

    if (token) {
      console.log('✅ Token found, calling handleGoogleCallback');
      handleGoogleCallback(token);
      console.log('✅ Navigating to home');
      navigate('/', { replace: true });
    } else {
      console.log('⚠️ No token or error, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, handleGoogleCallback]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Authenticating...</h1>
          <p>Please wait while we sign you in</p>
        </div>
      </div>
    </div>
  );
}
