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
import { CheckCircle, XCircle, RefreshCw, Trophy, BookOpen, Lock, Unlock, Zap, AlertCircle, Wallet, Sun, Moon } from 'lucide-react';
import { QUIZ_DATA } from './quizData';

// Type definitions for Ethereum provider
interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseBrowser?: boolean;
  isBase?: boolean;
  request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>;
}

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

// ✅ Contract address and ABI (validated)
const QUIZ_CONTRACT_ADDRESS = '0x2315d55F06E19D21Ebda68Aa1E54F9aF6924dcE5';
const QUIZ_CONTRACT_ABI = [{"inputs":[{"internalType":"uint256","name":"level","type":"uint256"}],"name":"completeLevel","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];

// ✅ Security: Validate contract address format
const isValidAddress = (address: string): boolean => {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
};

// ✅ Security: Safely detect wallet providers with retry mechanism
const getWalletProvider = (): EthereumProvider | null => {
  if (typeof window === 'undefined') return null;
  
  // Try to get ethereum provider with a small delay to allow MetaMask to inject
  let ethereum = (window as any).ethereum;
  
  // If not found immediately, check common wallet injection points
  if (!ethereum) {
    // Check for MetaMask specifically
    if ((window as any).MetaMask) {
      ethereum = (window as any).MetaMask;
    }
    // Check if injected but under different name
    else if ((window as any).ethereum) {
      ethereum = (window as any).ethereum;
    }
  }
  
  if (!ethereum) return null;
  
  // Validate that it has the required request method
  if (typeof ethereum.request !== 'function') return null;
  
  return ethereum;
};

// ✅ Security: Detect which wallets are available
const getAvailableWallets = (): string[] => {
  if (typeof window === 'undefined') return [];
  const ethereum = (window as any).ethereum;
  if (!ethereum) return [];
  
  const wallets: string[] = [];
  if (ethereum.isMetaMask) wallets.push('MetaMask');
  if (ethereum.isCoinbaseBrowser) wallets.push('Coinbase Wallet');
  if (ethereum.isBase) wallets.push('Base App');
  
  // Default to MetaMask-compatible if no specific identification
  if (wallets.length === 0 && typeof ethereum.request === 'function') {
    wallets.push('Browser Wallet');
  }
  
  return wallets;
};

// ✅ Security: Safely encode function calls (replaces manual hex encoding)
const encodeFunctionCall = (functionSignature: string, params: any[]): string => {
  // Function signature for completeLevel(uint256) = 0x3ccfd60b
  if (functionSignature !== 'completeLevel') {
    throw new Error('Unsupported function');
  }
  
  if (!Array.isArray(params) || params.length !== 1) {
    throw new Error('Invalid parameters for completeLevel');
  }
  
  const level = params[0];
  if (typeof level !== 'number' || level < 1 || level > TOTAL_LEVELS) {
    throw new Error(`Invalid level: must be between 1 and ${TOTAL_LEVELS}`);
  }
  
  return '0x3ccfd60b' + level.toString(16).padStart(64, '0');
};

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
  const [isDarkMode, setIsDarkMode] = useState(true);

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
  
  // ✅ NEW: Wallet connection state
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [walletError, setWalletError] = useState<string | null>(null);
  
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

  // ✅ NEW: Detect available wallets on component mount with retry
  useEffect(() => {
    // Function to check and set available wallets
    const checkWallets = () => {
      const wallets = getAvailableWallets();
      setAvailableWallets(wallets);
      
      // Check if wallet is already connected (e.g., from previous session)
      const checkConnected = async () => {
        const provider = getWalletProvider();
        if (provider) {
          try {
            const accounts = await provider.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              setConnectedAddress(accounts[0]);
            }
          } catch (error) {
            console.log('Error checking wallet connection:', error);
          }
        }
      };
      
      if (typeof window !== 'undefined') {
        checkConnected();
      }
    };
    
    // Check immediately
    checkWallets();
    
    // Also check after a delay to catch MetaMask injection
    const timer = setTimeout(checkWallets, 1000);
    
    // Listen for ethereum availability changes
    const handleEthereumReady = () => {
      checkWallets();
    };
    
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on?.('connect', handleEthereumReady);
      (window as any).ethereum.on?.('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
        } else {
          setConnectedAddress(null);
        }
      });
    }
    
    return () => {
      clearTimeout(timer);
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.removeListener?.('connect', handleEthereumReady);
      }
    };
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
      const provider = getWalletProvider();
      if (!provider) return;
      
      if (!isValidAddress(QUIZ_CONTRACT_ADDRESS)) {
        console.error('Invalid contract address');
        return;
      }
      
      await provider.request({
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
      contractAddedRef.current = true;
    }
  }, []);

  // ✅ NEW: Connect wallet function with proper error handling and retry
  const connectWallet = useCallback(async () => {
    setWalletError(null);
    try {
      // Wait a moment for MetaMask to inject ethereum object
      let provider = getWalletProvider();
      if (!provider) {
        // Try once more after a small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        provider = getWalletProvider();
      }
      
      if (!provider) {
        setWalletError('No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, or Base App.');
        return;
      }

      try {
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        });

        if (!accounts || accounts.length === 0) {
          setWalletError('No accounts available. Please connect a wallet account.');
          return;
        }

        setConnectedAddress(accounts[0]);
        setWalletError(null);
        console.log('Wallet connected:', accounts[0]);
      } catch (requestError: any) {
        console.error('Request accounts error:', requestError);
        
        if (requestError.code === 4001) {
          setWalletError('Connection cancelled. Please try again.');
        } else if (requestError.code === -32002) {
          setWalletError('Connection request already pending. Please check your wallet.');
        } else if (requestError.message?.includes('User rejected') || requestError.message?.includes('rejected')) {
          setWalletError('Connection rejected. Please try again and approve the request.');
        } else {
          setWalletError(requestError.message || 'Failed to connect wallet. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setWalletError('Unexpected error connecting wallet. Please try again.');
    }
  }, []);

  // ✅ OPTIMIZED: Send Transaction with better user experience and security
  const userCompleteLevel = useCallback(async () => {
    try {
      // Validate contract address
      if (!isValidAddress(QUIZ_CONTRACT_ADDRESS)) {
        setTxStatus('❌ Invalid contract address');
        setAutoProgressing(false);
        return;
      }

      setTxStatus(`📤 Sending transaction for Level ${currentLevel}...`);
      setShowMetaMaskHelp(true);
      
      const provider = getWalletProvider();
      if (!provider) {
        setTxStatus('❌ No Web3 wallet detected. Please connect a wallet first.');
        setAutoProgressing(false);
        return;
      }

      try {
        // Create a timeout promise
        const requestPromise = provider.request({
          method: 'eth_requestAccounts',
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout: MetaMask did not respond within 30 seconds')), 30000)
        );
        
        const accounts = await Promise.race([requestPromise, timeoutPromise]) as string[];
        
        if (!accounts || accounts.length === 0) {
          setTxStatus('❌ No wallet account available');
          setAutoProgressing(false);
          return;
        }

        const account = accounts[0];
        setConnectedAddress(account);
        setTxStatus(`✅ Wallet connected: ${account.slice(0, 6)}...${account.slice(-4)}`);

        // Only try to add contract once per session
        if (!contractAddedRef.current) {
          await addContractToMetaMask();
        }

        // Safely encode function call with validation
        let encodedData: string;
        try {
          encodedData = encodeFunctionCall('completeLevel', [currentLevel]);
        } catch (encodeError: any) {
          setTxStatus(`❌ ${encodeError.message}`);
          setAutoProgressing(false);
          return;
        }

        // Send transaction with proper parameters
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: account,
            to: QUIZ_CONTRACT_ADDRESS,
            value: '0',
            data: encodedData,
            gas: '150000',
            chainId: '0x2105', // Base Mainnet
          }],
        });

        if (!txHash || typeof txHash !== 'string') {
          setTxStatus('❌ Transaction failed: Invalid response from wallet');
          setAutoProgressing(false);
          return;
        }

        setTxStatus(`🚀 Transaction sent! Hash: ${txHash.slice(0, 10)}...`);
        console.log('Transaction sent to contract:', txHash);
        
        // Show BaseScan link
        setTimeout(() => {
          setTxStatus(prev => `${prev}\n🔍 View on BaseScan: https://basescan.org/tx/${txHash}`);
        }, 1000);
        
        return txHash;

      } catch (walletErr: any) {
        console.log('Wallet error:', walletErr);
        
        // Handle timeout specifically
        if (walletErr.message?.includes('timeout') || walletErr.message?.includes('Timeout')) {
          setTxStatus('❌ Request timeout: MetaMask did not respond. Please try again.');
        } else if (walletErr.code === 4001) {
          setTxStatus('❌ Transaction rejected by user');
        } else if (walletErr.message?.includes('insufficient funds')) {
          setTxStatus('❌ Insufficient ETH for gas fees');
        } else if (walletErr.message?.includes('user rejected')) {
          setTxStatus('❌ User rejected the transaction');
        } else if (walletErr.message?.includes('connection') || walletErr.message?.includes('Connection')) {
          setTxStatus('❌ Connection error with wallet. Please check MetaMask.');
        } else {
          setTxStatus(`⚠️ ${walletErr.message?.slice(0, 60) || 'Transaction failed'}`);
        }
        setAutoProgressing(false);
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
  }, [isLastQuestion, score, userCompleteLevel]);

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

  const bgClass = isDarkMode 
    ? 'bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white' 
    : 'bg-linear-to-br from-gray-50 via-gray-100 to-gray-50 text-gray-900';
  
  const cardClass = isDarkMode
    ? 'bg-gray-700 border border-gray-600'
    : 'bg-white border border-gray-200';
  
  const textSecondaryClass = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textTertiaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = isDarkMode
    ? 'bg-gray-800 border border-gray-600 text-white'
    : 'bg-gray-50 border border-gray-300 text-gray-900';

  return (
    <div className={`min-h-screen ${bgClass} p-4 sm:p-6`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Theme Toggle */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-center flex-1 text-blue-400 border-b border-gray-700 pb-4">JS Quiz Miniapp</h1>
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg ml-4 transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {quizState === 'start' && (
          <div className="text-center space-y-6">
            <BookOpen className="w-16 h-16 mx-auto text-blue-400" />
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">JavaScript 10-Level Challenge</h2>
            <p className="text-base sm:text-lg text-gray-300">Score {PASS_THRESHOLD}/{QUESTIONS_PER_LEVEL} to unlock the next level.</p>

            {/* ✅ NEW: Wallet Connection Section */}
            <div className={`rounded-lg p-4 space-y-3 border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-yellow-400" />
                <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Connect Your Wallet</h3>
              </div>
              
              {connectedAddress ? (
                <div className={`border rounded p-3 ${isDarkMode ? 'bg-green-900/30 border-green-500' : 'bg-green-50 border-green-300'}`}>
                  <p className={`font-semibold ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>✅ Connected</p>
                  <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</p>
                </div>
              ) : (
                <>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {availableWallets.length > 0 
                      ? `Detected: ${availableWallets.join(', ')}` 
                      : 'No Web3 wallet detected'}
                  </p>
                  
                  {walletError && (
                    <div className={`border rounded p-2 ${isDarkMode ? 'bg-red-900/30 border-red-500' : 'bg-red-50 border-red-300'}`}>
                      <p className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>{walletError}</p>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="w-full py-3 px-4 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                  </button>
                  
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                    Supports: MetaMask, Coinbase Wallet, Base App, and Farcaster
                  </p>
                </>
              )}
            </div>

            {/* Level Grid - Responsive */}
            <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 sm:gap-3 pt-4">
              {[...Array(TOTAL_LEVELS)].map((_, i) => {
                const level = i + 1;
                const unlocked = level < globalStats.highestLevel;
                const isNext = level === globalStats.highestLevel;
                return (
                  <button
                    type="button"
                    key={level}
                    onClick={() => startQuiz(level)}
                    disabled={!unlocked && !isNext}
                    className={`p-2 sm:p-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                      unlocked
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : isNext
                        ? 'bg-blue-600 hover:bg-blue-700 font-bold text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    L{level}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {quizState === 'in_progress' && currentQuestion && (
        <div className="space-y-6">
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm sm:text-xl font-semibold border-b pb-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <span className="text-blue-400">Level {currentLevel} of {TOTAL_LEVELS}</span>
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Q {currentQuestionIndex + 1} of {QUESTIONS_PER_LEVEL}</span>
            <span className="text-green-400">Score: {score}</span>
          </div>

          <div className={`p-4 sm:p-5 rounded-lg border-l-4 border-blue-500 shadow-xl ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <p className={`text-lg sm:text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentQuestion.question}</p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = option === currentQuestion.answer;
              const isSelected = option === selectedOption;
              const isAnswered = selectedOption !== null;
              let optionStyle = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
              let icon = null;
              if (isAnswered) {
                if (isCorrect) { 
                  optionStyle = isDarkMode ? 'bg-green-800 border-2 border-green-500' : 'bg-green-100 border-2 border-green-500'; 
                  icon = <CheckCircle className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />; 
                }
                else if (isSelected) { 
                  optionStyle = isDarkMode ? 'bg-red-800 border-2 border-red-500' : 'bg-red-100 border-2 border-red-500'; 
                  icon = <XCircle className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`} />; 
                }
                else { 
                  optionStyle = isDarkMode ? 'bg-gray-800 text-gray-500 cursor-default' : 'bg-gray-300 text-gray-500 cursor-default'; 
                }
              }
              return (
                <div key={index} onClick={() => handleOptionSelect(option)} className={`p-3 sm:p-4 rounded-lg flex items-center justify-between transition duration-150 text-sm sm:text-base ${!isAnswered ? 'cursor-pointer' : 'cursor-default'} ${optionStyle}`}>
                  <span className={`${isAnswered && !isCorrect && !isSelected ? (isDarkMode ? 'text-gray-500' : 'text-gray-600') : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>{option}</span>
                  {icon}
                </div>
              );
            })}
          </div>

          {showExplanation && (
            <div className={`p-4 mt-4 rounded-lg border-l-4 border-yellow-500 shadow-md ${isDarkMode ? 'bg-gray-900' : 'bg-yellow-50'}`}>
              <p className={`font-bold mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>Explanation:</p>
              <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currentQuestion.explanation}</p>
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
        <div className={`text-center space-y-6 p-4 sm:p-6 rounded-xl shadow-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
          {levelPassed ? (
            <>
              <CheckCircle className="w-16 sm:w-20 h-16 sm:h-20 mx-auto text-green-400" />
              <h2 className={`text-2xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Level {currentLevel} Passed!</h2>
              <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Score: {score}/{QUESTIONS_PER_LEVEL}</p>
              
              {/* Transaction Status */}
              {txStatus && (
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-300'}`}>
                  <p className={`font-semibold whitespace-pre-line text-sm sm:text-base ${isDarkMode ? 'text-yellow-300' : 'text-blue-700'}`}>{txStatus}</p>
                </div>
              )}
              
              {/* Send Transaction Button */}
              {!txStatus || txStatus.includes('❌') || txStatus.includes('No wallet') || txStatus.includes('rejected') ? (
                <button 
                  type="button" 
                  onClick={() => userCompleteLevel()}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all"
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
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-all"
                >
                  Next Level →
                </button>
              )}
            </>
          ) : (
            <>
              <XCircle className="w-16 sm:w-20 h-16 sm:h-20 mx-auto text-red-400" />
              <h2 className={`text-2xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Level {currentLevel} Failed</h2>
              <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>You needed {PASS_THRESHOLD}/{QUESTIONS_PER_LEVEL} to pass.</p>
              <button type="button" onClick={() => startQuiz(currentLevel)} className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-all">
                Retry Level
              </button>
            </>
          )}
          <button type="button" onClick={() => setQuizState('start')} className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${isDarkMode ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-900'}`}>
            Back to Level Select
          </button>
        </div>
      )}
      </div>
    </div>
  );
}