import sanitizeHtml from "sanitize-html";

const allowedIframeHost = /^(www\.)?(youtube\.com|youtube-nocookie\.com)$/i;

export function sanitizePostHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "p", "br", "h2", "h3", "strong", "em", "ul", "ol", "li", "a",
      "blockquote", "hr", "img", "figure", "figcaption", "iframe", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "title", "allow", "allowfullscreen", "loading"],
      div: ["data-youtube-video"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["https", "http"], iframe: ["https"] },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
        },
      }),
      iframe: (_tagName, attribs) => {
        try {
          const url = new URL(attribs.src ?? "");
          if (!allowedIframeHost.test(url.hostname)) return { tagName: "p", attribs: {}, text: "" };
        } catch {
          return { tagName: "p", attribs: {}, text: "" };
        }
        return { tagName: "iframe", attribs: { ...attribs, loading: "lazy" } };
      },
    },
  });
}

export function plainText(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}
