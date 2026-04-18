import { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const onFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleSignup = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to create account');
    }

    setMode('login');
    setSuccess('Account created. Please login.');
  };

  const handleLogin = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to login');
    }

    onAuthenticated(payload);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await handleSignup();
      } else {
        await handleLogin();
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left-panel">
        <h2>{mode === 'signup' ? 'Welcome Back!' : 'Hello, Friend!'}</h2>
        <p>
          {mode === 'signup'
            ? 'To keep connected with us please login with your personal info'
            : 'Enter your personal details and start your journey with us'}
        </p>
        <button
          type="button"
          className="auth-ghost-btn"
          onClick={() => switchMode(mode === 'signup' ? 'login' : 'signup')}
        >
          {mode === 'signup' ? 'SIGN IN' : 'SIGN UP'}
        </button>
      </div>

      <div className="auth-right-panel">
        <h2>{mode === 'signup' ? 'Create Account' : 'Sign in'}</h2>

        <div className="auth-social-row">
          <span>f</span>
          <span>G+</span>
          <span>in</span>
        </div>

        <p className="auth-subtitle">
          {mode === 'signup'
            ? 'or use your email for registration:'
            : 'or use your account email to login:'}
        </p>

        <form onSubmit={onSubmit} className="auth-form">
          {mode === 'signup' && (
            <input
              placeholder="Name"
              value={form.name}
              onChange={(event) => onFieldChange('name', event.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => onFieldChange('email', event.target.value)}
            required
          />

          {mode === 'signup' && (
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(event) => onFieldChange('phone', event.target.value)}
              required
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => onFieldChange('password', event.target.value)}
            required
          />

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signup' ? 'SIGN UP' : 'SIGN IN'}
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}
      </div>
    </div>
  );
}

export default AuthPanel;
