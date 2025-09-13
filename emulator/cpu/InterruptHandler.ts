import { Logger } from '../../logger/logger';
import { Uint8 } from './../../primitives/uint8';
import { Interrupt } from './interrupt';
export class InterruptHandler{

    private interruptVector: Interrupt[];
    private interruptEnableFlag: Uint8;
    private interruptFlag: Uint8;
    private _masterInterruptFlag = false;
    private logger: Logger;
    
    public get masterInterruptFlag() {
        return this._masterInterruptFlag;
    }
    public set masterInterruptFlag(value) {
        this._masterInterruptFlag = value;
    }
    
    constructor(logger: Logger) {
        this.logger = logger;
        this.interruptEnableFlag = new Uint8(0);
        this.interruptFlag = new Uint8(0);
        this.interruptVector = new Array<Interrupt>();
    }

    public getInterruptFlag(): number {
        return this.interruptFlag.value;
    }

    public getInterruptEnableFlag(): number {
        return this.interruptEnableFlag.value;
    }
    
    public configure(IEFlag: number, IF: number) : void {
        this.interruptEnableFlag.value = (IEFlag & 0x1F);
        this.interruptFlag.value = (IF & 0x1F);
        this.mapToVector();
    }

    public configureInterruptEnableFlag(IEFlag: number) {
        this.interruptEnableFlag.value = (IEFlag & 0x1F);
        this.mapToVector();
    }

    public configureInterruptFlag(IF: number) {
        this.interruptFlag.value = (IF & 0x1F);
        this.mapToVector();
    }

    public enableInterrupt(interruptKey: string) {
        const interrupt = this.interruptVector.find(i => i.name == interruptKey);
        if (interrupt == undefined) throw ("Undefined interrupt encountered.");
        this.interruptEnableFlag.value |= (1 << interrupt.bitIndex);
        interrupt.setInterruptState(((this.interruptEnableFlag.value >> interrupt.bitIndex) & 1) > 0);
    }

    public disableInterrupt(interruptKey: string) {
        const interrupt = this.interruptVector.find(i => i.name == interruptKey);
        if (interrupt == undefined) throw ("Undefined interrupt encountered.");
        this.interruptEnableFlag.value &= (~(1 << interrupt.bitIndex));
        interrupt.setInterruptState(((this.interruptEnableFlag.value >> interrupt.bitIndex) & 1) > 0);
    }

    public requestInterrupt(interruptKey: string): void {
        const interrupt = this.interruptVector.find(i => i.name == interruptKey);
        if (interrupt == undefined) throw ("Undefined interrupt encountered.");
        this.interruptFlag.value |= (1 << interrupt.bitIndex);
        interrupt.setRequested();
    }

    public addInterrupt(interrupt: Interrupt): void {
        this.interruptVector.push(interrupt);
    }

    public handle(): number {
        // this.logger.logInterrupt(this.interruptVector, this.masterInterruptFlag, this.interruptEnableFlag.value, this.interruptFlag.value);
        if (!this.masterInterruptFlag) return -1;
        const highestPriorityInterrupt = this.interruptVector.find(i => (i.isEnabled && i.isRequested));
        if (highestPriorityInterrupt != undefined) {
            highestPriorityInterrupt.unsetRequested();
            // this.interruptEnableFlag.value &= (0xFF & (~(1 << highestPriorityInterrupt.bitIndex)));
            this.interruptFlag.value &= (0xFF & (~(1 << highestPriorityInterrupt.bitIndex)));
            this.masterInterruptFlag = false;
            return highestPriorityInterrupt.routineLocation;
        }

        return -1;
    }

    public resetInterrupts(interruptState : number) {
        this.interruptEnableFlag.value = interruptState;
        this.masterInterruptFlag = true;
    }

    private mapToVector(): void {
        const IF = this.interruptFlag;
        const IE = this.interruptEnableFlag;
        this.interruptVector.forEach(interrupt => {
            interrupt.isEnabled = ((IE.value >> interrupt.bitIndex) & 1) != 0;
            interrupt.isRequested = ((IF.value >> interrupt.bitIndex) & 1) != 0;
        })
    }

}