import { QuestComponent } from "../components/QuestComponent";

export interface IQuestBuilder {
    addQuest(component:QuestComponent);
    build();
}