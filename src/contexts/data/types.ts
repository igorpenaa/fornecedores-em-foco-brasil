
import { Category, Supplier, Highlight, Product } from "@/types";

export interface DataContextType {
  categories: Category[];
  suppliers: Supplier[];
  highlights: Highlight[];
  accessibleSuppliers: Supplier[];
  addCategory: (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  getCategory: (id: string) => Category | undefined;
  getSupplier: (id: string) => Supplier | undefined;
  filterSuppliersByCategory: (categoryId: string | null) => Supplier[];
  uploadCategoryImage: (id: string, file: File) => Promise<string>;
  uploadSupplierImage: (id: string, file: File) => Promise<string>;
  refreshData: () => Promise<void>;
  rateSupplier: (supplierId: string, rating: number, comment: string, issues: string[]) => Promise<void>;
  addHighlight: (highlight: Omit<Highlight, "id" | "createdAt">) => Promise<void>;
  updateHighlight: (id: string, highlight: Partial<Highlight>) => Promise<void>;
  deleteHighlight: (id: string) => Promise<void>;
  uploadHighlightMedia: (file: File) => Promise<{publicId: string, url: string, mediaType: 'image' | 'video'}>;
  isDataLoading: boolean;
  canAccessSupplier: (supplierId: string) => boolean;
}
