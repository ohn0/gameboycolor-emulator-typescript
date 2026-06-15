import { Uint16 } from "../../primitives/uint16";
import { Register8bit } from "./register";

export class HardwareRegister extends Register8bit {
    private _readEnable!: boolean;
    private _writeEnable!: boolean;
    private _address!: Uint16;
    public get address(): Uint16 {
        return this._address;
    }
    public set address(value: Uint16) {
        this._address = value;
    }
    public get readEnable(): boolean {
        return this._readEnable;
    }
    public set readEnable(value: boolean) {
        this._readEnable = value;
    }
    public get writeEnable(): boolean {
        return this._writeEnable;
    }
    public set writeEnable(value: boolean) {
        this._writeEnable = value;
    }
    
    constructor(registerName : string,address : number, isRead : boolean = true, isWrite : boolean = true){
        super(0x0000, registerName);
        address &= 0xFFFF;
        this.address = new Uint16(address >> 8, address & 0xFF);
        this.readEnable = isRead;
        this.writeEnable = isWrite;
    }


}