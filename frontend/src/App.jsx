import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import SessionDetail from "./pages/SessionDetail.jsx";
import Login from "./pages/Login.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import CreatorDashboard from "./pages/CreatorDashboard.jsx";
import BecomeCreator from "./pages/BecomeCreator.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/sessions/:id"
        element={
          <Layout>
            <SessionDetail />
          </Layout>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Layout>
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/dashboard/profile"
        element={
          <Layout>
            <ProtectedRoute>
              <UserDashboard tab="profile" />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/become-creator"
        element={
          <Layout>
            <ProtectedRoute>
              <BecomeCreator />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/creator"
        element={
          <Layout>
            <ProtectedRoute requireCreator>
              <CreatorDashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="*"
        element={
          <Layout>
            <NotFound />
          </Layout>
        }
      />
    </Routes>
  );
}
