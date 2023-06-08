import { Register8bit } from './register';
import { FlagRegister } from "./FlagRegister";
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
    private registersLibrary16bit!: { [key: string]: HiLoRegister | StackPointer }
    private flags!: { [key: string]: boolean }
    private IME: boolean;

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
        this.IME = false;
        
        this.RAM = new Uint8Array(0xFFFF);
        this.registersLibrary8bit = {
            "A": this.A,
            "B": this.B,
            "C": this.C,
            "D": this.D,
            "E": this.E,
            "F": this.F,
            "H": this.H,
            "L": this.L,
        };

        this.registersLibrary16bit = {
            "AF": this.AF,
            "BC": this.BC,
            "DE": this.DE,
            "HL": this.HL,
            "SP": this.SP
        };

        this.flags = {
            "Z": this.F.zeroFlag,
            "H": this.F.halfCarryFlag,
            "N": this.F.zeroFlag,
            "C": this.F.carryFlag
        };

        this.populateOpcodes();
    }

    populateOpcodes() {
        this.opCodesLibrary = {
            0x00: () => { undefined; },
            0x10: () => {
                //STOP instruction, single byte
                //what's this do??
            },
            0x20: () => this.conditionalJump(this.readFlag("Z") == false),
            0x30: () => this.conditionalJump(this.readFlag("C") == false),

            0x01: () => this.loadRegisterImmediate_16(this.BC, this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC())),
            0x11: () => this.loadRegisterImmediate_16(this.DE, this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC())),
            0x21: () => this.loadRegisterImmediate_16(this.HL, this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC())),
            0x31: () => this.loadRegisterImmediate_16(this.SP, this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC())),
            
            0x02: () => {
                this.loadMemoryRegister(this.BC.getRegister(), this.A);
            },
            0x12: () => this.loadMemoryRegister(this.RAM[this.DE.getRegister()], this.A),
            0x22: () => {
                this.loadMemoryRegister(this.HL.getRegister(), this.A);
                this.HL.setRegister(this.HL.getRegister() + 1);
            },
            0x32: () => {
                this.loadMemoryRegister(this.HL.getRegister(), this.A);
                this.HL.setRegister(this.HL.getRegister() - 1);
            },
            
            0x03: () => this.increment_16(this.BC),
            0x13: () => this.increment_16(this.DE),
            0x23: () => this.increment_16(this.HL),
            0x33: () => this.increment_16(this.SP),

            0x04: () => this.increment(this.B),
            0x14: () => this.increment(this.D),
            0x24: () => this.increment(this.H),
            0x34: () => this.incrementMemory(this.HL.getRegister()),

            0x05: () => this.decrement(this.B),
            0x15: () => this.decrement(this.D),
            0x25: () => this.decrement(this.H),
            0x35: () => this.decrementMemory(this.HL.getRegister()),

            0x06: () => this.loadRegisterImmediate(this.B),
            0x16: () => this.loadRegisterImmediate(this.D),
            0x26: () => this.loadRegisterImmediate(this.H),
            0x36: () => this.loadMemoryImmediate(this.HL.getRegister()),

            0x07: () => {
                const seventh_bit_value = 0x80 & this.A.value;
                this.A.value <<= 1;
                this.A.value &= 0xFF;
                seventh_bit_value == 0
                    ? this.A.value &= 0xFE : this.A.value |= 1;
                this.updateFlags(false, false, false, seventh_bit_value == 1);
            },
            0x17: () => {
                const seventh_bit_a = 0x80 & this.A.value;
                const numeric_c_flag = this.flags["C"] == true ? 1 : 0;
                this.A.value <<= 1;
                this.A.value ^= numeric_c_flag; //XOR
                this.updateFlags(false, false, false, seventh_bit_a == 1);
            },
            0x27: () => {
                //DAA
                //if least significant 4 bits of A > 9, OR H is true
                //      A = A + 0x06
                //      THEN, check 4 most significant bits of A, if they are > 9 OR C is true
                //      A = A + 0x60
                //      if 0x60 was added, C is set to true, if not, C is set to false
                let overflowCheck = false;
                let carryCheck = false;
                const a_lo_bits = this.A.value & 0x0F;
                if (a_lo_bits > 0x09 || this.flags["H"]) {
                    overflowCheck = this.A.value > 0xF9;
                    this.A.value += 0x06;
                    const a_hi_bits = this.A.value >> 4;

                    if (a_hi_bits > 0x09 || this.flags["C"]) {
                        this.A.value += 0x60;
                        if (!overflowCheck) {
                            overflowCheck = this.A.value > 0x9F;
                        }
                        carryCheck = true
                    }
                    else {
                        carryCheck = false;
                    }
                }
                this.updateFlags(this.A.value == 0, undefined, false, carryCheck);
            },
            0x37: () => {
                this.updateFlags(undefined, false, false, true);
            },

            0x08: () => this.set8bitValueUsingPC(this.SP.getStackValue()),
            0x18: () => this.jump(),
            0x28: () => this.conditionalJump(this.flags["Z"] == true),
            0x38: () => this.conditionalJump(this.flags["C"] == true),

            0x09: () => this.add_HL(this.BC),
            0x19: () => this.add_HL(this.DE),
            0x29: () => this.add_HL(this.HL),
            0x39: () => this.add_HL(this.SP),

            0x0A: () => this.loadAccumulator(this.RAM[this.BC.getRegister()]),
            0x1A: () => this.loadAccumulator(this.RAM[this.DE.getRegister()]),
            0x2A: () => {
                this.loadAccumulator(this.RAM[this.HL.getRegister()]);
                this.increment_16(this.HL);
            },
            0x3A: () => {
                this.loadAccumulator(this.RAM[this.HL.getRegister()]);
                this.decrement_16(this.HL);
            },

            0x0B: () => this.decrement_16(this.BC),
            0x1B: () => this.decrement_16(this.DE),
            0x2B: () => this.decrement_16(this.HL),
            0x3B: () => this.decrement_16(this.SP),

            0x0C: () => this.increment(this.C),
            0x1C: () => this.increment(this.E),
            0x2C: () => this.increment(this.L),
            0x3C: () => this.increment(this.A),

            0x0D: () => this.decrement(this.C),
            0x1D: () => this.decrement(this.E),
            0x2D: () => this.decrement(this.L),
            0x3D: () => this.decrement(this.A),
            
            0x0E: () => this.loadRegisterImmediate(this.C),
            0x1E: () => this.loadRegisterImmediate(this.E),
            0x2E: () => this.loadRegisterImmediate(this.L),
            0x3E: () => this.loadRegisterImmediate(this.A),

            0x0F: () => {
                const first_bit_value = this.A.value & 1;
                this.A.value >>= 1;
                this.A.value &= 0xFF;
                first_bit_value == 0
                    ? this.A.value &= 0xEF : this.A.value |= 0x80
                this.updateFlags(false, false, false, first_bit_value == 1);
            },
            0x1F: () => {
                const first_bit_a = (0x01 & this.A.value) == 1;
                this.A.value >>= 1;
                if (this.flags["C"]) {
                    this.A.value |= 0x80;
                } else {
                    this.A.value &= 0x7F;
                }
                this.updateFlags(false, false, false, first_bit_a);
            },
            0x2F: () => {
                this.A.value = ~this.A.value;
                this.flags["N"] = true;
                this.flags["H"] = true;
            },
            0x3F: () => {
                this.flags["C"] = !this.flags["C"];
                this.flags["N"] = false;
                this.flags["H"] = false;
            },

            0x40: () => this.loadRegisterRegister(this.B, this.B),
            0x50: () => this.loadRegisterRegister(this.D, this.B),
            0x60: () => this.loadRegisterRegister(this.H, this.B),
            0x70: () => this.loadMemoryRegister(this.HL.getRegister(), this.B),

            0x41: () => this.loadRegisterRegister(this.B, this.C),
            0x51: () => this.loadRegisterRegister(this.D, this.C),
            0x61: () => this.loadRegisterRegister(this.H, this.C),
            0x71: () => this.loadMemoryRegister(this.HL.getRegister(), this.C),

            0x42: () => this.loadRegisterRegister(this.B, this.D),
            0x52: () => this.loadRegisterRegister(this.D, this.D),
            0x62: () => this.loadRegisterRegister(this.H, this.D),
            0x72: () => this.loadMemoryRegister(this.HL.getRegister(), this.D),

            0x43: () => this.loadRegisterRegister(this.B, this.E),
            0x53: () => this.loadRegisterRegister(this.D, this.E),
            0x63: () => this.loadRegisterRegister(this.H, this.E),
            0x73: () => this.loadMemoryRegister(this.HL.getRegister(), this.E),

            0x44: () => this.loadRegisterRegister(this.B, this.H),
            0x54: () => this.loadRegisterRegister(this.D, this.H),
            0x64: () => this.loadRegisterRegister(this.H, this.H),
            0x74: () => this.loadMemoryRegister(this.HL.getRegister(), this.H),

            0x45: () => this.loadRegisterRegister(this.B, this.L),
            0x55: () => this.loadRegisterRegister(this.D, this.L),
            0x65: () => this.loadRegisterRegister(this.H, this.L),
            0x75: () => this.loadMemoryRegister(this.HL.getRegister(), this.L),

            0x46: () => this.loadRegisterMemory(this.B),
            0x56: () => this.loadRegisterMemory(this.D),
            0x66: () => this.loadRegisterMemory(this.H),
            0x76: () => this.IME = false,

            0x47: () => this.loadRegisterRegister(this.B, this.A),
            0x57: () => this.loadRegisterRegister(this.D, this.A),
            0x67: () => this.loadRegisterRegister(this.H, this.A),
            0x77: () => this.loadMemoryRegister(this.HL.getRegister(), this.A),

            0x48: () => this.loadRegisterRegister(this.C, this.B),
            0x58: () => this.loadRegisterRegister(this.E, this.B),
            0x68: () => this.loadRegisterRegister(this.L, this.B),
            0x78: () => this.loadAccumulator(this.B.value),
 
            0x49: () => this.loadRegisterRegister(this.C, this.C),
            0x59: () => this.loadRegisterRegister(this.E, this.C),
            0x69: () => this.loadRegisterRegister(this.L, this.C),
            0x79: () => this.loadAccumulator(this.C.value),

            0x4A: () => this.loadRegisterRegister(this.C, this.D),
            0x5A: () => this.loadRegisterRegister(this.E, this.D),
            0x6A: () => this.loadRegisterRegister(this.L, this.D),
            0x7A: () => this.loadAccumulator(this.D.value),

            0x4B: () => this.loadRegisterRegister(this.C, this.E),
            0x5B: () => this.loadRegisterRegister(this.E, this.E),
            0x6B: () => this.loadRegisterRegister(this.L, this.E),
            0x7B: () => this.loadAccumulator(this.E.value),

            0x4C: () => this.loadRegisterRegister(this.C, this.H),
            0x5C: () => this.loadRegisterRegister(this.E, this.H),
            0x6C: () => this.loadRegisterRegister(this.L, this.H),
            0x7C: () => this.loadAccumulator(this.H.value),

            0x4D: () => this.loadRegisterRegister(this.C, this.L),
            0x5D: () => this.loadRegisterRegister(this.E, this.L),
            0x6D: () => this.loadRegisterRegister(this.L, this.L),
            0x7D: () => this.loadAccumulator(this.L.value),

            0x4E: () => this.loadRegisterMemory(this.C),
            0x5E: () => this.loadRegisterMemory(this.E),
            0x6E: () => this.loadRegisterMemory(this.L),
            0x7E: () => this.loadAccumulator(this.HL.getRegister()),

            0x4F: () => this.loadRegisterRegister(this.A, this.C),
            0x5F: () => this.loadRegisterRegister(this.A, this.E),
            0x6F: () => this.loadRegisterRegister(this.A, this.L),
            0x7F: () => this.loadAccumulator(this.A.value),

            0x80: () => this.add(this.B),
            0x90: () => this.subtract(this.B),
            0xA0: () => this.and(this.B.value),
            0xB0: () => this.or(this.B.value),

            0x81: () => this.add(this.C),
            0x91: () => this.subtract(this.C),
            0xA1: () => this.and(this.C.value),
            0xB1: () => this.or(this.C.value),

            0x82: () => this.add(this.D),
            0x92: () => this.subtract(this.D),
            0xA2: () => this.and(this.D.value),
            0xB2: () => this.or(this.D.value),

            0x83: () => this.add(this.E),
            0x93: () => this.subtract(this.E),
            0xA3: () => this.and(this.E.value),
            0xB3: () => this.or(this.E.value),
            
            0x84: () => this.add(this.H),
            0x94: () => this.subtract(this.H),
            0xA4: () => this.and(this.H.value),
            0xB4: () => this.or(this.H.value),

            0x85: () => this.add(this.L),
            0x95: () => this.subtract(this.L),
            0xA5: () => this.and(this.L.value),
            0xB5: () => this.or(this.L.value),
            
            0x86: () => this.addFromMemory(),
            0x96: () => this.subtractFromMemory(),
            0xA6: () => this.and(this.HL.getRegister()),
            0xB6: () => this.or(this.HL.getRegister()),

            0x87: () => this.add(this.A),
            0x97: () => this.subtract(this.A),
            0xA7: () => this.and(this.A.value),
            0xB7: () => this.or(this.A.value),

            0x88: () => this.addCarry(this.B),
            0x98: () => this.subtractCarry(this.B),
            0xA8: () => this.xor(this.B.value),
            0xB8: () => this.cmp(this.B.value),
            
            0x89: () => this.addCarry(this.C),
            0x99: () => this.subtractCarry(this.C),
            0xA9: () => this.xor(this.C.value),
            0xB9: () => this.cmp(this.C.value),
            
            0x8A: () => this.addCarry(this.D),
            0x9A: () => this.subtractCarry(this.D),
            0xAA: () => this.xor(this.D.value),
            0xBA: () => this.cmp(this.D.value),

            0x8B: () => this.addCarry(this.E),
            0x9B: () => this.subtractCarry(this.E),
            0xAB: () => this.xor(this.E.value),
            0xBB: () => this.cmp(this.E.value),
            
            0x8C: () => this.addCarry(this.H),
            0x9C: () => this.subtractCarry(this.H),
            0xAC: () => this.xor(this.H.value),
            0xBC: () => this.cmp(this.H.value),
            
            0x8D: () => this.addCarry(this.L),
            0x9D: () => this.subtractCarry(this.L),
            0xAD: () => this.xor(this.L.value),
            0xBD: () => this.cmp(this.L.value),
            
            0x8E: () => this.addCarry(this.C),
            0x9E: () => this.subtractCarry(this.C),
            0xAE: () => this.xor(this.C.value),
            0xBE: () => this.cmp(this.C.value),
            
            0x8F: () => this.addFromMemory(true),
            0x9F: () => {
                this.subtractFromMemory(true);
                this.updateFlags(undefined, true, undefined, undefined);
            },
            0xAF: () => {
                this.xor(this.A.value);
                this.updateFlags(true, false, false, false);
            },
            0xBF: () => {
                this.cmp(this.A.value);
                this.updateFlags(false, false, true, true);
            },

            0xC0: () => {
                if (this.flags["Z"] == false) {
                    this.PC.setCounterValue(this.read16BitRegister("SP").getRegister() + this.read16BitRegister("SP").getRegister());
                }
            },

            0xD0: () => {
                if (this.flags["C"] == false) {
                    this.PC.setCounterValue(this.read16BitRegister("SP").getRegister() + this.read16BitRegister("SP").getRegister());
                }
            },

            0xE0: () => {
                const value = this.read8bitValueUsingPC();
                this.RAM[0xFF + value] = this.A.value;
            },

            0xF0: () => {
                const value = this.read8bitValueUsingPC();
                this.A.value = this.RAM[0xFF + value];
            },

            0xC1: () => {
                this.load16BitUnsignedValue(this.BC);
            },

            0xD1: () => {
                this.load16BitUnsignedValue(this.DE);
            },

            0xE1: () => {
                this.load16BitUnsignedValue(this.HL);
            },

            0xF1: () => {
                this.load16BitUnsignedValue(this.AF);
                const flag = this.AF.LoRegister;
                this.updateFlags((flag & 0x80) > 0, (flag & 0x40) > 0, (flag & 0x20) > 0, (flag & 0x10) > 0);
            },
        }
    }

    
    updateFlags(zState : boolean | undefined, nState: boolean | undefined, hState: boolean | undefined, cState: boolean | undefined) {
        this.flags["Z"] = zState != undefined ? zState : this.flags["Z"];
        this.flags["N"] = nState != undefined ? nState : this.flags["N"];
        this.flags["H"] = hState != undefined ? hState : this.flags["H"];
        this.flags["C"] = cState != undefined ? cState : this.flags["C"];
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

    read16BitRegister(registerKey: string): HiLoRegister | StackPointer {
        return this.registersLibrary16bit[registerKey];
    }

    configureProgramCounter(value: number): void{
        this.PC.setCounterValue(value);
    }

    readPC(): number{
        return this.PC.getCounterNoincrement();
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

    build16bitValue(hi: number, lo: number): number { return hi << 8 | lo; }
    
    readFlag(flag_value: string): boolean{
        return this.flags[flag_value];
    }

    setFlag(flag : string, flag_value: boolean): void {
        this.flags[flag] = flag_value;
    }

    private loadMemoryRegister(memoryLocation: number, register: Register8bit) {
        this.RAM[memoryLocation] = register.value;
    }

    private loadRegisterImmediate(register: Register8bit) {
        register.value = this.RAM[this.PC.getCounterValue()];
    }

    private loadRegisterRegister(registerTo: Register8bit, registerFrom: Register8bit) {
        registerTo.value = registerFrom.value;
    }

    private loadRegisterMemory(register: Register8bit) {
        register.value = this.RAM[this.HL.getRegister()];
    }

    private loadAccumulator(value: number) {
        this.A.value = value;
    }

    private loadMemoryImmediate(address: number) {
        this.RAM[address] = this.read8bitValueUsingPC();
    }

    private loadRegisterImmediate_16(register: HiLoRegister | StackPointer, immediateValue: number) {
        if (immediateValue > 0xFFFF) {
            throw new Error(`ERROR: Unable to load into 16bit register ${register}, ${immediateValue} is too large`);
        }
        register.setRegister(immediateValue);
    }

    private conditionalJump(conditionalResult: boolean) {
        const jump_address = this.read8bitValueUsingPC();
        if (conditionalResult) {
            this.PC.setCounterValue(this.PC.getCounterNoincrement() + jump_address);
        }
    }

    private jump() {
        const jump_by_n_bits = this.read8bitValueUsingPC();
        this.PC.setCounterValue(this.PC.getCounterNoincrement() + jump_by_n_bits);
    }

    private increment(register: Register8bit) {
        const initialValue = register.value;
        register.value++;
        this.updateFlags(register.value == 0, false, (initialValue & 0x08) > 0, undefined);
    }

    private incrementMemory(memoryLocation: number) {
        const initialValue = this.RAM[memoryLocation];
        this.RAM[memoryLocation]++;
        this.updateFlags(this.RAM[memoryLocation] == 0, false, (initialValue & 0x08) > 0, undefined);
    }
    
    private decrement(register: Register8bit) {
        const initialValue = register.value;
        register.value--;
        this.updateFlags(register.value == 0, true, (initialValue & 0x08) > 0, undefined);
    }

    private decrementMemory(memoryLocation: number) {
        const initialValue = this.RAM[memoryLocation];
        this.RAM[memoryLocation]--;
        this.updateFlags(this.RAM[memoryLocation] == 0, true, (initialValue & 0x08) > 0, undefined);
    }

    private increment_16(register: HiLoRegister | StackPointer) {
        register.setRegister(register.getRegister() + 1);
    }

    private decrement_16(register: HiLoRegister | StackPointer) {
        register.setRegister(register.getRegister() - 1);
    }

    private add_HL(register: HiLoRegister | StackPointer) {
        const result = this.HL.getRegister() + this.HL.getRegister();
        this.HL.setRegister(this.HL.getRegister() + register.getRegister());
        this.updateFlags(undefined,false,undefined, result > 0xFFFF )
    }

    private add(register: Register8bit) {
        const carryState = this.getAddCarryStatus(register.value);
        this.A.value += register.value;
        this.updateFlags(this.A.value == 0, false, ...carryState);
    }

    private addFromMemory(isCarry = false) {
        const carryFlagValue = isCarry ? this.flags["C"] ? 1 : 0 : 0;
        const carryState = this.getAddCarryStatus(this.HL.getRegister() + carryFlagValue);
        this.A.value += (carryFlagValue + this.HL.getRegister())
        this.updateFlags(this.A.value == 0, false, ...carryState)
    }

    private addCarry(register: Register8bit) {
        const result = this.A.value + register.value + (this.flags["C"] ? 1 : 0);
        const carryState = this.getAddCarryStatus(register.value, true);
        this.A.value = result;
        this.updateFlags(this.A.value == 0, false, ...carryState);
    }

    private subtract(register: Register8bit) {
        const carryResult = this.getSubCarryStatus(register.value);
        this.A.value -= register.value;
        this.updateFlags(this.A.value == 0, true, ...carryResult)
    }

    private subtractCarry(register: Register8bit) {
        const result = this.A.value - (this.flags["C"] ? 1 : 0) - register.value;
        const carryState = this.getSubCarryStatus(register.value, true);
        this.A.value = result;
        this.updateFlags(this.A.value == 0, true, ...carryState);
    }

    private subtractFromMemory(isCarry = false) {
        const carryFlagValue = isCarry ? this.flags["C"] ? 1 : 0 : 0;
        const carryState = this.getSubCarryStatus(this.HL.getRegister() - carryFlagValue);
        this.A.value -= (this.HL.getRegister() - carryFlagValue)
        this.updateFlags(this.A.value == 0, true, ...carryState);
    }

    private getAddCarryStatus(value: number, isCarryOpcode = false): [boolean, boolean] {
        const isCarry = (isCarryOpcode ? 1 : 0);
        const msb_carry = this.A.value + value + isCarry > 0xFF;
        const lsb_carry = 0x10 == (0x10 & (((this.A.value + isCarry) & 0xF) + (value & 0xF)));
        return [msb_carry, lsb_carry]
    }

    private getSubCarryStatus(value : number, isCarryOpcode = false): [boolean, boolean | undefined] {
        const isCarry = (isCarryOpcode ? 1 : 0);
        const msb_carry = this.A.value - value - isCarry < 0;
        const lsb_carry = 0x10 == (0x10 & (((this.A.value - isCarry) & 0xF) + (value & 0xF)));
        return [msb_carry, lsb_carry];
    }

    private and(value: number) {
        this.A.value &= value;
        this.updateFlags(this.A.value == 0, false, true, false);
    }

    private or(value: number) {
        this.A.value |= value;
        this.updateFlags(this.A.value == 0, false, false, false);
    }

    private xor(value: number) {
        this.A.value ^= value;
        this.updateFlags(this.A.value == 0, false, false, false);
    }

    private cmp(value: number) {
        const carryResult = this.getSubCarryStatus(value);
        this.A.value -= value;
        this.updateFlags(this.A.value == 0, true, ...carryResult)
    }

    private load16BitUnsignedValue(register: HiLoRegister) {
        register.HiRegister = this.readSP().getRegister();
        register.LoRegister = this.readSP().getRegister();
    }
}