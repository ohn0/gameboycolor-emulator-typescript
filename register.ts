import { Uint8 } from "./uint8"

export class Register8bit{
    private _register!: Uint8;

    public get register() {
        return this._register;
    }

    public set register(value) {
        this._register = value;
    }

    constructor(value: number) {
        this.register = new Uint8(value);
    }
    
}