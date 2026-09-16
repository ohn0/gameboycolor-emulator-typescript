import { RamProxy } from "../RAM/ramProxy";
import { TileMap } from "./tileMap";

export class TileMapManager {
    tiles: TileMap;

    constructor(tilesStart : number,tilesAttributesStart : number,ram : RamProxy, isCgbModeEnabled : boolean){
        this.tiles = new TileMap(tilesStart, ram, isCgbModeEnabled);
    }
}