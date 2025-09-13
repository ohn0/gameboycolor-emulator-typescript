import { Bank } from './bank';
import { iMBC } from './iMBC';
import { mbcCreator } from './mbcCreator';
import { Logger } from '../../logger/logger';
export class MBC1 implements iMBC{


    RamSize!: number;
    RomSize!: number;
    MbcType = "MBC1";
    private _bankWasChanged!: boolean;
    public get bankWasChanged(): boolean {
        return this._bankWasChanged;
    }
    public set bankWasChanged(value: boolean) {
        this._bankWasChanged = value;
    }
    initialBank!: Bank;
    banks!: Bank[];
    ramBanks!: Bank[];
    private currentBankIndex = 1;
    public cartridge!: Uint8Array;
    public EnableRamRegister = false;
    RomBankNumber = 0;
    private RamBankNumber = 0;
    private BankingModeRegister = 0;
    private numberOfBanks = 0;
    private bankBitMask = 0;
    private gameSize = 0;
    private readonly RomBankNumberThreshold = 1048576;
    private readonly RamBankSizeThreshold = 524288;
    private logger!: Logger;

    configure(gameData: Uint8Array, logger: Logger): void {
        this.logger = logger;
        this._bankWasChanged = false;
        this.banks = new Array<Bank>(128);
        this.ramBanks = new Array<Bank>(4);
        const gameSize = gameData.length;
        this.gameSize = gameSize;
        this.cartridge = gameData;
        let byteIndex = 0x4000;
        let bankIndex = 1;
        this.RomSize = mbcCreator.getRomSize(gameData[0x148]);
        this.RamSize = mbcCreator.getRamSize(gameData[0x149]);
        //configure ROM bank 00
        this.initialBank = new Bank();
        this.initialBank.romBank = gameData.slice(0, 0x4000);
        this.banks[0] = this.initialBank;
        // this.logger.logArray(Array.from(this.banks[0].romBank));
        this.numberOfBanks = this.RomSize / 0x4000;
        this.bankBitMask = this.numberOfBanks - 1;
        //configure ROM bank 01 - ([total possible ROM banks] - 1)
        while (gameSize - byteIndex > 0x4000) {
            this.banks[bankIndex] = new Bank();
            this.banks[bankIndex].romBank = gameData.slice(byteIndex, byteIndex + 0x4000);
            // this.logger.logArray(Array.from(this.banks[bankIndex].romBank));
            bankIndex++;
            byteIndex += 0x4000;
        }

        //configure final ROM bank with remainder of bytes
        if (gameSize - byteIndex >= 0) {
            this.banks[bankIndex] = new Bank();
            this.banks[bankIndex].romBank = gameData.slice(byteIndex, gameSize);
            // this.logger.logArray(Array.from(this.banks[bankIndex].romBank));
        }

        if (this.RomSize <= this.RamBankSizeThreshold) {
            this.ramBanks.forEach((ramBank) => {
                ramBank = new Bank();
                ramBank.romBank = new Uint8Array(0x2000);
            });
        }
        else {
            this.ramBanks[0] = new Bank();
            this.ramBanks[0].romBank = new Uint8Array(0x2000);
        }

        // this.logger.logToFile();
    }
    
    updateBankIndex(memoryLocation: number, value: number): void {
        if (memoryLocation >= 0x2000 && memoryLocation <= 0x3FFF) {
            let lower5Bits = value & 0x1F;
            lower5Bits = lower5Bits & this.bankBitMask;
            if (this.numberOfBanks > 32) {
                lower5Bits = (this.RamBankNumber << 5) + lower5Bits;
            } else {
                // this.currentBankIndex &= 0b1100000;
                if (lower5Bits == 0x00) {
                    if ((value & 0x10) != 0) {
                        lower5Bits = 0x00;
                    } else {
                        lower5Bits = 0x01;
                    }
                }
            }

            this.RomBankNumber = lower5Bits;
            this.bankWasChanged = true;
        }
        else if (memoryLocation >= 0x4000 && memoryLocation <= 0x5FFF) {
            const upper2Bits = value & 0x03
            if (this.RamSize == 0x8000) {
                this.RamBankNumber = upper2Bits;
            }

            // if (this.RomSize >= this.RomBankNumberThreshold) {
            //     this.RomBankNumber |= ((upper2Bits << 5))
            // }
            this.bankWasChanged = true;
        }
        else if (memoryLocation >= 0x6000 && memoryLocation <= 0x7FFF) {
            value = value & 0x01;
            if (this.RamSize > 0x2000 && this.RomSize > 0x80000) {
                this.BankingModeRegister = value;
            }
        }
    }
    
    interceptWrite(memoryWrite: { address: number; value: number; }): void {
        this.bankWasChanged = false;
        
        if (memoryWrite.address >= 0x0000 && memoryWrite.address <= 0x1FFF) {
            console.log(`toggling EnableRamRegister`)
            if ((memoryWrite.value & 0x000A) == 0x0A) {
                this.EnableRamRegister = true;
            }
            else {
                this.EnableRamRegister = false;
            }
        }
        else if (memoryWrite.address >= 0x2000 && memoryWrite.address <= 0x5FFF) {
            this.updateBankIndex(memoryWrite.address, memoryWrite.value);
        }
        else if (memoryWrite.address >= 0x6000 && memoryWrite.address <= 0x7FFF) {
            // 0 : default, 0x0000 - 0x3FFF and 0xA000 - 0xBFFF are locked to bank 0
            // 1 : advanced, banks can be switched by RomBankNumber register
            // console.log(`toggling bankModeRegister`)
            this.BankingModeRegister = memoryWrite.value & 1;
        }
    }

    interceptRead(address: number): number {
        const hexAddress = `0x${address.toString(16).toLocaleUpperCase().padStart(8, '0')}`;
        if (address <= 0x3FFF) {
            // console.log(`reading ${hexAddress}, RamBankNumber = ${this.RamBankNumber}, < 0x3FFF, returning ${this.BankingModeRegister == 1 ? (this.RamBankNumber << 19 | address) : hexAddress}`);
            return this.BankingModeRegister == 1
                ? ((this.RamBankNumber << 19) | address)
                : address;
        }

        if (address >= 0x4000 && address <= 0x7FFF) {
            let newAddress = (address | (this.RomBankNumber << 14)) | (this.RamBankNumber << 19);
            if (newAddress > this.RomSize) {
                newAddress &= (this.RomSize-1)
            }
            if (this.RomBankNumber  > 1) {
                // console.log(`reading ${hexAddress},${this.RomBankNumber} >= 0x4000 & <= 0x7FFF, returning ${hexAddress}`);
            }
            return newAddress % 0x4000;
        }

        if (address >= 0xA000 && address <= 0xBFFF) {
            // console.log(`reading ${address}, >= 0xA000 && <= 0xBFFF, returning ${this.BankingModeRegister == 1 ? (this.RamBankNumber << 13) | address : address}`);
            return this.BankingModeRegister == 1
                ? (this.RamBankNumber << 13) | address
                : address;
        }

        return address;
    }

    writeToRam(address: number, value: number): void {
        if (this.BankingModeRegister == 1) {
            this.ramBanks[this.RamBankNumber].romBank[address] = value;
        }
        else {
            this.ramBanks[0].romBank[address] = value;
        }
    }

    readFromRam(address: number): number {
        if (!this.EnableRamRegister) return 0xFF;
        if (this.BankingModeRegister == 1) {
            // console.log(this.ramBanks[this.RamBankNumber].romBank[address]);
            return this.ramBanks[this.RamBankNumber].romBank[address];
        }
        return this.ramBanks[0].romBank[address];
    }

    canUseRam(): boolean {
        return this.EnableRamRegister;
    }
}