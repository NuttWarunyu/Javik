// Video creation routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const jobService = require('../services/jobService');
const editorService = require('../services/editorService');
const backgroundRemoverService = require('../services/backgroundRemoverService');
const imageService = require('../services/imageService');
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
router.get('/download/draft/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../output/draft', filename);

  res.download(filePath, async (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).json({
        success: false,
        error: 'Draft video not found',
      });
    } else {
      // Auto-cleanup after download (optional - can be disabled)
      // Files will be cleaned up by scheduled job anyway
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
      response.script = job.result.script;
      response.hook = job.result.hook || '';
      response.midHook = job.result.midHook || '';
      response.cta = job.result.cta || '';
      response.hashtags = job.result.hashtags;
      response.keywords = job.result.keywords || [];
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

/**
 * POST /api/video/cleanup/:jobId
 * Manually cleanup job files (optional - files auto-delete after 2 hours)
 */
router.post('/cleanup/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    jobService.cleanupJobFiles(jobId);
    
    res.json({
      success: true,
      message: 'Job files cleanup initiated',
      jobId,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cleanup job files',
    });
  }
});

/**
 * POST /api/video/cleanup/all
 * Cleanup all old temp files (admin only - use with caution)
 */
router.post('/cleanup/all', async (req, res) => {
  try {
    const tempDir = path.join(__dirname, '../../output/temp');
    const files = await fs.readdir(tempDir);
    
    let deletedCount = 0;
    for (const file of files) {
      try {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        const age = Date.now() - stats.mtimeMs;
        const twoHours = 2 * 60 * 60 * 1000;
        
        if (age > twoHours) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      } catch (err) {
        // Ignore individual file errors
      }
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} temp files`,
      deletedCount,
    });
  } catch (error) {
    console.error('Cleanup all error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cleanup temp files',
    });
  }
});

/**
 * POST /api/video/regenerate
 * Regenerate video with edited script/images/audio
 */
router.post('/regenerate', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    const { jobId, videoPath, script, hashtags, keywords, captions } = req.body;
    const audioFile = req.files?.audio?.[0];
    const imageFiles = req.files?.images || [];

    if (!jobId || !videoPath) {
      return res.status(400).json({
        success: false,
        error: 'jobId and videoPath are required',
      });
    }

    // Parse JSON strings
    const parsedHashtags = typeof hashtags === 'string' ? JSON.parse(hashtags) : hashtags;
    const parsedKeywords = typeof keywords === 'string' ? JSON.parse(keywords) : keywords;
    const parsedCaptions = typeof captions === 'string' ? JSON.parse(captions) : captions;

    // Get job data
    const job = jobService.getJob(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    let finalVideoPath = videoPath;
    let audioPath = null;

    // If audio uploaded, replace voice
    if (audioFile) {
      audioPath = audioFile.path;
      finalVideoPath = await editorService.replaceVoice(videoPath, audioPath);
      // Cleanup uploaded file
      await fs.unlink(audioFile.path).catch(() => {});
    }

    // If images uploaded, regenerate Ken Burns video
    if (imageFiles.length > 0) {
      const imagePaths = imageFiles.map(f => f.path);
      const kenBurnsService = require('../services/kenBurnsService');
      const kenBurnsVideoPath = await kenBurnsService.createKenBurnsEffect(
        imagePaths,
        job.duration || 60
      );
      
      // Combine with audio if available
      if (audioPath || job.audioPath) {
        const audioToUse = audioPath || job.audioPath;
        finalVideoPath = await editorService.combineAudioVideoWithCaptions(
          kenBurnsVideoPath,
          audioToUse,
          parsedCaptions,
          `video_${jobId}_regenerated.mp4`
        );
      } else {
        finalVideoPath = kenBurnsVideoPath;
      }

      // Cleanup uploaded images
      for (const file of imageFiles) {
        await fs.unlink(file.path).catch(() => {});
      }
    }

    // Update captions if script changed
    if (script && parsedCaptions) {
      // Add captions overlay
      finalVideoPath = await editorService.addCaptionsOverlay(
        finalVideoPath,
        parsedCaptions,
        `video_${jobId}_final.mp4`,
        path.join(__dirname, '../../output/videos')
      );
    }

    // Update job result
    jobService.updateJob(jobId, {
      status: 'completed',
      result: {
        url: `/api/video/download/${path.basename(finalVideoPath)}`,
        path: finalVideoPath,
        filename: path.basename(finalVideoPath),
      },
    });

    res.json({
      success: true,
      video: {
        url: `/api/video/download/${path.basename(finalVideoPath)}`,
        path: finalVideoPath,
        filename: path.basename(finalVideoPath),
      },
    });
  } catch (error) {
    console.error('Error regenerating video:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to regenerate video',
    });
  }
});

/**
 * POST /api/video/generate-script
 * Generate script only (without creating video)
 */
router.post('/generate-script', async (req, res) => {
  try {
    const { topic, duration = 60 } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required',
      });
    }

    const contentService = require('../services/contentService');
    const scriptData = await contentService.generateScript(topic.trim(), duration || 60);

    res.json({
      success: true,
      scriptData,
    });
  } catch (error) {
    console.error('Error generating script:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate script',
    });
  }
});

/**
 * POST /api/video/search-images
 * Search images for selection (returns URLs without downloading)
 */
router.post('/search-images', async (req, res) => {
  try {
    const { topic, keywords = [], imageVarietyKeywords = [], maxImages = 20 } = req.body;

    if (!topic && (!keywords || keywords.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Topic or keywords are required',
      });
    }

    const images = await imageService.searchImagesForSelection(
      keywords,
      maxImages,
      topic,
      imageVarietyKeywords
    );

    res.json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error) {
    console.error('Error searching images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search images',
    });
  }
});

/**
 * POST /api/video/create-with-images
 * Create video with selected images and script
 */
router.post('/create-with-images', async (req, res) => {
  try {
    const { topic, duration = 60, mode = 'draft', scriptData, selectedImageUrls = [] } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required',
      });
    }

    if (!scriptData || !scriptData.script) {
      return res.status(400).json({
        success: false,
        error: 'Script data is required',
      });
    }

    if (!selectedImageUrls || selectedImageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one image URL is required',
      });
    }

    // Create job with script data and selected images
    const options = {
      scriptData,
      selectedImageUrls,
    };
    
    const jobId = jobService.createJob(topic.trim(), duration || 60, mode, options);
    
    // Process job with selected images
    jobService.processJobWithSelectedImages(jobId).catch((error) => {
      console.error('Background job error:', error);
    });

    res.json({
      success: true,
      jobId,
      status: 'processing',
      mode,
      message: 'Video creation started with selected images',
    });
  } catch (error) {
    console.error('Error creating video with images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create video',
    });
  }
});

module.exports = router;

