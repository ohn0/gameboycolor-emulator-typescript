import { HiLoRegister } from "./HiLoRegister";
import { Register8bit } from "./register";

export class StackPointer extends HiLoRegister {
    constructor(lsb : number, msb : number, name : string) {
        super(new Register8bit(msb, "SP_MSB"), new Register8bit(lsb, "SP_LSB"), name);
    }

    public setStackValue(value: number) { this.setRegister(value); }

    public getStackValue(): number { return this.getRegister(); }
}
