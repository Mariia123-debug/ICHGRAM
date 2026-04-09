import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosClient } from '../../shared/api/axiosClient';
import styles from '../LoginPage/AuthPage.module.css';

export function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axiosClient.post('/users/login', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Register error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.preview}>
          <img
            src="/login-preview.png"
            alt="Preview"
            className={styles.previewImage}
          />
        </div>

        <div className={styles.right}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <img src="/logo.png" alt="Logo" className={styles.logo} />

            <p className={styles.subtitle}>
              Sign up to see photos and videos from your friends.
            </p>

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <p className={styles.registerText}>
              People who use our service may have uploaded your contact
              information to Instagram.{' '}
              <a href="/not-existing-page">Learn More</a>
            </p>

            <p className={styles.registerPolicy}>
              By signing up, you agree to our <a href="/not-existing-page">Terms</a>,{' '}
              <a href="/not-existing-page">Privacy Policy</a> and{' '}
              <a href="/not-existing-page">Cookies Policy</a>.
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Sign up'}
            </button>
          </form>

          <div className={styles.signupBox}>
            <span>Already have an account?</span>
            <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}