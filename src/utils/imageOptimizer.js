/**
 * Image Optimization Utility
 * Provides functions to optimize images from various sources
 */

/**
 * Get optimized image URL based on the source
 * @param {string} url - Original image URL
 * @param {Object} options - Optimization options
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  const { 
    width = 800, 
    height = null,
    quality = 75, 
    format = 'webp',
    fit = 'cover' 
  } = options
  
  if (!url) return ''

  // For Supabase storage images
  if (url?.includes('supabase')) {
    const params = new URLSearchParams()
    if (width) params.append('width', width)
    if (height) params.append('height', height)
    if (quality) params.append('quality', quality)
    
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${params.toString()}`
  }
  
  // For Unsplash images
  if (url?.includes('unsplash')) {
    const params = new URLSearchParams()
    if (width) params.append('w', width)
    if (height) params.append('h', height)
    params.append('q', quality)
    params.append('fm', format)
    params.append('fit', fit)
    
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${params.toString()}`
  }

  // For Cloudinary (if you use it)
  if (url?.includes('cloudinary')) {
    const transformations = []
    if (width) transformations.push(`w_${width}`)
    if (height) transformations.push(`h_${height}`)
    transformations.push(`q_${quality}`)
    transformations.push(`f_${format}`)
    transformations.push(`c_${fit}`)
    
    // Insert transformations into Cloudinary URL
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`
    }
  }

  // For local images or other sources, return as is
  return url
}

/**
 * Preload an image
 * @param {string} url - Image URL to preload
 * @returns {Promise} Promise that resolves when image is loaded
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Preload multiple images
 * @param {string[]} urls - Array of image URLs to preload
 * @returns {Promise} Promise that resolves when all images are loaded
 */
export const preloadImages = (urls) => {
  return Promise.all(urls.map(preloadImage))
}

/**
 * Get image dimensions
 * @param {string} url - Image URL
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export const getImageDimensions = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = url
  })
}

/**
 * Convert file to base64
 * @param {File} file - File object
 * @returns {Promise<string>} Base64 encoded string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Compress image file
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'webp'
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => resolve(blob),
          `image/${format}`,
          quality
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

/**
 * Generate thumbnail from image
 * @param {string} url - Image URL
 * @param {number} size - Thumbnail size (square)
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (url, size = 150) => {
  return getOptimizedImageUrl(url, {
    width: size,
    height: size,
    quality: 70,
    fit: 'cover'
  })
}

/**
 * Lazy load images with Intersection Observer
 * @param {string} selector - CSS selector for images to lazy load
 */
export const lazyLoadImages = (selector = 'img[data-src]') => {
  const images = document.querySelectorAll(selector)
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src
        img.removeAttribute('data-src')
        imageObserver.unobserve(img)
      }
    })
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  })

  images.forEach(img => imageObserver.observe(img))
  
  return imageObserver
}

/**
 * Get responsive image srcset
 * @param {string} url - Base image URL
 * @param {number[]} widths - Array of widths for srcset
 * @returns {string} Srcset string
 */
export const getResponsiveSrcset = (url, widths = [320, 640, 960, 1280, 1920]) => {
  return widths
    .map(width => `${getOptimizedImageUrl(url, { width })} ${width}w`)
    .join(', ')
}

/**
 * Check if image format is supported
 * @param {string} format - Image format (webp, avif, etc.)
 * @returns {Promise<boolean>} Whether format is supported
 */
export const isImageFormatSupported = async (format) => {
  const formats = {
    webp: 'image/webp',
    avif: 'image/avif',
    jpeg: 'image/jpeg',
    png: 'image/png'
  }

  if (!formats[format]) return false

  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = `data:${formats[format]};base64,AAAAHGZ1bmN0aW9u`
  })
}

export default {
  getOptimizedImageUrl,
  preloadImage,
  preloadImages,
  getImageDimensions,
  fileToBase64,
  compressImage,
  getThumbnailUrl,
  lazyLoadImages,
  getResponsiveSrcset,
  isImageFormatSupported
}
