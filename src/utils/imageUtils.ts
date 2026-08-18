/**
 * Utilitaires pour optimiser et afficher les images
 * Supporte Cloudinary et Firebase Storage
 */

/**
 * Détecte si l'URL est une image Cloudinary
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com');
}

/**
 * Détecte si l'URL est une image Firebase Storage
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.app') || url.includes('firebaseapp.com');
}

/**
 * Optimise une URL d'image selon sa source
 * - Cloudinary: utilise les transformations Cloudinary
 * - Firebase Storage: retourne l'URL telle quelle (optimisation côté serveur)
 * - Autre: retourne l'URL telle quelle
 */
export function optimizeImageUrl(
  url: string,
  options: { width?: number; height?: number; quality?: string } = {}
): string {
  if (!url) return url;

  if (isCloudinaryUrl(url)) {
    return optimizeCloudinaryUrl(url, options);
  }

  // Pour Firebase Storage et autres, retourner l'URL telle quelle
  // Firebase Storage optimise automatiquement via CDN
  return url;
}

/**
 * Optimise une URL Cloudinary avec des transformations
 */
function optimizeCloudinaryUrl(
  url: string,
  options: { width?: number; height?: number; quality?: string } = {}
): string {
  const { width = 400, height = 300, quality = 'auto' } = options;

  // Transformer l'URL Cloudinary
  // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
  const parts = url.split('/upload/');
  if (parts.length === 2) {
    const transformations = [
      `w_${width}`,
      `h_${height}`,
      `c_fill`,
      `g_auto`,
      `q_${quality}`,
      `f_auto`
    ];
    return `${parts[0]}/upload/${transformations.join('/')}/${parts[1]}`;
  }

  return url;
}

/**
 * Optimise pour les miniatures (petites images)
 */
export function optimizeThumbnail(url: string): string {
  return optimizeImageUrl(url, { width: 150, height: 150, quality: 'auto' });
}

/**
 * Optimise pour les cartes produits (moyennes)
 */
export function optimizeProductCard(url: string): string {
  return optimizeImageUrl(url, { width: 300, height: 300, quality: 'auto' });
}

/**
 * Optimise pour les images plein écran (grandes)
 */
export function optimizeFullSize(url: string): string {
  return optimizeImageUrl(url, { width: 800, height: 800, quality: 'auto' });
}
