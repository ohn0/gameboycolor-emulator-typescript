import * as fs from 'fs';
import { Buffer } from 'node:buffer';

export class binaryReader{
    private _binary!: Buffer;
    private _path!: string;
    
    public get binary(): Buffer {
        return this._binary;
    }
    public set binary(value: Buffer) {
        this._binary = value;
    }

    public get path(): string {
        return this._path;
    }
    public set path(value: string) {
        this._path = value;
    }

    constructor(path: string) {
        if (path !== "") {
            this.loadBinarySync(path);
        }
    }

    loadBinary(path: string) : Promise<Buffer> {
        this.path = path;
        return new Promise<Buffer>(function (resolve, reject) {
            fs.readFile(path, (err, data) => {
                if (err) reject(err)
                else resolve(data);
            });

            // readFile(path, (err, data) => {
            //     if (err) reject(err)
            //     else resolve(data);
            // }); 
        })
    }

    loadBinarySync(path: string): Buffer {
        this.path = path;
        this.binary = fs.readFileSync(path);
        return this.binary;
    }

    read(offset = 0): number {
        return this.binary.readUInt8(offset);
    }
}

