import { Logger } from "../logger/logger";
import { INTERRUPT_SOURCES } from "./cpu/constants";
import { CPU } from "./cpu/cpu";
import { Interrupt } from "./cpu/interrupt";
import { InterruptHandler } from "./cpu/InterruptHandler";
import { clock } from "./cpu/timers/clock";
import { controlStates } from "./cpu/timers/controlStates";
import { PPU } from "./graphics/ppu";
import { JoyPad } from "./joypad/joypad";
import { RAM } from "./RAM/RAM";

export class gbcExecutor{
    private ppu : PPU;
    private cpu : CPU;
    private systemClock : clock;
    private ram : RAM;
    private logger : Logger;
    private frameInterval : number = 16.67;
    private interruptHandler : InterruptHandler;
    private joypad : JoyPad;
    constructor(ram : RAM){
        this.systemClock = new clock(() => {}, () => {}, controlStates.getControlState(0b000));
        this.ram = ram;
        this.logger = new Logger();
        this.interruptHandler = new InterruptHandler(this.ram, this.logger);
        this.interruptHandler.addInterrupt(new Interrupt(INTERRUPT_SOURCES.INTERRUPT_VBLANK, 0x40, 1, 0));
        this.interruptHandler.addInterrupt(new Interrupt(INTERRUPT_SOURCES.INTERRUPT_LCD_STAT, 0x48, 2, 1));
        this.interruptHandler.addInterrupt(new Interrupt(INTERRUPT_SOURCES.INTERRUPT_TIMER, 0x50, 3, 2));
        this.interruptHandler.addInterrupt(new Interrupt(INTERRUPT_SOURCES.INTERRUPT_SERIAL, 0x58, 4, 3));
        this.interruptHandler.addInterrupt(new Interrupt(INTERRUPT_SOURCES.INTERRUPT_JOYPAD, 0x60, 5, 4));      
        this.joypad = new JoyPad(this.ram, this.interruptHandler, this.logger);  
        this.joypad.initListeners();
        this.ppu = new PPU(this.ram, this.logger )
        this.ppu.initInterruptHandler(this.interruptHandler);
        this.cpu = new CPU(this.ram, this.logger, this.systemClock, true) //skipping boot so weird boot issues
        this.cpu.initInterruptHandler(this.interruptHandler);
        this.cpu.initJoyPad(this.joypad);
        this.cpu.debugState = true;
        this.cpu.configureDebugStateLoopLimit(0xFFFFFFF);
        this.cpu.cyclesToRunBeforeFrameDraw = 69905;
    }
    
    public execute(){
        //set interval to run every 16.67 ms
        //every interval, perform 69905 clock cycles of work on the CPU
        //draw to the screen a single FRAME
        //repeat
        var start = Date.now()
        console.log(start)
        var frames = 0;
        // this.ppu.LY = 0;
        this.systemClock.setPpuHandler(() => {
            this.ppu.updatePpuMode(2);
            this.ppu.lineRender()
        })
        var intervalId = setInterval(
            () => {
                if(this.cpu.shouldQuit()){
                    clearInterval(intervalId);
                }
                frames++;
                const t0 = performance.now();
                this.cpu.loop();
                console.log(performance.now() - t0, "ms");
                window.requestAnimationFrame(() => {this.ppu.basicRender()})
                if(frames == 60){
                }
            },
            this.frameInterval
        );
    }
}