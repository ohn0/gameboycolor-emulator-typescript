import { RamProxy } from "../RAM/ramProxy";

export class vramBank {

    private bank0 : Array<number>;
    private bank1 : Array<number>;
    ram: RamProxy;
    cgbModeEnabled : boolean = false;

    constructor(ram : Uint8Array, isUsingCgbMode : boolean, ramProxy : RamProxy){
        this.bank0 = new Array<number>(0x2000);
        this.bank1 = new Array<number>(0x2000);
        this.ram = ramProxy;
        this.cgbModeEnabled = false;
        for (let z = 0; z < ram.length; z++) {
            this.bank0[z] = ram[z];          
            this.bank1[z] = ram[z];            
        }
    }

    copyBankToRam(bankToCopyFrom : number, ramMessenger : any){
        if(!this.cgbModeEnabled) return;
        if(bankToCopyFrom == 0){
            ramMessenger(this.bank0);
        }
        else if (bankToCopyFrom == 1){
            ramMessenger(this.bank1);
        }
    }

    copyRamToBank(currentBank : number, ram : Uint8Array){
        if(!this.cgbModeEnabled) return;
        for(let z = 0; z < ram.length; z++){
            if(currentBank == 0){
                this.bank0[z] = ram[z];
            }
            else{
                this.bank1[z] = ram[z];
            }
        }
    }

    read(currentBank : number, index : number) : number{
        if(!this.cgbModeEnabled){
            return this.ram.read(index+0x8000).value;
        }
        if(currentBank == 0){
            return this.bank0[index];
        }
        else if(currentBank == 1){
            return this.bank1[index];
        }
        else{
            return 0xFF;
        }
    }

    readBlock(bank : number, startIndex : number, endIndex : number) : Array<number> {
        if(!this.cgbModeEnabled)
            return Array.from(this.ram.readBlock(0x8000+startIndex, 0x8000 + endIndex));

        if(bank == 0){
            return this.bank0.slice(startIndex, endIndex);
        }

        return this.bank1.slice(startIndex, endIndex);
    }

    write(currentBank : number, index : number, value : number){
        if(this.cgbModeEnabled){
            if(currentBank == 0){
                this.bank0[index] = value;
            }
            else if (currentBank == 1){
                this.bank1[index] = value;
            }            
        }
        else{
            this.ram.write(index+0x8000, value);
        }

    }

    getBank(bank: number) : Array<number>{
        if(bank == 0){
            return this.bank0;
        }
        if (bank == 1){
            return this.bank1;
        }
        return this.bank0;
    }

}