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
    initialBank!: Bank;
    banks!: Bank[];
    configureMBC(gameData: Uint8Array): void {
        this.populateBank(gameData);
    }


    pushBankToRAM(memoryLocation : number, value : number): void {
        if (value != 0)
            throw new Error(`key ${value} is not valid for MBC0, can only be 0`);
    }
    populateBanks(): void {
        throw new Error('Method not implemented.');
    }
    //only for games that are less than 32KiB (32 * 1024 bytes)

    interceptWrite(memoryWrite: { index: number; value: number; }): void {
        throw new Error('Method not implemented.');
    }

    private populateBank(gameData: Uint8Array) {
        this.banks = new Array<Bank>(1);
        this.bank.romBank = gameData.slice(0, 0x4000);
        this.initialBank = this.bank;
        this.banks[0] = this.bank;
    }
}