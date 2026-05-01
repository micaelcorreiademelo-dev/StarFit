
import { LandingPageData, defaultLandingPageData } from '../pages/PublicLandingPage';

const STORAGE_KEY_PREFIX = 'starfit_trainer_';

export const trainerService = {
  getTrainerData: (username: string): LandingPageData => {
    const savedData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${username}`);
    let parsedData = null;
    if (savedData) {
      try {
        parsedData = JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing trainer data', e);
      }
    }

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

  saveTrainerData: (username: string, data: Partial<LandingPageData>) => {
    const currentData = trainerService.getTrainerData(username);
    const newData = { ...currentData, ...data };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${username}`, JSON.stringify(newData));
    // Dispatch a custom event so other components (like landing page in same app) can update
    window.dispatchEvent(new CustomEvent('trainer_data_updated', { detail: { username, data: newData } }));
  },

  getPlans: (username: string) => {
    return trainerService.getTrainerData(username).plans;
  },

  savePlans: (username: string, plans: any[]) => {
    trainerService.saveTrainerData(username, { plans });
  }
};
