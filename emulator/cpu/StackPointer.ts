import { Register16Bit } from "./register16bit";

export class StackPointer extends Register16Bit {
    constructor(registerName: string) {
        super(registerName);
    }
}
