import { useEffect } from "react";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@shared/seo";

/**
 * Per-page meta override hook — title, description, canonical, OG + Twitter.
 * Restores previous values on unmount.
 */
export type DocumentMetaInput = {
  title?: string;
  description?: string;
  keywords?: string;
  themeColor?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: "website" | "article" | "product";
  /** Path or absolute URL — sets canonical + og:url when ogUrl omitted. */
  canonicalPath?: string;
  noIndex?: boolean;
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

function setCanonicalHref(href: string): string | null {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
    link.href = href;
    return null;
  }
  const previous = link.href;
  link.href = href;
  return previous;
}

function setJsonLd(id: string, data: Record<string, unknown> | null): void {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  const json = JSON.stringify(data);
  if (existing) {
    existing.textContent = json;
    return;
  }
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = id;
  script.textContent = json;
  document.head.appendChild(script);
}

export function useDocumentMeta(
  input: DocumentMetaInput & { jsonLd?: Record<string, unknown> | null },
): void {
  useEffect(() => {
    const previous: Record<string, string | null> = {};
    const previousTitle = document.title;
    const canonical =
      input.ogUrl ??
      (input.canonicalPath ? absoluteUrl(input.canonicalPath) : undefined);
    const ogImage = input.ogImage ?? DEFAULT_OG_IMAGE;

    if (input.title) document.title = input.title;
    if (input.description != null)
      previous.description = setMetaContent(
        'meta[name="description"]',
        input.description,
      );
    if (input.keywords != null)
      previous.keywords = setMetaContent('meta[name="keywords"]', input.keywords);
    if (input.themeColor)
      previous.themeColor = setMetaContent(
        'meta[name="theme-color"]',
        input.themeColor,
      );
    if (input.noIndex)
      previous.robots = setMetaContent('meta[name="robots"]', "noindex,nofollow");

    if (input.title) {
      previous.ogTitle = setMetaContent('meta[property="og:title"]', input.title);
      previous.twitterTitle = setMetaContent('meta[name="twitter:title"]', input.title);
    }
    if (input.description) {
      previous.ogDescription = setMetaContent(
        'meta[property="og:description"]',
        input.description,
      );
      previous.twitterDescription = setMetaContent(
        'meta[name="twitter:description"]',
        input.description,
      );
    }
    previous.ogImage = setMetaContent('meta[property="og:image"]', ogImage);
    previous.twitterImage = setMetaContent('meta[name="twitter:image"]', ogImage);
    previous.twitterCard = setMetaContent(
      'meta[name="twitter:card"]',
      "summary_large_image",
    );
    if (canonical) {
      previous.ogUrl = setMetaContent('meta[property="og:url"]', canonical);
      previous.canonical = setCanonicalHref(canonical);
    }
    if (input.ogType)
      previous.ogType = setMetaContent('meta[property="og:type"]', input.ogType);

    if (input.jsonLd !== undefined) setJsonLd("grayarx-jsonld", input.jsonLd);

    return () => {
      document.title = previousTitle;
      if (previous.description != null)
        setMetaContent('meta[name="description"]', previous.description);
      if (previous.keywords != null)
        setMetaContent('meta[name="keywords"]', previous.keywords);
      if (previous.themeColor != null)
        setMetaContent('meta[name="theme-color"]', previous.themeColor);
      if (previous.robots != null)
        setMetaContent('meta[name="robots"]', previous.robots);
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
      if (previous.twitterTitle != null)
        setMetaContent('meta[name="twitter:title"]', previous.twitterTitle);
      if (previous.twitterDescription != null)
        setMetaContent('meta[name="twitter:description"]', previous.twitterDescription);
      if (previous.twitterImage != null)
        setMetaContent('meta[name="twitter:image"]', previous.twitterImage);
      if (previous.twitterCard != null)
        setMetaContent('meta[name="twitter:card"]', previous.twitterCard);
      if (previous.canonical != null) setCanonicalHref(previous.canonical);
      if (input.jsonLd) setJsonLd("grayarx-jsonld", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jsonLd identity stable when callers memoize/module-const
  }, [
    input.title,
    input.description,
    input.keywords,
    input.themeColor,
    input.ogImage,
    input.ogUrl,
    input.ogType,
    input.canonicalPath,
    input.noIndex,
  ]);
}
