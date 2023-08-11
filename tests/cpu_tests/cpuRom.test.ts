import { describe, expect, test } from "@jest/globals";
import { CPU } from "../../emulator/cpu/cpu";
import { MBC0 } from "../../emulator/MemoryBankControllers/MBC0";
import { RAM } from "../../emulator/RAM/RAM";
import { mbcCreator } from "../../emulator/MemoryBankControllers/mbcCreator";
import { RomLoader } from "../../emulator/romLoader";
import * as path from 'path';
import { iMBC } from "../../emulator/MemoryBankControllers/iMBC";
import * as fs from 'fs';

let loadedRom: iMBC;
let ram: RAM;
let cpu: CPU;
const specialTests = '01-special.gb';
const ldTests = '06-ld r,r.gb';
const opSpTests = '03-op sp,hl.gb';
describe('testing using blargg test roms', () => {
        //load the test ROM into an MBC
        //create a RAM and link MBC to it
        //create CPU and link created RAM to it
        //start looping

    loadedRom = mbcCreator.getMBC(mbcCreator.MBC0,
        RomLoader.load(path.resolve(__dirname, '..\\..', specialTests)));
    ram = new RAM(loadedRom);
    cpu = new CPU(ram, true);
    cpu.debugState = true;
    cpu.DebugAlwaysReturnVBlank();
    cpu.configureDebugStateLoopLimit(250000);
    
    test('MBC0 initialized successfully', () => {

        expect(loadedRom.initialBank.romBank).toBeDefined();
        expect(loadedRom.initialBank.romBank.byteLength).toBe(0x7FFF);
        expect(loadedRom.banks[0]).toBeDefined();

    });

    test('RAM initialized successfully and linked to MBC', () => { 
        expect(ram.mbc).toBeDefined();
        expect(ram.ram).toBeDefined();
    });

    test('CPU initialized successfully and linked to RAM', () => {
        expect(cpu.readMemory(0x436D)).toBe(0xFA);
    });

    test('run tests from ROM', () => {
        const z = cpu.loop();
    })


})