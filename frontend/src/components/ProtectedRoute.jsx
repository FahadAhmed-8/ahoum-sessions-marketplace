import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Spinner from "./Spinner.jsx";

export default function ProtectedRoute({ children, requireCreator = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner full />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  // Role guard: non-creators are nudged to the upsell instead of a hard 403.
  if (requireCreator && user.role !== "creator") {
    return <Navigate to="/become-creator" replace />;
  }
  return children;
}
