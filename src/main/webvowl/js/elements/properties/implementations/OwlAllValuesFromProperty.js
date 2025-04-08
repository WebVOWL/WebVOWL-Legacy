import { BaseProperty } from "../BaseProperty";

export class OwlAllValuesFromProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.linkType = "values-from"
        this.markerType = "filled values-from"
        this.styleClass = "allvaluesfromproperty"
        this.type = "owl:allValuesFrom"
    }

    generateCardinalityText() {
        var cardinalityText = "A";
        const superCardinalityText = super.generateCardinalityText();
        if (superCardinalityText) {
            cardinalityText += ", " + superCardinalityText;
        }
        return cardinalityText;
    }
}

