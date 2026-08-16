import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plane, Lock, Mail, AlertCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const bgImages = [
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503899036067-e13917fb6eb7?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=2020&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop'
  ];

  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % bgImages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [bgImages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ position: 'relative', overflow: 'hidden' }}>
      {bgImages.map((img, index) => (
        <div 
          key={img}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('${img}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: currentBg === index ? 0.35 : 0,
            transition: 'opacity 2.5s ease-in-out',
            zIndex: 0,
            filter: 'brightness(0.6) saturate(1.2)'
          }}
        />
      ))}

      <div className="login-overlay" style={{ zIndex: 1 }}></div>

      <div className="login-box glass" style={{ zIndex: 10 }}>
        {/* Brand Icon */}
        <div className="login-logo" style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Plane size={28} strokeWidth={2.5} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0 }}>
            TravelOps
          </h1>
          <span style={{
            fontSize: '0.625rem',
            fontWeight: '700',
            padding: '0.1rem 0.4rem',
            borderRadius: '4px',
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--primary)',
            border: '1px solid rgba(6, 182, 212, 0.3)'
          }}>
            v3.0 PRO
          </span>
        </div>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>
          Secure operations & intelligence workspace
        </p>

        {error && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.12)', 
            color: '#f87171', 
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '0.75rem 1rem', 
            borderRadius: '8px', 
            marginBottom: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.8125rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label>Work Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.95rem', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@travelops.com" 
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                required 
              />
            </div>
          </div>
          
          <div className="input-group" style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.95rem', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••••••" 
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                required 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }} 
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Sign In to Workspace <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <div style={{ 
          marginTop: '1.75rem', 
          paddingTop: '1.25rem', 
          borderTop: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.4rem',
          color: 'var(--text-subtle)',
          fontSize: '0.75rem'
        }}>
          <ShieldCheck size={14} color="var(--primary)" />
          <span>Enterprise End-to-End Encrypted Session</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
