import { Uint8 } from "../../primitives/uint8";

export class ObjectAttribute {
    YPosition : number;
    XPosition : number;
    TileIndex : number;
    Attributes: number;
    objHash : number | bigint | string = '';

    Priority : boolean = false;
    YFlip : boolean = false;
    XFlip : boolean = false;
    FetchFromBank1 : boolean = false;
    Palette : number = -1;

    constructor(
        YPosition : number,
        XPosition : number,
        TileIndex : number,
        Attributes: number,
    ){
        this.YPosition = YPosition;
        this.XPosition = XPosition;
        this.TileIndex = TileIndex;
        this.Attributes = Attributes;
        this.generateHash().then(c => this.objHash = new Uint8Array(c).toHex());
        this.expandAttributeByte();
    }

    private  generateHash() : Promise<ArrayBuffer> {
        var encoder = new TextEncoder();
        var data = encoder.encode(`${this.YPosition.toString()}-${this.XPosition.toString()}-${this.TileIndex.toString()}-${this.Attributes.toString()}`);
        // var hash = await window.crypto.subtle.digest("SHA-1", data);
        // window.crypto.subtle.digest("SHA-1", data).then(c => {
        //     var hexString = new Uint8Array(c).toHex();
        //     return hexString;
        // });
        return window.crypto.subtle.digest("SHA-1", data);
    }

    private expandAttributeByte(){
        this.Priority = (this.Attributes & 0x80) > 0;
        this.YFlip = (this.Attributes & 0x40) > 0;
        this.XFlip = (this.Attributes & 0x20) > 0;
        this.FetchFromBank1 = (this.Attributes & 0x8) > 0;
        this.Palette = (this.Attributes & 0x7)
    }
}