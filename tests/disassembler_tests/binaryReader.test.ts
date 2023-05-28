import {binaryReader} from '../../disassembler/binaryReader'
import { describe, expect, test } from '@jest/globals'

describe('disassembler testing',() => {
    test('binary file is loaded into reader', () => {
        let a = new binaryReader("");
        a.loadBinary('C:/Users/neel/projects/GBC_EMULATOR/cgb_boot.bin');
        expect(a.binary).not.toBeNull();
    });

    test('binary file not loaded throws error', async () => {
        let a = new binaryReader("");
        await expect(
            a.loadBinary('non/existant/path/lol.bin')).rejects.toThrow();
    });

    test('binary file successfully loaded and value is read', async () => {
        let a = new binaryReader('C:/Users/neel/projects/GBC_EMULATOR/cgb_boot.bin');
        let z = a.read();
        expect(z).toBe(0x31);
        z = a.read(1);
        expect(z).toBe(0xFE);
    })

    test('read throws Out Of Range error when offset passes size of buffer', async () => {
        expect(() => {
            let a = new binaryReader('C:/Users/neel/projects/GBC_EMULATOR/cgb_boot.bin');
            let z = a.read(-1);
        }).toThrow();
    })

});