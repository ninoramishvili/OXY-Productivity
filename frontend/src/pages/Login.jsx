import { useState } from 'react';
import { authAPI } from '../utils/api';
import ThemeSelector from '../components/ThemeSelector';
import './Login.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        onLogin(response.user, response.token);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@example.com');
    setPassword('demo123');
  };

  return (
    <div className="login-container">
      <div className="login-theme-selector">
        <ThemeSelector />
      </div>
      
      <div className="login-card">
        <div className="brand-logo">
          <div className="logo-icon">OXY</div>
          <div className="logo-text">Productivity</div>
        </div>
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to unlock your potential</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button 
            type="button" 
            className="demo-button" 
            onClick={fillDemoCredentials}
            disabled={loading}
          >
            Fill Demo Credentials
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-info">
            <strong>Demo Account:</strong> demo@example.com / demo123
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

