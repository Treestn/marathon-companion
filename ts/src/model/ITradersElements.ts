export interface TradersObject {
    version?: string;
    traders: Trader[];
}

export interface Trader {
    name: string;
    items: Item[];
}

export interface Item {
    UUID:string;
    itemName: string;
    type:string;
    level:number;
    width?:number;
    height?:number;
    tradeItems?:TradeObject[]
}

export interface TradeObject {
    amount:number;
    item:string;
}

interface ITradersElements {
    getTradersList(): Trader[];
    getTrader(name:string):Trader;
    getTraderItems(name:string):Item[];
    getTraderItemsByLevel(name:string, level:number):Item[];
}

// import tradersJSON from '../../ressources/traders/traders.json';

export class TradersElement implements ITradersElements {

    private static instance: TradersElement;
    private static tradersObject: TradersObject

    private constructor() {
    }

    static getInstance():TradersElement {
        if (!TradersElement.instance) {
            TradersElement.instance = new TradersElement();
            // TradersElement.tradersObject = JSON.parse(JSON.stringify(tradersJSON));
        }
        return TradersElement.instance;
    }

    getTradersList(): Trader[] {
        return TradersElement.tradersObject.traders
    }

    getTrader(name: string): Trader {
        return TradersElement.tradersObject.traders.find(trader => trader.name === name)
    }
    
    getTraderItems(name: string): Item[] {
        return this.getTrader(name).items
    }

    getTraderItemsByLevel(name: string, level: number): Item[] {
        let items:Item[] = []
        this.getTrader(name).items.forEach(i => {
            if(i.level === level) {
                items.push(i)
            }
        })
        return items
    }

    getTraderItemFromUUID(name:string, uuid:string):Item {
        return this.getTrader(name).items.find(item => item.UUID.toString() === uuid)
    }
}
