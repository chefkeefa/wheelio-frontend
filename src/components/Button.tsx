/* eslint-disable @next/next/no-img-element */
import React from "react";

type ButtonAs = "button" | "div" | "span";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: string; // URL иконки
  type?: "button" | "submit" | "reset";
  as?: ButtonAs; // рисуем как <button> (по умолч.), либо как <div>/<span> (например, внутри Link)
}

export default function Button({
  children,
  onClick,
  className = "",
  icon,
  type = "button",
  as = "button",
}: ButtonProps) {
  const commonClasses =
    "flex items-center justify-center gap-3 rounded-lg bg-[#5f5f5f] font-semibold text-white transition-colors duration-300 hover:bg-[#d9a339]";

  if (as === "button") {
    return (
      <button type={type} onClick={onClick} className={`${commonClasses} ${className}`}>
        {icon && <img src={icon} alt="icon" className="h-5 w-5" />}
        {children}
      </button>
    );
  }

  const Tag = as;
  return (
    <Tag onClick={onClick} className={`${commonClasses} ${className}`}>
      {icon && <img src={icon} alt="icon" className="h-5 w-5" />}
      {children}
    </Tag>
  );
}
