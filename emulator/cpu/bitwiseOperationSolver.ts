import { CPU } from './cpu';
import { Register8bit } from './register';

export class BitwiseOperationSolver{

    private operationsMap: { [opcode: number]: () => void };
    private operandsMap: { [opcode: number]: Register8bit };
    private oddMap: { [operation: number]: number };
    private evenMap: { [operation: number]: number };
    
    private cpu: CPU;
    private operation!: number;
    private operand!: number;
    private register!: Register8bit;
    private isMemoryOperation!: boolean;
    private isOddOperation!: boolean;
    constructor(cpu: CPU) {
        this.operationsMap = {
            0: () => {
                this.register.value > 7
                    ? this.RLC()
                    : this.RRC();
            },
            1: () => {
                this.register.value > 7
                    ? this.RL()
                    : this.RR()
            },
            2: () => {
                this.register.value > 7
                    ? this.SLA()
                    : this.SRA()
            },
            3: ()=> {
                this.register.value > 7
                    ? this.SWAP()
                    : this.SRL()
            },
            4: () => { this.BIT_N(); },
            5: () => { this.BIT_N(); },
            6: () => { this.BIT_N(); },
            7: () => { this.BIT_N(); },

            8: () => { this.RES_N(); },
            9: () => { this.RES_N(); },
            0xA: () => { this.RES_N(); },
            0xB: () => { this.RES_N(); },

            0xC: () => { this.SET_N(); },
            0xD: () => { this.SET_N(); },
            0xE: () => { this.SET_N(); },
            0xF: () => { this.SET_N(); },
        }

        this.oddMap = {
            4: 1,
            5: 3,
            6: 5,
            7: 7
        }

        this.evenMap = {
            4: 0,
            5: 2,
            6: 4,
            7: 6
        }

        this.cpu = cpu;
        this.operandsMap = {
            0x0 : this.cpu.read8BitRegister("B"),
            0x8 : this.cpu.read8BitRegister("B"),

            0x1 : this.cpu.read8BitRegister("C"),
            0x9 : this.cpu.read8BitRegister("C"),

            0x2 : this.cpu.read8BitRegister("D"),
            0xA : this.cpu.read8BitRegister("D"),
            
            0x3 : this.cpu.read8BitRegister("E"),
            0xB : this.cpu.read8BitRegister("E"),

            0x4: this.cpu.read8BitRegister("H"),
            0xC: this.cpu.read8BitRegister("H"),

            0x5: this.cpu.read8BitRegister("L"),
            0xD: this.cpu.read8BitRegister("L"),

            0x6: new Register8bit(0),
            0xE: new Register8bit(0),
            0x7: this.cpu.read8BitRegister("A"),
            0xF: this.cpu.read8BitRegister("A"),
        }

    }

    //RLC: 0x00 - 0x07
    //RRC: 0x08 - 0x0F
    //RL:  0x10 - 0x17
    //RR:  0x18 - 0x1F
    //SLA: 0x20 - 0x27
    //SRA: 0x28 - 0x2F
    //SWAP:0x30 - 0x37
    //SRL: 0x38 - 0x3F
    //BIT: 0x40 - 0x7F
    //RES: 0x80 - 0xBF
    //SET: 0xC0 - 0xFF

    //0 1 2 3 4 5 6     7
    //8 9 A B C D E     F
    //------maps---------
    //B C D E H L [HL]  A

    private decomposeKey(key: number) {
        this.operation = key >> 8;
        this.operand = key & 0x0F;
        if (this.operand == 0x6 || this.operand == 0xE) {
            const value = this.cpu.read16BitRegister("HL").getRegister();
            this.operandsMap[0x6].value = value;
            this.operandsMap[0xE].value = value;
            this.isMemoryOperation = true;
        }
        this.isOddOperation = this.operand >= 8;
        this.register = this.operandsMap[this.operand];
    }

    executeOperation(key: number) {
        this.isMemoryOperation = false;
        this.decomposeKey(key);
        this.operationsMap[this.operation]();
        if (this.isMemoryOperation) {
            this.cpu.writeMemory(this.register.value);
        }

        this.cleanUp();
    }

    private cleanUp() {
        this.operandsMap[0x6].value = -1;
        this.operandsMap[0xE].value = -1;
        this.isMemoryOperation = false;
        this.operation = -1;
        this.operand = -1;
        this.isOddOperation = false;
    }

    private RLC() {
        const MSB = this.getMSB() == 1;
        this.register.value <<= 1;
        this.setLSB(MSB);
        this.cpu.updateFlags(this.register.value == 0, false, false, MSB);
    }

    private RRC() {
        const LSB = this.getLSB();
        this.register.value >>= 1;
        this.register.value |= (0x80);
        // this.register.value &= ~(LSB << 8);
        this.setMSB(LSB == 1);
        this.cpu.updateFlags(this.register.value == 0, false, false, LSB == 1);
    }

    private RL() {
        const MSB = this.getMSB();
        this.register.value <<= 1;
        this.setLSB(this.cpu.readFlag("C"));
        this.cpu.updateFlags(this.register.value == 0, false, false, MSB == 1);
    }

    private RR() {
        const LSB = this.getLSB();
        this.register.value >>= 1;
        this.setMSB(this.cpu.readFlag("C"));
        this.cpu.updateFlags(this.register.value == 0, false, false, LSB == 1);
    }

    private SLA() {
        const MSB = this.getMSB();
        this.register.value <<= 1;
        this.setLSB(false);
        this.cpu.updateFlags(this.register.value == 0, false, false, MSB == 1);
    }

    private SRA() {
        const MSB = this.getMSB();
        const LSB = this.getLSB();
        this.register.value >>= 1;
        this.setMSB(MSB == 1);
        this.cpu.updateFlags(this.register.value == 0, false, false, LSB == 1);
    }

    private SWAP() {
        this.register.value =
            (this.register.value & 0xF0) | (this.register.value & 0xF);
        this.cpu.updateFlags(this.register.value == 0, false, false, false);
    }

    private SRL() {
        const LSB = this.getLSB();
        this.register.value >>= 1;
        this.setMSB(false);
        this.cpu.updateFlags(this.register.value == 0, false, false, LSB == 1);
    }

    private BIT_N() {
        const bitToTest = this.isOddOperation
            ? this.oddMap[this.operation]
            : this.evenMap[this.operation];
        this.cpu.updateFlags(this.getBitState(bitToTest), false, true, undefined);
    }

    private RES_N() {
        const bitToReset = this.isOddOperation
            ? this.oddMap[this.operation - 4]
            : this.evenMap[this.operation - 4];
        
        this.register.value &= ~(1 << bitToReset);
        
    }

    private SET_N() {
        const bitToSet = this.isOddOperation
            ? this.oddMap[this.operation - 8]
            : this.evenMap[this.operation - 8];
        
        this.register.value |= (1 << bitToSet);
    }

    private getBitState(bitPosition: number) : boolean {
        return !((this.register.value & (1 << bitPosition)) == 0)
    }   

    private getMSB(): number {
        return (this.register.value & 0x80) == 0 ? 0 : 1; 
    }

    private getLSB(): number {
        return (this.register.value & 0x01);
    }

    private setLSB(value : boolean): void {
        this.register.value |= value ? 1 : 0
    }

    private setMSB(value: boolean): void {
        this.register.value &= ~((value? 1 : 0) << 8);
    }

}