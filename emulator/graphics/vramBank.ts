import { RAM } from "../RAM/RAM";

export class vramBank {

    bank0 : Array<number>;
    bank1 : Array<number>;
    constructor(ram : Uint8Array){
        this.bank0 = new Array<number>(0x2000);
        this.bank1 = new Array<number>(0x2000);
        
        for (let z = 0; z < ram.length; z++) {
            this.bank0[z] = ram[z];            
            this.bank1[z] = ram[z];            
        }
    }

    copyBankToRam(bankToCopyFrom : number, ramMessenger : any){
        if(bankToCopyFrom == 0){
            // for(let z = 0x8000; z < 0x9FFF; z++){
            //     ram.write(z, this.bank0[z - 0x8000]);
            // }
            ramMessenger(this.bank0);
        }
        else if (bankToCopyFrom == 1){
            ramMessenger(this.bank1);
            // for(let z = 0x8000; z < 0x9FFF; z++){
            //     ram.write(z, this.bank1[z - 0x8000]);
            // }
        }
    }

    copyRamToBank(currentBank : number, ram : Uint8Array){
        for(let z = 0; z < ram.length; z++){
            if(currentBank == 0){
                this.bank0[z] = ram[z];
            }
            else{
                this.bank1[z] = ram[z];
            }
        }

        // if(currentBank == 0){
        //     for(let z = 0x8000; z < 0x9FFF; z++){
        //         this.bank0[z] = ram[z];
        //     }
        // }
        // else{
        //     for(let z = 0x8000; z < 0x9FFF; z++){
        //         this.bank1[z - 0x8000] = ram.read(z).value;
        //     }
        // }
    }

    read(currentBank : number, index : number) : number{
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

    write(currentBank : number, index : number, value : number){
        if(currentBank == 0){
            this.bank0[index] = value;
        }
        else if (currentBank == 1){
            this.bank1[index] = value;
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