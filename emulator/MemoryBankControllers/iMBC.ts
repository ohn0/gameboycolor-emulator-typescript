import { Bank } from "./bank";

export interface iMBC {
    banks: Bank[];
    initialBank: Bank;
    interceptWrite(memoryWrite: { index: number; value: number; }): void;
    pushBankToRAM(memoryLocation : number, value : number): void;
    populateBanks(): void;
    configureMBC(gameData: Uint8Array) : void;
}