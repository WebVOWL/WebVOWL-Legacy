import { BaseProperty } from "../BaseProperty";

export class OwlInverseFunctionalProperty extends BaseProperty {
    constructor(graph) {
        super(graph)

        this.attributes = ["inverse functional"]
        this.styleClass = "inversefunctionalproperty"
        this.type = "owl:InverseFunctionalProperty"
    }
}