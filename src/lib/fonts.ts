/**
 * Shared typography class.
 *
 * We intentionally avoid `next/font/google` here. Some deployment builders
 * cannot resolve Google font metadata during `next build`, which makes the
 * whole deployment fail. Tailwind's `font-sans` keeps typography responsive
 * and uses the project's/system sans-serif stack without a network font fetch.
 */
export const anybody = {
  className: "font-sans",
} as const;
