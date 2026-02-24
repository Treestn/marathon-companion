import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation"

export class AmmoHeaderBuilder {

    static createAmmoTypeContainer(ammoName:string, src:string):HTMLElement {
        let container = HelperCreation.createDiv(ammoName, "ammo-type-container", "")
        container.appendChild(this.createAmmoTypeHeader(ammoName, src))
        return container
    }

    private static createAmmoTypeHeader(name:string, src:string):HTMLElement {
        let headerContainer = HelperCreation.createDiv("", "ammo-type-header-container", "")
        headerContainer.appendChild(this.createAmmoTypeHeaderImage(src))
        headerContainer.appendChild(this.createAmmoTypeHeaderName(name))
        return headerContainer
    }

    private static createAmmoTypeHeaderImage(src:string) {
        let container = HelperCreation.createDiv("", "ammo-type-image-header-container", "")
        container.appendChild(HelperCreation.createImage("", "ammo-type-image-header", src, ""))
        return container;
    }

    private static createAmmoTypeHeaderName(name:string):HTMLElement {
        let container = HelperCreation.createDiv("", "ammo-type-name-header-container", "")
        container.appendChild(HelperCreation.createB("ammo-type-name-header", name))
        return container;
    }
}