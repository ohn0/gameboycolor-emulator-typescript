export class divider{
    registerCounter: number;
    overflowTriggered: boolean;
    constructor() {
        this.registerCounter = 0;
        this.overflowTriggered = false;
    }

    public incrementCounter(cycles: number) {
        this.registerCounter += cycles;

        if (this.registerCounter >= 0xFF) {
            this.registerCounter = 0;
            this.overflowTriggered = true;
        }

        this.overflowTriggered = false;
    }
}