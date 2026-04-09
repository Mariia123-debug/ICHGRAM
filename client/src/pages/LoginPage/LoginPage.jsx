import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { axiosClient } from '../../shared/api/axiosClient';
import { setToken } from '../../shared/lib/token';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
     const response = await axiosClient.post('/users/login', form);
const token = response.data.token;

      setToken(token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login error');
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
            alt="Instagram preview"
            className={styles.previewImage}
          />
        </div>

        <div className={styles.right}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <img src="/logo.png" alt="Logo" className={styles.logo} />

            <input
              type="text"
              name="email"
              placeholder="Email"
              value={form.email}
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

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Log in'}
            </button>

            <div className={styles.or}>OR</div>

            <div className={styles.forgotWrapper}>
              

              <Link to="/not-existing-page" className={styles.forgotLink}>
                Forgot password?
              </Link>
              <span className="betaBadge">beta</span>
            </div>
          </form>

          <div className={styles.signupBox}>
            <span>Don&apos;t have an account?</span>
            <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}