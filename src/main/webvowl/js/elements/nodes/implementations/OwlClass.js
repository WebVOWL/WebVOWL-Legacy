import Graph from "../../../graph"
import RoundNode from "../RoundNode"

export default class OwlClass extends RoundNode {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.type = "owl:Class"
    }
}