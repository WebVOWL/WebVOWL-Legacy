import { BaseProperty } from "../BaseProperty";

export class OwlSymmetricProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.attributes = ["symmetric"]
        this.styleClass = "symmetricproperty"
        this.type = "owl:SymmetricProperty"
    }
}