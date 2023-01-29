"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uint16 = void 0;
var uint8_1 = require("./uint8");
var Uint16 = /** @class */ (function () {
    function Uint16(Hi, Lo) {
        this.Hi8bits = new uint8_1.Uint8(Hi);
        this.Lo8bits = new uint8_1.Uint8(Lo);
        this._ = this.Hi8bits._ << 8 | this.Lo8bits._;
    }
    Object.defineProperty(Uint16.prototype, "Hi8bits", {
        get: function () {
            return this._Hi8bits;
        },
        set: function (value) {
            this._Hi8bits = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Uint16.prototype, "Lo8bits", {
        get: function () {
            return this._Lo8bits;
        },
        set: function (value) {
            this._Lo8bits = value;
        },
        enumerable: false,
        configurable: true
    });
    Uint16.prototype.get = function () {
        return this._;
    };
    return Uint16;
}());
exports.Uint16 = Uint16;
