
import { Highlight } from "@/types";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

class HighlightService {
  private collection = 'highlights';

  async getAllHighlights(): Promise<Highlight[]> {
    try {
      const q = query(collection(db, this.collection), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          link: data.link || undefined,
          createdAt: data.createdAt.toDate(),
          transitionDelay: data.transitionDelay || 5 // Default 5 seconds
        };
      });
    } catch (error) {
      console.error("Error fetching highlights:", error);
      throw new Error("Failed to fetch highlights");
    }
  }

  async addHighlight(highlight: Omit<Highlight, "id" | "createdAt">): Promise<Highlight> {
    try {
      console.log("Adding highlight:", highlight);
      const docRef = await addDoc(collection(db, this.collection), {
        ...highlight,
        createdAt: Timestamp.now()
      });

      return {
        ...highlight,
        id: docRef.id,
        createdAt: new Date()
      };
    } catch (error) {
      console.error("Error adding highlight:", error);
      throw new Error("Failed to add highlight");
    }
  }

  async updateHighlight(id: string, highlight: Partial<Highlight>): Promise<Highlight> {
    try {
      console.log("Updating highlight:", id, highlight);
      const docRef = doc(db, this.collection, id);
      const updateData = { ...highlight };
      
      await updateDoc(docRef, updateData);
      
      return {
        ...highlight,
        id,
      } as Highlight;
    } catch (error) {
      console.error("Error updating highlight:", error);
      throw new Error("Failed to update highlight");
    }
  }

  async deleteHighlight(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collection, id));
    } catch (error) {
      console.error("Error deleting highlight:", error);
      throw new Error("Failed to delete highlight");
    }
  }

  // Este método é mantido para compatibilidade, mas não será mais usado
  async uploadHighlightMedia(file: File): Promise<{publicId: string, url: string, mediaType: 'image' | 'video'}> {
    try {
      // Create a unique filename
      const timestamp = new Date().getTime();
      const uniqueFilename = `highlight_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      
      // Determine media type
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, `highlights/${uniqueFilename}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      // Return the public ID (which is the filename) and the URL
      return {
        publicId: uniqueFilename,
        url,
        mediaType: mediaType as 'image' | 'video'
      };
    } catch (error) {
      console.error("Error uploading media:", error);
      throw new Error("Failed to upload media");
    }
  }

  async deleteHighlightMedia(filename: string): Promise<void> {
    try {
      const storageRef = ref(storage, `highlights/${filename}`);
      await deleteObject(storageRef);
    } catch (error) {
      console.error("Error deleting media:", error);
      throw new Error("Failed to delete media");
    }
  }
}

export const highlightService = new HighlightService();
