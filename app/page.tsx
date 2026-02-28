"use client";
import { useEffect } from 'react';
import JSQuizApp from './Jazzmini';

export default function App() {
  useEffect(() => {
    try {
      const { sdk } = require('@farcaster/miniapp-sdk');
      if (sdk && typeof sdk.actions?.ready === 'function') {
        sdk.actions.ready();
        console.log('Farcaster SDK signaled ready');
      }
    } catch (e) {
      console.log('Running outside Farcaster environment');
    }
  }, []);

  return (
    <div>
      <JSQuizApp />
    </div>
  );
}