import { MemoryMap } from './memoryMap';
import { iMBC } from '../MemoryBankControllers/iMBC';
export class GameBoyMemoryMap extends MemoryMap {

    private readonly _romBank0 = 0x0000;
    public get romBank0() {
        return this._romBank0;
    }
    private readonly _romBankConfigurable = 0x4000;
    public get romBankConfigurable() {
        return this._romBankConfigurable;
    }
    private readonly _videoRAM = 0x8000;
    public get videoRAM() {
        return this._videoRAM;
    }
    private readonly _externalRAM = 0xA000;
    public get externalRAM() {
        return this._externalRAM;
    }
    private readonly _workRAM = 0xC000;
    public get workRAM() {
        return this._workRAM;
    }
    private readonly _workRAMSwitchable = 0xD000;
    public get workRAMSwitchable() {
        return this._workRAMSwitchable;
    }
    private readonly _echoRAM = 0xE000;
    public get echoRAM() {
        return this._echoRAM;
    }
    private readonly _spriteTable = 0xFE00;
    public get spriteTable() {
        return this._spriteTable;
    }
    private readonly _notUsableRAM = 0xFEA0;
    public get notUsableRAM() {
        return this._notUsableRAM;
    }
    private readonly _IORegisters = 0xFF00;
    public get IORegisters() {
        return this._IORegisters;
    }
    private readonly _highRAM = 0xFF80;
    public get highRAM() {
        return this._highRAM;
    }
    private readonly _interruptEnableRegister = 0xFFFF;
    public get interruptEnableRegister() {
        return this._interruptEnableRegister;
    }
    private _memoryBank! : iMBC; 


    public readonly ROM_BANK:                  string = "ROM BANK 0";
    public readonly ROM_BANK_CONFIGURABLE:     string = "ROM BANK CONFIGURABLE";
    public readonly VRAM:                      string = "VRAM";
    public readonly external_RAM:               string = "EXTERNAL RAM";
    public readonly WRAM:                      string = "WRAM";
    public readonly WRAM_SWITCHABLE:           string = "WRAM SWITCHABLE";
    public readonly ECHO_RAM:                  string = "ECHO RAM";
    public readonly OAM:                       string = "OAM";
    public readonly NA:                        string = "NOT USABLE REGION";
    public readonly IO_REGISTERS:              string = "IO REGISTERS";
    public readonly HIGH_RAM:                  string = "HIGH RAM";
    public readonly INTERRUPT_ENABLE_REGISTER: string = "INTERRUPT ENABLE REGISTER";

    constructor() {
        super(0xFFFF);
        this.fillMap(0x00);
    }

    public getMemoryRegion(byte : number) : string {
        if (byte >= this._romBank0 && byte < this._romBankConfigurable) {
            return this.ROM_BANK;
        }
        else if (byte >= this._romBankConfigurable && byte < this._videoRAM) {
            return this.ROM_BANK_CONFIGURABLE;
        }
        else if (byte >= this._videoRAM && byte < this._externalRAM) {
            return this.VRAM;
        }
        else if (byte >= this._externalRAM && byte < this._workRAM) {
            return this.external_RAM;
        }
        else if (byte >= this._workRAM && byte < this._workRAMSwitchable) {
            return this.WRAM;
        }
        else if (byte >= this._workRAMSwitchable && byte < this._echoRAM) {
            return this.WRAM_SWITCHABLE;
        }
        else if (byte >= this._echoRAM && byte < this._spriteTable) {
            return this.ECHO_RAM;
        }
        else if (byte >= this._spriteTable && byte < this._notUsableRAM) {
            return this.OAM;
        }
        else if (byte >= this._notUsableRAM && byte < this._IORegisters) {
            return this.NA;
        }
        else if (byte >= this._IORegisters && byte < this._highRAM) {
            return this.IO_REGISTERS;
        }
        else if (byte >= this._highRAM && byte < this._interruptEnableRegister) {
            return this.HIGH_RAM;
        }
        else {
            return this.INTERRUPT_ENABLE_REGISTER;
        }
    }

    public fillMap(value: number): void {
        if (value > 0xFF) {
            throw new Error("value is not an 8bit integer");
        }
        this.memory.forEach(byte => byte = value);
    }

    public write(index: number, value: number): boolean {
        if (index < 0x8000) {
            this._memoryBank.interceptWrite({index, value});
        }

        return true;
    }
}