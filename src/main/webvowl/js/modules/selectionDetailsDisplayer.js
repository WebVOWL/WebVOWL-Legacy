export class SelectionDetailsDisplayer {
    /**
     * @param {Function} handlerFunction
     */
    constructor(handlerFunction) {
        this.handlerFunction = handlerFunction
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.lastSelectedElement = undefined
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} selectedElement
     */
    handle(selectedElement) {
        // Don't display details on a drag event, which will be prevented
        if (d3.event.defaultPrevented) {
            return;
        }

        let isSelection = true;

        // Deselection of the focused element
        if (this.lastSelectedElement === selectedElement) {
            isSelection = false;
        }

        if (this.handlerFunction instanceof Function) {
            if (isSelection) {
                this.handlerFunction(selectedElement);
            } else {
                this.handlerFunction(undefined);
            }
        }

        if (isSelection) {
            this.lastSelectedElement = selectedElement;
        } else {
            this.lastSelectedElement = undefined;
        }
    }

    /**
     * Resets the displayed information to its default.
     */
    reset() {
        if (this.lastSelectedElement) {
            this.handlerFunction(undefined);
            this.lastSelectedElement = undefined;
        }
    }
}