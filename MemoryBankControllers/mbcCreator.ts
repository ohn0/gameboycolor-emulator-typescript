import { iMBC } from './iMBC';
import { MBC0 } from './MBC0';
export class mbcCreator{
    public static readonly MBC0: string = "MBC0";

    static getMBC(mbcType : string): iMBC{
        if (mbcType === this.MBC0) {
            return new MBC0();
        }

        throw new Error("ERROR: mbcType " + mbcType + " is not defined.");
    }
}