import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';

/**
 * Hook to require authentication for a page.
 * Automatically redirects to login if user is not authenticated.
 * 
 * @example
 * ```tsx
 * const MyProtectedPage = () => {
 *   useRequireAuth();
 *   // rest of component
 * }
 * ```
 */
export function useRequireAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login');
    }
  }, [navigate]);
}

/**
 * Hook to require authentication AND specific permission for a page.
 * Redirects to login if not authenticated, or to fallback route if no permission.
 * 
 * @param hasPermission - Function that returns true if user has required permission
 * @param fallbackRoute - Route to redirect to if user lacks permission (default: previous page or home)
 * 
 * @example
 * ```tsx
 * const EditSongPage = () => {
 *   const { canEdit } = usePermissions();
 *   useRequirePermission(canEdit, '/songs');
 *   // rest of component
 * }
 * ```
 */
export function useRequirePermission(
  hasPermission: () => boolean,
  fallbackRoute: string = '/'
) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login');
      return;
    }

    if (!hasPermission()) {
      navigate(fallbackRoute);
    }
  }, [navigate, hasPermission, fallbackRoute]);
}
