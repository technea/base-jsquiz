"use client";
import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect } from 'react';
import JSQuizApp from './Jazzmini';

export default function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div>
      <JSQuizApp /> {/* Combined now, no separate SmallTx */}
    </div>
  );
}