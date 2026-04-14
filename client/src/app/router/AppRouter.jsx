import { Routes, Route } from 'react-router-dom';
import { Layout } from './layout/Layout';

import { LoginPage } from '../../pages/LoginPage/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage/RegisterPage';
import { FeedPage } from '../../pages/FeedPage/FeedPage';
import { ExplorePage } from '../../pages/ExplorePage/ExplorePage';
import { ProfilePage } from '../../pages/ProfilePage/ProfilePage';
import { CreatePostPage } from '../../pages/CreatePostPage/CreatePostPage';
import { NotFoundPage } from '../../pages/NotFoundPage/NotFoundPage';

import { ProtectedRoute } from '../../components/ProtectedRoute/ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      {/* 🔓 Публичные */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 🏠 Главная */}
      <Route
        path="/"
        element={
          <Layout>
            <FeedPage />
          </Layout>
        }
      />

      {/* 🔍 Explore */}
      <Route
        path="/explore"
        element={
          <Layout>
            <ExplorePage />
          </Layout>
        }
      />

      {/* 👤 МОЙ ПРОФИЛЬ */}
      <Route
        path="/profile"
        element={
          <Layout>
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          </Layout>
        }
      />

      {/* 👤 ЧУЖОЙ ПРОФИЛЬ */}
      <Route
        path="/profile/:id"
        element={
          <Layout>
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          </Layout>
        }
      />

      {/* ➕ Создание поста */}
      <Route
        path="/create-post"
        element={
          <Layout>
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          </Layout>
        }
      />

      {/* ❌ 404 ВНУТРИ LAYOUT */}
      <Route
        path="*"
        element={
          <Layout>
            <NotFoundPage />
          </Layout>
        }
      />
    </Routes>
  );
}