import { Bank } from "./bank";
import { iMBC } from "./iMBC";
import { mbcCreator } from "./mbcCreator";

export class MBC2 implements iMBC{
    cartridge!: Uint8Array;
    canUseRam(): boolean {
        throw new Error("Method not implemented.");
    }
    writeToRam(address: number, value: number): void {
        throw new Error("Method not implemented.");
    }
    readFromRam(address: number): number {
        throw new Error("Method not implemented.");
    }
    RamSize!: number;
    RomSize!: number;
    initialBank!: Bank;
    banks!: Bank[];
    private _bankWasChanged!: boolean;
    public get bankWasChanged(): boolean {
        return this._bankWasChanged;
    }
    public set bankWasChanged(value: boolean) {
        this._bankWasChanged = value;
    }
    configure(gameData: Uint8Array): void {
        this.RomSize = mbcCreator.getRomSize(gameData[0x148]);
        this.RamSize = mbcCreator.getRamSize(gameData[0x149]);
        throw new Error("Method not implemented.");
    }
    interceptWrite(memoryWrite: { address: number; value: number; }): void {
        throw new Error("Method not implemented.");
    }
    updateBankIndex(memoryLocation : number, value : number): void {
        throw new Error("Method not implemented.");
    }
    populateBanks(): void {
        throw new Error("Method not implemented.");
    }
    
    interceptRead(address: number): number {
        throw new Error('Method not implemented.');
    }
}