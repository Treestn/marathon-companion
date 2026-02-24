export type MapCoordinateSystem =
  | {
      type: "image-pixels";
      origin: "top-left";
      units: "px";
    }
  | {
      type: "image-normalized";
      origin: "top-left";
      units: "0..1";
    };