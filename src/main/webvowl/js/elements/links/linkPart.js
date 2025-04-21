import BaseNode from "../nodes/BaseNode"
import Label from "./Label"
import PlainLink from "./PlainLink"

export default class LinkPart {
    /**
     * A linkPart connects two force layout nodes.
     * It represents a link which can be used in d3's force layout.
     * @param {BaseNode | Label} domain
     * @param {BaseNode | Label} range
     * @param {PlainLink} link
     */
    constructor(domain, range, link) {
        this.domain = domain
        this.range = range
        this.link = link
        this.source = domain
        this.target = range
    }
}
