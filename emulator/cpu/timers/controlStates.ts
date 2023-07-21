import { clock } from './clock';
export interface controlState {
    isRunning: boolean,
    clockRate : number
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
        0x100:
        {
            isRunning: true,
            clockRate: 0x1000
        },
        0x101: {
            isRunning: true,
            clockRate: 0x40000
        },
        0x110: {
            isRunning: true,
            clockRate: 0x10000
        },
        0x111: {
            isRunning: true,
            clockRate: 0x4000
        },

        0x000: {
            isRunning: false,
            clockRate: 0x1000
        },
        0x001: {
            isRunning: false,
            clockRate: 0x40000
        },
        0x010: {
            isRunning: false,
            clockRate: 0x10000
        },
        0x011: {
            isRunning: false,
            clockRate: 0x4000
        }
    };

    public static getControlState(key : number): controlState {
        if (this.states[key] == undefined)
            return  {
                isRunning: false,
                clockRate: 0x9999
            };
        return this.states[key];
    }
}