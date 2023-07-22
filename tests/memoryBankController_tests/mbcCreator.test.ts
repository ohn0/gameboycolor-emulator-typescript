import { mbcCreator } from './../../emulator/MemoryBankControllers/mbcCreator';
import { MBC0 } from './../../emulator/MemoryBankControllers/MBC0';
import { describe,expect, test } from "@jest/globals";
import { MBC1 } from '../../emulator/MemoryBankControllers/MBC1';
import { MBC2 } from '../../emulator/MemoryBankControllers/MBC2';
import { MBC3 } from '../../emulator/MemoryBankControllers/MBC3';

describe('MBC creator testing', () => {
    test('mbcCreator creates MBC0 when passed in MBC0 key', () => {
        expect(mbcCreator.getMBC(0x00)).toBeInstanceOf(MBC0);
        expect(mbcCreator.getMBC(0x01)).toBeInstanceOf(MBC1);
        expect(mbcCreator.getMBC(0x05)).toBeInstanceOf(MBC2);
        expect(mbcCreator.getMBC(0x11)).toBeInstanceOf(MBC3);
    })

    test('mbcCreator throws error when passed undefined MBC key', () => {
        expect(() => {mbcCreator.getMBC(0x999)}).toThrow();
    })
})