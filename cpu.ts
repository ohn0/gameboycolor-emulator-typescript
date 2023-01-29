import {Register8bit} from './register';
import {HiLoRegister, StackPointer, ProgramCounter} from './register16bit';

export class CPU {
    
    private A: Register8bit;
    private B: Register8bit;
    private C: Register8bit;
    private D: Register8bit;
    private E: Register8bit;
    private H: Register8bit;
    private L: Register8bit;

    private AF: HiLoRegister;
    private BC: HiLoRegister;
    private DE: HiLoRegister;
    private HL: HiLoRegister;
    private SP: StackPointer;
    private PC: ProgramCounter;
    
    constructor() {
        this.A = new Register8bit(0);
        this.B = new Register8bit(0);
        this.C = new Register8bit(0);
        this.D = new Register8bit(0);
        this.E = new Register8bit(0);
        this.H = new Register8bit(0);
        this.L = new Register8bit(0);

        this.AF = new HiLoRegister(this.A, undefined, "AF");
        this.BC = new HiLoRegister(this.B, this.C, "BC");
        this.DE = new HiLoRegister(this.D, this.E, "DE");
        this.HL = new HiLoRegister(this.H, this.L, "HL");

        this.SP = new StackPointer("Stack Pointer");
        this.PC = new ProgramCounter("Program Counter");
    }


}