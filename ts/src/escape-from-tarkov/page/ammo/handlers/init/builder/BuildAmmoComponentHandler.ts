import { AmmoType } from "../../../../../../model/ammo/IAmmoElements";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { AmmoComponent } from "../../../components/AmmoComponent";
import { AmmoUtils } from "../../../utils/AmmoUtils";
import { AmmoInitRequest } from "../../request/AmmoInitRequest";

export class BuildAmmoComponentHandler extends AbstractChainHandler {

    handle(request: AmmoInitRequest) {

        AmmoUtils.getAmmoObject().ammoType.forEach(ammoType => {
            const component = this.buildAmmoComponent(ammoType);
            request.builder.addAmmoComponent(component);
        })

    }

    private buildAmmoComponent(ammoType:AmmoType) {
        return new AmmoComponent(ammoType);
    }
}