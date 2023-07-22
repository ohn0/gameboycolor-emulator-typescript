import { describe, expect, test } from '@jest/globals'
import { RomLoader } from '../../emulator/romLoader'
const filename = "pkmn_crystal.gbc";
describe('testing loading ROMs', () => {
    test('file passed in is successfully accessed', () => {
        const RAM = RomLoader.load("pkmn_crystal.gbc");
        expect(RAM[0x11F]).toEqual(0xE6);
        expect(RAM[0x423]).toEqual(0xFB);
    })
})