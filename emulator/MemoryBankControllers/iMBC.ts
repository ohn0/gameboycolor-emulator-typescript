import { Bank } from "./bank";

export interface iMBC {
    banks: Bank[];
    initialBank: Bank;
    bankWasChanged: boolean;
    interceptWrite(memoryWrite: { address: number; value: number; }): void;
    configure(gameData: Uint8Array) : void;
}