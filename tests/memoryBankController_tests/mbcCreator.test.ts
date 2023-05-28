import { mbcCreator } from './../../MemoryBankControllers/mbcCreator';
import { describe,expect, test } from "@jest/globals";
import { MBC0 } from '../../MemoryBankControllers/MBC0';

describe('MBC creator testing', () => {
    test('mbcCreator creates MBC0 when passed in MBC0 key', () => {
        expect(mbcCreator.getMBC(mbcCreator.MBC0)).toBeInstanceOf(MBC0);
    })

    test('mbcCreator throws error when passed undefined MBC key', () => {
        expect(() => {mbcCreator.getMBC("unknown_type")}).toThrow();
    })
})