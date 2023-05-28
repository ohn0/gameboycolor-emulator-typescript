import { Uint8 } from "./uint8"

export class Uint16{
    private _Hi8bits! : Uint8;
    private _Lo8bits!: Uint8;
    private _: number;

    public get Hi8bits() {
        return this._Hi8bits;
    }

    public set Hi8bits(value) {
        this._Hi8bits = value;
    }

    public get Lo8bits(){
        return this._Lo8bits;
    }

    public set Lo8bits(value) {
        this._Lo8bits = value;
    }

    public get (): number {
        return this._;
    }
    public set (value: number) {
        this._ = value;
    }

    constructor(Hi : number, Lo : number) {
        this.Hi8bits = new Uint8(Hi);
        this.Lo8bits = new Uint8(Lo);
        this._ = this.Hi8bits.value << 8 | this.Lo8bits.value;
    }

}