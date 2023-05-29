import { CPU } from '../../emulator/cpu/cpu';
import { describe, expect, test } from "@jest/globals";

describe('CPU opcode testing',() => {
    let cpu = new CPU();
    
    test('opcode 0x01 sets BC value to 0xABCD input', () => {
        cpu.executeOpcode(0x01, 0xABCD);
        expect(cpu.readBC().getRegisterValue()).toBe(0xABCD);
    })

    test('opcode 0x02 sets RAM at BC\'s location to A\'s value.', () => {
        cpu.executeOpcode(0x3E, 0xC);
        cpu.executeOpcode(0x02);

        expect(cpu.readMemory(cpu.readBC().getRegisterValue())).toBe(0xC);
    })

    test('opcode 0x03 increments BC\'s value by 1', () => {
        cpu.executeOpcode(0x01, 0xABCD);
        cpu.executeOpcode(0x03);
        expect(cpu.readBC().getRegisterValue()).toBe(0xABCD + 1);
    })

    test('opcode 0x04 increments B\'s value by 1', () => {
        cpu.executeOpcode(0x06, 0xE);
        cpu.executeOpcode(0x04);
        expect(cpu.readB().register.value).toBe(0xE + 1);
    })

    test('opcode 0x05 decrements B\'s value by 1', () => {
        cpu.executeOpcode(0x06, 0xE);
        cpu.executeOpcode(0x05);
        expect(cpu.readB().register.value).toBe(0xE - 1);
    })

    test('opcode 0x06 sets B\'s value to 0xA', () => {
        cpu.executeOpcode(0x06, 0xA);
        expect(cpu.readB().register.value).toBe(0xA);
    })

    test('opcode 0x07 left shifts A by 1, shifitng the bit in the 7th position to the 0th', () => {
        cpu.executeOpcode(0x3E, 0xD);
        cpu.executeOpcode(0x07);
        expect(cpu.readA().register.value).toBe(26);

        cpu.executeOpcode(0x3E, 0xFD);
        cpu.executeOpcode(0x07);
        expect(cpu.readA().register.value).toBe(251);
    })

    test('opcode 0x08 loads SP\'s value into the memory location specified', () => {
        cpu.executeOpcode(0x31, 0xFE);
        cpu.executeOpcode(0x08, 0xAC1D);
        expect(cpu.readMemory(0xAC1D)).toBe(0xFE);
    })

    test('opcode 0x09 sets HL to the sum of HL and BC', () => {
        cpu.executeOpcode(0x01, 0xAC1D);
        cpu.executeOpcode(0x21, 0x1111);
        cpu.executeOpcode(0x09);
        expect(cpu.readHL().getRegisterValue()).toBe(0xAC1D + 0x1111);
    })

    test('opcode 0x21 loads into HL the input value', () => {
        cpu.executeOpcode(0x21, 0xFEED);
        expect(cpu.readHL().getRegisterValue()).toBe(0xFEED);
    })

    test('opcode 0x31 sets SP\'s value to the specified input.', () => {
        cpu.executeOpcode(0x31, 0xBEEF);
        expect(cpu.readSP().getStackValue()).toBe(0xBEEF);
    })

    test('opcode 0x3E sets A value to 0xD', () => {
        cpu.executeOpcode(0x3E, 0xD);
        expect(cpu.readA().register.value).toBe(0xD);

        cpu.executeOpcode(0x3E, 0xFD);
        expect(cpu.readA().register.value).toBe(0xFD);
    })
    
});