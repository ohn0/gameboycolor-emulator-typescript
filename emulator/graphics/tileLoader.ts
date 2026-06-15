import { Logger } from "../../logger/logger";
import { RAM } from "../RAM/RAM";
import { LCDController } from "./LCDcontroller";
import { Tile } from "./tile";
import { vramBank } from "./vramBank";

export class TileLoader{
    tileSetBank0 : Array<Tile>;
    tileSetBank1 : Array<Tile>;
    bgWinAddressingMode = 0x8000;
    objectAddressingMode = 0x8000;
    vram : vramBank;
    //this class should run AFTER the cpu is done it's tick
    constructor(vram : vramBank){
        this.tileSetBank0 = new Array<Tile>();
        this.tileSetBank1 = new Array<Tile>();
        this.vram = vram;
    }    

    public pullTileData( lcdcFlag : LCDController){
        //if LCDC.4 = 1, BG/WIN read from block 0  and block 1
        //if LCDC.4 = 0, BG/WIN read from block 1 and block 2
        this.tileSetBank0.length = 0;
        this.tileSetBank1.length = 0;
        let readMode = lcdcFlag.getAddressingMode();
        if(readMode != 0x8000){
            this.bgWinAddressingMode = 0x9000
        }

        this.populateObjectData();
        this.populateBgWinData();
    }

    public populateObjectData(){
        let marker = this.objectAddressingMode;

        while(marker < 0x8FFF){
            this.tileSetBank0.push(this.buildTile(0,marker));
            this.tileSetBank1.push(this.buildTile(1,marker));
            marker += 16;
        }
    }

    public populateBgWinData(){
        if(this.bgWinAddressingMode == 0x8000){
            let marker = this.bgWinAddressingMode;
            while(marker < 0x8FFF){
                this.tileSetBank0.push(this.buildTile(0,marker));
                this.tileSetBank1.push(this.buildTile(1,marker));
                marker += 16;
            }
        }
        else{
            let marker = 0x9000;
            while(marker < 0x97FF){
                this.tileSetBank0.push(this.buildTile(0,marker));
                this.tileSetBank1.push(this.buildTile(1,marker));
                marker += 16;
            }
            marker = 0x8800
            while(marker < 0x8FFF){
                this.tileSetBank0.push(this.buildTile(0,marker));
                this.tileSetBank1.push(this.buildTile(1,marker));
                marker += 16;
            }
        }
    }

    public getTile(index : number, bankIndex : number = 0) : Tile{
        try {
            if(bankIndex == 0){
                return this.tileSetBank0[index];
            }
            else if (bankIndex == 1 ){
                return this.tileSetBank1[index];
            }            
        } catch (error) {
            console.log("invalid vram bank index specified")
        }
        return new Tile();

    }

    public buildTile(bankIndex : number, marker : number) : Tile {
        let tile = new Tile();
        tile.startIndex = marker;
        tile.populate(this.vram, bankIndex);
        return tile;
    }

}