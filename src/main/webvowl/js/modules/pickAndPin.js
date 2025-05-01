import _ from "lodash/array"
import BaseElement from "../elements/BaseElement"
import BaseProperty from "../elements/properties/BaseProperty"
import ElementTools from "../util/elementTools"

export default class PickAndPin {
    constructor() {
        this.enabled = false
        /**
         * @type {BaseElement[]}
         */
        this.pinnedElements = []
    }

    /**
     * @param {BaseElement} element
     */
    addPinnedElement(element) {
        // check if element is already in list
        if (this.pinnedElements.indexOf(element) === -1) {
            this.pinnedElements.push(element)
        }
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} selection
     * @param {boolean} forced
     */
    handle(selection, forced) {
        if (!this.enabled) {
            return
        }

        if (!forced) {
            if (!d3.event.defaultPrevented) {
                // was not dragged
                return
            }
        }
        if (ElementTools.isProperty(selection)) {
            if (selection.inverse && selection.inverse.pinned) {
                return
            } else if (this.#hasNoParallelProperties(selection)) {
                return
            }
        }

        if (!selection.pinned) {
            selection.drawPin()
            this.addPinnedElement(selection)
        }
    }

    /**
     * @param {BaseProperty} property
     */
    #hasNoParallelProperties(property) {
        return (
            (_.intersection = property.domain.links),
            property.range.links.length === 1
        )
    }

    reset() {
        for (const element of this.pinnedElements) {
            element.removePin()
        }
        this.pinnedElements = []
    }
}
