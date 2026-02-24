import { LogoPathConst } from "../../constant/ImageConst";
import { HelperCreation } from "./HelperCreation";

export class AnimationCreator {
  static createMapAnimationDiv():HTMLElement {
    let gifDiv = HelperCreation.createDiv("loading", "gifLoadingDiv", "");
    gifDiv.appendChild(HelperCreation.createImage("loadingScreen","gifLoading",LogoPathConst.LOADING_GIF,""));
    return gifDiv;
  }
}
