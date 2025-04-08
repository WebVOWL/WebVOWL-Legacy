import { BaseProperty } from "../BaseProperty";

export class OwlTransitiveProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.attributes = ["transitive"]
        this.styleClass = "transitiveproperty"
        this.type = "owl:TransitiveProperty"
    }
}