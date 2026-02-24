import { IRequest } from "../../types/IRequest";
import { AbstractPageMediator } from "../mediator/impl/AbstractPageMediator";
import { AmmoMediator } from "./mediator/AmmoMediator";

export class AmmoPageMediator extends AbstractPageMediator {

    savedPage: HTMLElement;
    private mediator:AmmoMediator;

    async load() {
        await super.removePreviousRunner();

        if(!this.savedPage) {
            if(!this.mediator) {
                this.mediator = new AmmoMediator();
            }
            await this.mediator.init();
        } else {
            await super.loadSavePage("Could not load Map Page");
        }
    }

    update(request: IRequest) {
        throw new Error("Method not implemented.");
    }


    save() {
        const runnersList = document.getElementsByClassName("main-runner-container")

        if(runnersList.length === 1 && runnersList[0] instanceof HTMLElement) {
            this.savedPage = runnersList[0] as HTMLElement
        }
    }
}