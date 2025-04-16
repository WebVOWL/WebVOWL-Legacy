import { BaseElement } from "../elements/BaseElement";
import { ElementTools } from "../util/elementTools";


export class Focuser {
    constructor(graph) {
        this.graph = graph
        /**
         * @type {BaseElement | undefined}
         */
        this.focusedElement = undefined
    }

    /**
     * @param {BaseElement | undefined} selectedElement
     * @param {boolean} forced
     */
    handle(selectedElement, forced = false) {
        // Don't display details on a drag event, which will be prevented
        if (d3.event && d3.event.defaultPrevented && !forced) {
            return;
        }

        if (this.focusedElement !== undefined) {
            this.focusedElement.toggleFocus();
        }

        if (selectedElement && this.focusedElement !== selectedElement) {
            selectedElement.toggleFocus();
            this.focusedElement = selectedElement;
        } else {
            this.focusedElement = undefined;
        }

        if (this.focusedElement && this.focusedElement.focused) {
            this.graph.options.editSidebar().updateSelectionInformation(this.focusedElement);
            if (ElementTools.isProperty(selectedElement) === true) {
                var inversed = false;
                if (selectedElement.inverse) {
                    inversed = true;
                }
                this.graph.activateHoverElementsForProperties(true, selectedElement, inversed, this.graph.isTouchDevice());
            }
            else {
                this.graph.activateHoverElements(true, selectedElement, this.graph.isTouchDevice());
            }
        }
        else {
            this.graph.options.editSidebar().updateSelectionInformation(undefined);
            this.graph.removeEditElements();
        }
    }

    /**
     * Removes the focus if an element is focussed.
     */
    reset() {
        if (this.focusedElement) {
            this.focusedElement.toggleFocus();
            this.focusedElement = undefined;
        }
    }
}