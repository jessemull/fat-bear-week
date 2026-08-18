// Lighthouse CI — measures production build via `next start` (not `next dev`).
// Build first: `npm run build` (or `make lighthouse`, which builds).

const productionUrl = process.env.LHCI_URL || "https://www.fatbearweek.net";
const localUrl = process.env.LHCI_URL || "http://localhost:3000";

const isProduction = process.env.NODE_ENV === "production";
const skipServerStart =
  process.env.LHCI_NO_SERVER === "true" || isProduction;

module.exports = {
  ci: {
    assert: {
      assertions: {
        // Perf floor is intentionally low (noisy CI runners); a11y/seo/bp stay strict.
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:performance": ["error", { minScore: 0.5 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    collect: {
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--headless --no-sandbox --disable-gpu",
        formFactor: "mobile",
        screenEmulation: {
          deviceScaleFactor: 1.75,
          disabled: false,
          height: 823,
          mobile: true,
          width: 412,
        },
      },
      url: isProduction ? productionUrl : localUrl,
      ...(skipServerStart
        ? {}
        : {
            startServerCommand: "npm run start",
            startServerReadyPattern: "Ready",
          }),
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
