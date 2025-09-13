import { Logger } from '../../logger/logger';
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

    private static readonly ramSizeMap: { [key: number]: number } = {
        0x00: 0,
        0x02: 0x2000,
        0x03: 0x8000,
        0x04: 0x20000,
        0x05: 0x10000
    }

    private static readonly mbcFactory: { [key: number]: () => iMBC } = {
        0x00: () => new MBC0(),
        0x01: () => new MBC1(),
        0x02: () => new MBC1(),
        0x03: () => new MBC1(),
        0x05: () => new MBC2(),
        0x11: () => new MBC3()
    }


    static getMBC(gameData: Uint8Array, logger: Logger): iMBC{
        if (this.mbcFactory[gameData[0x147]] == undefined) {
            throw new Error(`mbcType ${gameData[0x147]} is not supported.`);
        }

        const mbc = gameData[0x148] == 0x00
            ? new MBC0()
            : this.mbcFactory[gameData[0x147]]();

        mbc.configure(gameData, logger);
        return mbc;
    }

    static getRomSize(RomKey: number) : number {
        return ((0x8000) * (1 << RomKey)); // 32 KiB * (1 << RomKey)
    }

    static getRamSize(RamKey: number): number {
        return this.ramSizeMap[RamKey];
    }
}