import Graph from "../../../graph"
import DatatypeNode from "../DatatypeNode"

export default class RdfsDataType extends DatatypeNode {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.dType = "undefined"
        this.attributes = ["datatype"]
        this.type = "rdfs:Datatype"
        this.styleClass = "datatype"
    }
}
