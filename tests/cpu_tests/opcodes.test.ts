import { CPU } from '../../emulator/cpu/cpu';
import { describe, expect, test } from "@jest/globals";

let cpu: CPU = new CPU();

describe('CPU opcode testing',() => {
    
    test('opcode 0x01 sets BC value to 0xABCD from immediate memory', () => {
        setRamValue16bit(0xABCD, 0x1111);
        cpu.executeOpcode(0x01);
        expect(cpu.read16BitRegister("BC").getRegisterValue()).toBe(0xABCD);
    })

    test('opcode 0x02 sets RAM at BC\'s location to A\'s value.', () => {
        setRamValue(0xC, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x02);

        expect(cpu.readMemory(cpu.read16BitRegister("BC").getRegisterValue())).toBe(0xC);
    })

    test('opcode 0x03 increments BC\'s value by 1', () => {
        setRamValue16bit(0xABCD, 0x1111);
        cpu.executeOpcode(0x01);
        cpu.executeOpcode(0x03);
        expect(cpu.read16BitRegister("BC").getRegisterValue()).toBe(0xABCD + 1);
    })

    test('opcode 0x04 increments B\'s value by 1', () => {
        setRamValue(0xE, 0x1111);
        cpu.executeOpcode(0x06);
        cpu.executeOpcode(0x04);
        expect(cpu.read8BitRegister("B").register.value).toBe(0xF);
    })

    test('opcode 0x05 decrements B\'s value by 1', () => {
        setRamValue(0xE, 0x1111);
        cpu.executeOpcode(0x06);
        cpu.executeOpcode(0x05);
        expect(cpu.read8BitRegister("B").register.value).toBe(0xD);
    })

    test('opcode 0x06 sets B\'s value to 0xA', () => {
        setRamValue(0xE, 0x1111);
        cpu.executeOpcode(0x06);
        expect(cpu.read8BitRegister("B").register.value).toBe(0xE);
    })

    test('opcode 0x07 left shifts A by 1, shifitng the bit in the 7th position to the 0th', () => {
        setRamValue(0xD, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x07);
        expect(cpu.read8BitRegister("A").register.value).toBe(26);

        setRamValue(0xFD, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x07);
        expect(cpu.read8BitRegister("A").register.value).toBe(251);
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
        expect(cpu.read16BitRegister("HL").getRegisterValue()).toBe(0xAC1D + 0x1111);
    })

    test('opcode 0x0A loads RAM[BC] into A', () => {
        setRamValue16bit(0xAC1D, 0x1111);
        cpu.executeOpcode(0x01);
        setRamValue16bit(0x00F1, 0x1111);
        cpu.executeOpcode(0x31);
        setPcValue(cpu, 0xAC1D);
        cpu.executeOpcode(0x08);

        cpu.executeOpcode(0x0A);
        expect(cpu.read8BitRegister("A").register.value).toBe(0xF1);
    })

    test('opcode 0x0B decrements BC by 1', () => {
        setRamValue16bit(0xAC1D, 0x1111);
        cpu.executeOpcode(0x01);
        cpu.executeOpcode(0x0B);
        expect(cpu.read16BitRegister("BC").getRegisterValue()).toBe(0xAC1C);
    })

    test('opcode 0x0C increments C by 1', () => {
        setRamValue(0xEE, 0xBBBB);
        cpu.executeOpcode(0x0E);
        cpu.executeOpcode(0x0C);
        expect(cpu.read8BitRegister("C").register.value).toBe(0xEF);
    })

    test('opcode 0x0D decrements C by 1', () => {
        setRamValue(0xEE, 0xBBBB);
        cpu.executeOpcode(0x0E);
        cpu.executeOpcode(0x0D);
        expect(cpu.read8BitRegister("C").register.value).toBe(0xED);
    })

    test('opcode 0x0E loads into C register immediate 8 bit value', () => {
        setRamValue(0xEE, 0xBBBB);
        cpu.executeOpcode(0x0E);
        expect(cpu.read8BitRegister("C").register.value).toBe(0xEE);
    })

    test('opcode 0x0F right shifts A and carrys LSB to MSB', () => {
        setRamValue(26, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x0F);
        expect(cpu.read8BitRegister("A").register.value).toBe(0xD);

        setRamValue(251, 0x1111);
        cpu.executeOpcode(0x3E);
        cpu.executeOpcode(0x0F);
        expect(cpu.read8BitRegister("A").register.value).toBe(0xFD);
    })

    test('opcode 0x21 loads into HL the input value', () => {
        setRamValue16bit(0xFEED, 0xBBBB);
        cpu.executeOpcode(0x21);
        expect(cpu.read16BitRegister("HL").getRegisterValue()).toBe(0xFEED);
    })

    test('opcode 0x31 sets SP\'s value to the specified input.', () => {
        setRamValue16bit(0xBEEF, 0x1111);
        cpu.executeOpcode(0x31);
        expect(cpu.readSP().getStackValue()).toBe(0xBEEF);
    })

    test('opcode 0x3E sets A value to 0xD', () => {
        setRamValue(0xD, 0x1111);
        cpu.executeOpcode(0x3E);
        expect(cpu.read8BitRegister("A").register.value).toBe(0xD);

        setRamValue(0xFD, 0x1111);
        cpu.executeOpcode(0x3E);
        expect(cpu.read8BitRegister("A").register.value).toBe(0xFD);
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
