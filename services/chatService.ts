import { db, OperationType, handleFirestoreError } from './firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  setDoc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { ChatMessage, Chat } from '../types';

export const chatService = {
  // Get or create a chat between a trainer and student
  getOrCreateChat: async (trainerId: string, studentId: string): Promise<string> => {
    const chatId = `${trainerId}_${studentId}`;
    const chatRef = doc(db, 'chats', chatId);
    
    try {
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          id: chatId,
          trainerId,
          studentId,
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastMessageTime: serverTimestamp()
        });
      }
      return chatId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}`);
      return chatId;
    }
  },

  // Subscribe to messages in a chat
  subscribeToMessages: (chatId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      callback(messages);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`));
  },

  // Send a message
  sendMessage: async (chatId: string, senderId: string, receiverId: string, text: string) => {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId,
        receiverId,
        text,
        timestamp: serverTimestamp()
      });

      // Update last message in chat document
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages`);
    }
  },

  // Subscribe to a trainer's active chats (list of students)
  subscribeToTrainerChats: (trainerId: string, callback: (chats: Chat[]) => void) => {
    const q = query(
      collection(db, 'chats'),
      where('trainerId', '==', trainerId),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      callback(chats);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'chats'));
  }
};
