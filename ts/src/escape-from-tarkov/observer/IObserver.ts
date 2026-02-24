import { IObserverContextData } from "./IObserverContextData";

export interface IObserver {
    update(context: IObserverContextData):void
}