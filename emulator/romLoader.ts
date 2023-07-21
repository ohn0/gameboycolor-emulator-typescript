import * as fs from 'fs'

export class RomLoader{
    static load(fileName : string, RAM : Uint8Array): Uint8Array {
        const rom = fs.readFileSync(fileName);
        let idx = 0;
        for (const b of rom) {
            RAM[idx++] = b;
        }

        return RAM;
    }
}