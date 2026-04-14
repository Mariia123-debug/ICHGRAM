import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { axiosClient } from '../../shared/api/axiosClient';
import { removeToken } from '../../shared/lib/token';
import { EditProfileModal } from '../../components/EditProfileModal/EditProfileModal';
import { PostModal } from '../../shared/ui/PostModal/PostModal';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { id } = useParams(); // 👈 КЛЮЧЕВОЕ
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [likeLoadingId, setLikeLoadingId] = useState(null);

  const isMyProfile = !id; // 👈 если нет id — это мой профиль

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const loadData = async () => {
    try {
      setLoading(true);

      if (isMyProfile) {
        // 👉 МОЙ ПРОФИЛЬ
        const userRes = await axiosClient.get('/users/me');
        setUser(userRes.data);

        const postsRes = await axiosClient.get('/posts/me');
        setPosts(postsRes.data);
      } else {
        // 👉 ЧУЖОЙ ПРОФИЛЬ
        const userRes = await axiosClient.get(`/users/${id}`);
        setUser(userRes.data);

        const postsRes = await axiosClient.get(`/posts/user/${id}`);
        setPosts(postsRes.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]); // 👈 ОБЯЗАТЕЛЬНО

  const handleOpenPost = (post) => {
    setSelectedPost(post);
    setCommentText('');
    setShowEmojiMenu(false);
  };

  const handleClosePost = () => {
    setSelectedPost(null);
    setCommentText('');
    setShowEmojiMenu(false);
  };

  const handleToggleLike = async (postId) => {
    try {
      setLikeLoadingId(postId);

      const { data } = await axiosClient.post(`/posts/${postId}/like`);

      setPosts((prevPosts) =>
        prevPosts.map((post) => (post._id === postId ? data : post))
      );

      setSelectedPost((prev) =>
        prev?._id === postId ? data : prev
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLikeLoadingId(null);
    }
  };

  const handleSubmitComment = async () => {
    if (!selectedPost?._id || !commentText.trim()) return;

    try {
      setCommentLoading(true);

      const { data } = await axiosClient.post(
        `/posts/${selectedPost._id}/comments`,
        { text: commentText.trim() }
      );

      setPosts((prev) =>
        prev.map((post) =>
          post._id === selectedPost._id ? data : post
        )
      );

      setSelectedPost(data);
      setCommentText('');
      setShowEmojiMenu(false);
    } catch (error) {
      console.error(error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axiosClient.delete(`/posts/${postId}`);

      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setSelectedPost(null);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

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
              className={styles.avatar}
            />
          </div>

          <div className={styles.info}>
            <div className={styles.topRow}>
              <h1 className={styles.username}>{user.username}</h1>

              {isMyProfile && (
                <>
                  <button
                    className={styles.editBtn}
                    onClick={() => setIsEditOpen(true)}
                  >
                    Edit profile
                  </button>

                  <button
                    className={styles.logoutBtn}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            <div className={styles.stats}>
              <p><span>{posts.length}</span> posts</p>
              <p><span>{user.followers?.length || 0}</span> followers</p>
              <p><span>{user.following?.length || 0}</span> following</p>
            </div>

            <div className={styles.meta}>
              <p>{user.fullName || user.username}</p>
              <p>{user.bio || 'No bio yet'}</p>
            </div>
          </div>
        </header>

        <div className={styles.divider} />

        <div className={styles.grid}>
          {posts.map((post) => (
            <button
              key={post._id}
              className={styles.card}
              onClick={() => handleOpenPost(post)}
            >
              <img src={post.image} className={styles.postImage} />
            </button>
          ))}
        </div>
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          currentUser={user}
          isAuthenticated={true}
          followingSet={new Set(user.following || [])}
          followLoadingId={null}
          likeLoadingId={likeLoadingId}
          commentText={commentText}
          setCommentText={setCommentText}
          commentLoading={commentLoading}
          showEmojiMenu={showEmojiMenu}
          setShowEmojiMenu={setShowEmojiMenu}
          onClose={handleClosePost}
          onToggleFollow={() => {}}
          onToggleLike={handleToggleLike}
          onSubmitComment={handleSubmitComment}
          onDeletePost={handleDeletePost}
        />
      )}
    </div>
  );
}