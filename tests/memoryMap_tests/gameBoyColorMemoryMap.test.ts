import { GameBoyMemoryMap } from "../../GameBoyColorMemoryMap";
import { describe,expect, test } from "@jest/globals";

describe('Gameboy Color memory map testing', () => {
    test('memory map is created with an existing buffer', () => {
        let gbcMap = new GameBoyMemoryMap();
        expect(gbcMap.memory).not.toBeNull();
    })

    test('memory map is created with all zeroes', () => {
        let gbcMap = new GameBoyMemoryMap();
        let nonZeros = gbcMap.memory.find(m => m != 0x00);
        expect(nonZeros).toBeUndefined;
    })

    test('memory map is filled with supplied N', () => {
        let gbcMap = new GameBoyMemoryMap();
        gbcMap.fillMap(0xFF);
        let filledValues = gbcMap.memory.find(m => m != 0xFF);
        expect(filledValues).toBeUndefined;
    })

    test('memory map throws error when supplied N > 0xFF', () => {
        let gbcMap = new GameBoyMemoryMap();
        expect(() => { gbcMap.fillMap(0xFF1) }).toThrow();
    })

    test('memory map returns correct region given N', () => {
        let gbcMap = new GameBoyMemoryMap();
        expect(gbcMap.getMemoryRegion(0x0010)).toBe(gbcMap.ROM_BANK);
        expect(gbcMap.getMemoryRegion(0x4100)).toBe(gbcMap.ROM_BANKN);
        expect(gbcMap.getMemoryRegion(0x8010)).toBe(gbcMap.VRAM);
        expect(gbcMap.getMemoryRegion(0xA001)).toBe(gbcMap.externalRAM);
        expect(gbcMap.getMemoryRegion(0xC010)).toBe(gbcMap.WRAM);
        expect(gbcMap.getMemoryRegion(0xD010)).toBe(gbcMap.WRAM_SWITCHABLE);
        expect(gbcMap.getMemoryRegion(0xE010)).toBe(gbcMap.ECHO_RAM);
        expect(gbcMap.getMemoryRegion(0xFE01)).toBe(gbcMap.OAM);
        expect(gbcMap.getMemoryRegion(0xFEA1)).toBe(gbcMap.NA);
        expect(gbcMap.getMemoryRegion(0xFF11)).toBe(gbcMap.IO_REGISTERS);
        expect(gbcMap.getMemoryRegion(0xFF81)).toBe(gbcMap.HIGH_RAM);
        expect(gbcMap.getMemoryRegion(0xFFFF)).toBe(gbcMap.INTERRUPT_ENABLE_REGISTER);



    })
})