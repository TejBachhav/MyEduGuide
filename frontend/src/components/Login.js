import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [solid, setSolid] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await axios.post('http://localhost:8000/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('token', response.data.access_token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed', error);
      if (error.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (error.response?.status === 422) {
        setError('Please enter valid email and password.');
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="orb-1"></div>
      <div className="orb-2"></div>
      <div className="orb-3"></div>

      <div className="auth-main-content">
        <div className="auth-header">
          <div className="auth-logo"></div>
          <h1 className="auth-title">Welcome Back!</h1>
          <p className="auth-subtitle">Sign in to your Career Guidance Portal</p>
        </div>

        <div style={{marginBottom: '1rem', display:'flex', justifyContent:'flex-end', width:'100%'}}>
          <button type="button" onClick={()=>setSolid(!solid)} className="auth-button-secondary" style={{padding:'0.5rem 0.75rem', fontSize:'0.7rem'}}>
            {solid ? 'Glass Mode' : 'Solid Mode'}
          </button>
        </div>
        <div className={`auth-card ${solid ? 'auth-card-solid' : ''}`}>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bachhavtej@gmail.com"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="password-toggle-icon">👁️</span>
                </button>
              </div>
            </div>
            
            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-button-primary" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="auth-links">
              <a href="/#">Forgot your password?</a>
              <span>Don't have an account?</span>
            </div>

            <Link to="/signup" className="auth-button-secondary">
              <span role="img" aria-label="rocket">🚀</span>
              Create New Account
              <span>→</span>
            </Link>
          </form>
        </div>

        <div className="auth-footer">
          <p>MyEduGuide - Your personalized career guidance platform</p>
          <div>
            <a href="/#">Privacy Policy</a>
            <a href="/#">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
