import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"

export default class OwlSymmetricProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["symmetric"]
        this.styleClass = "symmetricproperty"
        this.type = "owl:SymmetricProperty"
    }
}
