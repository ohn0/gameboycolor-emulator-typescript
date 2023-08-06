import { Uint8 } from "../../primitives/uint8"

export class Register8bit{
    private _value!: Uint8;
    private _name!: string;


    public get value(): number {
        return this._value.value;
    }

    public set value(value: number) {
        this._value = new Uint8(this.transform(value));
    }

    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }
    constructor(value: number, name : string) {
        this._value = new Uint8(value);
        this._name = name;
    }

    public transform = (z : number) : number => { return z; };
    
}

