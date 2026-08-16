import React, { useState, useEffect, useRef } from 'react';
import { SeniorProfile, Medicine, Appointment, ConversationLog, AppLanguage, EmergencyContact } from '../types';
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, Clock, Calendar, AlertOctagon, Heart, Sparkles, Send, PhoneCall, Pill, Sun, ShieldAlert, Globe, UserPlus, Phone, Edit3, Trash2 } from 'lucide-react';

interface SeniorDashboardProps {
  senior: SeniorProfile;
  medicines: Medicine[];
  appointments: Appointment[];
  conversationLogs: ConversationLog[];
  emergencyContacts: EmergencyContact[];
  language: AppLanguage;
  onToggleLanguage: () => void;
  largeFont: boolean;
  highContrast: boolean;
  onTakeMedicine: (medicineId: string) => void;
  onSendSeniorMessage: (messageText: string) => Promise<void>;
  onTriggerSos: () => void;
  onOpenAddContact: () => void;
  onEditContact: (contact: EmergencyContact) => void;
  onRemoveContact: (contactId: string) => void;
  isAiThinking: boolean;
}

export const SeniorDashboard: React.FC<SeniorDashboardProps> = ({
  senior,
  medicines,
  appointments,
  conversationLogs,
  emergencyContacts,
  language,
  onToggleLanguage,
  largeFont,
  highContrast,
  onTakeMedicine,
  onSendSeniorMessage,
  onTriggerSos,
  onOpenAddContact,
  onEditContact,
  onRemoveContact,
  isAiThinking
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [autoVoiceMode, setAutoVoiceMode] = useState(true);
  const [micLanguage, setMicLanguage] = useState<'en-US' | 'hi-IN'>(language === 'hi' ? 'hi-IN' : 'en-US');
  const [activeSpeechText, setActiveSpeechText] = useState<string | null>(null);
  const [isAutoOffBySilence, setIsAutoOffBySilence] = useState(false);

  const recognitionRef = useRef<any>(null);
  const autoVoiceModeRef = useRef(autoVoiceMode);
  autoVoiceModeRef.current = autoVoiceMode;
  const inputTextRef = useRef(inputText);
  inputTextRef.current = inputText;
  const isAiThinkingRef = useRef(isAiThinking);
  isAiThinkingRef.current = isAiThinking;
  const silenceTimerRef = useRef<any>(null);
  const lastSpokenLogIdRef = useRef<string | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const lastSentTextRef = useRef<string>('');

  const isHindi = language === 'hi' || micLanguage === 'hi-IN';

  // Synchronize mic language when top-level language setting changes
  useEffect(() => {
    setMicLanguage(language === 'hi' ? 'hi-IN' : 'en-US');
  }, [language]);

  // Manage 2-minute silence auto-off timer for Voice AI
  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Only set timer if Auto Voice or Listening is active
    if (autoVoiceModeRef.current || isListening) {
      silenceTimerRef.current = setTimeout(() => {
        console.log('Voice AI: 2 minutes of silence detected. Turning off automatically.');
        setAutoVoiceMode(false);
        autoVoiceModeRef.current = false;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        setIsListening(false);
        setIsAutoOffBySilence(true);
      }, 120000); // 120 seconds = 2 minutes
    }
  };

  useEffect(() => {
    resetSilenceTimer();
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [autoVoiceMode, isListening]);

  // Initialize & Update Speech Recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = micLanguage;

      recognition.onresult = (event: any) => {
        // Ignore mic input if AI is currently speaking (prevents speaker echo from being transcribed)
        if (isSpeakingRef.current || (window.speechSynthesis && window.speechSynthesis.speaking)) {
          return;
        }
        resetSilenceTimer();
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputText(transcript);
        inputTextRef.current = transcript;
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);

        // Do not auto-send if AI is currently speaking or if window.speechSynthesis is active
        if (isSpeakingRef.current || (window.speechSynthesis && window.speechSynthesis.speaking)) {
          setInputText('');
          inputTextRef.current = '';
          return;
        }

        const textToSend = inputTextRef.current.trim();
        const lowerText = textToSend.toLowerCase();

        // Check if user spoke a stop command
        if (
          lowerText === 'stop' ||
          lowerText === 'stop listening' ||
          lowerText === 'quiet' ||
          lowerText === 'रुको' ||
          lowerText === 'बंद करो' ||
          lowerText === 'बस'
        ) {
          setAutoVoiceMode(false);
          setInputText('');
          inputTextRef.current = '';
          return;
        }

        // Ignore duplicate text sent consecutively within voice session
        if (textToSend && textToSend === lastSentTextRef.current) {
          setInputText('');
          inputTextRef.current = '';
          return;
        }

        // Auto-send user spoken message when user finishes speaking
        if (textToSend && autoVoiceModeRef.current && !isAiThinkingRef.current) {
          lastSentTextRef.current = textToSend;
          resetSilenceTimer();
          setInputText('');
          inputTextRef.current = '';

          // Check if user requested an emergency alert to family via voice
          if (
            lowerText.includes('send alert') ||
            lowerText.includes('alert family') ||
            lowerText.includes('alert to family') ||
            lowerText.includes('alert my family') ||
            lowerText.includes('family alert') ||
            lowerText.includes('sos') ||
            lowerText.includes('emergency alert') ||
            lowerText.includes('आपातकालीन') ||
            lowerText.includes('अलर्ट')
          ) {
            onTriggerSos();
          }

          onSendSeniorMessage(textToSend);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [micLanguage]);

  const toggleListening = () => {
    setIsAutoOffBySilence(false);
    resetSilenceTimer();

    if (!recognitionRef.current) {
      alert(isHindi
        ? "ब्राउज़र में वॉयस रिकॉग्निशन समर्थित नहीं है। आप नीचे दिए गए बटनों पर क्लिक करके बात कर सकते हैं!"
        : "Voice recognition isn't supported in this browser mode. You can type or click the quick voice chips!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputText('');
      inputTextRef.current = '';
      setAutoVoiceMode(true);
      autoVoiceModeRef.current = true;
      try {
        recognitionRef.current.lang = micLanguage;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('STT start exception:', err);
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const msg = inputText.trim();
    if (!msg || isAiThinking) return;

    lastSentTextRef.current = msg;
    resetSilenceTimer();
    setInputText('');
    inputTextRef.current = '';
    await onSendSeniorMessage(msg);
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (isAiThinking || !promptText) return;

    lastSentTextRef.current = promptText;
    resetSilenceTimer();
    setInputText('');
    inputTextRef.current = '';
    await onSendSeniorMessage(promptText);
  };

  // Text-To-Speech for AI responses with automatic Hindi Devanagari detection & auto-resume listening
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !speechEnabled) return;

    // Immediately stop ongoing recognition so microphone doesn't pick up speaker output
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setInputText('');
    inputTextRef.current = '';

    window.speechSynthesis.cancel(); // Stop any pending speech

    const cleanSpeechText = text
      .replace(/[*_#`~[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeechText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 0.90; // Comfortable & smooth natural pace for senior citizens
    utterance.pitch = 1.0;

    // Detect if response contains Hindi Devanagari script
    const hasHindiScript = /[\u0900-\u097F]/.test(cleanSpeechText);

    if (hasHindiScript || micLanguage === 'hi-IN' || isHindi) {
      utterance.lang = 'hi-IN';
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => {
      setActiveSpeechText(cleanSpeechText);
      isSpeakingRef.current = true;
      setInputText('');
      inputTextRef.current = '';
    };

    const handleSpeechDone = () => {
      setActiveSpeechText(null);
      isSpeakingRef.current = false;
      setInputText('');
      inputTextRef.current = '';

      // Auto-resume listening when AI finishes speaking if Auto Voice mode is enabled
      if (autoVoiceModeRef.current && recognitionRef.current) {
        setTimeout(() => {
          if (!isSpeakingRef.current && autoVoiceModeRef.current) {
            try {
              recognitionRef.current.lang = micLanguage;
              recognitionRef.current.start();
              setIsListening(true);
              resetSilenceTimer();
            } catch (e) {
              // Already active or busy
            }
          }
        }, 600);
      }
    };

    utterance.onend = handleSpeechDone;
    utterance.onerror = handleSpeechDone;

    window.speechSynthesis.speak(utterance);
  };

  // Auto-speak latest AI response ONLY ONCE per log ID
  useEffect(() => {
    const latestLog = conversationLogs[conversationLogs.length - 1];
    if (
      latestLog &&
      latestLog.sender === 'ai' &&
      speechEnabled &&
      latestLog.id !== lastSpokenLogIdRef.current
    ) {
      lastSpokenLogIdRef.current = latestLog.id;
      speakText(latestLog.text);
    }
  }, [conversationLogs, speechEnabled]);

  const textSize = largeFont ? 'text-lg' : 'text-base';
  const headingSize = largeFont ? 'text-2xl font-black' : 'text-xl font-bold';

  return (
    <div id="senior-dashboard-root" className={`space-y-6 sm:space-y-8 pb-12 ${
      highContrast ? 'text-slate-100' : 'text-slate-800'
    }`}>

      {/* Senior Greeting Header */}
      <div id="senior-header-card" className={`p-6 sm:p-8 rounded-3xl border shadow-sm relative overflow-hidden transition-all ${
        highContrast
          ? 'bg-slate-900 border-slate-700 text-white'
          : 'bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 border-sky-400 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4 sm:space-x-5">
            <img
              src={senior.avatar}
              alt={senior.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/80 shadow-md"
            />
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>Good Morning • Seattle, WA</span>
              </div>
              <h1 className={`${largeFont ? 'text-3xl font-black' : 'text-2xl sm:text-3xl font-extrabold'} tracking-tight`}>
                Welcome back, {senior.name.split(' ')[0]}!
              </h1>
              <p className="text-xs sm:text-sm text-sky-100 font-medium">
                Your AI Companion Grace is listening and ready to assist you.
              </p>
            </div>
          </div>

          {/* Quick SOS Panic Button */}
          <div className="flex items-center space-x-3">
            <button
              id="senior-sos-panic-btn"
              onClick={onTriggerSos}
              className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-extrabold px-6 py-4 rounded-2xl shadow-lg border-2 border-red-300 flex items-center justify-center space-x-3 transition-transform active:scale-95"
            >
              <AlertOctagon className="w-7 h-7 text-white animate-bounce" />
              <div className="text-left">
                <div className="text-xs uppercase font-semibold text-red-100">Emergency</div>
                <div className="text-base sm:text-lg leading-none">PRESS FOR SOS</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Voice Companion + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

        {/* LEFT COLUMN: Voice Companion Chat & Interactive Console */}
        <div className="lg:col-span-7 space-y-6">

          {/* AI Voice Companion Interactive Console */}
          <div id="voice-companion-card" className={`p-6 rounded-3xl border shadow-sm space-y-5 ${
            highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex flex-wrap items-center justify-between border-b pb-4 border-slate-100 gap-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-sky-600 animate-spin-slow" />
                </div>
                <div>
                  <h2 className={headingSize}>Talk with Grace (AI Companion)</h2>
                  <p className="text-xs text-slate-500">Clinical-grade voice AI • Auto-detects English & हिंदी</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Auto Voice Hands-free Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !autoVoiceMode;
                    setAutoVoiceMode(nextMode);
                    if (!nextMode && isListening && recognitionRef.current) {
                      recognitionRef.current.stop();
                      setIsListening(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-colors ${
                    autoVoiceMode
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title="Auto Voice Mode automatically listens and sends when you stop speaking"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${autoVoiceMode ? 'text-emerald-600 animate-spin-slow' : 'text-slate-400'}`} />
                  <span>{autoVoiceMode ? 'Auto-Voice: ON (Hands-Free)' : 'Auto-Voice: OFF'}</span>
                </button>

                {/* Speech Recognition Language Quick Switch */}
                <button
                  type="button"
                  onClick={() => {
                    const newLang = micLanguage === 'hi-IN' ? 'en-US' : 'hi-IN';
                    setMicLanguage(newLang);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-colors ${
                    micLanguage === 'hi-IN'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}
                  title="Switch Voice Speech Recognition Language"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{micLanguage === 'hi-IN' ? 'Voice: हिंदी (HI)' : 'Voice: English (US)'}</span>
                </button>

                {/* TTS Sound Toggle */}
                <button
                  id="toggle-tts-btn"
                  onClick={() => {
                    setSpeechEnabled(!speechEnabled);
                    if (speechEnabled) window.speechSynthesis.cancel();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-colors ${
                    speechEnabled
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {speechEnabled ? <Volume2 className="w-4 h-4 text-sky-600" /> : <VolumeX className="w-4 h-4" />}
                  <span>{speechEnabled ? 'Audio: ON' : 'Audio: OFF'}</span>
                </button>
              </div>
            </div>

            {/* Professional Voice AI & Mock Questions Suite */}
            <div className="bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-2xl p-6 text-center border border-sky-100/80 space-y-4">
              <div className="flex items-center justify-center space-x-2 text-xs font-bold text-sky-800 bg-sky-100/80 py-1 px-3 rounded-full w-fit mx-auto">
                <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />
                <span>Real-time Elder Speech Alert Active • Instant Family Sync</span>
              </div>

              {/* 2-Minute Silence Auto-Off Notice */}
              {isAutoOffBySilence && (
                <div className="p-3.5 rounded-2xl bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-2 text-left animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      {isHindi
                        ? "2 मिनट तक कोई आवाज़ न होने पर ऑटो-वॉयस एआई बंद हो गया है। दोबारा बात करने के लिए बटन पर क्लिक करें।"
                        : "Voice AI automatically turned OFF after 2 minutes of silence. Tap the microphone button to start speaking again."}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoOffBySilence(false);
                      setAutoVoiceMode(true);
                      toggleListening();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-[11px] shrink-0 shadow-xs transition-colors"
                  >
                    {isHindi ? 'पुनः चालू करें' : 'Turn Back ON'}
                  </button>
                </div>
              )}

              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                {autoVoiceMode
                  ? isHindi
                    ? "ऑटो-वॉयस चालू है (2 मिनट शांत रहने पर ऑटो-ऑफ): बोलते ही उत्तर मिलेगा ('रुको' या 'Stop' बोलकर रोकें):"
                    : "Auto-Voice active (Auto-offs after 2m silence): Speak out loud, AI auto-sends when you pause (say 'Stop' or 'रुको' to pause):"
                  : isHindi
                    ? "माइक बटन दबाकर बोलें:"
                    : "Tap microphone button to speak:"}
              </p>

              <div className="flex justify-center">
                <button
                  id="mic-record-btn"
                  onClick={toggleListening}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 ${
                    isListening
                      ? 'bg-red-500 text-white ring-8 ring-red-200 animate-pulse'
                      : 'bg-sky-600 hover:bg-sky-700 text-white ring-8 ring-sky-100'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-10 h-10" />
                      <span className="text-[11px] font-bold mt-1">Listening...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-10 h-10" />
                      <span className="text-[11px] font-bold mt-1">TAP TO SPEAK</span>
                    </>
                  )}
                </button>
              </div>

              {isListening && (
                <p className="text-xs text-red-600 font-bold animate-pulse">
                  Listening to your voice... Speak clearly into your device microphone.
                </p>
              )}

              {/* Professional Mock Check-In Questions */}
              <div className="space-y-2 pt-2 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                    {isHindi ? 'वॉयस चेक-इन के उदाहरण प्रश्न (Click to Speak):' : 'Professional Voice Check-in Mock Questions:'}
                  </p>
                  <span className="text-[10px] text-sky-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                    {isHindi ? '5 स्वास्थ्य विकल्प' : '5 Clinical Presets'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isAiThinking}
                    onClick={() => handleQuickPrompt(isHindi ? "ग्रेस, मेरा सुबह का स्वास्थ्य परीक्षण शुरू करें।" : "Grace, start my Morning Clinical Health Assessment.")}
                    className="p-2.5 text-left rounded-xl bg-white hover:bg-sky-50 disabled:opacity-50 text-slate-800 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors flex items-center space-x-2"
                  >
                    <span className="text-base">🩺</span>
                    <div>
                      <div className="font-bold text-slate-900">{isHindi ? 'सुबह का स्वास्थ्य परीक्षण' : 'Morning Health Check'}</div>
                      <div className="text-[10px] text-slate-500">{isHindi ? '"ग्रेस, सुबह का चेक-अप शुरू करें"' : '"Grace, start my morning assessment"'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isAiThinking}
                    onClick={() => handleQuickPrompt(isHindi ? "मैंने अपनी सुबह की दवा ले ली है!" : "I took my morning Lisinopril medication!")}
                    className="p-2.5 text-left rounded-xl bg-white hover:bg-emerald-50 disabled:opacity-50 text-slate-800 text-xs font-semibold border border-emerald-200 shadow-2xs transition-colors flex items-center space-x-2"
                  >
                    <span className="text-base">💊</span>
                    <div>
                      <div className="font-bold text-emerald-900">{isHindi ? 'दवा पुष्टि (Medicine Verification)' : 'Medicine Verification'}</div>
                      <div className="text-[10px] text-emerald-700">{isHindi ? '"मैंने अपनी दवाइयां ले ली हैं"' : '"I took my morning pills"'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isAiThinking}
                    onClick={() => handleQuickPrompt(isHindi ? "मुझे थोड़ा चक्कर आ रहा है और घुटने में दर्द है।" : "I am feeling a little dizzy and have knee pain right now.")}
                    className="p-2.5 text-left rounded-xl bg-white hover:bg-amber-50 disabled:opacity-50 text-slate-800 text-xs font-semibold border border-amber-200 shadow-2xs transition-colors flex items-center space-x-2"
                  >
                    <span className="text-base">⚡</span>
                    <div>
                      <div className="font-bold text-amber-900">{isHindi ? 'दर्द और चक्कर जांच (Alert Family)' : 'Pain & Dizziness Scan'}</div>
                      <div className="text-[10px] text-amber-700">{isHindi ? '"मुझे चक्कर और दर्द महसूस हो रहा है"' : '"I feel dizzy and have knee pain"'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isAiThinking}
                    onClick={() => handleQuickPrompt(isHindi ? "क्या आप आज की तारीख और मेरे शेड्यूल की जांच कर सकती हैं?" : "Can you test my memory orientation for today's date and schedule?")}
                    className="p-2.5 text-left rounded-xl bg-white hover:bg-indigo-50 disabled:opacity-50 text-slate-800 text-xs font-semibold border border-indigo-200 shadow-2xs transition-colors flex items-center space-x-2"
                  >
                    <span className="text-base">🧠</span>
                    <div>
                      <div className="font-bold text-indigo-900">{isHindi ? 'स्मृति एवं दिनांक जांच' : 'Cognitive Memory Check'}</div>
                      <div className="text-[10px] text-indigo-700">{isHindi ? '"मेरी याददाश्त और शेड्यूल टेस्ट करें"' : '"Test my memory & orientation"'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isAiThinking}
                    onClick={() => handleQuickPrompt(isHindi ? "ग्रेस, मैं बिस्तर के पास गिर गई हूँ और मुझे तुरंत मदद चाहिए!" : "Grace, I fell down near my bedside and need immediate help!")}
                    className="p-2.5 text-left rounded-xl bg-white hover:bg-red-50 disabled:opacity-50 text-slate-800 text-xs font-semibold border border-red-200 shadow-2xs transition-colors flex items-center space-x-2 sm:col-span-2"
                  >
                    <span className="text-base">🚨</span>
                    <div>
                      <div className="font-bold text-red-900">{isHindi ? 'आपातकालीन फॉल और क्रिटिकल अलर्ट (Fall Emergency)' : 'Emergency Fall & Critical Alert Trigger'}</div>
                      <div className="text-[10px] text-red-700">{isHindi ? '"ग्रेस, मैं गिर गई हूँ, मदद चाहिए!"' : '"Grace, I fell down near my bedside and need immediate help!"'}</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Conversation Messages Display */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                <span>Recent Conversation</span>
                {isAiThinking && <span className="text-sky-600 font-medium text-xs animate-pulse">Grace is thinking...</span>}
              </h3>

              <div id="chat-stream-box" className="max-h-80 overflow-y-auto space-y-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                {conversationLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex ${log.sender === 'senior' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 space-y-1.5 shadow-2xs ${
                      log.sender === 'senior'
                        ? 'bg-sky-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}>
                      <div className="flex items-center justify-between text-[11px] opacity-80 gap-3">
                        <span className="font-bold">{log.sender === 'senior' ? senior.name : 'Grace (AI)'}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <p className={`${textSize} leading-relaxed font-medium`}>{log.text}</p>

                      {log.sender === 'ai' && log.text && (
                        <div className="pt-1 flex items-center justify-between">
                          {log.detectedEmotion && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                              Emotion: {log.detectedEmotion}
                            </span>
                          )}
                          <button
                            onClick={() => speakText(log.text)}
                            className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                            title="Listen to response again"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic AI Suggested Follow-up Quick Replies */}
            {(() => {
              const latestAiLog = [...conversationLogs].reverse().find(l => l.sender === 'ai');
              const replies = latestAiLog?.suggestedQuickReplies;
              if (!replies || replies.length === 0) return null;
              return (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Suggested Quick Replies:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {replies.map((reply, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAiThinking}
                        onClick={() => handleQuickPrompt(reply)}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sky-800 text-xs font-semibold border border-sky-200 shadow-2xs transition-colors text-left"
                      >
                        💬 "{reply}"
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Text Input Fallback Bar */}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                id="senior-chat-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Or type a message to Grace..."
                className={`flex-1 px-4 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  highContrast ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300'
                }`}
              />
              <button
                id="senior-send-btn"
                type="submit"
                disabled={!inputText.trim() || isAiThinking}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white p-3.5 rounded-2xl shadow-xs transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Reminders (Medicines & Doctor Visits) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Today's Medicines Card */}
          <div id="senior-medicines-card" className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
            highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={headingSize}>Today's Medicines</h2>
                  <p className="text-xs text-slate-500">Scheduled prescriptions for {senior.name.split(' ')[0]}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {medicines.map((med) => {
                const isTaken = med.status === 'taken';
                return (
                  <div
                    key={med.id}
                    id={`medicine-card-${med.id}`}
                    className={`p-4 rounded-2xl border transition-all space-y-2 ${
                      isTaken
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/60 border-amber-200/90 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${med.color}`} />
                          <h3 className="font-bold text-base">{med.name} ({med.dosage})</h3>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">{med.timeLabel}</p>
                        <p className="text-xs text-slate-500">{med.instructions}</p>
                      </div>

                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        isTaken
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-amber-200 text-amber-900'
                      }`}>
                        {isTaken ? '✓ Taken' : 'Pending'}
                      </span>
                    </div>

                    {!isTaken && (
                      <button
                        id={`take-med-btn-${med.id}`}
                        onClick={() => onTakeMedicine(med.id)}
                        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl shadow-xs transition-transform active:scale-98 flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>I TOOK THIS MEDICATION</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Appointments Card */}
          <div id="senior-appointments-card" className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
            highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex items-center space-x-2.5 border-b pb-3 border-slate-100">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className={headingSize}>Doctor Appointments</h2>
                <p className="text-xs text-slate-500">Upcoming hospital & lab visits</p>
              </div>
            </div>

            <div className="space-y-3">
              {appointments.filter(a => a.status === 'upcoming').map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{apt.doctorName}</h3>
                      <p className="text-xs text-indigo-700 font-semibold">{apt.specialty}</p>
                    </div>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800">
                      {apt.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Time: {apt.time} • {apt.hospital}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contacts Card */}
          <div id="senior-contacts-card" className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
            highContrast ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200/90'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={headingSize}>Emergency Contacts</h2>
                  <p className="text-xs text-slate-500">Quick reference directory for family caregivers and doctor</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenAddContact}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Contact</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    contact.isPrimary
                      ? 'bg-sky-50/90 border-sky-200'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-sm text-slate-900 truncate">{contact.name}</span>
                      {contact.isPrimary && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-sky-700">{contact.relationship}</p>
                    <a
                      href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                      className="text-[11px] font-mono text-slate-600 hover:text-sky-600 flex items-center space-x-1 font-medium transition-colors"
                    >
                      <Phone className="w-3 h-3 text-sky-600 inline" />
                      <span>{contact.phone}</span>
                    </a>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditContact(contact)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 border border-slate-200 transition-colors"
                      title="Edit contact details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveContact(contact.id)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 border border-slate-200 transition-colors"
                      title="Remove contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
