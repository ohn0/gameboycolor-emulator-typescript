export class Attribute {
    priority : number;
    yflip : number;
    xflip : number;
    bank : number;
    palette: number;

    constructor(priority : number, yflip : number, xflip : number, bank : number, palette : number){
        this.priority = priority;
        this.yflip = yflip;
        this.xflip = xflip;
        this.bank = bank;
        this.palette = palette;
    }
    
}