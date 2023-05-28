import { Register8bit } from './register'

export class Register16Bit{
    private _value! : number;
    private _registerName!: string;

    constructor(name: string) {
        this.registerName = name;
    }

    public get value(){
        return this._value;
    }

    public set value(value: number){
        if(value > 65535){
            throw new Error("ERROR: cannot set register " + this.registerName + " value to " + value + ". Value must be less than 65535");
        }
        else{
            this._value = value;
        }
    }

    public get registerName() {
        return this._registerName;
    }

    public set registerName(value) {
        this._registerName = value;
    }
}

export class HiLoRegister extends Register16Bit{
    private _HiRegister! : Register8bit;
    private _LoRegister! : Register8bit;

    public set LoRegister(value : Register8bit) {
        this._LoRegister = value;
    }

    public set HiRegister(value : Register8bit){
        this._HiRegister = value;
    }

    public get LoRegister(){
        return this._LoRegister;
    }

    public get HiRegister(){
        return this._HiRegister;
    }

    constructor(Hi: Register8bit, Lo: Register8bit, RegisterName : string) {
        super(RegisterName);
        this.HiRegister = Hi;
        this.LoRegister = Lo;
    }

    public getRegister(){
        if(this.LoRegister !== undefined  && this.HiRegister !== undefined){
            this.value = this.HiRegister.register.value << 8 | this.LoRegister.register.value;
            return this.value;
        }
        else if(this.HiRegister !== undefined){
            return this.HiRegister.register.value << 8 | 0;
        }
        else{
            throw new Error("ERROR: Both low and high registers are undefined");
        }
    }

    public setRegister(value : number) {
        if (value > 0xFFFF) throw new Error(`ERROR: ${value} is greater than 0xFFFF(65535), unable 
        to store it in a 16 bit register.`,)

        this.HiRegister.register.value = value >> 8;
        this.LoRegister.register.value = value & 0x00FF;
        this.value = (this.HiRegister.register.value << 8) | this.LoRegister.register.value;
    }
}

export class StackPointer extends Register16Bit{
    constructor(registerName: string) {
        super(registerName);
    }
}

export class ProgramCounter extends Register16Bit{
    constructor(registerName: string) {
        super(registerName);
        this.value = 0x000;
    }    
}