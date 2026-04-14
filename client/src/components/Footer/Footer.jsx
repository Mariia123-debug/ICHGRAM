import { NavLink } from 'react-router-dom';
import styles from './Footer.module.css';

export function Footer({ onSearchClick, onCreateClick }) {
  return (
    <footer className={styles.footer}>
      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
          }
        >
          Explore
        </NavLink>

        <button
          type="button"
          className={styles.navButton}
          onClick={onSearchClick}
        >
          Search
        </button>

        <NavLink
          to="/404"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
          }
        >
          Messages
        </NavLink>

        <NavLink
          to="/404"
          className={({ isActive }) =>
            isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
          }
        >
          Notifications
        </NavLink>

        <button
          type="button"
          className={styles.navButton}
          onClick={onCreateClick}
        >
          Create
        </button>
      </nav>
    </footer>
  );
}