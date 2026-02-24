import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation";

export class AmmoPageBuilder {

    static createPage() {
        const runner = document.getElementById("runner-container");
        if(runner) {
            let runnerContainer = HelperCreation.createDiv("", "ammo-chart-container main-runner-container", "");
            let scrollContainer = HelperCreation.createDiv("", "ammo-chart-scroll scroll-div", "")

            runnerContainer.appendChild(scrollContainer)
            let container = HelperCreation.createDiv("ammo-parent-container", "ammo-parent", "")
            scrollContainer.appendChild(container)

            runner.insertBefore(runnerContainer, document.getElementsByClassName("side-page-container")[0]);
        }
    }

}