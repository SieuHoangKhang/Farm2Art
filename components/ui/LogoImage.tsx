"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useState } from "react";

const PRIMARY_SRC = "/images/logo.png";
const FALLBACK_SRC = "/images/logo.svg";

type LogoImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "onError"> & {
  alt?: string;
};

export function LogoImage({ alt = "Farm2Art", className = "", ...props }: LogoImageProps) {
  const [src, setSrc] = useState(PRIMARY_SRC);

  const handleError = useCallback(() => {
    setSrc((current) => (current === FALLBACK_SRC ? current : FALLBACK_SRC));
  }, []);

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      onError={handleError}
      className={`h-full w-full ${className}`}
      loading="eager"
    />
  );
}
