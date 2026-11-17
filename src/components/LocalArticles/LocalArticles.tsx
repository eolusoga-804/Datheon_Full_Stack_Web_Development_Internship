import { useEffect, useState } from "react";
import { getLocalArticles } from "../../services/localArticles";
import type { LocalArticle } from "../../services/localArticles";
// Reuse the dashboard's branded loading indicator for article requests.
import LoadingState from "../LoadingState/LoadingState";
import "./LocalArticles.css";

type ArticleResult =
  | { status: "loading" }
  | { status: "ready"; articles: LocalArticle[] }
  | { status: "error"; message: string };

const LOOKUP_DELAY_MS = 300;
const publicationDateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeZone: "UTC",
});

export default function LocalArticles({ cityName }: { cityName: string }) {
  const [result, setResult] = useState<ArticleResult>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  // Delay briefly so rapid city changes can cancel before making a request.
  useEffect(() => {
    const controller = new AbortController();

    async function loadArticles() {
      try {
        const articles = await getLocalArticles(cityName, controller.signal);

        if (!controller.signal.aborted) {
          setResult({ status: "ready", articles });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load local articles.",
          });
        }
      }
    }

    const timer = window.setTimeout(() => void loadArticles(), LOOKUP_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cityName, attempt]);

  function retry() {
    setResult({ status: "loading" });
    setAttempt((previous) => previous + 1);
  }

  const articles = result.status === "ready" ? result.articles : [];
  const message =
    result.status === "loading"
      ? "Finding local weather articles…"
      : result.status === "error"
        ? result.message
        : articles.length === 0
          ? `No weather articles found for ${cityName}.`
          : "";

  return (
    <div className="local-articles">
      {/* Announce article progress using the shared loader without a location name. */}
      <div
        role="status"
        className={message ? "dashboard__description text-sm" : "sr-only"}
      >
        {result.status === "loading" ? (
          <LoadingState message="Finding local weather articles…" />
        ) : (
          <p>{message || `${articles.length} weather articles found.`}</p>
        )}
      </div>

      {result.status === "error" && (
        <button
          type="button"
          onClick={retry}
          className="min-h-11 self-start rounded-full border border-white/30 px-4 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Retry articles
        </button>
      )}

      {articles.length > 0 && (
        <ul className="local-articles__list">
          {articles.map((article) => (
            <li className="local-articles__item" key={article.url}>
              {/* Open the source separately and tell screen-reader users about the new tab. */}
              <a
                className="local-articles__link"
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {article.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <p className="dashboard__description text-xs">
                {article.source}
                {article.publishedAt && (
                  <>
                    {" · "}
                    <time dateTime={article.publishedAt}>
                      {publicationDateFormat.format(
                        new Date(article.publishedAt),
                      )}
                    </time>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
