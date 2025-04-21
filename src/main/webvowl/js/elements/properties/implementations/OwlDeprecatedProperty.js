import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"

export default class OwlDeprecatedProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["deprecated"]
        this.styleClass = "deprecatedproperty"
        this.type = "owl:DeprecatedProperty"
    }
}
