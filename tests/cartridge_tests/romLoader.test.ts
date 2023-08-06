import { describe, expect, test } from '@jest/globals'
import { RomLoader } from '../../emulator/romLoader'
const filename = "pkmn_crystal.gbc";
describe('testing loading ROMs', () => {

    const RAM = RomLoader.load("pkmn_crystal.gbc");

    test('file passed in is successfully accessed', () => {
        expect(RAM[0x11F]).toEqual(0xE6);
        expect(RAM[0x423]).toEqual(0xFB);
    })

    test('file in memory is same size as original game file.', () => {
        expect(RAM.length).toEqual(2097152);
    })
})