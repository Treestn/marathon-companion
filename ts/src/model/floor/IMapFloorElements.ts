export interface MapFloorElementsData {
    id: string;
    map: string;
    version: string;
    isPrivate?: boolean;
    elements: Building[];
}

export interface Building {
    UUID: string;
    description: string;
    height: number;
    width: number;
    x: number;
    y: number;
    rotation: number;
    floors: Floor[];
}

export interface Floor {
    UUID: string;
    image: string;
    active?: boolean | false;
    description?: string;
    z_index?: number;
}