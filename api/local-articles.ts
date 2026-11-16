const GUARDIAN_SEARCH_URL = "https://content.guardianapis.com/search";
const ARTICLE_LIMIT = 4;
const TIMEOUT_MS = 8_000;
const CITY_NAME_PATTERN = /^[\p{L}\p{M}\p{N} .,'’()-]+$/u;

function json(body: unknown, status = 200, headers?: Record<string, string>) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

// Return only the metadata needed for an original article link.
function readArticle(value: unknown) {
  if (typeof value !== "object" || value === null) return undefined;

  const item = value as Record<string, unknown>;
  const title = typeof item.webTitle === "string" ? item.webTitle.trim() : "";
  const url = typeof item.webUrl === "string" ? URL.parse(item.webUrl) : null;

  if (
    item.type !== "article" ||
    !title ||
    !url ||
    url.origin !== "https://www.theguardian.com" ||
    url.username ||
    url.password
  ) {
    return undefined;
  }

  const publishedAt =
    typeof item.webPublicationDate === "string" &&
    Number.isFinite(Date.parse(item.webPublicationDate))
      ? item.webPublicationDate
      : undefined;

  return { title, url: url.href, publishedAt, source: "The Guardian" };
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET") {
      return json({ message: "Use GET to request local articles." }, 405, {
        Allow: "GET",
      });
    }

    const city = new URL(request.url).searchParams.get("city")?.trim();
    if (!city || city.length > 100 || !CITY_NAME_PATTERN.test(city)) {
      return json({ message: "Enter a valid city name." }, 400);
    }

    const apiKey = process.env.GUARDIAN_API_KEY?.trim();
    if (!apiKey) {
      return json({ message: "Local articles are not configured." }, 503);
    }

    // Search for the city as a phrase alongside weather topics.
    const upstream = new URL(GUARDIAN_SEARCH_URL);
    upstream.search = new URLSearchParams({
      "api-key": apiKey,
      q: `"${city}" AND (weather OR flooding OR heatwave OR storm)`,
      type: "article",
      "page-size": String(ARTICLE_LIMIT),
      "order-by": "relevance",
    }).toString();

    const timeout = AbortSignal.timeout(TIMEOUT_MS);

    try {
      const response = await fetch(upstream, { signal: timeout });

      if (response.status === 429) {
        return json(
          { message: "Article lookup is busy. Try again shortly." },
          429,
        );
      }

      if (!response.ok) {
        return json(
          { message: "Local articles are temporarily unavailable." },
          502,
        );
      }

      const payload = (await response.json()) as {
        response?: { results?: unknown };
      } | null;
      const results = payload?.response?.results;

      if (!Array.isArray(results)) {
        return json(
          { message: "Article lookup returned an unexpected response." },
          502,
        );
      }

      const articles = results
        .map(readArticle)
        .filter((article) => article !== undefined);

      const uniqueArticles = new Map(
        articles.map((article) => [article.url, article]),
      );

      return json({
        articles: [...uniqueArticles.values()].slice(0, ARTICLE_LIMIT),
      });
    } catch {
      // Keep the provider URL and credential out of public errors.
      return timeout.aborted
        ? json({ message: "Article lookup timed out. Try again." }, 504)
        : json({ message: "Could not retrieve local articles." }, 502);
    }
  },
};
