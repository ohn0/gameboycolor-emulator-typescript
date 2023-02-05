export class Uint8{
    private value! : number;

    public get _() {
        return this.value;
    }

    public set _(value) {
        if (value > 255) {
            this.value = 255;
        }
        else {
            this.value = value;
        }
    }

    constructor(value: number) {
        this._ = value;
    }
}
