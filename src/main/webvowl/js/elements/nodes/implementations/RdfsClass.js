import RoundNode from '../RoundNode';

export class RdfsClass extends RoundNode {
    constructor(graph) {
        super(graph)

        this.attributes = ["rdf"]
        this.type = "rdfs:Class"
    }
}