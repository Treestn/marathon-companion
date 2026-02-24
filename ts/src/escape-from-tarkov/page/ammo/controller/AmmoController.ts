import { Ammo } from "../../../../model/ammo/IAmmoElements"
import { AmmoBodyBuilder } from "../builder/helper/AmmoBodyBuilder"

export class AmmoController {

    static addAmmoTypeDropdownEventListener(container:HTMLElement, ammoType:string, ammoList:Ammo[]) {
        container.addEventListener('click', () => {
            if(container.children.length != 1) {                
                AmmoBodyBuilder.removeContainerChildren(container)
                container.classList.remove("ammo-type-container-open")
            } else {
                AmmoBodyBuilder.createAmmoDropdown(container, ammoType, ammoList)
                container.scrollHeight;
                container.classList.add("ammo-type-container-open")
            }
        })
    }

}