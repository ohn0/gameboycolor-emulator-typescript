import { LCDController } from "./LCDcontroller";
import { Tile } from "./tile";
import { vramBank } from "./vramBank";

export class TileLoader{
    tileSetBank0 : Array<Tile>;
    tileSetBank1 : Array<Tile>;
    bgWinAddressingMode = 0x8000;
    objectAddressingMode = 0x8000;
    currentBank : number;
    vram : vramBank;
    //this class should run AFTER the cpu is done it's tick
    constructor(vram : vramBank){
        this.tileSetBank0 = new Array<Tile>(256);
        this.tileSetBank1 = new Array<Tile>(256);
        this.currentBank = 0;
        this.vram = vram;
    }    

    public pullTileData( lcdcFlag : LCDController, currentBank : number, vram : vramBank){
        //if LCDC.4 = 1, BG/WIN read from block 0  and block 1
        //if LCDC.4 = 0, BG/WIN read from block 1 and block 2
        this.vram = vram;
        this.currentBank = currentBank;
        let readMode = lcdcFlag.getAddressingMode();

        this.bgWinAddressingMode = readMode == 0x8000 ? 0x8000 : 0x9000;
        if(lcdcFlag.isObjEnabled()){
            this.populateObjectData();
        }
        this.populateBgWinData();
    }

    public populateObjectData(){
        let marker = 0;
        let indexMarker = 0;
        if(this.currentBank == 0){
            this.tileSetBank0 = [];
            while(marker < 0x1000){
                // this.tileSetBank0.push(this.buildTile(marker,0));
                this.tileSetBank0[indexMarker++] = this.buildTile(marker,0)
                marker += 16;
            }
        }
        else{
            this.tileSetBank1 = [];
            while(marker < 0x1000){
                // this.tileSetBank1.push(this.buildTile(marker,1));
                this.tileSetBank1[indexMarker++] = this.buildTile(marker,1)
                marker += 16;
            }
        }
    }

    public populateBgWinData(){
        if(this.bgWinAddressingMode == 0x8000){
            let marker = 0;
            if(this.currentBank == 0){
                this.tileSetBank0 = [];
                while(marker < 0x1000){
                    this.tileSetBank0.push(this.buildTile(marker,0));
                    marker+=16;
                }
            }
            else{
                this.tileSetBank1 = [];
                while(marker < 0x1000){
                    this.tileSetBank1.push(this.buildTile(marker,1));
                    marker+=16;
                }
            }
        }

        if(this.bgWinAddressingMode == 0x9000)
        {
            let marker = 0x1000;
            let indexMarker = 0;
            if(this.currentBank == 0){
                this.tileSetBank0 = new Array<Tile>(0x100);
                while(marker < 0x1800){
                    this.tileSetBank0[indexMarker++] = this.buildTile(marker,0);
                    marker += 16;
                }                
            }
            else{
                while(marker < 0x1800){
                    this.tileSetBank1[indexMarker++] = this.buildTile(marker,0);
                    marker += 16;
                }
            }
            marker = 0x800

            if(this.currentBank == 0){
                while(marker < 0x1000){
                    this.tileSetBank0[indexMarker++] = this.buildTile(marker,0);
                    marker += 16;
                }
            }
            else{
                while(marker < 0x1000){
                    this.tileSetBank1[indexMarker++] = this.buildTile(marker,0);
                    marker += 16;
                }
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

    public buildTile( marker : number, bankIndex : number) : Tile {
        let tile = new Tile();
        tile.startIndex = marker;
        tile.populate(this.vram, bankIndex);
        return tile;
    }

}