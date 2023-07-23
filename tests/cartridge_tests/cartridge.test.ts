import { describe, expect, test } from '@jest/globals'
import { Cartridge } from '../../emulator/cartridge/cartridge'
import * as path from 'path';

describe('testing cartridge', () => {
    test('cartridge should initialize with a loaded game', () => {
        const cart: Cartridge = new Cartridge(path.resolve(__dirname, '..\\..', 'loz_MBC1.gb'));
        expect(cart.gameData.length).not.toBe(0);
    })
})