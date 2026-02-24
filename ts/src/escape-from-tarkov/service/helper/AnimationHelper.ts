import { AnimationCreator } from "../MainPageCreator/AnimationCreator"

export class AnimationHelper {
    static async addLoadingMapGif() {
        document.getElementById("mapDiv").appendChild(AnimationCreator.createMapAnimationDiv())
    }

    static removeLoadingMapGif() {
        document.getElementById("loading").remove();
    }
}