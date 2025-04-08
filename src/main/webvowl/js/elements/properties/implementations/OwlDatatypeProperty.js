import { BaseProperty } from "../BaseProperty";

export class OwlDatatypeProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.attributes = ["datatype"]
        this.styleClass = "datatypeproperty"
        this.type = "owl:DatatypeProperty"
    }
}
