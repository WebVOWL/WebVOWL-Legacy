import Graph from "../graph"

export default class AbstractDragger {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        if (this.constructor === AbstractDragger) {
            throw new Error("Abstract classes can't be instantiated")
        }

        this.graph = graph
        /**
         * @type {number | undefined}
         */
        this.id = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.parentNode = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.rootElement = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.rootNodeLayer = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.pathLayer = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.nodeElement = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.pathElement = undefined
        /**
         * @type {string | undefined}
         */
        this.type = undefined
    }

    updateElement() {
        throw new Error("Method updateElement() must be implemented")
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        throw new Error("Method setPosition() must be implemented")
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} layer
     */
    svgPathLayer(layer) {
        this.pathLayer = layer.append("g")
    }

    get svgRoot() {
        return this.rootElement
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} root
     */
    set svgRoot(root) {
        this.rootElement = root
        this.rootNodeLayer = this.rootElement.append("g")
    }
}
