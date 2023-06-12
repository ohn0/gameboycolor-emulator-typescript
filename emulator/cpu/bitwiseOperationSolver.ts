import { CPU } from './cpu';
import { Register8bit } from './register';

export class BitwiseOperationSolver{

    private operationsMap: { [opcode: number]: (operand : number, register : Register8bit) => number };
    private operandsMap: { [opcode : number]: Register8bit};
    
    private cpu: CPU;
    constructor(cpu: CPU) {
        this.operationsMap = {
            0: (operand, register ) : number => {
                if (operand > 7) {
                    //
                } else {
                    //
                }
                return 0;
            },
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

    decomposeKey(key: number): {operation: number,operand: number} {
        const operation = key >> 1;
        const operand = key & 0x0F;
        return { operation, operand };
    }

    executeOperation(key: number, register: Register8bit | undefined) {
        const ops = this.decomposeKey(key);
        if (ops.operand == 0x6 || ops.operand == 0xE) {
            const reg: Register8bit =
                new Register8bit(this.cpu.readMemory(this.cpu.read16BitRegister("HL").getRegister()));
            this.operandsMap[0x6] = reg;
            this.operandsMap[0xE] = reg;
            this.operationsMap[ops.operation](this.operandsMap[ops.operand], );
            this.cpu.writeMemory()
        }
        this.operationsMap[ops.operation](this.operandsMap[ops.operand]);

    }


}