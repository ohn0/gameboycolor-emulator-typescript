import { Logger } from "../../logger/logger";
import { Bank } from "./bank";

export interface iMBC {
    RamSize: number;
    RomSize: number;
    banks: Bank[];
    initialBank: Bank;
    bankWasChanged: boolean;
    cartridge: Uint8Array;
    RomBankNumber: number;
    MbcType: string;
    interceptWrite(memoryWrite: { address: number; value: number; }): void;
    interceptRead(address: number): number;
    configure(gameData: Uint8Array, logger: Logger): void;
    writeToRam(address: number, value: number): void;
    readFromRam(address: number): number;
    canUseRam(): boolean;
}