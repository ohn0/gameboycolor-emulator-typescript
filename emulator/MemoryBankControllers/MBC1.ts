import { iMBC } from './iMBC';
export class MBC1 implements iMBC{
    pushBankToRAM(key : number): void {
        throw new Error('Method not implemented.');
    }
    populateBanks(): void {
        throw new Error('Method not implemented.');
    }
    interceptWrite(memoryWrite: { index: number; value: number; }): void {
        throw new Error('Method not implemented.');
    }

}