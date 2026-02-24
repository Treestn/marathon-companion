import { AsyncAbstractChainMediator } from "../../../../types/abstract/AsyncAbstractChainMediator";
import { BuildAmmoComponentHandler } from "./builder/BuildAmmoComponentHandler";
import { BuildAmmoPageHandler } from "./builder/BuildAmmoPageHandler";
import { FetchAmmoObjectHandler } from "./fetch/FetchAmmoObjectHandler";
import { LoadAmmoObjectHandler } from "./loader/LoadAmmoObjectHandler";
import { AmmoObjectResolverHandler } from "./resolver/AmmoObjectResolver";

export class AmmoInitChain extends AsyncAbstractChainMediator {

    constructor() {
        super()
        this.init()
    }
    
    init() {
        if(this.entryPoint) {
            return;
        }
        const loadAmmoHandler = new LoadAmmoObjectHandler();
        const fetchAmmoHandler = new FetchAmmoObjectHandler();
        const resolveAmmoHandler = new AmmoObjectResolverHandler();
        const buildAmmoHandler = new BuildAmmoComponentHandler();
        const buildAmmoPageHandler = new BuildAmmoPageHandler();

        this.entryPoint = loadAmmoHandler;
        loadAmmoHandler.setNext(fetchAmmoHandler);
        fetchAmmoHandler.setNext(resolveAmmoHandler)
        resolveAmmoHandler.setNext(buildAmmoHandler);
        buildAmmoHandler.setNext(buildAmmoPageHandler);

    }
}