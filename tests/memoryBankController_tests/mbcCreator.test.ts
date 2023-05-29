import { mbcCreator } from './../../emulator/MemoryBankControllers/mbcCreator';
import { MBC0 } from './../../emulator/MemoryBankControllers/MBC0';
import { describe,expect, test } from "@jest/globals";

describe('MBC creator testing', () => {
    test('mbcCreator creates MBC0 when passed in MBC0 key', () => {
        expect(mbcCreator.getMBC(mbcCreator.MBC0)).toBeInstanceOf(MBC0);
    })

    test('mbcCreator throws error when passed undefined MBC key', () => {
        expect(() => {mbcCreator.getMBC("unknown_type")}).toThrow();
    })
})