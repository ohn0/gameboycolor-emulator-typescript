import { TileMap } from "./tileMap";
import { vramBank } from "./vramBank";

export class TileMapManager {
    tiles: TileMap;

    constructor(tilesStart : number,tilesAttributesStart : number, vramBankRegister: number, vram : vramBank, isCgbModeEnabled : boolean){
        this.tiles = new TileMap(tilesStart, vram, vramBankRegister, isCgbModeEnabled);
    }
}