// Image search service using Unsplash, Pexels, or Google Custom Search
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
 * Search images from Unsplash
 * @param {string} query - Search query
 * @param {number} count - Number of images (default: 5)
 * @returns {Promise<Array<string>>} Array of image URLs
 */
async function searchUnsplash(query, count = 5) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY not found in environment variables');
  }

  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query,
        per_page: count,
        orientation: 'portrait', // For 9:16 format
      },
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    return response.data.results.map((photo) => photo.urls.regular);
  } catch (error) {
    console.error('Unsplash error:', error.response?.data || error.message);
    throw new Error(`Failed to search Unsplash: ${error.message}`);
  }
}

/**
 * Search images from Pexels
 * @param {string} query - Search query
 * @param {number} count - Number of images (default: 5)
 * @returns {Promise<Array<string>>} Array of image URLs
 */
async function searchPexels(query, count = 5) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('PEXELS_API_KEY not found in environment variables');
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query,
        per_page: count,
        orientation: 'portrait',
      },
      headers: {
        Authorization: apiKey,
      },
    });

    return response.data.photos.map((photo) => photo.src.large);
  } catch (error) {
    console.error('Pexels error:', error.response?.data || error.message);
    throw new Error(`Failed to search Pexels: ${error.message}`);
  }
}

/**
 * Search images from Google Custom Search (more accurate for specific topics)
 * @param {string} query - Search query
 * @param {number} count - Number of images (default: 5)
 * @returns {Promise<Array<string>>} Array of image URLs
 */
async function searchGoogleImages(query, count = 5) {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    throw new Error('GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID required');
  }

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: query,
        searchType: 'image',
        num: Math.min(count, 10), // Google allows max 10 per request
        imgSize: 'large',
        imgType: 'photo',
        safe: 'active',
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      return [];
    }

    return response.data.items.map((item) => item.link).filter(Boolean);
  } catch (error) {
    console.error('Google Images error:', error.response?.data || error.message);
    throw new Error(`Failed to search Google Images: ${error.message}`);
  }
}

/**
 * Search images from Wikipedia (good for specific animals/objects)
 * @param {string} query - Search query
 * @param {number} count - Number of images (default: 5)
 * @returns {Promise<Array<string>>} Array of image URLs
 */
async function searchWikipediaImages(query, count = 5) {
  try {
    // First, search for the Wikipedia page
    const searchResponse = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(query), {
      headers: {
        'User-Agent': 'Javik-Video-Generator/1.0',
      },
    });

    const imageUrls = [];
    
    // Get thumbnail if available
    if (searchResponse.data.thumbnail) {
      imageUrls.push(searchResponse.data.thumbnail.source);
    }

    // Get original image URL (remove size restriction)
    if (searchResponse.data.originalimage) {
      imageUrls.push(searchResponse.data.originalimage.source);
    }

    // Try to get more images from the page
    try {
      const pageResponse = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/media/${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Javik-Video-Generator/1.0',
        },
      });

      if (pageResponse.data.items) {
        for (const item of pageResponse.data.items.slice(0, count - imageUrls.length)) {
          if (item.original && item.original.source) {
            imageUrls.push(item.original.source);
          }
        }
      }
    } catch (err) {
      // Ignore errors for additional images
    }

    return imageUrls.slice(0, count);
  } catch (error) {
    console.error('Wikipedia Images error:', error.response?.data || error.message);
    // Return empty array instead of throwing - Wikipedia is optional
    return [];
  }
}

/**
 * Download image from URL
 * @param {string} url - Image URL
 * @returns {Promise<string>} Path to downloaded image
 */
async function downloadImage(url) {
  await ensureOutputDir();
  const outputPath = path.join(OUTPUT_DIR, `image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    await fs.writeFile(outputPath, response.data);
    return outputPath;
  } catch (error) {
    console.error('Download error:', error.message);
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * Search images and return URLs (without downloading) - for image selection
 * @param {Array<string>} keywords - Keywords for image search
 * @param {number} maxImages - Maximum number of images to return (default: 20)
 * @param {string} topic - Topic for more specific search
 * @returns {Promise<Array<{url: string, source: string, thumbnail: string}>>} Array of image info objects
 */
async function searchImagesForSelection(keywords, maxImages = 20, topic = '') {
  const imageResults = [];
  const searchQueries = [];
  
  // Build search queries - prioritize exact topic match
  if (topic && topic.trim()) {
    searchQueries.push(topic.trim());
    if (/[\u0E00-\u0E7F]/.test(topic)) {
      searchQueries.push(topic.trim() + ' fish');
    }
  }
  
  for (const keyword of keywords) {
    if (keyword && keyword.trim() && !searchQueries.includes(keyword.trim())) {
      searchQueries.push(keyword.trim());
    }
  }
  
  // Search from multiple sources
  for (const query of searchQueries) {
    if (imageResults.length >= maxImages) break;
    
    // 1. Unsplash
    if (process.env.UNSPLASH_ACCESS_KEY && imageResults.length < maxImages) {
      try {
        const response = await axios.get('https://api.unsplash.com/search/photos', {
          params: {
            query,
            per_page: Math.min(5, maxImages - imageResults.length),
            orientation: 'portrait',
          },
          headers: {
            Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
          },
        });
        
        response.data.results.forEach(photo => {
          if (imageResults.length < maxImages) {
            imageResults.push({
              url: photo.urls.regular,
              thumbnail: photo.urls.thumb,
              source: 'Unsplash',
              license: 'Free to use',
            });
          }
        });
      } catch (error) {
        console.error(`[Unsplash] Error for "${query}":`, error.message);
      }
    }
    
    // 2. Pexels
    if (process.env.PEXELS_API_KEY && imageResults.length < maxImages) {
      try {
        const response = await axios.get('https://api.pexels.com/v1/search', {
          params: {
            query,
            per_page: Math.min(5, maxImages - imageResults.length),
            orientation: 'portrait',
          },
          headers: {
            Authorization: process.env.PEXELS_API_KEY,
          },
        });
        
        response.data.photos.forEach(photo => {
          if (imageResults.length < maxImages) {
            imageResults.push({
              url: photo.src.large,
              thumbnail: photo.src.medium,
              source: 'Pexels',
              license: 'Free to use',
            });
          }
        });
      } catch (error) {
        console.error(`[Pexels] Error for "${query}":`, error.message);
      }
    }
    
    // 3. Wikipedia
    if (imageResults.length < maxImages) {
      try {
        const urls = await searchWikipediaImages(query, Math.min(3, maxImages - imageResults.length));
        urls.forEach(url => {
          if (imageResults.length < maxImages) {
            imageResults.push({
              url: url,
              thumbnail: url,
              source: 'Wikipedia',
              license: 'CC/Public Domain',
            });
          }
        });
      } catch (error) {
        console.error(`[Wikipedia] Error for "${query}":`, error.message);
      }
    }
  }
  
  return imageResults.slice(0, maxImages);
}

/**
 * Search and download images (auto-select service with multiple sources)
 * @param {Array<string>} keywords - Keywords for image search
 * @param {number} imagesPerKeyword - Images per keyword (default: 2)
 * @param {string} topic - Topic for more specific search
 * @returns {Promise<Array<string>>} Array of downloaded image paths
 */
async function searchAndDownloadImages(keywords, imagesPerKeyword = 2, topic = '') {
  const imageUrls = [];
  const searchQueries = [];
  
  // Build search queries - prioritize exact topic match
  if (topic && topic.trim()) {
    searchQueries.push(topic.trim()); // Exact topic first
    // Also try English translation if topic is in Thai
    if (/[\u0E00-\u0E7F]/.test(topic)) {
      // If contains Thai characters, also search in English
      searchQueries.push(topic.trim() + ' fish'); // Add context
    }
  }
  
  // Add keywords
  for (const keyword of keywords) {
    if (keyword && keyword.trim() && !searchQueries.includes(keyword.trim())) {
      searchQueries.push(keyword.trim());
    }
  }
  
  // Search strategy: Prioritize FREE and SAFE sources first
  // Priority: Unsplash > Pexels > Wikipedia > Google Images (for safety)
  // Note: Google Images may have copyright, use only when necessary
  
  for (const query of searchQueries) {
    if (imageUrls.length >= 10) break;
    
    // 1. Try Unsplash FIRST (safest - free license, no attribution needed)
    if (process.env.UNSPLASH_ACCESS_KEY && imageUrls.length < 10) {
      try {
        const urls = await searchUnsplash(query, imagesPerKeyword);
        imageUrls.push(...urls);
        console.log(`[Unsplash] Found ${urls.length} images for "${query}" (License: Free to use)`);
        if (imageUrls.length >= 10) break;
      } catch (error) {
        console.error(`[Unsplash] Error for "${query}":`, error.message);
      }
    }
    
    // 2. Try Pexels (safe - free license, no attribution needed)
    if (process.env.PEXELS_API_KEY && imageUrls.length < 10) {
      try {
        const urls = await searchPexels(query, imagesPerKeyword);
        imageUrls.push(...urls);
        console.log(`[Pexels] Found ${urls.length} images for "${query}" (License: Free to use)`);
        if (imageUrls.length >= 10) break;
      } catch (error) {
        console.error(`[Pexels] Error for "${query}":`, error.message);
      }
    }
    
    // 3. Try Wikipedia (safe - Creative Commons/Public Domain)
    if (imageUrls.length < 10) {
      try {
        const urls = await searchWikipediaImages(query, imagesPerKeyword);
        imageUrls.push(...urls);
        console.log(`[Wikipedia] Found ${urls.length} images for "${query}" (License: CC/Public Domain)`);
        if (imageUrls.length >= 10) break;
      } catch (error) {
        console.error(`[Wikipedia] Error for "${query}":`, error.message);
      }
    }
    
    // 4. Try Google Custom Search LAST (may have copyright - use only when necessary)
    // Only use if other sources didn't find enough images
    if (process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && 
        process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID && 
        imageUrls.length < 5) { // Only use if we have less than 5 images
      try {
        const urls = await searchGoogleImages(query, imagesPerKeyword);
        imageUrls.push(...urls);
        console.log(`[Google Images] Found ${urls.length} images for "${query}" (⚠️ Check license before commercial use)`);
        if (imageUrls.length >= 10) break;
      } catch (error) {
        console.error(`[Google Images] Error for "${query}":`, error.message);
      }
    }
  }
  
  // Remove duplicates
  const uniqueUrls = [...new Set(imageUrls)];

  // Download images
  const imagePaths = [];
  for (const url of uniqueUrls.slice(0, 10)) { // Limit to 10 images
    try {
      const path = await downloadImage(url);
      imagePaths.push(path);
    } catch (error) {
      console.error(`Error downloading image from ${url}:`, error.message);
    }
  }

  if (imagePaths.length === 0) {
    throw new Error('No images were downloaded. Try adding Google Custom Search API or check your API keys.');
  }

  console.log(`[Image Service] Successfully downloaded ${imagePaths.length} images from ${uniqueUrls.length} unique URLs`);
  return imagePaths;
}

module.exports = {
  searchUnsplash,
  searchPexels,
  searchGoogleImages,
  searchWikipediaImages,
  downloadImage,
  searchAndDownloadImages,
  searchImagesForSelection,
};

