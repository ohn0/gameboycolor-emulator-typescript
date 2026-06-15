import { InterruptHandler } from './cpu/InterruptHandler';
import { mbcCreator } from "./MemoryBankControllers/mbcCreator";
import { RAM } from "./RAM/RAM";
import { CPU } from "./cpu/cpu";
import { RomLoader } from "./romLoader";
// import { fileURLToPath } from 'url';
// import * as b from 'bun';
import * as path from 'path';
import { Logger } from "../logger/logger";
import { JoyPad } from './joypad/joypad';
import { dirname } from 'node:path';
import { PPU } from './graphics/ppu';
import { worker } from 'node:cluster';
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
    
    {fileName: 'instr_timing.gb', loopLimit: 3100000},
    // {fileName: '01-read_timing.gb', loopLimit: 4000000 },
    // {fileName: '02-write_timing.gb', loopLimit: 4000000 },
    // {fileName: '01-special.gb', loopLimit: 20000000},
    // {fileName: '02-interrupts.gb', loopLimit: 4000000},
    // {fileName: '03-op sp,hl.gb', loopLimit: 20000000},
    // {fileName: '04-op r,imm.gb', loopLimit: 20000000},
    // {fileName: '05-op rp.gb', loopLimit: 20000000},
    // {fileName: '06-ld r,r.gb', loopLimit: 10000000},
    // {fileName: '07-jr,jp,call,ret,rst.gb', loopLimit: 20000000},
    // {fileName: '08-misc instrs.gb', loopLimit: 5000000},
    // {fileName: '09-op r,r.gb', loopLimit: 0xFFFFFFF}, // require MASSIVE loop limits
    // {fileName: '10-bit ops.gb', loopLimit: 80000000},
    // {fileName: '11-op a,(hl).gb', loopLimit: 0xFFFFFFF }, //require MASSIVE loop limits
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

const instrTimingTester: romModule[] = [
    {fileName: 'instr_timing.gb', loopLimit: 0xFFFFFF} //this one still failing
]

const interruptTimeTester: romModule[] = [
    { fileName: 'interrupt_time.gb', loopLimit: 0xFFFFFF } //requires CGB so maybe still failing
]


export async function initEmulator(rom : string, loopLimit : number){
    const logger = new Logger("logOutput");
    var romData = await RomLoader.load(rom);
    const loadedRom = mbcCreator.getMBC(romData, logger);
    
    const interruptHandler = new InterruptHandler(logger);
    const ram = new RAM(loadedRom, logger);
    const joyPad = new JoyPad(ram, interruptHandler, logger);
    var fileText = await (await fetch('/worker')).text();
    var blob = new Blob([fileText], {type : "text/javascript"});
    var clonedRam = structuredClone(ram);
    clonedRam.mbc = loadedRom;
    let cpuWorker = new Worker(
        URL.createObjectURL(blob), {type: "module"});
    
    cpuWorker.postMessage({action: "UPDATE", 
        data : clonedRam, 
        rom: romData,
        // interruptHandler : interruptHandler, 
        // logger : logger, 
        loopLimit : loopLimit})
    const ppu = new PPU(cpuWorker, ram, logger);
    // window.requestAnimationFrame(async () => {await ppu.render()});
    // const cpu = new CPU(ram,ppu, logger, interruptHandler, true);

    // cpu.debugState = true;
    // cpu.configureDebugStateLoopLimit(loopLimit);

    // return cpu;
}

export async function run(z : romModule[]) {
    z.forEach(async test => {
        await initEmulator(test.fileName, test.loopLimit);
        const start = performance.now();
        // cpu.loop();
        // window.setInterval(() => cpu.tick(), 5);
        const end = performance.now();
    })
}


export async function runCpu(z : romModule[]) {
    z.forEach(async test => {
        const logger = new Logger("logOutput");
        var romData = await RomLoader.load(test.fileName);
        const loadedRom = mbcCreator.getMBC(romData, logger);
        const interruptHandler = new InterruptHandler(logger);
        const ram = new RAM(loadedRom, logger);
        var cpu = new CPU(ram, logger, true);
        cpu.debugState = true;
        cpu.loop();
    })
}

// fetch(`/getRom/${mbcTester[0].fileName}`).then(z => console.log(z.bytes()))
// run(blarggTests);
run(mbcTester);
// runCpu(mbcTester);
// run(haltBugTester);
// run(memTimingTester);
// run(interruptTimeTester);
// run(instrTimingTester);
