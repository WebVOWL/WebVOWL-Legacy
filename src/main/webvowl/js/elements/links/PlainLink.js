import { BaseNode } from "../nodes/BaseNode";
import { BaseProperty } from "../properties/BaseProperty";
import { Label } from "./Label";
import { LinkPart } from "./linkPart";

/**
 * A link connects at least two VOWL nodes.
 * The properties connecting the VOWL nodes are stored separately into the label.
 */
export class PlainLink {
    /**
     * @param {BaseNode} domain
     * @param {BaseNode} range
     * @param {BaseProperty} property
     */
    constructor(domain, range, property) {
        // this.layers
        // this.layerIndex
        this.domain = domain
        this.range = range
        this.loops = undefined
        this.loopIndex = undefined // REVIEW: This property is not used
        this.pathElement
        this.label = new Label(property, this)
        this.backPart = new LinkPart(domain, this.label, this)
        this.frontPart = new LinkPart(this.label, range, this)
    }

    linkParts() {
        return [this.frontPart, this.backPart];
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} linkGroup
     */
    draw(linkGroup) {
        var property = this.label.property;
        var inverse = property.inverse;

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