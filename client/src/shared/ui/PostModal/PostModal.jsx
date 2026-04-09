import { useEffect } from 'react';
import {
  formatTimeAgo,
  getAvatarSrc,
  getCommentsCount,
  getImageSrc,
  getLikesCount,
  isLikedByCurrentUser,
} from '../../lib/postHelpers';

const EMOJIS = ['❤️', '🔥', '😍', '👏', '😂', '🎉', '👍', '🙏'];

export function PostModal({
  post,
  styles,
  currentUser,
  isAuthenticated,
  followingSet,
  followLoadingId,
  likeLoadingId,
  commentText,
  setCommentText,
  commentLoading,
  showEmojiMenu,
  setShowEmojiMenu,
  onClose,
  onToggleFollow,
  onToggleLike,
  onSubmitComment,
}) {
  useEffect(() => {
    if (!post) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [post, onClose]);

  if (!post) return null;

  const authorId = post.author?._id;
  const isMyPost = currentUser?._id === authorId;
  const isFollowing = followingSet?.has(authorId);
  const isLiked = isLikedByCurrentUser(post, currentUser?._id);

  const handleEmojiPick = (emoji) => {
    setCommentText((prev) => `${prev}${emoji}`);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.postModal}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.modalClose}
          onClick={onClose}
        >
          ×
        </button>

        <div className={styles.modalImageSide}>
          <img
            src={getImageSrc(post.image)}
            alt={post.caption || 'Post'}
            className={styles.modalImage}
          />
        </div>

        <div className={styles.modalContentSide}>
          <div className={styles.modalHeader}>
            <div className={styles.modalAuthorInfo}>
              <div className={styles.modalAvatarWrap}>
                <img
                  src={getAvatarSrc(post.author)}
                  alt={post.author?.username || 'User'}
                  className={styles.modalAvatar}
                />
              </div>

              <div className={styles.modalHeaderMeta}>
                <div className={styles.modalHeaderTop}>
                  <span className={styles.modalUsername}>
                    {post.author?.username || 'user'}
                  </span>

                  {isAuthenticated && !isMyPost && authorId && (
                    <>
                      <span className={styles.dot}>•</span>
                      <button
                        type="button"
                        className={styles.followButton}
                        onClick={() => onToggleFollow(authorId)}
                        disabled={followLoadingId === authorId}
                      >
                        {followLoadingId === authorId
                          ? '...'
                          : isFollowing
                            ? 'Following'
                            : 'Подписаться'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.modalCaptionRow}>
              <div className={styles.modalCommentAvatarWrap}>
                <img
                  src={getAvatarSrc(post.author)}
                  alt={post.author?.username || 'User'}
                  className={styles.modalCommentAvatar}
                />
              </div>

              <div className={styles.modalCommentContent}>
                <span className={styles.modalCaptionUsername}>
                  {post.author?.username || 'user'}
                </span>
                <span className={styles.modalCaptionText}>
                  {post.caption || 'No caption'}
                </span>
              </div>
            </div>

            <div className={styles.commentsList}>
              {(post.comments || []).map((comment) => (
                <div key={comment._id} className={styles.modalCommentRow}>
                  <div className={styles.modalCommentAvatarWrap}>
                    <img
                      src={getAvatarSrc(comment.author)}
                      alt={comment.author?.username || 'User'}
                      className={styles.modalCommentAvatar}
                    />
                  </div>

                  <div className={styles.modalCommentContent}>
                    <span className={styles.modalCommentUsername}>
                      {comment.author?.username || 'user'}
                    </span>
                    <span className={styles.modalCommentText}>
                      {comment.text}
                    </span>
                    <div className={styles.modalCommentTime}>
                      {formatTimeAgo(comment.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
            <div className={styles.modalMetricsRow}>
              <button
                type="button"
                className={`${styles.metricButton} ${
                  isLiked ? styles.metricButtonLiked : ''
                }`}
                onClick={() => onToggleLike(post._id)}
                disabled={!isAuthenticated || likeLoadingId === post._id}
              >
                <span className={styles.metricIcon}>{isLiked ? '♥' : '♡'}</span>
                <span className={styles.metricValue}>
                  {getLikesCount(post)}
                </span>
              </button>

              <div className={styles.metricButtonStatic}>
                <span className={styles.metricIcon}>💬</span>
                <span className={styles.metricValue}>
                  {getCommentsCount(post)}
                </span>
              </div>
            </div>

            <div className={styles.modalPublishedTime}>
              {formatTimeAgo(post.createdAt)}
            </div>
          </div>

          <div className={styles.commentComposer}>
            <div className={styles.commentInputWrap}>
              <button
                type="button"
                className={styles.emojiButton}
                onClick={() => setShowEmojiMenu((prev) => !prev)}
              >
                ☺
              </button>

              {showEmojiMenu && (
                <div className={styles.emojiMenu}>
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={styles.emojiItem}
                      onClick={() => handleEmojiPick(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                className={styles.commentInput}
                placeholder="Add comment"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                onFocus={() => setShowEmojiMenu(false)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onSubmitComment();
                  }
                }}
              />
            </div>

            <button
              type="button"
              className={styles.sendButton}
              onClick={onSubmitComment}
              disabled={!commentText.trim() || commentLoading || !isAuthenticated}
            >
              {commentLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}