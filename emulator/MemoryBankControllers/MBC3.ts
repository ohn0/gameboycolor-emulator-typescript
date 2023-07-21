import { iMBC } from './iMBC';
export class MBC3 implements iMBC{
    initialLoad(RAM: Uint8Array): void {
        throw new Error('Method not implemented.');
    }

    interceptWrite(memoryWrite: { index: number; value: number; }): void {
        throw new Error('Method not implemented.');
    }

}