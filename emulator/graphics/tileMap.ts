import { vramBank } from "./vramBank";
import { Attribute } from "./attributes";

export class TileMap {
    // tileArray : Uint8Array;
    //need 2 tile maps, map 0 from 9800-9BFF and map 1 from 9C00-9FFF
    //each map should have an attribute map as well mapped to the same memory region BUT on bank 1 instead of bank 0 
    vram: vramBank;
    vramBankIndex : number;
    tileMap : Array<number>;
    attributeMap! : Array<number>;
    startIndex : number;
    cgbModeEnabled : boolean = false;
    constructor(start : number, ram : vramBank, currentBank : number, isCgbModeEnabled : boolean){
        this.startIndex = start - 0x8000;
        this.vram = ram;
        this.vramBankIndex = currentBank;
        this.cgbModeEnabled = isCgbModeEnabled;
        this.tileMap = this.vram.readBlock(0, this.startIndex, this.startIndex+0x400);
        if(isCgbModeEnabled){
            this.attributeMap = this.vram.readBlock(1, this.startIndex, this.startIndex + 0x400);
        }
        if(! (start == 0x9800 || start == 0x9C00)){
            console.log("invalid start bank index in tileMap.ts, start value is " + start);
        }

    }

    getTile(tileIndex : number) : number {
        return this.vram.read(0, this.startIndex + tileIndex);
    }

    getPixel(tileX : number, tileY : number){
        var xIndex = Math.floor(tileX / 8);
        var yIndex = Math.floor(tileY / 8);
        
        var xNorm = tileX - xIndex;
        var yNorm = tileY - yIndex;

        
    }

    update(ram : vramBank, currentBank : number){
        this.tileMap = ram.readBlock(0, this.startIndex, this.startIndex + 0x400);
        if(this.cgbModeEnabled){
            this.attributeMap = ram.readBlock(1, this.startIndex, this.startIndex+0x400);
        }
    }

    updateMap(newIndex : number, location : number){
        // if(location >= 0x9800 && location <= 0x9FFF) this.tileArray[0x9800 - location] = newIndex;
        // this.vram.write(this.vramBankIndex, location, newIndex);
        // we should NEVER be writing back to the tilemap, that doesn't make sense, the PPU shouldn't write back data here
    }

    getAttributes(index: number) : Attribute {
        if(!this.cgbModeEnabled)
            throw new Error("attempting to read tilemap attributes even though emulator is not in GBC mode");
        
        var tile = this.vram.read(1, index);
        return new Attribute(
            (tile & 0x80) > 0 ? 1 : 0,
            (tile & 0x40) > 0 ? 1 : 0,
            (tile & 0x20) > 0 ? 1 : 0,
            (tile & 0x8) > 0 ? 1 : 0,
            (tile & 0x7)
        )
    }

    getPriority(lcdc : number, bgAttribute : number, oamAttribute : number){
        //need to grab color index here for background and if it is 0, then OBJ ALWAYS gets priority
        if((lcdc == 1 && oamAttribute == 0 && bgAttribute == 1)
         ||(lcdc == 1 && oamAttribute == 1 && bgAttribute == 0)
         ||(lcdc == 1 && oamAttribute == 1 && bgAttribute == 1)){
            return "OBJ";
         }
         return "BG";
    }
}