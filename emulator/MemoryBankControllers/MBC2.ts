import { Bank } from "./bank";
import { iMBC } from "./iMBC";

export class MBC2 implements iMBC{
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

}