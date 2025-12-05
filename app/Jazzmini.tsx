"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { CheckCircle, XCircle, RefreshCw, Trophy, BookOpen, Lock, Unlock, Zap, AlertCircle } from 'lucide-react';
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

// ✅ Your contract address and ABI
const QUIZ_CONTRACT_ADDRESS = '0x2315d55F06E19D21Ebda68Aa1E54F9aF6924dcE5';
const QUIZ_CONTRACT_ABI = [{"inputs":[{"internalType":"uint256","name":"level","type":"uint256"}],"name":"completeLevel","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];

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
  const [showMetaMaskHelp, setShowMetaMaskHelp] = useState(false);
  
  // ✅ ADDED: Track if we've already tried to add contract to MetaMask
  const contractAddedRef = useRef(false);

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

  // ✅ FIXED: Helper function to add contract to MetaMask (ONCE per session)
  const addContractToMetaMask = useCallback(async () => {
    if (contractAddedRef.current) return; // Already tried this session
    
    try {
      await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: QUIZ_CONTRACT_ADDRESS,
            symbol: 'JSQUIZ',
            decimals: 0,
            image: 'https://base-jsquiz.vercel.app/icon-pro.png',
          },
        },
      });
      console.log('Contract added to MetaMask');
      contractAddedRef.current = true;
    } catch (error) {
      console.log('Failed to add contract to MetaMask (normal for custom contracts):', error);
      contractAddedRef.current = true; // Mark as tried even if failed
    }
  }, []);

  // ✅ OPTIMIZED: Send Transaction with better user experience
  const userCompleteLevel= useCallback(async () => {
    try {
      setTxStatus(`📤 Sending transaction for Level ${currentLevel}...`);
      setShowMetaMaskHelp(true);
      
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          // Request wallet connection
          const accounts = await (window as any).ethereum.request({
            method: 'eth_requestAccounts',
          });
          
          if (!accounts || accounts.length === 0) {
            setTxStatus('❌ No wallet account available');
            setAutoProgressing(false);
            return;
          }

          setTxStatus(`✅ Wallet connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);

          // ✅ OPTIMIZED: Only try to add contract once per session
          if (!contractAddedRef.current) {
            await addContractToMetaMask();
          }

          // Encode function call
          const encodeLevelCompletion = (level: number): string => {
            // Function signature for completeLevel(uint256) = 0x3ccfd60b
            return '0x3ccfd60b' + level.toString(16).padStart(64, '0');
          };

          // Send transaction
          const txHash = await (window as any).ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: accounts[0],
              to: QUIZ_CONTRACT_ADDRESS,
              value: '0',
              data: encodeLevelCompletion(currentLevel),
              gas: '150000', // Optimal gas for Base Mainnet
              chainId: '0x2105', // Base Mainnet
            }],
          });

          setTxStatus(`🚀 Transaction sent! Hash: ${txHash.slice(0, 10)}...`);
          console.log('Transaction sent to contract:', txHash);
          
          // Show BaseScan link
          setTimeout(() => {
            setTxStatus(prev => `${prev}\n🔍 View on BaseScan: https://basescan.org/tx/${txHash}`);
          }, 1000);
          
          return txHash;

        } catch (walletErr: any) {
          console.log('Wallet error:', walletErr);
          if (walletErr.code === 4001) {
            setTxStatus('❌ Transaction rejected by user');
          } else if (walletErr.message?.includes('insufficient funds')) {
            setTxStatus('❌ Insufficient ETH for gas fees');
          } else if (walletErr.message?.includes('user rejected')) {
            setTxStatus('❌ User rejected the transaction');
          } else {
            setTxStatus(`⚠️ ${walletErr.message?.slice(0, 60) || 'Transaction failed'}`);
          }
          setAutoProgressing(false);
          return null;
        }
      } else {
        setTxStatus('❌ No Web3 wallet detected. Install MetaMask or connect wallet.');
        setAutoProgressing(false);
        console.log('No wallet provider available');
        return null;
      }
    } catch (err: any) {
      setTxStatus("❌ Error: " + (err.message?.slice(0, 60) || 'Transaction failed'));
      setAutoProgressing(false);
      console.error('Transaction error:', err);
      return null;
    }
  }, [currentLevel, addContractToMetaMask]);

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
      setQuizState('result');
      
      if (passed) {
        setAutoProgressing(true);
        await userCompleteLevel();
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [isLastQuestion, score,PASS_THRESHOLD]);

  const startQuiz = useCallback((level: number) => {
    setCurrentLevel(level);
    setTxStatus("");
    setLevelPassed(false);
    setQuizState('in_progress');
    setShowMetaMaskHelp(false);
  }, []);

  // Auto-advance to next level after transaction completes
  useEffect(() => {
    if (!autoProgressing) return;
    
    const hasTxStatus = txStatus && txStatus.length > 0;
    const txSuccessful = hasTxStatus && (txStatus.includes('🚀') || txStatus.includes('Transaction sent') || txStatus.includes('BaseScan'));
    
    if (txSuccessful && currentLevel < TOTAL_LEVELS) {
      const timer = setTimeout(() => {
        startQuiz(currentLevel + 1);
        setAutoProgressing(false);
        setShowMetaMaskHelp(false);
      }, 5000); // Give user time to see the success message
      return () => clearTimeout(timer);
    } else if (hasTxStatus && txStatus.includes('❌')) {
      setAutoProgressing(false);
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
              
              {/* MetaMask Help Notice */}
              {showMetaMaskHelp && (
                <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-500">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <p className="font-bold text-yellow-400">ℹ️ MetaMask Notice:</p>
                  </div>
                  <p className="text-sm text-yellow-200 text-left">
                    • MetaMask may show "Null: 0x0..." - this is normal for custom contracts<br/>
                    • Your transaction IS going to: <code className="text-xs">{QUIZ_CONTRACT_ADDRESS.slice(0, 10)}...</code><br/>
                    • Click "Confirm" to proceed - the transaction is safe<br/>
                    • You can verify on <a href={`https://basescan.org/address/${QUIZ_CONTRACT_ADDRESS}`} target="_blank" className="underline font-medium">BaseScan</a>
                  </p>
                </div>
              )}
              
              {/* Transaction Status */}
              {txStatus && (
                <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-500">
                  <p className="text-yellow-300 font-semibold whitespace-pre-line">{txStatus}</p>
                </div>
              )}
              
              {/* Send Transaction Button */}
              {!txStatus || txStatus.includes('❌') || txStatus.includes('No wallet') || txStatus.includes('rejected') ? (
                <button 
                  type="button" 
                  onClick={() => userCompleteLevel()}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Send Transaction
                </button>
              ) : null}
              
              {/* Next Level Button */}
              {currentLevel < TOTAL_LEVELS && txStatus && (txStatus.includes('🚀') || txStatus.includes('BaseScan')) && (
                <button 
                  type="button" 
                  onClick={() => startQuiz(currentLevel + 1)} 
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold"
                >
                  Next Level
                </button>
              )}
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 mx-auto text-red-400" />
              <h2 className="text-4xl font-bold text-white">Level {currentLevel} Failed</h2>
              <p className="text-lg text-gray-300">You needed {PASS_THRESHOLD}/{QUESTIONS_PER_LEVEL} to pass.</p>
              <button type="button" onClick={() => startQuiz(currentLevel)} className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold">Retry Level</button>
            </>
          )}
          <button type="button" onClick={() => setQuizState('start')} className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 rounded-lg text-white font-semibold">Back to Level Select</button>
        </div>
      )}
    </div>
  );
}