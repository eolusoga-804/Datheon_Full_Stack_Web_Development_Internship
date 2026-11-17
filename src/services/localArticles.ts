export type LocalArticle = {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
};

const ARTICLE_TIMEOUT_MS = 10_000;

// Keep a bounded, short-lived article cache for the current dashboard session.
const ARTICLE_CACHE_TTL_MS = 5 * 60_000;
const ARTICLE_CACHE_LIMIT = 20;

type ArticleCacheEntry = {
  articles: LocalArticle[];
  expiresAt: number;
};

const articleCache = new Map<string, ArticleCacheEntry>();

// Check the fields the sidebar needs before rendering external links.
function isLocalArticle(value: unknown): value is LocalArticle {
  if (typeof value !== "object" || value === null) return false;

  const article = value as Partial<LocalArticle>;
  const url = typeof article.url === "string" ? URL.parse(article.url) : null;

  return (
    typeof article.title === "string" &&
    article.title.trim().length > 0 &&
    url?.origin === "https://www.theguardian.com" &&
    !url.username &&
    !url.password &&
    typeof article.source === "string" &&
    (article.publishedAt === undefined ||
      (typeof article.publishedAt === "string" &&
        Number.isFinite(Date.parse(article.publishedAt))))
  );
}

export async function getLocalArticles(
  cityName: string,
  signal: AbortSignal,
): Promise<LocalArticle[]> {
  // Respect cancellation even when this request can use cached results.
  signal.throwIfAborted();

  const normalizedCity = cityName.trim().normalize("NFKC");
  const cacheKey = normalizedCity.toLocaleLowerCase("en");
  const cached = articleCache.get(cacheKey);

  // Reuse only unexpired results and refresh their eviction priority.
  if (cached && cached.expiresAt > Date.now()) {
    articleCache.delete(cacheKey);
    articleCache.set(cacheKey, cached);
    return cached.articles;
  }

  // Expired articles must be retrieved again.
  articleCache.delete(cacheKey);
  const query = new URLSearchParams({ city: normalizedCity });

  const timeout = AbortSignal.timeout(ARTICLE_TIMEOUT_MS);

  try {
    const response = await fetch(`/api/local-articles?${query}`, {
      signal: AbortSignal.any([signal, timeout]),
    });

    if (response.status === 429) {
      throw new Error("Article lookup is busy. Try again shortly.");
    }

    if (!response.ok) {
      throw new Error("Local articles are temporarily unavailable.");
    }

    const payload = (await response.json()) as { articles?: unknown } | null;
    const articles = payload?.articles;

    if (!Array.isArray(articles) || !articles.every(isLocalArticle)) {
      throw new Error("Article lookup returned an unexpected response.");
    }

    // Ignore cancelled responses and cache only successfully validated article lists.
    signal.throwIfAborted();

    const now = Date.now();

    // Remove expired entries before enforcing the cache's size limit.
    for (const [key, entry] of articleCache) {
      if (entry.expiresAt <= now) articleCache.delete(key);
    }

    // Replace this city's entry and evict the least recently used city if necessary.
    articleCache.delete(cacheKey);

    if (articleCache.size >= ARTICLE_CACHE_LIMIT) {
      const oldestKey = articleCache.keys().next().value;
      if (oldestKey !== undefined) articleCache.delete(oldestKey);
    }

    articleCache.set(cacheKey, {
      articles,
      expiresAt: now + ARTICLE_CACHE_TTL_MS,
    });

    return articles;
  } catch (error) {
    if (signal.aborted) throw signal.reason;

    if (timeout.aborted) {
      throw new Error("Article lookup timed out. Try again.", { cause: error });
    }

    if (error instanceof TypeError || error instanceof SyntaxError) {
      throw new Error("Could not load local articles. Try again.", {
        cause: error,
      });
    }

    throw error;
  }
}
