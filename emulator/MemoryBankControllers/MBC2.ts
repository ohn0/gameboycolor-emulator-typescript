import { Bank } from "./bank";
import { iMBC } from "./iMBC";

export class MBC2 implements iMBC{
    initialBank!: Bank;
    banks!: Bank[];
    configureMBC(gameData: Uint8Array): void {
        throw new Error("Method not implemented.");
    }
    interceptWrite(memoryWrite: { index: number; value: number; }): void {
        throw new Error("Method not implemented.");
    }
    pushBankToRAM(memoryLocation : number, value : number): void {
        throw new Error("Method not implemented.");
    }
    populateBanks(): void {
        throw new Error("Method not implemented.");
    }

}