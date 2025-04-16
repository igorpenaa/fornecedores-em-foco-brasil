
export type UserRole = 'master' | 'admin' | 'user';
export type GeniusStatus = 'pending' | 'approved';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  favorites: string[];
  geniusCoupon?: string;
  geniusStatus?: GeniusStatus; // Status de aprovação para alunos Genius
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
  isFreeSupplier: boolean;
  isGeniusStudent: boolean;
}
