import { BaseProperty } from "../BaseProperty";

export class OwlSomeValuesFromProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.linkType = "values-from"
        this.markerType = "filled values-from"
        this.styleClass = "somevaluesfromproperty"
        this.type = "owl:someValuesFrom"
    }

    generateCardinalityText() {
        var cardinalityText = "E";
        const superCardinalityText = super.generateCardinalityText();

        if (superCardinalityText) {
            cardinalityText += ", " + superCardinalityText;
        }
        return cardinalityText;
    }
}