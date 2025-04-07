import RoundNode from '../RoundNode';

export class OwlDeprecatedClass extends RoundNode {
    constructor(graph) {
        super(graph)

        this.attributes = ["deprecated"]
        this.type = "owl:DeprecatedClass"
        this.styleClass = "deprecated"
        this.indications = ["deprecated"]
    }
}
