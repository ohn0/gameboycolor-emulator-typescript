import { controlState } from './controlStates';
export class clock{
    private readonly FREQUENCY = 4194304;
    private readonly CGB_FREQUENCY = 8388608;
    private clock: number;
    private ticks: number;
    private cycles: number;
    private timer: number;
    private TIMAIncrementRateTicks!: number;
    private TIMAIncrementRateCycles!: number;
    private dividerUpdater: () => void;
    private counterUpdater: () => void;
    public controlState!: controlState;
    private singleSecondCounter: number;
    private initialTime: number;
    private TACcounter: number;
    private TACmodified: boolean;
    constructor(divHandler : () => void, counterHandler : () => void, cState : controlState) {
        this.clock = this.ticks = this.cycles = this.timer = 0;
        this.dividerUpdater = divHandler;
        this.counterUpdater = counterHandler;
        this.TACmodified = false;
        this.updateControlState(cState);
        this.singleSecondCounter = this.initialTime = this.TACcounter = 0;
    }

    public tick(currentTick: number): boolean {
        // if (this.singleSecondCounter > this.FREQUENCY) {
        //     if (Date.now() - this.initialTime > 1000) {
        //         this.singleSecondCounter = 0;
        //         this.TACcounter = 0;
        //     }
        //     return false;
        // }
        this.singleSecondCounter++;
        this.ticks++;
        if (this.ticks % 4 == 0) {
            this.cycles++;
            this.TACmodified = false;
        }
        if (this.ticks % 256 == 0) this.dividerUpdater();
        if ((this.cycles) % (this.TIMAIncrementRateCycles) == 0
            && this.controlState.isRunning
            && this.TACcounter < this.controlState.clockRate
            && !this.TACmodified) {
            this.counterUpdater();
            this.TACcounter++;
            this.TACmodified = true;
        }
        return true;
    }

    public updateControlState(updatedState: controlState) {
        this.controlState = updatedState;
        this.TIMAIncrementRateTicks = this.FREQUENCY / this.controlState.clockRate;
        this.TIMAIncrementRateCycles = this.TIMAIncrementRateTicks / 4;
    }

    public getClockState():
        {
            clock: number,
            ticks: number,
            cycles: number,
            timer: number,
            incrementRate: number,
            cState : controlState
        } {
        return {
            clock: this.clock,
            ticks: this.ticks,
            cycles: this.cycles,
            timer: this.timer,
            incrementRate: this.TIMAIncrementRateTicks,
            cState: this.controlState
        }
    }
}