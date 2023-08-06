import { Uint8 } from "../../primitives/uint8";
import { iMBC } from "../MemoryBankControllers/iMBC";

export class RAM{
    private _ram!: Uint8Array;
    private _mbc!: iMBC;
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


    constructor(mbc: iMBC) {
        this.ram = new Uint8Array(0xFFFF);
        this.mbc = mbc;
        let idx = 0;
        this.mbc.initialBank.romBank.forEach(x => {
            this.ram[idx++] = x;
        })
    }

    write(address: number, value: number) {
        if (address < 0x8000) { 
            this.mbc.interceptWrite({ address, value });
        }
        else {
            this.ram[address] = value;
        }
    }

    read(address: number): Uint8 {
        return new Uint8(this.ram[address]);
    }

}