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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <Layout>
            <FeedPage />
          </Layout>
        }
      />

      <Route
        path="/explore"
        element={
          <Layout>
            <ExplorePage />
          </Layout>
        }
      />

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

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}