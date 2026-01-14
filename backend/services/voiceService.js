// Voice generation service using ElevenLabs, OpenAI TTS, or Google TTS
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const OUTPUT_DIR = path.join(__dirname, '../../output/temp');

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

/**
 * Generate voice using ElevenLabs
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - ElevenLabs voice ID (default: '21m00Tcm4TlvDq8ikWAM')
 * @returns {Promise<string>} Path to generated audio file
 */
async function generateWithElevenLabs(text, voiceId = '21m00Tcm4TlvDq8ikWAM') {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not found in environment variables');
  }

  await ensureOutputDir();
  const outputPath = path.join(OUTPUT_DIR, `voice_${Date.now()}.mp3`);

  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        responseType: 'arraybuffer',
      }
    );

    await fs.writeFile(outputPath, response.data);
    return outputPath;
  } catch (error) {
    console.error('ElevenLabs error:', error.response?.data || error.message);
    
    // Parse error details
    let errorMessage = error.message;
    if (error.response?.status === 401) {
      errorMessage = 'ElevenLabs API Key is invalid or expired. Please check your ELEVENLABS_API_KEY in Railway environment variables.';
    } else if (error.response?.status === 429) {
      errorMessage = 'ElevenLabs API rate limit exceeded. Please try again later.';
    } else if (error.response?.data) {
      try {
        const errorData = Buffer.isBuffer(error.response.data) 
          ? JSON.parse(error.response.data.toString())
          : error.response.data;
        if (errorData.detail?.status) {
          const status = errorData.detail.status;
          if (status === 'missing_permissions') {
            errorMessage = 'ElevenLabs API Key missing permissions. Please create a new API key with proper permissions.';
          } else if (status === 'detected_unusual_activity') {
            errorMessage = 'ElevenLabs detected unusual activity. Please wait a few minutes and try again, or use OpenAI TTS instead.';
          } else {
            errorMessage = `ElevenLabs API Error: ${status}`;
          }
        } else if (errorData.detail?.message) {
          errorMessage = `ElevenLabs API Error: ${errorData.detail.message}`;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    throw new Error(`Failed to generate voice with ElevenLabs: ${errorMessage}`);
  }
}

/**
 * Generate voice using OpenAI TTS
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice ID: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer' (default: 'nova')
 * @param {string} model - Model: 'tts-1' (fast) or 'tts-1-hd' (high quality, default)
 * @returns {Promise<string>} Path to generated audio file
 */
async function generateWithOpenAITTS(text, voice = 'nova', model = 'tts-1-hd') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in environment variables');
  }

  await ensureOutputDir();
  const outputPath = path.join(OUTPUT_DIR, `voice_${Date.now()}.mp3`);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: model, // 'tts-1' or 'tts-1-hd'
        input: text,
        voice: voice, // 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    await fs.writeFile(outputPath, response.data);
    return outputPath;
  } catch (error) {
    console.error('OpenAI TTS error:', error.response?.data || error.message);
    
    // Parse error details
    let errorMessage = error.message;
    if (error.response?.status === 401) {
      errorMessage = 'OpenAI API Key is invalid or expired. Please check your OPENAI_API_KEY in Railway environment variables.';
    } else if (error.response?.status === 429) {
      errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
    } else if (error.response?.data) {
      try {
        const errorData = typeof error.response.data === 'string'
          ? JSON.parse(error.response.data)
          : error.response.data;
        if (errorData.error?.message) {
          errorMessage = `OpenAI TTS Error: ${errorData.error.message}`;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    throw new Error(`Failed to generate voice with OpenAI TTS: ${errorMessage}`);
  }
}

/**
 * Generate voice using Google Cloud TTS
 * @param {string} text - Text to convert to speech
 * @param {string} languageCode - Language code (default: 'th-TH')
 * @returns {Promise<string>} Path to generated audio file
 */
async function generateWithGoogleTTS(text, languageCode = 'th-TH') {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_TTS_KEY not found in environment variables');
  }

  await ensureOutputDir();
  const outputPath = path.join(OUTPUT_DIR, `voice_${Date.now()}.mp3`);

  try {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const response = await axios.post(
      url,
      {
        input: { text },
        voice: {
          languageCode,
          ssmlGender: 'NEUTRAL',
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      }
    );

    const audioContent = Buffer.from(response.data.audioContent, 'base64');
    await fs.writeFile(outputPath, audioContent);
    return outputPath;
  } catch (error) {
    console.error('Google TTS error:', error.response?.data || error.message);
    throw new Error(`Failed to generate voice with Google TTS: ${error.message}`);
  }
}

/**
 * Generate voice (auto-select service)
 * Priority: ElevenLabs > OpenAI TTS > Google TTS
 * @param {string} text - Text to convert to speech
 * @returns {Promise<string>} Path to generated audio file
 */
async function generateVoice(text) {
  // Priority 1: ElevenLabs (best quality, multilingual)
  if (process.env.ELEVENLABS_API_KEY) {
    return generateWithElevenLabs(text);
  }
  
  // Priority 2: OpenAI TTS (good quality, English optimized)
  if (process.env.OPENAI_API_KEY) {
    return generateWithOpenAITTS(text);
  }
  
  // Priority 3: Google TTS (fallback)
  if (process.env.GOOGLE_CLOUD_TTS_KEY) {
    return generateWithGoogleTTS(text);
  }

  throw new Error('No voice service API key found. Please set ELEVENLABS_API_KEY, OPENAI_API_KEY, or GOOGLE_CLOUD_TTS_KEY');
}

module.exports = {
  generateVoice,
  generateWithElevenLabs,
  generateWithOpenAITTS,
  generateWithGoogleTTS,
};

