
import React from 'react';
import ReactDOM from 'react-dom/client';

// 1. Storage Polyfills for third-party iframe blocking context (e.g. Chrome blocking third-party cookies in AI Studio preview)
let isLocalStorageAvailable = false;
try {
  const testKey = '__test_local_storage__';
  window.localStorage.setItem(testKey, 'test');
  window.localStorage.removeItem(testKey);
  isLocalStorageAvailable = true;
} catch (e) {
  isLocalStorageAvailable = false;
}

if (!isLocalStorageAvailable) {
  console.warn("localStorage is blocked inside iframe context. Using safe in-memory fallback.");
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const key in store) { delete store[key]; } },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; }
  };
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true
  });
}

let isSessionStorageAvailable = false;
try {
  const testKey = '__test_session_storage__';
  window.sessionStorage.setItem(testKey, 'test');
  window.sessionStorage.removeItem(testKey);
  isSessionStorageAvailable = true;
} catch (e) {
  isSessionStorageAvailable = false;
}

if (!isSessionStorageAvailable) {
  console.warn("sessionStorage is blocked inside iframe context. Using safe in-memory fallback.");
  const sStore: Record<string, string> = {};
  const mockSessionStorage = {
    getItem: (key: string) => (key in sStore ? sStore[key] : null),
    setItem: (key: string, value: string) => { sStore[key] = String(value); },
    removeItem: (key: string) => { delete sStore[key]; },
    clear: () => { for (const key in sStore) { delete sStore[key]; } },
    key: (index: number) => Object.keys(sStore)[index] || null,
    get length() { return Object.keys(sStore).length; }
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true
  });
}

// Now we can safely import other files that might use localStorage at the top level
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
