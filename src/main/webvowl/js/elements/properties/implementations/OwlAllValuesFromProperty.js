import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"


export default class OwlAllValuesFromProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.linkType = "values-from"
        this.markerType = "filled values-from"
        this.styleClass = "allvaluesfromproperty"
        this.type = "owl:allValuesFrom"
    }

    generateCardinalityText() {
        let cardinalityText = "A";
        const superCardinalityText = super.generateCardinalityText();
        if (superCardinalityText) {
            cardinalityText += ", " + superCardinalityText;
        }
        return cardinalityText;
    }
}

