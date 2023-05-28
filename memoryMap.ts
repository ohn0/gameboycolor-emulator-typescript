import { Uint16 } from './primitives/uint16';
import { Uint8 } from './primitives/uint8';
export class MemoryMap{
    
    private _memory!: Uint8Array;

    public get memory(): Uint8Array {
        return this._memory;
    }

    public set memory(value: Uint8Array) {
        this._memory = value;
    }
    
    constructor(memorySize : number) {
        this.memory = new Uint8Array(memorySize);
    }

    public read8bit(index: number) :Uint8 {
        return new Uint8(this.memory[index]);
    }

    public read16bit(index: number): Uint16 {
        return new Uint16(this.memory[index + 1], this.memory[index]);
    }

    public write8bit(index: number, value: number): void {
        if (index > this._memory.length) throw new Error("ERROR: index out of bounds")
        if(value > 0xFF) throw new Error("ERROR: value greater than 0xFF")
        this._memory[index] = value;
    }

    public write16bit(index: number, value: Uint16): void {
        this.write8bit(index, value.Lo8bits.value);
        this.write8bit(index + 1, value.Hi8bits.value);
    }
}