export class CanvasHelper {

    // If it is Alpha, we are not on the actual image
    static isAlpha(ctx, event):boolean {
        var pixelData = ctx.getImageData(event.offsetX, event.offsetY, 1, 1).data;
        if(pixelData[3] != 0){
          return false;
        }
        return true;
      }
}