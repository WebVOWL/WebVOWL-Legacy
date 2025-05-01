import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"

export default class OwlObjectProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["object"]
        this.styleClass = "objectproperty"
        this.type = "owl:ObjectProperty"
    }
}
