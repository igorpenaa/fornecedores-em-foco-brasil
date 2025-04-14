
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Category, Supplier } from "@/types";
import { useAuth } from "./auth-context";

interface DataContextType {
  categories: Category[];
  suppliers: Supplier[];
  addCategory: (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getCategory: (id: string) => Category | undefined;
  getSupplier: (id: string) => Supplier | undefined;
  filterSuppliersByCategory: (categoryId: string | null) => Supplier[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data inicial
const MOCK_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Alimentos",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=300&h=200&auto=format&fit=crop",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    name: "Serviços",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=300&h=200&auto=format&fit=crop",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    name: "Tecnologia",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=300&h=200&auto=format&fit=crop",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "1",
    name: "Fornecedor de Alimentos Naturais",
    phone: "11999887766",
    city: "São Paulo",
    categoryId: "1",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&h=200&auto=format&fit=crop",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    name: "Serviços de Limpeza Profissional",
    phone: "21998765432",
    city: "Rio de Janeiro",
    categoryId: "2",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200&h=200&auto=format&fit=crop",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    name: "Tech Solutions",
    phone: "31987654321",
    city: "Belo Horizonte",
    categoryId: "3",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=200&h=200&auto=format&fit=crop",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "4",
    name: "Distribuidora de Alimentos",
    phone: "11987654321",
    city: "Campinas",
    categoryId: "1",
    image: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?q=80&w=200&h=200&auto=format&fit=crop",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Carregar dados do localStorage se existirem, caso contrário usar os mocks
    const storedCategories = localStorage.getItem("categories");
    const storedSuppliers = localStorage.getItem("suppliers");

    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      setCategories(MOCK_CATEGORIES);
      localStorage.setItem("categories", JSON.stringify(MOCK_CATEGORIES));
    }

    if (storedSuppliers) {
      setSuppliers(JSON.parse(storedSuppliers));
    } else {
      setSuppliers(MOCK_SUPPLIERS);
      localStorage.setItem("suppliers", JSON.stringify(MOCK_SUPPLIERS));
    }
  }, []);

  // Funções para categorias
  const addCategory = (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    localStorage.setItem("categories", JSON.stringify(updatedCategories));
  };

  const updateCategory = (id: string, category: Partial<Category>) => {
    const categoryIndex = categories.findIndex(c => c.id === id);
    if (categoryIndex === -1) return;

    const updatedCategories = [...categories];
    updatedCategories[categoryIndex] = {
      ...updatedCategories[categoryIndex],
      ...category,
      updatedAt: new Date()
    };

    setCategories(updatedCategories);
    localStorage.setItem("categories", JSON.stringify(updatedCategories));
  };

  const deleteCategory = (id: string) => {
    // Verificar se há fornecedores com esta categoria
    const supplierWithCategory = suppliers.find(s => s.categoryId === id);
    if (supplierWithCategory) {
      alert("Não é possível excluir uma categoria que possui fornecedores associados.");
      return;
    }

    const updatedCategories = categories.filter(c => c.id !== id);
    setCategories(updatedCategories);
    localStorage.setItem("categories", JSON.stringify(updatedCategories));
  };

  const getCategory = (id: string) => {
    return categories.find(c => c.id === id);
  };

  // Funções para fornecedores
  const addSupplier = (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedSuppliers = [...suppliers, newSupplier];
    setSuppliers(updatedSuppliers);
    localStorage.setItem("suppliers", JSON.stringify(updatedSuppliers));
  };

  const updateSupplier = (id: string, supplier: Partial<Supplier>) => {
    const supplierIndex = suppliers.findIndex(s => s.id === id);
    if (supplierIndex === -1) return;

    const updatedSuppliers = [...suppliers];
    updatedSuppliers[supplierIndex] = {
      ...updatedSuppliers[supplierIndex],
      ...supplier,
      updatedAt: new Date()
    };

    setSuppliers(updatedSuppliers);
    localStorage.setItem("suppliers", JSON.stringify(updatedSuppliers));
  };

  const deleteSupplier = (id: string) => {
    const updatedSuppliers = suppliers.filter(s => s.id !== id);
    setSuppliers(updatedSuppliers);
    localStorage.setItem("suppliers", JSON.stringify(updatedSuppliers));
  };

  const getSupplier = (id: string) => {
    return suppliers.find(s => s.id === id);
  };

  const filterSuppliersByCategory = (categoryId: string | null) => {
    if (!categoryId) return suppliers;
    return suppliers.filter(s => s.categoryId === categoryId);
  };

  return (
    <DataContext.Provider value={{
      categories,
      suppliers,
      addCategory,
      updateCategory,
      deleteCategory,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      getCategory,
      getSupplier,
      filterSuppliersByCategory
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData deve ser usado dentro de um DataProvider");
  }
  return context;
}
