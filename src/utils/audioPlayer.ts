// Audio playback and speech synthesis helper

let currentAudioCtx: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;

export function stopCurrentAudio() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch {
      // ignore
    }
    currentSourceNode = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function playPCMBase64(
  base64Data: string,
  sampleRate: number = 24000,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  stopCurrentAudio();

  try {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    if (!currentAudioCtx || currentAudioCtx.state === 'closed') {
      currentAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: sampleRate,
      });
    }

    if (currentAudioCtx.state === 'suspended') {
      await currentAudioCtx.resume();
    }

    const audioBuffer = currentAudioCtx.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = currentAudioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(currentAudioCtx.destination);
    currentSourceNode = source;

    source.onended = () => {
      currentSourceNode = null;
      if (onEnd) onEnd();
    };

    if (onStart) onStart();
    source.start(0);
  } catch (err) {
    console.error('Error playing PCM audio:', err);
    if (onEnd) onEnd();
  }
}

export function speakWithBrowserSynthesis(
  text: string,
  lang: 'en' | 'ta' = 'en',
  onStart?: () => void,
  onEnd?: () => void
): void {
  stopCurrentAudio();

  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser.');
    if (onEnd) onEnd();
    return;
  }

  // Clean markdown formatting before speaking
  const cleanText = text
    .replace(/[#*`_~\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
  utterance.rate = lang === 'ta' ? 0.92 : 0.98;
  utterance.pitch = 1.05;

  const voices = window.speechSynthesis.getVoices();
  const targetVoice = voices.find((v) =>
    lang === 'ta'
      ? v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil')
      : v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
  );

  if (targetVoice) {
    utterance.voice = targetVoice;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}
