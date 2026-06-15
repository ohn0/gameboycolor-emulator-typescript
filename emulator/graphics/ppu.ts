import { Logger } from "../../logger/logger";
import { RAM } from "../RAM/RAM";
import { Tile } from "./tile";
import { TileLoader } from "./tileLoader";
import { LCDController } from "./LCDcontroller";
import { TileMapManager } from "./tileMapManager";
import { InterruptHandler } from "../cpu/InterruptHandler";
import { Palette } from "./Pallete";
import { ObjectAttribute } from "./ObjectAttribute";
import { Uint8 } from "../../primitives/uint8";
import {color, hash} from 'bun';
import { INTERRUPT_SOURCES } from "../cpu/constants";
import { vramBank } from "./vramBank";
import { Attribute } from "./attributes";
import { RamProxy } from "../RAM/ramProxy";
export class PPU {
    ram! : RamProxy;
    tileLoaderBank! : TileLoader;
    tileMap9800! : TileMapManager;
    tileMap9C00! : TileMapManager;
    tilesUpdated : boolean;
    scy : number = 0;
    scx : number = 0;
    wy : number = 0;
    wx : number = 0;
    isWindowVisible : boolean = false;
    lcdcFlag! : LCDController;
    BCPS : number = 0;
    BCPD : number = 0;
    PaletteRam! : Palette;
    ObjectAttributeMemory! : Array<ObjectAttribute>;
    readonly WHITE : Uint8 = new Uint8(0b11111110);
    imgDataOutput! : Uint8Array;


    LYCintSelectSTAT : number = 0;
    Mode2IntSelectSTAT : number = 0;
    Mode1IntSelectSTAT : number = 0;
    Mode0IntSelectSTAT : number = 0;
    LycEqualsLySTAT : boolean = false;
    PPUmodeSTAT : number = 0;
    objsToDraw : Array<Array<Array<number>>> = [];
    vramBank! : vramBank;
    readonly oamBaseAddress = 0xFE00; 
    worker : Worker;

    // interruptHandler : InterruptHandler;
    
    statInterruptRequested : boolean = false;


    constructor(worker : Worker,ram : RAM, logger: Logger){
        // this.ram.loadFromRam(ram);
        this.worker = worker;
        this.tilesUpdated = false;
        this.worker.addEventListener("message", (message) => {
            if(message.data.action == "CPU_STARTED"){
                this.ram = new RamProxy(this.worker, ram);
                this.init();
            }
        })
        this.worker.onmessage = this.initListeners();
    }

    async render(){
        if(!this.ram.ramLoaded) {
            window.requestAnimationFrame(() => {this.render();});
        } 
        var currentLine = this.getLY();
        var output = new Array<Array<number>>(160);
        output.fill(new Array<number>(144));
        this.vramBank = new vramBank(this.ram.readBlock(0x8000, 0x9FFF));
        this.lcdcFlag.update(this.ram.read(0xFF40).value);
        this.tileLoaderBank = new TileLoader(this.vramBank);
        this.tileLoaderBank.pullTileData(this.lcdcFlag);

        var screen = new Array<{background : Uint8Array, attributes : Array<{attribute : Attribute, color : Color }>}>(144);
        screen.fill({background : new Uint8Array(160), attributes: new Array<{attribute : Attribute, color : Color}>(160)});
        screen.forEach(f => f.attributes = new Array<{attribute : Attribute, color : Color}>(160));
        this.buildBackgroundAndWindow(screen);
        if(currentLine >= 0 && currentLine <= 159){
            this.setPpuMode(2);
            var objsAdded = 0;
            //can render
            this.tileLoaderBank.pullTileData(new LCDController(this.ram.read(0xFF40).value));
            for (let yIndex = 0; yIndex < 40; yIndex+=4) {
                let oamYByte = this.ram.read(this.oamBaseAddress + yIndex);
                let oamXByte = this.ram.read(this.oamBaseAddress + yIndex + 1);
                let oamTileIndex = this.ram.read(this.oamBaseAddress + yIndex + 2);
                let oamAttributes = this.ram.read(this.oamBaseAddress + yIndex + 3);
                // console.log(`${oamXByte.value},${oamYByte.value},${oamTileIndex.value},${oamAttributes.value}`);
                if(objsAdded < 10){
                    if(currentLine >= yIndex && currentLine <= yIndex+4){
                        // var hashToTest = Bun.hash(
                        //     `${oamYByte.value.toString()}-${oamXByte.value.toString()}-${oamTileIndex.value.toString()}-${oamAttributes.value.toString()}`
                        // );
                        var encoder = new TextEncoder();
                        var data = encoder.encode(`${oamYByte.value.toString()}-${oamXByte.value.toString()}-${oamTileIndex.value.toString()}-${oamAttributes.value.toString()}`)
                        var hashToTest = new Uint8Array(await window.crypto.subtle.digest("SHA-1", data)).toHex();
                        if(oamYByte.value != 0){
                        console.log(`${oamYByte.value.toString()}-${oamXByte.value.toString()}-${oamTileIndex.value.toString()}-${oamAttributes.value.toString()}`);
                        }
                        if(this.ObjectAttributeMemory.length < 40
                            && !this.ObjectAttributeMemory.some(z => z.objHash == hashToTest)
                        ){
                            this.ObjectAttributeMemory.push(new ObjectAttribute
                                (oamYByte.value, oamXByte.value, oamTileIndex.value, oamAttributes.value)
                            );    
                            objsAdded++;
                        }
                    }
                }
            }
        }
        else {
            this.setPpuMode(1);
            // this.interruptHandler.requestInterrupt(INTERRUPT_SOURCES.INTERRUPT_VBLANK);
            //in VBLANK, no rendering needed
        }
        
        let rowCount = 0;
        let colCount = 0;
        let flatMarker = 0;
        this.imgDataOutput = new Uint8Array(160 * 144 * 4);
        screen.forEach(row => {
            row.background.forEach(c => {
                // output[rowCount][colCount] = 
                // row.attributes[rowCount].attribute.palette;
                try {
                    if(row.attributes[rowCount].attribute == undefined){}
                } catch (error) {
                    console.log("error hit")
                }

                var color = row.attributes[rowCount].color;
                this.imgDataOutput[flatMarker++] = color.red;
                this.imgDataOutput[flatMarker++] = color.green;
                this.imgDataOutput[flatMarker++] = color.blue;
                this.imgDataOutput[flatMarker++] = 255; //alpha value, should eventually be set by the priority levels
                colCount++; 
            });
            rowCount++;
            colCount=0;
        });

        //mode 3 - push lines to window/view
        this.ObjectAttributeMemory.forEach(obj => {
            var targetBank = obj.FetchFromBank1 ? 1 : 0;
            var tile = this.tileLoaderBank.getTile(obj.TileIndex, targetBank);
            var outputTile = this.runOamOperations(tile, obj);
            for (let i = 0; i < outputTile.length; i++) {
                for (let j = 0; j < outputTile[i].length; j++) {
                    output[i + obj.YPosition][j + obj.XPosition] = outputTile[i][j];

                }                
            }
            this.objsToDraw.push(outputTile);
            // console.log(outputTile);
        })
        //mode 0
        //mode 1
        this.incrementLY();
        
        this.objsToDraw = [];
        var canvas = (<HTMLCanvasElement> document.getElementById("canvasScreen")).getContext("2d");
        if(canvas !== null){
            canvas?.clearRect(0,0,160,144);
            var z = new Uint8ClampedArray(this.imgDataOutput);
            let imgData : ImageData = new ImageData(z, 144);
            canvas.putImageData(imgData,0,0);
        }
        window.requestAnimationFrame(() => {this.render();})
    }

    // async renderToScreen(){
    //     var canvas = (<HTMLCanvasElement> document.getElementById("canvasScreen")).getContext("2d");
    //     if(canvas !== null){
    //         canvas?.clearRect(0,0,160,144);
    //         var z = new Uint8ClampedArray(this.getImageData());
    //         let imgData : ImageData = new ImageData(z, 144);
    //         canvas.putImageData(imgData,0,0);
    //     }
        
    //     window.requestAnimationFrame(async () => {await this.renderToScreen();})

    // }

    getImageData(){
        return this.imgDataOutput;
    }

    buildBackgroundAndWindow(screen : Array<{background : Uint8Array, attributes : Array<{attribute : Attribute, color : Color }>}>){
        this.tileMap9800.tiles.update(this.vramBank, this.ram.read(0xFF4F).value);
        this.tileMap9C00.tiles.update(this.vramBank, this.ram.read(0xFF4F).value);
        let background = this.tileMap9800;
        let window = this.tileMap9C00;
        let BGtilemap = this.lcdcFlag.getBgTileMapArea();
        let WindowTileMap = this.lcdcFlag.getWindowTileMapArea();
        let viewX = this.ram.read(0xFF42).value;
        let viewY = this.ram.read(0xFF43).value;

        let windowX = this.ram.read(0xFF4A).value - 7;
        let windowY = this.ram.read(0xFF4B).value;

        if(BGtilemap == 0x9C00){
            background = this.tileMap9C00;
        }

        if(WindowTileMap == 0x9800){
            window = this.tileMap9800;
        }

        let viewXEnd = (viewX + 159) % 256;
        let viewYEnd = (viewY + 143) % 256;
        let screenMarker = 0;
        let viewXIter = viewX;
        let xMarker = 0;
        //populate background IN PIXELS
        try {
            while(screenMarker < 144){
                viewXIter = viewX;
                xMarker = 0;
                while(xMarker < 152){
                    var currentTileIndex = background.tiles.getTile((32 * viewY) + viewXIter);
                    var currentAttributeTile = background.tiles.getAttributes((32 * viewY) + viewXIter);
                    var tile = this.tileLoaderBank.getTile(currentTileIndex, currentAttributeTile.bank).generateTile();
                    var i =  0;
                    while(i < 8){
                        var rgbColor = this.getRgbColor(tile[viewY % 8][(viewXIter+i) % 8], currentAttributeTile.palette);
                        screen[screenMarker].background[xMarker+i] = tile[viewY % 8][(viewXIter+i) % 8];
                        screen[screenMarker].attributes[xMarker+i] = { attribute : currentAttributeTile, color : rgbColor};
                        // screen[viewY].attributes[viewXIter+i].attribute = currentAttributeTile;
                        // screen[viewY].attributes[viewXIter+i].color = rgbColor;
                        i++;
                    }
                    viewXIter = (viewXIter+8) % 256;
                    xMarker++;
                }
                viewY = (viewY+8) % 256;
                screenMarker++;
            }            
        } catch (error) {
            console.log(error);
        }


        //place window on top of background
        if(this.lcdcFlag.isWindowEnabled() && windowY >= 0 && windowY <= 143 && windowX >= 7 && windowX <= 166 ){
            
            while(windowY <= 143){
                while(windowX <= 166){
                    var currentWindowTile = window.tiles.getTile((32 * windowX) + windowY);
                    var attributeTile = window.tiles.getAttributes((32 * windowX) + windowY);
                    var tile = this.tileLoaderBank.getTile(currentWindowTile, attributeTile.bank).generateTile();
                    var i = 0;
                    while(i < 8){
                        screen[windowY].background[windowX+i]  = tile[windowY % 8][(windowX+i) % 8];

                        i++;
                    }
                    windowX+=8;
                }
                windowY+=8;
            }
        }
    }

    setTilesChanged(state : boolean) {
        this.tilesUpdated = state;
    }

    getCurrentBank() : number {
        return this.ram.read(0xFF4F).value & 1;
    }

    getViewPortBoundary(x : number, y : number) {
        this.scx = (x + 159) % 256;
        this.scy = (y + 143) % 256;
    }

    setWindowPosition(x : number, y : number){
        this.wx = x;
        this.wy = y;
        this.isWindowVisible = 
            this.wx >= 0 
            && this.wx <= 166 
            && this.wy >= 0 
            && this.wy <= 143;
    }
    
    getLCDY() : number {
        return this.ram.read(0xFF44).value;
    }

    getLY() : number{
        return this.ram.read(0xFF45).value;
    }

    incrementLY() {
        let LY = this.ram.read(0xFF45).value + 1;
        if(LY > 153){
            LY = 0;
        }
        this.ram.write(0xFF45, LY);
    }

    getPpuMode() {
        return this.ram.read(0xFF41).value & 0b11;
    }

    setPpuMode(mode : number) {
        var newMode = 0;
        if(mode > 4 || mode < 0){
            this.ram.write(0xFF41, 1);
            newMode = 1;
        }
        else{
            this.ram.write(0xFF41, mode);
            newMode = mode;
        }

        this.worker.postMessage({
            action : "PPUMODE",
            ppumode: newMode
        });        
    }

    checkForStatInterrupt() {
        let stat = this.ram.read(0xFF41).value;

        this.LYCintSelectSTAT = stat & 0x40;
        this.Mode2IntSelectSTAT = stat & 0x20;
        this.Mode1IntSelectSTAT = stat & 0x10;
        this.Mode0IntSelectSTAT = stat & 0x8;
        this.LycEqualsLySTAT = (stat & 0x4) > 0;
        this.PPUmodeSTAT = stat & 0b11;

        return this.LYCintSelectSTAT > 0 || this.Mode2IntSelectSTAT > 0
        || this.Mode1IntSelectSTAT > 0 || this.Mode0IntSelectSTAT > 0;
    } 

    init(){
        // this.ram = new RamProxy(this.worker);
        this.lcdcFlag = new LCDController(this.ram.read(0xFF40).value);
        this.vramBank = new vramBank(this.ram.readBlock(0x8000, 0x9FFF));
        this.tileLoaderBank =  new TileLoader(this.vramBank);
        let vramBankRegister : number = this.ram.read(0xFF4F).value;
        this.tileMap9800 = new TileMapManager(0x9800,0x9800, vramBankRegister, this.vramBank);
        this.tileMap9C00 = new TileMapManager(0x9C00,0x9C00, vramBankRegister, this.vramBank);

        // this.interruptHandler = interruptHandler;
        this.BCPS = this.ram.read(0xFF68).value;
        this.BCPD = this.ram.read(this.BCPS).value;
        this.getViewPortBoundary(this.ram.read(0xFF42).value, this.ram.read(0xFF43).value);
        this.PaletteRam = new Palette();// var w = postMessage()
        this.ObjectAttributeMemory = new Array();
        this.imgDataOutput =  new Uint8Array(160 * 144 * 4);        
        this.PaletteRam?.BgPaletteRam.fill(this.WHITE);
        this.PaletteRam?.ObjPaletteRam.fill(this.WHITE);
        window.requestAnimationFrame(() => {this.render();});
    }

    updateBackgroundPalette(value : Uint8){
        var BCPS = this.ram.read(0xFF68).value;
        var ppuMode = this.getPpuMode();
        if(ppuMode != 3){
            this.PaletteRam.BgPaletteRam[BCPS] = value;
        }
        var shouldIncrement = (BCPS & 0x0080) > 0;
        if(shouldIncrement){
            BCPS++;
            BCPS &= 0x00BF
        }
        this.ram.write(0xFF68, BCPS);
    }

    updateObjectPalette(value : Uint8){
        var OCPS = this.ram.read(0xFF6A).value;
        var ppuMode = this.getPpuMode();
        if(ppuMode != 3){
            this.PaletteRam.ObjPaletteRam[OCPS] = value;
        }
        var shouldIncrement = (OCPS & 0x0080) > 0;
        if(shouldIncrement){
            OCPS++;
            OCPS &= 0x00BF
        }
        this.ram.write(0xFF6A, OCPS);
    }

    runOamOperations(tile : Tile, obj : ObjectAttribute) : Array<Array<number>>{
        var tileArray = tile.generateTile();
        if(obj.YFlip){
            tileArray = tileArray.reverse();
        }

        if(obj.XFlip){
            tileArray.forEach(arr => {
                arr = arr.reverse();
            });
        }

        return tileArray;
    }

    readVram(index : number) : number{
        return this.vramBank.read(this.ram.read(0xFF4F).value, index);
    }

    changeBanks(newBank : number, currentBank : number){
        this.vramBank.copyBankToRam(currentBank, 
            (bank : Array<number>) => {
                this.ram.writeBlock(0, bank.length, new Uint8Array(bank))
            }
        );
        this.vramBank.copyRamToBank(newBank, this.ram.readBlock(0x8000, 0x9FFF));
    }

    getPriority(){
        
    }

    updateVramBank(value : number, index : number)
    {
        this.vramBank.write(this.ram.read(0xFF4F).value, index, value);
    }
    // setWindowState(value : number){
    //     this.ram.write()
    // }

    getRgbColor(index : number, palette : number) : Color
    {
        const colorIndex = (palette * 8) + (2 * index);
        var colorFirstHalf = this.PaletteRam.BgPaletteRam[colorIndex];
        var colorSecondHalf = this.PaletteRam.BgPaletteRam[1 + colorIndex];

        var red555 = colorFirstHalf.value & 0b11111;
        var green555 = (0b111 & (colorFirstHalf.value >> 5)) | (0b11000 & (colorSecondHalf.value >> 3));
        var blue555 =  0b11111 & (colorSecondHalf.value >> 1)
        var rgbMapper = (x : number) => {return (x >> 2) | (x << 3)};
        return {
            red : rgbMapper(red555),
            green : rgbMapper(green555),
            blue: rgbMapper(blue555)
        }
    }

    initListeners : any = () => {
        (msg : any) => {
            var payload = msg.data;
            if(payload.action == "updateBackgroundPalette"){
                this.updateBackgroundPalette(payload.value);
            }

            if(payload.action == "updateObjectPalette"){
                this.updateObjectPalette(payload.value);
            }

            if(payload.action == "changeBanks"){
                this.changeBanks(payload.currentBank, payload.value);
            }
        }
    }
}
class Color{
    red : number = 0
    green : number = 0
    blue : number = 0
}