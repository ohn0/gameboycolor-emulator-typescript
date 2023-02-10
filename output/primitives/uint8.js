"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uint8 = void 0;
var Uint8 = /** @class */ (function () {
    function Uint8(value) {
        this._ = value;
    }
    Object.defineProperty(Uint8.prototype, "_", {
        get: function () {
            return this.value;
        },
        set: function (value) {
            if (value > 255) {
                this.value = 255;
            }
            else {
                this.value = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    return Uint8;
}());
exports.Uint8 = Uint8;
