export interface MessageStoredObject {
    messagesDisplayed: string[];
}

export class MessageStoredImpl implements MessageStoredObject {

    messagesDisplayed: string[] = [];

    constructor() {
    }
}