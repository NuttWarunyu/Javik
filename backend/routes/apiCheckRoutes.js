// API health check routes - test each API individually
const express = require('express');
const router = express.Router();
const axios = require('axios');
const OpenAI = require('openai');

/**
 * GET /api/check/all
 * Check all API statuses
 */
router.get('/all', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    apis: {},
  };

  // Check OpenAI (Script Generation)
  results.apis.openai = await checkOpenAI();
  
  // Check Voice Services
  results.apis.elevenlabs = await checkElevenLabs();
  results.apis.openaiTTS = await checkOpenAITTS();
  results.apis.googleTTS = await checkGoogleTTS();
  
  // Check Image Services
  results.apis.unsplash = await checkUnsplash();
  results.apis.pexels = await checkPexels();

  // Summary
  const allStatuses = Object.values(results.apis).map(api => api.status);
  results.summary = {
    total: Object.keys(results.apis).length,
    working: allStatuses.filter(s => s === 'working').length,
    error: allStatuses.filter(s => s === 'error').length,
    notConfigured: allStatuses.filter(s => s === 'not_configured').length,
  };

  res.json(results);
});

/**
 * GET /api/check/openai
 * Check OpenAI API (script generation)
 */
router.get('/openai', async (req, res) => {
  const result = await checkOpenAI();
  res.json(result);
});

/**
 * GET /api/check/elevenlabs
 * Check ElevenLabs API
 */
router.get('/elevenlabs', async (req, res) => {
  const result = await checkElevenLabs();
  res.json(result);
});

/**
 * GET /api/check/openai-tts
 * Check OpenAI TTS API
 */
router.get('/openai-tts', async (req, res) => {
  const result = await checkOpenAITTS();
  res.json(result);
});

/**
 * GET /api/check/google-tts
 * Check Google Cloud TTS API
 */
router.get('/google-tts', async (req, res) => {
  const result = await checkGoogleTTS();
  res.json(result);
});

/**
 * GET /api/check/unsplash
 * Check Unsplash API
 */
router.get('/unsplash', async (req, res) => {
  const result = await checkUnsplash();
  res.json(result);
});

/**
 * GET /api/check/pexels
 * Check Pexels API
 */
router.get('/pexels', async (req, res) => {
  const result = await checkPexels();
  res.json(result);
});

// Helper functions

async function checkOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      status: 'not_configured',
      service: 'OpenAI (Script Generation)',
      message: 'OPENAI_API_KEY not found in environment variables',
      configured: false,
    };
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 5,
    });

    return {
      status: 'working',
      service: 'OpenAI (Script Generation)',
      message: 'API key is valid and working',
      configured: true,
      model: 'gpt-4-turbo-preview',
    };
  } catch (error) {
    return {
      status: 'error',
      service: 'OpenAI (Script Generation)',
      message: error.response?.data?.error?.message || error.message,
      configured: true,
      errorCode: error.response?.status,
      details: error.response?.data?.error || null,
    };
  }
}

async function checkElevenLabs() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    return {
      status: 'not_configured',
      service: 'ElevenLabs',
      message: 'ELEVENLABS_API_KEY not found in environment variables',
      configured: false,
    };
  }

  try {
    // Test API by getting voices list
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
      timeout: 5000,
    });

    return {
      status: 'working',
      service: 'ElevenLabs',
      message: 'API key is valid and working',
      configured: true,
      voicesAvailable: response.data?.voices?.length || 0,
    };
  } catch (error) {
    let errorMessage = error.message;
    let errorDetails = null;

    if (error.response?.data) {
      try {
        const errorData = Buffer.isBuffer(error.response.data)
          ? JSON.parse(error.response.data.toString())
          : error.response.data;
        
        if (errorData.detail?.status) {
          errorMessage = `ElevenLabs API Error: ${errorData.detail.status}`;
          errorDetails = errorData.detail;
        } else if (errorData.detail?.message) {
          errorMessage = `ElevenLabs API Error: ${errorData.detail.message}`;
          errorDetails = errorData.detail;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    return {
      status: 'error',
      service: 'ElevenLabs',
      message: errorMessage,
      configured: true,
      errorCode: error.response?.status,
      details: errorDetails,
    };
  }
}

async function checkOpenAITTS() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      status: 'not_configured',
      service: 'OpenAI TTS',
      message: 'OPENAI_API_KEY not found (uses same key as script generation)',
      configured: false,
    };
  }

  try {
    // Test TTS API with minimal request
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        input: 'Test',
        voice: 'nova',
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 5000,
      }
    );

    return {
      status: 'working',
      service: 'OpenAI TTS',
      message: 'API key is valid and working',
      configured: true,
      model: 'tts-1',
    };
  } catch (error) {
    return {
      status: 'error',
      service: 'OpenAI TTS',
      message: error.response?.data?.error?.message || error.message,
      configured: true,
      errorCode: error.response?.status,
      details: error.response?.data?.error || null,
    };
  }
}

async function checkGoogleTTS() {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_KEY;
  
  if (!apiKey) {
    return {
      status: 'not_configured',
      service: 'Google Cloud TTS',
      message: 'GOOGLE_CLOUD_TTS_KEY not found in environment variables',
      configured: false,
    };
  }

  try {
    // Test Google TTS API
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const response = await axios.post(
      url,
      {
        input: { text: 'Test' },
        voice: {
          languageCode: 'en-US',
          ssmlGender: 'NEUTRAL',
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      },
      {
        timeout: 5000,
      }
    );

    return {
      status: 'working',
      service: 'Google Cloud TTS',
      message: 'API key is valid and working',
      configured: true,
    };
  } catch (error) {
    return {
      status: 'error',
      service: 'Google Cloud TTS',
      message: error.response?.data?.error?.message || error.message,
      configured: true,
      errorCode: error.response?.status,
      details: error.response?.data?.error || null,
    };
  }
}

async function checkUnsplash() {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!accessKey) {
    return {
      status: 'not_configured',
      service: 'Unsplash',
      message: 'UNSPLASH_ACCESS_KEY not found in environment variables',
      configured: false,
    };
  }

  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: 'test',
        per_page: 1,
      },
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
      timeout: 5000,
    });

    return {
      status: 'working',
      service: 'Unsplash',
      message: 'API key is valid and working',
      configured: true,
      resultsFound: response.data?.results?.length || 0,
    };
  } catch (error) {
    return {
      status: 'error',
      service: 'Unsplash',
      message: error.response?.data?.errors?.[0] || error.message,
      configured: true,
      errorCode: error.response?.status,
      details: error.response?.data || null,
    };
  }
}

async function checkPexels() {
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    return {
      status: 'not_configured',
      service: 'Pexels',
      message: 'PEXELS_API_KEY not found in environment variables',
      configured: false,
    };
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query: 'test',
        per_page: 1,
      },
      headers: {
        Authorization: apiKey,
      },
      timeout: 5000,
    });

    return {
      status: 'working',
      service: 'Pexels',
      message: 'API key is valid and working',
      configured: true,
      resultsFound: response.data?.photos?.length || 0,
    };
  } catch (error) {
    return {
      status: 'error',
      service: 'Pexels',
      message: error.response?.data || error.message,
      configured: true,
      errorCode: error.response?.status,
      details: error.response?.data || null,
    };
  }
}

module.exports = router;

