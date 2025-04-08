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

    draw(labelGroup) {
        this.labelVisible = !graph.options().compactNotation();
        return super.draw(labelGroup);
    }

    get label() {
        return this._label
    }

    // Disallow overwriting the label
    set label(p) {
        return
    }
}