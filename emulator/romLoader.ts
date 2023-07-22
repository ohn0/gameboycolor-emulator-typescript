import * as fs from 'fs';
import path from 'path';

export class RomLoader{
    static load(fileName: string): Uint8Array {
        const z = path.resolve(__dirname, fileName);
        console.log(`${__dirname} + ${fileName}, ${z}`)
        const rom = fs.readFileSync(path.resolve(__dirname, '/../', fileName));
        const RAM: Uint8Array = new Uint8Array(rom.length);
        let idx = 0;
        for (const b of rom) {
            RAM[idx++] = b;
        }

        return RAM;
    }

}