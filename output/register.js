"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Register8bit = void 0;
var uint8_1 = require("./uint8");
var Register8bit = /** @class */ (function () {
    function Register8bit(value) {
        this.register = new uint8_1.Uint8(value);
    }
    Object.defineProperty(Register8bit.prototype, "register", {
        get: function () {
            return this._register;
        },
        set: function (value) {
            this._register = value;
        },
        enumerable: false,
        configurable: true
    });
    return Register8bit;
}());
exports.Register8bit = Register8bit;
