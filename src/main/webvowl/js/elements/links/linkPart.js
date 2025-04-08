/**
 * A linkPart connects two force layout nodes.
 * It reprents a link which can be used in d3's force layout.
 * @param domain
 * @param range
 * @param link
 */
export class LinkPart {
    constructor(domain, range, link) {
        this.domain = domain // REVIEW: Check if necessary to store
        this.range = range // REVIEW: Check if necessary to store
        this.link = link // REVIEW: Check if necessary to store
        this.source = domain
        this.target = range
    }
}