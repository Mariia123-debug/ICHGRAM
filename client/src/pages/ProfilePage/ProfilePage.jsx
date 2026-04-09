import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '../../shared/api/axiosClient';
import { removeToken } from '../../shared/lib/token';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await axiosClient.get('/users/me');
        setUser(userRes.data);

        const postsRes = await axiosClient.get('/posts/me');
        setPosts(postsRes.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className={styles.state}>Loading profile...</div>;
  }

  if (!user) {
    return <div className={styles.state}>User not found</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.avatarWrap}>
 <img
  src={user.avatar || '/no-avatar.jpg'}
  alt={user.username}
  className={`${styles.avatar} ${!user.avatar ? styles.placeholder : ''}`}
/>
</div>

          <div className={styles.info}>
            <div className={styles.topRow}>
              <h1 className={styles.username}>{user.username}</h1>

              <button type="button" className={styles.editBtn}>
                Edit profile
              </button>

              <button
                type="button"
                className={styles.logoutBtn}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>

            <div className={styles.stats}>
              <p>
                <span>{posts.length}</span> posts
              </p>
              <p>
                <span>{user.followers?.length || 0}</span> followers
              </p>
              <p>
                <span>{user.following?.length || 0}</span> following
              </p>
            </div>

            <div className={styles.meta}>
              <p className={styles.fullName}>{user.fullName || user.username}</p>
              <p className={styles.bio}>{user.bio || 'No bio yet'}</p>
              <p className={styles.email}>{user.email}</p>
            </div>
          </div>
        </header>

        <div className={styles.divider} />

        <section className={styles.postsSection}>
          <div className={styles.postsTitle}>POSTS</div>

          {posts.length === 0 ? (
            <div className={styles.empty}>No posts yet</div>
          ) : (
            <div className={styles.grid}>
              {posts.map((post) => (
                <div key={post._id} className={styles.card}>
                  <img
                    src={post.image}
                    alt={post.caption || 'Post'}
                    className={styles.postImage}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}