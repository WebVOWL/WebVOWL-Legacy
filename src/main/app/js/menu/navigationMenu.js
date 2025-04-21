import Graph from "../../../webvowl/js/graph"

export default class NavigationMenu {
    /**
     * Contains the navigation "engine"
     * @param {Graph} graph the associated webvowl graph
     */
    constructor(graph) {
        this.graph = graph
        this.scrollContainer = d3.select("#menuElementContainer").node()
        this.menuContainer = d3.select("#menuContainer").node()
        this.leftButton = d3.select("#scrollLeftButton")
        this.rightButton = d3.select("#scrollRightButton")
        this.scrolLeftValue = undefined
        this.scrollMax = undefined
        this.currentlyVisibleMenu = undefined
        this.currentlyHoveredEntry = undefined
        this.touchedElement = false
        this.t_scrollLeft = undefined
        this.t_scrollRight = undefined
        /**
         * @type {string[]}
         */
        this.c_select = []
        /**
         * @type {any[]}
         */
        this.m_select = []
        this.id = undefined
    }

    clearAllTimers() {
        cancelAnimationFrame(this.t_scrollLeft)
        cancelAnimationFrame(this.t_scrollRight)
    }

    timed_scrollRight() {
        this.scrolLeftValue += 5
        this.scrollContainer.scrollLeft = this.scrolLeftValue
        this.updateScrollButtonVisibility()
        if (this.scrolLeftValue >= this.scrollMax) {
            this.clearAllTimers()
            return
        }
        this.t_scrollRight = requestAnimationFrame(this.timed_scrollRight)
    }

    timed_scrollLeft() {
        this.scrolLeftValue -= 5
        this.scrollContainer.scrollLeft = this.scrolLeftValue
        this.updateScrollButtonVisibility()
        if (this.scrolLeftValue <= 0) {
            this.clearAllTimers()
            return
        }
        this.t_scrollRight = requestAnimationFrame(this.timed_scrollLeft)
    }

    // collect all menu entries and stuff;
    setupControlsAndMenus() {
        const _this = this
        // HEURISTIC : to match the menus and their controllers we remove the first 2 letters and match
        this.c_select = []
        this.m_select = []
        const c_temp = []
        const m_temp = []
        const controlElements = this.scrollContainer.children
        let numEntries = controlElements.length

        for (let i = 0; i < numEntries; i++) {
            c_temp.push(controlElements[i].id.slice(2))
        }

        const menuElements = this.menuContainer.children
        numEntries = menuElements.length
        for (let i = 0; i < numEntries; i++) {
            m_temp.push(menuElements[i].id.slice(2))
        }

        numEntries = controlElements.length
        for (let i = 0; i < numEntries; i++) {
            this.c_select[i] = "c_" + c_temp[i]
            if (m_temp.indexOf(c_temp[i]) > -1) {
                this.m_select[i] = "m_" + c_temp[i]
            } else {
                this.m_select[i] = undefined
            }
            // create custom behavior for click, touch, and hover
            d3.select("#" + this.c_select[i]).on(
                "mouseover",
                this.menuElementOnHovered,
            )
            d3.select("#" + this.c_select[i]).on(
                "mouseout",
                this.menuElementOutHovered,
            )
            d3.select("#" + this.c_select[i]).on(
                "click",
                this.menuElementClicked,
            )
            d3.select("#" + this.c_select[i]).on(
                "touchstart",
                this.menuElementTouched,
            )
        }
        // connect to mouseWheel
        d3.select("#menuElementContainer").on("wheel", function () {
            const wheelEvent = d3.event
            let offset
            if (wheelEvent.deltaY < 0) {
                offset = 20
            }
            if (wheelEvent.deltaY > 0) {
                offset = -20
            }
            _this.scrollContainer.scrollLeft += offset
            _this.hideAllMenus()
            _this.updateScrollButtonVisibility()
        })
        // connect scrollIndicator Buttons;
        d3.select("#scrollRightButton")
            .on("mousedown", function () {
                _this.scrolLeftValue = _this.scrollContainer.scrollLeft
                _this.hideAllMenus()
                _this.t_scrollRight = requestAnimationFrame(
                    _this.timed_scrollRight,
                )
            })
            .on("touchstart", function () {
                _this.scrolLeftValue = _this.scrollContainer.scrollLeft
                _this.hideAllMenus()
                _this.t_scrollRight = requestAnimationFrame(
                    _this.timed_scrollRight,
                )
            })
            .on("mouseup", this.clearAllTimers)
            .on("touchend", this.clearAllTimers)
            .on("touchcancel", this.clearAllTimers)
        d3.select("#scrollLeftButton")
            .on("mousedown", function () {
                _this.scrolLeftValue = _this.scrollContainer.scrollLeft
                _this.hideAllMenus()
                _this.t_scrollLeft = requestAnimationFrame(
                    _this.timed_scrollLeft,
                )
            })
            .on("touchstart", function () {
                _this.scrolLeftValue = _this.scrollContainer.scrollLeft
                _this.hideAllMenus()
                _this.t_scrollLeft = requestAnimationFrame(
                    _this.timed_scrollLeft,
                )
            })
            .on("mouseup", this.clearAllTimers)
            .on("touchend", this.clearAllTimers)
            .on("touchcancel", this.clearAllTimers)
        // connect the scroll functionality;
        d3.select("#menuElementContainer").on("scroll", function () {
            _this.updateScrollButtonVisibility()
            _this.hideAllMenus()
        })
    }

    menuElementOnHovered() {
        this.hideAllMenus()
        if (this.touchedElement) {
            return
        }
        this.showSingleMenu(this.id)
    }

    menuElementOutHovered() {
        this.hoveroutedControMenu(this.id)
    }

    menuElementClicked() {
        const m_element = this.m_select[this.c_select.indexOf(this.id)]
        if (m_element) {
            const menuElement = d3.select("#" + m_element)
            if (menuElement) {
                if (menuElement.style("display") === "block") {
                    menuElement.style("display", "none") // hide it
                } else {
                    this.showSingleMenu(this.id)
                }
            }
        }
    }

    menuElementTouched() {
        // it sets a flag that we have touched it,
        // since d3. propagates the event for touch as hover and then click, we block the hover event
        this.touchedElement = true
    }

    /**
     * @param {string} controllerID
     */
    hoveroutedControMenu(controllerID) {
        this.currentlyHoveredEntry = d3.select("#" + controllerID)
        if (controllerID !== "c_search") {
            d3.select("#" + controllerID)
                .select("path")
                .style("stroke-width", "0")
            d3.select("#" + controllerID)
                .select("path")
                .style("fill", "#fff")
        }
    }

    /**
     * @param {string} controllerID
     */
    showSingleMenu(controllerID) {
        this.currentlyHoveredEntry = d3.select("#" + controllerID).node()
        // get the corresponding menu element for this controller
        const m_element = this.m_select[this.c_select.indexOf(controllerID)]
        if (m_element) {
            if (controllerID !== "c_search") {
                d3.select("#" + controllerID)
                    .select("path")
                    .style("stroke-width", "0")
                d3.select("#" + controllerID)
                    .select("path")
                    .style("fill", "#bdc3c7")
            }
            // show it if we have a menu
            this.currentlyVisibleMenu = d3.select("#" + m_element)
            this.currentlyVisibleMenu.style("display", "block")
            if (m_element === "m_export")
                this.graph.options.exportMenu.exportAsUrl()
            this.updateMenuPosition()
        }
    }

    updateMenuPosition() {
        if (this.currentlyHoveredEntry) {
            const leftOffset = this.currentlyHoveredEntry.offsetLeft
            const scrollOffset = this.scrollContainer.scrollLeft
            const totalOffset = leftOffset - scrollOffset
            let finalOffset = Math.max(0, totalOffset)
            const fullContainer_width =
                this.scrollContainer.getBoundingClientRect().labelWidth
            const elementWidth = this.currentlyVisibleMenu
                .node()
                .getBoundingClientRect().labelWidth
            // make priority > first check if we are right
            if (finalOffset + elementWidth > fullContainer_width) {
                finalOffset = fullContainer_width - elementWidth
            }
            // fix priority;
            finalOffset = Math.max(0, finalOffset)
            this.currentlyVisibleMenu.style("left", finalOffset + "px")
            // // check if outside the viewport
            // const menuWidth=currentlyHoveredEntry.getBoundingClientRect().labelWidth;
            // const bt_width=36;
            // if (totalOffset+menuWidth<bt_width || totalOffset+bt_width>fullContainer_width){
            //     navigationMenu.hideAllMenus();
            //     currentlyHoveredEntry=undefined;
            // }
        }
    }

    hideAllMenus() {
        d3.selectAll(".toolTipMenu").style("display", "none") // hiding all menus
    }

    updateScrollButtonVisibility() {
        this.scrollMax =
            this.scrollContainer.scrollWidth -
            this.scrollContainer.clientWidth -
            2
        if (this.scrollContainer.scrollLeft === 0) {
            this.leftButton.classed("hidden", true)
        } else {
            this.leftButton.classed("hidden", false)
        }

        if (this.scrollContainer.scrollLeft > this.scrollMax) {
            this.rightButton.classed("hidden", true)
        } else {
            this.rightButton.classed("hidden", false)
        }
    }

    setup() {
        this.setupControlsAndMenus()
        // make sure that the menu elements follow their controller and also their restrictions
        // some hovering behavior -- lets the menu disappear when hovered in graph or sidebar;
        d3.select("#graph").on("mouseover", () => {
            this.hideAllMenus()
        })
        d3.select("#generalDetails").on("mouseover", () => {
            this.hideAllMenus()
        })
    }
}
