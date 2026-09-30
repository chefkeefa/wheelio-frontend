// src/lib/fonts.ts
import { Anybody } from "next/font/google";

/**
 * Единый инстанс шрифта Anybody.
 * Подключаем веса 700 (bold) и 800 (extrabold), display: swap.
 */
export const anybody = Anybody({
  subsets: ["latin", "latin-ext"],
  weight: ["700", "800"],
  display: "swap",
});
