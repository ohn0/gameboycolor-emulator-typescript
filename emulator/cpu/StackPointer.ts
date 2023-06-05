import { Register16Bit } from "./register16bit";

export class StackPointer extends Register16Bit {
    constructor(registerName: string) {
        super(registerName);
    }

    public setStackValue(value: number) {
        this.value = value;
    }

    public getStackValue(): number { return this.value; }
    
    public override setRegister(value: number) {
        this.setStackValue(value);
    }

    public getRegister(): number {
        return this.getStackValue();
    }
}
