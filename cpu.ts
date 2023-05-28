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

    private opCodesLibrary!: {[code : number] : (...args: number[]) => void};

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

        this.populateOpcodes();

    }

    readA(): Register8bit {
        return this.A;
    }

    readB(): Register8bit {
        return this.B;
    }

    readC(): Register8bit {
        return this.C;
    }

    readD(): Register8bit {
        return this.D;
    }

    readE(): Register8bit {
        return this.E;
    }

    readF(): Register8bit {
        return this.F;
    }

    readH(): Register8bit {
        return this.H;
    }

    readL(): Register8bit {
        return this.L;
    }

    readAF(): HiLoRegister {
        return this.AF;
    }

    readBC(): HiLoRegister {
        return this.BC;
    }

    updateFlags(value: number, flagState: string) {
        
    }

    executeOpcode(code: number, ...codeParams: number[]) {
        this.opCodesLibrary[code](...codeParams);
    }

    readMemory(address: number): number {
        return this.RAM[address];
    }

    populateOpcodes() {
        this.opCodesLibrary = {
            0x00: () => {},
            0x01: (d16: number) => this.BC.setRegister(d16),
            0x02: () => this.RAM[this.BC.value] = this.A.register.value,
            0x03: () => this.BC.value++,
            0x04: () => {
                this.B.register.value++;
                this.updateFlags(this.B.register.value, "z0h-");
            },
            0x05: () => {
                this.B.register.value--;
                this.updateFlags(this.B.register.value, "z1h-");
            },
            0x06: (d8: number) => this.B.register.value = d8,
            0x07: () => {
                let seventh_bit_value = 0x80 & this.A.register.value;
                this.A.register.value <<= 1;
                this.A.register.value &= 0xFF;
                seventh_bit_value == 0
                    ? this.A.register.value &= 0xFE : this.A.register.value |= 1;
                this.updateFlags(this.A.register.value, "000c");
            },
            0x3E: (d8: number) => this.A.register.value = d8,
        }
    }
}