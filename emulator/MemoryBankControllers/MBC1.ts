import { Bank } from './bank';
import { iMBC } from './iMBC';
export class MBC1 implements iMBC{
    initialBank!: Bank;
    banks!: Bank[];
    private currentBankIndex!: number;
    
    configureMBC(gameData: Uint8Array): void {
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
    
    pushBankToRAM(memoryLocation: number, value: number): Bank {
        const z = 0x60;
        if (memoryLocation >= 0x2000 && memoryLocation <= 0x3FFF) {
            const lower5Bits = value & 0b0011111;
            this.currentBankIndex &= 0b1100000;
            this.currentBankIndex |= lower5Bits;
        }
        else if (memoryLocation >= 0x4000 && memoryLocation <= 0x5FFF) {
            const upper2Bits = value & 0b1100000;
            this.currentBankIndex &= 0b0011111;
            this.currentBankIndex |= upper2Bits;
        }
        return this.banks[this.currentBankIndex];
    }
    
    populateBanks(): void {
        throw new Error('Method not implemented.');
    }
    
    interceptWrite(memoryWrite: { index: number; value: number; }): void {
        throw new Error('Method not implemented.');
    }

    private updateBankIndex(isUpdatingLowerBits : boolean, value : number) {
        if (isUpdatingLowerBits) {
            this.currentBankIndex
        }
    }

}