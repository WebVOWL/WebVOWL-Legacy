import { BaseProperty } from "../BaseProperty";

export class RdfsSubClassOf extends BaseProperty {
    constructor(graph) {
        super(graph)

        this._label = "Subclass of"
        this.linkType = "dotted"
        this.markerType = "white"
        this.styleClass = "subclass"
        this.type = "rdfs:subClassOf"
        this.baseIri = "http://www.w3.org/2000/01/rdf-schema#"
        this.iri = "http://www.w3.org/2000/01/rdf-schema#subClassOf"
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} labelGroup
     */
    draw(labelGroup) {
        this.labelVisible = !this.graph.options().compactNotation();
        return super.draw(labelGroup);
    }

    get label() {
        return this._label
    }

    // Disallow overwriting the label
    set label(p) {
        console.warn("Attempting to override disjoint label") // REVIEW: Check if this getter/setter pair are necessary
        return
    }
}