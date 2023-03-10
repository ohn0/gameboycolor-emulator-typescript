import { Uint8 } from "./primitives/uint8"

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

export class FlagRegister extends Register8bit{
    private _zeroFlag: boolean;
    private _subtractionFlag: boolean;
    private _halfCarryFlag: boolean;
    private _carryFlag: boolean;

    public get zeroFlag(): boolean {
        return this._zeroFlag;
    }

    public set zeroFlag(value: boolean) {
        this._zeroFlag = value;
    }

    public get subtractionFlag(): boolean {
        return this._subtractionFlag;
    }

    public set subtractionFlag(value: boolean) {
        this._subtractionFlag = value;
    }

    public get halfCarryFlag(): boolean {
        return this._halfCarryFlag;
    }

    public set halfCarryFlag(value: boolean) {
        this._halfCarryFlag = value;
    }

    public get carryFlag(): boolean {
        return this._carryFlag;
    }

    public set carryFlag(value: boolean) {
        this._carryFlag = value;
    }

    constructor() {
        super(0);
        this._zeroFlag = false;
        this._subtractionFlag = false;
        this._halfCarryFlag = false;
        this._carryFlag = false;
    }
}