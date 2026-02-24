import { AbstractChainHandler } from "../../../../../types/abstract/AbstractChainHandler";
import { WeaponImageUtils } from "../../../../../utils/WeaponImageUtils";
import { SidePageInitQuestRequest } from "../../request/SidePageInitQuestRequest";

export class LoadWeaponImageHandler extends AbstractChainHandler {

    handle(request: SidePageInitQuestRequest) {
        const data = WeaponImageUtils.getStoredData();
        if(data) {
            const weaponImages = JSON.parse(data)
            request.storedWeaponImage = weaponImages;
        } else {
            console.log("No items elements saved");
        }
    }

}