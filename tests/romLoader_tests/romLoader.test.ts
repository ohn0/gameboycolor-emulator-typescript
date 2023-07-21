import { describe, expect, test } from '@jest/globals'
import { RomLoader } from '../../emulator/romLoader'
const filename = "pkmn_crystal.gbc";
describe('testing loading ROMs', () => {
    test('file passed in is successfully accessed', () => {
        let RAM = new Uint8Array(0xFFFF);
        RAM = RomLoader.load("pkmn_crystal.gbc", RAM);
        expect(RAM[0x11F]).toEqual(0xE6);
        expect(RAM[0x423]).toEqual(0xFB);
    })
})