import { CPU } from "./emulator/cpu/cpu";
import { mbcCreator } from "./emulator/MemoryBankControllers/mbcCreator";
import { RAM } from "./emulator/RAM/RAM";
import { Logger } from "./logger/logger";


self.onmessage = (msg) => {
    if(msg.data.action == "UPDATE"){
        let logger = new Logger("cpu_worker");
        let loadedRom = mbcCreator.getMBC(msg.data.rom, logger);
        let ram = new RAM(loadedRom, logger);
        ram.useSharedBufferAsSource();
        let cpu = new CPU(ram, logger, true);
        cpu.debugState = true;
        cpu.configureDebugStateLoopLimit(msg.data.loopLimit)
        cpu.loop();
    }
}