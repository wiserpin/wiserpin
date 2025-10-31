import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/chrome-extension';
import { App } from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
        syncHost="http://localhost:3000"
      >
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );
}
