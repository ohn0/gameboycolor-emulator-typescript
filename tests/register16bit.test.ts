import { Register16Bit, HiLoRegister } from './../register16bit';
import { describe, expect, test } from '@jest/globals';
import { Register8bit } from '../register';

describe('register16bit testing', () => {
    test('16 bit register throws when value set to numbers greater than 65535', () => {
        let a = new Register16Bit("test");
        expect(() => {
            a.value = 70000;
        }).toThrow();
    });

    test('16 bit register stores value if its less than 65536', () => {
        let a = new Register16Bit("test");
        a.value = 0xFFF;
        expect(a.value).toBe(0xFFF);
    });

    test('16 bit register gets name set when initialized', () => {
        let a = new Register16Bit("register");
        expect(a.registerName).toBe("register");
    });
});

describe('HiLoRegister testing', () => {
    let aHiLo = new HiLoRegister(new Register8bit(0xAA), new Register8bit(0xBB), "AB Register");

    test('Hi and Lo registers are configured on initialization', () => {
        expect(aHiLo.HiRegister?.register._).toBe(0xAA);
        expect(aHiLo.LoRegister?.register._).toBe(0xBB);
    });

    test('getRegister returns Hi and Lo registers as a single 16bit value when both are defined', () => {
        let value = aHiLo.getRegister();
        expect(value).toBe(0xAABB);
    });

    test('getRegister returns  Hi register shifted right 8 when Lo register is not defined', () => {
        aHiLo.LoRegister = undefined;
        let value = aHiLo.getRegister();
        expect(aHiLo.getRegister()).toBe(0xAA00);
    });
});