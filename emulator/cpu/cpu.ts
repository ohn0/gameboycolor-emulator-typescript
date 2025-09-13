import { InitializationMapper } from './../MemoryMap/initializationMapper';
import { InterruptHandler } from './InterruptHandler';
import { counter } from './timers/counter';
import { divider } from './timers/divider';
import { clock } from './timers/clock';
import { INTERRUPT_SOURCES, OPCODE_COSTS_T_STATES, OPCODE_COST_8 } from './constants';
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
    private enableInterruptsInNcycles = 0;
    private isHalting = false;
    private isInDefaultHaltingBugState = false;
    private isInEiHaltingBugState = false;
    private isHaltingBugActiveCycles = 0;
    private eiHaltingBugHaltLocation = 0x00;
    private isInRstHaltingBugState = false;
    private currentOpCode = 0;
    private globalTicks = 0;
    private currentOperationCost = 0;
    private LY = 0;
    private LX = 0;
    private haltBugMemoryLocationToRepeat = 0;
    private rstVector = [0xC7, 0xD7, 0xE7, 0xF7, 0xCF, 0xDF, 0xEF, 0xFF];
    private vBlankInterruptRequested = false;
    logger: Logger;

    debugState: boolean;

    constructor(ram: RAM, logger:Logger, interruptHandler: InterruptHandler, skipBoot = false) {
        this.logger = logger;
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
        this.interruptHandler = interruptHandler; //new InterruptHandler(this.logger);
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
                
                this.updateFlags(true, false, true, true);
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
        // this.RAM.write(0xFF44, 0);
        this.bitwiseSolver = new BitwiseOperationSolver(this);
        this.operationCostModified = false;
        //MUST LOAD RAM BEFORE SETTING DIVIDER AND COUNTER TIMERS
        this.controlState = controlStates.getControlState(this.readMemory(0xFF07));
        this.divider = new divider();
        this.counter = new counter(this.readMemory(0xFF06));
        this.clock = new clock(
            () => {
                this.divider.incrementCounter();
                this.RAM.write(this.divider.location, this.divider.registerCounter);
            },
            () => {
                const currentTick = this.readMemory(0xFF05);
                const updatedTick = this.counter.tick(currentTick);
                this.writeMemory(updatedTick, 0xFF05);
            },
            this.controlState); 

        this.populateOpcodes();
    }

    async loop() {
        this.globalTicks = 0;
        let testOutput = '';
        let routineLocation = -1;
        this.operationCost = 0;
        while (!this.isQuitting) {
            this.globalTicks++;
            this.operationCostModified = false;
            this.logger.configureLogging(this.globalTicks);
            if (this.currentOperationCost != this.operationCost) {
                this.clock.tick(0)
                this.updateLY();
                this.updateTimers();
                // this.operationCost--;
                this.currentOperationCost++;
                continue;
            }
            this.currentOperationCost = this.operationCost = 0;
            this.interruptHandler.configure(this.readMemory(0xFFFF), this.readMemory(0xFF0F));

            //EI logic
            // shouldn't this be set to 8???
            if (this.enableInterruptsInNcycles > 0) {
                this.enableInterruptsInNcycles--;
                if (this.enableInterruptsInNcycles == 0) {
                    this.interruptHandler.masterInterruptFlag = true;
                }
            }

            //check for interrupts and service them

            if (this.debugState) {
                // this.logState(); //THIS SHIT GETS SLOW AS FUCCCCCK on BUN

                if (this.globalTicks > this.limit) { this.isQuitting = true; }
                if (this.readMemory(0xFF02) == 0x81) { 
                    this.writeMemory(0x00, 0xFF02);
                    let outputChar = this.readMemory(0xFF01);
                    if (outputChar == 32) {
                        outputChar = 10;
                    }
                    //handle conversion for tests because there is no ascii char for values greater than 9
                    if (outputChar >= 58 && outputChar <= 64) {
                        outputChar = 10 + (58 - outputChar);
                    
                    }
                    
                    testOutput += String.fromCharCode(outputChar);
                }
            }
            routineLocation = this.interruptHandler.handle();

            if (this.isHalting) {
                if (this.globalTicks == this.limit) { this.isQuitting = true; }
                this.isHalting = (this.interruptHandler.getInterruptFlag() & this.interruptHandler.getInterruptEnableFlag()) == 0;
                if (this.isHalting) {
                    //if halting, continue halting
                    this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                }
                //if no longer halting(an interrupt is pending), check status of IME
                
                //if IME is set, nothing to do in this else block, the continue at the end
                //will go to next iteration, where interrupt will be handled.

                //if IME is not set, behavior is dependent on whether interrupt is pending
                continue;
            }
            if (routineLocation > 0) {
                this.writeMemory(this.interruptHandler.getInterruptFlag(), 0xFF0F);
                if (this.isInEiHaltingBugState) {
                    const z = structuredClone(this.PC);
                    z.setRegister(this.PC.getCounterNoincrement() - 1);
                    this.push(z);
                    this.isInEiHaltingBugState = false;
                } else {
                    this.push(this.PC);
                }
                this.configureProgramCounter(routineLocation);
            }

            if (this.isHaltingBugActiveCycles == 2) {
                this.isHaltingBugActiveCycles--;
                this.currentOpCode = this.read8bitValueUsingPC();
                this.PC.setCounterValue(this.PC.getCounterNoincrement() - 1);
            }
            else { 
                this.currentOpCode = this.read8bitValueUsingPC();
            }
            if (this.opCodesLibrary[this.currentOpCode] === undefined) {
                console.log("undefined OPcode: " + this.currentOpCode);
            } else {
                this.opCodesLibrary[this.currentOpCode]();
                
            }

            // this.logger.logTimer(this.clock.getClockState(), this.readMemory(0xff05), this.readMemory(0xff06));
            // this.clock.updateControlState(controlStates.getControlState(this.readMemory(0xFF07)));

        }
        // this.logger.logString(testOutput);
        this.logger.logToConsole(testOutput);
        this.logger.logToFile();
        // this.logger.logOpCodesToFile(); 
        // this.logger.logTimerToFile();
        // this.logger.logInterruptsToFile();
    }



    private populateOpcodes() {
        this.opCodesLibrary = {
            0x00: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                // this.read8bitValueUsingPC(); this is definitely wrong but why did i add it
             },
            0x10: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                this.read8bitValueUsingPC();
                this.divider.resetCounter();
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
            0x12: () => this.loadMemoryRegister((this.DE.getRegister()), this.A),
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
            0x36: () => {
                this.loadMemoryImmediate(this.HL.getRegister())
            },

            0x07: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                const seventh_bit_value = 0x80 & this.A.value;
                this.A.value <<= 1;
                this.A.value &= 0xFF;
                seventh_bit_value == 0
                    ? this.A.value &= 0xFE : this.A.value |= 1;
                this.updateFlags(false, false, false, seventh_bit_value > 0);
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
                let carryCheck = undefined;
                if (!this.flags["N"]) {
                    if (this.A.value > 0x99 || this.flags["C"]) {
                        this.A.value += 0x60;
                        carryCheck = true;
                    }

                    if (((this.A.value & 0x0F) > 0x09) || this.flags["H"]) {
                        this.A.value += 0x6;
                    }
                }
                else { 
                    if (this.flags["C"]) { this.A.value = this.unsignedsubtractionAB(this.A.value, 0x60); }
                    if (this.flags["H"]) { this.A.value = this.unsignedsubtractionAB(this.A.value, 0x6); }
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

            0x0A: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.loadAccumulator(this.readMemory(this.BC.getRegister(), false))
            },
            0x1A: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.loadAccumulator(this.readMemory(this.DE.getRegister(), false))
            },
            0x2A: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.loadAccumulator(this.readMemory(this.HL.getRegister(), false));
                this.increment_16(this.HL);
            },
            0x3A: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.loadAccumulator(this.readMemory(this.HL.getRegister(), false));
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
                    ? this.A.value &= 0x7F : this.A.value |= 0x80
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
                this.A.value = (~this.A.value) & 0xFF;
                this.updateFlags(undefined, true, true, undefined);
            },
            0x3F: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                this.updateFlags(undefined, false, false, !this.flags["C"]);
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
                this.isHalting = true;
                const interruptPending = (this.interruptHandler.getInterruptFlag()
                    & this.interruptHandler.getInterruptEnableFlag()) & 0x1F; 
                console.log("IE: " + this.interruptHandler.getInterruptEnableFlag());
                console.log("IF: " + this.interruptHandler.getInterruptFlag());
                console.log(interruptPending);
                console.log("----------");
                if (!this.interruptHandler.masterInterruptFlag) {
                    if (interruptPending == 0) {
                        this.isHalting = true;
                    }
                    else if (interruptPending > 0){
                        this.isHalting = false; // triggers halt bug
                        this.isInEiHaltingBugState = this.enableInterruptsInNcycles == 1;
                        this.isInRstHaltingBugState = this.rstVector.includes(this.PC.getCounterNoincrement());
                        if (this.isInEiHaltingBugState || (this.isInEiHaltingBugState && this.isInRstHaltingBugState)) {
                            // EI bug 
                            this.eiHaltingBugHaltLocation = this.currentOpCode;
                            this.isInRstHaltingBugState = false;

                        }
                        else if (this.isInRstHaltingBugState) {
                            //rst's return will point to rst itself
                        }
                        else if (!this.isInEiHaltingBugState && !this.isInRstHaltingBugState) {
                            // this.PC.setCounterValue(this.PC.getCounterNoincrement() - 1);

                            this.isHaltingBugActiveCycles = 2;
                            this.haltBugMemoryLocationToRepeat = this.readPC();
                            // this.isInDefaultHaltingBugState = true;
                        }
                    }
                }
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
            0x7E: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.loadAccumulator(this.readMemory(this.HL.getRegister(), false))
            },

            0x4F: () => this.loadRegisterRegister(this.C, this.A),
            0x5F: () => this.loadRegisterRegister(this.E, this.A),
            0x6F: () => this.loadRegisterRegister(this.L, this.A),
            0x7F: () => this.loadAccumulator(this.A.value, true),

            0x80: () => this.aggregatedAdd(this.B.value),
            0x90: () => this.subtract(this.B.value),
            0xA0: () => this.and(this.B.value),
            0xB0: () => this.or(this.B.value),

            0x81: () => this.aggregatedAdd(this.C.value),
            0x91: () => this.subtract(this.C.value),
            0xA1: () => this.and(this.C.value),
            0xB1: () => this.or(this.C.value),

            0x82: () => this.aggregatedAdd(this.D.value),
            0x92: () => this.subtract(this.D.value),
            0xA2: () => this.and(this.D.value),
            0xB2: () => this.or(this.D.value),

            0x83: () => this.aggregatedAdd(this.E.value),
            0x93: () => this.subtract(this.E.value),
            0xA3: () => this.and(this.E.value),
            0xB3: () => this.or(this.E.value),
            
            0x84: () => this.aggregatedAdd(this.H.value),
            0x94: () => this.subtract(this.H.value),
            0xA4: () => this.and(this.H.value),
            0xB4: () => this.or(this.H.value),

            0x85: () => this.aggregatedAdd(this.L.value),
            0x95: () => this.subtract(this.L.value),
            0xA5: () => this.and(this.L.value),
            0xB5: () => this.or(this.L.value),
            
            0x86: () => this.addFromMemory(),
            0x96: () => this.subtractFromMemory(),
            0xA6: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.and(this.readMemory(this.HL.getRegister(), false));
            },
            0xB6: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.or(this.readMemory(this.HL.getRegister(), false));
            },

            0x87: () => this.aggregatedAdd(this.A.value),
            0x97: () => this.subtract(this.A.value),
            0xA7: () => this.and(this.A.value),
            0xB7: () => this.or(this.A.value),

            0x88: () => this.aggregatedAdd(this.B.value, true),
            0x98: () => this.subtract(this.B.value, true),
            0xA8: () => this.xor(this.B.value),
            0xB8: () => this.cmp(this.B.value),
            
            0x89: () => this.aggregatedAdd(this.C.value, true),
            0x99: () => this.subtract(this.C.value, true),
            0xA9: () => this.xor(this.C.value),
            0xB9: () => this.cmp(this.C.value),
            
            0x8A: () => this.aggregatedAdd(this.D.value, true),
            0x9A: () => this.subtract(this.D.value, true),
            0xAA: () => this.xor(this.D.value),
            0xBA: () => this.cmp(this.D.value),

            0x8B: () => this.aggregatedAdd(this.E.value, true),
            0x9B: () => this.subtract(this.E.value, true),
            0xAB: () => this.xor(this.E.value),
            0xBB: () => this.cmp(this.E.value),
            
            0x8C: () => this.aggregatedAdd(this.H.value, true),
            0x9C: () => this.subtract(this.H.value, true),
            0xAC: () => this.xor(this.H.value),
            0xBC: () => this.cmp(this.H.value),
            
            0x8D: () => this.aggregatedAdd(this.L.value, true),
            0x9D: () => this.subtract(this.L.value, true),
            0xAD: () => this.xor(this.L.value),
            0xBD: () => this.cmp(this.L.value),
            
            0x8E: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.aggregatedAdd(this.readMemory(this.HL.getRegister(), false), true)
            },
            0x9E: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8)
                this.subtract(this.readMemory(this.HL.getRegister(), false), true);
            },
            0xAE: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.xor(this.readMemory(this.HL.getRegister(), false))
            },
            0xBE: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.cmp(this.readMemory(this.HL.getRegister(), false))
            },
            
            0x8F: () => this.aggregatedAdd(this.A.value,true),
            0x9F: () => {
                const cFlag = this.readFlag("C");
                this.subtract(this.A.value, true);
                this.updateFlags(undefined, undefined, undefined, cFlag);
            },
            0xAF: () => {
                this.xor(this.A.value);
                this.updateFlags(true, false, false, false);
            },
            0xBF: () => {
                this.cmp(this.A.value);
                this.updateFlags(true, true, false, false);
            },

            0xC0: () => {
                this.conditionalRet(this.flags["Z"] == false);
            },

            0xD0: () => {
                this.conditionalRet(this.flags["C"] == false);
            },

            0xE0: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
                this.wait();
                const value = this.read8bitValueUsingPC();
                this.writeMemory(this.A.value, 0xFF00 + value);
            },

            0xF0: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
                const value = this.read8bitValueUsingPC();
                this.wait();
                this.A.value = this.readMemory(0xFF00 + value, false);
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
                this.F.value &= 0xF0;
            },

            0xC2: () => {
                this.conditional16BitJump(this.flags["Z"] == false);
            },
            
            0xD2: () => {
                this.conditional16BitJump(this.flags["C"] == false);
            },

            0xE2: () => {
                this.loadMemoryRegister(0xFF00 + this.C.value, this.A);
            },

            0xF2: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.loadAccumulator(this.readMemory(0xFF00 + this.C.value, false));
            },

            0xC3: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
                this.PC.setCounterValue(
                    this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC()));
            },
            
            0xD3: () => {throw new Error("INVALID OPCODE 0xD3");},
            0xE3: () => { throw new Error("INVALID OPCODE 0xE3"); },
            0xF3: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                this.interruptHandler.masterInterruptFlag = false;
                this.enableInterruptsInNcycles = 0;
            },

            0xC4: () => {
                this.conditionalCall(this.flags["Z"] == false, this.PC);
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

            0xC6: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.aggregatedAdd(this.read8bitValueUsingPC());
            },
            0xD6: () => { this.subtractImmediate(); },
            0xE6: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.and(this.read8bitValueUsingPC());
            },
            0xF6: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.or(this.read8bitValueUsingPC());
            },

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
                const hcFlagResults = this.sp8bitArithmeticFlagState(spAddition);
                this.SP.setRegister((((this.SP.getRegister() + spAddition) % 0x10000)+0x10000) % 0x10000);
                this.updateFlags(false, false, hcFlagResults.hFlag, hcFlagResults.cFlag);
            },

            0xF8: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
                const spAddition = new Uint8(this.read8bitValueUsingPC())
                    .getSignedRepresentation();
                const hcFlagResults = this.sp8bitArithmeticFlagState(spAddition);
                this.HL.setRegister((((this.SP.getRegister() + spAddition) % 0x10000)+0x10000) % 0x10000);
                this.updateFlags(false, false, hcFlagResults.hFlag, hcFlagResults.cFlag);
            },

            0xC9: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
                this.conditionalRet(true);
            },

            0xD9: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
                this.conditionalRet(true);
                this.interruptHandler.resetInterrupts(this.readMemory(0xFFFF, false));
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
                this.wait();
                this.wait();
                this.writeMemory(this.A.value,
                    this.build16bitValue(this.read8bitValueUsingPC(), this.read8bitValueUsingPC()));
            },
            0xFA: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
                const msb = this.read8bitValueUsingPC();
                const lsb = this.read8bitValueUsingPC();
                this.wait();
                this.wait();
                this.A.value =
                    this.readMemory(this.build16bitValue(msb, lsb), false);
            },
            0xCB: () => {
                const key = this.read8bitValueUsingPC();
                let operationCost: number;
                const lsb = key & 0xF;
                if (lsb == 0x6 || lsb == 0xE){
                    const cost12 = [0x46, 0x56, 0x66, 0x76, 0x4E, 0x5E, 0x6E, 0x7E];
                    operationCost = cost12.find(c => c == key) == undefined
                        ? OPCODE_COSTS_T_STATES.OPCODE_COST_16
                        : OPCODE_COSTS_T_STATES.OPCODE_COST_12;
                } else {
                    operationCost = OPCODE_COSTS_T_STATES.OPCODE_COST_8;
                }
                this.setOperationCost(operationCost);
                this.wait();
                this.bitwiseSolver.executeOperation(key);
            },

            0xDB: () => { throw new Error("INVALID OPCODE 0xDB");},
            0xEB: () => { throw new Error("INVALID OPCODE 0xEB"); },

            0xFB: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
                this.enableInterruptsInNcycles = 2;
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

            0xCE: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.aggregatedAdd(this.read8bitValueUsingPC(), true);
            },
            0xDE: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.subtract(this.read8bitValueUsingPC(), true);
            },
            0xEE: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.xor(this.read8bitValueUsingPC());
            },
            0xFE: () => {
                this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
                this.cmp(this.read8bitValueUsingPC());
            },

            0xCF: () => { this.rst(0x08); },
            0xDF: () => { this.rst(0x18); },
            0xEF: () => { this.rst(0x28); },
            0xFF: () => { this.rst(0x38); }
        }
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
            this.counter.interruptTriggered = false;
            this.requestInterrupt(INTERRUPT_SOURCES.INTERRUPT_TIMER);
            this.writeMemory(this.interruptHandler.getInterruptFlag(), 0xFF0F);
        }

    }

    shouldQuit(): boolean{
        return false;   
    }

    executeOpcode(code: number) {
        this.opCodesLibrary[code]();
    }

    readMemory(address: number, isFreeRead = true): number {
        if (isFreeRead) return this.RAM.read(address).value;
        const value = this.RAM.read(address).value;
        return value;
    }

    writeMemory(value: number, address = -1) {
        if (address == -1) {
            address = this.HL.getRegister();
        }
        else if (address == 0xFF04) {
            value = 0;
        }
        else if (address == 0xFF06) {
            this.counter.updateModulo(value);
        }
        else if (address == 0xFFFF) {
            this.interruptHandler.configureInterruptEnableFlag(value);
        }
        else if (address == 0xFF0F) {
            this.interruptHandler.configureInterruptFlag(value);
        }
        this.RAM.write(address, value);

        if (address == 0xFF07) {
            this.clock.updateControlState(controlStates.getControlState(this.readMemory(0xFF07)));
        }
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

    read8bitValueUsingPC(isFreeRead = true): number {
        // if(isFreeRead) return this.readMemory(this.PC.getCounterValue());
        if (this.isHaltingBugActiveCycles == 1) {
            // this.isHaltingBugActiveCycles = 0;
            // console.log("rerunning " + this.readMemory(this.haltBugMemoryLocationToRepeat));
            // return this.readPC();
            // return this.readMemory(this.haltBugMemoryLocationToRepeat);
        }
        // this.isHaltingBugActiveCycles--;
        const value = this.readMemory(this.PC.getCounterValue());
        // if (this.isHaltingBugActiveCycles == 1) {
        //     console.log("repeating the following : " + value);
        // }
        return value;
    }

    set8bitValueUsingPC(value: number): void {
        this.writeMemory(value, this.PC.getCounterValue());
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
        register.value = this.read8bitValueUsingPC();
    }

    private loadRegisterRegister(registerTo: Register8bit, registerFrom: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        registerTo.value = registerFrom.value;
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
        this.wait();
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
        const jump_address = this.read8bitValueUsingPC(); // NEED TO READ PC REGARDLESS OF CONDITION RESULT
        if (conditionalResult) {
            this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
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
        const jump_by_n_bits = new Uint8(this.read8bitValueUsingPC()).getSignedRepresentation();
        if (jump_by_n_bits == -2) { //we're about to enter an infinite loop, MUST quit
            this.isQuitting = true; 
        }
        this.PC.setCounterValue(this.PC.getCounterNoincrement() + jump_by_n_bits);
    }

    private increment(register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        register.value++;
        this.updateFlags(register.value == 0, false, this.halfCarryOccurs(register.value-1,1), undefined);
    }

    private incrementMemory(memoryLocation: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
        const newValue = this.readMemory(memoryLocation) + 1;
        this.wait();
        this.writeMemory(newValue, memoryLocation);
        this.wait();
        this.updateFlags(this.readMemory(memoryLocation) == 0, false, this.halfCarryOccurs(newValue-1, 1), undefined);
    }
    
    private decrement(register: Register8bit) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        const value = this.unsignedsubtractionAB(register.value, 1);
        this.updateFlags(value == 0, true, this.halfCarryOccurs(register.value, 1, false), undefined);
        register.value = value;
    }

    private decrementMemory(memoryLocation: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
        const newValue = this.readMemory(memoryLocation) - 1;
        this.wait();
        this.writeMemory(newValue, memoryLocation);
        this.wait();
        this.updateFlags(newValue == 0, true, this.halfCarryOccurs(newValue+1, 1, false), undefined);
    }

    private increment_16(register: HiLoRegister | StackPointer) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        const newValue = register.getRegister() + 1;
        if (newValue > 0xFFFF) {
            register.setRegister(0x0);
        } else {
            register.setRegister(newValue);
        }
    }

    private sp8bitArithmeticFlagState(value: number): { hFlag: boolean, cFlag: boolean }
    {
        let hFlagResult = undefined;
        let cFlagResult = undefined;
        if (value >= 0) {
            hFlagResult = (this.SP.LoRegister & 0xF) + (value & 0xF) > 0xF;
            cFlagResult = (this.SP.LoRegister & 0xFF) + (value & 0xFF) > 0xFF;
        }
        else {
            hFlagResult = ((this.SP.getRegister() + value) & 0xF) <= (this.SP.getRegister() & 0xF);
            cFlagResult = ((this.SP.getRegister() + value) & 0xFF) <= (this.SP.getRegister() & 0xFF);
        }
        return { hFlag: hFlagResult, cFlag: cFlagResult };
    }

    private decrement_16(register: HiLoRegister | StackPointer) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        register.setRegister(register.getRegister() - 1);
    }

    private add_HL(register: HiLoRegister | StackPointer) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        const fullCarry = this.HL.getRegister() + register.getRegister();
        const halfCarry = (((this.HL.getRegister() & 0xFFF) + (register.getRegister() & 0xFFF)) & 0x1000) == 0x1000;
        this.HL.setRegister((((this.HL.getRegister() + register.getRegister()) % 0x10000) + 0x10000)%0x10000); //% 0x10000)+0x10000) % 0x10000);
        this.updateFlags(undefined,false,halfCarry, fullCarry > 0xFFFF )
    }

    private addFromMemory(isCarry = false) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        const carryFlagValue = isCarry ? +this.flags["C"] : 0;
        const hlValue = this.readMemory(this.HL.getRegister());
        const carryState = this.getCarryStatus(hlValue + carryFlagValue, false, true);
        this.A.value += (carryFlagValue + hlValue)
        this.updateFlags(this.A.value == 0, false, ...carryState)
    }

    private aggregatedAdd(value: number, carryCheck = false) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        const result = this.A.value + value + (carryCheck ? +this.flags["C"] : 0);
        let carryStateIntermediate = [false, false];
        if (carryCheck && this.flags["C"]) {
            carryStateIntermediate = this.getCarryStatus(1, false, true);
            this.A.value++;
        }
        const carryState = this.getCarryStatus(value, false, true);
        carryState[0] = carryStateIntermediate[0] ? carryStateIntermediate[0] : carryState[0];
        carryState[1] = carryStateIntermediate[1] ? carryStateIntermediate[1] : carryState[1];
        this.A.value = result;
        this.updateFlags(this.A.value == 0, false, ...carryState);
    }

    private subtract(value: number, isCarry = false) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        let carryStateIntermediate = [false, false];
        if (isCarry && this.flags["C"]) {
            carryStateIntermediate = this.getCarryStatus(1, false, false);
            this.A.value--;
        }
        const carryState = this.getCarryStatus(value, false, false);
        this.A.value = this.unsignedsubtractionAB(this.A.value, value);
    
        carryState[0] = carryStateIntermediate[0] ? carryStateIntermediate[0] : carryState[0];
        carryState[1] = carryStateIntermediate[1] ? carryStateIntermediate[1] : carryState[1];
        this.updateFlags(this.A.value == 0, true, ...carryState);
    }

    private subtractFromMemory(isCarry = false) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        const carryFlagValue = isCarry ? +this.flags["C"] : 0;
        const value = this.readMemory(this.HL.getRegister()) - carryFlagValue;
        this.subtract(value, isCarry);
    }

    private subtractImmediate() {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
        const immediateValue = this.read8bitValueUsingPC();
        this.subtract(immediateValue);
    }
    
    private getCarryStatus(value: number, isCarryOpcode = false, isAdd = false) : [boolean, boolean] {
        const isCarry = isCarryOpcode ? 1 : 0;
        const msb_carry =
            isAdd ? this.A.value + value + isCarry > 0xFF
                  : (this.A.value - isCarry) < value;
        const lsb_carry = this.halfCarryOccurs(this.A.value,
            isAdd ? value + isCarry
                  : value - isCarry, isAdd);
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
        const carryResult = this.getCarryStatus(value);
        const result = this.unsignedsubtractionAB(this.A.value, value);
        this.updateFlags(result == 0, true, ...carryResult)
        // this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_4);
        // const carryState = this.getCarryStatus(value, false, false);
        // const result = this.unsignedsubtractionAB(this.A.value, value);
        // this.updateFlags(result == 0, true, ...carryState);
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
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
        this.pushValueToStack(register.LoRegister, register.HiRegister);
    }

    private pop(register: HiLoRegister) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_12);
        const lsb = this.popStack();
        const msb = this.popStack();
        register.setRegister(this.build16bitValue(lsb, msb))
    }

    private pushValueToStack(LowByte: number, HighByte: number): void {
        this.SP.setRegister(this.SP.getRegister() - 1);
        this.writeMemory(HighByte, this.SP.getRegister());
        this.SP.setRegister(this.SP.getRegister() - 1);
        this.writeMemory(LowByte, this.SP.getRegister());
    }

    private popStack(): number {
        const value = this.readMemory(this.SP.getRegister());
        this.SP.setRegister(this.SP.getRegister() + 1);
        return value;
    }

    private rst(address: number) {
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_16);
        if (this.isInRstHaltingBugState) {
            this.pushValueToStack(this.PC.LoRegister - 1, this.PC.HiRegister - 1);
            this.isInRstHaltingBugState = false;
        } else {
            this.pushValueToStack(this.PC.LoRegister, this.PC.HiRegister);
        }
        this.PC.setRegister(address);
    }

    private conditionalRet(condition: boolean) {
        if (condition) {
            this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_20);
            this.PC.setRegister(this.build16bitValue(this.popStack(), this.popStack()));
        }
        this.setOperationCost(OPCODE_COSTS_T_STATES.OPCODE_COST_8);
    }

    private requestInterrupt(source : string) {
        this.interruptHandler.requestInterrupt(source);
        const interruptFlag = this.interruptHandler.getInterruptFlag();
        this.writeMemory(interruptFlag, 0xFF0F);
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
            const result = ((((a - b) % 0x100) + 0x100)%0x100);
            return result;
        }
        else {
            return a - b;
        }
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

        // return isAdd ? (((a & 0xf) + (b & 0xf)) & 0x10) == 0x10
        //              : ((((((a & 0xf) - (b & 0xf)) % 0x10) + 0x10) % 0x10) & 0x10) == 0x10
    }

    public wait() {
        const readCost = 4;
        for (let i = 0; i < readCost; i++){
            if (this.clock.tick(0)) {
                // this.operationCost--;
                this.currentOperationCost++;
            }
        }
    }

    DebugAlwaysReturnVBlank() {
        this.RAM.write(0xFF44, 0x90);
    }

    updateLY() {
        this.LX++;

        let LY = this.RAM.read(0xFF44).value;
        if (this.LX == 160) {
            this.vBlankInterruptRequested = false;
            LY++;
            if (LY == 153) LY = 0;
            this.writeMemory(LY, 0xFF44);
            this.LX = 0;
        }

        if (LY == 144) {
            if (!this.vBlankInterruptRequested) {
                this.requestInterrupt(INTERRUPT_SOURCES.INTERRUPT_VBLANK);
                this.vBlankInterruptRequested = true;            
            }
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

        this.logger.logRegister16bit(this.AF);
        this.logger.logRegister16bit(this.BC);
        this.logger.logRegister16bit(this.DE);
        this.logger.logRegister16bit(this.SP);
        this.logger.logRegister16bit(this.PC);
        this.logger.logString('(');
        this.logger.logMemory(this.readMemory(this.readPC()));
        this.logger.logMemory(this.readMemory(this.readPC()+1));
        this.logger.logMemory(this.readMemory(this.readPC()+2));
        this.logger.logMemory(this.readMemory(this.readPC() + 3));
        this.logger.logString(' LX: ');
        this.logger.logMemory(this.LX);
        this.logger.logString(' LY: ');
        this.logger.logMemory(this.RAM.read(0xFF44).value);
        this.logger.logString(' IE: ');
        this.logger.logMemory(this.RAM.read(0xFFFF).value);
        this.logger.logString(' IF: ');
        this.logger.logMemory(this.RAM.read(0xFF0F).value);
        this.logger.logString(` TIMA : ${this.readMemory(0xFF05)}\n`);
    }
}