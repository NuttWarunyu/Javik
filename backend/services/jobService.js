// Job management service for async video processing
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

// In-memory job store (in production, use Redis or database)
const jobs = new Map();

/**
 * Create a new job
 * @param {string} topic - Video topic
 * @param {number} duration - Video duration
 * @param {string} mode - Job mode: 'draft' (default), 'final', 'replace-voice', 'pip', 'batch'
 * @param {Object} options - Additional options for specific modes
 * @returns {string} Job ID
 */
function createJob(topic, duration, mode = 'draft', options = {}) {
  const jobId = crypto.randomBytes(16).toString('hex');
  const job = {
    id: jobId,
    topic,
    duration,
    mode, // 'draft', 'final', 'replace-voice', 'pip', 'batch'
    options, // Mode-specific options
    status: 'pending',
    progress: 'กำลังสร้างสคริปต์...',
    logs: [], // Array of log entries
    createdAt: new Date(),
    updatedAt: new Date(),
    result: null,
    error: null,
  };
  
  jobs.set(jobId, job);
  return jobId;
}

/**
 * Add log entry to job
 * @param {string} jobId - Job ID
 * @param {string} message - Log message
 * @param {string} type - Log type: 'info', 'success', 'error', 'warning'
 */
function addLog(jobId, message, type = 'info') {
  const job = jobs.get(jobId);
  if (!job) return;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    type,
  };

  job.logs.push(logEntry);
  // Keep only last 100 logs
  if (job.logs.length > 100) {
    job.logs.shift();
  }
  
  job.updatedAt = new Date();
  jobs.set(jobId, job);
}

/**
 * Get job by ID
 * @param {string} jobId - Job ID
 * @returns {Object|null} Job object
 */
function getJob(jobId) {
  return jobs.get(jobId) || null;
}

/**
 * Update job status
 * @param {string} jobId - Job ID
 * @param {string} status - New status
 * @param {string} progress - Progress message
 * @param {Object} result - Result data
 * @param {string} error - Error message
 */
function updateJob(jobId, { status, progress, result, error }) {
  const job = jobs.get(jobId);
  if (!job) return;

  if (status) job.status = status;
  if (progress !== undefined) job.progress = progress;
  if (result) job.result = result;
  if (error) job.error = error;
  
  job.updatedAt = new Date();
  jobs.set(jobId, job);
}

/**
 * Process video creation job
 * @param {string} jobId - Job ID
 */
async function processJob(jobId) {
  const job = getJob(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  try {
    updateJob(jobId, { status: 'processing', progress: 'กำลังสร้างสคริปต์...' });
    addLog(jobId, `[SYSTEM] Initializing video generation for topic: "${job.topic}"`, 'info');

    const contentService = require('./contentService');
    const voiceService = require('./voiceService');
    const imageService = require('./imageService');
    const kenBurnsService = require('./kenBurnsService');
    const editorService = require('./editorService');

    // Step 1: Generate script
    updateJob(jobId, { progress: 'กำลังสร้างสคริปต์...' });
    addLog(jobId, '[STEP 1/5] Connecting to OpenAI API...', 'info');
    addLog(jobId, '[STEP 1/5] Generating script with GPT-4 Turbo...', 'info');
    const scriptData = await contentService.generateScript(job.topic, job.duration);
    addLog(jobId, `[STEP 1/5] ✓ Script generated successfully (${scriptData.script.length} characters)`, 'success');
    addLog(jobId, `[STEP 1/5] Keywords extracted: ${scriptData.keywords.join(', ')}`, 'info');

    // Step 2: Generate voice (skip if no API key)
    let audioPath = null;
    const hasVoiceService = process.env.ELEVENLABS_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_CLOUD_TTS_KEY;
    
    if (hasVoiceService) {
      updateJob(jobId, { progress: 'กำลังสร้างเสียงพูด...' });
      // Detect which service will be used
      let serviceName = 'Voice Service';
      if (process.env.ELEVENLABS_API_KEY) {
        serviceName = 'ElevenLabs';
      } else if (process.env.OPENAI_API_KEY) {
        serviceName = 'OpenAI TTS';
      } else if (process.env.GOOGLE_CLOUD_TTS_KEY) {
        serviceName = 'Google Cloud TTS';
      }
      addLog(jobId, `[STEP 2/5] Connecting to ${serviceName} API...`, 'info');
      addLog(jobId, '[STEP 2/5] Generating AI voice...', 'info');
      try {
        audioPath = await voiceService.generateVoice(scriptData.script);
        addLog(jobId, `[STEP 2/5] ✓ Voice generated successfully: ${path.basename(audioPath)}`, 'success');
      } catch (voiceError) {
        addLog(jobId, `[STEP 2/5] ⚠ Voice generation skipped: ${voiceError.message}`, 'warning');
        addLog(jobId, '[STEP 2/5] Continuing with no-voice video...', 'info');
        audioPath = null;
      }
    } else {
      addLog(jobId, '[STEP 2/5] ⚠ No voice service API key found. Skipping voice generation...', 'warning');
      addLog(jobId, '[STEP 2/5] Creating no-voice video...', 'info');
    }

    // Step 3: Search and download images (with fallback)
    let imagePaths = [];
    updateJob(jobId, { progress: 'กำลังหารูปภาพ...' });
    addLog(jobId, '[STEP 3/5] Connecting to image API...', 'info');
    addLog(jobId, `[STEP 3/5] Searching images for keywords: ${scriptData.keywords.join(', ')}`, 'info');
    try {
      imagePaths = await imageService.searchAndDownloadImages(
        scriptData.keywords,
        2
      );
      addLog(jobId, `[STEP 3/5] ✓ Downloaded ${imagePaths.length} images`, 'success');
    } catch (imageError) {
      addLog(jobId, `[STEP 3/5] ⚠ Image search failed: ${imageError.message}`, 'warning');
      addLog(jobId, '[STEP 3/5] Attempting fallback: Using default placeholder images...', 'info');
      
      // Fallback: Try to use any available images or create placeholder
      try {
        // Try with fewer keywords or different approach
        if (scriptData.keywords.length > 0) {
          imagePaths = await imageService.searchAndDownloadImages(
            [scriptData.keywords[0]], // Try first keyword only
            2
          );
          addLog(jobId, `[STEP 3/5] ✓ Fallback: Downloaded ${imagePaths.length} images`, 'success');
        } else {
          throw new Error('No keywords available');
        }
      } catch (fallbackError) {
        addLog(jobId, `[STEP 3/5] ✗ Image fallback also failed: ${fallbackError.message}`, 'error');
        addLog(jobId, '[STEP 3/5] ⚠ Continuing with minimal images - user can add images manually later', 'warning');
        // Use empty array - Ken Burns service should handle this
        imagePaths = [];
      }
    }
    
    // If still no images, create a simple colored background video
    if (imagePaths.length === 0) {
      addLog(jobId, '[STEP 3/5] ⚠ No images available. Will create solid color background video.', 'warning');
    }

    // Step 4: Create Ken Burns video (with fallback)
    let videoPath;
    updateJob(jobId, { progress: 'กำลังสร้างเอฟเฟกต์ Ken Burns...' });
    addLog(jobId, '[STEP 4/5] Initializing FFmpeg...', 'info');
    addLog(jobId, '[STEP 4/5] Creating Ken Burns effects...', 'info');
    
    try {
      if (imagePaths.length === 0) {
        // Create solid color background video if no images
        addLog(jobId, '[STEP 4/5] Creating solid color background video (no images available)...', 'info');
        const solidColorPath = await kenBurnsService.createSolidColorVideo(job.duration);
        videoPath = solidColorPath;
        addLog(jobId, `[STEP 4/5] ✓ Solid color video created: ${path.basename(videoPath)}`, 'success');
      } else {
        videoPath = await kenBurnsService.createVideoFromImages(
          imagePaths,
          job.duration
        );
        addLog(jobId, `[STEP 4/5] ✓ Video created: ${path.basename(videoPath)}`, 'success');
      }
    } catch (kenBurnsError) {
      addLog(jobId, `[STEP 4/5] ⚠ Ken Burns effect failed: ${kenBurnsError.message}`, 'warning');
      addLog(jobId, '[STEP 4/5] Attempting fallback: Creating simple video...', 'info');
      
      try {
        // Fallback: Create simple video from first image or solid color
        if (imagePaths.length > 0) {
          videoPath = await kenBurnsService.createVideoFromImages(
            [imagePaths[0]], // Use only first image
            job.duration
          );
          addLog(jobId, `[STEP 4/5] ✓ Fallback video created: ${path.basename(videoPath)}`, 'success');
        } else {
          const solidColorPath = await kenBurnsService.createSolidColorVideo(job.duration);
          videoPath = solidColorPath;
          addLog(jobId, `[STEP 4/5] ✓ Solid color video created: ${path.basename(videoPath)}`, 'success');
        }
      } catch (fallbackError) {
        addLog(jobId, `[STEP 4/5] ✗ Video creation failed: ${fallbackError.message}`, 'error');
        throw new Error(`Failed to create video: ${fallbackError.message}. Please check FFmpeg installation and image availability.`);
      }
    }

    // Step 5: Create videos based on mode (with error handling)
    updateJob(jobId, { progress: 'กำลังรวมวิดีโอและเสียง...' });
    addLog(jobId, '[STEP 5/5] Combining audio and video...', 'info');
    addLog(jobId, '[STEP 5/5] Adding captions overlay...', 'info');
    const timestamp = Date.now();
    const baseFilename = `video_${timestamp}`;

    let result = {
      script: scriptData.script,
      hashtags: scriptData.hashtags,
      captions: scriptData.captions,
      warnings: [], // Track warnings
    };

    if (job.mode === 'draft') {
      // Create 3 versions: draft, no_voice, script
      // If no audio, create no-voice version only
      let draftVideos;
      try {
        if (audioPath) {
          draftVideos = await editorService.createDraftVideos(
            videoPath,
            audioPath,
            scriptData.captions,
            baseFilename
          );
        } else {
          // Create no-voice video only (skip audio)
          const NO_VOICE_DIR = path.join(__dirname, '../../output/no_voice');
          const SCRIPTS_DIR = path.join(__dirname, '../../output/scripts');
          await fs.mkdir(NO_VOICE_DIR, { recursive: true });
          await fs.mkdir(SCRIPTS_DIR, { recursive: true });
          
          const noVoiceFilename = `${baseFilename}_no_voice.mp4`;
          const noVoicePath = path.join(NO_VOICE_DIR, noVoiceFilename);
          
          // Create no-voice video with captions (will be created in OUTPUT_DIR first)
          const createdVideoPath = await editorService.addCaptionsOverlay(
            videoPath,
            scriptData.captions,
            noVoiceFilename
          );
          
          // Move to no_voice directory
          if (createdVideoPath !== noVoicePath) {
            await fs.rename(createdVideoPath, noVoicePath).catch(() => {
              return fs.copyFile(createdVideoPath, noVoicePath);
            });
          }
          
          // Create script file
          const scriptFilename = `${baseFilename}_script.txt`;
          const createdScriptPath = await editorService.createScriptWithTiming(
            scriptData.captions,
            scriptFilename
          );
          const finalScriptPath = path.join(SCRIPTS_DIR, scriptFilename);
          if (createdScriptPath !== finalScriptPath) {
            await fs.rename(createdScriptPath, finalScriptPath).catch(() => {
              return fs.copyFile(createdScriptPath, finalScriptPath);
            });
          }
          
          draftVideos = {
            draft: null, // No draft version without audio
            noVoice: noVoicePath,
            script: finalScriptPath,
          };
        }
      } catch (draftError) {
        addLog(jobId, `[STEP 5/5] ⚠ Draft video creation error: ${draftError.message}`, 'warning');
        addLog(jobId, '[STEP 5/5] Creating no-voice version only...', 'info');
        result.warnings.push(`Draft video creation failed: ${draftError.message}. Created no-voice version only.`);
        
        // Fallback: Create no-voice version only
        const NO_VOICE_DIR = path.join(__dirname, '../../output/no_voice');
        const SCRIPTS_DIR = path.join(__dirname, '../../output/scripts');
        await fs.mkdir(NO_VOICE_DIR, { recursive: true });
        await fs.mkdir(SCRIPTS_DIR, { recursive: true });
        
        const noVoiceFilename = `${baseFilename}_no_voice.mp4`;
        const noVoicePath = path.join(NO_VOICE_DIR, noVoiceFilename);
        
        const createdVideoPath = await editorService.addCaptionsOverlay(
          videoPath,
          scriptData.captions,
          noVoiceFilename
        );
        
        if (createdVideoPath !== noVoicePath) {
          await fs.rename(createdVideoPath, noVoicePath).catch(() => {
            return fs.copyFile(createdVideoPath, noVoicePath);
          });
        }
        
        const scriptFilename = `${baseFilename}_script.txt`;
        const createdScriptPath = await editorService.createScriptWithTiming(
          scriptData.captions,
          scriptFilename
        );
        const finalScriptPath = path.join(SCRIPTS_DIR, scriptFilename);
        if (createdScriptPath !== finalScriptPath) {
          await fs.rename(createdScriptPath, finalScriptPath).catch(() => {
            return fs.copyFile(createdScriptPath, finalScriptPath);
          });
        }
        
        draftVideos = {
          draft: null,
          noVoice: noVoicePath,
          script: finalScriptPath,
        };
      }

      if (draftVideos.draft) {
        result.draft = {
          url: `/api/video/download/draft/${path.basename(draftVideos.draft)}`,
          path: draftVideos.draft,
          filename: path.basename(draftVideos.draft),
        };
      }
      result.noVoice = {
        url: `/api/video/download/no_voice/${path.basename(draftVideos.noVoice)}`,
        path: draftVideos.noVoice,
        filename: path.basename(draftVideos.noVoice),
      };
      result.scriptFile = {
        url: `/api/video/download/scripts/${path.basename(draftVideos.script)}`,
        path: draftVideos.script,
        filename: path.basename(draftVideos.script),
      };
    } else {
      // Final mode - create single video
      const filename = `${baseFilename}.mp4`;
      let finalVideoPath;
      try {
        if (audioPath) {
          finalVideoPath = await editorService.createFinalVideo(
            videoPath,
            audioPath,
            scriptData.captions,
            filename
          );
        } else {
          // Create no-voice video with captions
          finalVideoPath = await editorService.addCaptionsOverlay(
            videoPath,
            scriptData.captions,
            filename
          );
        }
      } catch (finalError) {
        addLog(jobId, `[STEP 5/5] ⚠ Final video creation error: ${finalError.message}`, 'warning');
        addLog(jobId, '[STEP 5/5] Attempting fallback: Creating video with captions only...', 'info');
        
        try {
          // Fallback: Create video with captions only (no audio)
          finalVideoPath = await editorService.addCaptionsOverlay(
            videoPath,
            scriptData.captions,
            filename
          );
          result.warnings.push(`Final video created without audio: ${finalError.message}`);
        } catch (fallbackError) {
          addLog(jobId, `[STEP 5/5] ✗ Fallback also failed: ${fallbackError.message}`, 'error');
          throw new Error(`Failed to create final video: ${fallbackError.message}. Video file exists at: ${videoPath}`);
        }
      }

      result.video = {
        url: `/api/video/download/${path.basename(finalVideoPath)}`,
        path: finalVideoPath,
        filename: filename,
      };
    }

    // Cleanup temp files
    try {
      if (audioPath) {
        await fs.unlink(audioPath).catch(() => {});
      }
      imagePaths.forEach(async (p) => {
        await fs.unlink(p).catch(() => {});
      });
      await fs.unlink(videoPath).catch(() => {});
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }
    
    addLog(jobId, '[SYSTEM] ✓ Video generation completed successfully!', 'success');
    addLog(jobId, `[SYSTEM] Output files: ${Object.keys(result).join(', ')}`, 'info');
    updateJob(jobId, {
      status: 'completed',
      progress: 'สร้างวิดีโอสำเร็จ!',
      result,
    });
  } catch (error) {
    console.error('Job processing error:', error);
    const errorMessage = error.message || 'Failed to create video';
    addLog(jobId, `[ERROR] ${errorMessage}`, 'error');
    
    // Parse error details if available
    if (error.response?.data) {
      try {
        const errorData = Buffer.isBuffer(error.response.data) 
          ? JSON.parse(error.response.data.toString())
          : error.response.data;
        if (errorData.detail?.status) {
          addLog(jobId, `[ERROR] ElevenLabs API Error: ${errorData.detail.status}`, 'error');
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    updateJob(jobId, {
      status: 'error',
      progress: 'เกิดข้อผิดพลาด',
      error: errorMessage,
    });
  }
}

/**
 * Cleanup old jobs (older than 24 hours)
 */
async function cleanupOldJobs() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  for (const [jobId, job] of jobs.entries()) {
    if (now - job.createdAt.getTime() > oneDay) {
      jobs.delete(jobId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldJobs, 60 * 60 * 1000);

module.exports = {
  createJob,
  getJob,
  updateJob,
  processJob,
  addLog,
};

