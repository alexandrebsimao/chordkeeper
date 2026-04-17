export type Feature = {
  id: number;
  key: string;
  label: string;
  description?: string;
  sort_order?: number;
};

export type Plan = {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  formatted_price?: string;
  duration_days: number;
  interval: string;
  active: boolean;
  sort_order?: number;
  max_songs: number;
  max_setlists: number;
  max_collaborators?: number;
  features?: Feature[];
  features_list?: Array<{
    key: string;
    label: string;
    description?: string;
    enabled: boolean;
  }>;
  subscribers_count?: number;
  subscribers?: Array<{
    id: number;
    user_id: number;
    name: string;
    email: string;
    started_at: string;
    expires_at: string;
    status: string;
  }>;
};

export type Subscription = {
  id: number;
  status: string;
  started_at: string;
  expires_at: string;
  cancelled_at?: string;
  plan: Plan;
  payment_method: {
    brand?: string;
    last4?: string;
  };
  customer: {
    name?: string;
    document?: string;
    phone?: string;
  };
};
