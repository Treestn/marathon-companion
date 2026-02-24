import { AmmoType } from "../../../../model/ammo/IAmmoElements";

export class AmmoComponent {

    ammoType:AmmoType

    constructor(ammoType:AmmoType) {
        this.ammoType = ammoType
    }
}