import { Label } from "./Label";

/**
 * A link connects at least two VOWL nodes.
 * The properties connecting the VOWL nodes are stored separately into the label.
 * @param domain
 * @param range
 * @param property
 */
export class PlainLink {
    constructor(domain, range, property) {
        this.layers
        this.layerIndex
        this.loops
        this.loopIndex // REVIEW: This property is not used
        this.pathElement
        this.label = new Label(property, this)

        this.backPart = require("./linkPart")(domain, label, this)
        this.frontPart = require("./linkPart")(label, range, this)
    }

    linkParts() {
        return [frontPart, backPart];
    }

    draw(linkGroup) {
        var property = this.label.property;
        var inverse = this.label.inverse;

        property.linkGroup = linkGroup;
        if (inverse) {
            inverse.linkGroup = linkGroup;
        }

        var pathElement = linkGroup.append("path");
        pathElement.classed("link-path", true)
            .classed(this.domain.cssClassOfNode(), true)
            .classed(this.range.cssClassOfNode(), true)
            .classed(property.linkType, true);
        this.pathElement = pathElement;
    }

    isLoop() {
        return this.domain.equals(this.range);
    }
}