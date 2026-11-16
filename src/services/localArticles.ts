export type LocalArticle = {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
};

const ARTICLE_TIMEOUT_MS = 10_000;

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
  const query = new URLSearchParams({ city: cityName });
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
