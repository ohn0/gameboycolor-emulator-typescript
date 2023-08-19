import {Opcodes} from '../resources/Opcodes';
import { HiLoRegister } from "../emulator/cpu/HiLoRegister";
import { Register8bit } from "../emulator/cpu/register";
import * as fs from 'fs';
import * as  path from 'path';

type opcodeBase = {
    opcode: number | undefined,
    mnemonic: string | undefined,
    operands: string | undefined,
    isPrefixed: boolean
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
    private message: string;

    private opcodesTrace: Array<{
        traceMessage: string,
        code: opcodeBase
    }>;

    constructor() {
        this.messages = new Array<string>();
        this.message = '';

        this.opcodesTrace = new Array<{
            traceMessage: string, code: opcodeBase}>();
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
        fs.writeFileSync(path.resolve(__dirname,'..\\logOutput', "logOutput.yaml"), output);
        this.messages = new Array<string>();
    }

    logOpCode(opcode: number, isPrefixed = false) {
        const hexOpcode = `0x${opcode.toString(16).toUpperCase()}`;
        const opCodeDetails =
            isPrefixed
                ? Opcodes.cbprefixed.find(o => o.opcode == opcode)
                : Opcodes.unprefixed.find(o => o.opcode == opcode);
        this.opcodesTrace.push({
            traceMessage: `opcode ${hexOpcode} executed, ${opCodeDetails?.mnemonic}`,
            code: {
                opcode: opCodeDetails?.opcode,
                mnemonic: opCodeDetails?.mnemonic,
                operands: opCodeDetails?.operands.toString(),
                isPrefixed : isPrefixed
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
            uniqueOpcodeOutput += `0x${u.opcode?.toString(16).toLocaleUpperCase().padStart(2, '0')}: ${u.mnemonic}` + '\n');
        
        uniquePrefixedOpCodes.forEach(u =>
            uniquePrefixedOpcodeOutput += `0x${u.opcode?.toString(16).toLocaleUpperCase().padStart(2, '0')}: ${u.mnemonic}` + '\n');
        fs.writeFileSync(path.resolve(__dirname,'..\\logOutput', "opcodeTrace.yaml"), output);
        fs.writeFileSync(path.resolve(__dirname,'..\\logOutput', "uniqueOpCodes.yaml"), uniqueOpcodeOutput);
        fs.writeFileSync(path.resolve(__dirname,'..\\logOutput', "uniquePrefixedOpCodes.yaml"), uniquePrefixedOpcodeOutput);
    }
}