import BaseElement from "../elements/BaseElement"
import Graph from "../graph"
import ElementTools from "../util/elementTools"

export default class Focuser {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        this.graph = graph
        /**
         * @type {BaseElement | undefined}
         */
        this.focusedElement = undefined
    }

    /**
     * @param {BaseElement | undefined} selectedElement Node is a d.3 selection
     * @param {boolean} forced
     */
    handle(selectedElement, forced = false) {
        // Don't display details on a drag event, which will be prevented
        if (d3.event && d3.event.defaultPrevented && !forced) {
            return
        }

        if (this.focusedElement !== undefined) {
            this.focusedElement.toggleFocus()
        }

        if (selectedElement && this.focusedElement !== selectedElement) {
            selectedElement.toggleFocus()
            this.focusedElement = selectedElement
        } else {
            this.focusedElement = undefined
        }

        if (this.focusedElement && this.focusedElement.focused) {
            this.graph.options.editSidebar.updateSelectionInformation(
                this.focusedElement,
            )
            if (ElementTools.isProperty(selectedElement) === true) {
                const inversed = Boolean(selectedElement.inverse)
                this.graph.activateHoverElementsForProperties(
                    true,
                    selectedElement,
                    inversed,
                    this.graph.touchDevice,
                )
            } else {
                this.graph.activateHoverElements(
                    true,
                    selectedElement,
                    this.graph.touchDevice,
                )
            }
        } else {
            this.graph.options.editSidebar.updateSelectionInformation(undefined)
            this.graph.removeEditElements()
        }
    }

    /**
     * Removes the focus if an element is focussed.
     */
    reset() {
        if (this.focusedElement) {
            this.focusedElement.toggleFocus()
            this.focusedElement = undefined
        }
    }
}
