import { Bank } from './bank';
import { iMBC } from './iMBC';
export class MBC3 implements iMBC{
    initialBank!: Bank;
    banks!: Bank[];
    configureMBC(gameData: Uint8Array): void {
        this.banks = new Array<Bank>(125);

    }
    pushBankToRAM(memoryLocation : number, value : number): void {
        throw new Error('Method not implemented.');
    }
    populateBanks(): void {
        throw new Error('Method not implemented.');
    }

    interceptWrite(memoryWrite: { index: number; value: number; }): void {
        throw new Error('Method not implemented.');
    }

}