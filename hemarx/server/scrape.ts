const UA =
  "HemarxBrief/1.0 (+private study; just-in-time learning; not a commercial crawler)";

export type RssItem = {
  title: string;
  url: string;
  summary: string;
  publishedAt?: string;
};

export async function fetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,application/xml,application/json,text/xml,*/*" },
      redirect: "follow",
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const chunks = xml.split(/<item[\s>]/i).slice(1);
  const entries = chunks.length ? chunks : xml.split(/<entry[\s>]/i).slice(1);
  for (const chunk of entries.slice(0, 20)) {
    const title = decodeXml(matchTag(chunk, "title") ?? "");
    const url =
      attr(chunk, "link", "href") ||
      decodeXml(matchTag(chunk, "link") ?? "") ||
      decodeXml(matchTag(chunk, "guid") ?? "");
    if (!title || !url) continue;
    const summary = decodeXml(
      matchTag(chunk, "description") ??
        matchTag(chunk, "summary") ??
        matchTag(chunk, "content:encoded") ??
        matchTag(chunk, "content") ??
        "",
    ).slice(0, 420);
    const publishedAt =
      matchTag(chunk, "pubDate") ?? matchTag(chunk, "published") ?? matchTag(chunk, "updated");
    items.push({ title, url: url.trim(), summary, publishedAt: publishedAt?.trim() });
  }
  return items;
}

function matchTag(chunk: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  return re.exec(chunk)?.[1];
}

function attr(chunk: string, tag: string, name: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*${name}="([^"]+)"`, "i");
  return re.exec(chunk)?.[1];
}
