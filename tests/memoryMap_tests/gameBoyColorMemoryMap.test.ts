import { GameBoyMemoryMap } from '../../emulator/MemoryMap/GameBoyColorMemoryMap';
import { Uint16 } from './../../primitives/uint16';
import { describe,expect, test } from "@jest/globals";

describe('Gameboy Color memory map testing', () => {
    const gbcMap = new GameBoyMemoryMap();
    test('memory map is created with an existing buffer', () => {
        expect(gbcMap.memory).not.toBeNull();
    })

    test('memory map is created with all zeroes', () => {
        const nonZeros = gbcMap.memory.find(m => m != 0x00);
        expect(nonZeros).toBeUndefined;
    })

    test('memory map is filled with supplied N', () => {
        gbcMap.fillMap(0xFF);
        const filledValues = gbcMap.memory.find(m => m != 0xFF);
        expect(filledValues).toBeUndefined;
    })

    test('memory map throws error when supplied N > 0xFF', () => {
        expect(() => { gbcMap.fillMap(0xFF1) }).toThrow();
    })

    test('memory map returns correct region given N', () => {
        expect(gbcMap.getMemoryRegion(0x0010)).toBe(gbcMap.ROM_BANK);
        expect(gbcMap.getMemoryRegion(0x4100)).toBe(gbcMap.ROM_BANK_CONFIGURABLE);
        expect(gbcMap.getMemoryRegion(0x8010)).toBe(gbcMap.VRAM);
        expect(gbcMap.getMemoryRegion(0xA001)).toBe(gbcMap.external_RAM);
        expect(gbcMap.getMemoryRegion(0xC010)).toBe(gbcMap.WRAM);
        expect(gbcMap.getMemoryRegion(0xD010)).toBe(gbcMap.WRAM_SWITCHABLE);
        expect(gbcMap.getMemoryRegion(0xE010)).toBe(gbcMap.ECHO_RAM);
        expect(gbcMap.getMemoryRegion(0xFE01)).toBe(gbcMap.OAM);
        expect(gbcMap.getMemoryRegion(0xFEA1)).toBe(gbcMap.NA);
        expect(gbcMap.getMemoryRegion(0xFF11)).toBe(gbcMap.IO_REGISTERS);
        expect(gbcMap.getMemoryRegion(0xFF81)).toBe(gbcMap.HIGH_RAM);
        expect(gbcMap.getMemoryRegion(0xFFFF)).toBe(gbcMap.INTERRUPT_ENABLE_REGISTER);
    })

    test('read8bit returns correct 8 bit value at specified index', () => {
        const testUint8Block = new Uint8Array(0xFFFF);
        testUint8Block[0x100] = 0xAB;
        gbcMap.memory = testUint8Block;
        const test8BitValue = gbcMap.read8bit(0x100);
        expect(test8BitValue.value).toBe(0xAB);
    })

    test('read16bit returns correct 16bit little endian value at specified index', () => {
        const testUint8Block = new Uint8Array(0xFFFF);
        testUint8Block[0x100] = 0xAB;
        testUint8Block[0x101] = 0xCD;
        gbcMap.memory = testUint8Block;

        const test16BitValue = gbcMap.read16bit(0x100);
        expect(test16BitValue.get()).toBe(0xCDAB);
    })

    test('write8bit inserts 8 bit value into memory at specified location', () => {
        const value = 0xAA;
        gbcMap.write8bit(0x100, value);
        expect(gbcMap.read8bit(0x100).value).toBe(value);
    })

    test('write16bit inserts 16 bit value into memory at specified location', () => {
        gbcMap.write16bit(0x500, new Uint16(0xBC, 0xDE));
        expect(gbcMap.read16bit(0x500).get()).toBe(0xBCDE);
        const z: Uint16 = new Uint16(0xAA, 0xBB);
    })

    test('write8bit throws error when inserting value greater than 0xFF', () => {
        expect(() => { gbcMap.write8bit(0x8888, 0xAAAA) }).toThrowError();
    })

    test('write8bit throws error when accessing memory location out of bounds', () => {
        expect(() => { gbcMap.write8bit(0xFFFFF, 0xAA) }).toThrowError();
    })
})