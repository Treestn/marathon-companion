import { IRequest } from "../../types/IRequest";

export interface IPageMediator {

    savedPage:HTMLElement;

    load();
    save();
    update(request:IRequest);
}