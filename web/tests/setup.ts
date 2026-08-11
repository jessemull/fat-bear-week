import "@testing-library/jest-dom/vitest";
import { toHaveNoViolations } from "jest-axe";
import { expect, vi } from "vitest";

expect.extend(toHaveNoViolations);

// Suppress expected error/warn output during tests

vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

// Allow server-only to be loaded from API route tests (Vitest runs in a single context)

vi.mock("server-only", () => ({}));

// Mock IntersectionObserver for scroll / observer-based UI tests

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;
