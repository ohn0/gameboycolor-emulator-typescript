export class counter {
    private resetValue: number;
    private counter: number;
    private _interruptTriggered = false;

    constructor(modulo = 0) {
        this.resetValue = modulo;
        this.counter = 0;
        this.interruptTriggered = false;
    }

    public tick() {
        this.counter++;
        this.interruptTriggered = false;
        if (this.counter > 0xFF) {
            this.counter = this.resetValue;
            this.interruptTriggered = true;
        }
    }

    public get interruptTriggered(): boolean {
        return this._interruptTriggered;
    }
    public set interruptTriggered(value: boolean) {
        this._interruptTriggered = value;
    }
}