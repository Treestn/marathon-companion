export interface MessageInfoData {
    id:string;
    appVersion?:string;
    startDate?:string; // new Date(startDate).toISOString();
    endDate?:string; // new Date(endDate).toISOString();
    messages: MessageInfo[];
}

export interface MessageInfo {
    id:string;
    type:string;
    minimumVersion:string,
    startDate?:string; // new Date(startDate).toISOString();
    endDate?:string; // new Date(endDate).toISOString();
    title:string;
    messageList:string[];
}