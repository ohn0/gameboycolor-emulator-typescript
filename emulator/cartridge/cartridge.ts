import { iMBC } from "../MemoryBankControllers/iMBC";
import { mbcCreator } from "../MemoryBankControllers/mbcCreator";
import { RomLoader } from "../romLoader";

export class Cartridge{
    private _mbc?: iMBC | undefined;
    private _gameData!: Uint8Array;
    public get gameData(): Uint8Array {
        return this._gameData;
    }
    public set gameData(value: Uint8Array) {
        this._gameData = value;
    }

    public get mbc(): iMBC | undefined {
        return this._mbc;
    }
    public set mbc(value: iMBC | undefined) {
        this._mbc = value;
    }

    constructor(filename: string) {
        this.gameData = RomLoader.load(filename);
        this.mbc = mbcCreator.getMBC(this.gameData);
    }

    private getMbcConfiguration(): { mbcType: number, romSize: number, ramSize: number } {
        if (this.gameData.length == 0) {
            throw new Error("game data is not yet initialized.");
        }
        return {
            mbcType: this.gameData[0x147],
            romSize: this.gameData[0x148],
            ramSize: this.gameData[0x149]
        };
    }

}