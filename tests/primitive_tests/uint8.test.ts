import { Uint8 } from '../../primitives/uint8';
import { describe, expect, test } from '@jest/globals';

describe('uint8 testing', () => {
    test('uint8 truncates bits past 8th bit if value is greater than 0xFF', () => {
        let a = new Uint8(0x101);
        expect(a.value).toBeLessThan(0xFF);
    });

    test('uint8 is set to value when value is less than 0x100', () => {
        let a = new Uint8(0xFA);
        expect(a.value).toBe(0xFA);
    })
});
