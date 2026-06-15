import { Uint8 } from "../../primitives/uint8";
import { HardwareRegister } from "../cpu/hardwareRegister";
import { RAM } from "../RAM/RAM";

export class MemoryMap{
    private ram : RAM;
    public memoryMapLibrary : any;
    constructor(ram: RAM){
        this.ram = ram;

        this.memoryMapLibrary = {
            0xFF00 : new HardwareRegister("Joypad", 0xFF00),
            0xFF01 : new HardwareRegister("Serial Transfer Data", 0xFF01),
            0xFF02 : new HardwareRegister("Serial Transfer Control", 0xFF02),
            0xFF04 : new HardwareRegister("Divider", 0xFF04),
            0xFF05 : new HardwareRegister("Timer Counter", 0xFF05),
            0xFF06 : new HardwareRegister("Timer Modulo", 0xFF06),
            0xFF07 : new HardwareRegister("Timer Control", 0xFF07),
            0xFF0F : new HardwareRegister("Interrupt Flag", 0xFF0F),
            0xFF10 : new HardwareRegister("Sound Channel 1", 0xFF10),
            0xFF11 : new HardwareRegister("Sound Channel 1 Length Timer & Duty Cycle", 0xFF11),
            0xFF12 : new HardwareRegister("Sound Channel 1 volume & envelope", 0xFF12),
            0xFF13 : new HardwareRegister("Sound Channel 1 Period Low", 0xFF13, false, true),
            0xFF14 : new HardwareRegister("Sound CHannel 1 Period High & Control", 0xFF14),
            0xFF16 : new HardwareRegister("Sound Channel 2 Length Timer & Duty Cycle", 0xFF16),
            0xFF17 : new HardwareRegister("Sound Channel 2 volume & envelope", 0xFF17),
            0xFF18 : new HardwareRegister("Sound Channel 2 Period Low", 0xFF18, false, true),
            0xFF19 : new HardwareRegister("Sound CHannel 2 Period High & Control", 0xFF19),
            0xFF1A : new HardwareRegister("Sound Channel 3 DAC enable", 0xFF1A),
            0xFF1B : new HardwareRegister("Sound Channel 3 Length Timer", 0xFF1B, false, true),
            0xFF1C : new HardwareRegister("Sound Channel 3 Output Level", 0xFF1C),
            0xFF1D : new HardwareRegister("Sound Channel 3 Period Low", 0xFF1D, false, true),
            0xFF1E : new HardwareRegister("Sound Channel 3 Period High & Control", 0xFF1E),
            0xFF20 : new HardwareRegister("Sound Channel 4 Length Timer", 0xFF20, false, true),
            0xFF21 : new HardwareRegister("Sound Channel 4  Volume & Envelope", 0xFF21),
            0xFF22 : new HardwareRegister("Sound Channel 4  Frequency & Randomness", 0xFF22),
            0xFF23 : new HardwareRegister("Sound Channel 4  Control ", 0xFF23),

            0xFF24 : new HardwareRegister("Master Volume & VIN Panning", 0xFF24),
            0xFF25 : new HardwareRegister("Sound Panning", 0xFF25),
            0xFF26 : new HardwareRegister("Sound on/off", 0xFF26),
            //up to FF3F is all Wave RAM
            0xFF40 : new HardwareRegister("LCD Control", 0xFF40),
            0xFF41 : new HardwareRegister("LCD Status", 0xFF41),
            0xFF42 : new HardwareRegister("Viewport Y Position", 0xFF42),
            0xFF43 : new HardwareRegister("Viewport X Position", 0xFF43),
            0xFF44 : new HardwareRegister("LCD Y Coordinate", 0xFF44, true, false),
            0xFF45 : new HardwareRegister("LY Compare", 0xFF45),
            0xFF46 : new HardwareRegister("OAM DMA Source Address & Start", 0xFF46),
            0xFF47 : new HardwareRegister("BG Palette Data", 0xFF47),
            0xFF48 : new HardwareRegister("OBJ Palette Data 0", 0xFF48),
            0xFF49 : new HardwareRegister("OBJ Palette Data 1", 0xFF49),
            0xFF4A : new HardwareRegister("Window Y Position", 0xFF4A),
            0xFF4B : new HardwareRegister("Window X Position Plus 7", 0xFF4B),
            0xFF4C : new HardwareRegister("CPU Mode Select", 0xFF4C),
            0xFF4D : new HardwareRegister("Prepare Speed Switch", 0xFF4D),

            0xFF4F : new HardwareRegister("VRAM Bank", 0xFF4F),
            0xFF50 : new HardwareRegister("Boot ROM Mapping Control", 0xFF50, false, true),
            0xFF51 : new HardwareRegister("VRAM DMA source high", 0xFF51, false, true),
            0xFF52 : new HardwareRegister("VRAM DMA source low", 0xFF52, false, true),
            0xFF53 : new HardwareRegister("VRAM DMA destination high", 0xFF53, false, true),
            0xFF54 : new HardwareRegister("VRAM DMA destination low", 0xFF54, false, true),
            0xFF55 : new HardwareRegister("VRAM DMA length/mode/start", 0xFF55),
            0xFF56 : new HardwareRegister("Infrared Communications Port", 0xFF56),
            0xFF68 : new HardwareRegister("Background Color Palette spec/ palette index", 0xFF68),
            0xFF69 : new HardwareRegister("Background color palette data", 0xFF69),
            0xFF6A : new HardwareRegister("OBJ Color Palette Specification", 0xFF6A),
            0xFF6B : new HardwareRegister("OBJ Color Palette Data", 0xFF6B),
            0xFF6C : new HardwareRegister("Object Priority Mode", 0xFF6C),
            0xFF70 : new HardwareRegister("WRAM Bank", 0xFF70),
            0xFF76 : new HardwareRegister("Audio Digital Outputs 1 & 2", 0xFF76, true, false),
            0xFF77 : new HardwareRegister("Audio Digital Outputs 3 & 4", 0xFF77, true, false),
            0xFFFF : new HardwareRegister("Interrupt Enable", 0xFFFF),
        };

        for (let X = 0xFF30; X <= 0xFF3F ; X++) {
            this.memoryMapLibrary[X] = new HardwareRegister(`Wave Ram ${X}`, X);
        }
    }


    public write(value : Uint8, address : number){
        if(this.memoryMapLibrary[address].writeEnable){
            this.memoryMapLibrary[address] = value;
        }
    }

    public read(address : number) : number{
        if(this.memoryMapLibrary[address].readEnable){
            return this.memoryMapLibrary[address]._;
        }

        return -1;
    }
}

