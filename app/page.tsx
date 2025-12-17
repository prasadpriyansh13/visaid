"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Type definitions for the API response
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectionData {
  label: string;
  confidence: number;
  bounding_box: BoundingBox;
}

export default function Dashboard() {
  const [detectionData, setDetectionData] = useState<DetectionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSuccessTimeRef = useRef<number | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  
  // Text-to-Speech state
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [isTtsPaused, setIsTtsPaused] = useState(false); // Track if repetition is paused
  const [lastSpokenData, setLastSpokenData] = useState<DetectionData | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const userHasInteractedRef = useRef<boolean>(false);
  const voicesLoadedRef = useRef<boolean>(false);
  const ttsRepeatIntervalRef = useRef<NodeJS.Timeout | null>(null); // Track repetition interval

  // Polling interval: 5 seconds (5000ms)
  const POLL_INTERVAL = 5000;
  // Timeout threshold: 2 minutes (120000ms)
  const TIMEOUT_THRESHOLD = 120000;

  // Convert number to words for TTS (simplified version)
  // 
  // TESTING TTS FEATURE:
  // 1. Open the dashboard in Chrome desktop or Chrome mobile
  // 2. Wait for detection data to appear (or use mock API)
  // 3. Toggle "Audio Feedback" switch ON (this is the required user interaction)
  // 4. TTS will automatically repeat every 3 seconds: "<label> detected — <confidence> percent"
  // 5. Press "Pause" button to stop the repetitive output
  // 6. Press "Play/Resume" button to resume the 3-second repetition
  // 7. Visual indicator (🔊) appears when speech is playing
  // Note: TTS only works after user interaction due to browser autoplay policies
  // Note: Repetition continues every 3 seconds until paused or disabled
  const numberToWords = (num: number): string => {
    const ones = [
      "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
      "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
      "seventeen", "eighteen", "nineteen"
    ];
    const tens = [
      "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
    ];

    if (num === 0) return "zero";
    if (num < 20) return ones[num];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one > 0 ? " " + ones[one] : "");
    }
    return num.toString();
  };

  // Speak detection data
  // IMPORTANT: This function can only be called after a user interaction
  // (e.g., toggle enabled, play button pressed) due to browser autoplay policies.
  // Browsers block audio playback that isn't directly triggered by user interaction.
  const speakDetection = (data: DetectionData, triggeredByUser: boolean = false) => {
    // Require user interaction before allowing speech (browser autoplay policy)
    if (!triggeredByUser && !userHasInteractedRef.current) {
      console.warn("TTS requires user interaction first");
      return;
    }

    if (!ttsEnabled || !synthRef.current) return;

    // Ensure voices are loaded
    if (!voicesLoadedRef.current) {
      loadVoices();
      if (voicesRef.current.length === 0) {
        console.warn("No voices available yet, waiting...");
        // Try again after a short delay
        setTimeout(() => {
          if (voicesLoadedRef.current && voicesRef.current.length > 0) {
            speakDetection(data, triggeredByUser);
          }
        }, 500);
        return;
      }
    }

    // Stop any current speech
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const confidencePercent = Math.round(data.confidence * 100);
    const confidenceWords = numberToWords(confidencePercent);
    const text = `${data.label} detected — ${confidenceWords} percent`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Select a voice (prefer English voices)
    if (voicesRef.current.length > 0) {
      // Try to find an English voice
      let selectedVoice = voicesRef.current.find(
        (voice) => voice.lang.startsWith("en") && voice.default
      );
      if (!selectedVoice) {
        selectedVoice = voicesRef.current.find((voice) => voice.lang.startsWith("en"));
      }
      if (!selectedVoice) {
        selectedVoice = voicesRef.current[0]; // Fallback to first available voice
      }
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsTtsPlaying(true);
      userHasInteractedRef.current = true; // Mark interaction after successful start
    };
    utterance.onend = () => {
      setIsTtsPlaying(false);
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error("Speech synthesis error:", event.error, event);
      setIsTtsPlaying(false);
      // Clear the utterance reference on error
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    
    // Explicitly call cancel before speak to ensure clean state
    // This prevents errors from trying to speak while already speaking
    if (synthRef.current.speaking || synthRef.current.pending) {
      synthRef.current.cancel();
    }
    
    // Small delay to ensure cancel is processed
    setTimeout(() => {
      if (synthRef.current && utteranceRef.current === utterance) {
        try {
          synthRef.current.speak(utterance);
        } catch (error) {
          console.error("Error calling speechSynthesis.speak:", error);
          setIsTtsPlaying(false);
          utteranceRef.current = null;
        }
      }
    }, 50);
  };

  // Load available voices
  const loadVoices = () => {
    if (synthRef.current) {
      const voices = synthRef.current.getVoices();
      voicesRef.current = voices;
      voicesLoadedRef.current = voices.length > 0;
    }
  };

  // Pause/stop TTS repetition
  // This stops the repetitive 2-second interval and cancels any current speech
  const pauseTts = () => {
    // Stop the repetition interval
    if (ttsRepeatIntervalRef.current) {
      clearInterval(ttsRepeatIntervalRef.current);
      ttsRepeatIntervalRef.current = null;
    }
    
    // Cancel any ongoing speech
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsTtsPlaying(false);
    }
    
    setIsTtsPaused(true);
  };

  // Start/resume TTS repetition
  // This function is called directly by user interaction (button click),
  // which satisfies browser autoplay policies.
  // It resumes the 2-second repetition cycle (managed by useEffect).
  const replayTts = () => {
    if (lastSpokenData && ttsEnabled) {
      userHasInteractedRef.current = true; // Mark user interaction
      setIsTtsPaused(false); // Resume repetition (useEffect will handle starting the interval)
      
      // Speak immediately
      speakDetection(lastSpokenData, true);
      
      // The useEffect hook will automatically start the 2-second repetition
      // since isTtsPaused is now false
    }
  };

  // Initialize TTS and load voices
  // Voices may not be available immediately, so we listen for the 'voiceschanged' event
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      
      // Load voices immediately if available
      loadVoices();
      
      // Listen for voices to become available (some browsers load them asynchronously)
      const handleVoicesChanged = () => {
        loadVoices();
      };
      
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      };
    }
  }, []);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      // Clear repetition interval
      if (ttsRepeatIntervalRef.current) {
        clearInterval(ttsRepeatIntervalRef.current);
      }
      
      // Cancel any ongoing speech
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Handle TTS repetition when enabled/disabled or when data changes
  // This effect manages the automatic 2-second repetition cycle
  useEffect(() => {
    // Clear any existing interval first
    if (ttsRepeatIntervalRef.current) {
      clearInterval(ttsRepeatIntervalRef.current);
      ttsRepeatIntervalRef.current = null;
    }

    // Start repetition if TTS is enabled, user has interacted, we have data, and not paused
    if (ttsEnabled && userHasInteractedRef.current && lastSpokenData && !isTtsPaused) {
      // Start repeating every 3 seconds
      ttsRepeatIntervalRef.current = setInterval(() => {
        // Double-check conditions before speaking
        if (lastSpokenData && ttsEnabled && !isTtsPaused && userHasInteractedRef.current) {
          speakDetection(lastSpokenData, true);
        } else {
          // If conditions no longer met, clear interval
          if (ttsRepeatIntervalRef.current) {
            clearInterval(ttsRepeatIntervalRef.current);
            ttsRepeatIntervalRef.current = null;
          }
        }
      }, 3000); // Repeat every 3 seconds
    }

    // Cleanup on disable, pause, or data change
    return () => {
      if (ttsRepeatIntervalRef.current) {
        clearInterval(ttsRepeatIntervalRef.current);
        ttsRepeatIntervalRef.current = null;
      }
    };
  }, [ttsEnabled, lastSpokenData, isTtsPaused]);

  const fetchDetectionData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data: DetectionData = await response.json();

      // Validate data structure
      if (
        !data.label ||
        typeof data.confidence !== "number" ||
        !data.bounding_box
      ) {
        throw new Error("Invalid data structure received");
      }

      // Check if this is new data (different from previous)
      const isNewData = !detectionData || 
        detectionData.label !== data.label || 
        Math.abs(detectionData.confidence - data.confidence) > 0.01;

      // Update state with new data
      setDetectionData(data);
      setError(null);
      setIsLoading(false);
      lastSuccessTimeRef.current = Date.now();
      setShowPlaceholder(false);

      // Store new data for potential TTS playback
      if (isNewData) {
        setLastSpokenData(data);
        // Only trigger TTS automatically if user has already interacted
        // (e.g., enabled toggle or pressed play button)
        // This ensures compliance with browser autoplay policies
        if (ttsEnabled && userHasInteractedRef.current) {
          speakDetection(data, false);
        }
      }
    } catch (err) {
      console.error("Error fetching detection data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsLoading(false);

      // Check if we should show placeholder
      if (lastSuccessTimeRef.current) {
        const timeSinceLastSuccess = Date.now() - lastSuccessTimeRef.current;
        if (timeSinceLastSuccess >= TIMEOUT_THRESHOLD) {
          setShowPlaceholder(true);
        }
      } else {
        setTimeout(() => {
          if (!lastSuccessTimeRef.current) {
            setShowPlaceholder(true);
          }
        }, TIMEOUT_THRESHOLD);
      }
    }
  };

  // Set up polling effect
  useEffect(() => {
    fetchDetectionData();

    const intervalId = setInterval(() => {
      fetchDetectionData();
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  // Check for timeout periodically
  useEffect(() => {
    const checkTimeout = () => {
      if (lastSuccessTimeRef.current) {
        const timeSinceLastSuccess = Date.now() - lastSuccessTimeRef.current;
        if (timeSinceLastSuccess >= TIMEOUT_THRESHOLD) {
          setShowPlaceholder(true);
        } else {
          setShowPlaceholder(false);
        }
      }
    };

    const timeoutCheckInterval = setInterval(checkTimeout, 1000);
    return () => clearInterval(timeoutCheckInterval);
  }, []);

  // Calculate API status (LIVE if data received within last 2 minutes)
  const isApiLive = lastSuccessTimeRef.current
    ? Date.now() - lastSuccessTimeRef.current < TIMEOUT_THRESHOLD
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with API Status Indicator */}
        <div className="relative mb-4 sm:mb-6 md:mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 pr-20">
              VisionAid Dashboard
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
              Real-time object detection data from ESP32 API
            </p>
          </motion.div>

          {/* API Activity Status Indicator - Top Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-0 right-0 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-md"
          >
            <motion.div
              animate={{
                scale: isApiLive ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: isApiLive ? Infinity : 0,
                ease: "easeInOut",
              }}
              className={`w-2.5 h-2.5 rounded-full ${
                isApiLive ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              {isApiLive ? "LIVE" : "IDLE"}
            </span>
          </motion.div>
        </div>

        {/* Text-to-Speech Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-4 sm:mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span>Audio Feedback</span>
                {/* Visual indicator when speech is playing */}
                {isTtsPlaying && (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-blue-600 dark:text-blue-400"
                    aria-label="Speech is playing"
                  >
                    🔊
                  </motion.div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    // Mark user interaction - this satisfies browser autoplay policy
                    userHasInteractedRef.current = true;
                    const newState = !ttsEnabled;
                    setTtsEnabled(newState);
                    if (!newState) {
                      // Disable: stop repetition and cancel speech
                      pauseTts();
                    } else {
                      // Enable: resume repetition if paused, or start if not paused
                      setIsTtsPaused(false);
                      if (lastSpokenData) {
                        // Start repetition immediately
                        replayTts();
                      }
                    }
                  }}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation ${
                    ttsEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  aria-label={ttsEnabled ? "Disable audio feedback" : "Enable audio feedback"}
                  aria-pressed={ttsEnabled}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                      ttsEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={pauseTts}
                disabled={!isTtsPlaying}
                className="px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation active:scale-95"
                aria-label="Pause speech"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={replayTts}
                disabled={!ttsEnabled || !lastSpokenData}
                className="px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation active:scale-95"
                aria-label={isTtsPaused ? "Resume repetition" : "Start/resume repetition"}
              >
                {isTtsPaused ? "Resume" : "Play"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Remarks/Feedback Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-4 sm:mb-6"
        >
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdV2n4GE4xN2onix7e81MLeFCOw2uHUrUtSPhw96zYxfxCR_Q/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-md transition-all duration-200 touch-manipulation active:scale-95"
          >
            <span className="mr-2">💬</span>
            Give Feedback
          </a>
        </motion.div>

        {/* Detection Data or Placeholder */}
        <AnimatePresence mode="wait">
          {showPlaceholder ? (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12"
            >
              <div className="text-center space-y-3 sm:space-y-4">
                <motion.div
                  animate={{
                    opacity: [1, 0.4, 1],
                    scale: [1, 0.98, 1],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-5xl sm:text-6xl mb-3 sm:mb-4"
                >
                  🔍
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                  No objects detected
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Waiting for detection data from the API...
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Last successful response was more than 2 minutes ago
                </p>
              </div>
            </motion.div>
          ) : detectionData ? (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6"
            >
              {/* Object Label */}
              <div>
                <h2 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2">
                  Detected Object
                </h2>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white capitalize"
                >
                  {detectionData.label}
                </motion.div>
              </div>

              {/* Confidence */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    Confidence
                  </h2>
                  <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {(detectionData.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${detectionData.confidence * 100}%` }}
                    transition={{
                      duration: 0.8,
                      ease: "easeOut",
                    }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  />
                </div>
              </div>

              {/* Bounding Box */}
              <div>
                <h2 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                  Bounding Box
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  {[
                    { label: "X", value: detectionData.bounding_box.x },
                    { label: "Y", value: detectionData.bounding_box.y },
                    { label: "Width", value: detectionData.bounding_box.width },
                    {
                      label: "Height",
                      value: detectionData.bounding_box.height,
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4"
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {item.label}
                      </div>
                      <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        {item.value}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12"
            >
              <div className="text-center">
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Loading detection data...
                </div>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12"
            >
              <div className="text-center space-y-2">
                <div className="text-sm sm:text-base text-red-600 dark:text-red-400 font-semibold">
                  Error loading data
                </div>
                <div className="text-xs sm:text-sm text-red-500 dark:text-red-400">
                  {error}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
