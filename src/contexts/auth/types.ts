
import { User, UserRole, GeniusStatus } from "@/types";
import { UserSubscription } from "@/services/stripe-service";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  subscription: UserSubscription | null;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, geniusCoupon?: string) => Promise<User>;
  logout: () => Promise<void>;
  hasPermission: (roles: UserRole[]) => boolean;
  toggleFavorite: (supplierId: string) => void;
  isFavorite: (supplierId: string) => boolean;
  updateGeniusStatus: (userId: string, status: GeniusStatus) => Promise<void>;
  canAccessGenius: () => boolean;
  refreshSubscription: () => Promise<UserSubscription | null>;
  hasAccessToCategory: (categoryId: string) => Promise<boolean>;
  canAccessApp: () => boolean;
}
