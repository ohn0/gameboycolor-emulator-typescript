import { mbcCreator } from "./MemoryBankControllers/mbcCreator";
import { RAM } from "./RAM/RAM";
import { CPU } from "./cpu/cpu";
import { RomLoader } from "./romLoader";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';
import { Logger } from "../logger/logger";
const resourceLocation = "..\\resources";
interface romModule  {
    fileName: string,
    loopLimit: number
}
const blarggTests: romModule[] = [
    // {fileName: 'interrupt_time.gb', loopLimit: 5000000}, //can't test interrupt time until sound works and maybe also video works
    // { fileName: 'halt_bug.gb', loopLimit: 0xFFFFFFFFF },
    // {fileName: '03-modify_timing.gb', loopLimit: 40000000 }, // this one actually FAILS tf no it doesnt 
    
    //all tests below PASS
    // {fileName: '11-op a,(hl).gb', loopLimit: 0xFFFFFFF }, //require MASSIVE loop limits
    // {fileName: '09-op r,r.gb', loopLimit: 0xFFFFFFF}, // require MASSIVE loop limits
    
    // {fileName: 'instr_timing.gb', loopLimit: 3100000},
    // { fileName: '01-read_timing.gb', loopLimit: 4000000 },
    // {fileName: '02-write_timing.gb', loopLimit: 4000000 },
    // {fileName: '01-special.gb', loopLimit: 20000000},
    // {fileName: '02-interrupts.gb', loopLimit: 4000000},
    // {fileName: '03-op sp,hl.gb', loopLimit: 20000000},
    // {fileName: '04-op r,imm.gb', loopLimit: 20000000},
    // {fileName: '05-op rp.gb', loopLimit: 20000000},
    // {fileName: '06-ld r,r.gb', loopLimit: 10000000},
    // {fileName: '07-jr,jp,call,ret,rst.gb', loopLimit: 20000000},
    // {fileName: '08-misc instrs.gb', loopLimit: 5000000},
    // {fileName: '10-bit ops.gb', loopLimit: 80000000}

]

const mbcTester: romModule[] = [
    {fileName: 'cpu_instrs.gb', loopLimit: 0xFFFFFFF}
]

const haltBugTester: romModule[] = [
    {fileName: 'halt_bug.gb', loopLimit: 0xFFFFFFF}
]

const memTimingTester: romModule[] = [
    {fileName : 'mem_timing.gb', loopLimit: 0xFFFFFF}
]


export function initCpu(testName : string, loopLimit : number) : CPU {
    const logger = new Logger("logOutput");
    const loadedRom = mbcCreator.getMBC(
        RomLoader.load(path.resolve(dirname(fileURLToPath(import.meta.url)), resourceLocation,
            testName), true), logger);
    const ram = new RAM(loadedRom, logger);
    const cpu = new CPU(ram, logger, true);

    cpu.debugState = true;
    cpu.configureDebugStateLoopLimit(loopLimit);

    return cpu;
}

export function run(z : romModule[]) {
    z.forEach(test => {
        const cpu = initCpu(test.fileName, test.loopLimit);
        const start = performance.now();
        cpu.loop();
        const end = performance.now();
    })
}

// run(blarggTests);
// run(mbcTester);
// run(haltBugTester);
run(memTimingTester);
// console.log('check bun');
