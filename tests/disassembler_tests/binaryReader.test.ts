import {binaryReader} from '../../disassembler/binaryReader'
import { describe, expect, test } from '@jest/globals'
import * as path from 'path';

describe('disassembler testing',() => {
    test('binary file is loaded into reader', () => {
        const a = new binaryReader("");
        a.loadBinary(path.resolve(__dirname,'..\\..', 'cgb__.bin'));
        expect(a.binary).not.toBeNull();
    });

    test('binary file not loaded throws error', async () => {
        const a = new binaryReader("");
        await expect(
            a.loadBinary('non/existant/path/lol.bin')).rejects.toThrow();
    });

    test('binary file successfully loaded and value is read', async () => {
        const a = new binaryReader(path.resolve(__dirname,'..\\..', 'cgb__.bin'));
        let z = a.read();
        expect(z).toBe(0x31);
        z = a.read(1);
        expect(z).toBe(0xFE);
    })

    test('read throws Out Of Range error when offset passes size of buffer', async () => {
        expect(() => {
            const a = new binaryReader(path.resolve(__dirname,'..\\..', 'cgb__.bin'));
            const z = a.read(-1);
        }).toThrow();
    })

});