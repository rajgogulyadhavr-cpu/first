# 08. Paathasuvadu Chatbot — FootGuard AI

## Overview
Paathasuvadu is a bilingual (English, Tamil, Tanglish) virtual healthcare assistant specializing in diabetic foot care and daily hygiene.

## Core Capabilities
- **Gemini 3.6 Flash Integration**: Operates server-side via `POST /api/chat`.
- **Predefined Suggestion Chips**: 4 English & 4 Tamil quick prompts for single-click queries.
- **Voice Output (TTS)**: Gemini TTS (`gemini-2.5-flash-preview-tts`) generates PCM audio playback with browser Web Speech API fallback.
- **Voice Input (STT)**: Web Speech API listens to user microphone input in English (`en-US`) or Tamil (`ta-IN`).
- **Context Awareness**: Incorporates recent screening results into chatbot responses if available.

## Handled Predefined Questions
1. "What should I do after my screening result?" / "என் பரிசோதனை முடிவுக்கு பிறகு நான் என்ன செய்ய வேண்டும்?"
2. "How should I check between my toes properly?" / "கால் விரல் இடுக்குகளை எப்படி சரியாக பரிசோதிப்பது?"
3. "What Tamil food is best for diabetes control?" / "சர்க்கரை கட்டுப்பாட்டிற்கு சிறந்த தமிழ்நாட்டு உணவுகள் என்ன?"
4. "When should I immediately consult a doctor?" / "எப்போது உடனடியாக மருத்துவரை அணுக வேண்டும்?"
