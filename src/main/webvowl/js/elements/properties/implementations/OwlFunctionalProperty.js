import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"

export default class OwlFunctionalProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["functional"]
        this.styleClass = "functionalproperty"
        this.type = "owl:FunctionalProperty"
    }
}
