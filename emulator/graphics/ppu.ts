import { Logger } from "../../logger/logger";
import { RAM } from "../RAM/RAM";
import { Tile } from "./tile";
import { TileLoader } from "./tileLoader";
import { LCDController } from "./LCDcontroller";
import { TileMapManager } from "./tileMapManager";
import { Palette } from "./Pallete";
import { ObjectAttribute } from "./ObjectAttribute";
import { Uint8 } from "../../primitives/uint8";
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
    imgDataOutput! : Uint8Array;


    LYCintSelectSTAT : number = 0;
    Mode2IntSelectSTAT : number = 0;
    Mode1IntSelectSTAT : number = 0;
    Mode0IntSelectSTAT : number = 0;
    LycEqualsLySTAT : boolean = false;
    LycValue : number  = 0;
    PPUmodeSTAT : number = 0;
    objsToDraw : Array<Array<Array<number>>> = [];
    vramBank! : vramBank;
    readonly oamBaseAddress = 0xFE00; 
    worker : Worker;
    LY : number = 0;
    imgDataIndex : number = 0;
    currentTileMapYIndex : number = 0;
    rowTracker : number = 0;
    currentBankIndex : number = 0;
    cgbModeEnabled : boolean = false;
    previousYStart : number = 0;
    
    statInterruptRequested : boolean = false;
    readonly CANVAS_WIDTH = 160;
    readonly CANVAS_HEIGHT = 144;

    constructor(worker : Worker,ram : RAM, logger: Logger){
        this.worker = worker;
        this.tilesUpdated = false;
        this.worker.addEventListener("message", (message) => {
            if(message.data.action == "CPU_STARTED"){
                console.log("CPU_STARTED")
                this.ram = new RamProxy(this.worker, ram);
                this.ram.sharedArray = new Uint8Array(message.data.ram);
                this.initListeners();
                this.init();
            }
        });
    }

    init(){
        this.lcdcFlag = new LCDController(this.ram.read(0xFF40).value);
        this.currentBankIndex = this.ram.read(0xFF4F).value;
        this.cgbModeEnabled = this.ram.read(143).value == 0x80 || this.ram.read(143).value == 0xC0;
        this.vramBank = new vramBank(this.ram.readBlock(0x8000, 0x9FFF), this.cgbModeEnabled, this.ram);
        this.tileLoaderBank =  new TileLoader(this.vramBank);
        let vramBankRegister : number = this.ram.read(0xFF4F).value;
        this.tileMap9800 = new TileMapManager(0x9800,0x9800, 0, this.vramBank, this.cgbModeEnabled);
        this.tileMap9C00 = new TileMapManager(0x9C00,0x9C00, 0, this.vramBank, this.cgbModeEnabled);

        this.BCPS = this.ram.read(0xFF68).value;
        this.BCPD = this.ram.read(this.BCPS).value;
        this.getViewPortBoundary(this.ram.read(0xFF42).value, this.ram.read(0xFF43).value);
        this.PaletteRam = new Palette();
        this.ObjectAttributeMemory = new Array();
        this.imgDataOutput =  new Uint8Array(160 * 144 * 4);    
        this.imgDataIndex = 0;    
        for(let i = 0; i < this.PaletteRam.ObjPaletteRam.length; i+=2){
            this.PaletteRam.ObjPaletteRam[i] = new Uint8(0x7F);
            this.PaletteRam.ObjPaletteRam[i+1] = new Uint8(0xFF);

            this.PaletteRam.BgPaletteRam[i] = new Uint8(0x7F);
            this.PaletteRam.BgPaletteRam[i+1] = new Uint8(0xFF);
        }
        window.setInterval(() => {
            if(this.ram.read(0xFF4F).value != this.currentBankIndex){
                this.changeBanks(this.ram.read(0xFF4F).value);
            }
            if(this.LY == this.LycValue){
                this.LycEqualsLySTAT = true;
            }
            if(this.LY < 144){
                this.buildBackgroundByLine(this.LY);
            }
            else if(this.LY == 145){
                window.requestAnimationFrame(() => {this.basicRender();})
            }
            
            if(this.LY == 153){
                this.LY = 0;
                this.imgDataIndex = 0;
                this.rowTracker = 0;
                this.ram.write(0xFF44, this.LY);
            }else{
                this.LY++;
                this.ram.write(0xFF44, this.LY);
            }
        }, 0.11);
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

    buildBackgroundByLine(currentLY: number){
        this.rowTracker = currentLY;
        this.lcdcFlag.update(this.ram.read(0xFF40).value);
        if(this.cgbModeEnabled){
            this.tileLoaderBank.pullTileData(this.lcdcFlag, 0, this.vramBank);
            this.tileLoaderBank.pullTileData(this.lcdcFlag, 1, this.vramBank);
        }
        else{
            this.tileLoaderBank.pullTileData(this.lcdcFlag, 0, this.vramBank);
        }
        this.tileMap9800.tiles.update(this.vramBank, this.ram.read(0xFF4F).value);
        this.tileMap9C00.tiles.update(this.vramBank, this.ram.read(0xFF4F).value);
        let background = this.tileMap9800;
        let BGtilemap = this.lcdcFlag.getBgTileMapArea();
        let topLeftX = this.ram.read(0xFF43).value;
        let topLeftY = (this.rowTracker + this.ram.read(0xFF42).value) % 256;
        let attributeTile : Attribute;
        if(BGtilemap == 0x9C00){
            background = this.tileMap9C00;
        }
        // background.tiles.tileMap.fill(0);
        // background.tiles.attributeMap.fill(0);
        // topLeftX = 0;
        // topLeftY = 0;

        let XIterator = Math.floor(topLeftX/8);
        let baseY = (Math.floor(topLeftY/8))
        let YIterator = baseY
        this.currentTileMapYIndex++;
        if(this.currentTileMapYIndex == 18){
            this.currentTileMapYIndex = 0;
        }
        // YIterator = YIterator % 32;
        //populate background IN PIXELS
        var tilesAdded = 0;
        // console.log("--------------")
        // console.log(`X : ${topLeftX}, Y: ${topLeftY} XIterator ${XIterator} YIterator ${YIterator} currentLY :${currentLY} baseY : ${baseY}`)
        // console.log(this.rowTracker + ' ' + currentLY);
        while(tilesAdded < 20){
            // console.log(`YIterator : ${YIterator}, XIterator: ${XIterator}, currentRow : ${currentLY % 8}`)
            var tileToAdd = background.tiles.getTile((32 * baseY) + XIterator);

            // console.log(attributeTile)
            // var tile = this.tileLoaderBank.getTile(tileToAdd, this.getCurrentBank());
            // var tileArray = this.runOamOperations(tile,attributeTile.yflip == 1, attributeTile.xflip == 1);
            if(tileToAdd == 0){
                // console.log("???")
            }
            if(this.cgbModeEnabled){
                attributeTile = background.tiles.getAttributes((32 * YIterator) + XIterator);
                var tileArray = this.applyTileMapAttributes(tileToAdd, attributeTile);
                this.populateOutputLine(tileArray[currentLY % 8], 
                    (8 * (tilesAdded)), 640 * 8 * currentLY, attributeTile.palette, false);                
            }
            else{
                var tileArray = this.tileLoaderBank.getTile(tileToAdd,0).generateTile();
                this.populateOutputLine(tileArray[currentLY % 8],   
                    (8 * (tilesAdded)), 640 * 8 * currentLY, 0, false);                
            }
            // console.log(tileArray + '' + tileToAdd);
            // this.populateOutputLine(tileArray[currentLY % 8], 
            //      (8 * (tilesAdded+topLeftX)), 640 * 8 * currentLY, attributeTile.palette, false);
            XIterator++;
            tilesAdded++;
            if(XIterator == 32){
                XIterator = 0;
            }
        }

    }

    basicRender(){
        var canvasContext = (<HTMLCanvasElement> document.getElementById("canvasScreen")).getContext("2d");
        if(canvasContext !== null){
            var canvas = canvasContext.canvas;
            canvasContext?.clearRect(0,0,canvas.width,canvas.height);
            var z = new Uint8ClampedArray(this.imgDataOutput);
            let imgData : ImageData = new ImageData(z, 160);
            canvasContext.putImageData(imgData,0,0);
        }
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

    readVram(index : number) : number{
        return this.vramBank.read(this.ram.read(0xFF4F).value, index);
    }

    changeBanks(newBank : number){
        this.vramBank.copyBankToRam(newBank, 
            (bank : Array<number>) => {
                this.ram.writeBlock(0, bank.length, new Uint8Array(bank))
            }
        );
    }

    getPriority(){
        
    }

    updateVramBank(value : number, index : number)
    {
        this.vramBank.write(this.ram.read(0xFF4F).value, index, value);
    }

    getRgbColor(index : number, palette : number, isObj : boolean) : Color
    {
        const colorIndex = (palette * 8) + (2 * index);
        if(!this.cgbModeEnabled){
            var mPalette = this.ram.read(0xFF47).value;
            var mArray = [
                mPalette & 0b11,
                (mPalette & 0b1100) >> 2,
                (mPalette & 0b110000) >> 4,
                (mPalette & 0b11000000) >> 6
            ]
            var color = mArray[index];
            if(color == 0){
                return {
                    red : 255, blue : 255, green : 255
                }
            }

            if(color == 1){
                return {
                    red : 150, blue : 150, green : 150
                }
            }

            if(color == 2){
                return {
                    red : 60, blue : 60, green : 60
                }
            }            

            if(color == 3){
                return {
                    red : 0, blue : 0, green : 0
                }
            }
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
        return {
            red : rgbMapper(red555),
            green : rgbMapper(green555),
            blue: rgbMapper(blue555)
        }
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
    
    populateOutputLine(tile: number[], XPosition : number, YPosition : number, palette : number, isObj : boolean = true){
        for (let j = 0; j < tile.length; j++) {
            var color = this.getRgbColor(tile[j], palette, isObj);
            this.imgDataOutput[this.imgDataIndex++] = color.red;
            this.imgDataOutput[this.imgDataIndex++] = color.green;
            this.imgDataOutput[this.imgDataIndex++] = color.blue;
            this.imgDataOutput[this.imgDataIndex++] = 255;
            // console.log(`${YPosition + (XPosition) + flatMarker} - ${YPosition + (XPosition) + flatMarker+1} - ${YPosition + (XPosition) + flatMarker+2} - ${YPosition + (XPosition) + 3+flatMarker}`)
        }           
    }    

    initListeners(){
        this.worker.addEventListener("message", (message) => {
            var payload = message.data;
            if(payload.action == "updateBackgroundPalette"){
                this.updateBackgroundPalette(payload.value, payload.index);
            }

            if(payload.action == "updateObjectPalette"){
                this.updateObjectPalette(payload.value, payload.index);
            }

            if(payload.action == "changeBanks"){
                this.changeBanks(payload.newBank);
                this.currentBankIndex = payload.newBank;
            }

            if(payload.action == "DMA_TRANSFER"){
                var currentBank = this.getCurrentBank();
                for(let i = 0; i < payload.data.length; i++){
                    if(currentBank == 0){
                        this.vramBank.write(0,payload.destination+i,payload.data[i])
                    }
                    else{
                        this.vramBank.write(1,payload.destination+i,payload.data[i])
                    }
                }
            }   
        })
    } 


    async renderFailed(){
        if(!this.ram.ramLoaded) {
            window.requestAnimationFrame(() => {this.renderFailed();});
        } 
        this.imgDataOutput.fill(0);
        var currentLine = this.getLY();
        var output = new Array<Array<number>>(160);
        output.fill(new Array<number>(144));
        // this.vramBank = new vramBank(this.ram.readBlock(0x8000, 0x9FFF), this.getCurrentBank());
        this.lcdcFlag.update(this.ram.read(0xFF40).value);
        this.tileLoaderBank.pullTileData(this.lcdcFlag, this.getCurrentBank(), this.vramBank);
        let testTile = new Uint8Array([0x3C, 0x7E, 0xFF, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7E, 0x5E, 0x7E, 0x0A, 0x7C, 0x56, 0x38, 0x7C]);
        // this.ram.writeBlock(0x8000, 0x800F, testTile);
        for(let i = 0; i < 16; i+=2){
            // this.vramBank.write(0, i, testTile[i])
            // this.vramBank.write(0, i+1, testTile[i+1])
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
                            (oamYByte.value, oamXByte.value, oamTileIndex.value, oamAttributes.value)
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
}
class Color{
    red : number = 0
    green : number = 0
    blue : number = 0
}