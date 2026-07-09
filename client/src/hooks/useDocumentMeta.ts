import { useEffect } from "react";

/**
 * Per-page meta override hook.
 *
 * Mutates `document.head` to set the page title, description, theme-color
 * and Open Graph tags so that when a vehicle URL is shared on WhatsApp /
 * iMessage / X, the rich preview shows the actual vehicle name + image
 * instead of the homepage default.
 *
 * Restores the previous values on unmount so navigating back to the
 * showroom doesn't leave behind stale metadata.
 */
export type DocumentMetaInput = {
  title?: string;
  description?: string;
  themeColor?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: "website" | "article" | "product";
};

function setMetaContent(selector: string, value: string): string | null {
  const el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    const meta = document.createElement("meta");
    if (selector.startsWith("meta[name=")) {
      const name = selector.match(/meta\[name="([^"]+)"\]/)?.[1];
      if (name) meta.setAttribute("name", name);
    } else if (selector.startsWith("meta[property=")) {
      const prop = selector.match(/meta\[property="([^"]+)"\]/)?.[1];
      if (prop) meta.setAttribute("property", prop);
    }
    meta.content = value;
    document.head.appendChild(meta);
    return null;
  }
  const previous = el.content;
  el.content = value;
  return previous;
}

export function useDocumentMeta(input: DocumentMetaInput): void {
  useEffect(() => {
    const previous: Record<string, string | null> = {};
    const previousTitle = document.title;

    if (input.title) document.title = input.title;
    if (input.description != null)
      previous.description = setMetaContent(
        'meta[name="description"]',
        input.description,
      );
    if (input.themeColor)
      previous.themeColor = setMetaContent(
        'meta[name="theme-color"]',
        input.themeColor,
      );
    if (input.title)
      previous.ogTitle = setMetaContent('meta[property="og:title"]', input.title);
    if (input.description)
      previous.ogDescription = setMetaContent(
        'meta[property="og:description"]',
        input.description,
      );
    if (input.ogImage)
      previous.ogImage = setMetaContent('meta[property="og:image"]', input.ogImage);
    if (input.ogUrl)
      previous.ogUrl = setMetaContent('meta[property="og:url"]', input.ogUrl);
    if (input.ogType)
      previous.ogType = setMetaContent('meta[property="og:type"]', input.ogType);

    return () => {
      document.title = previousTitle;
      if (previous.description != null)
        setMetaContent('meta[name="description"]', previous.description);
      if (previous.themeColor != null)
        setMetaContent('meta[name="theme-color"]', previous.themeColor);
      if (previous.ogTitle != null)
        setMetaContent('meta[property="og:title"]', previous.ogTitle);
      if (previous.ogDescription != null)
        setMetaContent('meta[property="og:description"]', previous.ogDescription);
      if (previous.ogImage != null)
        setMetaContent('meta[property="og:image"]', previous.ogImage);
      if (previous.ogUrl != null)
        setMetaContent('meta[property="og:url"]', previous.ogUrl);
      if (previous.ogType != null)
        setMetaContent('meta[property="og:type"]', previous.ogType);
    };
  }, [
    input.title,
    input.description,
    input.themeColor,
    input.ogImage,
    input.ogUrl,
    input.ogType,
  ]);
}
