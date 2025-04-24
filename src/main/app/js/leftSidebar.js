import Graph from "../../webvowl/js/graph"

export default class LeftSideBar {
    /**
     * Contains the logic for the sidebar.
     * @param {Graph} graph the graph that belongs to these controls
     */
    constructor(graph) {
        this.graph = graph
        this.collapseButton = d3.select("#leftSideBarCollapseButton")
        this.visibleSidebar = false
        this.backupVisibility = false
        this.sideBarContent = d3.select("#leftSideBarContent")
        this.sideBarContainer = d3.select("#containerForLeftSideBar")
        /**
         * @type {d3.Selection<HTMLDivElement, any, HTMLElement, any>[]}
         */
        this.defaultClassSelectionContainers = []
        /**
         * @type {d3.Selection<HTMLDivElement, any, HTMLElement, any>[]}
         */
        this.defaultDatatypeSelectionContainers = []
        /**
         * @type {d3.Selection<HTMLDivElement, any, HTMLElement, any>[]}
         */
        this.defaultPropertySelectionContainers = []
    }

    setup() {
        this.#setupCollapsing()
        this.initSideBarAnimation()

        this.collapseButton.on("click", () => {
            this.graph.options.navigationMenu.hideAllMenus()
            const isVisible = this.getSidebarVisibility()
            this.showSidebar(!isVisible)
            this.backupVisibility = isVisible
        })

        this.#setupSelectionContainers()
        d3.select("#WarningErrorMessages")
            .node()
            .addEventListener("animationend", function () {
                d3.select("#WarningErrorMessages").style(
                    "-webkit-animation-name",
                    "none",
                )
            })
    }

    /**
     * @param {boolean} val
     */
    hideCollapseButton(val) {
        this.sideBarContainer.classed("hidden", val)
    }

    /**
     * @param {d3.Selection<HTMLDivElement, any, HTMLElement, any>[]} container
     */
    #unselectAllElements(container) {
        for (let i = 0; i < container.length; i++) {
            container[i].classed("defaultSelected", false)
        }
    }

    /**
     * @param {any} element
     */
    #selectThisDefaultElement(element) {
        d3.select(element).classed("defaultSelected", true)
    }

    /**
     * @param {any} element
     * @param {string} identifier
     */
    #updateDefaultNameInAccordion(element, identifier) {
        let elementDescription = ""
        if (identifier === "defaultClass") {
            elementDescription = "Class: "
        }
        if (identifier === "defaultDatatype") {
            elementDescription = "Datatype: "
        }
        if (identifier === "defaultProperty") {
            elementDescription = "Property: "
        }
        d3.select("#" + identifier).node().innerHTML =
            elementDescription + element.innerHTML
        d3.select("#" + identifier).node().title = element.innerHTML
    }

    /**
     * @param {any} item
     */
    #classSelectorFunction(item) {
        this.#unselectAllElements(this.defaultClassSelectionContainers)
        this.#selectThisDefaultElement(item)
        this.#updateDefaultNameInAccordion(item, "defaultClass")
    }

    /**
     * @param {any} item
     */
    #datatypeSelectorFunction(item) {
        this.#unselectAllElements(this.defaultDatatypeSelectionContainers)
        this.#selectThisDefaultElement(item)
        this.#updateDefaultNameInAccordion(item, "defaultDatatype")
    }

    /**
     * @param {any} item
     */
    #propertySelectorFunction(item) {
        this.#unselectAllElements(this.defaultPropertySelectionContainers)
        this.#selectThisDefaultElement(item)
        this.#updateDefaultNameInAccordion(item, "defaultProperty")
    }

    #setupSelectionContainers() {
        const classContainer = d3.select("#classContainer")
        const datatypeContainer = d3.select("#datatypeContainer")
        const propertyContainer = d3.select("#propertyContainer")
        // create the supported elements

        const defaultClass = "owl:Class"
        const defaultDatatype = "rdfs:Literal"
        const defaultProperty = "owl:objectProperty"

        const supportedClasses = this.graph.options.supportedClasses
        const supportedDatatypes = this.graph.options.supportedDatatypes
        const supportedProperties = this.graph.options.supportedProperties

        const _this = this
        for (const supportedClass of supportedClasses) {
            const aClassSelectionContainer = classContainer.append("div")
            aClassSelectionContainer.classed(
                "containerForDefaultSelection",
                true,
            )
            aClassSelectionContainer.classed("noselect", true)
            aClassSelectionContainer.node().id =
                "selectedClass" + supportedClass
            aClassSelectionContainer.node().innerHTML = supportedClass

            if (supportedClass === defaultClass) {
                this.#selectThisDefaultElement(aClassSelectionContainer.node())
            }
            aClassSelectionContainer.on("click", function () {
                _this.#classSelectorFunction(this)
            })
            this.defaultClassSelectionContainers.push(aClassSelectionContainer)
        }
        for (const supportedDatatype of supportedDatatypes) {
            const aDTSelectionContainer = datatypeContainer.append("div")
            aDTSelectionContainer.classed("containerForDefaultSelection", true)
            aDTSelectionContainer.classed("noselect", true)
            aDTSelectionContainer.node().id =
                "selectedDatatype" + supportedDatatype
            aDTSelectionContainer.node().innerHTML = supportedDatatype

            if (supportedDatatype === defaultDatatype) {
                this.#selectThisDefaultElement(aDTSelectionContainer.node())
            }
            aDTSelectionContainer.on("click", function () {
                _this.#datatypeSelectorFunction(this)
            })
            this.defaultDatatypeSelectionContainers.push(aDTSelectionContainer)
        }
        for (const supportedProperty of supportedProperties) {
            const aPropSelectionContainer = propertyContainer.append("div")
            aPropSelectionContainer.classed(
                "containerForDefaultSelection",
                true,
            )
            aPropSelectionContainer.classed("noselect", true)
            aPropSelectionContainer.node().id =
                "selectedClass" + supportedProperty
            aPropSelectionContainer.node().innerHTML = supportedProperty
            aPropSelectionContainer.on("click", function () {
                _this.#propertySelectorFunction(this)
            })
            if (supportedProperty === defaultProperty) {
                this.#selectThisDefaultElement(aPropSelectionContainer.node())
            }
            this.defaultPropertySelectionContainers.push(
                aPropSelectionContainer,
            )
        }
    }

    #setupCollapsing() {
        // adapted version of this example: http://www.normansblog.de/simple-jquery-accordion/
        /**
         * @param {import("d3-selection").Selection<any, any, null, undefined>} containers
         */
        function collapseContainers(containers) {
            containers.classed("hidden", true)
        }

        /**
         * @param {import("d3-selection").Selection<any, any, null, undefined>} containers
         */
        function expandContainers(containers) {
            containers.classed("hidden", false)
        }

        const triggers = d3.selectAll(".accordion-trigger")
        // Collapse all inactive triggers on startup
        // collapseContainers(d3.selectAll(".accordion-trigger:not(.accordion-trigger-active) + div"));
        triggers.on("click", function () {
            const selectedTrigger = d3.select(this)
            if (selectedTrigger.classed("accordion-trigger-active")) {
                // Collapse the active (which is also the selected) trigger
                collapseContainers(
                    d3.select(selectedTrigger.node().nextElementSibling),
                )
                selectedTrigger.classed("accordion-trigger-active", false)
            } else {
                // Collapse the other trigger ...
                // collapseContainers(d3.selectAll(".accordion-trigger-active + div"));
                // activeTriggers.classed("accordion-trigger-active", false);
                // ... and expand the selected one
                expandContainers(
                    d3.select(selectedTrigger.node().nextElementSibling),
                )
                selectedTrigger.classed("accordion-trigger-active", true)
            }
        })
    }

    /**
     * @param {boolean} init
     */
    updateSideBarVis(init) {
        this.showSidebar(this.getSidebarVisibility(), init)
    }

    /**
     * @returns {boolean} Returns true if sidebar is hidden. Otherwise, false
     */
    getSidebarVisibility() {
        return this.sideBarContent.classed("hidden")
    }

    initSideBarAnimation() {
        this.sideBarContainer.node().addEventListener("animationend", () => {
            this.sideBarContent.classed("hidden", !this.visibleSidebar)
            if (this.visibleSidebar === true) {
                this.sideBarContainer.style("width", "200px")
                this.sideBarContent.classed("hidden", false)
                d3.select("#leftSideBarCollapseButton").style("left", "200px")
                d3.select("#leftSideBarCollapseButton").classed("hidden", false)
                d3.select("#WarningErrorMessages").style("left", "100px")
            } else {
                this.sideBarContainer.style("width", "0px")
                d3.select("#leftSideBarCollapseButton").style("left", "0px")
                d3.select("#WarningErrorMessages").style("left", "0px")
                d3.select("#leftSideBarCollapseButton").classed("hidden", false)
            }
            this.graph.updateCanvasContainerSize()
            this.graph.options.navigationMenu.updateScrollButtonVisibility()
        })
    }

    /**
     * @param {boolean} isVisible
     * @param {boolean} [init]
     */
    showSidebar(isVisible, init) {
        const collapseButton = d3.select("#leftSideBarCollapseButton")
        if (init) {
            this.visibleSidebar = this.backupVisibility === false
            this.sideBarContent.classed("hidden", !this.visibleSidebar)
            this.sideBarContainer.style("-webkit-animation-name", "none")
            d3.select("#WarningErrorMessages").style(
                "-webkit-animation-name",
                "none",
            )
            if (this.visibleSidebar) {
                this.sideBarContainer.style("width", "200px")
                this.sideBarContent.classed("hidden", false)
                d3.select("#leftSideBarCollapseButton").style("left", "200px")
                d3.select("#leftSideBarCollapseButton").classed("hidden", false)
                d3.select("#WarningErrorMessages").style("left", "100px")
                collapseButton.node().innerHTML = "<"
            } else {
                this.sideBarContainer.style("width", "0px")
                d3.select("#WarningErrorMessages").style("left", "0px")
                d3.select("#leftSideBarCollapseButton").style("left", "0px")
                d3.select("#leftSideBarCollapseButton").classed("hidden", false)
                collapseButton.node().innerHTML = ">"
            }
            this.graph.updateCanvasContainerSize()
            this.graph.options.navigationMenu.updateScrollButtonVisibility()
            return
        }
        d3.select("#leftSideBarCollapseButton").classed("hidden", true)

        if (isVisible) {
            this.visibleSidebar = true
            collapseButton.node().innerHTML = "<"
            // call expand animation;
            this.sideBarContainer.style(
                "-webkit-animation-name",
                "l_sbExpandAnimation",
            )
            this.sideBarContainer.style("-webkit-animation-duration", "0.5s")
            // prepare the animation;
            d3.select("#WarningErrorMessages").style(
                "-webkit-animation-name",
                "warn_ExpandLeftBarAnimation",
            )
            d3.select("#WarningErrorMessages").style(
                "-webkit-animation-duration",
                "0.5s",
            )
        } else {
            this.visibleSidebar = false
            this.sideBarContent.classed("hidden", true)
            collapseButton.node().innerHTML = ">"
            // call collapse animation
            this.sideBarContainer.style(
                "-webkit-animation-name",
                "l_sbCollapseAnimation",
            )
            this.sideBarContainer.style("-webkit-animation-duration", "0.5s")
            d3.select("#WarningErrorMessages").style(
                "-webkit-animation-name",
                "warn_CollapseLeftBarAnimation",
            )
            d3.select("#WarningErrorMessages").style(
                "-webkit-animation-duration",
                "0.5s",
            )
            d3.select("#WarningErrorMessages").style("left", "0")
        }
    }
}
