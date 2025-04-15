
export type UserRole = 'master' | 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  favorites: string[]; // IDs dos fornecedores favoritados
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
  categoryIds: string[]; // Changed from categoryId to categoryIds array
  image: string;
  createdAt: Date;
  updatedAt: Date;
}
