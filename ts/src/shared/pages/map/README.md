# Map Component Architecture

## Overview

This map system uses **deck.gl** layers directly for rendering icons and polygons on top of MapLibre GL JS.

## Architecture

- **MapView.tsx**: Base map component with MapLibre
- **MapDeckGLLayer.tsx**: deck.gl integration using MapboxOverlay for icons and polygons
- **utils/IconLayerManager.ts**: Manages icon data and creates deck.gl IconLayer instances
- **utils/coordinateUtils.ts**: Converts pixel coordinates to lat/lng

## Features

### ✅ Icons
- Display icons from filters JSON
- Hover/click interactions
- Customizable size and color
- Icon atlas for efficient rendering

### ✅ Polygons
- Draw building polygons
- Customizable fill and stroke

## Usage

The map uses deck.gl layers directly through `MapDeckGLLayer` component, which integrates with MapLibre using `MapboxOverlay`. Icons are managed by `IconLayerManager` which creates deck.gl `IconLayer` instances.

