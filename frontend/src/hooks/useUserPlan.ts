import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/auth';

interface UserPlan {
  id: number;
  email: string;
  role: string;
  plan_name: string;
  songs_count: number;
  setlists_count: number;
  songs_limit: number | "unlimited";
  setlists_limit: number | "unlimited";
  has_active_subscription: boolean;
}

export function useUserPlan() {
  return useQuery<UserPlan>({
    queryKey: ['user-plan'],
    queryFn: async () => {
      const response = await fetchWithAuth('/api/users/me');

      if (!response.ok) {
        throw new Error('Failed to fetch user plan');
      }

      const data = await response.json();
      
      // Convert Infinity to "unlimited" string
      return {
        ...data,
        songs_limit: data.songs_limit === null || data.songs_limit === Infinity ? "unlimited" : data.songs_limit,
        setlists_limit: data.setlists_limit === null || data.setlists_limit === Infinity ? "unlimited" : data.setlists_limit
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
