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
exports.ProgramCounter = exports.StackPointer = exports.HiLoRegister = exports.Register16Bit = void 0;
var Register16Bit = /** @class */ (function () {
    function Register16Bit(name) {
        this.registerName = name;
    }
    Object.defineProperty(Register16Bit.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (value) {
            if (value > 65535) {
                throw new Error("ERROR: cannot set register " + this.registerName + " value to " + value + ". Value must be less than 65535");
            }
            else {
                this._value = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Register16Bit.prototype, "registerName", {
        get: function () {
            return this._registerName;
        },
        set: function (value) {
            this._registerName = value;
        },
        enumerable: false,
        configurable: true
    });
    return Register16Bit;
}());
exports.Register16Bit = Register16Bit;
var HiLoRegister = /** @class */ (function (_super) {
    __extends(HiLoRegister, _super);
    function HiLoRegister(Hi, Lo, RegisterName) {
        var _this = _super.call(this, RegisterName) || this;
        _this.HiRegister = Hi;
        _this.LoRegister = Lo;
        return _this;
    }
    Object.defineProperty(HiLoRegister.prototype, "LoRegister", {
        get: function () {
            return this._LoRegister;
        },
        set: function (value) {
            this._LoRegister = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HiLoRegister.prototype, "HiRegister", {
        get: function () {
            return this._HiRegister;
        },
        set: function (value) {
            this._HiRegister = value;
        },
        enumerable: false,
        configurable: true
    });
    HiLoRegister.prototype.getRegister = function () {
        if (this.LoRegister !== undefined && this.HiRegister !== undefined) {
            this.value = this.HiRegister.register._ << 8 | this.LoRegister.register._;
            return this.value;
        }
        else if (this.HiRegister !== undefined) {
            return this.HiRegister.register._ << 8 | 0;
        }
        else {
            throw new Error("ERROR: Both low and high registers are undefined");
        }
    };
    return HiLoRegister;
}(Register16Bit));
exports.HiLoRegister = HiLoRegister;
var StackPointer = /** @class */ (function (_super) {
    __extends(StackPointer, _super);
    function StackPointer(registerName) {
        return _super.call(this, registerName) || this;
    }
    return StackPointer;
}(Register16Bit));
exports.StackPointer = StackPointer;
var ProgramCounter = /** @class */ (function (_super) {
    __extends(ProgramCounter, _super);
    function ProgramCounter(registerName) {
        return _super.call(this, registerName) || this;
    }
    return ProgramCounter;
}(Register16Bit));
exports.ProgramCounter = ProgramCounter;
