"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlagRegister = exports.Register8bit = void 0;
var uint8_1 = require("./primitives/uint8");
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
var FlagRegister = /** @class */ (function (_super) {
    __extends(FlagRegister, _super);
    function FlagRegister() {
        var _this = _super.call(this, 0) || this;
        _this._zeroFlag = false;
        _this._subtractionFlag = false;
        _this._halfCarryFlag = false;
        _this._carryFlag = false;
        return _this;
    }
    Object.defineProperty(FlagRegister.prototype, "zeroFlag", {
        get: function () {
            return this._zeroFlag;
        },
        set: function (value) {
            this._zeroFlag = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagRegister.prototype, "subtractionFlag", {
        get: function () {
            return this._subtractionFlag;
        },
        set: function (value) {
            this._subtractionFlag = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagRegister.prototype, "halfCarryFlag", {
        get: function () {
            return this._halfCarryFlag;
        },
        set: function (value) {
            this._halfCarryFlag = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagRegister.prototype, "carryFlag", {
        get: function () {
            return this._carryFlag;
        },
        set: function (value) {
            this._carryFlag = value;
        },
        enumerable: false,
        configurable: true
    });
    return FlagRegister;
}(Register8bit));
exports.FlagRegister = FlagRegister;
