import { mbcCreator } from './../../emulator/MemoryBankControllers/mbcCreator';
import { MBC0 } from './../../emulator/MemoryBankControllers/MBC0';
import { describe,expect, test } from "@jest/globals";
import { MBC1 } from '../../emulator/MemoryBankControllers/MBC1';
import { MBC2 } from '../../emulator/MemoryBankControllers/MBC2';
import { MBC3 } from '../../emulator/MemoryBankControllers/MBC3';
import * as path from 'path';
import { RomLoader } from '../../emulator/romLoader';

const gameData = RomLoader.load(path.resolve(__dirname, "..\\resources", 'loz_MBC1.gb'));

describe('MBC creator testing', () => {
    test('mbcCreator creates MBC0 when passed in MBC0 key', () => {
        expect(mbcCreator.getMBC(gameData)).toBeInstanceOf(MBC1);
    })

    test('mbcCreator throws error when passed undefined MBC key', () => {
        gameData[147] = 999;
        expect(() => {mbcCreator.getMBC(gameData)}).toThrow();
    })
})