import { Logger } from "../../logger/logger";
import { Uint8 } from "../../primitives/uint8";
import { iMBC } from "../MemoryBankControllers/iMBC";

export class RAM{
    private _ram!: Uint8Array;
    private _mbc!: iMBC;
    private logger: Logger;
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
        this.mbc = mbc;
        let idx = 0;
        this.mbc.initialBank.romBank.forEach(x => {
            this.ram[idx++] = x;
        })
        // this.logger = new Logger();
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
            this.ram[address] = value;
        }
        // this.logger.logToConsole(`R: address: ${address.toString(16).toLocaleUpperCase().padStart(8, '0')}, value: ${value.toString(16).toLocaleUpperCase().padStart(8, '0')}`)
    }

    read(address: number): Uint8 {
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
            return new Uint8(this.ram[address]);
        }

        throw new Error(`mapped address is invalid. Original address = ${address}`);
    }

}