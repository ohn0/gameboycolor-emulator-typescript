import { Uint8 } from '../primitives/uint8';
import { describe, expect, test } from '@jest/globals';

describe('uint8 testing', () => {
    test('uint8 is always 255 if value passed in is greater than 255', () => {
        let a = new Uint8(1000);
        expect(a._).toBe(255);
    });

    test('uint8 is set to value when value is less than 256', () => {
        let a = new Uint8(251);
        expect(a._).toBe(251);
    })
});
