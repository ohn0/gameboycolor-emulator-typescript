import { Logger } from "../../logger/logger";
import { INTERRUPT_SOURCES } from "../cpu/constants";
import { InterruptHandler } from "../cpu/InterruptHandler";
import { RAM } from "../RAM/RAM";

export class JoyPad{
    private logger!: Logger;
    private ram!: RAM;
    private interruptHandler!: InterruptHandler;
    private readonly joypadRegister = 0xFF00;
    readonly DpadState = 0x20;
    readonly ButtonState = 0x10;
    readonly ResetState = 0x30;
    selectedButton : number = 0;
    inputMode = new Map([
        [0x30,"NONE" ],
        [0x10,"DPAD" ],
        [ 0x20,"BUTTONS"]
    ]);
    buttonMapping = new Map([
        ["START",  { value : 0b00010111, isPressed : false, buttonType : "BUTTON"}],["DOWN",   { value : 0b00100111, isPressed : false, buttonType : "DPAD"}],
        ["SELECT", { value : 0b00011011, isPressed : false, buttonType : "BUTTON"}],["UP",     { value : 0b00101011, isPressed : false, buttonType : "DPAD"}],
        ["B",      { value : 0b00011101, isPressed : false, buttonType : "BUTTON"}],["LEFT",   { value : 0b00101101, isPressed : false, buttonType : "DPAD"}],
        ["A",      { value : 0b00011110, isPressed : false, buttonType : "BUTTON"}],["RIGHT",  { value : 0b00101110, isPressed : false, buttonType : "DPAD"}]

    ])
    constructor(ram: RAM, interruptHandler :InterruptHandler, logger: Logger) {
        this.ram = ram;
        this.logger = logger;
        this.interruptHandler = interruptHandler;
        this.ram.write(this.joypadRegister, 0xFF);
    }

    inputKey(button: string, buttonType : string) {
        var selectedButton = this.buttonMapping.get(button);
        if(selectedButton != undefined){
            selectedButton.isPressed = true;
        }
        else{
            throw Error("invalid button selected");
        }
    }

    resetButtons(){
        this.buttonMapping.forEach(m => m.isPressed = false);
    }

    initListeners(){
        window.addEventListener("keydown", (event) => {
            if(event.code == "ArrowDown"){
                this.inputKey("DOWN", "DPAD")
            }

            if(event.code == "ArrowUp"){
                this.inputKey("UP", "DPAD")
            }

            if(event.code == "ArrowLeft"){
                this.inputKey("LEFT", "DPAD")
            }

            if(event.code == "ArrowRight"){
                this.inputKey("RIGHT", "DPAD")
            }

            if(event.code == "KeyZ"){
                this.inputKey("A", "BUTTONS")
            }

            if(event.code == "Enter"){
                this.inputKey("START", "BUTTONS")
            }

            if(event.code == "Space"){
                this.inputKey("SELECT", "BUTTONS")
            }

            if(event.code == "KeyX"){
                this.inputKey("B", "BUTTONS")
            }            
        } )
    }

}