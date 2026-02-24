import { IObserver } from "./IObserver";

export interface IObservable {
    subscribe(observer: IObserver):void
    unsubscribe(observer: IObserver):void
    notify(data?:Map<string, Object>):void
}