import { NavLink, Link } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { axiosClient } from '../../../shared/api/axiosClient';
import { Footer } from '../../../components/Footer/Footer';
import styles from './Layout.module.css';

export function Layout({ children }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [caption, setCaption] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [preview, setPreview] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const emojiRef = useRef(null);

  const isAuthenticated = Boolean(localStorage.getItem('token'));

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentUser(null);
      return;
    }

    const loadCurrentUser = async () => {
      try {
        const res = await axiosClient.get('/users/me');
        setCurrentUser(res.data);
      } catch (error) {
        console.log('Failed to load current user:', error);
      }
    };

    loadCurrentUser();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleOpenCreatePost = () => {
      setIsSearchOpen(false);
      setIsCreateModalOpen(true);
    };

    window.addEventListener('open-create-post', handleOpenCreatePost);

    return () => {
      window.removeEventListener('open-create-post', handleOpenCreatePost);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };

    if (showEmoji) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmoji]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setShowEmoji(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      const query = searchValue.trim();

      if (!query) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);

        const res = await axiosClient.get(
          `/users/search?query=${encodeURIComponent(query)}`
        );

        setSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.log('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchValue]);

  const openCreateModal = () => {
    setIsSearchOpen(false);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCaption('');
    setImageBase64('');
    setPreview('');
    setShowEmoji(false);
  };

  const toggleSearchPanel = () => {
    if (isCreateModalOpen) return;
    setIsSearchOpen((prev) => !prev);
  };

  const openSearchFromFooter = () => {
    if (isCreateModalOpen) return;
    setIsSearchOpen(true);
  };

  const closeSearchPanel = () => {
    setIsSearchOpen(false);
    setSearchValue('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const avatarSrc = useMemo(() => {
    if (!currentUser?.avatar) return '/no-avatar.jpg';

    if (currentUser.avatar.startsWith('data:image')) {
      return currentUser.avatar;
    }

    return `data:image/jpeg;base64,${currentUser.avatar}`;
  }, [currentUser]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;

      setPreview(result);
      setImageBase64(result);
    };

    reader.readAsDataURL(file);
  };

  const handleEmojiClick = (emojiData) => {
    setCaption((prev) => prev + emojiData.emoji);
  };

  const handleSavePost = async () => {
    if (!imageBase64) {
      alert('Please upload an image');
      return;
    }

    try {
      await axiosClient.post('/posts', {
        image: imageBase64,
        caption,
      });

      closeCreateModal();
      window.location.reload();
    } catch (error) {
      console.log('Failed to create post:', error);
      alert('Failed to save post');
    }
  };

  return (
    <>
      <div className={styles.page}>
        <aside className={styles.sidebar}>
          <Link to="/" className={styles.logoLink}>
            <img src="/logo.png" alt="ICHGRAM" className={styles.logoImage} />
          </Link>

          <nav className={styles.menu}>
            <div className={styles.menuMain}>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
                onClick={closeSearchPanel}
              >
                {({ isActive }) => (
                  <>
                    <img
                      src={isActive ? '/icons/home-active.svg' : '/icons/home.svg'}
                      alt=""
                      className={styles.icon}
                    />
                    <span>Home</span>
                  </>
                )}
              </NavLink>

              <button
                type="button"
                className={`${styles.linkButton} ${
                  isSearchOpen ? styles.activeButton : ''
                }`}
                onClick={toggleSearchPanel}
              >
                <img
                  src={
                    isSearchOpen
                      ? '/icons/search-active.svg'
                      : '/icons/search.svg'
                  }
                  alt=""
                  className={styles.icon}
                />
                <span>Search</span>
              </button>

              <NavLink
                to="/explore"
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
                onClick={closeSearchPanel}
              >
                {({ isActive }) => (
                  <>
                    <img
                      src={
                        isActive
                          ? '/icons/explore-active.svg'
                          : '/icons/explore.svg'
                      }
                      alt=""
                      className={styles.icon}
                    />
                    <span>Explore</span>
                  </>
                )}
              </NavLink>

              <Link
                to="/not-existing-page"
                className={styles.link}
                onClick={closeSearchPanel}
              >
                <img src="/icons/messages.svg" alt="" className={styles.icon} />
                <span className={styles.linkText}>
                  Messages
                  <span className={styles.betaBadge}>beta</span>
                </span>
              </Link>

              <Link
                to="/not-existing-page"
                className={styles.link}
                onClick={closeSearchPanel}
              >
                <img
                  src="/icons/notifications.svg"
                  alt=""
                  className={styles.icon}
                />
                <span className={styles.linkText}>
                  Notifications
                  <span className={styles.betaBadge}>beta</span>
                </span>
              </Link>

              <button
                type="button"
                className={styles.linkButton}
                onClick={openCreateModal}
              >
                <img src="/icons/create.svg" alt="" className={styles.icon} />
                <span>Create</span>
              </button>
            </div>

            <div className={styles.menuBottom}>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
                onClick={closeSearchPanel}
              >
                <img
                  src={avatarSrc}
                  alt={currentUser?.username || 'Profile'}
                  className={`${styles.icon} ${styles.profileMiniAvatar}`}
                />
                <span>Profile</span>
              </NavLink>
            </div>
          </nav>
        </aside>

        <div className={styles.content}>
          <main className={styles.main}>{children}</main>
          <Footer
            onSearchClick={openSearchFromFooter}
            onCreateClick={openCreateModal}
          />
        </div>

        {isSearchOpen && (
          <>
            <div className={styles.searchOverlay} onClick={closeSearchPanel} />

            <aside
              className={styles.searchPanel}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.searchPanelHeader}>
                <h2 className={styles.searchPanelTitle}>Search</h2>
              </div>

              <div className={styles.searchInputWrap}>
                <input
                  type="text"
                  placeholder="Search"
                  className={styles.searchInput}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>

              <div className={styles.searchPanelBody}>
                <div className={styles.searchRecentTitle}>
                  {searchValue.trim() ? 'Results' : 'Recent'}
                </div>

                <div className={styles.searchRecentList}>
                  {isSearching ? (
                    <div className={styles.searchEmpty}>Searching...</div>
                  ) : searchValue.trim() && searchResults.length === 0 ? (
                    <div className={styles.searchEmpty}>No users found</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => {
                      const userAvatar = user?.avatar
                        ? user.avatar.startsWith('data:image')
                          ? user.avatar
                          : `data:image/jpeg;base64,${user.avatar}`
                        : '/no-avatar.jpg';

                      return (
                        <Link
                          key={user.id}
                          to={`/profile/${user.id}`}
                          className={styles.searchRecentItem}
                          onClick={closeSearchPanel}
                        >
                          <img
                            src={userAvatar}
                            alt={user.username}
                            className={styles.searchRecentAvatarImage}
                          />

                          <div className={styles.searchRecentInfo}>
                            <div className={styles.searchRecentUsername}>
                              {user.username}
                            </div>

                            {user.bio && (
                              <div className={styles.searchRecentName}>
                                {user.bio}
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className={styles.searchEmpty}>
                      Start typing to search
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </>
        )}
      </div>

      {isCreateModalOpen && (
        <div className={styles.modalOverlay} onClick={closeCreateModal}>
          <div
            className={styles.createModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.createHeader}>
              <div className={styles.createHeaderTitle}>Create new post</div>

              {isAuthenticated && (
                <button
                  type="button"
                  className={styles.shareButton}
                  onClick={handleSavePost}
                >
                  Save
                </button>
              )}

              <button
                type="button"
                className={styles.closeButton}
                onClick={closeCreateModal}
              >
                ×
              </button>
            </div>

            {!isAuthenticated ? (
              <div className={styles.modalBody}>
                <p className={styles.modalText}>
                  Only registered users can create posts.
                </p>
                <p className={styles.modalSubtext}>
                  Please log in to create a new post.
                </p>

                <div className={styles.modalActions}>
                  <Link
                    to="/login"
                    className={styles.primaryButton}
                    onClick={closeCreateModal}
                  >
                    Log in
                  </Link>

                  <Link
                    to="/register"
                    className={styles.secondaryButton}
                    onClick={closeCreateModal}
                  >
                    Register
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.createContent}>
                <div className={styles.uploadArea}>
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className={styles.previewImage}
                    />
                  ) : (
                    <label className={styles.uploadInner}>
                      <input
                        type="file"
                        accept="image/*"
                        className={styles.fileInput}
                        onChange={handleFileChange}
                      />
                      <div className={styles.uploadIcon}>⤴</div>
                      <div className={styles.uploadText}>Upload photo</div>
                    </label>
                  )}
                </div>

                <div className={styles.formSide}>
                  <div className={styles.authorRow}>
                    <div className={styles.modalAvatarWrap}>
                      <img
                        src={avatarSrc}
                        alt={currentUser?.username || 'User'}
                        className={`${styles.modalAvatar} ${
                          !currentUser?.avatar
                            ? styles.modalAvatarPlaceholder
                            : ''
                        }`}
                      />
                    </div>

                    <div className={styles.modalUsername}>
                      {currentUser?.username || 'user'}
                    </div>
                  </div>

                  <textarea
                    className={styles.captionInput}
                    placeholder="Write a caption..."
                    maxLength={600}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />

                  <div className={styles.emojiRow}>
                    <button
                      type="button"
                      className={styles.emojiButton}
                      onClick={() => setShowEmoji((prev) => !prev)}
                    >
                      😊
                    </button>

                    {showEmoji && (
                      <div className={styles.emojiPicker} ref={emojiRef}>
                        <button
                          type="button"
                          className={styles.emojiClose}
                          onClick={() => setShowEmoji(false)}
                        >
                          ×
                        </button>

                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          width={260}
                          height={320}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}