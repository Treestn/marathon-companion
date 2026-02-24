import { useState } from "react";

export type FullscreenState = {
  images: string[];
  index: number | null;
  elementName: string;
  open: (images: string[], elementName: string, startIndex?: number) => void;
  close: () => void;
  previous: () => void;
  next: () => void;
};

export const useFullscreenState = (): FullscreenState => {
  const [images, setImages] = useState<string[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const [elementName, setElementName] = useState<string>("");

  const open = (nextImages: string[], nextElementName: string, startIndex: number = 0) => {
    setImages(nextImages);
    setIndex(startIndex);
    setElementName(nextElementName);
  };

  const close = () => {
    setIndex(null);
    setImages([]);
    setElementName("");
  };

  const previous = () => {
    setIndex((prev) => {
      if (prev === null) return null;
      return prev > 0 ? prev - 1 : images.length - 1;
    });
  };

  const next = () => {
    setIndex((prev) => {
      if (prev === null) return null;
      return prev < images.length - 1 ? prev + 1 : 0;
    });
  };

  return {
    images,
    index,
    elementName,
    open,
    close,
    previous,
    next,
  };
};
