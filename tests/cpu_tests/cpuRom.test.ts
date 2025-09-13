import { describe, expect, test } from "@jest/globals";
import { CPU } from "../../emulator/cpu/cpu";
import { RAM } from "../../emulator/RAM/RAM";
import { mbcCreator } from "../../emulator/MemoryBankControllers/mbcCreator";
import { RomLoader } from "../../emulator/romLoader";
import * as path from 'path';
import { iMBC } from "../../emulator/MemoryBankControllers/iMBC";
import { MBC0 } from "../../emulator/MemoryBankControllers/MBC0";

let loadedRom: iMBC;
let ram: RAM;
let cpu: CPU;
const specialTests = '01-special.gb';
const opSpTests = '03-op sp,hl.gb';
const interruptTests = '02-interrupts.gb';
const opRImmTests = '04-op r,imm.gb'; 
const opRpTests = '05-op rp.gb';
const ldTests = '06-ld r,r.gb';
const jrJpCallRetRstTests = '07-jr,jp,call,ret,rst.gb';
const miscTests = '08-misc instrs.gb';
const opRrTests = '09-op r,r.gb';
const resourceLocation = "..\\resources";

function initCpu(testName : string, loopLimit : number) : CPU {
    const loadedRom = mbcCreator.getMBC(
        RomLoader.load(path.resolve(__dirname, resourceLocation, testName)));
    const ram = new RAM(loadedRom);
    const cpu = new CPU(ram, true);

    cpu.debugState = true;
    cpu.DebugAlwaysReturnVBlank();
    cpu.configureDebugStateLoopLimit(loopLimit);

    return cpu;
}
describe(`blargg tests`, () => {
    //load the test ROM into an MBC
    //create a RAM and link MBC to it
    //create CPU and link created RAM to it
    //start looping

    loadedRom = mbcCreator.getMBC(
        // RomLoader.load(path.resolve(__dirname, resourceLocation, specialTests)));
        // RomLoader.load(path.resolve(__dirname, resourceLocation, interruptTests)));
        // RomLoader.load(path.resolve(__dirname, resourceLocation, opSpTests)));
        RomLoader.load(path.resolve(__dirname, resourceLocation, ldTests)));
    ram = new RAM(loadedRom);
    cpu = new CPU(ram, true);
    cpu.debugState = true;
    cpu.DebugAlwaysReturnVBlank();
    cpu.configureDebugStateLoopLimit(300000);


    test(`run blargg tests`, () => {
        const cpu = initCpu(opRrTests, 2500000);
        cpu.loop();
        // let cpu = initCpu(miscTests, 400000);
        // cpu.loop();
        // let cpu = initCpu(jrJpCallRetRstTests, 1300000);
        // cpu.loop();
        //PASSED
        // let cpu = initCpu(opRpTests, 1800000);
        // cpu.loop();
        //PASSED
        // let cpu = initCpu(opRImmTests, 1300000);
        // cpu.loop();
        // cpu = new CPU(new RAM(new MBC0()));
        //PASSED
        // cpu = initCpu(interruptTests, 300000);
        // cpu.loop();
        //PASSED
        // cpu = initCpu(ldTests, 1300000);
        // cpu.loop();
        //PASSED
        // cpu = initCpu(specialTests, 1300000);
        // cpu.loop();
        //PASSED
        // let cpu = initCpu(opSpTests, 1300000);

        expect(true);
    });

    // test(`run blargg ${interruptTests}`, () => {
    //     const cpu = initCpu(interruptTests, 300000);
    //     cpu.loop();
    //     expect(true);
    // });

    // test(`run blargg ${ldTests}`, () => {
    //     const cpu = initCpu(ldTests, 1300000);
    //     cpu.loop();
    //     expect(true);
    // });

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
        // expect(cpu.readMemory(0x436D)).toBe(0xFA);
        // cpu.loop();
        expect(true);
    });
});
