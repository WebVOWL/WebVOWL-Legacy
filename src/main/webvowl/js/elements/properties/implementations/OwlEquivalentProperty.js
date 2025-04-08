import { BaseProperty } from "../BaseProperty";

export class OwlEquivalentProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.styleClass = "equivalentproperty"
        this.type = "owl:equivalentProperty"
    }
}