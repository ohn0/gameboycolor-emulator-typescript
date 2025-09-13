import {Opcodes} from '../resources/Opcodes';
import { HiLoRegister } from "../emulator/cpu/HiLoRegister";
import { Register8bit } from "../emulator/cpu/register";
import * as fs from 'fs';
import * as  path from 'path';
import { Interrupt } from '../emulator/cpu/interrupt';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
type opcodeBase = {
    opcode: number | undefined,
    mnemonic: string | undefined,
    operands: string | undefined,
    isPrefixed: boolean,
    cost : number | undefined
}

export class Logger{
    private _step = 0;
    public get step(): number {
        return this._step;
    }
    public set step(value: number) {
        this._step = value;
    }

    private messages: Array<string>;
    private timerRecord: Array<string>;
    private interruptRecord: Array<string>;
    private message: string;
    private messagesIndex: number;
    private filename: string;
    private opcodesTrace: Array<{
        traceMessage: string,
        code: opcodeBase
    }>;

    constructor(filename = "") {
        this.messages = new Array<string>(0x10000);
        this.messagesIndex = 0;
        this.timerRecord = new Array<string>();
        this.message = '';
        this.interruptRecord = new Array<string>();
        this.opcodesTrace = new Array<{
            traceMessage: string, code: opcodeBase
        }>();
        this.filename = filename;
        if (filename != "") {
            fs.unlink(path.resolve(dirname(fileURLToPath(import.meta.url)), `..\\${filename}`, `${filename}.yaml`), (err) => {console.log('error removing file.')});
        }
    }

    configureLogging(stepVal : number) {
        this.step = stepVal;
    }

    logRegister8bit(r: Register8bit) {
        this.logString(`${r.name.toLocaleUpperCase()}: ${r.value.toString(16).toLocaleUpperCase().padStart(2, '0')} `)
        // this.message +=`${r.name.toLocaleUpperCase()}: ${r.value.toString(16).toLocaleUpperCase().padStart(2, '0')} `;
    }

    logRegister16bit(r: HiLoRegister) {
        this.logString(`${r.registerName}: ${r.getRegister().toString(16).toLocaleUpperCase().padStart(4, '0')} `)
        // this.message += `${r.registerName}: ${r.getRegister().toString(16).toLocaleUpperCase().padStart(4, '0')} `;
    }

    logMemory(value: number) {
        this.logString(`${value.toString(16).toLocaleUpperCase().padStart(2, '0')} `)
        // this.message += `${value.toString(16).toLocaleUpperCase().padStart(2, '0')} `;
    }

    logArray(value: Array<number>) {
        // let z: string = value.forEach(n => z += `${n.toString(16).toLocaleUpperCase().padStart(2, '0')}`);
        // this.messages.push(`(${z})`);

        this.message += '(';
        value.forEach(n => this.message+=`${n.toString(16).toLocaleUpperCase().padStart(2,'0')}`)
        this.message += ')';
    }

    logString(value: string) {
        // this.message += value;
        this.messages[++this.messagesIndex] = value;
        if (this.messagesIndex == 0x10000) {
            this.logToFile();
            this.messagesIndex = 0;
        }
        // this.messages.push(value);
    }

    publishLog() {
        this.messages.push(`${this.message}\n`);
        this.message = '';
    }

    logToFile() {
        let output = ''
        this.messages.forEach(message => output += `${message}`);
        fs.writeFile(path.resolve(dirname(fileURLToPath(import.meta.url)), `..\\logOutput`, `${this.filename}.yaml`), output, { flag: 'a' },
            (err) => {
                if(err != null) console.log(err) 
            });
        output = ''
        this.messages = new Array<string>();
    }

    logTimer(cState : any, tick : number, tma: number) {
        this.timerRecord.push(`clock: ${cState.clock.toString(16).padStart(8, '0')}` +
            ` ticks: ${cState.ticks.toString(16).padStart(8, '0')} ` +
            ` cycles: ${cState.cycles.toString(16).padStart(8, '0')} ` +
            `timer: ${cState.timer.toString(16).padStart(8, '0')} ` +
            `incrementRate: ${cState.incrementRate.toString(16).padStart(8, '0')} ` +
            `cState: ${cState.cState.clockRate.toString(16).padStart(8,'0')} ` +
            `TIMA: ${tick.toString().padStart(8, '0')}`+` TMA: ${tma.toString(16).padStart(8)}`);
    }

    logOpCode(opcode: number, isPrefixed = false, isInterrupt = false) {
        const hexOpcode = `0x${opcode.toString(16).toUpperCase()}`;
        const opCodeDetails =
            isPrefixed
                ? Opcodes.cbprefixed.find(o => o.opcode == opcode)
                : Opcodes.unprefixed.find(o => o.opcode == opcode);
        this.opcodesTrace.push({
            traceMessage: `opcode ${hexOpcode} executed, ${opCodeDetails?.mnemonic}${isInterrupt ? '\n INTERRUPT EXECUTED' :''}`,
            code: {
                opcode: opCodeDetails?.opcode,
                mnemonic: opCodeDetails?.mnemonic,
                operands: opCodeDetails?.operands.toString(),
                isPrefixed: isPrefixed,
                cost: opCodeDetails?.cycles[0]
            }
        });
    }

    logOpCodesToFile() {
        let output = ''
        let uniqueOpcodeOutput = '';
        let uniquePrefixedOpcodeOutput = '';
        const uniqueOpcodes = new Array<opcodeBase>();
        const uniquePrefixedOpCodes = new Array<opcodeBase>();
        this.opcodesTrace.forEach(o => {
            if (!o.code.isPrefixed && uniqueOpcodes.find(u => o.code.opcode == u.opcode) == undefined) {
                if (o.code.opcode != undefined) {
                        uniqueOpcodes.push(o.code);
                }
            }

            if (o.code.isPrefixed && uniquePrefixedOpCodes.find(up => o.code.opcode == up.opcode) == undefined) {
                if (o.code.opcode != undefined) {
                    uniquePrefixedOpCodes.push(o.code);
                }
            }
            output += o.traceMessage + '\n'
        });
        uniqueOpcodes.forEach(u =>
            uniqueOpcodeOutput += `0x${u.opcode?.toString(16).toLocaleUpperCase().padStart(2, '0')}: ${u.mnemonic?.padStart(5,' ')}` + `: ${u.cost?.toString().padStart(5,'0')}` + '\n');
        
        uniquePrefixedOpCodes.forEach(u =>
            uniquePrefixedOpcodeOutput += `0x${u.opcode?.toString(16).toLocaleUpperCase().padStart(2, '0')}: ${u.mnemonic}` + '\n');
        fs.writeFileSync(path.resolve(dirname(fileURLToPath(import.meta.url)),'..\\logOutput', "opcodeTrace.yaml"), output);
        fs.writeFileSync(path.resolve(dirname(fileURLToPath(import.meta.url)),'..\\logOutput', "uniqueOpCodes.yaml"), uniqueOpcodeOutput);
        fs.writeFileSync(path.resolve(dirname(fileURLToPath(import.meta.url)),'..\\logOutput', "uniquePrefixedOpCodes.yaml"), uniquePrefixedOpcodeOutput);
    }

    logTimerToFile() {
        let output = '';
        this.timerRecord.forEach(t => output += t + '\n');
    
        fs.writeFileSync(path.resolve(dirname(fileURLToPath(import.meta.url)), '..\\logOutput', "timerOutput.yaml"), output);
    }

    public logInterrupt(interruptVector: Array<Interrupt>, IME : boolean, IE : number, IF : number) {
        let interruptLog = '===============================';
        interruptVector.forEach(i => {
            interruptLog += `\n${i.name}, ${i.isEnabled ? 'enabled  ' : 'disabled'}, ${i.isRequested ? 'requested    ' : 'not requested'}`;
        })
        this.interruptRecord.push(interruptLog);
        this.interruptRecord.push(`IME: ${IME}\t\tIE (FFFF): ${IE.toString(2).padStart(8,'0')}\t\tIF(FF0F): ${IF.toString(2).padStart(8,'0')}`);
    }

    public logInterruptsToFile() {
        let output = '';
        this.interruptRecord.forEach(i => output += i + '\n');
        
        // fs.writeFileSync(path.resolve(___dirname, '..\\logOutput', "interruptOutput.yaml"), output);
        fs.writeFileSync(path.resolve(dirname(fileURLToPath(import.meta.url)), '..\\logOutput', "interruptOutput.yaml"), output);
    }

    public logToConsole(message: string) {
        console.log(message);
    }
}