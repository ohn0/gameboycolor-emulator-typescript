// import * as path from 'path';
// import { fileURLToPath } from 'url';

import { file } from "bun";
import { Uint8 } from "../primitives/uint8";

// import { dirname } from 'path';
export class RomLoader{
    static async load(fileName: string, isStandAlone = false): Promise<Uint8Array> {
        let rom: Buffer;
        let fablob : Uint8Array | undefined = new Uint8Array();
        let RAM: Uint8Array;// = new Uint8Array(0x8000);
        if (isStandAlone) {
            // rom = Buffer.from(await Bun.file(path.resolve(dirname(fileURLToPath(import.meta.url)), '..', fileName)).arrayBuffer());
            var romArray = new Uint8Array();
            console.log(romArray);
            var f = new File([romArray], "http://localhost:3000//resources//"+fileName);
            var reader = new FileReader();
            reader.readAsArrayBuffer(f);
            console.log("AAAA" + f.arrayBuffer);
            // rom = fs.readFileSync(path.resolve(dirname(fileURLToPath(import.meta.url)), '..', fileName));
        }
        else {
            var z = await fetch(`/getRom/${fileName}`);
            RAM = await z.bytes();
            return RAM;
            // let idx = 0;
            // for(const b of zbytes){
            //     RAM[idx++] = b;
            // }
        }
        return new Uint8Array();
    }

}
