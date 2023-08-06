import { Bank } from './bank';
import { iMBC } from './iMBC';
export class MBC0 implements iMBC{
    banks: Bank[];
    initialBank!: Bank;
    private _bankWasChanged!: boolean;

    constructor() {
        this.banks = new Array<Bank>(new Bank());
        this.initialBank = this.banks[0];
    }

    public get bankWasChanged(): boolean {
        return this._bankWasChanged;
    }

    public set bankWasChanged(value: boolean) {
        this._bankWasChanged = false;
    }

    configure(gameData: Uint8Array): void {
        this.initialBank.romBank = gameData.slice(0, 0x7FFF);
    }

    //only for games that are less than 32KiB (32 * 1024 bytes)
    //MBC0 would just be a passthrough because there's no bank switching
    interceptWrite(memoryWrite: { address: number; value: number; }): void {
        if (memoryWrite.address < 0x8000) {
            this.bankWasChanged = true;
        }
        return;
    }

}