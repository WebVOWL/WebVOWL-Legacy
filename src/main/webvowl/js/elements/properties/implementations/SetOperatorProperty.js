import Graph from "../../../graph"
import BaseProperty from "../BaseProperty"

export default class SetOperatorProperty extends BaseProperty {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)

        this.labelVisible = false
        this.linkType = "dashed"
        this.markerType = "white"
        this.styleClass = "setoperatorproperty"
        this.type = "setOperatorProperty"
    }
}
