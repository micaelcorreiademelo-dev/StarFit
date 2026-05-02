import { db, OperationType, handleFirestoreError } from './firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs, getDoc, setDoc } from 'firebase/firestore';

export const dataService = {
  // Students
  subscribeToStudents: (trainerId: string, callback: (students: any[]) => void) => {
    const q = query(collection(db, 'users'), where('trainerId', '==', trainerId), where('role', '==', 'STUDENT'));
    return onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(students);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
  },

  // Workouts
  subscribeToWorkouts: (trainerId: string, callback: (workouts: any[]) => void) => {
    const q = query(collection(db, 'workouts'), where('trainerId', '==', trainerId));
    return onSnapshot(q, (snapshot) => {
      const workouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(workouts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'workouts'));
  },

  createWorkout: async (workoutData: any) => {
    try {
      const docRef = await addDoc(collection(db, 'workouts'), {
        ...workoutData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'workouts');
    }
  },

  // Agenda
  subscribeToAgenda: (trainerId: string, callback: (events: any[]) => void) => {
    const q = query(collection(db, 'agendaEvents'), where('trainerId', '==', trainerId));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date()
        };
      });
      callback(events);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'agendaEvents'));
  },

  // Link Requests
  subscribeToLinkRequests: (trainerId: string, callback: (requests: any[]) => void) => {
    const q = query(collection(db, 'linkRequests'), where('trainerId', '==', trainerId), where('status', '==', 'pending'));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'linkRequests'));
  },

  createLinkRequest: async (requestData: any) => {
    try {
      await addDoc(collection(db, 'linkRequests'), {
        ...requestData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'linkRequests');
    }
  },

  // Platform Plans
  subscribeToPlatformPlans: (callback: (plans: any[]) => void) => {
    return onSnapshot(collection(db, 'platformPlans'), (snapshot) => {
      const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(plans);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'platformPlans'));
  },

  // Student specific
  subscribeToStudentWorkouts: (studentId: string, callback: (workouts: any[]) => void) => {
    const q = query(collection(db, 'workouts'), where('studentIds', 'array-contains', studentId));
    return onSnapshot(q, (snapshot) => {
      const workouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(workouts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'workouts'));
  },

  subscribeToUserById: (userId: string, callback: (user: any) => void) => {
    return onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}`));
  },

  getUserById: async (userId: string) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    }
  },

  subscribeToStudentLinkRequests: (studentId: string, callback: (requests: any[]) => void) => {
    const q = query(collection(db, 'linkRequests'), where('studentId', '==', studentId), where('status', '==', 'pending'));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(requests);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'linkRequests'));
  },

  searchTrainerByCode: async (code: string) => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'TRAINER'), where('trainerCode', '==', code));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  },

  requestLink: async (studentId: string, trainerId: string) => {
    try {
      await addDoc(collection(db, 'linkRequests'), {
        studentId,
        trainerId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'linkRequests');
    }
  },

  approveLinkRequest: async (requestId: string, trainerId: string, studentId: string) => {
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'linkRequests', requestId), { status: 'approved' });
      // 2. Link student to trainer
      await updateDoc(doc(db, 'users', studentId), { trainerId });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'linkRequests/users');
    }
  },

  rejectLinkRequest: async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'linkRequests', requestId), { status: 'rejected' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'linkRequests');
    }
  },

  updateUser: async (userId: string, data: any) => {
    try {
      await updateDoc(doc(db, 'users', userId), { ...data, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }
};
