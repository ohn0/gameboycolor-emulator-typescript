import { Bank } from './bank';
import { iMBC } from './iMBC';
import { mbcCreator } from './mbcCreator';
export class MBC0 implements iMBC{
    banks: Bank[];
    initialBank!: Bank;
    private _bankWasChanged!: boolean;
    cartridge!: Uint8Array;

    constructor() {
        this.banks = new Array<Bank>(new Bank());
        this.initialBank = this.banks[0];
    }
    RomBankNumber = 0;
    MbcType = "MBC0";


    RamSize!: number;
    RomSize!: number;

    public get bankWasChanged(): boolean {
        return this._bankWasChanged;
    }

    public set bankWasChanged(value: boolean) {
        this._bankWasChanged = false;
    }

    configure(gameData: Uint8Array): void {
        this.RomSize = mbcCreator.getRomSize(gameData[0x148]);
        this.RamSize = mbcCreator.getRamSize(gameData[0x149]);
        this.initialBank.romBank = gameData.slice(0, 0x7FFF);
        this.cartridge = new Uint8Array(gameData);
    }

    //only for games that are less than 32KiB (32 * 1024 bytes)
    //MBC0 would just be a passthrough because there's no bank switching
    interceptWrite(memoryWrite: { address: number; value: number; }): void {
        if (memoryWrite.address < 0x8000) {
            this.bankWasChanged = true;
        }
        return;
    }

    interceptRead(address: number): number {
        return address;
    }
    
    writeToRam(address: number, value: number): void {
        throw new Error('Method not implemented.');
    }
    readFromRam(address: number): number {
        throw new Error('Method not implemented.');
    }

    canUseRam(): boolean {
        return false;
    }
}