import OwlThing from './OwlThing';

export class OwlNothing extends OwlThing {
    constructor(graph) {
        super(graph)

        this.label = "Nothing"
        this.type = "owl:Nothing"
        this.iri = "http://www.w3.org/2002/07/owl#Nothing"
    }
}