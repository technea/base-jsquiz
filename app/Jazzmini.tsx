"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { CheckCircle, XCircle, RefreshCw, Trophy, BookOpen, Lock, Unlock, Zap } from 'lucide-react';
import { QUIZ_DATA } from './quizData';

// Farcaster SDK import with fallback
let sdk: any = null;
try {
  const farcasterSdk = require('@farcaster/miniapp-sdk');
  sdk = farcasterSdk.sdk;
} catch (e) {
  console.warn('Farcaster SDK not available, using web3 provider fallback');
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const appId = 'js-level-quiz-default';
const PUBLIC_COLLECTION_PATH = `artifacts/${appId}/stats`;
const GLOBAL_STATS_DOC_ID = 'global_progress';
const QUESTIONS_PER_LEVEL = 10;
const TOTAL_LEVELS = 10;
const PASS_THRESHOLD = 7;

type QuizQuestion = {
  level: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type GlobalStats = {
  maxScore: number;
  highestLevel: number;
};

export default function JSQuizApp() {
  const [db, setDb] = useState<Firestore | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ maxScore: 0, highestLevel: 1 });
  const [authReady, setAuthReady] = useState(false);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState<'start' | 'in_progress' | 'result'>('start');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [levelPassed, setLevelPassed] = useState(false);
  const [txStatus, setTxStatus] = useState("");
  const [autoProgressing, setAutoProgressing] = useState(false);

  // --- Initialize Firebase & Auth ---
  useEffect(() => {
    try {
      if (!firebaseConfig.projectId) {
        console.warn('Firebase config not set. Using local-only mode.');
        setUserId(`local-${crypto.randomUUID()}`);
        setAuthReady(true);
        return;
      }
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      setDb(getFirestore(app));
      const auth = getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) setUserId(user.uid);
        else signInAnonymously(auth).catch(() => setUserId(`local-${crypto.randomUUID()}`));
        setAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setUserId(`local-${crypto.randomUUID()}`);
      setAuthReady(true);
    }
  }, []);

  // --- Global Stats Listener ---
  useEffect(() => {
    if (!authReady || !db) return;
    const statsRef = doc(db, PUBLIC_COLLECTION_PATH, GLOBAL_STATS_DOC_ID);
    const unsubscribe = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) setGlobalStats(docSnap.data() as GlobalStats);
      else {
        const initialData = { maxScore: 0, highestLevel: 1, updated: new Date().toISOString() };
        setGlobalStats(initialData);
        setDoc(statsRef, initialData, { merge: true }).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, [authReady, db]);

  const levelQuestions = useMemo(() => QUIZ_DATA.filter(q => q.level === currentLevel), [currentLevel]);
  const currentQuestion = levelQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === levelQuestions.length - 1;

  // Reset question index when level changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowExplanation(false);
  }, [currentLevel]);

  // --- Send Small Transaction via Farcaster ---
  const sendLevelTx = useCallback(async () => {
    try {
      setTxStatus(`Sending transaction for Level ${currentLevel}...`);
      
      // Try to use window.ethereum (MetaMask/wallet provider)
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_accounts',
        });
        
        if (!accounts || accounts.length === 0) {
          setTxStatus('No wallet connected');
          return;
        }

        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: accounts[0],
            to: '0x1234567890123456789012345678901234567890',
            value: '1000000000000000', // 0.001 ETH in wei
            data: '0x',
          }],
        });

        setTxStatus(`Success! Tx: ${txHash}`);
        console.log('Transaction sent:', txHash);
      } else {
        // Fallback: simulate transaction for demo
        setTxStatus(`Success! Level ${currentLevel} completed - transaction simulated`);
        console.log('Wallet not available, transaction simulated');
      }
    } catch (err: any) {
      setTxStatus("Transaction failed: " + err.message);
      console.error('Transaction error:', err);
    }
  }, [currentLevel]);

  const handleOptionSelect = useCallback((option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    if (option === currentQuestion.answer) setScore(prev => prev + 1);
    setShowExplanation(true);
  }, [currentQuestion, selectedOption]);

  const handleNextQuestion = useCallback(async () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (isLastQuestion) {
      const passed = score >= PASS_THRESHOLD;
      setLevelPassed(passed);
      // --- Send transaction if level passed ---
      if (passed) {
        setAutoProgressing(true);
        await sendLevelTx();
      }
      setQuizState('result');
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion, score, sendLevelTx, PASS_THRESHOLD]);

  const startQuiz = useCallback((level: number) => {
    setCurrentLevel(level);
    setTxStatus("");
    setLevelPassed(false);
    setQuizState('in_progress');
  }, []);

  // Auto-advance to next level after transaction completes
  useEffect(() => {
    if (autoProgressing && txStatus.includes('Success') && currentLevel < TOTAL_LEVELS) {
      const timer = setTimeout(() => {
        startQuiz(currentLevel + 1);
        setAutoProgressing(false);
      }, 2000); // 2 second delay to show success message
      return () => clearTimeout(timer);
    }
  }, [autoProgressing, txStatus, currentLevel, startQuiz]);

  if (!authReady) return <div className="text-white text-center pt-16 font-semibold">Authenticating...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 text-white bg-gray-800 min-h-screen space-y-6">
      <h1 className="text-4xl font-black text-center text-blue-400 mb-8 border-b border-gray-700 pb-4">JS Quiz Miniapp</h1>

      {quizState === 'start' && (
        <div className="text-center space-y-6">
          <BookOpen className="w-16 h-16 mx-auto text-blue-400" />
          <h2 className="text-4xl font-extrabold text-white">JavaScript 10-Level Challenge</h2>
          <p className="text-lg text-gray-300">Score {PASS_THRESHOLD}/{QUESTIONS_PER_LEVEL} to unlock the next level.</p>
          <div className="grid grid-cols-5 gap-3 pt-4">
            {[...Array(TOTAL_LEVELS)].map((_, i) => {
              const level = i + 1;
              const unlocked = level < globalStats.highestLevel;
              const isNext = level === globalStats.highestLevel;
              return (
                <button type="button" key={level} onClick={() => startQuiz(level)} disabled={!unlocked && !isNext} className={`p-3 rounded-lg ${unlocked ? 'bg-green-600 hover:bg-green-700' : isNext ? 'bg-blue-600 hover:bg-blue-700 font-bold' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                  L{level}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {quizState === 'in_progress' && currentQuestion && (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xl font-semibold border-b border-gray-700 pb-3">
            <span className="text-blue-400">Level {currentLevel} of {TOTAL_LEVELS}</span>
            <span className="text-white">Q {currentQuestionIndex + 1} of {QUESTIONS_PER_LEVEL}</span>
            <span className="text-green-400">Score: {score}</span>
          </div>

          <div className="p-5 bg-gray-700 rounded-lg border-l-4 border-blue-500 shadow-xl">
            <p className="text-2xl font-medium text-white">{currentQuestion.question}</p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = option === currentQuestion.answer;
              const isSelected = option === selectedOption;
              const isAnswered = selectedOption !== null;
              let optionStyle = 'bg-gray-700 hover:bg-gray-600';
              let icon = null;
              if (isAnswered) {
                if (isCorrect) { optionStyle = 'bg-green-800 border-2 border-green-500'; icon = <CheckCircle className="w-6 h-6 text-green-300" />; }
                else if (isSelected) { optionStyle = 'bg-red-800 border-2 border-red-500'; icon = <XCircle className="w-6 h-6 text-red-300" />; }
                else { optionStyle = 'bg-gray-800 text-gray-500 cursor-default'; }
              }
              return (
                <div key={index} onClick={() => handleOptionSelect(option)} className={`p-4 rounded-lg flex items-center justify-between transition duration-150 ${!isAnswered ? 'cursor-pointer' : 'cursor-default'} ${optionStyle}`}>
                  <span className={`text-lg ${isAnswered && !isCorrect && !isSelected ? 'text-gray-500' : 'text-white'}`}>{option}</span>
                  {icon}
                </div>
              );
            })}
          </div>

          {showExplanation && (
            <div className="p-4 mt-4 bg-gray-900 rounded-lg border-l-4 border-yellow-500 shadow-md">
              <p className="font-bold text-yellow-400 mb-2">Explanation:</p>
              <p className="text-gray-300">{currentQuestion.explanation}</p>
            </div>
          )}

          {selectedOption && (
            <div className="pt-4">
              <button type="button" onClick={handleNextQuestion} className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold">
                {isLastQuestion ? `Finish Level ${currentLevel}` : 'Next Question'}
              </button>
            </div>
          )}
        </div>
      )}

      {quizState === 'result' && (
        <div className="text-center space-y-8 p-6 bg-gray-700 rounded-xl shadow-2xl">
          {levelPassed ? (
            <>
              <CheckCircle className="w-20 h-20 mx-auto text-green-400" />
              <h2 className="text-4xl font-bold text-white">Level {currentLevel} Passed!</h2>
              <p className="text-lg text-gray-300">Score: {score}/{QUESTIONS_PER_LEVEL}</p>
              {txStatus && <p className="text-yellow-300">{txStatus}</p>}
              {currentLevel < TOTAL_LEVELS && <button type="button" onClick={() => startQuiz(currentLevel + 1)} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold">Next Level</button>}
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 mx-auto text-red-400" />
              <h2 className="text-4xl font-bold text-white">Level {currentLevel} Failed</h2>
              <p className="text-lg text-gray-300">You needed {PASS_THRESHOLD}/{QUESTIONS_PER_LEVEL} to pass.</p>
              <button type="button" onClick={() => startQuiz(currentLevel)} className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold">Retry Level</button>
            </>
          )}
          <button type="button" onClick={() => setQuizState('start')} className="px-6 py-3 bg-gray-500 hover:bg-gray-600 rounded-lg text-white font-semibold">Back to Level Select</button>
        </div>
      )}
    </div>
  );
}