import React from 'react';

export type NurseState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface NurseAvatarSvgProps {
  state: NurseState;
  isAudioPlaying?: boolean;
}

export const NurseAvatarSvg: React.FC<NurseAvatarSvgProps> = ({ state, isAudioPlaying }) => {
  return (
    <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center select-none">
      {/* Background Aura Glows */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ${
          state === 'listening'
            ? 'bg-amber-400/30 scale-110 animate-pulse'
            : state === 'thinking'
            ? 'bg-purple-500/25 scale-105 animate-pulse'
            : state === 'speaking' || isAudioPlaying
            ? 'bg-teal-400/40 scale-115 animate-pulse'
            : 'bg-emerald-400/20 scale-95'
        }`}
      />

      {/* Main Avatar Container */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full relative z-10 drop-shadow-xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft Circular Backdrop */}
        <circle cx="100" cy="100" r="88" fill="#F0FDF4" stroke="#A7F3D0" strokeWidth="3" />

        {/* Shoulders & Nurse Uniform */}
        <g className={state === 'idle' ? 'animate-pulse' : ''} style={{ animationDuration: '4s' }}>
          {/* Scrub Coat */}
          <path
            d="M40 180 C40 145, 70 135, 100 135 C130 135, 160 145, 160 180 Z"
            fill="#0D9488"
          />
          {/* Inner Collar & Stethoscope */}
          <path d="M85 135 L100 155 L115 135 Z" fill="#F8FAFC" />
          <path
            d="M75 140 C75 170, 125 170, 125 140"
            stroke="#334155"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="100" cy="168" r="5" fill="#94A3B8" stroke="#1E293B" strokeWidth="2" />
        </g>

        {/* Neck */}
        <rect x="88" y="112" width="24" height="26" rx="6" fill="#FBD5B5" />

        {/* Head */}
        <ellipse cx="100" cy="85" rx="34" ry="38" fill="#FDE2C7" />

        {/* Nurse Cap */}
        <path
          d="M68 62 C72 42, 128 42, 132 62 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="2"
        />
        <rect x="66" y="58" width="68" height="8" rx="4" fill="#FFFFFF" />
        {/* Red Medical Cross on Cap */}
        <rect x="97" y="47" width="6" height="14" rx="1.5" fill="#EF4444" />
        <rect x="93" y="51" width="14" height="6" rx="1.5" fill="#EF4444" />

        {/* Hair Framing */}
        <path
          d="M66 75 C65 52, 135 52, 134 75 C134 85, 128 92, 126 95 C124 75, 115 68, 100 68 C85 68, 76 75, 74 95 C72 92, 66 85, 66 75 Z"
          fill="#332724"
        />

        {/* Eyes & Eyebrows */}
        <g>
          {/* Eyebrows */}
          <path
            d="M78 72 Q86 69 92 72"
            stroke="#291F1D"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className={state === 'thinking' ? 'animate-bounce' : ''}
          />
          <path
            d="M108 72 Q114 69 122 72"
            stroke="#291F1D"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Eyes */}
          <ellipse cx="85" cy="81" rx="4" ry={state === 'idle' ? 4 : 4.5} fill="#1E293B" />
          <circle cx="86.5" cy="79.5" r="1.5" fill="#FFFFFF" />

          <ellipse cx="115" cy="81" rx="4" ry={state === 'idle' ? 4 : 4.5} fill="#1E293B" />
          <circle cx="116.5" cy="79.5" r="1.5" fill="#FFFFFF" />

          {/* Cheerful Blush */}
          <ellipse cx="76" cy="90" rx="4" ry="2" fill="#FDA4AF" opacity="0.6" />
          <ellipse cx="124" cy="90" rx="4" ry="2" fill="#FDA4AF" opacity="0.6" />
        </g>

        {/* Nose */}
        <path d="M99 84 Q100 90 97 91" stroke="#E29D76" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Animated Mouth */}
        <g>
          {state === 'speaking' || isAudioPlaying ? (
            /* Speaking Mouth - Sync Animation */
            <ellipse
              cx="100"
              cy="99"
              rx="6"
              ry="4"
              fill="#BE123C"
              className="animate-pulse"
              style={{ animationDuration: '0.25s' }}
            />
          ) : state === 'listening' ? (
            /* Listening attentive smile */
            <path
              d="M93 98 Q100 105 107 98"
              stroke="#BE123C"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          ) : state === 'thinking' ? (
            /* Pondering slight curve */
            <path
              d="M95 100 Q100 98 105 99"
              stroke="#BE123C"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            /* Gentle warm idle smile */
            <path
              d="M93 98 Q100 104 107 98"
              stroke="#BE123C"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>
      </svg>

      {/* Floating State Badge */}
      <div className="absolute -bottom-2 px-3 py-1 rounded-full text-[11px] font-bold shadow-md uppercase tracking-wider backdrop-blur-md border z-20 flex items-center space-x-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            state === 'listening'
              ? 'bg-amber-500 animate-ping'
              : state === 'thinking'
              ? 'bg-purple-500 animate-spin'
              : state === 'speaking' || isAudioPlaying
              ? 'bg-teal-500 animate-bounce'
              : 'bg-emerald-500'
          }`}
        />
        <span
          className={
            state === 'listening'
              ? 'text-amber-800 bg-amber-100/90 border-amber-300'
              : state === 'thinking'
              ? 'text-purple-800 bg-purple-100/90 border-purple-300'
              : state === 'speaking' || isAudioPlaying
              ? 'text-teal-800 bg-teal-100/90 border-teal-300'
              : 'text-emerald-800 bg-emerald-100/90 border-emerald-300'
          }
        >
          {state === 'listening'
            ? 'Listening...'
            : state === 'thinking'
            ? 'Thinking...'
            : state === 'speaking' || isAudioPlaying
            ? 'Speaking...'
            : 'Online'}
        </span>
      </div>
    </div>
  );
};
