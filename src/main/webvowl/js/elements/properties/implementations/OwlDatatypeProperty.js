import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"

export default class OwlDatatypeProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["datatype"]
        this.styleClass = "datatypeproperty"
        this.type = "owl:DatatypeProperty"
    }
}
