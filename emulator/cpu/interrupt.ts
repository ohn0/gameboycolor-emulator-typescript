export class Interrupt{
    name: string;
    isEnabled = false;
    routineLocation: number;
    priority: number;
    bitIndex: number;
    isRequested = false;
    
    constructor(name: string,
        routineLocation: number,
        priority: number,
        bitIndex: number) {
        
        this.name = name;
        this.routineLocation = routineLocation;
        this.priority = priority;
        this.bitIndex = bitIndex;
    }

    public setInterruptState(interruptBitState : boolean): void {
        this.isEnabled = interruptBitState;
    }

    public setRequested(): void {
        this.isRequested = true;
    }

    public unsetRequested(): void {
        this.isRequested = false;
    }

}