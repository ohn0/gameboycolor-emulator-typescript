import { InitializationMapper } from './../MemoryMap/initializationMapper';
import { InterruptHandler } from './InterruptHandler';
import { counter } from './timers/counter';
import { divider } from './timers/divider';
import { clock } from './timers/clock';
import { INTERRUPT_SOURCES, OPCODE_COSTS_T_STATES } from './constants';
import { BitwiseOperationSolver } from './bitwiseOperationSolver';
import { Register8bit } from './register';
import { FlagRegister } from "./FlagRegister";
import { ProgramCounter } from "./ProgramCounter";
import { StackPointer } from "./StackPointer";
import { HiLoRegister } from "./HiLoRegister";
import { Uint8 } from '../../primitives/uint8';
import { controlState, controlStates } from './timers/controlStates';
import { Interrupt } from './interrupt';
import { RAM } from '../RAM/RAM';
import { Logger } from '../../logger/logger';

export class CPU {

    private RAM: RAM;
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
    private bitwiseSolver!: BitwiseOperationSolver;
    private IME_scheduled: boolean;
    private operationCost!: number;
    private operationCostModified: boolean;
    private divider: divider;
    private counter: counter;
    private clock: clock;
    private controlState: controlState;
    private interruptHandler: InterruptHandler;
    private limit!: number;
    private gameBoyType = "DMG";
    private isQuitting = false;
    private logger: Logger;

    debugState: boolean;

    constructor(ram: RAM, skipBoot = false) {
        this.logger = new Logger();
        this.A = new Register8bit(0, "A");
        this.B = new Register8bit(0, "B");
        this.C = new Register8bit(0, "C");
        this.D = new Register8bit(0, "D");
        this.E = new Register8bit(0, "E");
        this.F = new FlagRegister();
        this.H = new Register8bit(0, "H");
        this.L = new Register8bit(0, "L");
        this.AF = new HiLoRegister(this.A, this.F, "AF");
        this.BC = new HiLoRegister(this.B, this.C, "BC");
        this.DE = new HiLoRegister(this.D, this.E, "DE");
        this.HL = new HiLoRegister(this.H, this.L, "HL");
        
        this.SP = new StackPointer(0xFF,0xFF, "SP");
        this.PC = new ProgramCounter("PC");
        this.IME_scheduled = false;
        this.interruptHandler = new InterruptHandler();
        this.interruptHandler.addInterrupt(new Interrupt(INTERRUPT_SOURCES.INTERRUPT_VBLANK, 0x40, 1, 0));
        this.interruptHandler.addInterrupt(new Interrupt(INTERRUPT_SOURCES.INTERRUPT_LCD_STAT, 0x48, 2, 1));
        this.interruptHandler.addInterrupt(new Interrupt(INTERRUPT_SOURCES.INTERRUPT_TIMER, 0x50, 3, 2));
        this.interruptHandler.addInterrupt(new Interrupt(INTERRUPT_SOURCES.INTERRUPT_SERIAL, 0x58, 4, 3));
        this.interruptHandler.addInterrupt(new Interrupt(INTERRUPT_SOURCES.INTERRUPT_JOYPAD, 0x60, 5, 4));
        this.RAM = ram;
        this.debugState = false;

        this.registersLibrary8bit = {
            "A": this.A,
            "F": this.F,
            "B": this.B,
            "C": this.C,
            "D": this.D,
            "E": this.E,
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
        
        if (skipBoot) {
            this.RAM.ram = InitializationMapper.initializePostBootRAMState(this.RAM.ram, this.gameBoyType);
            this.configureProgramCounter(0x0100);
            if (this.gameBoyType == "DMG") {
                
                this.flags["Z"] = true;
                this.flags["N"] = false;
                this.flags["H"] = true;
                this.flags["C"] = true;
                this.F.value = 0b10110000;

                this.A.value = 0x01;
                this.B.value = 0x00;
                this.C.value = 0x13;
                this.D.value = 0x00;
                this.E.value = 0xD8;
                this.H.value = 0x01;
                this.L.value = 0x4D;
                
                this.SP.setRegister(0xFFFE);
            }
        }

        this.bitwiseSolver = new BitwiseOperationSolver(this);
        this.operationCostModified = false;
        //MUST LOAD RAM BEFORE SETTING DIVIDER AND COUNTER TIMERS
        this.controlState = controlStates.getControlState(this.readMemory(0xFF07));
        this.divider = new divider();
        this.counter = new counter(this.controlState.clockRate);
        this.clock = new clock(
            () => {
                this.divider.incrementCounter();
                this.RAM.write(this.divider.location, this.divider.registerCounter);
                // this.RAM[this.divider.location] = this.divider.registerCounter; //don't call writeMemory for this write
            },
            () => this.counter.tick(),
            this.controlState);

        this.populateOpcodes();
    }

    private populateOpcodes() {
        this.opCodesLibrary = {
            0x00: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
             },
            0x10: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                this.read8bitValueUsingPC();
                this.isQuitting = true;
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
            0x12: () => this.loadMemoryRegister(
                (this.DE.getRegister()), this.A),
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
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                const seventh_bit_value = 0x80 & this.A.value;
                this.A.value <<= 1;
                this.A.value &= 0xFF;
                seventh_bit_value == 0
                    ? this.A.value &= 0xFE : this.A.value |= 1;
                this.updateFlags(false, false, false, seventh_bit_value == 1);
            },
            0x17: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                const seventh_bit_a = 0x80 & this.A.value;
                const numeric_c_flag = this.flags["C"] == true ? 1 : 0;
                this.A.value <<= 1;
                if (numeric_c_flag) {
                    this.A.value |= 1;
                }
                this.updateFlags(false, false, false, seventh_bit_a > 0);
            },
            0x27: () => {
                //DAA
                //if least significant 4 bits of A > 9, OR H is true
                //      A = A + 0x06
                //      THEN, check 4 most significant bits of A, if they are > 9 OR C is true
                //      A = A + 0x60
                //      if 0x60 was added, C is set to true, if not, C is set to false
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
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
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                this.updateFlags(undefined, false, false, true);
            },

            0x08: () => this.writeUnsigned16BitFromSPToMemory(),
            0x18: () => this.jump(),
            0x28: () => this.conditionalJump(this.flags["Z"] == true),
            0x38: () => this.conditionalJump(this.flags["C"] == true),

            0x09: () => this.add_HL(this.BC),
            0x19: () => this.add_HL(this.DE),
            0x29: () => this.add_HL(this.HL),
            0x39: () => this.add_HL(this.SP),

            0x0A: () => this.loadAccumulator(this.readMemory(this.BC.getRegister())),
            0x1A: () => this.loadAccumulator(this.readMemory(this.DE.getRegister())),
            0x2A: () => {
                this.loadAccumulator(this.readMemory(this.HL.getRegister()));
                this.increment_16(this.HL);
            },
            0x3A: () => {
                this.loadAccumulator(this.readMemory(this.HL.getRegister()));
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
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                const first_bit_value = this.A.value & 1;
                this.A.value >>= 1;
                this.A.value &= 0xFF;
                first_bit_value == 0
                    ? this.A.value &= 0xEF : this.A.value |= 0x80
                this.updateFlags(false, false, false, first_bit_value == 1);
            },
            0x1F: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
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
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                this.A.value = ~this.A.value;
                this.flags["N"] = true;
                this.flags["H"] = true;
            },
            0x3F: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
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
            0x76: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                this.interruptHandler.masterInterruptFlag = false;
            },

            0x47: () => this.loadRegisterRegister(this.B, this.A),
            0x57: () => this.loadRegisterRegister(this.D, this.A),
            0x67: () => this.loadRegisterRegister(this.H, this.A),
            0x77: () => this.loadMemoryRegister(this.HL.getRegister(), this.A),

            0x48: () => this.loadRegisterRegister(this.C, this.B),
            0x58: () => this.loadRegisterRegister(this.E, this.B),
            0x68: () => this.loadRegisterRegister(this.L, this.B),
            0x78: () => this.loadAccumulator(this.B.value, true),
 
            0x49: () => this.loadRegisterRegister(this.C, this.C),
            0x59: () => this.loadRegisterRegister(this.E, this.C),
            0x69: () => this.loadRegisterRegister(this.L, this.C),
            0x79: () => this.loadAccumulator(this.C.value, true),

            0x4A: () => this.loadRegisterRegister(this.C, this.D),
            0x5A: () => this.loadRegisterRegister(this.E, this.D),
            0x6A: () => this.loadRegisterRegister(this.L, this.D),
            0x7A: () => this.loadAccumulator(this.D.value, true),

            0x4B: () => this.loadRegisterRegister(this.C, this.E),
            0x5B: () => this.loadRegisterRegister(this.E, this.E),
            0x6B: () => this.loadRegisterRegister(this.L, this.E),
            0x7B: () => this.loadAccumulator(this.E.value, true),

            0x4C: () => this.loadRegisterRegister(this.C, this.H),
            0x5C: () => this.loadRegisterRegister(this.E, this.H),
            0x6C: () => this.loadRegisterRegister(this.L, this.H),
            0x7C: () => this.loadAccumulator(this.H.value, true),

            0x4D: () => this.loadRegisterRegister(this.C, this.L),
            0x5D: () => this.loadRegisterRegister(this.E, this.L),
            0x6D: () => this.loadRegisterRegister(this.L, this.L),
            0x7D: () => this.loadAccumulator(this.L.value, true),

            0x4E: () => this.loadRegisterMemory(this.C),
            0x5E: () => this.loadRegisterMemory(this.E),
            0x6E: () => this.loadRegisterMemory(this.L),
            0x7E: () => this.loadAccumulator(this.readMemory(this.HL.getRegister())),

            0x4F: () => this.loadRegisterRegister(this.C, this.A),
            0x5F: () => this.loadRegisterRegister(this.E, this.A),
            0x6F: () => this.loadRegisterRegister(this.L, this.A),
            0x7F: () => this.loadAccumulator(this.A.value, true),

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
            0xA6: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.and(this.readMemory(this.HL.getRegister()));
            },
            0xB6: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.or(this.readMemory(this.HL.getRegister()));
            },

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
            
            0x8E: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.addCarryMemory(this.readMemory(this.HL.getRegister()))
            },
            0x9E: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8)
                this.subtractCarryMemory(this.readMemory(this.HL.getRegister()));
            },
            0xAE: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.xor(this.readMemory(this.HL.getRegister()))
            },
            0xBE: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.cmp(this.readMemory(this.HL.getRegister()))
            },
            
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
                this.conditionalRet(this.flags["Z"] == false);
            },

            0xD0: () => {
                this.conditionalRet(this.flags["C"] == false);
            },

            0xE0: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
                const value = this.read8bitValueUsingPC();
                this.writeMemory(this.A.value, 0xFF00 + value);
            },

            0xF0: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
                const value = this.read8bitValueUsingPC();
                this.A.value = this.readMemory(this.build16bitValue(value, 0xFF));
                // console.log(`read ${this.A.value.toString(16)} from ${this.build16bitValue(value, 0xff).toString(16)}`);

            },

            0xC1: () => {
                this.pop(this.BC);
            },

            0xD1: () => {
                this.pop(this.DE);
            },

            0xE1: () => {
                this.pop(this.HL);
            },

            0xF1: () => {
                this.pop(this.AF);
                this.updateFlags(this.F.zeroFlag, this.F.subtractionFlag, this.F.halfCarryFlag, this.F.carryFlag);
            },

            0xC2: () => {
                this.conditional16BitJump(this.flags["Z"] != false);
            },
            
            0xD2: () => {
                this.conditional16BitJump(this.flags["C"] != false);
            },

            0xE2: () => {
                this.loadMemoryRegister(this.readMemory(0xFF00 + this.C.value), this.A);
            },

            0xF2: () => {
                this.loadAccumulator(this.readMemory(0xFF00 + this.C.value));
            },

            0xC3: () => {
                this.PC.setCounterValue(
                    this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC()));
            },
            
            0xD3: () => {throw new Error("INVALID OPCODE 0xD3");},
            0xE3: () => { throw new Error("INVALID OPCODE 0xE3"); },
            0xF3: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                
            },

            0xC4: () => {
                this.conditionalCall(!this.flags["Z"], this.PC);
            },
            0xD4: () => {
                this.conditionalCall(!this.flags["C"], this.PC);
            },
            0xE4: () => {throw new Error("INVALID OPCODE 0xE4");},
            0xF4: () => { throw new Error("INVALID OPCODE 0xF4"); },
            
            0xC5: () => { this.push(this.BC); },
            0xD5: () => { this.push(this.DE); },
            0xE5: () => { this.push(this.HL); },
            0xF5: () => { this.push(this.AF); },

            0xC6: () => { this.addImmediate(); },
            0xD6: () => { this.subtractImmediate(); },
            0xE6: () => { this.and(this.read8bitValueUsingPC()); },
            0xF6: () => { this.or(this.read8bitValueUsingPC()); },

            0xC7: () => { this.rst(0x00); },
            0xD7: () => { this.rst(0x10); },
            0xE7: () => { this.rst(0x20); },
            0xF7: () => { this.rst(0x30); },

            0xC8: () => { this.conditionalRet(this.flags["Z"]); },
            0xD8: () => { this.conditionalRet(this.flags["C"]); },
            
            0xE8: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
                const spAddition = new Uint8(this.read8bitValueUsingPC())
                    .getSignedRepresentation();
                const h_flag_state = this.halfCarryOccurs(this.SP.getRegister(), spAddition);
                const c_flag_state   = 0x10 == (0x10 & (((this.SP.getRegister() ) & 0xF) + (spAddition & 0xF)));
            
                this.SP.setRegister(this.SP.getRegister() + spAddition);
                this.updateFlags(false, false, h_flag_state, c_flag_state);
            },

            0xF8: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
                const spImmediateLoad = this.SP.getRegister() + this.read8bitValueUsingPC(); 
                const h_flag_state = this.halfCarryOccurs(this.HL.getRegister(), spImmediateLoad);
                const c_flag_state   = 0x10 == (0x10 & (((this.HL.getRegister() ) & 0xF) + (spImmediateLoad & 0xF)));
                this.updateFlags(false, false, h_flag_state, c_flag_state);
            },

            0xC9: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
                this.conditionalRet(true);
            },

            0xD9: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
                this.conditionalRet(true);
                this.interruptHandler.masterInterruptFlag = true;
            },

            0xE9: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                this.PC.setRegister(this.HL.getRegister());
            },

            0xF9: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.SP.setRegister(this.HL.getRegister());
            },

            0xCA: () => {
                this.conditional16BitJump(this.flags["Z"]);
            },

            0xDA: () => {
                this.conditional16BitJump(this.flags["C"]);
            },

            0xEA: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
                this.writeMemory(this.A.value,
                    this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC()));
            },
            0xFA: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
                this.A.value =
                    this.readMemory(this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC()));
            },
            0xCB: () => {
                const key = this.read8bitValueUsingPC();
                let operationCost: number;
                if (((key & 0x6) == 0x6) || ((key & 0xE) == 0xE)) {
                    const cost12 = [0x46, 0x56, 0x66, 0x76, 0x4E, 0x5E, 0x6E, 0x7E];
                    operationCost = cost12.find(c => c == key) == undefined
                        ? OPCODE_COSTS_T_STATES.OPCODE_COST_16
                        : OPCODE_COSTS_T_STATES.OPCODE_COST_12;
                }
                operationCost = OPCODE_COSTS_T_STATES.OPCODE_COST_8;
                this.setOperationCost(operationCost);
                this.bitwiseSolver.executeOperation(key);
            },

            0xDB: () => { throw new Error("INVALID OPCODE 0xDB");},
            0xEB: () => { throw new Error("INVALID OPCODE 0xEB"); },

            0xFB: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                this.IME_scheduled = true;
            },

            0xCC: () => {
                this.conditionalCall(this.flags["Z"], this.PC);
            },

            0xDC: () => {
                this.conditionalCall(this.flags["C"], this.PC);
            },

            0xEC: () => {throw new Error("INVALID OPCODE 0xEC");},
            0xFC: () => { throw new Error("INVALID OPCODE 0xFC"); },

            0xCD: () => { this.conditionalCall(true, this.PC); },

            0xDD: () => {throw new Error("INVALID OPCODE 0xDD");},
            0xED: () => {throw new Error("INVALID OPCODE 0xED");},
            0xFD: () => { throw new Error("INVALID OPCODE 0xFD"); },

            0xCE: () => { this.addCarry(new Register8bit(this.read8bitValueUsingPC(), "0xCE_TEMP_REGISTER")); },
            0xDE: () => { this.subtractCarry(new Register8bit(this.read8bitValueUsingPC(), "0xDE_TEMP_REGISTER")); },
            0xEE: () => { this.xor(this.read8bitValueUsingPC()); },
            0xFE: () => { this.cmp(this.read8bitValueUsingPC()); },

            0xCF: () => { this.rst(0x08); },
            0xDF: () => { this.rst(0x18); },
            0xEF: () => { this.rst(0x28); },
            0xFF: () => { this.rst(0x38); }
        }
    }

    loop() {
        let cycleCounter = 0;
        let testOutput = '';
        while (!this.isQuitting) {
            cycleCounter++;
            this.logger.configureLogging(cycleCounter);
            if (this.IME_scheduled) {
                this.IME_scheduled = false;
                this.interruptHandler.masterInterruptFlag = true;
            }
            const opcode = this.read8bitValueUsingPC();
            this.executeOpcode(opcode);
            let ticker = 0;

            while (ticker++ < this.operationCost) {
                this.clock.tick();
                this.updateTimers();
            }

            this.interruptHandler.configure(this.readMemory(0xFFFF), this.readMemory(0xFF0F));
            //check for interrupts and service them
            const routineLocation = this.interruptHandler.handle();
            if (routineLocation > 0) {
                this.pushValueToStack(this.PC.LoRegister, this.PC.HiRegister);
                this.configureProgramCounter(routineLocation);
            }
            this.writeMemory(this.interruptHandler.getInterruptEnableFlag(), 0xFFFF);
            this.writeMemory(this.interruptHandler.getInterruptFlag(), 0xFF0F);
            this.operationCostModified = false;
            if (this.debugState) {
                if (cycleCounter == this.limit) { this.isQuitting = true; }
                if (this.readMemory(0xFF02) == 0x81) { 
                    this.writeMemory(0x00, 0xFF02);
                    testOutput += String.fromCharCode(this.readMemory(0xFF01));
                    // console.log(`${this.readMemory(0xFF01)}`);
                }
                this.logState();
                this.logger.publishLog();
            }
        }
        // console.log(stateOutput);
        this.logger.logString(testOutput);
        this.logger.logToFile();
    }

    
    updateFlags(zState: boolean | undefined,
        nState: boolean | undefined,
        hState: boolean | undefined,
        cState: boolean | undefined) {
        this.flags["Z"] = zState != undefined ? zState : this.flags["Z"];
        this.flags["N"] = nState != undefined ? nState : this.flags["N"];
        this.flags["H"] = hState != undefined ? hState : this.flags["H"];
        this.flags["C"] = cState != undefined ? cState : this.flags["C"];
        this.F.zeroFlag = this.flags["Z"];
        this.F.subtractionFlag = this.flags["N"];
        this.F.halfCarryFlag = this.flags["H"];
        this.F.carryFlag = this.flags["C"];
    }

    updateTimers() {
        if (this.divider.overflowTriggered) {
            //divider value reset
        }

        if (this.counter.interruptTriggered) {
            // request interrupt $50
            this.interruptHandler.requestInterrupt(INTERRUPT_SOURCES.INTERRUPT_TIMER);
        }

    }

    shouldQuit(): boolean{
        return false;   
    }

    executeOpcode(code: number) {
        this.opCodesLibrary[code]();
    }

    readMemory(address: number): number {
        return this.RAM.read(address).value;
    }

    writeMemory(value: number, address = -1) {
        if (address == -1) {
            address = this.HL.getRegister();
        }
        else if (address == 0xFF04) {
            value = 0;
        }
        this.RAM.write(address, value);
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
        this.writeMemory(value, address);
    }

    read8bitValueUsingPC(): number {
        return this.readMemory(this.PC.getCounterValue());
    }

    set8bitValueUsingPC(value: number): void {
        this.writeMemory(value, this.PC.getCounterValue());
    }

    private popStack(): number {
        const currentStackPointer = this.SP.getRegister();
        this.SP.setRegister(currentStackPointer + 1);
        return this.readMemory(currentStackPointer + 1);
    }

    build16bitValue(lsb: number, msb: number): number { return msb << 8 | lsb; }
    
    readFlag(flag_value: string): boolean{
        return this.flags[flag_value];
    }

    setFlag(flag : string, flag_value: boolean): void {
        this.flags[flag] = flag_value;
    }

    private loadMemoryRegister(memoryLocation: number, register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        this.writeMemory(register.value, memoryLocation);
    }

    private loadRegisterImmediate(register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        register.value = this.readMemory(this.PC.getCounterValue());
    }

    private loadRegisterRegister(registerTo: Register8bit, registerFrom: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        registerTo.value = registerFrom.value;
        this.operationCost = OPCODE_COSTS_T_STATES.OPCODE_COST_4;
    }

    private loadRegisterMemory(register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        register.value = this.readMemory(this.HL.getRegister());
    }

    private loadAccumulator(value: number, isFromRegister = false) {
        this.setOperationCost(isFromRegister ? OPCODE_COSTS_T_STATES.OPCODE_COST_4 : OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        this.A.value = value;
    }

    private loadMemoryImmediate(address: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
        this.writeMemory(this.read8bitValueUsingPC(), address);
    }

    private loadRegisterImmediate_16(register: HiLoRegister | StackPointer, immediateValue: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
        if (immediateValue > 0xFFFF) {
            throw new Error(`ERROR: Unable to load into 16bit register ${register}, ${immediateValue} is too large`);
        }
        register.setRegister(immediateValue);
    }

    private conditionalJump(conditionalResult: boolean) {
        // console.log(`current PC: ${this.PC.getCounterNoincrement().toString(16)}`);
        const jump_address = this.read8bitValueUsingPC(); // NEED TO READ PC REGARDLESS OF CONDITION RESULT
        // console.log(`current PC: ${this.PC.getCounterNoincrement().toString(16)}`);
        if (conditionalResult) {
            this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
            // console.log(`current PC: ${this.PC.getCounterNoincrement().toString(16)}
// calculated PC value: ${(this.PC.getCounterNoincrement() + new Uint8(jump_address).getSignedRepresentation()).toString(16)}`);
//             console.log(`current PC: ${this.PC.getCounterNoincrement().toString(16)}
// calculated PC value: ${(this.PC.getCounterNoincrement() + new Uint8(jump_address).getSignedRepresentation()).toString(16)}`);
            
            this.PC.setCounterValue(this.PC.getCounterNoincrement()
                + new Uint8(jump_address).getSignedRepresentation());
        }
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
    }

    private conditional16BitJump(conditionalResult: boolean) {
        const address = this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC()); // NEED TO READ PC REGARDLESS OF CONDITION RESULT
        if (conditionalResult) {
            this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
            this.PC.setCounterValue(address);
        }
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
    }

    private jump() {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
        const jump_by_n_bits = this.read8bitValueUsingPC();
        this.PC.setCounterValue(this.PC.getCounterNoincrement() + 
            new Uint8(jump_by_n_bits).getSignedRepresentation());
    }

    private increment(register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        register.value++;
        this.updateFlags(register.value == 0, false, this.halfCarryOccurs(register.value-1,1), undefined);
    }

    private incrementMemory(memoryLocation: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
        const newValue = this.readMemory(memoryLocation) + 1;
        this.writeMemory(newValue, memoryLocation);
        this.updateFlags(this.readMemory(memoryLocation) == 0, false, this.halfCarryOccurs(newValue-1, 1), undefined);
    }
    
    private decrement(register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        register.value--;
        this.updateFlags(register.value == 0, true, this.halfCarryOccurs(register.value+1, 1, false), undefined);
    }

    private decrementMemory(memoryLocation: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
        const newValue = this.readMemory(memoryLocation)-1;
        this.writeMemory(newValue, memoryLocation);
        this.updateFlags(this.readMemory(memoryLocation) == 0, true, this.halfCarryOccurs(newValue+1, 1, false), undefined);
    }

    private increment_16(register: HiLoRegister | StackPointer) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        if (register.getRegister() + 1 > 0xFFFF) {
            register.setRegister(0x0);
        }
        register.setRegister(register.getRegister() + 1);
    }

    private decrement_16(register: HiLoRegister | StackPointer) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        register.setRegister(register.getRegister() - 1);
    }

    private add_HL(register: HiLoRegister | StackPointer) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        const result = this.HL.getRegister() + this.HL.getRegister();
        this.HL.setRegister(this.HL.getRegister() + register.getRegister());
        this.updateFlags(undefined,false,undefined, result > 0xFFFF )
    }

    private add(register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        const carryState = this.getAddCarryStatus(register.value);
        this.A.value += register.value;
        this.updateFlags(this.A.value == 0, false, ...carryState);
    }

    private addFromMemory(isCarry = false) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        const carryFlagValue = isCarry ? this.flags["C"] ? 1 : 0 : 0;
        const carryState = this.getAddCarryStatus(this.readMemory(this.HL.getRegister()) + carryFlagValue);
        this.A.value += (carryFlagValue + this.readMemory(this.HL.getRegister()))
        this.updateFlags(this.A.value == 0, false, ...carryState)
    }

    private addCarry(register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        const result = this.A.value + register.value + (this.flags["C"] ? 1 : 0);
        const carryState = this.getAddCarryStatus(register.value, this.flags["C"]);
        this.A.value = result;
        this.updateFlags(this.A.value == 0, false, ...carryState);
    }

    private addCarryMemory(value : number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        const result = this.A.value + value + (this.flags["C"] ? 1 : 0);
        const carryState = this.getAddCarryStatus(value, this.flags["C"]);
        this.A.value = result;
        this.updateFlags(this.A.value == 0, false, ...carryState);
    }


    private addImmediate() {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        const immediateValue = this.read8bitValueUsingPC();
        const carryState = this.getAddCarryStatus(immediateValue);
        this.A.value += immediateValue;
        this.updateFlags(this.A.value == 0, false, ...carryState);
    }

    private subtract(register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        const carryResult = this.getSubCarryStatus(register.value);
        this.A.value = this.unsignedsubtractionAB(this.A.value, register.value);
        this.updateFlags(this.A.value == 0, true, ...carryResult)
    }

    private subtractCarry(register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        const carryState = this.getSubCarryStatus(register.value, true);
        this.A.value = this.unsignedsubtractionAB(this.A.value - (this.flags["C"] ? 1 : 0), register.value );
        this.updateFlags(this.A.value == 0, true, ...carryState);
    }

    private subtractCarryMemory(value : number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        const carryState = this.getSubCarryStatus(value, true);
        this.A.value = this.unsignedsubtractionAB(this.A.value - (this.flags["C"] ? 1 : 0), value );
        this.updateFlags(this.A.value == 0, true, ...carryState);
    }

    private subtractFromMemory(isCarry = false) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        const carryFlagValue = isCarry ? this.flags["C"] ? 1 : 0 : 0;
        const carryState = this.getSubCarryStatus(this.readMemory(this.HL.getRegister()) - carryFlagValue);
        this.A.value = this.unsignedsubtractionAB(this.A.value, this.readMemory(this.HL.getRegister()) - carryFlagValue);
        this.updateFlags(this.A.value == 0, true, ...carryState);
    }

    private subtractImmediate() {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        const immediateValue = this.read8bitValueUsingPC();
        const carryState = this.getSubCarryStatus(immediateValue);

        this.A.value = this.unsignedsubtractionAB(this.A.value, immediateValue);
        this.updateFlags(this.A.value == 0, true, ...carryState);
    }
    
    private getAddCarryStatus(value: number, isCarryOpcode = false): [boolean, boolean] {
        const isCarry = (isCarryOpcode ? 1 : 0);
        const msb_carry = this.A.value + value + isCarry > 0xFF;
        const lsb_carry = this.halfCarryOccurs(this.A.value, value);
        return [lsb_carry, msb_carry];
    }

    private getSubCarryStatus(value : number, isCarryOpcode = false): [boolean, boolean | undefined] {
        const isCarry = (isCarryOpcode ? 1 : 0);
        const msb_carry = (this.A.value - isCarry) < value;
        const lsb_carry = this.halfCarryOccurs(this.A.value, value, false);
        return [lsb_carry, msb_carry];
    }

    private and(value: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        this.A.value &= value;
        this.updateFlags(this.A.value == 0, false, true, false);
    }

    private or(value: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        this.A.value |= value;
        this.updateFlags(this.A.value == 0, false, false, false);
    }

    private xor(value: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        this.A.value ^= value;
        this.updateFlags(this.A.value == 0, false, false, false);
    }

    private cmp(value: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        const carryResult = this.getSubCarryStatus(value);
        let result = 0;

        result = this.unsignedsubtractionAB(this.A.value, value);
        this.updateFlags(result == 0, true, ...carryResult)
    }

    private writeUnsigned16BitFromSPToMemory() {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_20);
        const address = this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC());
        this.writeMemory(this.SP.LoRegister, address);
        this.writeMemory(this.SP.HiRegister, address+1);
    }

    private conditionalCall(conditionalResult: boolean, register: HiLoRegister) {
        const address = this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC());
        if (conditionalResult) {
            this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_24);
            this.push(register);
            this.PC.setRegister(address);
        }
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
    }

    private push(register: HiLoRegister) {
        // console.log(`push pushing LO HI ${register.LoRegister.toString(16)} ${register.HiRegister.toString(16)}`)
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
        this.pushValueToStack(register.LoRegister, register.HiRegister);
    }

    private pop(register: HiLoRegister) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
        const lsb = this.popStack();
        const msb = this.popStack();
        // console.log(`lsb ${lsb.toString(16)}, msb ${msb.toString(16)}`);
        register.setRegister(this.build16bitValue(lsb, msb))
    }

    private pushValueToStack(LowByte: number, HighByte: number): void {
        this.SP.setRegister(this.SP.getRegister() - 2);
        this.writeMemory(LowByte, this.SP.getRegister()+1);
        this.writeMemory(HighByte, this.SP.getRegister()+2);
    }

    private rst(address: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
        // console.log(`rst pushing LO HI ${this.PC.LoRegister} ${this.PC.HiRegister}`)
        this.pushValueToStack(this.PC.LoRegister, this.PC.HiRegister);
        this.PC.setRegister(address);
    }

    private conditionalRet(condition: boolean) {
        if (condition) {
            this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_20);
            this.PC.setRegister(this.build16bitValue(this.popStack(), this.popStack()));
        }
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
    }


    public setOperationCost(cost: number) {
        //only update operation's cost if it has not been modified this fetch/decode cycle.
        //set operationCostModified to false during the end of the CPU loop
        if (!this.operationCostModified) {
            this.operationCost = cost;
            this.operationCostModified = true;
        }
    }

    private unsignedsubtractionAB(a: number, b: number): number{
        if (a < b) {
            // console.log(`a:${a.toString(16)}, b:${b.toString(16)}, result: ${(a + (1 + (~b))).toString(16)}`)
            const result = (a + (1 + (~b)));
            if (result < 0) {
                return 256 - (-1*result);
            }
            return result;
        }
        else {
            return a - b;
        }
    }

    private logState() {
        this.logger.logRegister8bit(this.A);
        this.logger.logRegister8bit(this.F);
        this.logger.logRegister8bit(this.B);
        this.logger.logRegister8bit(this.C);
        this.logger.logRegister8bit(this.D);
        this.logger.logRegister8bit(this.E);
        this.logger.logRegister8bit(this.H);
        this.logger.logRegister8bit(this.L);

        this.logger.logRegister16bit(this.SP);
        this.logger.logRegister16bit(this.PC);
        this.logger.logString('(');
        this.logger.logMemory(this.readMemory(this.readPC()));
        this.logger.logMemory(this.readMemory(this.readPC()+1));
        this.logger.logMemory(this.readMemory(this.readPC()+2));
        this.logger.logMemory(this.readMemory(this.readPC()+3));
        this.logger.logString(')');
    }

    configureDebugStateLoopLimit(limit: number) {
        if (!this.debugState) {
            throw new Error(`ERROR: trying to configure debug value loop limit in non-debug state`)
        }
        this.limit = limit;
    }

    private halfCarryOccurs(a: number, b: number, isAdd = true): boolean {
        if (isAdd) {
            return (((a & 0xf) + (b & 0xf)) & 0x10) == 0x10;
        }
        else {
            return (((a & 0xf) - (b & 0xf)) & 0x10) == 0x10;
        }
    }

    DebugAlwaysReturnVBlank() {
        this.RAM.write(0xFF44, 0x90);
    }

}