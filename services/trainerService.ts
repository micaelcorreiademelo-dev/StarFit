
import { LandingPageData, defaultLandingPageData } from '../pages/PublicLandingPage';
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const STORAGE_KEY_PREFIX = 'starfit_trainer_';

export const trainerService = {
  getTrainerData: async (username: string): Promise<LandingPageData> => {
    // Try Firestore first for real data
    try {
      const u = username.toLowerCase();
      const formattedUsername = u.startsWith('@') ? u : `@${u}`;
      const docRef = doc(db, 'landingPages', formattedUsername);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as LandingPageData;
        return {
          ...defaultLandingPageData,
          ...data,
          username: data.username || username,
          theme: { ...defaultLandingPageData.theme, ...(data.theme || {}) },
          sections: { ...defaultLandingPageData.sections, ...(data.sections || {}) },
          hero: { ...defaultLandingPageData.hero, ...(data.hero || {}) },
          about: { ...defaultLandingPageData.about, ...(data.about || {}) },
          results: { ...defaultLandingPageData.results, ...(data.results || {}) },
          testimonials: { ...defaultLandingPageData.testimonials, ...(data.testimonials || {}) },
          contact: { ...defaultLandingPageData.contact, ...(data.contact || {}) },
          social: { ...defaultLandingPageData.social, ...(data.social || {}) },
        } as LandingPageData;
      }
    } catch (err) {
      console.error('Error fetching trainer landing page from Firestore', err);
    }

    // Fallback to localStorage for immediate feedback or legacy
    const savedData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${username.replace('@', '').toLowerCase()}`);
    let parsedData = null;
    if (savedData) {
      try {
        parsedData = JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing trainer data', e);
      }
    }
    // ... rest of the logic remains same until next edit

    if (parsedData) {
      // Handle schema migration for results
      let parsedResults = parsedData.results;
      if (Array.isArray(parsedResults)) {
        parsedResults = { ...defaultLandingPageData.results, items: parsedResults };
      }

      // Handle schema migration for testimonials
      let parsedTestimonials = parsedData.testimonials;
      if (Array.isArray(parsedTestimonials)) {
        parsedTestimonials = { ...defaultLandingPageData.testimonials, items: parsedTestimonials };
      }

      return {
        ...defaultLandingPageData,
        ...parsedData,
        username: parsedData.username || username,
        theme: { ...defaultLandingPageData.theme, ...(parsedData.theme || {}) },
        sections: { ...defaultLandingPageData.sections, ...(parsedData.sections || {}) },
        hero: { ...defaultLandingPageData.hero, ...(parsedData.hero || {}) },
        about: { ...defaultLandingPageData.about, ...(parsedData.about || {}) },
        results: { ...defaultLandingPageData.results, ...(parsedResults || {}) },
        testimonials: { ...defaultLandingPageData.testimonials, ...(parsedTestimonials || {}) },
        contact: { ...defaultLandingPageData.contact, ...(parsedData.contact || {}) },
        social: { ...defaultLandingPageData.social, ...(parsedData.social || {}) },
      } as LandingPageData;
    }

    return { ...defaultLandingPageData, username };
  },

  saveTrainerData: async (username: string, data: Partial<LandingPageData>) => {
    // Save to Firestore with lowercase ID for robustness
    const u = username.toLowerCase();
    const formattedUsername = u.startsWith('@') ? u : `@${u}`;
    const docRef = doc(db, 'landingPages', formattedUsername);
    
    // Get current data to merge
    const currentData = await trainerService.getTrainerData(username);
    const newData = { 
      ...currentData, 
      ...data, 
      updatedAt: serverTimestamp() 
    };
    
    try {
      await setDoc(docRef, newData);
    } catch (err) {
      console.error("Error saving landing page to Firestore", err);
      // Still save to localStorage as backup/local state
    }
    
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${username.replace('@', '').toLowerCase()}`, JSON.stringify(newData));
    // Dispatch a custom event so other components (like landing page in same app) can update
    window.dispatchEvent(new CustomEvent('trainer_data_updated', { detail: { username, data: newData } }));
  },

  getPlans: async (username: string) => {
    const data = await trainerService.getTrainerData(username);
    return data.plans;
  },

  savePlans: async (username: string, plans: any[]) => {
    await trainerService.saveTrainerData(username, { plans });
  }
};
