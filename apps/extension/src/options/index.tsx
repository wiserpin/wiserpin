import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function Options() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">WiserPin Settings</h1>
        <p className="text-gray-600">Options page coming soon...</p>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Options />
    </React.StrictMode>
  );
}
