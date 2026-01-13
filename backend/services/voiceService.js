// Voice generation service using ElevenLabs or Google TTS
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
    throw new Error(`Failed to generate voice with ElevenLabs: ${error.message}`);
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
 * @param {string} text - Text to convert to speech
 * @returns {Promise<string>} Path to generated audio file
 */
async function generateVoice(text) {
  // Prefer ElevenLabs if available
  if (process.env.ELEVENLABS_API_KEY) {
    return generateWithElevenLabs(text);
  }
  
  // Fallback to Google TTS
  if (process.env.GOOGLE_CLOUD_TTS_KEY) {
    return generateWithGoogleTTS(text);
  }

  throw new Error('No voice service API key found. Please set ELEVENLABS_API_KEY or GOOGLE_CLOUD_TTS_KEY');
}

module.exports = {
  generateVoice,
  generateWithElevenLabs,
  generateWithGoogleTTS,
};

