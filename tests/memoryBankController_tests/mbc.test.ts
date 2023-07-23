import { describe, expect, test } from "@jest/globals";
import { MBC1 } from "../../emulator/MemoryBankControllers/MBC1";
import { RomLoader } from "../../emulator/romLoader";
import * as path from 'path';

describe('Memory Bank Controller testing', () => {
    test('MBC1 loads game file', () => {
        const mbc1: MBC1 = new MBC1();
        mbc1.configureMBC(RomLoader.load(path.resolve(__dirname, '..\\..', 'loz_MBC1.gb')));
        expect(mbc1.banks.length).not.toBe(0);
        let validBanks = 0;
        mbc1.banks.forEach(bank => {
            validBanks = bank.isValidBank() ? validBanks + 1 : validBanks;
        })
        expect(validBanks + (mbc1.initialBank.isValidBank() ? 1 : 0)).toBe(32);
    })
})