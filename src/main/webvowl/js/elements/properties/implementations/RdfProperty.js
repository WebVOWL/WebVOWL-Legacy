import { BaseProperty } from "../BaseProperty";

export class RdfProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.attributes = ["rdf"]
        this.styleClass = "rdfproperty"
        this.type = "rdf:Property"
    }
}