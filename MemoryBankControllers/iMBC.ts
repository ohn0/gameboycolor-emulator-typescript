export interface iMBC {
    interceptWrite(memoryWrite : {index: number; value: number;}): void;
}