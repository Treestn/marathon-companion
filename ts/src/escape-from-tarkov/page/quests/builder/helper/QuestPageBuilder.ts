import { HelperCreation } from "../../../../service/MainPageCreator/HelperCreation"

export class QuestPageBuilder {

    static createQuestRunner() {

        const runner = document.getElementById("runner-container");
        if(runner) {
            let questsDiv = HelperCreation.createDiv("quests-runner", "quests-container main-runner-container", "")

            let questRunner = HelperCreation.createDiv("questsDiv", "questRunner runner", "")
            let scrollDiv = HelperCreation.createDiv("quests-page-scroll-div", "scroll-div", "")
            // scrollDiv.style.backgroundColor = "var(--main-quest-background-color);"
            scrollDiv.appendChild(this.createQuestEntity())
            questRunner.appendChild(scrollDiv)
    
            questsDiv.appendChild(questRunner)
    
            runner.insertBefore(questsDiv, document.getElementsByClassName("side-page-container")[0]);
        }
    }
    
    

    private static createQuestEntity(): HTMLElement {
        return HelperCreation.createDiv("quests-entity-parent", "quests-entity", "")
    }

}