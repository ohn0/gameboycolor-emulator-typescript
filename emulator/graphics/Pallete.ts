import { Uint8 } from "../../primitives/uint8";

export class Palette {
    BgPaletteRam : Array<Uint8> = [];
    ObjPaletteRam : Array<Uint8> = [];

    constructor(){
        this.BgPaletteRam = new Array<Uint8>(64);
        this.ObjPaletteRam = new Array<Uint8>(64);
    }
    
}