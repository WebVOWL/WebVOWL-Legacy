import { BaseProperty } from "../BaseProperty";

export class OwlFunctionalProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.attributes = ["functional"]
        this.styleClass = "functionalproperty"
        this.type = "owl:FunctionalProperty"
    }
}