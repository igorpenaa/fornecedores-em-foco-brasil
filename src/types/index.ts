
export type UserRole = 'master' | 'admin' | 'user' | 'aluno';
export type GeniusStatus = 'pending' | 'approved' | 'blocked';
export type PlanType = 'free' | 'monthly' | 'semi_annual' | 'annual';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  favorites: string[];
  geniusCoupon?: string;
  geniusStatus?: GeniusStatus; // Status de aprovação para alunos Genius
  plano?: PlanType; // Campo para controlar o plano do usuário
  firstAccessCompleted?: boolean; // Marca se é o primeiro acesso do usuário
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
  ratings?: Rating[];
  averageRating?: number;
}

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  supplierId: string;
  rating: number; // 1-5
  comment?: string;
  issues?: string[]; // Array of issues selected by the user
  createdAt: Date;
}

export interface Highlight {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  link?: string;
  createdAt: Date;
  transitionDelay?: number; // Delay in seconds before moving to the next slide
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  link?: string;
  createdAt: Date;
}

export interface Ad {
  id: string;
  title: string;
  embedCode: string; // HTML embed code for ads
  isActive: boolean;
  createdAt: Date;
}

export interface Issue {
  id: string;
  name: string;
  createdAt: Date;
}
