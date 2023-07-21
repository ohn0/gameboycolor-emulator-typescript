export interface iMBC {
    interceptWrite(memoryWrite: { index: number; value: number; }): void;
    
    initialLoad(RAM: Uint8Array): void;
}