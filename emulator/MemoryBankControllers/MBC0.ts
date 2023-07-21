import { iMBC } from './iMBC';
export class MBC0 implements iMBC{
    
    initialLoad(RAM : Uint8Array): void {
        //
    }

    //only for games that are less than 32KiB (32 * 1024 bytes)
    interceptWrite(memoryWrite: { index: number; value: number; }): void {
        throw new Error('Method not implemented.');
    }
}