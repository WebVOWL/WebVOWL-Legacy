import RoundNode from '../RoundNode';

export class RdfsResource extends RoundNode {
    constructor(graph) {
        super(graph)

        this.attributes = ["rdf"]
        this.label = "Resource"
        this.radius = 30
        this.styleClass = "rdfsresource"
        this.type = "rdfs:Resource"
    }

    draw(element) {
        super.draw(element, ["rdf", "dashed"]);
    }
}

