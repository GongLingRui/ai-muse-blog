import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireAuthor?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 *
 * Protects routes that require authentication.
 * Can also require specific user roles.
 *
 * @example
 * // Basic protection - requires login
 * <ProtectedRoute>
 *   <SettingsPage />
 * </ProtectedRoute>
 *
 * @example
 * // Admin only
 * <ProtectedRoute requireAdmin>
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * @example
 * // Admin or Author
 * <ProtectedRoute requireAuthor>
 *   <CreateArticle />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireAuthor = false,
  redirectTo = "/auth",
}) => {
  const { isAuthenticated, user } = useAuth();

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check admin role
  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Check author or admin role
  if (requireAuthor && user?.role !== "admin" && user?.role !== "author") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * PublicRoute Component
 *
 * Routes that should only be accessible when NOT authenticated.
 * Useful for login/register pages.
 *
 * @example
 * <PublicRoute>
 *   <AuthPage />
 * </PublicRoute>
 */
interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = "/",
}) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
