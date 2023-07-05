export class counter {
    private incrementRate: number;
    private resetValue: number;
    private counter: number;
    private interruptTriggered: boolean;
    constructor(modulo = 0) {
        this.resetValue = modulo;
        this.counter = 0;
        this.interruptTriggered = false;
    }

    public setClockRate(clockRate : number): void {
        this.incrementRate = clockRate;
    }
 
    public tick() {
        this.counter += this.incrementRate;
        this.interruptTriggered = false;
        if (this.counter > 0xFF) {
            this.counter = this.resetValue;
            this.interruptTriggered = true;
        }
    }

}