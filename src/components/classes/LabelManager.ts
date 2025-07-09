import { LabelClass, REF_File } from "./RichEntityFormat";

const labelColors = ["red-11", "blue-11", "light-green-11", "deep-orange-11", "pink-11", "light-blue-11", "lime-11", "brown-11", "purple-11", "cyan-11", "yellow-11", "grey-11", "deep-purple-11", "teal-11", "amber-11", "blue-grey-11", "indigo-11", "green-11", "orange-11"];

export class Label {
    public id: number;
    public name: string;
    public color: string;

    constructor(id: number, name: string, color: string) {
        this.id = id;
        this.name = name;
        this.color = color;
    }
}

export class LabelManager {
    private labels: Label[] = [];

    public get allLabels(): Label[] {
        return this.labels;
    };
    public get lastId(): number {return this.labels.length};
    public currentLabel: Label|undefined;

    constructor(initialLabels: Label[] = []) {
        this.labels = initialLabels;
        this.currentLabel = this.labels.length > 0 ? this.labels[0]: undefined;
    }

    public addLabel(name: string) {
        this.labels.push(new Label(this.labels.length + 1, name, this.generateRandomColor()));
    }

    public deleteLabel(name: string) {
        this.labels = this.labels.filter(label => label.name != name);
    }

    public getLabelByName(name: string): Label | undefined {
        return this.labels.find(label => label.name == name);
    }

    public generateRandomColor(): string {
        return labelColors[this.lastId % labelColors.length];
    }

    public static fromREF(json: REF_File): LabelManager {
        return new LabelManager(json.classes?.map((c: LabelClass) => new Label(c.id, c.name, c.color)));
    }

    public setCurrentLabel(name: string): void {
        const label = this.getLabelByName(name);
        if (label) {
            this.currentLabel = label;
        } else {
            throw new Error(`Label with name ${name} does not exist.`);
        }
    }
}