import { CPU } from '../../emulator/cpu/cpu';
import { describe, expect, test } from "@jest/globals";

const cpu: CPU = new CPU();

describe('CPU opcode testing',() => {
    
    test('opcode 0x01 sets BC value to 0xABCD from immediate memory', () => {
        setRamValue16bit(0xABCD, 0x1111);
        cpu.executeOpcode(0x01);
        expect(cpu.read16BitRegister("BC").getRegister()).toBe(0xABCD);
    })

    test('opcode 0x02 sets RAM at BC\'s location to A\'s value.', () => {
        setRamValue(0xC, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x02);

        expect(cpu.readMemory(cpu.read16BitRegister("BC").getRegister())).toBe(0xC);
    })

    test('opcode 0x03 increments BC\'s value by 1', () => {
        setRamValue16bit(0xABCD, 0x1111);
        cpu.executeOpcode(0x01);
        cpu.executeOpcode(0x03);
        expect(cpu.read16BitRegister("BC").getRegister()).toBe(0xABCD + 1);
    })

    test('opcode 0x04 increments B\'s value by 1', () => {
        setRamValue(0xE, 0x1111);
        cpu.executeOpcode(0x06);
        cpu.executeOpcode(0x04);
        expect(cpu.read8BitRegister("B").value).toBe(0xF);
    })

    test('opcode 0x05 decrements B\'s value by 1', () => {
        setRamValue(0xE, 0x1111);
        cpu.executeOpcode(0x06);
        cpu.executeOpcode(0x05);
        expect(cpu.read8BitRegister("B").value).toBe(0xD);
    })

    test('opcode 0x06 sets B\'s value to 0xA', () => {
        setRamValue(0xE, 0x1111);
        cpu.executeOpcode(0x06);
        expect(cpu.read8BitRegister("B").value).toBe(0xE);
    })

    test('opcode 0x07 left shifts A by 1, shifitng the bit in the 7th position to the 0th', () => {
        setRamValue(0xD, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x07);
        expect(cpu.read8BitRegister("A").value).toBe(26);

        setRamValue(0xFD, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x07);
        expect(cpu.read8BitRegister("A").value).toBe(251);
    })

    test('opcode 0x08 loads SP\'s value into the memory location specified', () => {
        setRamValue16bit(0x00FE, 0xAC1D);
        cpu.executeOpcode(0x31);
        setPcValue(cpu, 0xAC1D);
        cpu.executeOpcode(0x08);
        expect(cpu.readMemory(0xAC1D)).toBe(0xFE);
    })

    test('opcode 0x09 sets HL to the sum of HL and BC', () => {
        setRamValue16bit(0xAC1D, 0x1111);
        cpu.executeOpcode(0x01);

        setRamValue16bit(0x1111, 0xBBBB);
        cpu.executeOpcode(0x21);
        cpu.executeOpcode(0x09);
        expect(cpu.read16BitRegister("HL").getRegister()).toBe(0xAC1D + 0x1111);
    })

    test('opcode 0x0A loads RAM[BC] into A', () => {
        setRamValue16bit(0xAC1D, 0x1111);
        cpu.executeOpcode(0x01);
        setRamValue16bit(0x00F1, 0x1111);
        cpu.executeOpcode(0x31);
        setPcValue(cpu, 0xAC1D);
        cpu.executeOpcode(0x08);

        cpu.executeOpcode(0x0A);
        expect(cpu.read8BitRegister("A").value).toBe(0xF1);
    });

    test('opcode 0x0B decrements BC by 1', () => {
        setRamValue16bit(0xAC1D, 0x1111);
        cpu.executeOpcode(0x01);
        cpu.executeOpcode(0x0B);
        expect(cpu.read16BitRegister("BC").getRegister()).toBe(0xAC1C);
    });

    test('opcode 0x0C increments C by 1', () => {
        setRamValue(0xEE, 0xBBBB);
        cpu.executeOpcode(0x0E);
        cpu.executeOpcode(0x0C);
        expect(cpu.read8BitRegister("C").value).toBe(0xEF);
    });

    test('opcode 0x0D decrements C by 1', () => {
        setRamValue(0xEE, 0xBBBB);
        cpu.executeOpcode(0x0E);
        cpu.executeOpcode(0x0D);
        expect(cpu.read8BitRegister("C").value).toBe(0xED);
    });

    test('opcode 0x0E loads into C register immediate 8 bit value', () => {
        setRamValue(0xEE, 0xBBBB);
        cpu.executeOpcode(0x0E);
        expect(cpu.read8BitRegister("C").value).toBe(0xEE);
    });

    test('opcode 0x0F right shifts A and carrys LSB to MSB', () => {
        setRamValue(26, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x0F);
        expect(cpu.read8BitRegister("A").value).toBe(0xD);

        setRamValue(251, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x0F);
        expect(cpu.read8BitRegister("A").value).toBe(0xFD);
    });

    test('opcode 0x11 sets DE value to 0xABCD from immediate memory', () => {
        setRamValue16bit(0xABCD, 0x1111);
        cpu.executeOpcode(0x11);
        expect(cpu.read16BitRegister("DE").getRegister()).toBe(0xABCD);
    });

    test('opcode 0x12 sets RAM at DE\'s location to A\'s value.', () => {
        setRamValue(0xC, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x12);

        expect(cpu.readMemory(cpu.read16BitRegister("DE").getRegister())).toBe(0xC);
    });

    test('opcode 0x13 increments DE\'s value by 1', () => {
        setRamValue16bit(0xABCD, 0x1111);
        cpu.executeOpcode(0x01);
        cpu.executeOpcode(0x13);
        expect(cpu.read16BitRegister("DE").getRegister()).toBe(0xABCD + 1);
    });

    test('opcode 0x14 increments D\'s value by 1', () => {
        setRamValue(0xE, 0x1111);
        cpu.executeOpcode(0x16);
        cpu.executeOpcode(0x14);
        expect(cpu.read8BitRegister("D").value).toBe(0xF);
    });

    test('opcode 0x15 decrements D\'s value by 1', () => {
        setRamValue(0xE, 0x1111);
        cpu.executeOpcode(0x16);
        cpu.executeOpcode(0x15);
        expect(cpu.read8BitRegister("D").value).toBe(0xD);
    });

    test('opcode 0x16 loads into D the immediate 8 bit value', () => {
        setRamValue(0xE, 0x1111);
        cpu.executeOpcode(0x16);
        expect(cpu.read8BitRegister("D").value).toBe(0xE);
    });

    test('opcode 0x17 performs RLA on A, moving seventh bit of A to C and moving C to first bit of A', () => {
        cpu.setFlag("C", false);
        setRamValue(0xFE, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x17);
        //E ends in 1, C ends in 1
        expect(cpu.read8BitRegister("A").value).toBe(0xFC);
        expect(cpu.readFlag("C")).toBe(true);

        cpu.setFlag("C", true);
        setRamValue(0xFE, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x17);
        expect(cpu.read8BitRegister("A").value).toBe(0xFD);
        expect(cpu.readFlag("C")).toBe(true);

        cpu.setFlag("C", true);
        setRamValue(0x7E, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x17);
        expect(cpu.read8BitRegister("A").value).toBe(0xFD);
        expect(cpu.readFlag("C")).toBe(false);

        cpu.setFlag("C", false);
        setRamValue(0x7E, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x17);
        expect(cpu.read8BitRegister("A").value).toBe(0xFC);
        expect(cpu.readFlag("C")).toBe(false);
    });

    test('opcode 0x18 performs a jump by adding the immediate 8 bit value to the PC.', () => {
        setRamValue(0xF0, 0x1111);
        cpu.executeOpcode(0x18);
        expect(cpu.readPC()).toBe(0x1111 + 0xF0 + 1);
    });

    test('opcode 0x19 sets HL to the sum of HL and BC', () => {
        setRamValue16bit(0xAC1D, 0x1111);
        cpu.executeOpcode(0x11);

        setRamValue16bit(0x1111, 0xBBBB);
        cpu.executeOpcode(0x21);
        cpu.executeOpcode(0x19);
        expect(cpu.read16BitRegister("HL").getRegister()).toBe(0xAC1D + 0x1111);
    });

    test('opcode 0x1A loads RAM[DE] into A', () => {
        setRamValue16bit(0xAC1D, 0x1111);
        cpu.executeOpcode(0x11);
        setRamValue16bit(0x00F1, 0x1111);
        cpu.executeOpcode(0x31);
        setPcValue(cpu, 0xAC1D);
        cpu.executeOpcode(0x08);

        cpu.executeOpcode(0x1A);
        expect(cpu.read8BitRegister("A").value).toBe(0xF1);
    });

    test('opcode 0x1B decrements DE by 1', () => {
        setRamValue16bit(0xAC1D, 0x1111);
        cpu.executeOpcode(0x11);
        cpu.executeOpcode(0x1B);
        expect(cpu.read16BitRegister("DE").getRegister()).toBe(0xAC1C);
    });    

    test('opcode 0x1C increments E by 1', () => {
        setRamValue(0xEE, 0xBBBB);
        cpu.executeOpcode(0x1E);
        cpu.executeOpcode(0x1C);
        expect(cpu.read8BitRegister("E").value).toBe(0xEF);
    });

    test('opcode 0x1D decrements E by 1', () => {
        setRamValue(0xEE, 0xBBBB);
        cpu.executeOpcode(0x1E);
        cpu.executeOpcode(0x1D);
        expect(cpu.read8BitRegister("E").value).toBe(0xED);
    });

    test('opcode 0x1E loads into E register immediate 8 bit value', () => {
        setRamValue(0xEE, 0xBBBB);
        cpu.executeOpcode(0x1E);
        expect(cpu.read8BitRegister("E").value).toBe(0xEE);
    });

    test('opcode 0x1F right shifts A, moving C flag into A\'s seventh bit, and  moving first bit into C flag', () => {
        cpu.setFlag("C", false);
        setRamValue(0xFE, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x1F);
        expect(cpu.read8BitRegister("A").value).toBe(0x7F);
        expect(cpu.readFlag("C")).toBe(false);

        cpu.setFlag("C", true);
        setRamValue(0xFE, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x1F);
        expect(cpu.read8BitRegister("A").value).toBe(0xFF);
        expect(cpu.readFlag("C")).toBe(false);

        cpu.setFlag("C", false);
        setRamValue(0x7F, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x1F);
        // expect(cpu.read8BitRegister("A").value).toBe(0x7F);
        // expect(cpu.readFlag("C")).toBe(false);

        cpu.setFlag("C", true);
        setRamValue(0x7F, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x1F);
        // expect(cpu.read8BitRegister("A").value).toBe(0xFF);
        // expect(cpu.readFlag("C")).toBe(false);
    });

    test('opcode 0x20 performs a conditional jump to PC + immediate 8 bit value when Zero flag is set to false', () => {
        cpu.setFlag("Z", false);
        cpu.configureProgramCounter(0x4000);
        setRamValue(0xAA, 0x4000);
        cpu.executeOpcode(0x20);
        expect(cpu.readPC()).toBe(0x4000 + 0xAA + 0x01);
    });

    test('opcode 0x20 performs no conditional jump when Zero flag is set to true', () => {
        cpu.setFlag("Z", true);
        cpu.configureProgramCounter(0x4000);
        setRamValue(0xAA, 0x4000);
        cpu.executeOpcode(0x20);
        expect(cpu.readPC()).toBe(0x4000 + 0x01);
    });

    test('opcode 0x21 loads into HL the input value', () => {
        setRamValue16bit(0xFEED, 0xBBBB);
        cpu.executeOpcode(0x21);
        expect(cpu.read16BitRegister("HL").getRegister()).toBe(0xFEED);
    });

    test('opcode 0x22 loads into RAM[HL] A and then increments HL', () => {
        setRamValue16bit(0xAAAA, 0xAAAA);
        cpu.executeOpcode(0x21); //sets HL to AAAA
        setRamValue(0xD, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x22); //sets RAM[AAAA] to 0xD

        expect(cpu.readMemory(0xAAAA)).toBe(0xD);
        expect(cpu.read16BitRegister("HL").getRegister()).toBe(0xAAAB)
    });

    test('opcode 0x23 increments HL', () => {
        setRamValue16bit(0xBBBB, 0x1000);
        cpu.executeOpcode(0x21);
        cpu.executeOpcode(0x23);
        expect(cpu.read16BitRegister("HL").getRegister()).toBe(0xBBBC);
    });
    
    test('opcode 0x24 increments H', () => {
        setRamValue16bit(0xBBBB, 0x1000);
        cpu.executeOpcode(0x21);
        cpu.executeOpcode(0x24);
        expect(cpu.read8BitRegister("H").value).toBe(0xBC);
        expect(cpu.read16BitRegister("HL").HiRegister).toBe(0xBC);
    });
    
    test('opcode 0x25 decrements H', () => {
        setRamValue16bit(0xBBBB, 0x1000);
        cpu.executeOpcode(0x21);
        cpu.executeOpcode(0x25);
        expect(cpu.read8BitRegister("H").value).toBe(0xBA);
        expect(cpu.read16BitRegister("HL").HiRegister).toBe(0xBA);
    });

    test('opcode 0x26 sets H to immediate 8 bit value', () => {
        setRamValue(0xAF, 0x2341);
        cpu.executeOpcode(0x26);
        expect(cpu.read8BitRegister("H").value).toBe(0xAF);
    });

    test('opcode 0x27 performs DAA on A value 0x1B', () => {
        cpu.setFlag("C", false);
        setRamValue(0x3C, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x27);
        expect(cpu.read8BitRegister("A").value).toBe(66);
    });

    test('opcode 0x28 jumps to PC+ given 8 bit value if Zero flag is set.', () => { 
        cpu.setFlag("Z", true);
        cpu.configureProgramCounter(0x4000);
        setRamValue(0xAA, 0x4000);
        cpu.executeOpcode(0x28);
        expect(cpu.readPC()).toBe(0x4000 + 0xAA + 0x01);
    });

    test('opcode 0x29 adds HL to HL', () => {
        setRamValue(0x12, 0xAFDA);
        cpu.executeOpcode(0x26);
        setRamValue(0x33, 0xAFAA);
        cpu.executeOpcode(0x2E);

        cpu.executeOpcode(0x29);
        expect(cpu.read16BitRegister("HL").getRegister()).toBe(0x1233 + 0x1233);
    });

    test('opcode 0x2E sets L to immediate 8 bit value.', () => {
        setRamValue(0xAA, 0x4000);
        cpu.executeOpcode(0x2E);
        expect(cpu.read8BitRegister("L").value).toBe(0xAA);
    })

    test('opcode 0x31 sets SP\'s value to the specified input.', () => {
        setRamValue16bit(0xBEEF, 0x1111);
        cpu.executeOpcode(0x31);
        expect(cpu.readSP().getStackValue()).toBe(0xBEEF);
    });

    test('opcode 0x3E sets A value to 0xD', () => {
        setRamValue(0xD, 0x1111);
        cpu.executeOpcode(0x3E);
        expect(cpu.read8BitRegister("A").value).toBe(0xD);

        setRamValue(0xFD, 0x1111);
        cpu.executeOpcode(0x3E);
        expect(cpu.read8BitRegister("A").value).toBe(0xFD);
    });

    test('opcode 0x2F flips A and sets N and H', () => {
        setRamValue(0xD, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x2F);
        expect(cpu.read8BitRegister("A").value).toBe(~0xD);
        expect(cpu.readFlag("N")).toBeTruthy()
        expect(cpu.readFlag("H")).toBeTruthy()
    })
    
});

function setRamValue(ramValue : number, pcValue : number): void {
    cpu.configureRamValue(ramValue, pcValue);
    cpu.configureProgramCounter(pcValue);
}

function setPcValue(cpu: CPU, pcvalue: number): void{
    cpu.configureProgramCounter(pcvalue);
}

function setRamValue16bit(value : number, pcValue : number): void {
    cpu.configureRamValue(value >> 8, pcValue);
    cpu.configureRamValue(value & 0xFF, pcValue + 1);
    cpu.configureProgramCounter(pcValue);
}
