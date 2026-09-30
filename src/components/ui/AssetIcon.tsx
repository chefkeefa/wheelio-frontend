import type { CSSProperties } from "react";

/** File names in public/icons (without .svg). */
export type AssetIconName =
  | "alert-circle"
  | "arrow-left"
  | "arrow-right"
  | "bolt"
  | "bookmark"
  | "calendar"
  | "car"
  | "car-side"
  | "check"
  | "check-circle"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "clock"
  | "close"
  | "download"
  | "edit"
  | "euro"
  | "external-link"
  | "eye"
  | "filter"
  | "fuel"
  | "gauge"
  | "globe"
  | "grid"
  | "heart"
  | "heart-filled"
  | "help"
  | "image"
  | "key"
  | "list"
  | "logout"
  | "mail"
  | "map-pin"
  | "menu"
  | "minus"
  | "moon"
  | "motorcycle"
  | "phone"
  | "plus"
  | "reset"
  | "search"
  | "send"
  | "settings"
  | "share"
  | "shield"
  | "sort"
  | "spinner"
  | "star"
  | "sun"
  | "support-chat"
  | "transmission"
  | "trash"
  | "truck"
  | "upload"
  | "user"
  | "user-plus";

/** Monochrome SVG from public/icons rendered as a CSS mask, so it inherits the current text color in both themes. */
export default function AssetIcon({
  name,
  size = 20,
  className = "",
}: {
  name: AssetIconName;
  size?: number;
  className?: string;
}) {
  const mask = `url(/icons/${name}.svg)`;
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: "currentColor",
    maskImage: mask,
    WebkitMaskImage: mask,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskSize: "contain",
    WebkitMaskSize: "contain",
  };

  return <span aria-hidden="true" className={`inline-block shrink-0 align-middle ${className}`} style={style} />;
}
