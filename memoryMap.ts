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
}