export class divider{
    private _registerCounter = 0;
    private _overflowTriggered = false;

    readonly location = 0xFF04;
    //divider increments 16 times EACH M CYCLE
    //4 M CYCLES = 64 increments
    //1024 resets every second
    //once divider reaches 255, reset to 0
    constructor() {
        this.registerCounter = 0;
        this.overflowTriggered = false;
    }

    public incrementCounter() {
        this.registerCounter++;
        this.overflowTriggered = false;
        if (this.registerCounter == 0xFF) {
            this.registerCounter = 0;
            this.overflowTriggered = true;
        }
    }

    public get overflowTriggered(): boolean {
        return this._overflowTriggered;
    }
    public set overflowTriggered(value: boolean) {
        this._overflowTriggered = value;
    }

    public get registerCounter(): number {
        return this._registerCounter;
    }
    public set registerCounter(value: number) {
        this._registerCounter = value;
    }

    public resetCounter() {
        this.registerCounter = 0;
    }

}