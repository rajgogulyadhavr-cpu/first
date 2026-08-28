import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Bot, 
  User, 
  Sparkles, 
  RotateCcw, 
  ShieldAlert, 
  Activity, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { Language, ChatMessage, DFUPredictionResult } from '../../types';
import { translations } from '../../data/translations';
import { sendChatMessage, getVoiceSpeech } from '../../services/api';
import { playPCMBase64, speakWithBrowserSynthesis, stopCurrentAudio } from '../../utils/audioPlayer';
import { NurseAvatar3D, NurseState } from './NurseAvatar3D';

interface PaathasuvaduNurseProps {
  language: Language;
  scanContext?: DFUPredictionResult | null;
  onClearScanContext?: () => void;
}

export const PaathasuvaduNurse: React.FC<PaathasuvaduNurseProps> = ({
  language,
  scanContext,
  onClearScanContext,
}) => {
  const t = translations[language];

  // States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [nurseState, setNurseState] = useState<NurseState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [autoVoiceReply, setAutoVoiceReply] = useState(true);

  // Refs
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize initial greeting
  useEffect(() => {
    const initialGreeting =
      language === 'ta'
        ? scanContext
          ? `வணக்கம்! நான் உங்கள் நல்வாழ்வு செவிலியர் பாதசுவடு. உங்கள் சமீபத்திய கால் பரிசோதனை முடிவை (${
              scanContext.prediction === 'NORMAL' ? 'சாதாரணம்' : 'அசாதாரணம்'
            }) நான் பெற்றுள்ளேன். உங்களுக்கு என்ன ஆலோசனை தேவை?`
          : 'வணக்கம்! நான் பாதசுவடு, உங்கள் AI மெய்நிகர் செவிலியர். நீரிழிவு கால் பராமரிப்பு, உணவு முறைகள் அல்லது அறிகுறிகள் குறித்து நீங்கள் என்னிடம் தமிழில் அல்லது ஆங்கிலத்தில் பேசலாம்.'
        : scanContext
        ? `Hello! I am Paathasuvadu, your virtual healthcare assistant. I have received your recent screening report (${scanContext.prediction} - ${Math.round(
            scanContext.confidence * 100
          )}% confidence). How can I assist you with your foot care today?`
        : 'Hello! I am Paathasuvadu, your virtual healthcare assistant. You can speak or type in English, Tamil, or Tanglish to ask about diabetic foot care, daily routine, or warning signs.';

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'nurse',
        textEn: initialGreeting,
        textTa: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [language, scanContext]);

  // Scroll to bottom on messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, nurseState]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  // Web Speech Recognition Setup for Microphone Voice Input
  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setNurseState('idle');
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert(
          language === 'ta'
            ? 'இந்த உலாவி குரல் அங்கீகாரத்தை ஆதரிக்கவில்லை. தயவுசெய்து Chrome பயன்படுத்தவும்.'
            : 'Speech recognition is not supported in this browser. Please type your message.'
        );
        return;
      }

      // Prime browser mic permission immediately before SpeechRecognition starts
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStream.getTracks().forEach(t => t.stop()); // stop immediately, just needed for permission grant
      } catch {
        // Permission denied — SpeechRecognition will also fail, but let it show its own error
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setNurseState('listening');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
        if (event.results[event.results.length - 1].isFinal) {
          handleSendMessage(transcript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (nurseState === 'listening') setNurseState('idle');
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
        setNurseState('idle');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setIsListening(false);
      setNurseState('idle');
    }
  };

  // Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    stopCurrentAudio();

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      textEn: text,
      textTa: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setNurseState('thinking');

    try {
      const res = await sendChatMessage(text, language, scanContext || undefined, messages);
      const replyText = res.reply || (language === 'ta' ? 'வணக்கம்! நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?' : 'How can I assist you with your foot care today?');

      const nurseMessage: ChatMessage = {
        id: `msg-${Date.now()}-nurse`,
        sender: 'nurse',
        textEn: replyText,
        textTa: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, nurseMessage]);

      if (autoVoiceReply) {
        speakResponse(replyText);
      } else {
        setNurseState('idle');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setNurseState('idle');
    }
  };

  // Speak AI Response
  const speakResponse = async (text: string) => {
    setNurseState('speaking');
    setIsAudioPlaying(true);

    try {
      const voiceRes = await getVoiceSpeech(text, language);

      if (voiceRes.audioBase64) {
        await playPCMBase64(
          voiceRes.audioBase64,
          24000,
          () => {
            setNurseState('speaking');
            setIsAudioPlaying(true);
          },
          () => {
            setNurseState('idle');
            setIsAudioPlaying(false);
          }
        );
      } else {
        speakWithBrowserSynthesis(
          text,
          language,
          () => {
            setNurseState('speaking');
            setIsAudioPlaying(true);
          },
          () => {
            setNurseState('idle');
            setIsAudioPlaying(false);
          }
        );
      }
    } catch (err) {
      console.error('Voice playback error:', err);
      speakWithBrowserSynthesis(
        text,
        language,
        () => {
          setNurseState('speaking');
          setIsAudioPlaying(true);
        },
        () => {
          setNurseState('idle');
          setIsAudioPlaying(false);
        }
      );
    }
  };

  const handleReplayVoice = (text: string) => {
    speakResponse(text);
  };

  const handleStopVoice = () => {
    stopCurrentAudio();
    setIsAudioPlaying(false);
    setNurseState('idle');
  };

  // Quick suggestion chips
  const quickPromptsEn = [
    'What should I do after my screening result?',
    'How should I check between my toes properly?',
    'What Tamil food is best for diabetes control?',
    'When should I immediately consult a doctor?',
  ];

  const quickPromptsTa = [
    'என் பரிசோதனை முடிவுக்கு பிறகு நான் என்ன செய்ய வேண்டும்?',
    'கால் விரல் இடுக்குகளை எப்படி சரியாக பரிசோதிப்பது?',
    'சர்க்கரை கட்டுப்பாட்டிற்கு சிறந்த தமிழ்நாட்டு உணவுகள் என்ன?',
    'எப்போது உடனடியாக மருத்துவரை அணுக வேண்டும்?',
  ];

  const prompts = language === 'ta' ? quickPromptsTa : quickPromptsEn;

  return (
    <div id="paathasuvadu-nurse-section" className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header Info */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Bot className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'குரல் வழி AI மெய்நிகர் செவிலியர்' : 'Interactive Voice-to-Voice Virtual Nurse'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.nurseTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          {t.nurseSubtitle}
        </p>
      </div>

      {/* Active Scan Context Banner if User Completed Scan */}
      {scanContext && (
        <div
          id="nurse-scan-context-banner"
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-xs ${
            scanContext.prediction === 'NORMAL'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>{language === 'ta' ? 'இணைக்கப்பட்ட பரிசோதனை:' : 'Linked Screening Result:'}</strong>{' '}
              {scanContext.prediction} ({Math.round(scanContext.confidence * 100)}% confidence)
            </span>
          </div>
          {onClearScanContext && (
            <button
              onClick={onClearScanContext}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer"
            >
              {language === 'ta' ? 'அகற்று' : 'Clear'}
            </button>
          )}
        </div>
      )}

      {/* Main Glass Card Container */}
      <div className="rounded-3xl backdrop-blur-xl bg-white/90 border border-teal-100 shadow-xl shadow-teal-950/5 overflow-hidden flex flex-col md:flex-row min-h-[580px]">
        {/* Left Side: 3D Animated Nurse Avatar & Voice Controls */}
        <div className="md:w-80 bg-gradient-to-b from-teal-50/80 via-emerald-50/50 to-white p-6 border-b md:border-b-0 md:border-r border-teal-100 flex flex-col items-center justify-between text-center">
          <div className="w-full space-y-3">
            {/* 3D WebGL Healthcare Nurse Assistant */}
            <NurseAvatar3D state={nurseState} isAudioPlaying={isAudioPlaying} />

            <div className="pt-2">
              <h3 className="text-base font-extrabold text-slate-900">Nurse Paathasuvadu (3D AI)</h3>
              <p className="text-xs text-teal-700 font-medium">
                {language === 'ta' ? 'நீரிழிவு பாத நல்வாழ்வு உதவியாளர்' : 'Diabetic Foot Healthcare Specialist'}
              </p>
            </div>

            {/* Speaking State Equalizer Wave */}
            {(nurseState === 'speaking' || isAudioPlaying) && (
              <div className="flex items-center justify-center space-x-1.5 py-1">
                {[35, 75, 100, 65, 90, 45, 95, 55, 80].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-teal-600 to-emerald-400 rounded-full animate-pulse"
                    style={{ height: `${h}%`, minHeight: '10px', animationDuration: `${0.25 + (i % 3) * 0.12}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Voice Toggle Controls */}
          <div className="w-full pt-4 space-y-2">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">
                {language === 'ta' ? 'குரல் பதில்' : 'Spoken Voice Response'}
              </span>
              <button
                type="button"
                onClick={() => setAutoVoiceReply(!autoVoiceReply)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  autoVoiceReply ? 'bg-teal-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    autoVoiceReply ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isAudioPlaying && (
              <button
                type="button"
                onClick={handleStopVoice}
                className="w-full py-2 rounded-xl bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <VolumeX className="w-4 h-4" />
                <span>{language === 'ta' ? 'பேச்சை நிறுத்து' : 'Stop Audio'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Dialogue Conversation Log & Input */}
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 bg-slate-50/40">
          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[380px] pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                    msg.sender === 'user' ? 'bg-slate-800' : 'bg-teal-600'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{language === 'ta' ? msg.textTa || msg.textEn : msg.textEn}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'nurse' && (
                      <button
                        type="button"
                        onClick={() => handleReplayVoice(msg.textTa || msg.textEn)}
                        className="text-teal-600 hover:text-teal-800 flex items-center space-x-0.5 cursor-pointer font-medium"
                        title="Replay Voice"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/60 text-slate-700 text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box with Microphone & Send Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="pt-2 flex items-center gap-2"
          >
            {/* Microphone Button (True Voice Input) */}
            <button
              id="nurse-mic-btn"
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl text-white font-bold transition-all shadow-md cursor-pointer ${
                isListening
                  ? 'bg-rose-500 hover:bg-rose-600 animate-pulse shadow-rose-500/30 scale-105'
                  : 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/20'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak to Nurse'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <input
              id="nurse-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? t.voiceInputListening : t.typeYourQuestion}
              className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 shadow-xs"
            />

            {/* Send Button */}
            <button
              id="nurse-send-btn"
              type="submit"
              disabled={!inputText.trim() || nurseState === 'thinking'}
              className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold shadow-md transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
