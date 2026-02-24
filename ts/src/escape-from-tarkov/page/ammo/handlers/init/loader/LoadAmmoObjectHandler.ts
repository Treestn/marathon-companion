import { IAmmoElements } from "../../../../../../model/ammo/IAmmoElements";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { AmmoUtils } from "../../../utils/AmmoUtils";
import { AmmoInitRequest } from "../../request/AmmoInitRequest";

export class LoadAmmoObjectHandler extends AbstractChainHandler {

    handle(request: AmmoInitRequest) {
        if(!AmmoUtils.isAmmoRefreshed()) {
            const storedAmmo = AmmoUtils.getStoredData();
            if(storedAmmo) {
                let data:IAmmoElements = JSON.parse(storedAmmo)
                if(data) {
                    request.storedAmmo = data;
                }
            }
        }
    }

}