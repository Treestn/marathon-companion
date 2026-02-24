import { AmmoComponent } from "../../components/AmmoComponent";
import { AmmoController } from "../../controller/AmmoController";
import { IAmmoBuilder } from "../IAmmoBuilder";
import { AmmoHeaderBuilder } from "../helper/AmmoHeaderBuilder";
import { AmmoPageBuilder } from "../helper/AmmoPageBuilder";

export class AmmoBuilder implements IAmmoBuilder {

    ammoComponentList:AmmoComponent[] = [];

    addAmmoComponent(component:AmmoComponent) {
        this.ammoComponentList.push(component);
    }

    build() {
        this.buildPageShell();
        this.buildAmmoHeaders();
    }

    private buildPageShell() {
        AmmoPageBuilder.createPage();
    }

    private buildAmmoHeaders() {
        const wrapper = document.getElementById("ammo-parent-container");
        if(wrapper) {
            this.ammoComponentList.forEach(component => {
                let ammoTypeContainer = AmmoHeaderBuilder.createAmmoTypeContainer(component.ammoType.name, component.ammoType.src)
                AmmoController.addAmmoTypeDropdownEventListener(ammoTypeContainer, component.ammoType.name, component.ammoType.ammoList)
                wrapper.appendChild(ammoTypeContainer)
            })
        }
    }
}