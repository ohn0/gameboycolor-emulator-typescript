import { iMBC } from "./iMBC";

export class MBC2 implements iMBC{
    interceptWrite(memoryWrite: { index: number; value: number; }): void {
        throw new Error("Method not implemented.");
    }
    pushBankToRAM(key : number): void {
        throw new Error("Method not implemented.");
    }
    populateBanks(): void {
        throw new Error("Method not implemented.");
    }

}