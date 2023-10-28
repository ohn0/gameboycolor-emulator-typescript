import { mbcCreator } from "./MemoryBankControllers/mbcCreator";
import { RAM } from "./RAM/RAM";
import { CPU } from "./cpu/cpu";
import { RomLoader } from "./romLoader";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';
const resourceLocation = "..\\resources";
interface romModule  {
    fileName: string,
    loopLimit: number
}
const blarggTests: romModule[] = [
    { fileName: '01-read_timing.gb', loopLimit: 4000000 },
    // {fileName: 'interrupt_time.gb', loopLimit: 5000000}, can't test interrupt time until sound works and maybe also video works
    // {fileName: '01-special.gb', loopLimit: 20000000},
    // {fileName: '02-interrupts.gb', loopLimit: 10000000},
    // {fileName: '03-op sp,hl.gb', loopLimit: 20000000},
    // {fileName: '04-op r,imm.gb', loopLimit: 20000000},
    // {fileName: '05-op rp.gb', loopLimit: 20000000},
    // {fileName: '06-ld r,r.gb', loopLimit: 10000000},
    // {fileName: '07-jr,jp,call,ret,rst.gb', loopLimit: 20000000},
    // {fileName: '08-misc instrs.gb', loopLimit: 5000000},
    // {fileName: '09-op r,r.gb', loopLimit: 50000000},
    // {fileName: '10-bit ops.gb', loopLimit: 80000000},
    // {fileName: '11-op a,(hl).gb', loopLimit: 100000000},
    // {fileName: 'instr_timing.gb', loopLimit: 20000000},
]



export function initCpu(testName : string, loopLimit : number) : CPU {
    const loadedRom = mbcCreator.getMBC(mbcCreator.MBC0,
        RomLoader.load(path.resolve(dirname(fileURLToPath(import.meta.url)), resourceLocation, testName), true));
    const ram = new RAM(loadedRom);
    const cpu = new CPU(ram, true);

    cpu.debugState = true;
    cpu.DebugAlwaysReturnVBlank();
    cpu.configureDebugStateLoopLimit(loopLimit);

    return cpu;
}

export function run() {
    blarggTests.forEach(test => {
        const cpu = initCpu(test.fileName, test.loopLimit);
        const start = performance.now();
        cpu.loop();
        const end = performance.now();
    })
}

run();