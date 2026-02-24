export const OverwolfStates = {
    UNSUPPORTED: {name: "unsupported", status: 0},
    UP: {name:"Good to go", status: 1},
    PARTIALLY_UP: {name: "Partially working", status: 2},
    DOWN: {name: "Down", status: 3}
}

export type OverwolfEventStatusResponse = {
    game_id: string;
    state: number;
    features: OverwolfEventFeatureStatus[]
}

export type OverwolfEventFeatureStatus = {
    name: string;
    state: number;
    keys: OverwolfKeyStatus[]
}

export type OverwolfKeyStatus = {
    name:string;
    type: number;
    state: number;
}