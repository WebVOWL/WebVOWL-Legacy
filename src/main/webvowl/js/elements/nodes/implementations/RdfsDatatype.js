import { DatatypeNode } from "../DatatypeNode"


export class RdfsDataType extends DatatypeNode {
    constructor(graph) {
        super(graph)

        this.dType = "undefined"
        this.attributes = ["datatype"]
        this.type = "rdfs:Datatype"
        this.styleClass = "datatype"
    }
}
