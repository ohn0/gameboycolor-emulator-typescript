import { Bank } from './bank';
import { iMBC } from './iMBC';
export class MBC0 implements iMBC{
    private _bank!: Bank;
    public get bank(): Bank {
        return this._bank;
    }
    public set bank(value: Bank) {
        this._bank = value;
    }

    constructor() {
        //
    }


    pushBankToRAM(key: number): void {
        if (key != 0)
            throw new Error(`key ${key} is not valid for MBC0, can only be 0`);
    }
    populateBanks(): void {
        throw new Error('Method not implemented.');
    }
    //only for games that are less than 32KiB (32 * 1024 bytes)

    interceptWrite(memoryWrite: { index: number; value: number; }): void {
        throw new Error('Method not implemented.');
    }

    private populateBank(gameData : Uint8Array) {
        this.bank.romBank = gameData.slice(0, 0x4000);
    }
}