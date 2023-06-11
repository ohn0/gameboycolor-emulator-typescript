export class Uint8{
    private _value! : number;

    public get value() {
        return this._value;
    }

    public set value(value) {
        if (value > 0xFF) {
            this._value = (value & 0xFF);
        }
        else {
            this._value = value;
        }
    }

    constructor(value: number) {
        this.value = value;
    }

    public leftShiftWithCarry(shiftByN: number) {
        //?
    }

    public getSignedRepresentation(): number {
        return this._value << 24 >> 24;
    }
}
