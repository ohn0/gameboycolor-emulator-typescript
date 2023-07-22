
export class Bank{
    private _romBank!: Uint8Array;
    public get romBank(): Uint8Array {
        return this._romBank;
    }
    public set romBank(value: Uint8Array) {
        this._romBank = value;
    }

    constructor() {
        this.romBank = new Uint8Array(0x4000);
    }
}