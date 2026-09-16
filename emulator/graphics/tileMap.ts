import { Attribute } from "./attributes";
import { RamProxy } from "../RAM/ramProxy";

export class TileMap {
    // tileArray : Uint8Array;
    //need 2 tile maps, map 0 from 9800-9BFF and map 1 from 9C00-9FFF
    //each map should have an attribute map as well mapped to the same memory region BUT on bank 1 instead of bank 0 
    // tileMap : Array<number>;
    // attributeMap! : Array<number>;
    tileMap : Uint8Array;
    attributeMap! : Uint8Array;    
    startIndex : number;
    cgbModeEnabled : boolean = false;
    ram : RamProxy;
    constructor(start : number, ramProxy : RamProxy, isCgbModeEnabled : boolean){
        this.startIndex = start;
        this.ram = ramProxy;
        this.cgbModeEnabled = isCgbModeEnabled;
        this.tileMap = this.ram.readBlock(this.startIndex, this.startIndex+0x400);
        if(isCgbModeEnabled){
            this.attributeMap = this.ram.readBlock(this.startIndex, this.startIndex + 0x400);
        }
        if(! (start == 0x9800 || start == 0x9C00)){
            console.log("invalid start bank index in tileMap.ts, start value is " + start);
        }

    }

    getTile(tileIndex : number) : number {
        var z = this.ram.read(this.startIndex + tileIndex).value;
        return z;
    }

    getPixel(tileX : number, tileY : number){
        var xIndex = Math.floor(tileX / 8);
        var yIndex = Math.floor(tileY / 8);
    }

    getAttributes(index: number) : Attribute {
        if(!this.cgbModeEnabled)
            throw new Error("attempting to read tilemap attributes even though emulator is not in GBC mode");
        
        var tile = this.ram.read(index, 1).value;
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