
// Plan types and interfaces
export type PlanType = 'free' | 'monthly' | 'semi_annual' | 'annual';

export interface Plan {
  id: PlanType;
  title: string;
  price: number;
  description: string;
  features: string[];
  priceId?: string;
  savings?: string;
  maxCategories?: number;
  highlighted?: boolean;
}

export interface UserSubscription {
  userId: string;
  planType: PlanType;
  status: 'active' | 'canceled' | 'past_due';
  startDate: Date;
  endDate: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  selectedCategories?: string[];
}
