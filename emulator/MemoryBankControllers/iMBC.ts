export interface iMBC {
    interceptWrite(memoryWrite: { index: number; value: number; }): void;
    
    pushBankToRAM(key : number): void;

    populateBanks(): void;

}