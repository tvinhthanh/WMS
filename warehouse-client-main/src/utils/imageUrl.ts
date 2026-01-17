/**
 * Helper function to build image URL from relative path
 * Static files are served from /uploads, not /api/uploads
 */
export const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Get base URL from environment variable. Use same default as api-client if not provided
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://localhost:7215/api";
  
  // Remove /api from base URL if present (static files are served from root, not /api)
  const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  
  // Ensure imagePath starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${normalizedPath}`;
};

