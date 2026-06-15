import { Uint8 } from "../../primitives/uint8";
import { RAM } from "./RAM";

export class RamProxy {

    private cpuWorker : Worker;
    private ram! : RAM;
    private _ramLoaded: boolean = false;
    public get ramLoaded(): boolean {
        return this._ramLoaded;
    }
    public set ramLoaded(value: boolean) {
        this._ramLoaded = value;
    }
    constructor(cpuWorker : Worker, ram : RAM)
    {
        //cpuWorker is where the real RAM exists
        this.cpuWorker = cpuWorker;
        this.ram = ram;
        this.cpuWorker.addEventListener("message", (message) => {
            if(message.data.action == "UPDATE"){
                if(message.data.address !== undefined){
                    this.ramLoaded = true;
                    // console.log("received ram update");
                    this.ram.write(message.data.address, message.data.value);
                }
            }
        });
    }

    read(address: number): Uint8
    {
        if(!this.ramLoaded) return new Uint8(0);
        return this.ram.read(address);
    }

    write(address: number, value : number){
        this.cpuWorker.postMessage({
            action : "WRITE",
            address : address,
            value: value
        })
    }

    readBlock(start : number, end : number) : Uint8Array {
        let output : Uint8Array = new Uint8Array(end - start);
        for(let i = 0; i < (end - start); i++){
            output[i] = this.ram.read(i).value;
        }
        return output;
    }

    writeBlock(start : number, end : number, data : Uint8Array)
    {
        this.cpuWorker.postMessage({
            action: "WRITEBLOCK",
            start : start,
            end : end,
            data : data
        });
    }

    loadFromRam(ram : Uint8Array){
        this.ram.ram = ram;
    }

}