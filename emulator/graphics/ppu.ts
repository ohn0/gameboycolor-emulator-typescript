import { Logger } from "../../logger/logger";
import { RAM } from "../RAM/RAM";
import { Tile } from "./tile";
import { TileLoader } from "./tileLoader";
import { LCDController } from "./LCDcontroller";
import { TileMapManager } from "./tileMapManager";
import { Palette } from "./Pallete";
import { ObjectAttribute } from "./ObjectAttribute";
import { Uint8 } from "../../primitives/uint8";
import { Attribute } from "./attributes";
import { RamProxy } from "../RAM/ramProxy";
import { InterruptHandler } from "../cpu/InterruptHandler";
import { INTERRUPT_SOURCES } from "../cpu/constants";
export class PPU {
    ram! : RamProxy;
    tileLoaderBank! : TileLoader;
    tileMap9800! : TileMapManager;
    tileMap9C00! : TileMapManager;
    tilesUpdated! : boolean;
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
    imgDataOutput! : Uint8Array;


    LYCintSelectSTAT : number = 0;
    Mode2IntSelectSTAT : number = 0;
    Mode1IntSelectSTAT : number = 0;
    Mode0IntSelectSTAT : number = 0;
    LycEqualsLySTAT : boolean = false;
    LycValue : number  = 0;
    PPUmodeSTAT : number = 0;
    objsToDraw : Array<Array<Array<number>>> = [];
    readonly oamBaseAddress = 0xFE00; 
    worker! : Worker;
    LY : number = 0;
    imgDataIndex : number = 0;
    currentTileMapYIndex : number = 0;
    rowTracker : number = 0;
    currentBankIndex : number = 0;
    cgbModeEnabled : boolean = false;
    previousYStart : number = 0;
    canvasCtx! : CanvasRenderingContext2D | null;
    nonCgbPalette!: Array<number>;
    totalObjectsCurrentlyRendered : number = 0;
    scrollingRegistersUpdated : boolean = true;
    addressingModeUpdated : boolean = true;
    addressMode : number = 0;
    whiteTile = [
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
    ];
    windowInternalLineCounter : number = 0;
    windowWasVisibleThisFrame : boolean = false;
    
    statInterruptRequested : boolean = false;
    readonly CANVAS_WIDTH = 160;
    readonly CANVAS_HEIGHT = 144;
    generatedLine!: Uint8Array;
    generatedLineIndex!: number;
    pixelBuffer! : Array<Uint8Array>;
    interruptHandler! : InterruptHandler;
    scrollX!: number;
    scrollY!: number;
    maps!: {background : TileMapManager, window : TileMapManager}

    constructor(ram : RAM, logger: Logger){
        this.ram = new RamProxy(ram);
        this.ram.useSAB = false;
        this.init();
    }

    init(){
        this.lcdcFlag = new LCDController(this.ram.read(0xFF40).value);
        this.currentBankIndex = this.ram.read(0xFF4F).value;
        this.cgbModeEnabled = this.ram.read(143).value == 0x80 || this.ram.read(143).value == 0xC0;
        this.tileLoaderBank =  new TileLoader(this.ram);
        this.tileMap9800 = new TileMapManager(0x9800,0x9800, this.ram, this.cgbModeEnabled);
        this.tileMap9C00 = new TileMapManager(0x9C00,0x9C00,this.ram, this.cgbModeEnabled);
        this.BCPS = this.ram.read(0xFF68).value;
        this.BCPD = this.ram.read(this.BCPS).value;
        this.getViewPortBoundary(this.ram.read(0xFF42).value, this.ram.read(0xFF43).value);
        this.PaletteRam = new Palette();
        this.ObjectAttributeMemory = new Array();
        this.imgDataOutput =  new Uint8Array(160 * 144 * 4);    
        this.imgDataIndex = 0;    
        this.pixelBuffer = new Array<Uint8Array>(144);
        for(let i = 0; i < 144; i++){
            this.pixelBuffer[i] = new Uint8Array(160);
        }
        for(let i = 0; i < this.PaletteRam.ObjPaletteRam.length; i+=2){
            this.PaletteRam.ObjPaletteRam[i] = new Uint8(0x7F);
            this.PaletteRam.ObjPaletteRam[i+1] = new Uint8(0xFF);

            this.PaletteRam.BgPaletteRam[i] = new Uint8(0x7F);
            this.PaletteRam.BgPaletteRam[i+1] = new Uint8(0xFF);
        }
        this.canvasCtx = (<HTMLCanvasElement> document.getElementById("canvasScreen")).getContext("2d" ,{alpha : true});
        if(this.canvasCtx != null){
            this.canvasCtx.canvas.style.width = `${2 * 160}`;
            this.canvasCtx.canvas.style.height = `${2 * 144}`;        
        }
    }
    
    initInterruptHandler(interruptHandler : InterruptHandler){
        this.interruptHandler = interruptHandler;
    }

    applyTileMapAttributes(tileIndex : number, attributeTile :Attribute) : Array<Array<number>>
    {
        var tile : Tile;
        tile = this.tileLoaderBank.getTile(tileIndex, 0);
        if(!this.cgbModeEnabled) return tile.generateTile();
        if(attributeTile.bank == 0){
            tile = this.tileLoaderBank.getTile(tileIndex, 0);
        }
        else{
            tile = this.tileLoaderBank.getTile(tileIndex, 1);
        }

        var tileArray = tile.generateTile();

        if(attributeTile.priority == 0){
            tileArray.forEach(row => row.fill(0));
            return tileArray;
        }

        if(attributeTile.yflip){
            tileArray = tileArray.reverse();
        }

        if(attributeTile.xflip){
            tileArray.forEach(arr => {
                arr = arr.reverse();
            });
        }

        return tileArray;
    }

    buildBackgroundAndWindowByLine(currentLY: number){
        if(!this.lcdcFlag.isLcdPpuEnabled()) return;
        this.lcdcFlag.update(this.ram.read(0xFF40).value);

        if(this.scrollX == this.ram.read(0xFF43).value && this.scrollY == this.ram.read(0xFF42).value){
            this.scrollingRegistersUpdated = false;
        }
        else{
            this.scrollX = this.ram.read(0xFF43).value;
            this.scrollY = this.ram.read(0xFF42).value;
            this.scrollingRegistersUpdated = true;
        }
  
        if(this.addressMode != this.lcdcFlag.getAddressingMode()){
            this.addressMode = this.lcdcFlag.getAddressingMode();
            this.addressingModeUpdated = true;
        }
        else{
            this.addressingModeUpdated = false;
        }

        var refreshTileData = this.addressingModeUpdated || this.scrollingRegistersUpdated;

        let windowEnabled =this.lcdcFlag.isWindowEnabled();
        let backgroundEnabled = this.lcdcFlag.BgWinPriority();
        let setBgToWhite = false;
        if(this.cgbModeEnabled && refreshTileData){
            this.tileLoaderBank.pullTileData(this.lcdcFlag);
            this.tileLoaderBank.pullTileData(this.lcdcFlag);
        }
        else if(!this.cgbModeEnabled && refreshTileData){
            this.tileLoaderBank.pullTileData(this.lcdcFlag);
        }
        this.maps = this.getBgAndWindowTileMaps();

        var pixelIndexY = 0
        var topLeftX = 0;

        // if(!windowEnabled && !backgroundEnabled) return;
        if(backgroundEnabled){
            topLeftX = this.scrollX;
            pixelIndexY = (currentLY + this.scrollY) % 256;
        }
        else{
            setBgToWhite = true;
        }
                
        var pixelIndexYWin = 0;
        var topLeftXWin = 0;
        let tileIndexYWin = 0;
        let XIteratorWin = 0;        
        if(windowEnabled){
            topLeftXWin = this.ram.read(0xFF4B).value;
            var topLeftYWin = this.ram.read(0xFF4A).value;
            if(topLeftYWin > currentLY || 
                topLeftYWin > 143 || 
                topLeftXWin > 166 ||
                topLeftYWin < 0 ||
                topLeftXWin < 0 ){
                windowEnabled = false;
            }
            else{
                pixelIndexYWin = this.windowInternalLineCounter;
                tileIndexYWin = (Math.floor(pixelIndexYWin/8));
                XIteratorWin = (Math.floor(topLeftXWin/8));
            }
        }

        let attributeTile : Attribute;
        let XIterator = Math.floor(topLeftX/8);
        let tileIndexY = (Math.floor(pixelIndexY/8))

        //populate background IN PIXELS
        var tilesAdded = 0;
        var tilesAddedWin = 0;
        let tileIndexToFind = 0;

        while(tilesAdded < 20){
            this.lcdcFlag.update(this.ram.read(0xFF40).value);
            tileIndexToFind = (32 * tileIndexY) + XIterator;
            if(windowEnabled && XIterator >= XIteratorWin){
                var tile = this.maps.window.tiles.getTile(((32 * tileIndexYWin) + tilesAddedWin));
                this.windowWasVisibleThisFrame = true;
                tilesAddedWin++;
                XIteratorWin++;
                setBgToWhite = false;
            }else{
                //get tile from background instead
                var tile = this.maps.background.tiles.getTile(tileIndexToFind);
            }
            if(this.cgbModeEnabled){
                attributeTile = this.maps.background.tiles.getAttributes(tileIndexToFind);
                var tileArray = this.applyTileMapAttributes(tile, attributeTile);
                this.populateOutputLine(tileArray[pixelIndexY % 8],attributeTile.palette,false);
            }
            else{
                var tileArray = this.tileLoaderBank.getTile(tile,0).generateTile();
                if(setBgToWhite){
                    var tileArray = this.whiteTile;                    
                }
                this.populateOutputLine(tileArray[pixelIndexY % 8],0, false);   
                // this.populateOutputLine(tileArray[currentLY - (tileIndexY*8)],0, false);   
            }
            XIterator++;
            tilesAdded++;
            if(XIterator == 32){
                XIterator = 0;
            }
        }
    }

    BuildObjectByLine(){
        if(!this.lcdcFlag.isObjEnabled()) return;
        const imgDataIndexCurrent = this.imgDataIndex;
        var objsRenderedThisLine = 0;
        let objSize = this.lcdcFlag.getObjSize();
        this.tileLoaderBank.populateObjectData();
        
        this.ObjectAttributeMemory.forEach(obj => {
            if(obj.YPosition >= 16 && this.LY >= (obj.YPosition-16) && this.LY < obj.YPosition - (objSize == 8 ? 8 : 0)){
                var rowIndex = this.LY - (obj.YPosition - 16);
                if(objSize == 16){
                    var topTile = this.tileLoaderBank.getObjectTile(obj.TileIndex & 0xFE);
                    var bottomTile = this.tileLoaderBank.getObjectTile(obj.TileIndex | 0x01);
                    var usingTopTile = this.LY < (obj.YPosition - 8);
                    rowIndex -= usingTopTile ? 0 : 8;
                    var tileArray = this.runOamOperations8x16(topTile, bottomTile, obj.YFlip, obj.XFlip, usingTopTile);
                }
                else{
                    var tile = this.tileLoaderBank.getObjectTile(obj.TileIndex);
                    var tileArray = this.runOamOperations(tile, obj.YFlip, obj.XFlip);
                }
                this.imgDataIndex = 4 * ((160 * (this.LY)) + (obj.XPosition - 8));
                if(objsRenderedThisLine < 10){
                    this.populateOutputLineObject(tileArray[rowIndex], obj, true);
                    objsRenderedThisLine++;
                    if(rowIndex == 7){
                        this.totalObjectsCurrentlyRendered++;
                    }
                }
            }
        })
        this.imgDataIndex = imgDataIndexCurrent;
    }

    buildObjectAttributes(){
        this.ObjectAttributeMemory = new Array<ObjectAttribute>();
        let oamArrayIndex = 0;
        for(let i = 0xFE00; i < 0xFE9F; i+=4){
            var obj = new ObjectAttribute(
                this.ram.read(i).value,
                this.ram.read(i+1).value,
                this.ram.read(i+2).value,
                this.ram.read(i+3).value,this.cgbModeEnabled
            );
            if(obj.XPosition == 58 && obj.YPosition == 56){
                let z= 10;
            }
            if(this.ObjectAttributeMemory.find(z => z.XPosition == obj.XPosition && z.YPosition == obj.YPosition) == undefined){
                this.ObjectAttributeMemory[oamArrayIndex++] = obj;
            }

        }
    }

    basicRender(){
        if(this.canvasCtx !== null){
            var canvas = this.canvasCtx.canvas;
            this.canvasCtx?.clearRect(0,0,canvas.width,canvas.height);
            var z = new Uint8ClampedArray(this.imgDataOutput);
            let imgData : ImageData = new ImageData(z, 160);
            this.canvasCtx.putImageData(imgData,0,0);
        }
    }

    getBgAndWindowTileMaps() : {background : TileMapManager, window : TileMapManager}{
        var background;
        var window;
        let BGtilemap = this.lcdcFlag.getBgTileMapArea();
        let windowTileMap = this.lcdcFlag.getWindowTileMapArea();
        if(BGtilemap == 0x9C00){
            background = this.tileMap9C00;
        }
        else{
            background = this.tileMap9800;
        }

        if(windowTileMap == 0x9C00){
            window = this.tileMap9C00;
        }
        else{
            window = this.tileMap9800;
        }        
        return {background : background, window : window};
    }

    getImageData(){
        return this.imgDataOutput;
    }

    setTilesChanged(state : boolean) {
        this.tilesUpdated = state;
    }

    getCurrentBank() : number {
        return this.currentBankIndex;
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
    
    checkForStatMode2Interrupt() : boolean {
        let stat = this.ram.read(0xFF41).value;
        return (stat & 0x20) > 0
    }

    checkForStatMode0Interrupt() : boolean {
        let stat = this.ram.read(0xFF41).value;
        return (stat & 0x8) > 0
    }

    checkForStatMode1Interrupt() : boolean {
        let stat = this.ram.read(0xFF41).value;
        return (stat & 0x10) > 0
    }

    checkForStatModeLycInterrupt() : boolean {
        let stat = this.ram.read(0xFF41).value;
        return (stat & 0x40) > 0
    }

    setLycEqualsLyInStat(){
        let stat = this.ram.read(0xFF41).value;
        let mask = 1 << 2;
        stat ^= mask;
    }

    disableLycEqualsLyInStat(){
        let stat = this.ram.read(0xFF41).value;
        let mask = ~(1 << 2); //0b11111011
        stat &= mask;
        this.ram.write(0xFF41, stat);
    }

    enableLycEqualsLyInStat(){
        let stat = this.ram.read(0xFF41).value;
        let mask = ~(1 << 2); //0b11111011
        stat &= mask;
        this.ram.write(0xFF41, stat);
    }

    updateBackgroundPalette(value : number, index : number){
        var BCPS = index;
        var ppuMode = this.getPpuMode();
        if(ppuMode != 3){
            this.PaletteRam.BgPaletteRam[BCPS] = new Uint8(value);
        }
        var shouldIncrement = (BCPS & 0x0080) > 0;
        if(shouldIncrement){
            BCPS++;
            BCPS &= 0x00BF
        }
        this.ram.write(0xFF68, BCPS);
    }

    updateObjectPalette(value : number, index : number){
        var OCPS = index;
        var ppuMode = this.getPpuMode();
        if(ppuMode != 3){
            this.PaletteRam.ObjPaletteRam[OCPS] = new Uint8(value);
        }
        var shouldIncrement = (OCPS & 0x0080) > 0;
        if(shouldIncrement){
            OCPS++;
            OCPS &= 0x00BF
        }
        this.ram.write(0xFF6A, OCPS);
    }

    runOamOperations(tile : Tile, yFlip : boolean, xFlip : boolean) : Array<Array<number>>{
        var tileArray = tile.generateTile();
        if(yFlip){
            tileArray = tileArray.reverse();
        }

        if(xFlip){
            tileArray.forEach(arr => {
                arr = arr.reverse();
            });
        }

        return tileArray;
    }

    runOamOperations8x16(top : Tile,bottom : Tile, yFlip : boolean, xFlip : boolean, seekingTop : boolean) : Array<Array<number>>{
        var topArray = top.generateTile();
        var bottomArray = bottom.generateTile();
        if(yFlip){
            topArray = topArray.reverse();
            bottomArray = bottomArray.reverse();
            var tempArray = top.generateTile();
            topArray = bottomArray;
            bottomArray = tempArray;
        }
        var tileArray = seekingTop ? topArray : bottomArray;
        if(xFlip){
            tileArray.forEach(arr => {
                arr = arr.reverse();
            });
        }

        return tileArray;
    }    




    getRgbColor(index : number, palette : number, isObj : boolean) : Color
    {
        const colorIndex = (palette * 8) + (2 * index);
        if(!this.cgbModeEnabled){
            var mPalette = isObj ? this.ram.read(0xFF48 + palette).value : this.ram.read(0xFF47).value;
            this.nonCgbPalette = [
                mPalette & 0b11,
                (mPalette & 0b1100) >> 2,
                (mPalette & 0b110000) >> 4,
                (mPalette & 0b11000000) >> 6
            ]             
            var color = this.nonCgbPalette[index];
            if(isObj && color == 0){
                var transparentOutput = new Color;
                transparentOutput.alpha = 0;
                return transparentOutput;
            }
            var z : Color = new Color();
            var outputColor = 0;
            switch(color){
                case 0:
                    // outputColor = 255;
                    z.setColor(155,188,15);
                    break;
                case 1:
                    z.setColor(139,172,15)
                    // outputColor = 150;
                    break;
                case 2: 
                    z.setColor(48,98,48)
                    // outputColor = 60;
                    break;
                case 3:
                    z.setColor(15,56,15)
                    break;
            }
            // z.red = z.blue = z.green = outputColor;
            return z;
        }
        if(isObj){
            var colorLowerHalf = this.PaletteRam.ObjPaletteRam[colorIndex];
            var colorUpperHalf = this.PaletteRam.ObjPaletteRam[1 + colorIndex];
        }else{
            var colorLowerHalf = this.PaletteRam.BgPaletteRam[colorIndex];
            var colorUpperHalf = this.PaletteRam.BgPaletteRam[1 + colorIndex];
        }


        var red555 = colorLowerHalf.value & 0b11111;
        var green555 = ((colorLowerHalf.value >> 5)) | ((0b11 & (colorUpperHalf.value) << 3));
        var blue555 =  (colorUpperHalf.value >> 2)
        var rgbMapper = (x : number) => {return 0xFF & ((x >> 2) | (x << 3))};
        var c = new Color();
        c.setColor(rgbMapper(red555), rgbMapper(green555), rgbMapper(blue555))
        return c;
    }
    
    populateOutputArrayColor(tile: number[][], XPosition : number, YPosition : number, palette : number, isObj : boolean = true){
        var flatMarker = 0;     
        for (let i = 0; i < tile.length; i++) {
            flatMarker = 0;     
            var YPositionOffset = ((i + YPosition) * 4 * this.CANVAS_WIDTH);
            for (let j = 0; j < tile[i].length; j++) {
                var color = this.getRgbColor(tile[i][j], palette, isObj);
                if(color.blue != 255){
                    var z= '';
                }
                this.imgDataOutput[YPositionOffset + (XPosition) + flatMarker] = color.red;
                this.imgDataOutput[YPositionOffset + (XPosition)+1+ flatMarker] = color.green;
                this.imgDataOutput[YPositionOffset + (XPosition)+2+ flatMarker] = color.blue;
                this.imgDataOutput[YPositionOffset + (XPosition)+3+ flatMarker] = 255;
                flatMarker += 4;
            }           
        }        
    }
    
    populateOutputLine(tile: number[],  palette : number, isObj : boolean = true){
        for (let j = 0; j < tile.length; j++) {
            var color = this.getRgbColor(tile[j], palette, isObj);
            this.pixelBuffer[this.LY][this.generatedLineIndex++] = tile[j];
            this.imgDataOutput[this.imgDataIndex++] = color.red;
            this.imgDataOutput[this.imgDataIndex++] = color.green;
            this.imgDataOutput[this.imgDataIndex++] = color.blue;
            this.imgDataOutput[this.imgDataIndex++] = color.alpha;            
        }           
    }    

    populateOutputLineObject(tile: number[], object : ObjectAttribute, isObj : boolean = true){
        for (let j = 0; j < tile.length; j++) {
            var color = this.getRgbColor(tile[j], object.Palette, isObj);
            var pixelDrawsOverBgWin = (object.Priority && this.pixelBuffer[this.LY][object.XPosition + j - 8] == 0)
            var rgbaWriter = () => {
                this.imgDataOutput[this.imgDataIndex++] = color.red;
                this.imgDataOutput[this.imgDataIndex++] = color.green;
                this.imgDataOutput[this.imgDataIndex++] = color.blue;
                this.imgDataOutput[this.imgDataIndex++] = 255;                
            }

            if(!object.Priority){
                if(color.alpha > 0) rgbaWriter();
                else this.imgDataIndex+=4;
            }
            else{
                if(pixelDrawsOverBgWin && color.alpha != 0) rgbaWriter();
                else this.imgDataIndex+=4;
            }
        }           
    }      

    initListeners(){
        this.worker.addEventListener("message", (message) => {
            var payload = message.data;
            if(payload.action == "updateBackgroundPalette"){
                this.updateBackgroundPalette(payload.value, payload.index);
            }

            if(payload.action == "updateObjectPalette"){
                // this.updateObjectPalette(payload.value, payload.index);
            }

            if(payload.action == "changeBanks"){
                this.currentBankIndex = payload.newBank;
            }

            if(payload.action == "DMA_TRANSFER"){
                var currentBank = this.getCurrentBank();
                for(let i = 0; i < payload.data.length; i++){
                    if(currentBank == 0){
                    }
                    else{
                    }
                }
            }   
        })
    } 


    async renderFailed(){
        // this version SUCKS
        if(!this.ram.ramLoaded) {
            window.requestAnimationFrame(() => {this.renderFailed();});
        } 
        this.imgDataOutput.fill(0);
        var currentLine = this.getLY();
        var output = new Array<Array<number>>(160);
        output.fill(new Array<number>(144));
        // this.vramBank = new vramBank(this.ram.readBlock(0x8000, 0x9FFF), this.getCurrentBank());
        this.lcdcFlag.update(this.ram.read(0xFF40).value);
        let testTile = new Uint8Array([0x3C, 0x7E, 0xFF, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7E, 0x5E, 0x7E, 0x0A, 0x7C, 0x56, 0x38, 0x7C]);
        // this.ram.writeBlock(0x8000, 0x800F, testTile);
        for(let i = 0; i < 16; i+=2){
            // this.PaletteRam.ObjPaletteRam[i] = new Uint8(0xF0);
            // this.PaletteRam.ObjPaletteRam[i+1] = new Uint8(0x7C);
            // this.PaletteRam.BgPaletteRam[i] = new Uint8(0xF0);
            // this.PaletteRam.BgPaletteRam[i+1] = new Uint8(0x7C);
        };
        // this.ram.write(this.oamBaseAddress, 0x30);
        // this.ram.write(this.oamBaseAddress+1, 0x30);
        // this.ram.write(this.oamBaseAddress+2, 0x00);
        // this.ram.write(this.oamBaseAddress+3, 0x00);
        var screen = new Array<{background : Uint8Array, attributes : Array<{attribute : Attribute, color : Color }>}>(144);
        screen.fill({background : new Uint8Array(160), attributes: new Array<{attribute : Attribute, color : Color}>(160)});
        screen.forEach(f => f.attributes = new Array<{attribute : Attribute, color : Color}>(160));
        // this.buildBackgroundAndWindow(screen);
        if(currentLine >= 0 && currentLine <= 159){
            this.setPpuMode(2);
            var objsAdded = 0;
            //can render
            // this.tileLoaderBank.pullTileData(new LCDController(this.ram.read(0xFF40).value));
            for (let yIndex = 0; yIndex < 40; yIndex+=4) {
                let oamYByte = this.ram.read(this.oamBaseAddress + yIndex);
                let oamXByte = this.ram.read(this.oamBaseAddress + yIndex + 1);
                if(oamYByte.value == 0 || oamXByte.value == 0){
                    continue;
                }
                let oamTileIndex = this.ram.read(this.oamBaseAddress + yIndex + 2);
                let oamAttributes = this.ram.read(this.oamBaseAddress + yIndex + 3);
                // console.log(`${oamXByte.value},${oamYByte.value},${oamTileIndex.value},${oamAttributes.value}`);
                if(objsAdded < 10){
                // if(currentLine >= yIndex && currentLine <= yIndex+4){
                    // var hashToTest = Bun.hash(
                    //     `${oamYByte.value.toString()}-${oamXByte.value.toString()}-${oamTileIndex.value.toString()}-${oamAttributes.value.toString()}`
                    // );
                    var encoder = new TextEncoder();
                    var data = encoder.encode(`${oamYByte.value.toString()}-${oamXByte.value.toString()}-${oamTileIndex.value.toString()}-${oamAttributes.value.toString()}`)
                    var hashToTest = new Uint8Array(await window.crypto.subtle.digest("SHA-1", data)).toHex();
      
                    if(this.ObjectAttributeMemory.length < 40
                        && !this.ObjectAttributeMemory.some(z => z.objHash == hashToTest)
                    ){
                        this.ObjectAttributeMemory.push(new ObjectAttribute
                            (oamYByte.value, oamXByte.value, oamTileIndex.value, oamAttributes.value, this.cgbModeEnabled)
                        );    
                        objsAdded++;
                    }
                    // }
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
        // this.imgDataOutput = new Uint8Array(160 * 144 * 4);
        // screen.forEach(row => {
        //     row.background.forEach(c => {
        //         // output[rowCount][colCount] = 
        //         // row.attributes[rowCount].attribute.palette;
        //         try {
        //             if(row.attributes[rowCount].attribute == undefined){}
        //         } catch (error) {
        //             console.log("error hit")
        //         }

        //         var color = row.attributes[rowCount].color;
        //         // this.imgDataOutput[flatMarker++] = color.red;
        //         // this.imgDataOutput[flatMarker++] = color.green;
        //         // this.imgDataOutput[flatMarker++] = color.blue;
        //         // this.imgDataOutput[flatMarker++] = 255; //alpha value, should eventually be set by the priority levels
        //         colCount++; 
        //     });
        //     rowCount++;
        //     colCount=0;
        // });

        //mode 3 - push lines to window/view
        this.ObjectAttributeMemory.forEach(obj => {
            var targetBank = obj.FetchFromBank1 ? 1 : 0;
            var tile = this.tileLoaderBank.getTile(obj.TileIndex, targetBank);
            var outputTile = this.runOamOperations(tile, obj.YFlip, obj.XFlip);
            for (let i = 0; i < outputTile.length; i++) {
                flatMarker = 0;     
                var YPositionOffset = ((i + obj.YPosition) * 4 * this.CANVAS_WIDTH);
                for (let j = 0; j < outputTile[i].length; j++) {
                    var color = this.getRgbColor(outputTile[i][j], obj.Palette, true);
                    // output[i + obj.YPosition][j + obj.XPosition] = outputTile[i][j];
                    this.imgDataOutput[YPositionOffset + (j+obj.XPosition) + flatMarker] = color.red;
                    this.imgDataOutput[YPositionOffset + (j+obj.XPosition)+1+ flatMarker] = color.green;
                    this.imgDataOutput[YPositionOffset + (j+obj.XPosition)+2+ flatMarker] = color.blue;
                    this.imgDataOutput[YPositionOffset + (j+obj.XPosition)+3+ flatMarker] = 255;
                    flatMarker += 3;
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
            let imgData : ImageData = new ImageData(z, 160);
            canvas.putImageData(imgData,0,0);
        }
        window.requestAnimationFrame(() => {this.renderFailed();})
    }
    
    intervalRender(){
        window.setInterval(() => {
            if(this.ram.read(0xFF4F).value != this.currentBankIndex){
                // this.changeBanks(this.ram.read(0xFF4F).value);
            }
            if(this.LY == this.LycValue){
                this.LycEqualsLySTAT = true;
            }
            if(this.LY < 144){
                this.buildBackgroundAndWindowByLine(this.LY);
                window.requestAnimationFrame(() => {this.basicRender();})

                // if(this.totalObjectsCurrentlyRendered <= 40) this.BuildObjectByLine();
            }
            else if(this.LY == 145){
                // window.requestAnimationFrame(() => {this.basicRender();})
            }
            
            if(this.LY == 153){
                this.LY = 0;
                this.imgDataIndex = 0;
                this.rowTracker = 0;
                this.totalObjectsCurrentlyRendered =0;
                this.buildObjectAttributes();                
                this.ram.write(0xFF44, this.LY);
            }else{
                this.ram.write(0xFF44, this.LY);
                this.LY++;
                // this.worker.postMessage({
                //     "action" : "LY_UPDATE",
                //     "value" : this.LY
                // })
            }
        }, 0.11);
    }

    screenRender(){
        this.LY = 0;
        this.ram.write(0xFF44, this.LY);

        while(this.LY <= 153){
            if(this.ram.read(0xFF4F).value != this.currentBankIndex){
                // this.changeBanks(this.ram.read(0xFF4F).value);
            }
            if(this.LY == this.LycValue){
                this.LycEqualsLySTAT = true;
            }
            if(this.LY < 144){
                this.buildBackgroundAndWindowByLine(this.LY);

                // if(this.totalObjectsCurrentlyRendered <= 40) this.BuildObjectByLine();
            }
            this.LY++;
            this.ram.write(0xFF44, this.LY);
        }
        window.requestAnimationFrame(() => {this.basicRender();})
        this.imgDataIndex = 0;
        this.rowTracker = 0;
        this.totalObjectsCurrentlyRendered =0;
        this.buildObjectAttributes();                
        this.ram.write(0xFF44, this.LY);
    }

    lineRender(){
        if(this.checkForStatMode2Interrupt()){
            this.interruptHandler.requestInterrupt(INTERRUPT_SOURCES.INTERRUPT_LCD_STAT);
        }
        this.updatePpuMode(3);
        this.disableLycEqualsLyInStat();
        this.lcdcFlag.update(this.ram.read(0xFF40).value);
        this.windowWasVisibleThisFrame = false;
        if(!this.lcdcFlag.isLcdPpuEnabled()) return;
        this.generatedLineIndex = 0;
        if(this.LY <= 153){
            if(this.ram.read(0xFF4F).value != this.currentBankIndex){
                // this.changeBanks(this.ram.read(0xFF4F).value);
            }
            if(this.LY < 144){
                this.buildObjectAttributes();                
                this.buildBackgroundAndWindowByLine(this.LY);
                if(this.totalObjectsCurrentlyRendered <= 40) this.BuildObjectByLine();
            }
            else if(this.LY == 144){
                if(this.checkForStatMode1Interrupt()){
                    this.interruptHandler.requestInterrupt(INTERRUPT_SOURCES.INTERRUPT_LCD_STAT);
                }                
            }
            if(this.windowWasVisibleThisFrame){
                this.windowInternalLineCounter++;
            }
            if(this.checkForStatMode0Interrupt()){
                this.interruptHandler.requestInterrupt(INTERRUPT_SOURCES.INTERRUPT_LCD_STAT);
            }       
            this.LY++;
            this.ram.write(0xFF44, this.LY);            
        }
        else{
            this.LY = 0;
            this.imgDataIndex = 0;
            this.rowTracker = 0;
            this.totalObjectsCurrentlyRendered =0;
            this.ram.write(0xFF44, this.LY);
            this.windowInternalLineCounter = 0;
        }
        if(this.LY >= 144){
            this.interruptHandler.requestInterrupt(INTERRUPT_SOURCES.INTERRUPT_VBLANK);
        }

        if(this.LY < 144){
            this.ram.runDmaHblankTranfer();
        }

        if(this.LY == this.ram.read(0xFF45).value){
            this.enableLycEqualsLyInStat();
            if(this.checkForStatModeLycInterrupt()){
                this.interruptHandler.requestInterrupt(INTERRUPT_SOURCES.INTERRUPT_LCD_STAT);
            }                
        }       
        this.updatePpuMode(0);
    }

    updatePpuMode(mode : number){
        if(this.LY >= 144){
            mode = 1;
        }
        var currentFlag = this.ram.read(0xFF41).value;
        this.lcdcFlag.update(currentFlag); 
        if(mode < 0 && mode > 3 ) return;

        currentFlag &= 0xFC;
        currentFlag |= mode;
        this.lcdcFlag.update(currentFlag)
        this.ram.write(0xFF41, this.lcdcFlag.value);
    }
}
class Color{
    red : number = 0
    green : number = 0
    blue : number = 0
    alpha : number = 255
    
    setColor(r : number, g : number, b : number){
        this.red = r;
        this.green = g;
        this.blue= b;
    }
}