import { IRequest } from "../../../types/IRequest";
import { IPageMediator } from "../IPageMediator";

export abstract class AbstractPageMediator implements IPageMediator {

    savedPage: HTMLElement;

    async removePreviousRunner() {
        const runnersList = document.getElementsByClassName("main-runner-container")

        if(runnersList.length > 0) {
            for(const runner of runnersList) {
                if(runner instanceof HTMLElement) {
                    // Preserve interactive-map container - hide it instead of removing
                    if (runner.id === 'interactive-map-runner') {
                        const interactiveMapContainer = runner as HTMLDivElement;
                        interactiveMapContainer.style.display = 'none';
                        interactiveMapContainer.style.visibility = 'hidden';
                        // Detach from DOM but keep reference globally
                        if (interactiveMapContainer.parentElement) {
                            interactiveMapContainer.parentElement.removeChild(interactiveMapContainer);
                        }
                        // Store reference globally
                        if (typeof window !== 'undefined') {
                            (window as any).__interactiveMapContainer = interactiveMapContainer;
                        }
                    } else {
                        runner.remove();
                    }
                }
            }
        }
    }

    async loadSavePage(error:string) {
        const sidePage = document.getElementById("side-page-container");
        const runnerDiv = document.getElementById("runner-container");
        if(runnerDiv && sidePage) {
            runnerDiv.insertBefore(this.savedPage, sidePage)
        } else {
            console.log(`Loading saved page error: ${error}`);
        }
    }

    abstract load();

    save() {
        const runnersList = document.getElementsByClassName("main-runner-container")

        if(runnersList.length === 1 && runnersList[0] instanceof HTMLElement) {
            this.savedPage = runnersList[0] as HTMLElement
        }
    }


    abstract update(request:IRequest);
    
}