import { controlState } from './controlStates';
export class clock{
    private clock: number;
    private tClock: number;
    private mClock: number;
    private timer: number;
    private dividerUpdater: () => void;
    private counterUpdater: () => void;
    private controlState: controlState;
    constructor(divHandler : () => void, counterHandler : () => void, cState : controlState) {
        this.clock = this.tClock = this.mClock = this.timer = 0;
        this.dividerUpdater = divHandler;
        this.counterUpdater = counterHandler;
        this.controlState = cState;
    }

    public tick() {
        this.tClock = this.clock++;
        if (this.tClock % 4 == 0) this.mClock++;
        if (this.mClock % 4 == 0 && this.controlState.isRunning) this.timer++;
        if (this.tClock % 256 == 0) this.dividerUpdater();

        if (this.mClock % 0x40000 == 0 ||
            this.mClock % 0x10000 == 0 ||
            this.mClock % 0x4000 == 0 ||
            this.mClock % 0x1000 == 0) {
            this.counterUpdater();
            }
    }

    public getClockState():
        {
            clock: number,
            tClock: number,
            mClock: number,
            timer: number
        } {
        return {
            clock: this.clock,
            tClock: this.tClock,
            mClock: this.mClock,
            timer: this.timer
        }
    }
}