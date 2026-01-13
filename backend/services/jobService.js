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
    createdAt: new Date(),
    updatedAt: new Date(),
    result: null,
    error: null,
  };
  
  jobs.set(jobId, job);
  return jobId;
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

    const contentService = require('./contentService');
    const voiceService = require('./voiceService');
    const imageService = require('./imageService');
    const kenBurnsService = require('./kenBurnsService');
    const editorService = require('./editorService');

    // Step 1: Generate script
    updateJob(jobId, { progress: 'กำลังสร้างสคริปต์...' });
    const scriptData = await contentService.generateScript(job.topic, job.duration);

    // Step 2: Generate voice
    updateJob(jobId, { progress: 'กำลังสร้างเสียงพูด...' });
    const audioPath = await voiceService.generateVoice(scriptData.script);

    // Step 3: Search and download images
    updateJob(jobId, { progress: 'กำลังหารูปภาพ...' });
    const imagePaths = await imageService.searchAndDownloadImages(
      scriptData.keywords,
      2
    );

    // Step 4: Create Ken Burns video
    updateJob(jobId, { progress: 'กำลังสร้างเอฟเฟกต์ Ken Burns...' });
    const videoPath = await kenBurnsService.createVideoFromImages(
      imagePaths,
      job.duration
    );

    // Step 5: Create videos based on mode
    updateJob(jobId, { progress: 'กำลังรวมวิดีโอและเสียง...' });
    const timestamp = Date.now();
    const baseFilename = `video_${timestamp}`;

    let result = {
      script: scriptData.script,
      hashtags: scriptData.hashtags,
      captions: scriptData.captions,
    };

    if (job.mode === 'draft') {
      // Create 3 versions: draft, no_voice, script
      const draftVideos = await editorService.createDraftVideos(
        videoPath,
        audioPath,
        scriptData.captions,
        baseFilename
      );

      result.draft = {
        url: `/api/video/download/draft/${path.basename(draftVideos.draft)}`,
        path: draftVideos.draft,
        filename: path.basename(draftVideos.draft),
      };
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
      const finalVideoPath = await editorService.createFinalVideo(
        videoPath,
        audioPath,
        scriptData.captions,
        filename
      );

      result.video = {
        url: `/api/video/download/${path.basename(finalVideoPath)}`,
        path: finalVideoPath,
        filename: filename,
      };
    }

    // Cleanup temp files
    try {
      await fs.unlink(audioPath).catch(() => {});
      imagePaths.forEach(async (p) => {
        await fs.unlink(p).catch(() => {});
      });
      await fs.unlink(videoPath).catch(() => {});
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }
    
    updateJob(jobId, {
      status: 'completed',
      progress: 'สร้างวิดีโอสำเร็จ!',
      result,
    });
  } catch (error) {
    console.error('Job processing error:', error);
    updateJob(jobId, {
      status: 'error',
      progress: 'เกิดข้อผิดพลาด',
      error: error.message || 'Failed to create video',
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
};

