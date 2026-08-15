/**
 * Centralized Asset & Image URL Service
 * Ensures image source paths resolve correctly across all environments
 * and base path configurations (Vite BASE_URL, subpaths, Cloud Run, etc.).
 */

export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  
  // Return external URLs, data URIs, or blob URIs directly
  if (/^(https?:|data:|blob:|\/\/)/i.test(path)) {
    return path;
  }
  
  // Determine base URL from Vite environment
  const rawBase = import.meta.env.BASE_URL || "/";
  const baseUrl = rawBase === "/" ? "" : rawBase.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  // Prevent double-prefixing if baseUrl is already present
  if (baseUrl && (normalizedPath === baseUrl || normalizedPath.startsWith(`${baseUrl}/`))) {
    return normalizedPath;
  }

  return `${baseUrl}${normalizedPath}`;
}

export default getAssetUrl;
