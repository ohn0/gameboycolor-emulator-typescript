import { Register16Bit } from "./register16bit";


export class ProgramCounter extends Register16Bit {
    constructor(registerName: string) {
        super(registerName);
        this.value = 0x000;
    }

    getCounterValue(): number {
        return this.value++;
    }

    setCounterValue(_: number) {
        this.value = _;
    }

    getCounterNoincrement(): number {
        return this.value;
    }
}
