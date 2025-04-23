import { init_rust } from "../../../../target/pkg"
import Graph from "../../webvowl/js/graph.js"
import Options from "../../webvowl/js/options.js"

export default class App {
    GRAPH_SELECTOR = "#graph"

    constructor() {
        this.graph = new Graph()
        this.options = new Options(this.graph)
        this.graph.options = this.options
        this.graph.initializeGraph()

        this.executeFileDrop = false
        this.wasMessageToShow = false
        this.firstTime = false
    }

    /**
     * @param {string} selector
     */
    #addFileDropEvents(selector) {
        const node = d3.select(selector)

        node.node().ondragover = (e) => {
            e.preventDefault()

            d3.select("#dragDropContainer").classed("hidden", false)
            // get svg size
            const w = this.options.width
            const h = this.options.height

            // get event position; (using clientX and clientY);
            const cx = e.clientX
            const cy = e.clientY

            if (!this.firstTime) {
                const state = d3.select("#loading-info").classed("hidden")
                this.wasMessageToShow = !state
                this.firstTime = true
                d3.select("#loading-info").classed("hidden", true) // hide it so it does not conflict with drop event
                const bb = d3.select("#drag_msg").node().getBoundingClientRect()
                const hs = bb.height
                const ws = bb.width

                let icon_scale = Math.min(hs, ws)
                icon_scale /= 100

                d3.select("#drag_icon_group").attr(
                    "transform",
                    "translate ( " + 0.25 * ws + " " + 0.25 * hs + ")",
                )
                d3.select("#drag_icon").attr(
                    "transform",
                    "matrix (" + icon_scale + ",0,0," + icon_scale + ",0,0)",
                )
                d3.select("#drag_icon_drop").attr(
                    "transform",
                    "matrix (" + icon_scale + ",0,0," + icon_scale + ",0,0)",
                )
            }

            if (
                cx > 0.25 * w &&
                cx < 0.75 * w &&
                cy > 0.25 * h &&
                cy < 0.75 * h
            ) {
                d3.select("#drag_msg_text").node().innerHTML = "Drop it here."
                d3.select("#drag_msg").style("background-color", "#67bc0f")
                d3.select("#drag_msg").style("color", "#000000")
                this.executeFileDrop = true
                // d3.select("#drag_svg").transition()
                //   .duration(100)
                //   // .attr("-webkit-transform", "rotate(90)")
                //   // .attr("-moz-transform",    "rotate(90)")
                //   // .attr("-o-transform",      "rotate(90)")
                //   .attr("transform",         "rotate(90)");
                d3.select("#drag_icon").classed("hidden", true)
                d3.select("#drag_icon_drop").classed("hidden", false)
            } else {
                d3.select("#drag_msg_text").node().innerHTML =
                    "Drag ontology file here."
                d3.select("#drag_msg").style("background-color", "#fefefe")
                d3.select("#drag_msg").style("color", "#000000")
                this.executeFileDrop = false
                d3.select("#drag_icon").classed("hidden", false)
                d3.select("#drag_icon_drop").classed("hidden", true)
                // d3.select("#drag_svg").transition()
                //   .duration(100)
                //   // .attr("-webkit-transform", "rotate(0)")
                //   // .attr("-moz-transform",    "rotate(0)")
                //   // .attr("-o-transform",      "rotate(0)")
                //   .attr("transform",         "rotate(0)");
                //
            }
        }

        node.node().ondrop = (ev) => {
            ev.preventDefault()
            this.firstTime = false
            if (this.executeFileDrop) {
                if (ev.dataTransfer.items) {
                    if (ev.dataTransfer.items.length === 1) {
                        if (ev.dataTransfer.items[0].kind === "file") {
                            const file = ev.dataTransfer.items[0].getAsFile()
                            this.options.loadingModule.fromFileDrop(
                                file.name,
                                file,
                            )
                        }
                    } else {
                        //  >> WARNING not multiple file uploaded;
                        this.options.warningModule.showMultiFileUploadWarning()
                    }
                }
            }
            d3.select("#dragDropContainer").classed("hidden", true)
        }

        node.node().ondragleave = (e) => {
            const w = this.options.width
            const h = this.options.height

            // get event position; (using clientX and clientY);
            const cx = e.clientX
            const cy = e.clientY

            let hidden = false
            this.firstTime = false

            if (cx < 0.1 * w || cx > 0.9 * w) {
                hidden = true
            }
            if (cy < 0.1 * h || cy > 0.9 * h) {
                hidden = true
            }
            d3.select("#dragDropContainer").classed("hidden", hidden)

            d3.select("#loading-info").classed("hidden", !this.wasMessageToShow) // show it again
            // check if it should be visible
            const should_show = this.options.loadingModule.visibilityStatus
            if (!should_show) {
                d3.select("#loading-info").classed("hidden", true) // hide it
            }
        }
    }

    async initialize() {
        init_rust() // Initialize Rust code

        this.options.graphContainerSelector = this.GRAPH_SELECTOR
        this.options.setup(() => {
            this.#adjustSize()
        })

        this.#addFileDropEvents(this.GRAPH_SELECTOR)

        // simulate calling code 60
        window.requestAnimationFrame =
            window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (f) {
                return setTimeout(f, 1000 / 60)
            }
        // fall back
        window.cancelAnimationFrame =
            window.cancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            function (requestID) {
                clearTimeout(requestID)
            }

        d3.select(window).on("resize", () => {
            this.#adjustSize()
        })

        this.graph.start()

        const modeOp = d3.select("#modeOfOperationString")
        modeOp.style("font-size", "0.6em")
        modeOp.style("font-style", "italic")

        this.#adjustSize()
        const w = this.options.width
        const h = this.options.height
        let defZoom = Math.min(w, h) / 1000

        const hideDebugOptions = true
        if (!hideDebugOptions) {
            this.graph.setForceTickFunctionWithFPS()
        }

        this.graph.setDefaultZoom(defZoom)
        d3.selectAll(".debugOption").classed("hidden", hideDebugOptions)

        // prevent backspace reloading event
        const htmlBody = d3.select("body")
        d3.select(document).on("keydown", (e) => {
            if (d3.event.keyCode === 8 && d3.event.target === htmlBody.node()) {
                // we could add here an alert
                d3.event.preventDefault()
            }
            // using ctrl+Shift+d as debug option
            if (
                d3.event.ctrlKey &&
                d3.event.shiftKey &&
                d3.event.keyCode === 68
            ) {
                this.options.executeHiddenDebugFeatuers()
                d3.event.preventDefault()
            }
        })
        if (d3.select("#maxLabelWidthSliderOption")) {
            const setValue = !this.options.dynamicLabelWidth
            d3.select("#maxLabelWidthSlider").node().disabled = setValue
            d3.select("#maxLabelWidthvalueLabel").classed(
                "disabledLabelForSlider",
                setValue,
            )
            d3.select("#maxLabelWidthDescriptionLabel").classed(
                "disabledLabelForSlider",
                setValue,
            )
        }
        d3.select("#blockGraphInteractions")
            .style("position", "absolute")
            .style("top", "0")
            .style("background-color", "#bdbdbd")
            .style("opacity", "0.5")
            .style("pointer-events", "auto")
            .style("width", this.options.width + "px")
            .style("height", this.options.height + "px")
            .on("click", function () {
                d3.event.preventDefault()
                d3.event.stopPropagation()
            })
            .on("dblclick", function () {
                d3.event.preventDefault()
                d3.event.stopPropagation()
            })
        d3.select("#direct-text-input").on("click", () => {
            this.options.directInputModule.setDirectInputMode()
        })
        d3.select("#blockGraphInteractions").node().draggable = false
        this.#adjustSize()
        this.options.sidebar.updateOntologyInformation(
            undefined,
            this.options.statistics,
        )
        this.options.loadingModule.parseUrlAndLoadOntology() // loads automatically the ontology provided by the parameters
        this.options.debugMenu.updateSettings()

        // connect the reloadCachedVersionButton
        d3.select("#reloadSvgIcon").on("click", () => {
            if (d3.select("#reloadSvgIcon").node().disabled) {
                this.options.ontologyMenu.clearCachedVersion()
                return
            }
            d3.select("#reloadCachedOntology").classed("hidden", true)
            this.options.ontologyMenu.reloadCachedOntology()
        })
    }

    #adjustSize() {
        const graphContainer = d3.select(this.GRAPH_SELECTOR)
        const svg = graphContainer.select("svg")
        let height = window.innerHeight - 40
        let width = window.innerWidth - window.innerWidth * 0.22

        if (this.options.sidebar.getSidebarVisibility()) {
            height = window.innerHeight - 40
            width = window.innerWidth
        }

        this.options.directInputModule.updateLayout()
        d3.select("#blockGraphInteractions").style(
            "width",
            window.innerWidth + "px",
        )
        d3.select("#blockGraphInteractions").style(
            "height",
            window.innerHeight + "px",
        )
        d3.select("#WarningErrorMessagesContainer").style("width", width + "px")
        d3.select("#WarningErrorMessagesContainer").style(
            "height",
            height + "px",
        )
        d3.select("#WarningErrorMessages").style(
            "max-height",
            height - 12 + "px",
        )

        graphContainer.style("height", height + "px")
        svg.attr("width", width).attr("height", height)

        this.options.width = width
        this.options.height = height

        this.graph.updateStyle()

        const isTouch = this.#touchDevice()
        this.graph.touchDevice = isTouch
        if (this.graph.isEditorMode) {
            if (isTouch) {
                d3.select("#modeOfOperationString").node().innerHTML =
                    "touch able device detected"
            } else {
                d3.select("#modeOfOperationString").node().innerHTML =
                    "point & click device detected"
            }
        }

        d3.select("#loadingInfo-container").style(
            "height",
            0.5 * (height - 80) + "px",
        )
        this.options.loadingModule.checkForScreenSize()

        this.#adjustSliderSize()
        // update also the padding options of loading and the logo positions;
        const warningDiv = d3.select("#browserCheck")
        if (!warningDiv.classed("hidden")) {
            const offset = 10 + warningDiv.node().getBoundingClientRect().height
            d3.select("#logo").style("padding", offset + "px 10px")
        } else {
            // remove the dynamic padding from the logo element;
            d3.select("#logo").style("padding", "10px")
        }

        // scrollbar tests;
        const element = d3.select("#menuElementContainer").node()
        const maxScrollLeft = element.scrollWidth - element.clientWidth
        const leftButton = d3.select("#scrollLeftButton")
        const rightButton = d3.select("#scrollRightButton")
        if (maxScrollLeft > 0) {
            // show both and then check how far is bar;
            rightButton.classed("hidden", false)
            leftButton.classed("hidden", false)
            this.options.navigationMenu.updateScrollButtonVisibility()
        } else {
            // hide both;
            rightButton.classed("hidden", true)
            leftButton.classed("hidden", true)
        }

        // adjust height of the leftSidebar element;
        this.options.editSidebar.updateElementWidth()

        const hs = d3.select("#drag_msg").node().getBoundingClientRect().height
        const ws = d3
            .select("#drag_msg")
            .node()
            .getBoundingClientRect().labelWidth
        d3.select("#drag_icon_group").attr(
            "transform",
            "translate ( " + 0.25 * ws + " " + 0.25 * hs + ")",
        )
    }

    #adjustSliderSize() {
        // TODO: refactor and put this into the slider it self
        const height = window.innerHeight - 40
        const fullHeight = height
        const zoomOutPos = height - 30
        const sliderHeight = 150

        // assuming DOM elements are generated in the index.html
        // todo: refactor for independent usage of graph and app
        if (fullHeight < 150) {
            // hide the slider button;
            d3.select("#zoomSliderParagraph").classed("hidden", true)
            d3.select("#zoomOutButton").classed("hidden", true)
            d3.select("#zoomInButton").classed("hidden", true)
            d3.select("#centerGraphButton").classed("hidden", true)
            return
        }
        d3.select("#zoomSliderParagraph").classed("hidden", false)
        d3.select("#zoomOutButton").classed("hidden", false)
        d3.select("#zoomInButton").classed("hidden", false)
        d3.select("#centerGraphButton").classed("hidden", false)

        let zoomInPos = zoomOutPos - 20
        let centerPos = zoomInPos - 20
        if (fullHeight < 280) {
            // hide the slider button;
            d3.select("#zoomSliderParagraph").classed("hidden", true) //const sliderPos=zoomOutPos-sliderHeight;
            d3.select("#zoomOutButton").style("top", zoomOutPos + "px")
            d3.select("#zoomInButton").style("top", zoomInPos + "px")
            d3.select("#centerGraphButton").style("top", centerPos + "px")
            return
        }

        const sliderPos = zoomOutPos - sliderHeight
        zoomInPos = sliderPos - 20
        centerPos = zoomInPos - 20
        d3.select("#zoomSliderParagraph").classed("hidden", false)
        d3.select("#zoomOutButton").style("top", zoomOutPos + "px")
        d3.select("#zoomInButton").style("top", zoomInPos + "px")
        d3.select("#centerGraphButton").style("top", centerPos + "px")
        d3.select("#zoomSliderParagraph").style("top", sliderPos + "px")
    }

    #touchDevice() {
        try {
            document.createEvent("TouchEvent")
            return true
        } catch (e) {
            return false
        }
    }
}
