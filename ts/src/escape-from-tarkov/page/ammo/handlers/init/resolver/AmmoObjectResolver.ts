import { PopupHelper } from "../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../constant/AppPopupMessages";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { AmmoUtils } from "../../../utils/AmmoUtils";
import { AmmoInitRequest } from "../../request/AmmoInitRequest";

export class AmmoObjectResolverHandler extends AbstractChainHandler {

    handle(request:AmmoInitRequest) {
        if(request.ammo && request.storedAmmo) {
            // Updating
            AmmoUtils.setAmmoObject(request.ammo);
            AmmoUtils.save()

        } else if(request.ammo && !request.storedAmmo) {
            // First time or just deleted the stored data
            AmmoUtils.setAmmoObject(request.ammo);
            AmmoUtils.save()

        } else if(!request.ammo && request.storedAmmo) {
            // Version did not change
            request.ammo = request.storedAmmo
            AmmoUtils.setAmmoObject(request.ammo);
            AmmoUtils.save()
        
        } else if(AmmoUtils.isAmmoRefreshed()) {
            request.ammo = AmmoUtils.getAmmoObject();
        } else {
            //Server is down and nothing is stored
            PopupHelper.addFatalPopup(AppPopupMessagesConst.FATAL_ERROR_NO_CONFIG, 
                "Ammo config is missing")
        }
    }
}