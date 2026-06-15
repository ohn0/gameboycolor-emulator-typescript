import { RAM } from "../RAM/RAM";

export class LCDController{
    value : number;
    constructor(LCDCvalue : number){
        this.value = LCDCvalue;
    }

    update(newValue : number){
        this.value = newValue;
    }

    isLcdPpuEnabled() : boolean {
        return (this.value & 0b10000000) > 0;
    }

    getWindowTileMapArea() : number {
        return (this.value & 0b01000000) == 0 ? 0x9800 : 0x9C00;
    }

    isWindowEnabled() : boolean {
        return (this.value & 0b00100000) > 0;
    }

    getAddressingMode() : number {
        return (this.value & 0b00010000) == 0 ? 0x8800 : 0x8000;
    }

    getBgTileMapArea() : number {
        return (this.value & 0b00001000) == 0 ? 0x9800 : 0x9C00;
    }

    getObjSize() : string {
        return (this.value & 0b00000100) == 0 ? "8x8" : "8x16";
    }

    isObjEnabled() : boolean {
        return (this.value & 0b00000010) > 0;
    }

    BgWinPriority() : boolean {
        return (this.value & 0b1) == 1;
    }

}
