export interface IObserverContextData {
    getActiveMap():string
    getContext():IContext
}

export interface IContext {
    getEvents():string[]
    getData():IContextData
}

export interface IContextData {
    getContextData():Map<string, Object>
}

export class ObserverContextData implements IObserverContextData {
    private activeMap:string;
    private context:IContext;

    constructor(activeMap:string, context:IContext) {
        this.activeMap = activeMap;
        this.context = context;
    }

    public getActiveMap():string {
        return this.activeMap
    }

    public getContext():IContext {
        return this.context
    }
}

export class Context implements IContext {
    private events:string[];
    private data:IContextData

    constructor(events:string[], data:IContextData) {
        this.events = events;
        this.data = data
    }

    getEvents():string[] {
        return this.events;
    }

    getData():IContextData {
        return this.data
    }
}

export class ContextData implements IContextData {
    private data:Map<string, Object>;

    constructor(data:Map<string, Object>) {
        this.data = data;
    }

    getContextData():Map<string, Object> {
        return this.data;
    }
}
