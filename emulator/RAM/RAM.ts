import { Logger } from "../../logger/logger";
import { Uint8 } from "../../primitives/uint8";
import { CPU } from "../cpu/cpu";
import { vramBank } from "../graphics/vramBank";
import { iMBC } from "../MemoryBankControllers/iMBC";
import { dmaTransferer } from "./dmaTransferer";

export class RAM{
    private _ram!: Uint8Array;
    private _mbc!: iMBC;
    private logger: Logger;
    private _sharedRam!: SharedArrayBuffer;
    private activeTransferer! : dmaTransferer;
    private binData! : Uint8Array;
    isReadingBin!: boolean;
    vramBank1 : Array<number>;
    public get sharedRam(): SharedArrayBuffer {
        return this._sharedRam;
    }
    public set sharedRam(value: SharedArrayBuffer) {
        this._sharedRam = value;
    }
    public get mbc(): iMBC {
        return this._mbc;
    }
    public set mbc(value: iMBC) {
        this._mbc = value;
    }
    public get ram(): Uint8Array {
        return this._ram;
    }
    public set ram(value: Uint8Array) {
        this._ram = value;
    }


    constructor(mbc: iMBC, logger: Logger) {
        this.logger = logger;
        this.ram = new Uint8Array(0x10000);
        this.binData = new Uint8Array(0x100);
        this.mbc = mbc;
        let idx = 0;
        this.mbc.initialBank.romBank.forEach(x => {
            this.ram[idx++] = x;
        })
        this.vramBank1 = new Array<number>(0x2000);
    }

    useSharedBufferAsSource(){
        this.sharedRam = new SharedArrayBuffer(0x10000);
        this.ram = new Uint8Array(this.sharedRam);
        let idx = 0;
        this.mbc.initialBank.romBank.forEach(x => {
            this.ram[idx++] = x;
        })
    }

    write(address: number, value: number) {
        // console.log(`writing value ${value} to address ${address}`)

        if (this.mbc.canUseRam() && address >= 0xA000 && address <= 0xBFFF) {
            this.mbc.writeToRam(address, value);
        }
        else if (address < 0x8000) { 
            // addresses less than 0x8000 are ROM (read only)
            this.mbc.interceptWrite({ address, value });
        }
        else {
            if((this.ram[0x143] == 0x80 || this.ram[0x143] == 0xC0) &&
                    address >= 0x8000 && address <= 0x97FF){
                var currentBank = this.ram[0xFF4F] & 0b1;
                if(currentBank == 1){
                    this.vramBank1[address - 0x8000] = value;
                }
            }
            else{
                this.ram[address] = value;
            }
        }
        // this.logger.logToConsole(`R: address: ${address.toString(16).toLocaleUpperCase().padStart(8, '0')}, value: ${value.toString(16).toLocaleUpperCase().padStart(8, '0')}`)
    }

    public loadBin(binFile : Uint8Array){
        let i = 0;
        while(i <= 0x100){
            this.binData[i] = binFile[i++];
        }
        this.isReadingBin = true;
    }

    public read(address: number): Uint8 {
        if(this.isReadingBin && address <= 0x100){
            return this.readBin(address);
        }
        // this.logger.logToConsole(`W: address: ${address.toString(16).toLocaleUpperCase().padStart(8, '0')}`)
        if (this.mbc.canUseRam() && address >= 0xA000 && address <= 0xBFFF) {
            return new Uint8(this.mbc.readFromRam(address));
        }
        else if (address >= 0x00 && address <= 0x7FFF) {
            const mappedAddress = this.mbc.interceptRead(address);
            if (mappedAddress >= 0) {
                let x: Uint8;
                if (address >= 0x4000 && this.mbc.MbcType != "MBC0") {
                    x = new Uint8(this.mbc.banks[this.mbc.RomBankNumber].romBank[mappedAddress]); 
                } else {
                    x = new Uint8(this.mbc.cartridge[mappedAddress]);
                }
                return x;
            }
        }
        else {
            if((this.ram[0x143] == 0x80 || this.ram[0x143] == 0xC0) &&
                    address >= 0x8000 && address <= 0x97FF)
                {
                    if((this.ram[0xFF4F] & 0b1) == 1){
                        return new Uint8(this.vramBank1[address - 0x8000]);
                    }
                }
            return new Uint8(this.ram[address]);
        }

        throw new Error(`mapped address is invalid. Original address = ${address}`);
    }

    public readBin(address : number) : Uint8{
        if(address == 0x100){
            this.isReadingBin = false;
            return this.read(address);
        }
        return new Uint8(this.binData[address]);
    }

    public dmaTransfer(source : number, destination : number, length : number){
        for(let i = 0; i < length; i++){
            this.write(destination, this.read(source).value);
            destination++;
            source++;
        }
    }

    public dmaHblankTransfer(){
        try {
            if(this.isDmaHblankTransferActive && this.activeTransferer.transferOngoing) {
                this.activeTransferer.transfer(this);
            }
            else{
                this.isDmaHblankTransferActive = false;
                this.activeTransferer.transferOngoing = false;
            }            
        } catch (error) {
            console.log("error while trying to dma hblank transfer " + error)
        }

    }

    public configureDmaHblankTransfer(transferer : dmaTransferer){
        this.isDmaHblankTransferActive = true;
        this.activeTransferer = transferer;
    }

    public isDmaHblankTransferActive : boolean = false;
}