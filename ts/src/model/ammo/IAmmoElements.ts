interface AmmoObjectInterface {
    getAmmoListFromType(name:string)
}

export interface IAmmoElements {
    version: string;
    ammoType: AmmoType[];
}

export interface AmmoType {
    name: string;
    src: string;
    ammoList: Ammo[];
}

export interface Ammo {
    id: string;
    name: string;
    damage: number;
    penetration:number;
    recoil?:number;
    fragmentChance?:number;
    tier1:number;
    tier2:number;
    tier3:number;
    tier4:number;
    tier5:number;
    tier6:number;
}