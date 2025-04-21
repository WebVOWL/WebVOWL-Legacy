import Graph from "../../../graph"
import RoundNode from "../RoundNode"

export default class ExternalClass extends RoundNode {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.attributes = ["external"]
        this.type = "ExternalClass"
    }
}
