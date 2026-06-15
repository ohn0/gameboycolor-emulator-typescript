import { RAM } from "../RAM/RAM";
import { TileMap } from "./tileMap";
import { vramBank } from "./vramBank";

export class TileMapManager {
    tiles: TileMap;

    constructor(tilesStart : number,tilesAttributesStart : number, vramBankRegister: number, vram : vramBank){
        this.tiles = new TileMap(tilesStart, vram, vramBankRegister);
    }
}