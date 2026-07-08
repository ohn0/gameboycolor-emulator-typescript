import { Uint8 } from "../../primitives/uint8";
import { RAM } from "./RAM";

export class RamProxy {

    private cpuWorker : Worker;
    private ram! : RAM;
    private _ramLoaded: boolean = false;
    private _sharedArray!: Uint8Array;
    public useSAB : boolean = true;
    public get sharedArray(): Uint8Array {
        return this._sharedArray;
    }
    public set sharedArray(value: Uint8Array) {
        this._sharedArray = value;
    }
    public get ramLoaded(): boolean {
        return this._ramLoaded;
    }
    public set ramLoaded(value: boolean) {
        this._ramLoaded = value;
    }
    
    constructor(cpuWorker : Worker, ram : RAM)
    {
        this.cpuWorker = cpuWorker;
        this.ram = ram;
        this.ramLoaded = true;
    }

    read(address: number): Uint8
    {
        if(!this.ramLoaded) return new Uint8(0);
        if(address == 0xFF4F){
            // console.log(`CHECK RAM/SBA reading from ${address}: ${this.sharedArray[address]} - ${this.ram.read(address).value} - ${new Uint8(this.sharedArray[address]).value}`)
        }
        if(this.useSAB){
            return new Uint8(this.sharedArray[address]);
        }
            // return new Uint8(this.sharedArray[address]);
        return this.ram.read(address);
    }

    write(address: number, value : number){
        if(this.useSAB){
            this.sharedArray[address] = value;
        }
        else{
            this.ram.write(address, value);
        }
    }

    readBlock(start : number, end : number) : Uint8Array {
        let output : Uint8Array = new Uint8Array(end - start);
        // console.log("-----------------------------ZZZ_----------------------------------------------")
        for(let i = 0; i < (end - start); i++){
            output[i] = this.ram.read(start + i).value;
        }
        var slice = this.sharedArray.slice(start, end);
        for(let i = 0; i < slice.length; i++){
            if(slice[i] != output[i]){
                // console.log(`mistmatch detected slice : ${slice[i]} - output : ${output[i]}, start:end = ${start}:${end}`)
                // console.log(i);
                // console.log(output);
                // console.log(slice);
            }
        }

        if(this.useSAB){
            return slice;
        }
        return output;

    }

    writeBlock(start : number, end : number, data : Uint8Array)
    {
        if(this.useSAB){
            for(let i = 0; i < data.length; i++){
                this.sharedArray[start+i] = data[i+start];
            }            
        }
        else{
            for(let i = 0; i < data.length; i++){
                this.ram.write(start + i, data[i]);
            }            
        }
    }

    loadFromRam(ram : Uint8Array){
        // this.ram.ram = ram;
    }

}