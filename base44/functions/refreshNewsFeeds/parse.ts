const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function clean(raw) {
  let s = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  s = decode(s);
  s = decode(s.replace(/<[^>]*>/g, " "));
  return s.replace(/\s+/g, " ").trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}

function attr(block, re) {
  const m = block.match(re);
  return m ? decode(m[1]) : "";
}

export function parseFeed(xml, max = 12) {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];
  return blocks.slice(0, max).map((b) => {
    const rawLink = tag(b, "link");
    const link = clean(rawLink) || attr(b, /<link[^>]+href=["']([^"']+)["']/i) || clean(tag(b, "guid"));
    const rawDesc = tag(b, "description") || tag(b, "summary") || tag(b, "content:encoded") || tag(b, "content");
    const image =
      attr(b, /<media:content[^>]+url=["']([^"']+)["']/i) ||
      attr(b, /<media:thumbnail[^>]+url=["']([^"']+)["']/i) ||
      attr(b, /<enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i) ||
      attr(b, /<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i) ||
      attr(decode(rawDesc.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")), /<img[^>]+src=["']([^"']+)["']/i);
    const date = clean(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "dc:date"));
    const t = Date.parse(date);
    return {
      title: clean(tag(b, "title")),
      description: clean(rawDesc).slice(0, 600),
      url: link,
      image_url: /^https?:\/\//.test(image) ? image : "",
      published_at: isNaN(t) ? null : new Date(t).toISOString(),
    };
  });
}

export const normTitle = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function normUrl(u) {
  try {
    const x = new URL(u);
    x.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"].forEach((k) => x.searchParams.delete(k));
    return x.toString();
  } catch {
    return u;
  }
}