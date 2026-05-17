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
  // Update user presence
  updatePresence: async (userId: string, isOnline: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isOnline,
        lastActive: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to update presence', error);
    }
  },

  // Toggle Favorite
  toggleFavorite: async (chatId: string, isFavorite: boolean) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, { isFavorite });
    } catch (error) {
       console.error('Failed to update favorite', error);
    }
  },
  
  // Set typing status
  setTypingStatus: async (chatId: string, userId: string, isTyping: boolean) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`typingState.${userId}`]: isTyping
      });
    } catch (error) {
      console.warn('Failed to update typing state', error);
    }
  },

  // Mark all messages as read
  markAsRead: async (chatId: string, userId: string) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: 0
      });

      // Also mark messages as read
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, where('receiverId', '==', userId), where('readAt', '==', null));
      const snaps = await getDocs(q);
      
      const batch = snaps.docs.map(docSnap => updateDoc(docSnap.ref, { readAt: serverTimestamp() }));
      await Promise.all(batch);
    } catch (error) {
      console.warn('Failed to mark as read', error);
    }
  },

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

  // Subscribe to a single chat to get typing, unread count info
  subscribeToChatInfo: (chatId: string, callback: (chatInfo: Chat | null) => void) => {
    return onSnapshot(doc(db, 'chats', chatId), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Chat);
      } else {
        callback(null);
      }
    });
  },

  // Send a message
  sendMessage: async (chatId: string, senderId: string, receiverId: string, text: string, context?: any) => {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const payload: any = {
        senderId,
        receiverId,
        text,
        timestamp: serverTimestamp(),
        readAt: null
      };
      
      if (context) {
        payload.context = context;
      }
      
      await addDoc(messagesRef, payload);

      // Fetch current chat to increment unread counter
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      const currentUnreads = chatSnap.exists() ? (chatSnap.data().unreadCount || {}) : {};
      const newUnreadCount = (currentUnreads[receiverId] || 0) + 1;

      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: senderId,
        [`unreadCount.${receiverId}`]: newUnreadCount,
        [`typingState.${senderId}`]: false
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
