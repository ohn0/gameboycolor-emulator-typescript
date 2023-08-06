import { Register8bit } from './register';
import { Register16Bit } from './register16bit';


export class HiLoRegister extends Register16Bit {
    private _HiRegister!: Register8bit;
    private _LoRegister!: Register8bit;

    public get LoRegister() {
        return this._LoRegister.value;
    }
    
    public set LoRegister(value: number) {
        this._LoRegister.value = value;
        this.value &= 0xFF00;
        this.value |= this.LoRegister;
    }

    public get HiRegister() {
        return this._HiRegister.value;
    }
    
    public set HiRegister(value: number) {
        this._HiRegister.value = value;
        this.value &= 0x00FF;
        this.value |= (this.HiRegister << 8);
    }

    constructor(Hi: Register8bit, Lo: Register8bit, RegisterName: string) {
        super(RegisterName);
        this._HiRegister = Hi;
        this._LoRegister = Lo;
        this.value = ((this.HiRegister << 8) | this.LoRegister);
    }

    public override getRegister(): number {
        return ((this.HiRegister << 8) | this.LoRegister);
    }

    public override setRegister(value: number) {
        if (value > 0xFFFF)
            throw new Error(`ERROR: ${value} is greater than 0xFFFF(65535), unable 
        to store it in a 16 bit register.`);

        this.HiRegister = (value >> 8) & 0x00FF;
        this.LoRegister = value & 0x00FF;
        this.value = value;
    }
}
