import RoundNode from '../RoundNode';

export class ExternalClass extends RoundNode {
    constructor(graph) {
        super(graph)

        this.attributes = ["external"]
        this.type = "ExternalClass"
    }
}