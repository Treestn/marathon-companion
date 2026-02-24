import { SidePageQuestComponent } from "../components/SidePageQuestComponent";

export interface IQuestSidePageBuilder {
    addQuest(component:SidePageQuestComponent);
    build();
}