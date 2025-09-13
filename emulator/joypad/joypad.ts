import { Logger } from "../../logger/logger";
import { InterruptHandler } from "../cpu/InterruptHandler";
import { RAM } from "../RAM/RAM";

export class JoyPad{
    private logger!: Logger;
    private ram!: RAM;
    private interruptHandler!: InterruptHandler;
    private readonly joypadRegister = 0xFF00;
    private buttonMapping = new Map([
        ["START",  0x18],
        ["SELECT", 0x14],
        ["B",      0x12],
        ["A",      0x10],
        ["DOWN",   0x28],
        ["UP",     0x24],
        ["LEFT",   0x22],
        ["RIGHT",  0x20]
    ])
    constructor(ram: RAM, interruptHandler :InterruptHandler, logger: Logger) {
        this.ram = ram;
        this.logger = logger;
        this.interruptHandler = interruptHandler;
    }

    inputKey(button: string) {
        const value = this.buttonMapping.get(button);
        if (value != undefined) {
            this.ram.write(this.joypadRegister, value);
        }
        else {
            this.logger.logToConsole("Invalid button entered " + button);
        }
    }

}