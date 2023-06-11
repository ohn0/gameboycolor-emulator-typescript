import { HiLoRegister } from "./HiLoRegister";
import { Register8bit } from "./register";

export class StackPointer extends HiLoRegister {
    constructor(lsb : number, msb : number, name : string) {
        super(new Register8bit(lsb), new Register8bit(msb), name);
    }

    public setStackValue(value: number) { this.setRegister(value); }

    public getStackValue(): number { return this.getRegister(); }
}
