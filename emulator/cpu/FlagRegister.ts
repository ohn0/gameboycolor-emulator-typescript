import { Register8bit } from "./register";


export class FlagRegister extends Register8bit {
    private _zeroFlag: boolean;
    private _subtractionFlag: boolean;
    private _halfCarryFlag: boolean;
    private _carryFlag: boolean;

    public get zeroFlag(): boolean {
        return this._zeroFlag;
    }

    public set zeroFlag(value: boolean) {
        if (this._zeroFlag != value) {
            this._zeroFlag = value;
            this.value ^= (1 << 7);
        }
    }

    public get subtractionFlag(): boolean {
        return this._subtractionFlag;
    }

    public set subtractionFlag(value: boolean) {
        if (this._subtractionFlag != value) {
            this._subtractionFlag = value;
            this.value ^= (1 << 6);
        }

    }

    public get halfCarryFlag(): boolean {
        return this._halfCarryFlag;
    }

    public set halfCarryFlag(value: boolean) {
        if (this._halfCarryFlag != value) {
            this._halfCarryFlag = value;
            this.value ^= (1 << 5);
        }
    }

    public get carryFlag(): boolean {
        return this._carryFlag;
    }

    public set carryFlag(value: boolean) {
        if (this._carryFlag != value) {
            this._carryFlag = value;
            this.value ^= (1 << 4);
        }
    }

    constructor() {
        super(0, "F");
        this.transform = (Fvalue : number) : number => {
            //7654 3210
            //znhc 0000
            // Fvalue = ~0;
            // Fvalue &= (this.getNumFromBool(this.zeroFlag) << 7);
            // Fvalue &= (this.getNumFromBool(this.subtractionFlag) << 6);
            // Fvalue &= (this.getNumFromBool(this.halfCarryFlag) << 5);
            // Fvalue &= (this.getNumFromBool(this.carryFlag) << 4);

            Fvalue &= 0xFF;
            this._zeroFlag = (Fvalue & 0x80) > 0;
            this._subtractionFlag = (Fvalue & 0x40) > 0;
            this._halfCarryFlag = (Fvalue & 0x20) > 0;
            this._carryFlag = (Fvalue & 0x10) > 0;
            return Fvalue;
        }
        this._zeroFlag = false;
        this._subtractionFlag = false;
        this._halfCarryFlag = false;
        this._carryFlag = false;
    }
}
