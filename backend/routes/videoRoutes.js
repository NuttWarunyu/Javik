// Video creation routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const jobService = require('../services/jobService');
const editorService = require('../services/editorService');
const backgroundRemoverService = require('../services/backgroundRemoverService');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../output/temp/uploads'),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

/**
 * POST /api/video/create
 * Create a video from topic (async)
 */
router.post('/create', async (req, res) => {
  try {
    const { topic, duration = 60, mode = 'draft', options = {} } = req.body;

    // Validation
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required and must be a non-empty string',
      });
    }

    if (duration && (duration < 15 || duration > 60)) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be between 15 and 60 seconds',
      });
    }

    const validModes = ['draft', 'final', 'replace-voice', 'pip', 'batch'];
    if (mode && !validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        error: `Invalid mode. Must be one of: ${validModes.join(', ')}`,
      });
    }

    // Create job and process asynchronously
    const jobId = jobService.createJob(topic.trim(), duration || 60, mode, options);
    
    // Process job in background (don't await)
    jobService.processJob(jobId).catch((error) => {
      console.error('Background job error:', error);
    });

    // Return job ID immediately
    res.json({
      success: true,
      jobId,
      status: 'processing',
      mode,
      message: 'Video creation started',
    });
  } catch (error) {
    console.error('Error creating video job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create video job',
    });
  }
});

/**
 * GET /api/video/download/:filename
 * Download video file from videos directory
 */
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../output/videos', filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).json({
        success: false,
        error: 'Video not found',
      });
    }
  });
});

/**
 * GET /api/video/download/draft/:filename
 * Download draft video
 */
router.get('/download/draft/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../output/draft', filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).json({
        success: false,
        error: 'Draft video not found',
      });
    }
  });
});

/**
 * GET /api/video/download/no_voice/:filename
 * Download no-voice video
 */
router.get('/download/no_voice/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../output/no_voice', filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).json({
        success: false,
        error: 'No-voice video not found',
      });
    }
  });
});

/**
 * GET /api/video/download/scripts/:filename
 * Download script file
 */
router.get('/download/scripts/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../output/scripts', filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).json({
        success: false,
        error: 'Script file not found',
      });
    }
  });
});

/**
 * POST /api/video/replace-voice
 * Replace voice in existing video
 */
router.post('/replace-voice', upload.single('audio'), async (req, res) => {
  try {
    const { videoPath } = req.body;
    const audioFile = req.file;

    if (!videoPath) {
      return res.status(400).json({
        success: false,
        error: 'videoPath is required',
      });
    }

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required',
      });
    }

    const outputPath = await editorService.replaceVoice(videoPath, audioFile.path);

    // Cleanup uploaded file
    await fs.unlink(audioFile.path).catch(() => {});

    res.json({
      success: true,
      video: {
        url: `/api/video/download/${path.basename(outputPath)}`,
        path: outputPath,
        filename: path.basename(outputPath),
      },
    });
  } catch (error) {
    console.error('Error replacing voice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to replace voice',
    });
  }
});

/**
 * POST /api/video/pip
 * Create Picture-in-Picture video
 */
router.post('/pip', upload.fields([
  { name: 'broll', maxCount: 1 },
  { name: 'person', maxCount: 1 },
]), async (req, res) => {
  try {
    const { position = 'bottom-right', personSize = 0.3, removeBg = false } = req.body;
    const brollFile = req.files?.broll?.[0];
    const personFile = req.files?.person?.[0];

    if (!brollFile || !personFile) {
      return res.status(400).json({
        success: false,
        error: 'Both B-roll and person video files are required',
      });
    }

    let brollPath = brollFile.path;
    let personPath = personFile.path;

    // Remove background if requested
    if (removeBg === 'true' || removeBg === true) {
      personPath = await backgroundRemoverService.removeBackground(personPath, {
        method: 'chromakey',
      });
    }

    const outputPath = await editorService.createPIPVideo(
      brollPath,
      personPath,
      {
        removeBg: removeBg === 'true' || removeBg === true,
        position,
        personSize: parseFloat(personSize),
      }
    );

    // Cleanup uploaded files
    await fs.unlink(brollFile.path).catch(() => {});
    await fs.unlink(personFile.path).catch(() => {});
    if (personPath !== personFile.path) {
      await fs.unlink(personPath).catch(() => {});
    }

    res.json({
      success: true,
      video: {
        url: `/api/video/download/${path.basename(outputPath)}`,
        path: outputPath,
        filename: path.basename(outputPath),
      },
    });
  } catch (error) {
    console.error('Error creating PIP video:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create PIP video',
    });
  }
});

/**
 * GET /api/video/status/:jobId
 * Get video creation status (for async processing)
 */
router.get('/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required',
      });
    }

    const job = jobService.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    const response = {
      success: true,
      status: job.status,
      progress: job.progress,
      logs: job.logs || [], // Include logs
    };

    if (job.status === 'completed' && job.result) {
      // Draft mode returns draft, noVoice, and script
      if (job.mode === 'draft') {
        response.draft = job.result.draft;
        response.noVoice = job.result.noVoice;
        response.script = job.result.script;
      } else {
        response.video = job.result.video;
      }
      response.scriptText = job.result.script;
      response.hashtags = job.result.hashtags;
      response.captions = job.result.captions;
    }

    if (job.status === 'error' && job.error) {
      response.error = job.error;
    }

    res.json(response);
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get job status',
    });
  }
});

module.exports = router;

