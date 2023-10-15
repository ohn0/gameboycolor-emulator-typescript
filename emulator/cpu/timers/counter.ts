export class counter {
    private resetValue!: number;
    private _interruptTriggered = false;

    constructor(modulo = 0) {
        this.updateModulo(modulo);
        this.interruptTriggered = false;
    }

    public tick(value : number) : number {
        value++;
        this.interruptTriggered = false;
        if (value > 0xFF) {
            value = this.resetValue;
            this.interruptTriggered = true;
        }
        return value;
    }

    public get interruptTriggered(): boolean {
        return this._interruptTriggered;
    }
    public set interruptTriggered(value: boolean) {
        this._interruptTriggered = value;
    }

    public updateModulo(modulo: number) {
        this.resetValue = modulo;
    }
}