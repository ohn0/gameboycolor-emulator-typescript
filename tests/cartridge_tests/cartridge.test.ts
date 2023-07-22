import { describe, expect, test } from '@jest/globals'
import { Cartridge } from '../../emulator/cartridge/cartridge'

describe('testing cartridge', () => {
    test('cartridge should initialize with a loaded game', () => {
        const cart: Cartridge = new Cartridge("pkmn_crystal.gbc");
        expect(cart.gameData.length).not.toBe(0);
    })
})