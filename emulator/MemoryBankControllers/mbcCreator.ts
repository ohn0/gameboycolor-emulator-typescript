import { iMBC } from './iMBC';
import { MBC0 } from './MBC0';
import { MBC1 } from './MBC1';
import { MBC2 } from './MBC2';
import { MBC3 } from './MBC3';
export class mbcCreator{
    public static readonly MBC0 = 0x00;
    public static readonly MBC1 = 0x01;
    public static readonly MBC1_RAM = 0x02;
    public static readonly MBC1_RAM_BATTERY = 0x03;

    public static readonly MBC2 = 0x05;
    public static readonly MBC2_BATTERY = 0x05;

    public static readonly MBC3 = 0x11;
    public static readonly MBC3_RAM = 0x12;
    public static readonly MBC3_RAM_BATTERY = 0x13;
    public static readonly MBC3_TIMER_BATTERY = 0x0F;
    public static readonly MBC3_TIMER_RAM_BATTERY = 0x10;

    private static readonly mbcFactory: { [key: number]: () => iMBC } = {
        0x00: () => new MBC0(),
        0x01: () => new MBC1(),
        0x02: () => new MBC1(),
        0x03: () => new MBC1(),
        0x05: () => new MBC2(),
        0x11: () => new MBC3()
    }


    static getMBC(mbcType: number, gameData : Uint8Array): iMBC{
        if (this.mbcFactory[mbcType] == undefined) {
            throw new Error(`mbcType ${mbcType} is not supported.`);
        }
        const mbc = this.mbcFactory[mbcType]();
        mbc.configureMBC(gameData);
        return this.mbcFactory[mbcType]();
    }
}