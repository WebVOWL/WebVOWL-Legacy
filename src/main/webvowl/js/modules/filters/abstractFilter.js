import BaseNode from "../../elements/nodes/BaseNode"
import BaseProperty from "../../elements/properties/BaseProperty"


export default class AbstractFilter {
    /**
     * @param {boolean} defaultState
     */
    constructor(defaultState) {
        if (this.constructor === AbstractFilter) {
            throw new Error("Abstract classes can't be instantiated")
        }
        this._defaultState = defaultState
        this.enabled = this._defaultState
        /**
         * @type {BaseNode[]}
         */
        this.filteredNodes = []
        /**
         * @type {BaseProperty[]}
         */
        this.filteredProperties = []
    }

    /**
     * @param {BaseNode[]} nodes
     * @param {BaseProperty[]} properties
     */
    filter(nodes, properties) {
        throw new Error("Method filter() must be implemented")
    }

    reset() {
        this.enabled = this._defaultState;
    }
}