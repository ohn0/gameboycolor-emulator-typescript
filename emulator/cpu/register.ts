import { Uint8 } from "../../primitives/uint8"

export class Register8bit{
    private _value!: Uint8;

    public get value() :number {
        return this._value.value;
    }

    public set value(value : number) {
        this._value = new Uint8(value);
    }

    constructor(value: number) {
        this._value = new Uint8(value);
    }
    
}

