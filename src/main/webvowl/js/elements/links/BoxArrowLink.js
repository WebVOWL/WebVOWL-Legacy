import { BaseNode } from "../nodes/BaseNode";
import { BaseProperty } from "../properties/BaseProperty";
import { PlainLink } from "./PlainLink";

export class BoxArrowLink extends PlainLink {
    /**
     * @param {BaseNode} domain
     * @param {BaseNode} range
     * @param {BaseProperty} property
     */
    constructor(domain, range, property) {
        super(domain, range, property)
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} markerContainer
     * @param {BaseProperty} inverse
     */
    #createPropertyMarker(markerContainer, inverse) {
        var inverseMarker = this.#appendBasicMarker(markerContainer, inverse);
        inverseMarker.attr("refX", -8);
        inverseMarker.append("path")
            .attr("d", "M0,-8L8,0L0,8L-8,0L0,-8L8,0")
            .classed(inverse.markerType, true);
        inverse.markerElement = inverseMarker;
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} markerContainer
     * @param {BaseProperty} property
     */
    #createInverseMarker(markerContainer, property) {
        var marker = this.#appendBasicMarker(markerContainer, property);
        marker.attr("refX", 8);
        marker.append("path")
            .attr("d", "M0,-8L8,0L0,8L-8,0L0,-8L8,0")
            .classed(property.markerType, true);
        property.markerElement = marker;
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} markerContainer
     * @param {BaseProperty} property
     */
    #appendBasicMarker(markerContainer, property) {
        return markerContainer.append("marker")
            .datum(property)
            .attr("id", property.markerId())
            .attr("viewBox", "-10 -10 20 20")
            .attr("markerWidth", 20)
            .attr("markerHeight", 20)
            .attr("markerUnits", "userSpaceOnUse")
            .attr("orient", "auto");
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} linkGroup
     * @param {d3.Selection<any,any,null,undefined>} markerContainer
     */
    // @ts-ignore
    draw(linkGroup, markerContainer) {
        var property = this.label.property;
        var inverse = property.inverse;

        this.#createPropertyMarker(markerContainer, property);
        if (inverse) {
            this.#createInverseMarker(markerContainer, inverse);
        }

        super.draw(linkGroup);

        // attach the markers to the link
        linkGroup.attr("marker-start", "url(#" + property.markerId() + ")");
        if (inverse) {
            linkGroup.attr("marker-end", "url(#" + inverse.markerId() + ")");
        }
    }
}
