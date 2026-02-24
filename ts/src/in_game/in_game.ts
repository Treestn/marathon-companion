/// <reference types="@overwolf/types/owads" />

export class InGame {

  private static _instance:InGame;

  private constructor() {
  }

  public static instance() {
    if(!InGame._instance) {
      InGame._instance = new InGame();
    }
    return InGame._instance
  }

  async init() {
    console.log('Desktop initialized');
  }

}

InGame.instance().init();