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
    private _HiRegister : Register8bit | undefined;
    private _LoRegister : Register8bit | undefined;

    public set LoRegister(value : Register8bit | undefined) {
        this._LoRegister = value;
    }

    public set HiRegister(value : Register8bit | undefined){
        this._HiRegister = value;
    }

    public get LoRegister(){
        return this._LoRegister;
    }

    public get HiRegister(){
        return this._HiRegister;
    }

    constructor(Hi: Register8bit | undefined, Lo: Register8bit | undefined, RegisterName : string) {
        super(RegisterName);
        this.HiRegister = Hi;
        this.LoRegister = Lo;
    }

    public getRegister(){
        if(this.LoRegister !== undefined  && this.HiRegister !== undefined){
            this.value = this.HiRegister.register._ << 8 | this.LoRegister.register._;
            return this.value;
        }
        else if(this.HiRegister !== undefined){
            return this.HiRegister.register._ << 8 | 0;
        }
        else{
            throw new Error("ERROR: Both low and high registers are undefined");
        }
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
    }    
}