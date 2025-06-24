/**
 * Service for voice synthesis and recognition
 */
export const voiceService = {
  /**
   * Synthesize speech from text using ElevenLabs
   */
  synthesizeSpeech: async (
    text: string, 
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<string> => {
    try {
      // Get API key from environment
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || 'mock_api_key';
      
      // If no API key or in dev mode, use browser's speech synthesis API
      if (!apiKey || apiKey === 'mock_api_key' || import.meta.env.DEV) {
        console.log('🎙️ Using browser speech synthesis fallback');
        return synthesizeWithBrowser(text);
      }
      
      // Use the provided voiceId or a default one
      const voice = voiceId || import.meta.env.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
      
      // Set default options
      const defaultOptions = {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.0,
        speakerBoost: true,
        ...options
      };
      
      // Prepare the request body
      const requestBody = {
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: defaultOptions.stability,
          similarity_boost: defaultOptions.similarityBoost,
          style: defaultOptions.style,
          use_speaker_boost: defaultOptions.speakerBoost
        }
      };
      
      // Make the API request
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }
      
      // Get the audio data as a blob
      const audioBlob = await response.blob();
      
      // Convert the blob to a base64 data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      return synthesizeWithBrowser(text);
    }
  },
  
  /**
   * Recognize speech from audio
   */
  recognizeSpeech: async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Check if browser supports speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }
      
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        console.log('Speech recognized:', speechResult);
        resolve(speechResult);
      };
      
      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
      
      recognition.start();
    });
  },
  
  /**
   * Check if browser supports speech synthesis
   */
  isSpeechSynthesisSupported: (): boolean => {
    return 'speechSynthesis' in window;
  },
  
  /**
   * Check if browser supports speech recognition
   */
  isSpeechRecognitionSupported: (): boolean => {
    return !!(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );
  }
};

/**
 * Synthesize speech using the browser's built-in Web Speech API
 */
function synthesizeWithBrowser(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported in this browser'));
      return;
    }
    
    // Create a new audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const destination = audioContext.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(destination.stream);
    const chunks: BlobPart[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const reader = new FileReader();
      
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Create a speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a good voice (preferably female)
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(voice => voice.lang.includes('en-'));
    
    if (englishVoices.length > 0) {
      // Try to find a female voice first
      const femaleVoice = englishVoices.find(voice => voice.name.includes('female') || voice.name.includes('Female'));
      utterance.voice = femaleVoice || englishVoices[0];
    }
    
    // Set utterance properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // When speech is done, stop recording
    utterance.onend = () => {
      mediaRecorder.stop();
      audioContext.close();
    };
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
    
    // Fallback in case onend doesn't fire
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        audioContext.close();
      }
    }, text.length * 100); // Estimate speech duration based on text length
  });
}