let _ = require("lodash/array");
let elementTools = require("../util/elementTools")();

module.exports = function () {
    let pap = {},
        enabled = false,
        pinnedElements = [];

    pap.addPinnedElement = function (element) {
        // check if element is already in list
        let indexInArray = pinnedElements.indexOf(element);
        if (indexInArray === -1) {
            pinnedElements.push(element);
        }
    };

    pap.handle = function (event, selection, forced) {
        if (!enabled || !(forced && event.defaultPrevented)) {
            return;
        }
        if (elementTools.isProperty(selection)) {
            if (selection.inverse() && selection.inverse().pinned() || hasNoParallelProperties(selection)) {
                return;
            }
        }

        if (!selection.pinned()) {
            selection.drawPin();
            pap.addPinnedElement(selection);
        }
    };

    function hasNoParallelProperties(property) {
        return _.intersection(property.domain().links(), property.range().links()).length === 1;
    }

    pap.enabled = function (p) {
        if (!arguments.length) return enabled;
        enabled = p;
        return pap;
    };

    pap.reset = function () {
        pinnedElements.forEach(function (element) {
            element.removePin();
        });
        // Clear the array of stored nodes
        pinnedElements.length = 0;
    };

    return pap;
};
