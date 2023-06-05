
export class Register16Bit{
    private _value! : number;
    private _registerName!: string;

    constructor(name: string) {
        this.registerName = name;
    }

    protected get value(){
        return this._value;
    }

    protected set value(value: number){
        if(value > 65535){
            throw new Error("ERROR: cannot set register " + this.registerName + " value to " + value + ". Value must be less than 65535");
        }
        else{
            this._value = value;
        }
    }

    public get registerName() {
        return this._registerName;
    }

    public set registerName(value) {
        this._registerName = value;
    }

    public setRegister(value: number) {
        this.value = value;
    }

    public getRegister(): number{
        return this.value;
    }
}