/// <reference types="@overwolf/types/owads" />

export class Desktop {

  private static _instance:Desktop;

  private constructor() {
  }

  public static instance() {
    if(!Desktop._instance) {
      Desktop._instance = new Desktop();
    }
    return Desktop._instance
  }

  async init() {
    console.log('Desktop initialized');
  }

}

Desktop.instance().init();
