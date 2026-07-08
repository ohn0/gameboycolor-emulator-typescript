import { vramBank } from "./vramBank";

export class Tile {
    data : Uint8Array;
    startIndex : number;
    constructor(){
        this.data = new Uint8Array(16);
        this.startIndex = 0;
    }

    public populate(vram : vramBank, currentBank : number){
        let index = this.startIndex;
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = vram.read(currentBank, index++);
        }
    }

    public generateTile() : Array<Array<number>>{
        //the returned result is a set of indices into OCPS FF6A
        var result = new Array<Array<number>>
        let ri = 0;
        for (let i = 0; i < this.data.length; i+=2) {
            let di = this.data[i], dj = this.data[i+1];
            result[ri] = new Array<number>();
            for(let rj = 0; rj < 8; rj++){
                let marker = 8 - rj-1;
                let dix = 1 & (di >> marker);
                let diy = 1 & (dj >> marker);
                diy <<= 1;
                result[ri][rj] = diy | dix; 
            }
            ri++;
        }
        return result;
    }

    public clearTile()
    {
        this.data.fill(0);
    }
}   

//3C 7E
//[0x3C ,0x7E ,0x42 ,0x42 ,0x42 ,0x42 ,0x42 ,0x42 ,0x7E ,0x5E ,0x7E ,0x0A ,0x7C ,0x56 ,0x38 ,0x7C]
// var t = new Tile();
// t.startIndex = 0x0;
// var zs = [0x3C ,0x7E ,0x42 ,0x42 ,0x42 ,0x42 ,0x42 ,0x42 ,0x7E ,0x5E ,0x7E ,0x0A ,0x7C ,0x56 ,0x38 ,0x7C];
// var mbc= new MBC0();
// mbc.configure(new Uint8Array(zs), new Logger());
// var r = new RAM(mbc, new Logger());
// r.ram = new Uint8Array(zs);
// t.populate(r);
// var z = t.generateTile();
// z.forEach(zi => console.log(zi));
// z.forEach(zi => {
//     var output = ''
//     zi.forEach(zj => {
//         output += `${zj.toString(2).padStart(2, '0')} `
//     })
//     console.log(output);
// });
// palette: 4 colors = 8 bytes
// color:   2 bytes