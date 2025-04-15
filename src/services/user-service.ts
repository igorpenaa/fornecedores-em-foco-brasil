
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile
} from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, UserRole } from "@/types";

// Collection references
const USERS_COLLECTION = "users";

// Serviço de usuários
export const userService = {
  // Adicionar usuário
  addUser: async (userData: { name: string; email: string; password: string; role: UserRole }) => {
    try {
      // Cria o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Atualiza o perfil com o nome do usuário
      await updateProfile(userCredential.user, { displayName: userData.name });
      
      // Cria um documento para o usuário no Firestore
      const newUserData: Omit<User, "id"> = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        favorites: []
      };
      
      await setDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), newUserData);
      
      return {
        id: userCredential.user.uid,
        ...newUserData
      } as User;
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Este e-mail já está em uso");
      }
      throw new Error("Erro ao criar usuário");
    }
  },

  // Atualizar usuário
  updateUser: async (userId: string, userData: Partial<User>) => {
    await updateDoc(doc(db, USERS_COLLECTION, userId), userData);
    return { id: userId, ...userData };
  },

  // Obter todos os usuários
  getAllUsers: async () => {
    const usersCollection = collection(db, USERS_COLLECTION);
    const usersSnapshot = await getDocs(usersCollection);
    
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  },

  // Obter um usuário pelo ID
  getUserById: async (userId: string) => {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado");
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    } as User;
  },

  // Deletar um usuário
  deleteUser: async (userId: string) => {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    // Esta função não deleta o usuário do Firebase Auth, apenas do Firestore
  }
};

// Serviço de autenticação
export const authService = {
  // Login
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error("Usuário não encontrado");
      }
      
      return {
        id: userCredential.user.uid,
        email: userCredential.user.email || "",
        name: userCredential.user.displayName || "",
        ...userDoc.data()
      } as User;
    } catch (error: any) {
      throw new Error("Credenciais inválidas");
    }
  },

  // Registro
  register: async (name: string, email: string, password: string, role: UserRole = "user") => {
    try {
      // Cria o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Atualiza o perfil com o nome do usuário
      await updateProfile(userCredential.user, { displayName: name });
      
      // Cria um documento para o usuário no Firestore
      const userData: Omit<User, "id"> = {
        name,
        email,
        role,
        favorites: []
      };
      
      await setDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), userData);
      
      return {
        id: userCredential.user.uid,
        ...userData
      } as User;
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Este e-mail já está em uso");
      }
      throw new Error("Erro ao criar usuário");
    }
  },

  // Logout
  logout: async () => {
    await signOut(auth);
  },

  // Adicionar/remover favorito
  toggleFavorite: async (userId: string, supplierId: string) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado");
    }
    
    const userData = userDoc.data() as Omit<User, "id">;
    const favorites = userData.favorites || [];
    
    const newFavorites = favorites.includes(supplierId)
      ? favorites.filter(id => id !== supplierId)
      : [...favorites, supplierId];
    
    await updateDoc(userRef, { favorites: newFavorites });
    
    return newFavorites;
  },

  // Obter usuário pelo ID
  getUserById: async (userId: string) => {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    
    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado");
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    } as User;
  },

  // Adicionar método updateUser para o authService
  updateUser: async (userId: string, userData: Partial<User>) => {
    // Atualiza os dados do usuário no Firestore
    await updateDoc(doc(db, USERS_COLLECTION, userId), userData);
    
    // Se o nome for atualizado, também atualiza no Firebase Auth
    if (userData.name && auth.currentUser && auth.currentUser.uid === userId) {
      await updateProfile(auth.currentUser, { displayName: userData.name });
    }
    
    return { id: userId, ...userData };
  }
};
