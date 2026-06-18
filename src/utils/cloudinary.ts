/**
 * Cloudinary Image Optimization Utility
 * Optimizes images for fast loading on 3G connections
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: "auto" | "low" | "medium" | "high";
  format?: "auto" | "webp" | "jpg";
  crop?: "fill" | "thumb" | "scale";
}

/**
 * Transforms a Cloudinary URL with optimization parameters for 3G
 * - q_auto: automatic quality based on device/connection
 * - f_auto: automatic format (WebP for modern browsers, JPEG fallback)
 * - w,h: responsive sizing
 * - c_fill,g_auto: intelligent crop
 *
 * @param imageUrl - Original Cloudinary secure_url
 * @param options - Transformation options
 * @returns Optimized Cloudinary URL
 */
export function optimizeCloudinaryUrl(
  imageUrl: string,
  options: ImageTransformOptions = {},
): string {
  if (!imageUrl) return imageUrl;

  // Only optimize Cloudinary URLs
  if (!imageUrl.includes("cloudinary.com")) {
    return imageUrl;
  }

  const {
    width = 400,
    height = 300,
    quality = "auto",
    format = "auto",
    crop = "fill",
  } = options;

  // Build transformation parameters
  const transformations = [
    `w_${width}`, // Width
    `h_${height}`, // Height
    `c_${crop}`, // Crop mode
    "g_auto", // Gravity (auto face detection)
    `q_${quality}`, // Quality (auto adapts to device/network)
    `f_${format}`, // Format (auto chooses WebP/JPEG)
  ];

  // Insert transformation into Cloudinary URL
  // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
  const parts = imageUrl.split("/upload/");
  if (parts.length === 2) {
    return `${parts[0]}/upload/${transformations.join("/")}/${parts[1]}`;
  }

  return imageUrl;
}

/**
 * Optimize image for thumbnail display (small, compressed)
 * Used in product lists and thumbnails
 */
export function optimizeThumbnail(imageUrl: string): string {
  return optimizeCloudinaryUrl(imageUrl, {
    width: 150,
    height: 150,
    quality: "auto",
    format: "auto",
    crop: "fill",
  });
}

/**
 * Optimize image for product card display (medium)
 * Used in main product display
 */
export function optimizeProductCard(imageUrl: string): string {
  return optimizeCloudinaryUrl(imageUrl, {
    width: 300,
    height: 300,
    quality: "auto",
    format: "auto",
    crop: "fill",
  });
}

/**
 * Optimize image for modal/lightbox display (full size but still optimized)
 * Used when viewing enlarged images
 */
export function optimizeModalImage(imageUrl: string): string {
  return optimizeCloudinaryUrl(imageUrl, {
    width: 800,
    height: 800,
    quality: "auto",
    format: "auto",
    crop: "scale", // Don't crop for modal, scale to fit
  });
}
