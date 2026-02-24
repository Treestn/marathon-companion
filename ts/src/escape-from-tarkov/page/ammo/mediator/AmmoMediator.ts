import { IChainMediator } from "../../../types/IChainMediator";
import { IMediator } from "../../../types/IMediator";
import { AmmoComponent } from "../components/AmmoComponent";
import { AmmoChain } from "../handlers/chain/AmmoChain";
import { AmmoInitChain } from "../handlers/init/AmmoInitChain";
import { AmmoInitRequest } from "../handlers/request/AmmoInitRequest";
import { AmmoRequest } from "../handlers/request/AmmoRequest";


export class AmmoMediator implements IMediator {

    private static chainMediator:IChainMediator;
    private componentList:AmmoComponent[] = [];
    
    constructor() {
    }

    async init() {
        // const mapDiv = document.getElementById("mapDiv");
        // if(mapDiv) {
        //     mapDiv.parentElement.remove();
        // }
        this.clear();
        // MapUtils.reset();
        AmmoMediator.chainMediator = new AmmoChain()
        await new AmmoInitChain().handle(new AmmoInitRequest(this));
    }

    update(request: AmmoRequest) {
        // if(!request.pageMediator) {
        //     request.pageMediator = this.questPageMediator;
        // }
        // if(!request.sidePageMediator) {
        //     request.sidePageMediator = this.sideQuestPageMediator;
        // }
        AmmoMediator.chainMediator.handle(request);
    }

    add(component:AmmoComponent) {
        this.componentList.push(component)
    }
   
    clear() {
        this.componentList = [];
    }
}