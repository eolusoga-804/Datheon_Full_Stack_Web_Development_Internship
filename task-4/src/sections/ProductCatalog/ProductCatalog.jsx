// These hooks manage catalog search state and the global shortcut listener.
import { useEffect, useRef, useState } from "react";
import useProducts from "../../hooks/useProducts";
import { storeContent } from "../../data/storeContent";
import ProductCard from "../../components/ProductCard/ProductCard";
import ProductLoading from "../../components/ProductLoading/ProductLoading";
import "./ProductCatalog.css";

export default function ProductCatalog({ onAddToCart }) {
  const { products, status, error, retry } = useProducts();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("featured");

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "all" ||
      (activeCategory === "clothing" &&
        product.category.includes("clothing")) ||
      product.category === activeCategory;

    const searchableText =
      `${product.title} ${product.description} ${product.category}`.toLowerCase();
    const matchesSearch = searchableText.includes(
      searchTerm.trim().toLowerCase(),
    );

    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts];

  if (sortOrder === "price-ascending") {
    sortedProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === "price-descending") {
    sortedProducts.sort((a, b) => b.price - a.price);
  } else if (sortOrder === "rating") {
    sortedProducts.sort(
      (a, b) => (b.rating?.rate ?? 0) - (a.rating?.rate ?? 0),
    );
  }

  // This ref lets the keyboard shortcut focus the search field.
  const searchInputRef = useRef(null);

  // This check selects the shortcut label that matches the current platform.
  const platform = navigator.userAgentData?.platform ?? navigator.platform;
  const isApplePlatform = /Mac|iPhone|iPad|iPod/i.test(platform);
  const searchShortcutLabel = isApplePlatform
    ? storeContent.catalog.appleSearchShortcutLabel
    : storeContent.catalog.standardSearchShortcutLabel;

  // This state shows the search tip until the shopper dismisses it once.
  const [isSearchTipOpen, setIsSearchTipOpen] = useState(() => {
    try {
      return (
        window.localStorage.getItem(
          storeContent.catalog.searchTip.storageKey,
        ) !== "dismissed"
      );
    } catch {
      return true;
    }
  });

  // This handler closes the tip and remembers the dismissal for future visits.
  function dismissSearchTip() {
    setIsSearchTipOpen(false);

    try {
      window.localStorage.setItem(
        storeContent.catalog.searchTip.storageKey,
        "dismissed",
      );
    } catch {
      // This fallback keeps the tip dismissible when browser storage is unavailable.
    }
  }

  // This listener focuses the search field when the shopper presses Ctrl+K or Command+K.
  useEffect(() => {
    function handleSearchShortcut(event) {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.ctrlKey && !event.metaKey) ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
    }

    window.addEventListener("keydown", handleSearchShortcut);

    return () => {
      window.removeEventListener("keydown", handleSearchShortcut);
    };
  }, []);

  return (
    <section
      className="product-catalog"
      id="catalog"
      aria-labelledby="product-catalog-title"
    >
      {/* This first-visit tip explains how to reach product search. */}
      {isSearchTipOpen && (
        <aside
          className="product-catalog__search-tip"
          aria-label={storeContent.catalog.searchTip.label}
        >
          <p className="product-catalog__search-tip-copy">
            <span className="product-catalog__search-tip-compact">
              {storeContent.catalog.searchTip.compactInstruction}
            </span>
            <span className="product-catalog__search-tip-wide">
              {storeContent.catalog.searchTip.wideInstruction}{" "}
              <kbd>{searchShortcutLabel}</kbd>
            </span>
          </p>

          {/* This button dismisses the tip and focuses the search input. */}
          <button
            className="product-catalog__search-tip-action"
            type="button"
            aria-controls="product-search-input"
            onClick={() => {
              searchInputRef.current?.focus();
              dismissSearchTip();
            }}
          >
            {storeContent.catalog.searchTip.actionLabel}
          </button>

          {/* This button closes the tip without opening search. */}
          <button
            className="product-catalog__search-tip-close"
            type="button"
            aria-label={storeContent.catalog.searchTip.dismissLabel}
            onClick={dismissSearchTip}
          >
            ×
          </button>
        </aside>
      )}

      <div className="product-catalog__heading">
        <div>
          <p className="product-catalog__eyebrow">
            {storeContent.catalog.description}
          </p>
          <h2 className="product-catalog__title" id="product-catalog-title">
            {storeContent.catalog.title}
          </h2>
        </div>
      </div>

      <div className="product-catalog__tools">
        {/* This label places the platform-specific shortcut hint inside the search field. */}
        <label className="product-catalog__search">
          <span className="product-catalog__search-label">
            {storeContent.catalog.searchLabel}
          </span>

          {/* This wrapper positions the shortcut hint within the input outline. */}
          <span className="product-catalog__search-control">
            <input
              ref={searchInputRef}
              className="product-catalog__search-input"
              type="search"
              value={searchTerm}
              placeholder={storeContent.catalog.searchPlaceholder}
              aria-keyshortcuts="Control+K Meta+K"
              onChange={(event) => setSearchTerm(event.target.value)}
              id="product-search-input"
            />
            <kbd
              className="product-catalog__search-shortcut"
              aria-hidden="true"
            >
              {searchShortcutLabel}
            </kbd>
          </span>
        </label>

        <label className="product-catalog__sort">
          <span className="product-catalog__search-label">
            {storeContent.catalog.sortLabel}
          </span>
          <select
            className="product-catalog__sort-select"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            {storeContent.catalog.sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="product-catalog__filters"
        role="group"
        aria-label={storeContent.catalog.categoryLabel}
      >
        {storeContent.catalog.categories.map((category) => (
          <button
            className="product-catalog__filter"
            key={category.id}
            type="button"
            aria-pressed={activeCategory === category.id}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* This live count updates when search or category filters change. */}
      {status === "success" && (
        <p className="product-catalog__count" aria-live="polite">
          <strong className="product-catalog__count-number">
            {sortedProducts.length}
          </strong>
          <span>{storeContent.catalog.resultsCountLabel}</span>
        </p>
      )}

      {status === "loading" && <ProductLoading />}

      {status === "error" && (
        <div className="product-catalog__error" role="alert">
          <p className="product-catalog__message">{error}</p>
          <button
            className="product-catalog__retry"
            type="button"
            onClick={retry}
          >
            {storeContent.catalog.retryLabel}
          </button>
        </div>
      )}

      {status === "success" && sortedProducts.length === 0 && (
        <p className="product-catalog__message">
          {storeContent.catalog.emptyMessage}
        </p>
      )}

      {status === "success" && sortedProducts.length > 0 && (
        <div className="product-catalog__grid">
          {/* This mapping gives each product card a staggered entrance delay. */}
          {sortedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </section>
  );
}
