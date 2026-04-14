import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '../../shared/api/axiosClient';
import { PostModal } from '../../shared/ui/PostModal/PostModal';
import {
  formatTimeAgo,
  getAvatarSrc,
  getCommentsCount,
  getImageSrc,
  getLikesCount,
  isLikedByCurrentUser,
  normalizeComment,
} from '../../shared/lib/postHelpers';
import styles from './FeedPage.module.css';

export function FeedPage() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [followLoadingId, setFollowLoadingId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  const [likeLoadingId, setLikeLoadingId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  const isAuthenticated = Boolean(localStorage.getItem('token'));

  useEffect(() => {
    const loadData = async () => {
      try {
        const postsRes = await axiosClient.get('/posts');
        const safePosts = Array.isArray(postsRes.data)
          ? postsRes.data.map((post) => ({
              ...post,
              comments: Array.isArray(post.comments)
                ? post.comments.map(normalizeComment).filter(Boolean)
                : [],
            }))
          : [];

        setPosts(safePosts);

        if (isAuthenticated) {
          const meRes = await axiosClient.get('/users/me');
          setCurrentUser(meRes.data);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.log('Failed to load feed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const followingSet = useMemo(() => {
    const ids = currentUser?.following || [];

    return new Set(
      ids
        .map((item) => {
          if (typeof item === 'string') return item;
          return item?._id;
        })
        .filter(Boolean)
    );
  }, [currentUser]);

  const handleOpenProfile = (userId) => {
    if (!userId) return;

    if (currentUser?._id === userId) {
      navigate('/profile');
      return;
    }

    navigate(`/profile/${userId}`);
  };

  const syncPostEverywhere = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );

    setSelectedPost((prevSelected) => {
      if (!prevSelected || prevSelected._id !== updatedPost._id) return prevSelected;
      return updatedPost;
    });
  };

  const handleToggleFollow = async (authorId) => {
    if (!isAuthenticated || !authorId || followLoadingId) return;

    try {
      setFollowLoadingId(authorId);

      const res = await axiosClient.post(`/users/${authorId}/follow`);
      const { isFollowing } = res.data;

      setCurrentUser((prev) => {
        if (!prev) return prev;

        const prevFollowing = Array.isArray(prev.following) ? prev.following : [];
        let nextFollowing;

        if (isFollowing) {
          const alreadyExists = prevFollowing.some((item) => {
            const id = typeof item === 'string' ? item : item?._id;
            return id === authorId;
          });

          nextFollowing = alreadyExists ? prevFollowing : [...prevFollowing, authorId];
        } else {
          nextFollowing = prevFollowing.filter((item) => {
            const id = typeof item === 'string' ? item : item?._id;
            return id !== authorId;
          });
        }

        return {
          ...prev,
          following: nextFollowing,
        };
      });
    } catch (error) {
      console.log('Failed to toggle follow:', error);
    } finally {
      setFollowLoadingId(null);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!isAuthenticated || !currentUser?._id || likeLoadingId) return;

    const targetPost =
      selectedPost?._id === postId
        ? selectedPost
        : posts.find((post) => post._id === postId);

    if (!targetPost) return;

    const alreadyLiked = isLikedByCurrentUser(targetPost, currentUser._id);

    const optimisticLikes = alreadyLiked
      ? (targetPost.likes || []).filter((like) => {
          const likeId = typeof like === 'string' ? like : like?._id;
          return likeId !== currentUser._id;
        })
      : [...(targetPost.likes || []), currentUser._id];

    const optimisticPost = {
      ...targetPost,
      likes: optimisticLikes,
      likesCount: alreadyLiked
        ? Math.max(0, getLikesCount(targetPost) - 1)
        : getLikesCount(targetPost) + 1,
    };

    syncPostEverywhere(optimisticPost);

    try {
      setLikeLoadingId(postId);

      const res = await axiosClient.post(`/posts/${postId}/like`);

      if (res?.data) {
        const serverPost = {
          ...optimisticPost,
          ...(res.data.post || {}),
        };

        if (typeof res.data.likesCount === 'number') {
          serverPost.likesCount = res.data.likesCount;
        }

        if (typeof res.data.isLiked === 'boolean') {
          serverPost.likes = res.data.isLiked
            ? [...(targetPost.likes || []), currentUser._id]
            : (targetPost.likes || []).filter((like) => {
                const likeId = typeof like === 'string' ? like : like?._id;
                return likeId !== currentUser._id;
              });
        }

        syncPostEverywhere(serverPost);
      }
    } catch (error) {
      console.log('Failed to toggle like:', error);
    } finally {
      setLikeLoadingId(null);
    }
  };

  const openPostModal = (post) => {
    setSelectedPost({
      ...post,
      comments: Array.isArray(post.comments)
        ? post.comments.map(normalizeComment).filter(Boolean)
        : [],
    });
    setCommentText('');
    setShowEmojiMenu(false);
  };

  const closePostModal = () => {
    setSelectedPost(null);
    setCommentText('');
    setShowEmojiMenu(false);
  };

  const handleDeletePost = async (postId) => {
    try {
      await axiosClient.delete(`/posts/${postId}`);

      setPosts((prev) => prev.filter((post) => post._id !== postId));

      setSelectedPost((prev) => {
        if (!prev || prev._id !== postId) return prev;
        return null;
      });

      setCommentText('');
      setShowEmojiMenu(false);
    } catch (error) {
      console.log('Failed to delete post:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated || !selectedPost || commentLoading) return;

    const text = commentText.trim();
    if (!text) return;

    const tempComment = {
      _id: `temp-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      author: {
        _id: currentUser?._id,
        username: currentUser?.username || 'you',
        avatar: currentUser?.avatar || '',
      },
    };

    const optimisticPost = {
      ...selectedPost,
      comments: [...(selectedPost.comments || []), tempComment],
      commentsCount: getCommentsCount(selectedPost) + 1,
    };

    syncPostEverywhere(optimisticPost);
    setCommentText('');
    setShowEmojiMenu(false);

    try {
      setCommentLoading(true);

      const res = await axiosClient.post(`/posts/${selectedPost._id}/comments`, {
        text,
      });

      if (res?.data?.post) {
        const updatedPost = {
          ...res.data.post,
          comments: Array.isArray(res.data.post.comments)
            ? res.data.post.comments.map(normalizeComment).filter(Boolean)
            : [],
        };

        syncPostEverywhere(updatedPost);
      }
    } catch (error) {
      console.log('Failed to add comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.feed}>
          <div className={styles.stateText}>Loading posts...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.feed}>
          {posts.length === 0 ? (
            <div className={styles.stateText}>No posts yet</div>
          ) : (
            <>
              <div className={styles.postsGrid}>
                {posts.map((post) => {
                  const author = post.author || {};
                  const authorId = author._id;
                  const isMyPost = currentUser?._id === authorId;
                  const isFollowing = followingSet.has(authorId);

                  const likesCount = getLikesCount(post);
                  const commentsCount = getCommentsCount(post);
                  const liked = isLikedByCurrentUser(post, currentUser?._id);

                  return (
                    <article key={post._id} className={styles.postCard}>
                      <div className={styles.postHeader}>
                        <div className={styles.authorInfo}>
                          <button
                            type="button"
                            className={styles.avatarWrap}
                            onClick={() => handleOpenProfile(authorId)}
                          >
                            <img
                              src={getAvatarSrc(author)}
                              alt={author.username || 'User'}
                              className={styles.avatar}
                            />
                          </button>

                          <div className={styles.authorMeta}>
                            <div className={styles.authorTopLine}>
                              <span className={styles.username}>
                                {author.username || 'user'}
                              </span>
                              <span className={styles.dot}>•</span>
                              <span className={styles.time}>
                                {formatTimeAgo(post.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isAuthenticated && !isMyPost && authorId && (
                          <button
                            type="button"
                            className={styles.followButton}
                            onClick={() => handleToggleFollow(authorId)}
                            disabled={followLoadingId === authorId}
                          >
                            {followLoadingId === authorId
                              ? '...'
                              : isFollowing
                                ? 'Following'
                                : 'Follow'}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        className={styles.imageButton}
                        onClick={() => openPostModal(post)}
                      >
                        <div className={styles.imageWrap}>
                          <img
                            src={getImageSrc(post.image)}
                            alt={post.caption || 'Post'}
                            className={styles.postImage}
                          />
                        </div>
                      </button>

                      <div className={styles.postActions}>
                        <div className={styles.metricsRow}>
                          <button
                            type="button"
                            className={`${styles.metricButton} ${liked ? styles.metricButtonLiked : ''}`}
                            onClick={() => handleToggleLike(post._id)}
                            disabled={!isAuthenticated || likeLoadingId === post._id}
                          >
                            <span className={styles.metricIcon}>
                              {liked ? '♥' : '♡'}
                            </span>
                            <span className={styles.metricValue}>{likesCount}</span>
                          </button>

                          <button
                            type="button"
                            className={styles.metricButton}
                            onClick={() => openPostModal(post)}
                          >
                            <span className={styles.metricIcon}>💬</span>
                            <span className={styles.metricValue}>{commentsCount}</span>
                          </button>
                        </div>
                      </div>

                      <div className={styles.captionBlock}>
                        <span className={styles.captionUsername}>
                          {author.username || 'user'}
                        </span>
                        <span className={styles.captionText}>
                          {post.caption || 'No caption'}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className={styles.endFeed}>
                <img
                  src="/end-feed.jpg"
                  alt="End of feed"
                  className={styles.endFeedImage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <PostModal
        post={selectedPost}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
        followingSet={followingSet}
        followLoadingId={followLoadingId}
        likeLoadingId={likeLoadingId}
        commentText={commentText}
        setCommentText={setCommentText}
        commentLoading={commentLoading}
        showEmojiMenu={showEmojiMenu}
        setShowEmojiMenu={setShowEmojiMenu}
        onClose={closePostModal}
        onToggleFollow={handleToggleFollow}
        onToggleLike={handleToggleLike}
        onSubmitComment={handleSubmitComment}
        onDeletePost={handleDeletePost}
      />
    </>
  );
}