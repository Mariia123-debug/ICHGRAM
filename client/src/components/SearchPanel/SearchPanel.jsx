import styles from './SearchPanel.module.css';

export function SearchPanel({ isOpen, onClose }) {
  return (
    <aside
      className={`${styles.panel} ${isOpen ? styles.open : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>Search</h2>
      </div>

      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Search"
          className={styles.input}
        />
      </div>

      <div className={styles.content}>
        <p className={styles.sectionTitle}>Recent</p>

        <div className={styles.recentList}>
          <button type="button" className={styles.recentItem}>
            <div className={styles.avatar} />
            <div className={styles.userInfo}>
              <span className={styles.username}>techiva</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}