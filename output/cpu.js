"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPU = void 0;
var register_1 = require("./register");
var register16bit_1 = require("./register16bit");
var CPU = /** @class */ (function () {
    function CPU() {
        this.A = new register_1.Register8bit(0);
        this.B = new register_1.Register8bit(0);
        this.C = new register_1.Register8bit(0);
        this.D = new register_1.Register8bit(0);
        this.E = new register_1.Register8bit(0);
        this.H = new register_1.Register8bit(0);
        this.L = new register_1.Register8bit(0);
        this.AF = new register16bit_1.HiLoRegister(this.A, undefined, "AF");
        this.BC = new register16bit_1.HiLoRegister(this.B, this.C, "BC");
        this.DE = new register16bit_1.HiLoRegister(this.D, this.E, "DE");
        this.HL = new register16bit_1.HiLoRegister(this.H, this.L, "HL");
        this.SP = new register16bit_1.StackPointer("Stack Pointer");
        this.PC = new register16bit_1.ProgramCounter("Program Counter");
    }
    return CPU;
}());
exports.CPU = CPU;
