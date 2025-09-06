import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [solid, setSolid] = useState(true);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!name.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/auth/signup', { 
        name, 
        email, 
        password 
      });
      
      localStorage.setItem('token', response.data.access_token);
      setSuccess('Account created successfully! Redirecting to profile setup...');
      
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      console.error('Signup failed', error);
      if (error.response?.status === 400) {
        setError('Email address is already registered. Please try logging in.');
      } else if (error.response?.status === 422) {
        setError('Please check your information and try again.');
      } else {
        setError('Account creation failed. Please check your connection and try again.');
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
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">Start your journey with MyEduGuide</p>
        </div>

        <div style={{marginBottom: '1rem', display:'flex', justifyContent:'flex-end', width:'100%'}}>
          <button type="button" onClick={()=>setSolid(!solid)} className="auth-button-secondary" style={{padding:'0.5rem 0.75rem', fontSize:'0.7rem'}}>
            {solid ? 'Glass Mode' : 'Solid Mode'}
          </button>
        </div>
        <div className={`auth-card ${solid ? 'auth-card-solid' : ''}`}>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Tejas Bachhav"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                  placeholder="Min. 6 characters"
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

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <span className="password-toggle-icon">👁️</span>
                </button>
              </div>
            </div>
            
            {error && <p className="auth-error">{error}</p>}
            {success && <p className="auth-success">{success}</p>}

            <button type="submit" className="auth-button-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="auth-links text-center" style={{display: 'block'}}>
              <span>Already have an account? </span>
              <Link to="/login">Sign In</Link>
            </div>
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

export default Signup;