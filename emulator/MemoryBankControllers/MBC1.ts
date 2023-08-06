import { Bank } from './bank';
import { iMBC } from './iMBC';
export class MBC1 implements iMBC{
    private _bankWasChanged!: boolean;
    public get bankWasChanged(): boolean {
        return this._bankWasChanged;
    }
    public set bankWasChanged(value: boolean) {
        this._bankWasChanged = value;
    }
    initialBank!: Bank;
    banks!: Bank[];
    private currentBankIndex!: number;

    
    configure(gameData: Uint8Array): void {
        this._bankWasChanged = false;
        this.banks = new Array<Bank>(125);
        const gameSize = gameData.length;
        let byteIndex = 0x4000;
        let bankIndex = 0;

        //configure ROM bank 00
        this.initialBank = new Bank();
        this.initialBank.romBank = gameData.slice(0, 0x4000);
        //configure ROM bank 01 - ([total possible ROM banks] - 1)
        while (gameSize - byteIndex > 0x4000) {
            this.banks[bankIndex] = new Bank();
            this.banks[bankIndex].romBank = gameData.slice(byteIndex, byteIndex + 0x4000);
            bankIndex++;
            byteIndex += 0x4000;
        }

        //configure final ROM bank with remainder of bytes
        if (gameSize - byteIndex >= 0) {
            this.banks[bankIndex] = new Bank();
            this.banks[bankIndex].romBank = gameData.slice(byteIndex, gameSize);
        }
    }
    
    updateBankIndex(memoryLocation: number, value: number): void {
        if (memoryLocation >= 0x2000 && memoryLocation <= 0x3FFF) {
            const lower5Bits = value & 0b0011111;
            this.currentBankIndex &= 0b1100000;
            this.currentBankIndex |= lower5Bits;
            this.bankWasChanged = true;
        }
        else if (memoryLocation >= 0x4000 && memoryLocation <= 0x5FFF) {
            const upper2Bits = value & 0b1100000;
            this.currentBankIndex &= 0b0011111;
            this.currentBankIndex |= upper2Bits;
            this.bankWasChanged = true;
        }
    }
    
    interceptWrite(memoryWrite: { address: number; value: number; }): void {
        this.bankWasChanged = false;
        this.updateBankIndex(memoryWrite.address, memoryWrite.value);
    }

}