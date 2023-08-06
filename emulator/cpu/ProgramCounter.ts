import { HiLoRegister } from "./HiLoRegister";
import { Register8bit } from "./register";


export class ProgramCounter extends HiLoRegister {
    constructor(registerName: string) {
        super(new Register8bit(0x00, "PC_HI"), new Register8bit(0x00, "PC_LO"), registerName);
        this.value = 0x000;
    }

    getCounterValue(): number {
        const currentCounterValue = this.getRegister();
        this.setRegister(this.getRegister() + 1);
        return currentCounterValue;
    }

    setCounterValue(_: number) {
        this.setRegister(_);
    }

    getCounterNoincrement(): number {
        return this.getRegister();
    }
}
