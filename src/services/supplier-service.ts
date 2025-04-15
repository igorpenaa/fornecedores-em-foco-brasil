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
import { Supplier } from "@/types";

// Collection reference
const SUPPLIERS_COLLECTION = "suppliers";

export const supplierService = {
  // Obter todos os fornecedores
  getAllSuppliers: async () => {
    const suppliersCollection = collection(db, SUPPLIERS_COLLECTION);
    const suppliersSnapshot = await getDocs(suppliersCollection);
    
    return suppliersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Supplier[];
  },

  // Obter fornecedores por categoria
  getSuppliersByCategory: async (categoryId: string) => {
    const suppliersQuery = query(
      collection(db, SUPPLIERS_COLLECTION),
      where("categoryIds", "array-contains", categoryId)
    );
    
    const suppliersSnapshot = await getDocs(suppliersQuery);
    
    return suppliersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Supplier[];
  },

  // Obter um fornecedor pelo ID
  getSupplierById: async (supplierId: string) => {
    const supplierDoc = await getDoc(doc(db, SUPPLIERS_COLLECTION, supplierId));
    
    if (!supplierDoc.exists()) {
      throw new Error("Fornecedor não encontrado");
    }
    
    const data = supplierDoc.data();
    
    return {
      id: supplierDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Supplier;
  },

  // Adicionar um fornecedor
  addSupplier: async (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => {
    const supplierData = {
      ...supplier,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), supplierData);
    
    return {
      id: docRef.id,
      ...supplier,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Supplier;
  },

  // Atualizar um fornecedor
  updateSupplier: async (supplierId: string, supplier: Partial<Supplier>) => {
    const supplierRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
    
    await updateDoc(supplierRef, {
      ...supplier,
      updatedAt: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(supplierRef);
    const data = updatedDoc.data();
    
    return {
      id: supplierId,
      ...data,
      ...supplier,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: new Date()
    } as Supplier;
  },

  // Deletar um fornecedor
  deleteSupplier: async (supplierId: string) => {
    await deleteDoc(doc(db, SUPPLIERS_COLLECTION, supplierId));
  },

  // Upload de imagem para fornecedor
  uploadSupplierImage: async (supplierId: string, file: File) => {
    const storageRef = ref(storage, `suppliers/${supplierId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Atualizar o fornecedor com a URL da imagem
    await updateDoc(doc(db, SUPPLIERS_COLLECTION, supplierId), {
      image: downloadURL,
      updatedAt: serverTimestamp()
    });
    
    return downloadURL;
  }
};
