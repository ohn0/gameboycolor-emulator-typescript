export class InitializationMapper{
    public static initializePostBootRAMState(RAM: Uint8Array, GameBoyTypeKey: string): Uint8Array {
        RAM[0xFF00] = 0xCF;
        RAM[0xFF01] = 0x00;
        RAM[0xFF02] = GameBoyTypeKey == "DMG" ? 0x7E : 0x7F;
        RAM[0XFF04] = 0XAB;
        RAM[0XFF05] = 0X00;
        RAM[0XFF06] = 0X00;
        RAM[0XFF07] = 0XF8;
        RAM[0XFF0F] = 0XE1;
        RAM[0XFF10] = 0X80;
        RAM[0XFF11] = 0XBF;
        RAM[0XFF12] = 0XF3;
        RAM[0XFF13] = 0XFF;
        RAM[0XFF14] = 0XBF;
        RAM[0XFF16] = 0X3F;
        RAM[0XFF17] = 0X00;
        RAM[0XFF18] = 0XFF;
        RAM[0XFF19] = 0XBF;
        RAM[0XFF1A] = 0X7F;
        RAM[0XFF1B] = 0XFF;
        RAM[0XFF1C] = 0X9F;
        RAM[0XFF1D] = 0XFF;
        RAM[0XFF1E] = 0XBF;
        RAM[0XFF20] = 0XFF;
        RAM[0XFF21] = 0X00;
        RAM[0XFF22] = 0X00;
        RAM[0XFF23] = 0XBF;
        RAM[0XFF24] = 0X77;
        RAM[0XFF25] = 0XF3;
        RAM[0XFF26] = 0XF1;
        RAM[0XFF40] = 0X91;
        RAM[0XFF41] = 0X85;
        RAM[0XFF42] = 0X00;
        RAM[0XFF43] = 0X00;
        RAM[0XFF44] = 0X00;
        RAM[0XFF45] = 0X00;
        RAM[0XFF46] = GameBoyTypeKey == "DMG" ? 0XFF : 0x00;
        RAM[0XFF47] = 0XFC;
        RAM[0XFF48] = 0X00;
        RAM[0XFF49] = 0X00;
        RAM[0XFF4A] = 0X00;
        RAM[0XFF4B] = 0X00;
        RAM[0XFF4D] = 0XFF;
        RAM[0XFF4F] = 0XFF;
        RAM[0XFF51] = 0XFF;
        RAM[0XFF52] = 0XFF;
        RAM[0XFF53] = 0XFF;
        RAM[0XFF54] = 0XFF;
        RAM[0XFF55] = 0XFF;
        RAM[0XFF56] = 0XFF;
        RAM[0XFF68] = 0XFF;
        RAM[0XFF69] = 0XFF;
        RAM[0XFF6A] = 0XFF;
        RAM[0XFF6B] = 0XFF;
        RAM[0XFF70] = 0XFF;
        RAM[0XFFFF] = 0X00;

        return RAM;
    }

}