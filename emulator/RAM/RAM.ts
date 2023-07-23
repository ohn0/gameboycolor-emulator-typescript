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
    }

    write(address: number, value: number) {
        // this.mbc.
        this.ram[address] = value;
    }

    read(address : number): Uint8 {
        return new Uint8(this.ram[address]);
    }

}