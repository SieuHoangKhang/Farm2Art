import {
  firebaseDb,
  firebaseAuth,
} from "./client";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";

/**
 * Lưu tài liệu vào Firestore
 */
export async function saveDocument(
  collectionName: string,
  docId: string,
  data: any
) {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
    return { success: true, id: docId };
  } catch (error) {
    console.error(`Error saving document to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Lấy tài liệu từ Firestore
 */
export async function getDocument(collectionName: string, docId: string) {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Lấy tất cả tài liệu từ collection với điều kiện
 */
export async function queryCollection(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  try {
    const collectionRef = collection(firebaseDb, collectionName);
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Cập nhật tài liệu
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: any
) {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Xóa tài liệu
 */
export async function deleteDocument(collectionName: string, docId: string) {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Thêm tài liệu mới và tự động tạo ID
 */
export async function addDocument(collectionName: string, data: any) {
  try {
    const collectionRef = collection(firebaseDb, collectionName);
    const timestamp = new Date().toISOString();
    const dataWithTimestamp = {
      ...data,
      createdAt: data.createdAt || timestamp,
      updatedAt: timestamp,
    };

    // Tạo document với ID là timestamp + random
    const docId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const docRef = doc(collectionRef, docId);
    await setDoc(docRef, dataWithTimestamp);

    return { id: docId, ...dataWithTimestamp };
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Kiểm tra tài liệu có tồn tại không
 */
export async function documentExists(
  collectionName: string,
  docId: string
): Promise<boolean> {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists();
  } catch (error) {
    console.error(`Error checking document existence:`, error);
    return false;
  }
}

/**
 * Lấy tất cả tài liệu từ collection
 */
export async function getAllDocuments(collectionName: string) {
  return queryCollection(collectionName);
}

/**
 * Tìm tài liệu theo field
 */
export async function findDocuments(
  collectionName: string,
  fieldName: string,
  value: any
) {
  try {
    return await queryCollection(collectionName, [
      where(fieldName, "==", value),
    ]);
  } catch (error) {
    console.error(`Error finding documents:`, error);
    throw error;
  }
}

/**
 * Lấy tài liệu sắp xếp theo field
 */
export async function getDocumentsOrderedBy(
  collectionName: string,
  fieldName: string,
  direction: "asc" | "desc" = "desc",
  limitCount: number = 50
) {
  try {
    return await queryCollection(collectionName, [
      orderBy(fieldName, direction),
      limit(limitCount),
    ]);
  } catch (error) {
    console.error(`Error getting ordered documents:`, error);
    throw error;
  }
}
