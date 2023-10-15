import { describe, expect, test } from '@jest/globals'
import { RomLoader } from '../../emulator/romLoader'
import * as path from 'path';

const filename = path.resolve(__dirname, "..\\resources", 'pkmn_crystal.gbc');
describe('testing loading ROMs', () => {

    const RAM = RomLoader.load(filename);

    test('file passed in is successfully accessed', () => {
        expect(RAM[0x11F]).toEqual(0xE6);
        expect(RAM[0x423]).toEqual(0xFB);
    })

    test('file in memory is same size as original game file.', () => {
        expect(RAM.length).toEqual(2097152);
    })
})