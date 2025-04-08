import { BaseProperty } from "../BaseProperty";

export class OwlObjectProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.attributes = ["object"]
        this.styleClass = "objectproperty"
        this.type = "owl:ObjectProperty"
    }
}