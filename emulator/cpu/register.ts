import { Uint8 } from "../../primitives/uint8"

export class Register8bit{
    private _value!: Uint8;

    public get register() {
        return this._value;
    }

    public set register(value) {
        this._value = value;
    }

    constructor(value: number) {
        this.register = new Uint8(value);
    }
    
}

