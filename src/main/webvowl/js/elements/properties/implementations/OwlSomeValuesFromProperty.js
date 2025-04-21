import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"


export default class OwlSomeValuesFromProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.linkType = "values-from"
        this.markerType = "filled values-from"
        this.styleClass = "somevaluesfromproperty"
        this.type = "owl:someValuesFrom"
    }

    generateCardinalityText() {
        let cardinalityText = "E";
        const superCardinalityText = super.generateCardinalityText();

        if (superCardinalityText) {
            cardinalityText += ", " + superCardinalityText;
        }
        return cardinalityText;
    }
}