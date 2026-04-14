import { useEffect, useMemo, useState } from 'react';
import { axiosClient } from '../../shared/api/axiosClient';
import { PostModal } from '../../shared/ui/PostModal/PostModal';
import {
  getCommentsCount,
  getLikesCount,
  getImageSrc,
  isLikedByCurrentUser,
  normalizeComment,
} from '../../shared/lib/postHelpers';
import feedStyles from '../FeedPage/FeedPage.module.css';
import styles from './ExplorePage.module.css';

function chunkPosts(posts, size = 5) {
  const result = [];

  for (let i = 0; i < posts.length; i += size) {
    result.push(posts.slice(i, i + size));
  }

  return result;
}

function fillToFour(items) {
  const result = [...items];

  while (result.length < 4) {
    result.push(null);
  }

  return result;
}

export function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(null);
  const [followLoadingId, setFollowLoadingId] = useState(null);
  const [likeLoadingId, setLikeLoadingId] = useState(null);

  const [selectedPost, setSelectedPost] = useState(null);
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
        console.log('Failed to load explore:', error);
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

  const blocks = useMemo(() => chunkPosts(posts, 5), [posts]);

  const syncPostEverywhere = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );

    setSelectedPost((prevSelected) => {
      if (!prevSelected || prevSelected._id !== updatedPost._id) return prevSelected;
      return updatedPost;
    });
  };

  const openPostModal = (post) => {
    if (!post) return;

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
    return <div className={styles.state}>Loading explore...</div>;
  }

  if (!posts.length) {
    return <div className={styles.state}>No posts yet</div>;
  }

  return (
    <>
      <div className={styles.page}>
        <div className={styles.layout}>
          {blocks.map((block, blockIndex) => {
            const isMirrored = blockIndex % 2 === 1;
            const bigPost = block[0] || null;
            const smallPosts = fillToFour(block.slice(1, 5));

            return (
              <div
                key={`block-${blockIndex}`}
                className={`${styles.block} ${isMirrored ? styles.blockMirrored : ''}`}
              >
                <div className={styles.bigColumn}>
                  {bigPost ? (
                    <button
                      type="button"
                      className={styles.bigCard}
                      onClick={() => openPostModal(bigPost)}
                    >
                      <img
                        src={getImageSrc(bigPost.image)}
                        alt={bigPost.caption || 'Post'}
                        className={styles.image}
                      />
                    </button>
                  ) : (
                    <div className={styles.bigPlaceholder} />
                  )}
                </div>

                <div className={styles.smallGrid}>
                  {smallPosts.map((post, index) =>
                    post ? (
                      <button
                        key={`${post._id}-${blockIndex}-${index}`}
                        type="button"
                        className={styles.smallCard}
                        onClick={() => openPostModal(post)}
                      >
                        <img
                          src={getImageSrc(post.image)}
                          alt={post.caption || 'Post'}
                          className={styles.image}
                        />
                      </button>
                    ) : (
                      <div
                        key={`empty-${blockIndex}-${index}`}
                        className={styles.smallPlaceholder}
                      />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PostModal
        post={selectedPost}
        styles={feedStyles}
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
      />
    </>
  );
}