import { Register16Bit } from "./register16bit";


export class ProgramCounter extends Register16Bit {
    constructor(registerName: string) {
        super(registerName);
        this.value = 0x000;
    }
}
