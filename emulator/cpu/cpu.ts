import { Register8bit, FlagRegister } from './register';
import { ProgramCounter } from "./ProgramCounter";
import { StackPointer } from "./StackPointer";
import { HiLoRegister } from "./HiLoRegister";
import { Register16Bit } from './register16bit';

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

    private opCodesLibrary!: { [code: number]: () => void };
    private registersLibrary8bit!: { [key : string] : Register8bit}
    private registersLibrary16bit!: { [key : string] : HiLoRegister}
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
        this.registersLibrary8bit = {
            "A" : this.A,
            "B" : this.B,
            "C" : this.C,
            "D" : this.D,
            "E" : this.E,
            "F" : this.F,
            "H" : this.H,
            "L": this.L,
        }

        this.registersLibrary16bit = {
            "AF": this.AF,
            "BC": this.BC,
            "DE": this.DE,
            "HL": this.HL,
        }

        this.populateOpcodes();
    }

    populateOpcodes() {
        this.opCodesLibrary = {
            0x00: () => {},
            0x01: () => {
                this.BC.setRegister(this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC()))
            },
            0x02: () => this.RAM[this.BC.getRegisterValue()] = this.A.register.value,
            0x03: () => this.BC.setRegister(this.BC.getRegisterValue()+1),
            0x04: () => {
                this.B.register.value++;
                this.updateFlags(this.B.register.value, "z0h-");
            },
            0x05: () => {
                this.B.register.value--;
                this.updateFlags(this.B.register.value, "z1h-");
            },
            0x06: () => this.B.register.value = this.read8bitValueUsingPC(),
            0x07: () => {
                let seventh_bit_value = 0x80 & this.A.register.value;
                this.A.register.value <<= 1;
                this.A.register.value &= 0xFF;
                seventh_bit_value == 0
                    ? this.A.register.value &= 0xFE : this.A.register.value |= 1;
                this.updateFlags(this.A.register.value, "000c");
            },
            0x08: () => this.set8bitValueUsingPC(this.SP.getStackValue()),
            0x09: () => {
                this.HL.setRegister(this.HL.getRegisterValue() + this.BC.getRegisterValue());
                this.updateFlags(this.HL.getRegisterValue(),"-0hc");
            },
            0x0A: () => this.A.register.value = this.RAM[this.BC.getRegisterValue()],
            0x0B: () => this.BC.setRegister(this.BC.getRegisterValue() - 1),
            0x0C: () => {
                this.C.register.value++;
                this.updateFlags(this.C.register.value,"z0h-");
            },
            0x0D: () => { 
                this.C.register.value--;
                this.updateFlags(this.C.register.value, "z1h-");
            },
            0x0E: () => {
                this.C.register.value = this.read8bitValueUsingPC();
            },
            0x0F: () => { 
                let first_bit_value = this.A.register.value & 1;
                this.A.register.value >>= 1;
                this.A.register.value &= 0xFF;
                first_bit_value == 0
                    ? this.A.register.value &= 0xEF : this.A.register.value |= 0x80
                this.updateFlags(this.A.register.value, "000c");
            },
            0x10: () => {
                //STOP instruction, single byte
                //what's this do??
            },
            0x11: () => this.DE.setRegister(this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC())),
            0x12: () => this.RAM[this.DE.getRegisterValue()] = this.A.register.value,
            0x13: () => this.DE.setRegister(this.DE.getRegisterValue() + 1),
            0x14: () => {
                this.D.register.value++;
                this.updateFlags(this.D.register.value, "z0h-");
            },
            0x15: () => {
                this.D.register.value--;
                this.updateFlags(this.D.register.value, "z0h-");
            },
            0x16: () => this.D.register.value = this.read8bitValueUsingPC(),
            0x21: () => this.HL.setRegister(this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC())),
            0x31: () => {
                this.SP.setStackValue(this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC()));
            },
            0x3E: () => this.A.register.value = this.read8bitValueUsingPC(),
        }
    }

    
    updateFlags(value: number, flagState: string) {
        
    }

    executeOpcode(code: number) {
        this.opCodesLibrary[code]();
    }

    readMemory(address: number): number {
        return this.RAM[address];
    }

    readSP(): StackPointer {
        return this.SP;
    }

    read8BitRegister(registerKey: string): Register8bit {
        return this.registersLibrary8bit[registerKey];
    }

    read16BitRegister(registerKey: string): HiLoRegister {
        return this.registersLibrary16bit[registerKey];
    }

    configureProgramCounter(value: number): void{
        this.PC.setCounterValue(value);
    }

    configureRamValue(value: number, address: number): void{
        this.RAM[address] = value;
    }

    read8bitValueUsingPC(): number {
        return this.RAM[this.PC.getCounterValue()];
    }

    set8bitValueUsingPC(value: number): void {
        this.RAM[this.PC.getCounterValue()] = value;
    }

    build16bitValue(hi: number, lo: number): number {return hi << 8 | lo;}

}