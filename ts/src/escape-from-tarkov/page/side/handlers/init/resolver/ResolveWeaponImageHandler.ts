import { PopupHelper } from "../../../../../../popup/PopupHelper";
import { AppPopupMessagesConst } from "../../../../../constant/AppPopupMessages";
import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { WeaponImageUtils } from "../../../../../utils/WeaponImageUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class ResolveWeaponImageHandler extends AbstractChainHandler {
   
    handle(request: SidePageInitQuestRequest) {
        if(request.weaponImage && request.storedWeaponImage) {
            // Updating
            WeaponImageUtils.setWeaponImage(request.weaponImage)
            WeaponImageUtils.save()

        } else if(request.weaponImage && !request.storedWeaponImage) {
            // First time or just deleted the stored data
            WeaponImageUtils.setWeaponImage(request.weaponImage);
            WeaponImageUtils.save()

        } else if(!request.weaponImage && request.storedWeaponImage) {
            // Version did not change
            WeaponImageUtils.setWeaponImage(request.storedWeaponImage);
            request.weaponImage = request.storedWeaponImage

        } else {
            //Server is down and nothing is stored
            PopupHelper.addFatalPopup(AppPopupMessagesConst.FATAL_ERROR_NO_CONFIG, 
                "Items config is missing")
        }
    }

}