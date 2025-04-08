import CenteringTextElement from '../../../util/CenteringTextElement';
import { BaseProperty } from '../BaseProperty';

export class OwlDisjointWith extends BaseProperty {
    constructor(graph) {
        super(graph)

        this._label = "Disjoint With"
        this.linkType = "dashed"
        this.styleClass = "disjointwith"
        this.type = "owl:disjointWith"
        this.shapeElement
    }

    get label() {
        return this._label
    }

    // Disallow overwriting the label
    set label(p) {
        return
    }

    drawLabel(labelContainer) {
        shapeElement = this.addRect(labelContainer);

        labelContainer.append("circle")
            .classed("symbol", true)
            .classed("fineline", true)
            .classed("embedded", true)
            .attr("cx", -12.5)
            .attr("r", 10);

        labelContainer.append("circle")
            .classed("symbol", true)
            .classed("fineline", true)
            .classed("embedded", true)
            .attr("cx", 12.5)
            .attr("r", 10);

        var textElement = new CenteringTextElement(labelContainer, this.backgroundColor);
        if (!graph.options().compactNotation()) {
            textElement.addSubText("disjoint");
        }
        textElement.translation(0, 20);
    }

    markerElement() {
        return undefined;
    }
}