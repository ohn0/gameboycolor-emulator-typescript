
export class Bank{
    private _romBank!: Uint8Array;
    public get romBank(): Uint8Array {
        return this._romBank;
    }
    public set romBank(value: Uint8Array) {
        this._romBank = value;
    }

    public isValidBank(): boolean {
        return this.romBank.length > 0
    }

    constructor() {
        // this.romBank = new Uint8Array(0x4000);
    }
}