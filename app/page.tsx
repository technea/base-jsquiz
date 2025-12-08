"use client";
import { useEffect } from 'react';
import JSQuizApp from './Jazzmini';

// Safe Farcaster SDK initialization with fallback
let farcasterReady = false;
try {
  const { sdk } = require('@farcaster/miniapp-sdk');
  if (sdk && typeof sdk.actions?.ready === 'function') {
    sdk.actions.ready();
    farcasterReady = true;
  }
} catch (e) {
  // Farcaster SDK not available or in non-Farcaster environment
  console.log('Running outside Farcaster environment');
}

export default function App() {
  useEffect(() => {
    // Additional safety check on mount
    if (!farcasterReady) {
      console.log('App initialized in non-Farcaster mode');
    }
  }, []);

  return (
    <div>
      <JSQuizApp />
    </div>
  );
}