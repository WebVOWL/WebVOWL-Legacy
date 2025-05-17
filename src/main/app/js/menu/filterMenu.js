import Graph from "../../../webvowl/js/graph"
import AbstractFilter from "../../../webvowl/js/modules/filters/abstractFilter"
import DataTypeFilter from "../../../webvowl/js/modules/filters/datatypeFilter"
import DisjointFilter from "../../../webvowl/js/modules/filters/disjointFilter"
import NodeDegreeFilter from "../../../webvowl/js/modules/filters/nodeDegreeFilter"
import ObjectPropertyFilter from "../../../webvowl/js/modules/filters/objectPropertyFilter"
import SetOperatorFilter from "../../../webvowl/js/modules/filters/setOperatorFilter"
import SubclassFilter from "../../../webvowl/js/modules/filters/subclassFilter"

export default class FilterMenu {
    /**
     * Contains the logic for connecting the filters with the website.
     * @param {Graph} graph required for calling a refresh after a filter change
     */
    constructor(graph) {
        this.graph = graph
        /**
         * @type {any[]}
         */
        this.checkboxData = []
        this.menuElement = d3.select("#m_filter")
        this.menuControl = d3.select("#c_filter a")
        this.nodeDegreeContainer = d3.select("#nodeDegreeFilteringOption")
        this.graphDegreeLevel = undefined
        this.defaultDegreeValue = 0
        this.degreeSlider = undefined
    }

    getCheckBoxContainer() {
        return this.checkboxData
    }

    getDegreeSliderValue() {
        return this.degreeSlider.property("value")
    }

    /**
     * Connects the website with graph filters.
     * @param {DataTypeFilter} datatypeFilter filter for all datatypes
     * @param {ObjectPropertyFilter} objectPropertyFilter filter for all object properties
     * @param {SubclassFilter} subclassFilter filter for all subclasses
     * @param {DisjointFilter} disjointFilter filter for all disjoint with properties
     * @param {SetOperatorFilter} setOperatorFilter filter for all set operators with properties
     * @param {NodeDegreeFilter} nodeDegreeFilter filters nodes by their degree
     */
    setup(
        datatypeFilter,
        objectPropertyFilter,
        subclassFilter,
        disjointFilter,
        setOperatorFilter,
        nodeDegreeFilter,
    ) {
        this.menuControl.on("mouseover", () => {
            const searchMenu = this.graph.options.searchMenu
            searchMenu.hideSearchEntries()
        })
        this.menuControl.on("mouseleave", () => {
            this.highlightForDegreeSlider(false)
        })
        this.addFilterItem(
            datatypeFilter,
            "datatype",
            "Datatype properties",
            "#datatypeFilteringOption",
        )
        this.addFilterItem(
            objectPropertyFilter,
            "objectProperty",
            "Object properties",
            "#objectPropertyFilteringOption",
        )
        this.addFilterItem(
            subclassFilter,
            "subclass",
            "Solitary subclasses",
            "#subclassFilteringOption",
        )
        this.addFilterItem(
            disjointFilter,
            "disjoint",
            "Class disjointness",
            "#disjointFilteringOption",
        )
        this.addFilterItem(
            setOperatorFilter,
            "setoperator",
            "Set operators",
            "#setOperatorFilteringOption",
        )
        this.addNodeDegreeFilter(nodeDegreeFilter, this.nodeDegreeContainer)
        this.addAnimationFinishedListener()
    }

    /**
     * @param {AbstractFilter} filter
     * @param {string} identifier
     * @param {string} pluralNameOfFilteredItems
     * @param {string} selector
     */
    addFilterItem(filter, identifier, pluralNameOfFilteredItems, selector) {
        const filterContainer = d3
            .select(selector)
            .append("div")
            .classed("checkboxContainer", true)
        const filterCheckbox = filterContainer
            .append("input")
            .classed("filterCheckbox", true)
            .attr("id", identifier + "FilterCheckbox")
            .attr("type", "checkbox")
            .property("checked", filter.enabled)

        // Store for easier resetting
        this.checkboxData.push({
            checkbox: filterCheckbox,
            defaultState: filter.enabled,
        })

        filterCheckbox.on("click", (silent) => {
            // There might be no parameters passed because of a manual
            // invocation when resetting the filters
            filter.enabled = filterCheckbox.property("checked")
            if (!silent) {
                // updating graph when silent is false or the parameter is not given.
                this.graph.update()
                this.graph.options.searchMenu.updateSearchEntries()
            }
        })
        filterContainer
            .append("label")
            .attr("for", identifier + "FilterCheckbox")
            .text(pluralNameOfFilteredItems)
    }

    /**
     * @param {NodeDegreeFilter} nodeDegreeFilter
     * @param {d3.Selection<any, any, HTMLElement, any>} container
     */
    addNodeDegreeFilter(nodeDegreeFilter, container) {
        const _this = this
        nodeDegreeFilter.maxDegreeSetter = function (maxDegree) {
            _this.degreeSlider.attr("max", maxDegree)
            _this.setSliderValue(
                _this.degreeSlider,
                Math.min(maxDegree, _this.degreeSlider.property("value")),
            )
        }
        nodeDegreeFilter.degreeGetter = function () {
            return _this.degreeSlider.property("value")
        }
        nodeDegreeFilter.degreeSetter = function (value) {
            _this.setSliderValue(_this.degreeSlider, value)
        }
        const sliderContainer = container
            .append("div")
            .classed("distanceSliderContainer", true)
        this.degreeSlider = sliderContainer
            .append("input")
            .attr("id", "nodeDegreeDistanceSlider")
            .attr("type", "range")
            .attr("min", 0)
            .attr("step", 1)
        sliderContainer
            .append("label")
            .classed("description", true)
            .attr("for", "nodeDegreeDistanceSlider")
            .text("Degree of collapsing")
        const sliderValueLabel = sliderContainer
            .append("label")
            .classed("value", true)
            .attr("for", "nodeDegreeDistanceSlider")
            .text(0)
        this.degreeSlider.on(
            "change",
            function (/** @type {boolean} */ silent) {
                if (silent !== true) {
                    _this.graph.update()
                    _this.graphDegreeLevel =
                        _this.degreeSlider.property("value")
                    _this.graph.options.searchMenu.updateSearchEntries()
                }
            },
        )
        this.degreeSlider.on("input", function () {
            const degree = _this.degreeSlider.property("value")
            sliderValueLabel.text(degree)
        })
        // adding wheel events
        this.degreeSlider.on("wheel", this.handleWheelEvent)
        this.degreeSlider.on("focusout", function () {
            if (
                _this.degreeSlider.property("value") !== _this.graphDegreeLevel
            ) {
                _this.graph.update()
            }
        })
    }

    handleWheelEvent() {
        const wheelEvent = d3.event
        let offset
        if (wheelEvent.deltaY < 0) {
            offset = 1
        } else if (wheelEvent.deltaY > 0) {
            offset = -1
        }
        const maxDeg = parseInt(this.degreeSlider.attr("max"))
        const oldVal = parseInt(this.degreeSlider.property("value"))
        const newSliderValue = oldVal + offset
        if (
            oldVal !== newSliderValue &&
            newSliderValue >= 0 &&
            newSliderValue <= maxDeg
        ) {
            // only update when they are different [reducing redundant updates]
            // set the new value and emit an update signal
            this.degreeSlider.property("value", newSliderValue)
            this.degreeSlider.on("input")() // <<-- sets the text value
            this.graph.update()
        }
        d3.event.preventDefault()
    }

    /**
     * @param {d3.Selection<any, any, HTMLElement, any>} slider
     * @param {number} value
     */
    setSliderValue(slider, value) {
        slider.property("value", value).on("input")()
    }

    /**
     * Resets the filters (and also filtered elements) to their default.
     */
    reset() {
        this.checkboxData.forEach(function (checkboxData) {
            const checkbox = checkboxData.checkbox,
                enabledByDefault = checkboxData.defaultState,
                isChecked = checkbox.property("checked")

            if (isChecked !== enabledByDefault) {
                checkbox.property("checked", enabledByDefault)
                // Call onclick event handlers programmatically
                checkbox.on("click")()
            }
        })
        // setSliderValue(degreeSlider, 0);
        this.degreeSlider.on("change")()
    }

    addAnimationFinishedListener() {
        this.menuControl.node().addEventListener("animationend", () => {
            this.menuControl.classed("buttonPulse", false)
            this.menuControl.classed("filterMenuButtonHighlight", true)
        })
    }

    killButtonAnimation() {
        this.menuControl.classed("buttonPulse", false)
        this.menuControl.classed("filterMenuButtonHighlight", false)
    }

    /**
     * @param {boolean} enable
     */
    highlightForDegreeSlider(enable = true) {
        this.menuControl.classed("highlighted", enable)
        this.nodeDegreeContainer.classed("highlighted", enable)
        // pulse button handling
        if (this.menuControl.classed("buttonPulse") && enable) {
            this.menuControl.classed("buttonPulse", false)
            const timer = setTimeout(() => {
                this.menuControl.classed("buttonPulse", enable)
                clearTimeout(timer)
                // after the time is done, remove the pulse but stay highlighted
            }, 100)
        } else {
            this.menuControl.classed("buttonPulse", enable)
            this.menuControl.classed("filterMenuButtonHighlight", enable)
        }
    }

    /**
     * setting manually the values of the filter
     * no update of the gui settings, these are updated in updateSettings
     * importer functions *
     * @param {string} id
     * @param {boolean} checked
     */
    setCheckBoxValue(id, checked) {
        for (let i = 0; i < this.checkboxData.length; i++) {
            const cbdId = this.checkboxData[i].checkbox.attr("id")
            if (cbdId === id) {
                this.checkboxData[i].checkbox.property("checked", checked)
                break
            }
        }
    }

    /**
     * @param {string} id
     */
    getCheckBoxValue(id) {
        for (let i = 0; i < this.checkboxData.length; i++) {
            const cbdId = this.checkboxData[i].checkbox.attr("id")
            if (cbdId === id) {
                return this.checkboxData[i].checkbox.property("checked")
            }
        }
    }

    /**
     * set the value of the slider
     * @param {number} val
     */
    setDegreeSliderValue(val) {
        this.degreeSlider.property("value", val)
    }

    /**
     * update the gui without invoking graph update (calling silent onclick function)
     */
    updateSettings() {
        const silent = true
        const sliderValue = this.degreeSlider.property("value")
        if (sliderValue > 0) {
            this.highlightForDegreeSlider(true)
        } else {
            this.highlightForDegreeSlider(false)
        }
        this.checkboxData.forEach(function (checkboxData) {
            const checkbox = checkboxData.checkbox
            checkbox.on("click")(silent)
        })
        this.degreeSlider.on("input")()
        this.degreeSlider.on("change")()
    }
}
