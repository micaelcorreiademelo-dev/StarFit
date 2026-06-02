import { db, OperationType, handleFirestoreError } from './firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs, getDoc, setDoc, runTransaction } from 'firebase/firestore';

export const dataService = {
  // Students
  subscribeToStudents: (trainerId: string, callback: (students: any[]) => void) => {
    const q = query(collection(db, 'users'), where('trainerId', '==', trainerId), where('role', '==', 'STUDENT'));
    return onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(students);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
  },

  // Progress
  subscribeToStudentProgress: (studentId: string, callback: (progress: any[]) => void) => {
    const q = query(collection(db, 'progress'), where('studentId', '==', studentId));
    return onSnapshot(q, (snapshot) => {
      const progress = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort by date inside the callback later or here. Better to sort here.
      // Assuming 'date' is a timestamp.
      progress.sort((a: any, b: any) => {
        const timeA = a.date?.toMillis ? a.date.toMillis() : a.date;
        const timeB = b.date?.toMillis ? b.date.toMillis() : b.date;
        return timeA - timeB; // ascending
      });
      callback(progress);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'progress'));
  },

  addProgress: async (progressData: any) => {
    try {
      const payload = {
        ...progressData,
        date: progressData.date || serverTimestamp(),
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'progress'), payload);
      
      // Update student's fast-access weight
      if (progressData.weight && progressData.studentId) {
         await updateDoc(doc(db, 'users', progressData.studentId), {
           weight: progressData.weight,
           updatedAt: serverTimestamp()
         });
      }
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'progress');
    }
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

  updateWorkout: async (workoutId: string, workoutData: any) => {
    try {
      const docRef = doc(db, 'workouts', workoutId);
      await updateDoc(docRef, workoutData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workouts/${workoutId}`);
    }
  },

  deleteWorkout: async (workoutId: string) => {
    try {
      const docRef = doc(db, 'workouts', workoutId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `workouts/${workoutId}`);
    }
  },

  // Exercises (Library)
  subscribeToExercises: (trainerId: string, callback: (exercises: any[]) => void) => {
    const q = query(collection(db, 'exercises'), where('trainerId', '==', trainerId));
    return onSnapshot(q, (snapshot) => {
      const exercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(exercises);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'exercises'));
  },

  createExercise: async (exerciseData: any) => {
    try {
      const docRef = await addDoc(collection(db, 'exercises'), {
        ...exerciseData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'exercises');
    }
  },

  updateExercise: async (exerciseId: string, exerciseData: any) => {
    try {
      const docRef = doc(db, 'exercises', exerciseId);
      await updateDoc(docRef, exerciseData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `exercises/${exerciseId}`);
    }
  },

  deleteExercise: async (exerciseId: string) => {
    try {
      const docRef = doc(db, 'exercises', exerciseId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `exercises/${exerciseId}`);
    }
  },
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

  createAgendaEvent: async (eventData: any) => {
    try {
      const docRef = await addDoc(collection(db, 'agendaEvents'), {
        ...eventData,
        date: eventData.date,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'agendaEvents');
    }
  },

  updateAgendaEvent: async (eventId: string, eventData: any) => {
    try {
      const docRef = doc(db, 'agendaEvents', eventId);
      await updateDoc(docRef, { ...eventData, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `agendaEvents/${eventId}`);
    }
  },

  deleteAgendaEvent: async (eventId: string) => {
    try {
      const docRef = doc(db, 'agendaEvents', eventId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `agendaEvents/${eventId}`);
    }
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

  searchTrainerByUsername: async (username: string) => {
    try {
      const u = username.trim().replace('@', '');
      const variations = [
        `@${u.toLowerCase()}`, 
        `@${u}`, 
        u.toLowerCase(), 
        u
      ];
      const q = query(
        collection(db, 'users'), 
        where('role', '==', 'TRAINER'), 
        where('username', 'in', variations)
      );
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

  requestLink: async (studentId: string, trainerId: string, studentName: string, studentAvatar?: string) => {
    try {
      // Avoid duplicate requests
      const q = query(collection(db, 'linkRequests'), 
        where('studentId', '==', studentId), 
        where('trainerId', '==', trainerId),
        where('status', '==', 'pending')
      );
      const res = await getDocs(q);
      if (!res.empty) return;

      await addDoc(collection(db, 'linkRequests'), {
        studentId,
        trainerId,
        studentName,
        studentAvatar: studentAvatar || '',
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'linkRequests');
    }
  },

  approveLinkRequest: async (requestId: string, trainerId: string, studentId: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const studentRef = doc(db, 'users', studentId);
        const requestRef = doc(db, 'linkRequests', requestId);
        
        // Set trial to 24 hours from now
        const trialUntil = new Date();
        trialUntil.setHours(trialUntil.getHours() + 24);

        transaction.update(requestRef, { status: 'approved' });
        transaction.update(studentRef, { 
          trainerId: trainerId,
          trialUntil: trialUntil,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `linkRequests/${requestId}`);
    }
  },

  extendTrial: async (studentId: string, hours: number = 24) => {
    try {
      const studentRef = doc(db, 'users', studentId);
      const studentDoc = await getDoc(studentRef);
      
      if (!studentDoc.exists()) throw new Error("Student not found");
      
      const currentTrialTime = studentDoc.data().trialUntil?.toDate()?.getTime() || Date.now();
      const baseTime = Math.max(Date.now(), currentTrialTime);
      const newTrial = new Date(baseTime + hours * 60 * 60 * 1000);
      
      await updateDoc(studentRef, {
        trialUntil: newTrial,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${studentId}`);
    }
  },

  rejectLinkRequest: async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'linkRequests', requestId), { status: 'rejected' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `linkRequests/${requestId}`);
    }
  },

  cancelLinkRequest: async (studentId: string) => {
    try {
      const q = query(collection(db, 'linkRequests'), 
        where('studentId', '==', studentId), 
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const batchUpdates = snapshot.docs.map(d => updateDoc(doc(db, 'linkRequests', d.id), { status: 'cancelled' }));
      await Promise.all(batchUpdates);
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
  },

  deleteUser: async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  },

  completeWorkout: async (userId: string, workoutId: string) => {
    try {
      const workoutRef = doc(db, 'workouts', workoutId);
      await updateDoc(workoutRef, {
        completed: true,
        completedAt: serverTimestamp(),
        completedBy: userId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workouts/${workoutId}`);
    }
  },

  getTrainerPlans: async (trainerId: string) => {
    try {
      const trainerSnap = await getDoc(doc(db, 'users', trainerId));
      if (!trainerSnap.exists()) return [];
      
      const trainerData = trainerSnap.data();
      const username = (trainerData.username || trainerId).replace('@', '').toLowerCase();
      
      const landingRef = doc(db, 'landingPages', `@${username}`);
      const landingSnap = await getDoc(landingRef);
      
      if (landingSnap.exists()) {
        return landingSnap.data().plans || [];
      }
      return [];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'trainerPlans');
      return [];
    }
  },

  assignWorkoutToStudent: async (workoutId: string, studentId: string) => {
    try {
      const workoutRef = doc(db, 'workouts', workoutId);
      const workoutSnap = await getDoc(workoutRef);
      if (workoutSnap.exists()) {
        const data = workoutSnap.data();
        // Clone the workout specifically for this student so they have a separate copy
        const { id, createdAt, studentIds, studentStatuses, ...cleanData } = data;
        await addDoc(collection(db, 'workouts'), {
          ...cleanData,
          studentIds: [studentId],
          studentStatuses: { [studentId]: "Ativo" },
          isModelLinked: true, // Marker showing it was cloned from a template
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'workouts');
    }
  }
};
