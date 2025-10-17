"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallback?: string;
}

export function Avatar({
  src,
  alt = "Avatar",
  size = "md",
  className,
  fallback = "?",
}: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={
            size === "sm"
              ? "32px"
              : size === "md"
                ? "40px"
                : size === "lg"
                  ? "48px"
                  : "64px"
          }
        />
      ) : (
        fallback
      )}
    </div>
  );
}
