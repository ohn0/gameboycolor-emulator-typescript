export interface controlState {
    isRunning: boolean,
    clockRate: number,
    frequency: number
}

export abstract  class controlStates{
    // 100 - RUN_0x1000
    // 101 - RUN_0x40000
    // 110 - RUN_0x10000
    // 111 - RUN_0x4000
    
    
    // 000 - STOP_0x1000
    // 001 - STOP_0x40000
    // 010 - STOP_0x10000
    // 011 - STOP_0x4000

    public static readonly  states: { [key: number]: controlState } = {
        0b100:
        {
            isRunning: true,
            clockRate: 0x1000,
            frequency: 1 / 0x1000
        },
        0b101: {
            isRunning: true,
            clockRate: 0x40000,
            frequency: 1 / 0x40000
        },
        0b110: {
            isRunning: true,
            clockRate: 0x10000,
            frequency: 1 / 0x10000
        },
        0b111: {
            isRunning: true,
            clockRate: 0x4000,
            frequency: 1 / 0x4000
        },

        0b000: {
            isRunning: false,
            clockRate: 0x1000,
            frequency: 1 / 0x1000
        },
        0b001: {
            isRunning: false,
            clockRate: 0x40000,
            frequency: 1 / 0x40000
        },
        0b010: {
            isRunning: false,
            clockRate: 0x10000,
            frequency: 1 / 0x10000
        },
        0b011: {
            isRunning: false,
            clockRate: 0x4000,
            frequency: 1 / 0x4000
        }
    };

    public static getControlState(key: number): controlState {
        key &= 0b111;
        if (this.states[key] == undefined)
            return  {
                isRunning: false,
                clockRate: 0x9999,
                frequency: 1/0x9999
            };
        return this.states[key];
    }
}