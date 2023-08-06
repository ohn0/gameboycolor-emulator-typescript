import { HiLoRegister } from "../emulator/cpu/HiLoRegister";
import { Register8bit } from "../emulator/cpu/register";
import * as fs from 'fs';

export class Logger{
    private _step = 0;
    public get step(): number {
        return this._step;
    }
    public set step(value: number) {
        this._step = value;
    }

    private messages: Array<string>;
    private message: string;
    constructor() {
        this.messages = new Array<string>();
        this.message = '';
    }

    configureLogging(stepVal : number) {
        this.step = stepVal;
    }

    logRegister8bit(r: Register8bit) {
        this.message +=`${r.name.toLocaleUpperCase()}: ${r.value.toString(16).toLocaleUpperCase().padStart(2, '0')} `;
    }

    logRegister16bit(r: HiLoRegister) {
        this.message += `${r.registerName}: ${r.getRegister().toString(16).toLocaleUpperCase().padStart(4, '0')} `;
    }

    logMemory(value: number) {
        this.message += `${value.toString(16).toLocaleUpperCase().padStart(2, '0')} `;
    }

    logArray(value: Array<number>) {
        this.message += '(';
        value.forEach(n => this.message+=`${n.toString(16).toLocaleUpperCase().padStart(2,'0')}`)
        this.message += ')';
    }

    logString(value: string) {
        this.message += value;
    }

    publishLog() {
        this.messages.push(this.message);
        this.message = '';
    }

    logToFile() {
        if (this.message != '') {
            this.publishLog();
        }
        let output = ''
        this.messages.forEach(message => output += message+'\n');
        fs.writeFileSync("logOutput.yaml", output);
        this.messages = new Array<string>();
    }

}