export function formatTimeAgo(dateString) {
  if (!dateString) return '';

  const now = new Date();
  const createdAt = new Date(dateString);
  const diffMs = now - createdAt;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < minute) return 'just now';

  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `${minutes}m ago`;
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours}h ago`;
  }

  if (diffMs < week) {
    const days = Math.floor(diffMs / day);
    return `${days}d ago`;
  }

  if (diffMs < month) {
    const weeks = Math.floor(diffMs / week);
    return `${weeks}w ago`;
  }

  if (diffMs < year) {
    const months = Math.floor(diffMs / month);
    return `${months}mo ago`;
  }

  const years = Math.floor(diffMs / year);
  return `${years}y ago`;
}

export function getAvatarSrc(user) {
  if (!user?.avatar) return '/no-avatar.jpg';

  if (user.avatar.startsWith('data:image')) {
    return user.avatar;
  }

  return `data:image/jpeg;base64,${user.avatar}`;
}

export function getImageSrc(image) {
  if (!image) return '';

  if (image.startsWith('data:image')) {
    return image;
  }

  return image;
}

export function normalizeComment(comment) {
  if (!comment) return null;

  return {
    _id: comment._id || String(Date.now() + Math.random()),
    text: comment.text || '',
    createdAt: comment.createdAt || new Date().toISOString(),
    author: comment.author || {
      username: 'user',
      avatar: '',
    },
  };
}

export function getCommentsCount(post) {
  if (typeof post.commentsCount === 'number') return post.commentsCount;
  if (Array.isArray(post.comments)) return post.comments.length;
  return 0;
}

export function getLikesCount(post) {
  if (typeof post.likesCount === 'number') return post.likesCount;
  if (Array.isArray(post.likes)) return post.likes.length;
  return 0;
}

export function isLikedByCurrentUser(post, currentUserId) {
  if (!post || !currentUserId || !Array.isArray(post.likes)) return false;

  return post.likes.some((like) => {
    if (typeof like === 'string') return like === currentUserId;
    return like?._id === currentUserId;
  });
}