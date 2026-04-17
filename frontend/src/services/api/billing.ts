import BaseApiService from "./base";

export type PaymentMethod = "credit_card" | "pix" | "boleto" | "debit_card";

export type PaymentData = {
  method: PaymentMethod;
  number?: string;
  expiryMonth?: string;
  expiryYear?: string;
  ccv?: string;
  holderName?: string;
  brand?: string;
  last4?: string;
  token?: string;
};

export type CustomerData = {
  name: string;
  document: string;
  phone: string;
};

export type Plan = {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  duration_days: number;
  interval: string;
  active: boolean;
  sort_order?: number;
  features: string[];
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
  payment_provider: string;
  external_subscription_id: string;
  payment_method_brand?: string;
  payment_method_last4?: string;
  customer_name?: string;
  customer_document?: string;
  customer_phone?: string;
  payment_method?: {
    brand?: string;
    last4?: string;
  };
  customer?: {
    name?: string;
    document?: string;
    phone?: string;
  };
};

class BillingService extends BaseApiService {
  listPlans() {
    return this.get<Plan[]>("/api/plans");
  }

  getMySubscription() {
    return this.get<Subscription | null>("/api/subscription");
  }

  subscribe(payload: {
    plan_id: number;
    customer_data: CustomerData;
    payment_data: PaymentData;
  }) {
    return this.post<Subscription>("/api/subscription", payload);
  }

  changePlan(plan_id: number) {
    return this.patch<Subscription>("/api/subscription/change_plan", { plan_id });
  }

  updatePayment(payload: {
    payment_data: PaymentData;
    customer_data?: CustomerData;
  }) {
    return this.patch<Subscription>("/api/subscription/update_payment_method", payload);
  }

  cancel() {
    return this.patch<Subscription>("/api/subscription/cancel");
  }

  renew() {
    return this.patch<Subscription>("/api/subscription/renew");
  }

  listNotifications() {
    return this.get<Array<{ id: number; kind: string; title: string; message: string; read_at?: string; created_at: string }>>(
      "/api/subscription/notifications"
    );
  }

  markNotificationRead(id: number) {
    return this.patch<{ data: { id: number; read_at: string } }>(`/api/subscription/notifications/${id}/read`);
  }

  adminListPlans() {
    return this.get<Plan[]>("/api/admin/plans");
  }

  adminGetPlan(id: number) {
    return this.get<Plan>(`/api/admin/plans/${id}`);
  }

  adminCreatePlan(payload: { plan: Partial<Plan>; features: string[] }) {
    return this.post<Plan>("/api/admin/plans", payload);
  }

  adminUpdatePlan(id: number, payload: { plan: Partial<Plan>; features?: string[] }) {
    return this.patch<Plan>(`/api/admin/plans/${id}`, payload);
  }

  adminTogglePlan(id: number, active: boolean) {
    return this.patch<Plan>(`/api/admin/plans/${id}/${active ? "activate" : "deactivate"}`);
  }

  adminListCustomers() {
    return this.get<
      Array<{
        id: number;
        name: string;
        email: string;
        role: string;
        created_at: string;
        subscription?: {
          id: number;
          plan_id: number;
          plan_name: string;
          status: string;
          started_at: string;
          expires_at: string;
          cancelled_at?: string;
        };
      }>
    >("/api/admin/customers");
  }

  adminGetCustomer(id: number) {
    return this.get<{
      id: number;
      name: string;
      email: string;
      role: string;
      created_at: string;
      subscriptions: Array<{
        id: number;
        plan_id: number;
        plan_name: string;
        status: string;
        started_at: string;
        expires_at: string;
        cancelled_at?: string;
      }>;
    }>(`/api/admin/customers/${id}`);
  }

  adminUpdateCustomerSubscription(customerId: number, payload: { plan_id?: number; expires_at?: string; status?: string }) {
    return this.patch<any>(`/api/admin/customers/${customerId}/subscription`, payload);
  }

  adminListFeatures() {
    return this.request<{
      data: Array<{
        id: number;
        key: string;
        name: string;
        description: string;
        enabled: boolean;
        allowed_plan_ids: number[];
        allowed_plans: Array<{ id: number; name: string }>;
      }>;
      plans: Array<{ id: number; name: string }>;
    }>("/api/admin/feature_flags");
  }

  adminUpdateFeature(id: number, payload: { feature_flag: { name?: string; description?: string; enabled?: boolean; allowed_plan_ids?: number[] } }) {
    return this.patch<any>(`/api/admin/feature_flags/${id}`, payload);
  }

  // Methods for Features (raw features, not feature flags)
  adminListRawFeatures() {
    return this.get<Array<{
      id: number;
      key: string;
      label: string;
      description?: string;
      sort_order?: number;
    }>>("/api/admin/features");
  }

  adminGetFeature(id: number) {
    return this.get<{
      id: number;
      key: string;
      label: string;
      description?: string;
      sort_order?: number;
    }>(`/api/admin/features/${id}`);
  }

  adminCreateFeature(payload: { feature: { key: string; label: string; description?: string; sort_order?: number } }) {
    return this.post<any>("/api/admin/features", payload);
  }

  adminUpdateRawFeature(id: number, payload: { feature: { label: string; description?: string; sort_order?: number } }) {
    return this.patch<any>(`/api/admin/features/${id}`, payload);
  }

  adminDeleteFeature(id: number) {
    return this.request<void>(`/api/admin/features/${id}`, { method: "DELETE" });
  }
}

export const billingService = new BillingService();
