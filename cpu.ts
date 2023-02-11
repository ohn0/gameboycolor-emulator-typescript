import { Register8bit, FlagRegister } from './register';
import {HiLoRegister, StackPointer, ProgramCounter} from './register16bit';

export class CPU {
    

    private RAM: Uint8Array;
    private A: Register8bit;
    private B: Register8bit;
    private C: Register8bit;
    private D: Register8bit;
    private E: Register8bit;
    private F: FlagRegister;
    private H: Register8bit;
    private L: Register8bit;

    private AF: HiLoRegister;
    private BC: HiLoRegister;
    private DE: HiLoRegister;
    private HL: HiLoRegister;
    private SP: StackPointer;
    private PC: ProgramCounter;

    private opCodesLibrary: {} | undefined;

    constructor() {
        this.A = new Register8bit(0);
        this.B = new Register8bit(0);
        this.C = new Register8bit(0);
        this.D = new Register8bit(0);
        this.E = new Register8bit(0);
        this.F = new FlagRegister();
        this.H = new Register8bit(0);
        this.L = new Register8bit(0);

        this.AF = new HiLoRegister(this.A, this.F, "AF");
        this.BC = new HiLoRegister(this.B, this.C, "BC");
        this.DE = new HiLoRegister(this.D, this.E, "DE");
        this.HL = new HiLoRegister(this.H, this.L, "HL");
        
        this.SP = new StackPointer("Stack Pointer");
        this.PC = new ProgramCounter("Program Counter");

        this.RAM = new Uint8Array(0xFFFF);

    }

    updateFlags(value: number) {
        
    }

    executeOpcode(code: number) {
        return null;
    }

    NOP() { //0x00

    }

    LDBCD16(d16 : number) { //0x01
        this.BC.value = d16;
    }

    LDBCA() { //0x02
        this.RAM[this.BC.value] = this.A.register._;
    }

    INCBC() {
        this.BC.value++;

    }

    populateOpCodes() {
        let _this = this;
        this.opCodesLibrary = {
            0x00: function () { },
            0x01: function (d16: number) {
                _this.BC.value = d16;
            },
            0x02: function () {
                _this.RAM[_this.BC.value] = _this.A.register._;
            }
        }
    }

}