import { Uint8 } from "../../primitives/uint8";
import { RAM } from "./RAM";

export class dmaTransferer {

    private source : number;
    private destination : number;
    private length : number;
    private amountToTransferPerCall : number;
    private transferMarker : number = 0;
    public transferOngoing : boolean = false;

    constructor(source : number, destination : number, length : number, transferAmount : number){
        this.source = source;
        this.destination = destination;
        this.length = length;
        this.amountToTransferPerCall = transferAmount;
        this.transferOngoing = true;
    }

    transfer(ram : RAM){
        let i = 0;
        while(i++ <= this.amountToTransferPerCall && this.transferMarker++ < this.length){
            ram.write(this.destination, ram.read(this.source).value);
            this.destination++;
            this.source++;
        }
        this.transferOngoing = this.transferMarker < this.length;
    }
}