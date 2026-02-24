import { BitmapLayer } from "@deck.gl/layers";
import type { MapRaster } from "../../../../../model/map/MapRaster";
import type { MapFloorElementsData, Building } from "../../../../../model/floor/IMapFloorElements";
import type { CoordinateUtils } from "../../utils/coordinateUtils";

export type FloorHoverInfo = {
  buildingId: string;
  bounds: [[number, number], [number, number], [number, number], [number, number]];
  description: string;
  x: number;
  y: number;
};

export type FloorsModuleInput = {
  id: string;
  floors: MapFloorElementsData | null;
  raster: MapRaster | null;
  coord: CoordinateUtils | null;
  opacity?: number;
  onFloorClick?: (buildingId: string) => void;
  onFloorHover?: (info: FloorHoverInfo | null) => void;
};

type FloorImageData = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

const floorImageCache = new Map<string, FloorImageData | null>();
const FLOOR_ALPHA_THRESHOLD = 10;

const getNextFloorWithImage = (building: Building, currentFloorId: string) => {
  const floorsList = building.floors ?? [];
  const totalFloors = floorsList.length;
  if (totalFloors === 0) return null;
  const currentIndex = floorsList.findIndex((item) => item.UUID === currentFloorId);
  if (currentIndex === -1) return null;
  for (let step = 1; step <= totalFloors; step += 1) {
    const nextIndex = (currentIndex + step) % totalFloors;
    const candidate = floorsList[nextIndex];
    if (candidate?.image) return candidate;
  }
  return null;
};

const ensureFloorImageData = (imageUrl: string) => {
  if (floorImageCache.has(imageUrl)) return;
  floorImageCache.set(imageUrl, null);

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const floorData: FloorImageData = {
        width: canvas.width,
        height: canvas.height,
        data: imageData.data,
      };
      floorImageCache.set(imageUrl, floorData);
    } catch {
      floorImageCache.set(imageUrl, null);
    }
  };
  img.onerror = () => {
    floorImageCache.set(imageUrl, null);
  };
  img.src = imageUrl;
};

const getUvFromBounds = (
  bounds: [[number, number], [number, number], [number, number], [number, number]],
  lngLat: [number, number]
) => {
  const [bl, br, , tl] = bounds;
  const vx: [number, number] = [br[0] - bl[0], br[1] - bl[1]];
  const vy: [number, number] = [tl[0] - bl[0], tl[1] - bl[1]];
  const v: [number, number] = [lngLat[0] - bl[0], lngLat[1] - bl[1]];

  const dot = (a: [number, number], b: [number, number]) => a[0] * b[0] + a[1] * b[1];
  const u = dot(v, vx) / dot(vx, vx);
  const vCoord = dot(v, vy) / dot(vy, vy);

  if (u < 0 || u > 1 || vCoord < 0 || vCoord > 1) {
    return null;
  }

  return { u, v: vCoord };
};

const isOpaqueAt = (imageUrl: string, u: number, v: number) => {
  const imageData = floorImageCache.get(imageUrl);
  if (!imageData) return false;

  const x = Math.min(imageData.width - 1, Math.max(0, Math.floor(u * imageData.width)));
  const y = Math.min(
    imageData.height - 1,
    Math.max(0, Math.floor((1 - v) * imageData.height))
  );
  const index = (y * imageData.width + x) * 4 + 3;
  const alpha = imageData.data[index];
  return alpha > FLOOR_ALPHA_THRESHOLD;
};

const buildFloorBounds = (
  building: Building,
  coord: CoordinateUtils,
  offsetX: number,
  offsetY: number
): [[number, number], [number, number], [number, number], [number, number]] => {
  const halfWidth = building.width / 2;
  const halfHeight = building.height / 2;
  const cos = Math.cos((building.rotation * Math.PI) / 180);
  const sin = Math.sin((building.rotation * Math.PI) / 180);

  const centerX = building.x + offsetX + halfWidth;
  const centerY = building.y + offsetY + halfHeight;

  const corners = [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
  ].map(([dx, dy]) => {
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;
    const adjustedX = centerX + rotatedX;
    const adjustedY = centerY + rotatedY;
    return coord.pixelToLngLat(adjustedX, adjustedY);
  });

  // Ensure bounds are ordered as: bottom-left, bottom-right, top-right, top-left
  const centerLng = corners.reduce((sum, point) => sum + point[0], 0) / corners.length;
  const centerLat = corners.reduce((sum, point) => sum + point[1], 0) / corners.length;

  const sorted = corners
    .map((point) => ({
      point,
      angle: Math.atan2(point[1] - centerLat, point[0] - centerLng),
    }))
    .sort((a, b) => b.angle - a.angle) // clockwise
    .map(({ point }) => point);

  const bottomLeft = sorted.reduce((best, point) => {
    if (!best) return point;
    if (point[1] < best[1]) return point;
    if (point[1] === best[1] && point[0] < best[0]) return point;
    return best;
  }, null as [number, number] | null);

  if (!bottomLeft) return corners as [[number, number], [number, number], [number, number], [number, number]];

  const startIndex = sorted.findIndex(
    (point) => point[0] === bottomLeft[0] && point[1] === bottomLeft[1]
  );
  return [
    ...sorted.slice(startIndex),
    ...sorted.slice(0, startIndex),
  ] as [[number, number], [number, number], [number, number], [number, number]];
};

export function buildFloorsLayers({
  id,
  floors,
  raster,
  coord,
  opacity = 1,
  onFloorClick,
  onFloorHover,
}: FloorsModuleInput) {
  if (!floors || !raster || !coord) return [];

  const offsetX = raster.offsetX || 0;
  const offsetY = raster.offsetY || 0;

  return floors.elements
    .flatMap((building) => {
      if (!building.floors || building.floors.length === 0) return [];

      const bounds = buildFloorBounds(building, coord, offsetX, offsetY);

      return building.floors
        .filter((floor) => !!floor.image)
        .map((floor, index) => {
          const isActive = floor.active === true;
          if (isActive) {
            ensureFloorImageData(floor.image);
          }
          return new BitmapLayer({
            id: `${id}-${building.UUID}-${floor.UUID}-${index}`,
            image: floor.image,
            bounds,
            opacity: isActive ? opacity : 0,
            visible: isActive,
            pickable: isActive,
            alphaCutoff: 0.01,
            // Prevent bitmap from occluding icons when pitched
            parameters: { depthTest: false, depthMask: false },
            onClick: (info) => {
              if (!info?.picked || !info.coordinate) return;
              const uv = getUvFromBounds(bounds, info.coordinate as [number, number]);
              if (!uv) return;
              if (!isOpaqueAt(floor.image, uv.u, uv.v)) return;
              const nextFloor = getNextFloorWithImage(building, floor.UUID) ?? floor;
              if (nextFloor.image) {
                ensureFloorImageData(nextFloor.image);
              }
              onFloorHover?.({
                buildingId: building.UUID,
                bounds,
                description: nextFloor.description ?? building.description ?? "Floor",
                x: info.x ?? 0,
                y: info.y ?? 0,
              });
              onFloorClick?.(building.UUID);
            },
            onHover: (info) => {
              if (!info?.picked || !info.coordinate) {
                onFloorHover?.(null);
                return;
              }
              const uv = getUvFromBounds(bounds, info.coordinate as [number, number]);
              if (!uv || !isOpaqueAt(floor.image, uv.u, uv.v)) {
                onFloorHover?.(null);
                return;
              }
              onFloorHover?.({
                buildingId: building.UUID,
                bounds,
                description: floor.description ?? building.description ?? "Floor",
                x: info.x ?? 0,
                y: info.y ?? 0,
              });
            },
          });
        });
    });
}
