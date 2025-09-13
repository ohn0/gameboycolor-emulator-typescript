import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
export class RomLoader{
    static load(fileName: string, isStandAlone = false): Uint8Array {
        let rom: Buffer;
        if (isStandAlone) {
            rom = fs.readFileSync(path.resolve(dirname(fileURLToPath(import.meta.url)), '..', fileName));
        }
        else {
            rom = fs.readFileSync(path.resolve(__dirname,'..', fileName));            
        }
        const RAM: Uint8Array = new Uint8Array(rom.length);
        let idx = 0;
        for (const b of rom) {
            RAM[idx++] = b;
        }

        return RAM;
    }

}