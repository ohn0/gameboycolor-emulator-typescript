export const OPCODE_COST_4 = 4;
export const OPCODE_COST_8 = 8;
export const OPCODE_COST_12 = 12;
export const OPCODE_COST_16 = 16;
export const OPCODE_COST_20 = 20;
export const OPCODE_COST_24 = 24;

export class OPCODE_COSTS_T_STATES{
    static readonly OPCODE_COST_8 = 8;
    static readonly OPCODE_COST_12 = 12;
    static readonly OPCODE_COST_16 = 16;
    static readonly OPCODE_COST_20 = 20;
    static readonly OPCODE_COST_24 = 24;
    static readonly OPCODE_COST_4 = 4;
}

export class INTERRUPT_SOURCES {
    static readonly INTERRUPT_VBLANK = "VBLANK";
    static readonly INTERRUPT_LCD_STAT = "LCD_STAT";
    static readonly INTERRUPT_TIMER = "TIMER";
    static readonly INTERRUPT_SERIAL = "SERIAL";
    static readonly INTERRUPT_JOYPAD = "JOYPAD";
}