import { useEffect, useState } from 'react';
import { axiosClient } from '../../shared/api/axiosClient';
import styles from './EditProfileModal.module.css';

export function EditProfileModal({ user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    bio: '',
    avatar: '',
  });

  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    setForm({
      fullName: user.fullName || '',
      username: user.username || '',
      bio: user.bio || '',
      avatar: user.avatar || '',
    });

    setPreview(user.avatar || '');
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result;

      setForm((prev) => ({
        ...prev,
        avatar: base64,
      }));

      setPreview(base64);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setForm((prev) => ({
      ...prev,
      avatar: '',
    }));
    setPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axiosClient.patch('/users/me', {
        fullName: form.fullName,
        username: form.username,
        bio: form.bio,
        avatar: form.avatar,
      });

      onSuccess(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Update error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
        >
          ×
        </button>

        <div className={styles.header}>
          <img src="/logo.png" alt="Logo" className={styles.logo} />
          <p className={styles.subtitle}>Edit your profile information</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.avatarBlock}>
            <img
              src={preview || '/no-avatar.jpg'}
              alt="Avatar preview"
              className={styles.avatarPreview}
            />

            <div className={styles.avatarButtons}>
              <label className={styles.uploadBtn}>
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                />
              </label>

              <button
                type="button"
                className={styles.removeBtn}
                onClick={handleRemoveAvatar}
              >
                Remove
              </button>
            </div>
          </div>

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
          />

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />

          <textarea
            name="bio"
            placeholder="Bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}