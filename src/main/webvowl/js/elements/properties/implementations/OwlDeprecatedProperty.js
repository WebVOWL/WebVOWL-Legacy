import { BaseProperty } from "../BaseProperty"


export class OwlDeprecatedProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.attributes = ["deprecated"]
        this.styleClass = "deprecatedproperty"
        this.type = "owl:DeprecatedProperty"
    }
}