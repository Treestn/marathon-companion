export class ScrollAnimationUtils {

    private static readonly DURATION = 500;

    public static scrollToElement(target:HTMLElement, container:HTMLElement, extraOffset?:number): void {
        if (!target) {
          console.error('Target element not found');
          return;
        }
    
        const targetPosition = target.offsetTop - container.offsetTop;
        if(extraOffset) {
            targetPosition - extraOffset;
        }
        const startPosition = container.scrollTop;
        const distance = targetPosition - startPosition;
        let startTime: number | null = null;
    
        const animation = (currentTime: number) => {
          if (startTime === null) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const run = this.ease(timeElapsed, startPosition, distance, this.DURATION);
          container.scrollTop = run;
          if (timeElapsed < this.DURATION) {
            requestAnimationFrame(animation);
          }
        };
    
        requestAnimationFrame(animation);
    }
    
    private static ease(t: number, b: number, c: number, d: number): number {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
    }

}