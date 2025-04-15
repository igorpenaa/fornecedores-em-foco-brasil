
export type UserRole = 'master' | 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  favorites: string[];
  geniusCoupon?: string; // New field for genius coupon
}

export interface Category {
  id: string;
  name: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  city: string;
  categoryIds: string[];
  image: string;
  createdAt: Date;
  updatedAt: Date;
  isFreeSupplier: boolean; // New field
  isGeniusStudent: boolean; // New field
}
