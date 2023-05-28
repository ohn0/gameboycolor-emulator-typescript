import { iMBC } from './iMBC';
export class MBC0 implements iMBC{

    interceptWrite(memoryWrite: { index: number; value: number; }): void {
        throw new Error('Method not implemented.');
    }
}