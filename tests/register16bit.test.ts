import { Register16Bit } from './../register16bit';
import { describe, expect, test } from '@jest/globals';

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
    })
})