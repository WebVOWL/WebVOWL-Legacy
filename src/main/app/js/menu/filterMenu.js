import d3 from "d3";

export default class FilterMenu {
    /**
     * Contains the logic for connecting the filters with the website.
     * @param {any} graph required for calling a refresh after a filter change
     */
    constructor(graph) {
        this.graph = graph;
        /**
         * @type {any[]}
         */
        this.checkboxData = [];
        this.menuElement = d3.select("#m_filter");
        this.menuControl = d3.select("#c_filter a");
        this.nodeDegreeContainer = d3.select("#nodeDegreeFilteringOption");
        this.graphDegreeLevel = undefined;
        this.defaultDegreeValue = 0;
        this.degreeSlider = undefined;
    }

    setDefaultDegreeValue(/** @type {any} */ val) {
        this.defaultDegreeValue = val;
    };

    getDefaultDegreeValue() {
        return this.defaultDegreeValue;
    };

    getGraphObject() {
        return this.graph;
    };
    /** some getter function  **/
    getCheckBoxContainer() {
        return this.checkboxData;
    };

    getDegreeSliderValue() {
        return this.degreeSlider.property("value");
    };

    /**
     * Connects the website with graph filters.
     * @param {any} datatypeFilter filter for all datatypes
     * @param {any} objectPropertyFilter filter for all object properties
     * @param {any} subclassFilter filter for all subclasses
     * @param {any} disjointFilter filter for all disjoint with properties
     * @param {any} setOperatorFilter filter for all set operators with properties
     * @param {any} nodeDegreeFilter filters nodes by their degree
     */
    setup(datatypeFilter, objectPropertyFilter, subclassFilter, disjointFilter, setOperatorFilter, nodeDegreeFilter) {
        const _this = this;
        this.menuControl.on("mouseover", function () {
            var searchMenu = _this.graph.options.searchMenu;
            searchMenu.hideSearchEntries();
        });
        this.menuControl.on("mouseleave", function () {
            _this.highlightForDegreeSlider(false);
        });

        this.addFilterItem(datatypeFilter, "datatype", "Datatype properties", "#datatypeFilteringOption");
        this.addFilterItem(objectPropertyFilter, "objectProperty", "Object properties", "#objectPropertyFilteringOption");
        this.addFilterItem(subclassFilter, "subclass", "Solitary subclasses", "#subclassFilteringOption");
        this.addFilterItem(disjointFilter, "disjoint", "Class disjointness", "#disjointFilteringOption");
        this.addFilterItem(setOperatorFilter, "setoperator", "Set operators", "#setOperatorFilteringOption");

        this.addNodeDegreeFilter(nodeDegreeFilter, this.nodeDegreeContainer);
        this.addAnimationFinishedListener();
    };


    /**
     * @param {{ enabled: any; }} filter
     * @param {string} identifier
     * @param {string | number | boolean | d3.ValueFn<HTMLLabelElement, any, string | number | boolean>} pluralNameOfFilteredItems
     * @param {any} selector
     */
    addFilterItem(filter, identifier, pluralNameOfFilteredItems, selector) {
        var filterContainer;
        /**
         * @type {d3.Selection<HTMLInputElement, any, null, undefined>}
         */
        var filterCheckbox;

        filterContainer = d3.select(selector)
            .append("div")
            .classed("checkboxContainer", true);

        filterCheckbox = filterContainer.append("input")
            .classed("filterCheckbox", true)
            .attr("id", identifier + "FilterCheckbox")
            .attr("type", "checkbox")
            .property("checked", filter.enabled);

        // Store for easier resetting
        this.checkboxData.push({ checkbox: filterCheckbox, defaultState: filter.enabled });

        const _this = this;
        filterCheckbox.on("click", function (silent) {
            // There might be no parameters passed because of a manual
            // invocation when resetting the filters
            filter.enabled = filterCheckbox.property("checked");
            if (silent !== true) {
                // updating graph when silent is false or the parameter is not given.
                _this.graph.update();
            }
        });

        filterContainer.append("label")
            .attr("for", identifier + "FilterCheckbox")
            .text(pluralNameOfFilteredItems);
    }

    /**
     * @param {{ maxDegreeSetter: (maxDegree: any) => void; degreeGetter: () => any; degreeSetter: (value: any) => void; }} nodeDegreeFilter
     * @param {any} container
     */
    addNodeDegreeFilter(nodeDegreeFilter, container) {
        const _this = this;
        nodeDegreeFilter.maxDegreeSetter = function (maxDegree) {
            _this.degreeSlider.attr("max", maxDegree);
            _this.setSliderValue(_this.degreeSlider, Math.min(maxDegree, _this.degreeSlider.property("value")));
        };

        nodeDegreeFilter.degreeGetter = function () {
            return _this.degreeSlider.property("value");
        };

        nodeDegreeFilter.degreeSetter = function (value) {
            _this.setSliderValue(_this.degreeSlider, value);
        };

        var sliderContainer;
        /**
         * @type {{ text: (arg0: any) => void; }}
         */
        var sliderValueLabel;

        sliderContainer = container.append("div")
            .classed("distanceSliderContainer", true);

        this.degreeSlider = sliderContainer.append("input")
            .attr("id", "nodeDegreeDistanceSlider")
            .attr("type", "range")
            .attr("min", 0)
            .attr("step", 1);

        sliderContainer.append("label")
            .classed("description", true)
            .attr("for", "nodeDegreeDistanceSlider")
            .text("Degree of collapsing");

        sliderValueLabel = sliderContainer.append("label")
            .classed("value", true)
            .attr("for", "nodeDegreeDistanceSlider")
            .text(0);


        this.degreeSlider.on("change", function (/** @type {boolean} */ silent) {
            if (silent !== true) {
                _this.graph.update();
                _this.graphDegreeLevel = _this.degreeSlider.property("value");
            }
        });


        this.degreeSlider.on("input", function () {
            var degree = _this.degreeSlider.property("value");
            sliderValueLabel.text(degree);
        });


        // adding wheel events
        this.degreeSlider.on("wheel", this.handleWheelEvent);
        this.degreeSlider.on("focusout", function () {
            if (_this.degreeSlider.property("value") !== _this.graphDegreeLevel) {
                _this.graph.update();
            }
        });
    }

    handleWheelEvent() {
        // @ts-ignore
        var wheelEvent = d3.event;

        var offset;
        if (wheelEvent.deltaY < 0) offset = 1;
        if (wheelEvent.deltaY > 0) offset = -1;
        var maxDeg = parseInt(this.degreeSlider.attr("max"));
        var oldVal = parseInt(this.degreeSlider.property("value"));
        var newSliderValue = oldVal + offset;
        if (oldVal !== newSliderValue && (newSliderValue >= 0 && newSliderValue <= maxDeg)) {
            // only update when they are different [reducing redundant updates]
            // set the new value and emit an update signal
            this.degreeSlider.property("value", newSliderValue);
            this.degreeSlider.on("input")();// <<-- sets the text value
            this.graph.update();
        }
        // @ts-ignore
        d3.event.preventDefault();
    }

    /**
     * @param {{ property: (arg0: string, arg1: any) => { (): any; new (): any; on: { (arg0: string): { (): void; new (): any; }; new (): any; }; }; }} slider
     * @param {any} value
     */
    setSliderValue(slider, value) {
        slider.property("value", value).on("input")();
    }

    /**
     * Resets the filters (and also filtered elements) to their default.
     */
    reset() {
        this.checkboxData.forEach(function (checkboxData) {
            var checkbox = checkboxData.checkbox,
                enabledByDefault = checkboxData.defaultState,
                isChecked = checkbox.property("checked");

            if (isChecked !== enabledByDefault) {
                checkbox.property("checked", enabledByDefault);
                // Call onclick event handlers programmatically
                checkbox.on("click")();
            }
        });

        // setSliderValue(degreeSlider, 0);
        this.degreeSlider.on("change")();
    };

    addAnimationFinishedListener() {
        const _this = this;
        // @ts-ignore
        this.menuControl.node().addEventListener("animationend", function () {
            _this.menuControl.classed("buttonPulse", false);
            _this.menuControl.classed("filterMenuButtonHighlight", true);

        });
    }

    killButtonAnimation() {
        this.menuControl.classed("buttonPulse", false);
        this.menuControl.classed("filterMenuButtonHighlight", false);
    };


    /**
     * @param {boolean} enable
     */
    highlightForDegreeSlider(enable) {
        const _this = this;
        if (!arguments.length) {
            enable = true;
        }
        this.menuControl.classed("highlighted", enable);
        this.nodeDegreeContainer.classed("highlighted", enable);
        // pulse button handling
        if (this.menuControl.classed("buttonPulse") === true && enable === true) {
            this.menuControl.classed("buttonPulse", false);
            var timer = setTimeout(function () {
                _this.menuControl.classed("buttonPulse", enable);
                clearTimeout(timer);
                // after the time is done, remove the pulse but stay highlighted
            }, 100);
        } else {
            this.menuControl.classed("buttonPulse", enable);
            this.menuControl.classed("filterMenuButtonHighlight", enable);
        }
    };

    /**
     * setting manually the values of the filter
     * no update of the gui settings, these are updated in updateSettings
     * importer functions *
     * @param {any} id
     * @param {any} checked
     */
    setCheckBoxValue(id, checked) {
        for (var i = 0; i < this.checkboxData.length; i++) {
            var cbdId = this.checkboxData[i].checkbox.attr("id");
            if (cbdId === id) {
                this.checkboxData[i].checkbox.property("checked", checked);
                break;
            }
        }
    };

    /**
     * @param {any} id
     */
    getCheckBoxValue(id) {
        for (var i = 0; i < this.checkboxData.length; i++) {
            var cbdId = this.checkboxData[i].checkbox.attr("id");
            if (cbdId === id) {
                return this.checkboxData[i].checkbox.property("checked");

            }
        }
    };

    /**
     * set the value of the slider
     * @param {any} val
     */
    setDegreeSliderValue(val) {
        this.degreeSlider.property("value", val);
    };

    /**
     * update the gui without invoking graph update (calling silent onclick function)
     */
    updateSettings() {
        var silent = true;
        var sliderValue = this.degreeSlider.property("value");
        if (sliderValue > 0) {
            this.highlightForDegreeSlider(true);
        } else {
            this.highlightForDegreeSlider(false);
        }
        this.checkboxData.forEach(function (checkboxData) {
            var checkbox = checkboxData.checkbox;
            checkbox.on("click")(silent);
        });

        this.degreeSlider.on("input")();
        this.degreeSlider.on("change")();

    };
};
