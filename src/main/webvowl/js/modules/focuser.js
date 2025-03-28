module.exports = function (graph) {
    let focuser = {},
        focusedElement;
    let elementTools = webvowl.util.elementTools();
    focuser.handle = function (event, selectedElement, forced) {
        // Don't display details on a drag event, which will be prevented
        if (event && event.defaultPrevented && forced === undefined) {
            return;
        }

        if (focusedElement !== undefined) {
            focusedElement.toggleFocus();
        }

        if (focusedElement !== selectedElement && selectedElement) {
            selectedElement.toggleFocus();
            focusedElement = selectedElement;
        } else {
            focusedElement = undefined;
        }
        if (focusedElement && focusedElement.focused()) {
            graph.options().editSidebar().updateSelectionInformation(focusedElement);
            if (elementTools.isProperty(selectedElement) === true) {
                let inversed = false;
                if (selectedElement.inverse()) {
                    inversed = true;
                }
                graph.activateHoverElementsForProperties(true, selectedElement, inversed, graph.isTouchDevice());
            }
            else {
                graph.activateHoverElements(true, selectedElement, graph.isTouchDevice());
            }
        }
        else {
            graph.options().editSidebar().updateSelectionInformation(undefined);
            graph.removeEditElements();
        }
    };

    /**
     * Removes the focus if an element is focussed.
     */
    focuser.reset = function () {
        if (focusedElement) {
            focusedElement.toggleFocus();
            focusedElement = undefined;
        }
    };

    return focuser;
};
