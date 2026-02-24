// deck/useIconImagePaths.ts
import { useMemo } from "react";
import { MapGeoDocument } from "../../../../model/map/MapGeoDocument";

export function useIconImagePaths(
  mapDoc: MapGeoDocument | null,
  placeholderDataUri: string
): string[] {
  return useMemo(() => {
    if (!mapDoc) return [placeholderDataUri];

    const unique = new Set<string>();
    unique.add(placeholderDataUri);

    for (const group of mapDoc.groups ?? []) {
      if (group.icon?.imagePath) unique.add(group.icon.imagePath);

      for (const layer of group.layers ?? []) {
        if (layer.style?.iconImagePath) unique.add(layer.style.iconImagePath);

        for (const feature of layer.data?.features ?? []) {
          const props = feature.properties;
          if (!props) continue;
          if (props.image) unique.add(props.image);
          for (const img of props.imageList ?? []) unique.add(img);
          if (props.style?.icon) unique.add(props.style.icon);
        }
      }
    }

    return Array.from(unique).sort();
  }, [mapDoc, placeholderDataUri]);
}
