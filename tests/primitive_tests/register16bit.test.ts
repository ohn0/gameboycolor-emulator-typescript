import { Register16Bit } from '../../emulator/cpu/register16bit';
import { describe, expect, test } from '@jest/globals';
import { Register8bit } from '../../emulator/cpu/register';
import { HiLoRegister } from '../../emulator/cpu/HiLoRegister';

describe('register16bit testing', () => {
    test('16 bit register gets name set when initialized', () => {
        const a = new Register16Bit("register");
        expect(a.registerName).toBe("register");
    });
});

describe('HiLoRegister testing', () => {
    const aHiLo = new HiLoRegister(new Register8bit(0xAA), new Register8bit(0xBB), "AB Register");

    test('Hi and Lo registers are configured on initialization', () => {
        expect(aHiLo.HiRegister).toBe(0xAA);
        expect(aHiLo.LoRegister).toBe(0xBB);
    });

    test('getRegister returns Hi and Lo registers as a single 16bit value when both are defined', () => {
        const value = aHiLo.getRegister();
        expect(value).toBe(0xAABB);
    });
});