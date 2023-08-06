import { Uint8 } from './../../primitives/uint8';
import { Interrupt } from './interrupt';
export class InterruptHandler{

    private interruptVector: Interrupt[];
    private interruptEnableFlag: Uint8;
    private interruptFlag: Uint8;
    private _masterInterruptFlag = false;
    
    public get masterInterruptFlag() {
        return this._masterInterruptFlag;
    }
    public set masterInterruptFlag(value) {
        this._masterInterruptFlag = value;
    }
    
    constructor() {
        //...
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
        this.interruptEnableFlag.value = IEFlag;
        this.interruptFlag.value = IF;
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
        this.interruptEnableFlag.value |= (1 << interrupt.bitIndex);
        interrupt.setRequested();
    }

    public addInterrupt(interrupt: Interrupt): void {
        this.interruptVector.push(interrupt);
    }

    public handle(): number {
        if (!this.masterInterruptFlag) return -1;
        this.masterInterruptFlag = false;
        const highestPriorityInterrupt = this.interruptVector.find(i => i.isRequested);
        if (highestPriorityInterrupt != undefined) {
            highestPriorityInterrupt.unsetRequested();
            this.interruptEnableFlag.value &= (~(1 << highestPriorityInterrupt.bitIndex));
            return highestPriorityInterrupt.routineLocation;
        }

        return -1;
    }
}