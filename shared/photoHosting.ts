/** URLs stored on GrayArx storage vs external links that need mirroring. */

export function isGrayArxHostedUrl(
  url: string | null | undefined,
  s3PublicUrl?: string,
): boolean {
  if (!url?.trim()) return false;
  const u = url.trim();
  // Relative paths served by our own server
  if (u.startsWith("/manus-storage/") || u.startsWith("/api/storage/") || u.startsWith("/uploads/")) {
    return true;
  }
  // S3 / R2 public bucket URL — pass from server env so shared code stays isomorphic
  if (s3PublicUrl) {
    const base = s3PublicUrl.replace(/\/+$/, "");
    if (u.startsWith(base + "/") || u === base) return true;
  }
  return false;
}

export function isExternalPhotoUrl(
  url: string | null | undefined,
  s3PublicUrl?: string,
): boolean {
  if (!url?.trim()) return false;
  return /^https?:\/\//i.test(url.trim()) && !isGrayArxHostedUrl(url, s3PublicUrl);
}
