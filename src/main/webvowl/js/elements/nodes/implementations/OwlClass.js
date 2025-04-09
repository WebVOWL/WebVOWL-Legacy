import { RoundNode } from "../RoundNode"

export class OwlClass extends RoundNode {
    constructor(graph) {
        super(graph)

        this.type = "owl:Class"
    }
}