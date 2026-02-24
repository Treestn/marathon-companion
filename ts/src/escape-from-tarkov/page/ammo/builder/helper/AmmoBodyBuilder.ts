import { I18nHelper } from "../../../../../locale/I18nHelper";
import { LogoPathConst } from "../../../../constant/ImageConst";
import { Ammo } from "../../../../../model/ammo/IAmmoElements";
import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";
import { ItemsElementUtils } from "../../../../utils/ItemsElementUtils";
import { ImageUtils } from "../../../map/utils/ImageUtils";

export class AmmoBodyBuilder {

    static createAmmoDropdown(parent:HTMLElement, ammoType:string, ammoList:Ammo[]) {
        let container = HelperCreation.createDiv("", "ammos-content-container", "");

        container.appendChild(this.createFilters());
        let i = 0;
        ammoList.forEach(ammo => {
            let ammoContent = this.createAmmoContent(ammoType, ammo)
            container.appendChild(ammoContent)
            if(i % 2 == 0) {
                ammoContent.setAttribute('style', "background: var(--main-bg-color)")
            } else {
                ammoContent.setAttribute('style', "background: var(--header-color)")
            }
            i++;
        })

        parent.appendChild(container)
    }

    private static createAmmoContent(ammoType:string, ammo:Ammo):HTMLElement {
        let container = HelperCreation.createDiv("ammo-runner", "ammo-content-container", "");

        container.appendChild(this.createAmmoImage(ammo))
        container.appendChild(this.createAmmoName(ammo.name))
        container.appendChild(this.createAmmoSpecContainer(ammo.damage.toString(), "ammo-damage-container"))
        container.appendChild(this.createAmmoSpecContainer(ammo.penetration.toString(), "ammo-penetration-container"))
        container.appendChild(this.createAmmoSpecContainer(ammo.fragmentChance.toString(), "ammo-frag-chance-container"))
        if(ammo.recoil != null) {
            let recoil = this.createAmmoSpecContainer(ammo.recoil.toString(), "ammo-recoil-container")
            container.appendChild(recoil)
            if(ammo.recoil > 0) {
                recoil.setAttribute('style', "color: red;")
            } else if(ammo.recoil < 0) {
                recoil.setAttribute('style', "color: #45E000;")
            }
        } else {
            container.appendChild(this.createAmmoSpecContainer("", "ammo-recoil-container"))
        }
        container.appendChild(this.createAmmoTierContainer(ammo.tier1))
        container.appendChild(this.createAmmoTierContainer(ammo.tier2))
        container.appendChild(this.createAmmoTierContainer(ammo.tier3))
        container.appendChild(this.createAmmoTierContainer(ammo.tier4))
        container.appendChild(this.createAmmoTierContainer(ammo.tier5))
        container.appendChild(this.createAmmoTierContainer(ammo.tier6))

        return container
    }

    private static createFilters():HTMLElement {
        let container = HelperCreation.createDiv("", "ammo-filter-container", "")
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.img"), "ammo-filter-image-container ammo-filter ammo-info"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.name"), "ammo-name-container ammo-filter ammo-info ammo-filter-border"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.dmg"), "ammo-info ammo-filter ammo-filter-border ammo-filter-width"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.pen"), "ammo-info ammo-filter ammo-filter-border ammo-filter-width"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.frag"), "ammo-info ammo-filter ammo-filter-border ammo-filter-width"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.recoil"), "ammo-info ammo-filter ammo-filter-border ammo-filter-width"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.tier1"), "ammo-info ammo-filter ammo-filter-border ammo-filter-width"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.tier2"), "ammo-info ammo-filter ammo-filter-border ammo-filter-width"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.tier3"), "ammo-info ammo-filter ammo-filter-border ammo-filter-width"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.tier4"), "ammo-info ammo-filter ammo-filter-border ammo-filter-width"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.tier5"), "ammo-info ammo-filter ammo-filter-border ammo-filter-width"))
        container.appendChild(this.createFilter(I18nHelper.get("pages.ammo.body.tier6"), "ammo-info ammo-filter ammo-filter-border ammo-filter-width"))

        return container
    }

    private static createFilter(name:string, _class:string) {
        let container = HelperCreation.createDiv("", _class, "");
        container.appendChild(HelperCreation.createB("ammo-name", name))
        return container
    }

    private static createAmmoImage(ammo:Ammo):HTMLElement {
        let container = HelperCreation.createDiv("", "ammo-image-container ammo-info", "")

        const image:HTMLImageElement = HelperCreation.createImage("", "ammo-image", LogoPathConst.LOGO_WHITE_256_BLUE_SIDE, "");

        const path = ItemsElementUtils.getImagePath(ammo.id)

        try{
            if(path.includes("overwolf-extension://elkagffjjeonbcmfpdndkckppafabjeklmdidong")) {
                console.log("What happened?");
            }
            image.src = path;
        } catch(e) {
            ImageUtils.onImageLoadError(image, path);
        }

        container.appendChild(image)
        return container
    }

    private static createAmmoName(name:string):HTMLElement {
        let container = HelperCreation.createDiv("", "ammo-name-container ammo-info", "");
        container.appendChild(HelperCreation.createB("ammo-name", name))
        return container
    }

    private static createAmmoSpecContainer(spec:string, _class:string):HTMLElement {
        let container = HelperCreation.createDiv("", _class + " ammo-info ammo-width", "")
        container.appendChild(HelperCreation.createB("ammo-spec", spec))
        return container
    }

    private static createAmmoTierContainer(spec:number) {
        let container = HelperCreation.createDiv("", "ammo-tier-container ammo-info ammo-width", "")
        container.appendChild(HelperCreation.createB("ammo-spec", spec.toString()))

        switch (spec) {
            case 0: container.setAttribute('style', "background-color: #550404;"); break;
            case 1: container.setAttribute('style', "background-color: #81402f;"); break;
            case 2: container.setAttribute('style', "background-color:rgb(157 108 79);"); break; 
            case 3: container.setAttribute('style', "background-color: #a7813f;"); break; 
            case 4: container.setAttribute('style', "background-color:rgb(167 153 64);"); break; 
            case 5: container.setAttribute('style', "background-color: #869537"); break; 
            case 6: container.setAttribute('style', "background-color: #6f932c"); break; 
        }

        return container
    }

    static removeContainerChildren(container:HTMLElement) {
        this.removeChildNodes(container)
    }

    private static removeChildNodes(parent: HTMLElement) {
        let _childs = parent.children
        Array.from(_childs).forEach(child => {
            if(child.getAttribute('class') != "ammo-type-header-container"){
                child.remove()
            }
        })
    }  

}