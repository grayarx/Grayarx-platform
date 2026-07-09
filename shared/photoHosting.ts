/** URLs stored on GrayArx / Manus storage vs external marketplace links. */

export function isGrayArxHostedUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const u = url.trim();
  return u.startsWith("/manus-storage/") || u.startsWith("/api/storage/");
}

export function isExternalPhotoUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return /^https?:\/\//i.test(url.trim()) && !isGrayArxHostedUrl(url);
}
