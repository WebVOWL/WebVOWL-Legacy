import { PlainLink } from "./PlainLink";

export class BoxArrowLink extends PlainLink {
    constructor(domain, range, property) {
        super(domain, range, property)
    }

    #createPropertyMarker(markerContainer, inverse) {
        var inverseMarker = this.#appendBasicMarker(markerContainer, inverse);
        inverseMarker.attr("refX", -8);
        inverseMarker.append("path")
            .attr("d", "M0,-8L8,0L0,8L-8,0L0,-8L8,0")
            .classed(inverse.markerType, true);
        inverse.markerElement = inverseMarker;
    }

    #createInverseMarker(markerContainer, property) {
        var marker = this.#appendBasicMarker(markerContainer, property);
        marker.attr("refX", 8);
        marker.append("path")
            .attr("d", "M0,-8L8,0L0,8L-8,0L0,-8L8,0")
            .classed(property.markerType, true);
        property.markerElement = marker;
    }

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

    draw(linkGroup, markerContainer) {
        var property = this.label.property;
        var inverse = this.label.inverse;

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
