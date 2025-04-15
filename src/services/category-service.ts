
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  where 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Category } from "@/types";

// Collection reference
const CATEGORIES_COLLECTION = "categories";

export const categoryService = {
  // Obter todas as categorias
  getAllCategories: async () => {
    const categoriesCollection = collection(db, CATEGORIES_COLLECTION);
    const categoriesSnapshot = await getDocs(categoriesCollection);
    
    return categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Category[];
  },

  // Obter uma categoria pelo ID
  getCategoryById: async (categoryId: string) => {
    const categoryDoc = await getDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
    
    if (!categoryDoc.exists()) {
      throw new Error("Categoria não encontrada");
    }
    
    const data = categoryDoc.data();
    
    return {
      id: categoryDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Category;
  },

  // Adicionar uma categoria
  addCategory: async (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
    const categoryData = {
      ...category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), categoryData);
    
    return {
      id: docRef.id,
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Category;
  },

  // Atualizar uma categoria
  updateCategory: async (categoryId: string, category: Partial<Category>) => {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    
    await updateDoc(categoryRef, {
      ...category,
      updatedAt: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(categoryRef);
    const data = updatedDoc.data();
    
    return {
      id: categoryId,
      ...data,
      ...category,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: new Date()
    } as Category;
  },

  // Deletar uma categoria
  deleteCategory: async (categoryId: string) => {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
  },

  // Upload de imagem para categoria
  uploadCategoryImage: async (categoryId: string, file: File) => {
    const storageRef = ref(storage, `categories/${categoryId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Atualizar a categoria com a URL da imagem
    await updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), {
      image: downloadURL,
      updatedAt: serverTimestamp()
    });
    
    return downloadURL;
  }
};
