module.exports = function (handlerFunction) {
    let viewer = {},
        lastSelectedElement;

    viewer.handle = function (event, selectedElement) {
        // Don't display details on a drag event, which will be prevented
        if (event.defaultPrevented) {
            return;
        }

        let isSelection = true;

        // Deselection of the focused element
        if (lastSelectedElement === selectedElement) {
            isSelection = false;
        }

        if (handlerFunction instanceof Function) {
            if (isSelection) {
                handlerFunction(selectedElement);
            } else {
                handlerFunction(undefined);
            }
        }

        if (isSelection) {
            lastSelectedElement = selectedElement;
        } else {
            lastSelectedElement = undefined;
        }
    };

    /**
     * Resets the displayed information to its default.
     */
    viewer.reset = function () {
        if (lastSelectedElement) {
            handlerFunction(undefined);
            lastSelectedElement = undefined;
        }
    };

    return viewer;
};
