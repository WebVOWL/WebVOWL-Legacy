import Deque from "collections/deque"
import d3 from "d3"
import SearchMenu from "../../app/js/menu/searchMenu"
import Trie from "./datastructures/trie"
import AbstractDomainRangeDragger from "./draggers/abstractDomainRangeDragger"
import AbstractDragger from "./draggers/abstractDragger"
import ClassDragger from "./draggers/classDragger"
import DomainDragger from "./draggers/domainDragger"
import RangeDragger from "./draggers/rangeDragger"
import ShadowClone from "./draggers/shadowClone"
import BaseElement from "./elements/BaseElement"
import ArrowLink from "./elements/links/ArrowLink"
import BoxArrowLink from "./elements/links/BoxArrowLink"
import Label from "./elements/links/Label"
import LinkPart from "./elements/links/linkPart"
import PlainLink from "./elements/links/PlainLink"
import BaseNode from "./elements/nodes/BaseNode"
import nodeClassMap from "./elements/nodes/nodeMap"
import BaseProperty from "./elements/properties/BaseProperty"
import propertyClassMap from "./elements/properties/propertyMap"
import AbstractFilter from "./modules/filters/abstractFilter"
import Options from "./options"
import Parser from "./parser"
import LinkCreator from "./parsing/linkCreator"
import ElementTools from "./util/elementTools"
import MathUtils from "./util/math"

export default class Graph {
    CARDINALITY_HDISTANCE = 20
    CARDINALITY_VDISTANCE = 10

    curveFunction = d3.svg
        .line()
        .x(function (/** @type {{ x: any; }} */ d) {
            return d.x
        })
        .y(function (/** @type {{ y: any; }} */ d) {
            return d.y
        })
        .interpolate("cardinal")

    constructor() {
        /**
         * @type {Options | undefined}
         */
        this.options = undefined
        /**
         * @type {Parser | undefined}
         */
        this.parser = undefined
        this._language = "default"
        this._paused = false

        // Container for visual elements
        this.graphContainer = undefined
        this.nodeContainer = undefined
        this.labelContainer = undefined
        this.cardinalityContainer = undefined
        this.linkContainer = undefined

        // Visual elements
        this.nodeElements = undefined
        this.initialLoad = true
        this.updateRenderingDuringSimulation = false
        this.labelGroupElements = undefined
        this.linkGroups = undefined
        this.linkPathElements = undefined
        this.cardinalityElements = undefined

        // Internal data
        /**
         * Currently active nodes.
         * These are the same nodes as rendered by d3-force but without d3-force attributes.
         * @type {BaseNode[] | undefined}
         */
        this.classNodes = []
        /**
         * Currently active label nodes.
         * These are the same nodes as rendered by d3-force but without d3-force attributes.
         * @type {Label[]}
         */
        this.labelNodes = []
        /**
         * Currently active label nodes.
         * These are the same links as rendered by d3-force but without d3-force attributes.
         * @type {(PlainLink | BoxArrowLink | ArrowLink)[]}
         */
        this.links = []
        /**
         * Currently active properties.
         * These are the same properties as rendered by d3-force but without d3-force attributes.
         * @type {BaseProperty[]}
         */
        this.properties = []
        /**
         * All graph data untouched
         * @type {{ nodes: BaseNode[]; properties: BaseProperty[]; }}
         */
        this.unfilteredData = { nodes: [], properties: [] }
        /**
         * Copy of currently active data.
         * @type {{ nodes: BaseNode[]; properties: BaseProperty[]; }}
         */
        this.currentData = { nodes: [], properties: [] }
        /**
         * Trie for search
         * @type {Trie | undefined}
         */
        this.trie = undefined

        // Graph behaviour
        this.force = undefined
        this.dragBehaviour = undefined
        this.zoomFactor = 1.0
        this.centerGraphViewOnLoad = false
        this.transformAnimation = false
        this.graphTranslation = [0, 0]
        this.graphUpdateRequired = false
        /**
         * The currently rendered node IDs that have a pulsating halo
         * @note The ID is a force node ID
         * @type {Set<number>}
         */
        this.visiblePulseNodeIDs = new Set()
        /**
         * All node IDs that have a pulsating halo
         * @note The ID is a node ID, i.e., a string (of a number)
         * @type {string[]}
         */
        this.allPulseNodeIDs = []
        /**
         * A mapping of node IDs to force node IDs
         * @type {Map<string,number>}
         */
        this.forceNodeMap = new Map()
        this.defaultZoom = 1.0
        this.defaultTargetZoom = 0.8
        this.global_dof = -1
        this.touchDevice = false
        this.last_touch_time = undefined
        this.originalD3_dblClickFunction = null
        this.originalD3_touchZoomFunction = null

        // Editing elements
        this.deleteGroupElement = undefined
        this.addDataPropertyGroupElement = undefined
        this.editContainer = undefined
        this.draggerLayer = null
        /**
         * @type {(AbstractDragger | AbstractDomainRangeDragger)[]}
         */
        this.draggerObjectsArray = []
        this.delayedHider = undefined
        this.nodeFreezer = undefined
        this.hoveredNodeElement = null
        this.currentlySelectedNode = null
        this.hoveredPropertyElement = null
        this.draggingStarted = false
        this.frozenDomainForPropertyDragger = undefined
        this.frozenRangeForPropertyDragger = undefined

        this.eP = 0 // id for new properties
        this.eN = 0 // id for new Nodes
        this.isEditorMode = false
        this.debugContainer = d3.select("#FPS_Statistics")
        this.finishedLoadingSequence = false

        this.ignoreOtherHoverEvents = false
        this.forceNotZooming = false
        this.seenEditorHint = false
        this.seenFilterWarning = false
        this.showFilterWarning = false

        // used for fps computation
        this.now = undefined
        this.then = undefined
        this.showFPS = false

        this.keepDetailsCollapsedOnLoading = true
        this.adjustingGraphSize = false
        this.showReloadButtonAfterLayoutOptimization = false
        this.zoom = undefined
        this.classDragger = new ClassDragger(this)
        this.rangeDragger = new RangeDragger(this)
        this.domainDragger = new DomainDragger(this)
        this.shadowClone = new ShadowClone(this)
        this.cachedJsonOBJ = null
    }

    //** --------------------------------------------------------- **/
    //** -- getter and setter definitions                       -- **/
    //** --------------------------------------------------------- **/

    get nodeMap() {
        return this.parser.nodeMap
    }

    get propertyMap() {
        return this.parser.propertyMap
    }

    get paused() {
        return this._paused
    }

    set paused(p) {
        this._paused = p
        this.updateStyle()
    }

    get language() {
        return this._language
    }

    /**
     * @param {string} newLanguage
     */
    set language(newLanguage) {
        // Just update if the language changes
        if (this._language !== newLanguage) {
            this._language = newLanguage || "default"
            this.#redrawContent()
            this.#recalculatePositions()
            this.resetSearchHighlight()
        }
        this.generateDictionary()
    }

    updateZoomSliderValueFromOutside() {
        this.options.zoomSlider.updateZoomSliderValue(this.zoomFactor)
    }

    /**
     * @param {number} zoom
     */
    setDefaultZoom(zoom) {
        this.defaultZoom = zoom
        this.reset()
        this.options.zoomSlider.updateZoomSliderValue(this.defaultZoom)
    }

    /**
     * @param {number} zoom
     */
    setTargetZoom(zoom) {
        this.defaultTargetZoom = zoom
    }

    /**
     * @param {number} zoom
     */
    setSliderZoom(zoom) {
        if (!this.graphContainer) {
            console.warn(
                `Cannot setSliderZoom when graphContainer is ${this.graphContainer}`,
            )
            return
        }

        const cx = 0.5 * this.options.width
        const cy = 0.5 * this.options.height
        const cp = this.#getWorldPosFromScreen(
            cx,
            cy,
            this.graphTranslation,
            this.zoomFactor,
        )
        const sP = [cp.x, cp.y, this.options.height / this.zoomFactor]
        const eP = [cp.x, cp.y, this.options.height / zoom]
        const pos_intp = d3.interpolateZoom(sP, eP)

        const _this = this
        this.graphContainer
            .attr("transform", this.#transform(sP, cx, cy))
            .transition()
            .duration(1)
            .attrTween("transform", function () {
                return function (t) {
                    return _this.#transform(pos_intp(t), cx, cy)
                }
            })
            // @ts-ignore
            .each("end", function () {
                _this.graphContainer.attr(
                    "transform",
                    "translate(" +
                        _this.graphTranslation +
                        ")scale(" +
                        _this.zoomFactor +
                        ")",
                )
                _this.zoom.translate(_this.graphTranslation)
                _this.zoom.scale(_this.zoomFactor)
                _this.options.zoomSlider.updateZoomSliderValue(_this.zoomFactor)
            })
    }

    /**
     * @param {number} zoom
     */
    setZoom(zoom) {
        this.zoom.scale(zoom)
    }

    getScaleFactor() {
        return this.zoomFactor
    }

    /**
     * @param {any[]} translation
     */
    setTranslation(translation) {
        this.zoom.translate([translation[0], translation[1]])
    }

    getTranslation() {
        return this.graphTranslation
    }

    getVisibleNodeElements() {
        return this.nodeElements
    }

    getVisibleLabelNodes() {
        return this.labelNodes
    }

    getVisibleLinks() {
        return this.links
    }

    //** --------------------------------------------------------- **/
    //** graph / rendering  related functions                      **/
    //** --------------------------------------------------------- **/

    /**
     * First-time graph initialization
     */
    initializeGraph() {
        this.parser = new Parser(this)
        let moved = false
        this.force = d3.layout.force().on("tick", () => {
            this.#hiddenRecalculatePositions()
        })

        const _this = this
        this.dragBehaviour = d3.behavior
            .drag()
            .origin(function (/** @type {AbstractDragger} */ d) {
                return d
            })
            .on(
                "dragstart",
                function (
                    /** @type {AbstractDomainRangeDragger | BaseElement} */ d,
                ) {
                    d3.event.sourceEvent.stopPropagation() // Prevent panning
                    _this.ignoreOtherHoverEvents = true
                    if (d instanceof ClassDragger) {
                        _this.classDragger.mouseButtonPressed = true
                        clearTimeout(_this.delayedHider)
                        _this.classDragger.selectedViaTouch(true)
                        d.parentNode.locked = true
                        _this.draggingStarted = true
                    } else if (d instanceof RangeDragger) {
                        _this.ignoreOtherHoverEvents = true
                        clearTimeout(_this.delayedHider)
                        _this.frozenDomainForPropertyDragger =
                            _this.shadowClone.parentNode.domain
                        _this.frozenRangeForPropertyDragger =
                            _this.shadowClone.parentNode.range
                        _this.shadowClone.setInitialPosition()
                        _this.shadowClone.hideClone(false)
                        _this.shadowClone.hideParentProperty(true)
                        _this.shadowClone.updateElement()
                        _this.deleteGroupElement.classed("hidden", true)
                        _this.addDataPropertyGroupElement.classed(
                            "hidden",
                            true,
                        )
                        _this.frozenDomainForPropertyDragger.frozen = true
                        _this.frozenDomainForPropertyDragger.locked = true
                        _this.frozenRangeForPropertyDragger.frozen = true
                        _this.frozenRangeForPropertyDragger.locked = true
                        _this.domainDragger.updateElement()
                        _this.domainDragger.mouseButtonPressed = true
                        _this.rangeDragger.updateElement()
                        _this.rangeDragger.mouseButtonPressed = true
                        //  shadowClone.setPosition(d.x, d.y);
                    } else if (d instanceof DomainDragger) {
                        _this.ignoreOtherHoverEvents = true
                        clearTimeout(_this.delayedHider)
                        _this.frozenDomainForPropertyDragger =
                            _this.shadowClone.parentNode.domain
                        _this.frozenRangeForPropertyDragger =
                            _this.shadowClone.parentNode.range
                        _this.shadowClone.setInitialPosition()
                        _this.shadowClone.hideClone(false)
                        _this.shadowClone.hideParentProperty(true)
                        _this.shadowClone.updateElement()
                        _this.deleteGroupElement.classed("hidden", true)
                        _this.addDataPropertyGroupElement.classed(
                            "hidden",
                            true,
                        )
                        _this.frozenDomainForPropertyDragger.frozen = true
                        _this.frozenDomainForPropertyDragger.locked = true
                        _this.frozenRangeForPropertyDragger.frozen = true
                        _this.frozenRangeForPropertyDragger.locked = true
                        _this.domainDragger.updateElement()
                        _this.domainDragger.mouseButtonPressed = true
                        _this.rangeDragger.updateElement()
                        _this.rangeDragger.mouseButtonPressed = true
                    } else {
                        d.locked = true
                        moved = false
                    }
                },
            )
            .on(
                "drag",
                function (
                    /** @type {AbstractDomainRangeDragger | BaseElement} */ d,
                ) {
                    if (d instanceof ClassDragger) {
                        clearTimeout(_this.delayedHider)
                        _this.classDragger.setPosition(d3.event.x, d3.event.y)
                    } else if (d instanceof RangeDragger) {
                        clearTimeout(_this.delayedHider)
                        _this.rangeDragger.setPosition(d3.event.x, d3.event.y)
                        _this.shadowClone.setPosition(d3.event.x, d3.event.y)
                        _this.domainDragger.updateElementViaRangeDragger(
                            d3.event.x,
                            d3.event.y,
                        )
                    } else if (d instanceof DomainDragger) {
                        clearTimeout(_this.delayedHider)
                        _this.domainDragger.setPosition(d3.event.x, d3.event.y)
                        _this.shadowClone.setPositionDomain(
                            d3.event.x,
                            d3.event.y,
                        )
                        _this.rangeDragger.updateElementViaDomainDragger(
                            d3.event.x,
                            d3.event.y,
                        )
                    } else {
                        d.px = d3.event.x
                        d.py = d3.event.y
                        _this.force.resume()
                        _this.#updateHaloRadius()
                        moved = true
                        if (d.renderType && d.renderType === "round") {
                            _this.classDragger.setParentNode(d)
                        }
                    }
                },
            )
            .on(
                "dragend",
                function (
                    /** @type {AbstractDomainRangeDragger | BaseElement} */ d,
                ) {
                    _this.ignoreOtherHoverEvents = false
                    if (d instanceof ClassDragger) {
                        const nX = _this.classDragger.x
                        const nY = _this.classDragger.y
                        clearTimeout(_this.delayedHider)
                        _this.classDragger.mouseButtonPressed = false
                        _this.classDragger.selectedViaTouch(false)
                        d.setParentNode(d.parentNode)

                        const draggerEndPos = [nX, nY]
                        const targetNode = _this.getTargetNode(draggerEndPos)
                        if (targetNode) {
                            _this.#createNewObjectProperty(
                                d.parentNode,
                                targetNode,
                                draggerEndPos,
                            )
                        }
                        if (!_this.touchDevice) {
                            _this.#editElementHoverOut()
                        }
                        _this.draggingStarted = false
                    } else if (d instanceof RangeDragger) {
                        _this.ignoreOtherHoverEvents = false
                        _this.frozenDomainForPropertyDragger.frozen = false
                        _this.frozenDomainForPropertyDragger.locked = false
                        _this.frozenRangeForPropertyDragger.frozen = false
                        _this.frozenRangeForPropertyDragger.locked = false
                        _this.rangeDragger.mouseButtonPressed = false
                        _this.domainDragger.mouseButtonPressed = false
                        _this.domainDragger.updateElement()
                        _this.rangeDragger.updateElement()
                        _this.shadowClone.hideClone(true)
                        const rX = _this.rangeDragger.x
                        const rY = _this.rangeDragger.y
                        const rangeDraggerEndPos = [rX, rY]
                        let targetRangeNode =
                            _this.getTargetNode(rangeDraggerEndPos)
                        if (ElementTools.isDatatype(targetRangeNode)) {
                            targetRangeNode = null
                            console.log(
                                "---------------TARGET NODE IS A DATATYPE/ LITERAL ------------",
                            )
                        }
                        if (targetRangeNode === null) {
                            d.redrawEverything()
                            _this.shadowClone.hideParentProperty(false)
                        } else {
                            d.updateRange(targetRangeNode)
                            _this.update()
                            _this.shadowClone.hideParentProperty(false)
                        }
                    } else if (d instanceof DomainDragger) {
                        _this.ignoreOtherHoverEvents = false
                        _this.frozenDomainForPropertyDragger.frozen = false
                        _this.frozenDomainForPropertyDragger.locked = false
                        _this.frozenRangeForPropertyDragger.frozen = false
                        _this.frozenRangeForPropertyDragger.locked = false
                        _this.rangeDragger.mouseButtonPressed = false
                        _this.domainDragger.mouseButtonPressed = false
                        _this.domainDragger.updateElement()
                        _this.rangeDragger.updateElement()
                        _this.shadowClone.hideClone(true)

                        const dX = _this.domainDragger.x
                        const dY = _this.domainDragger.y
                        const domainDraggerEndPos = [dX, dY]
                        let targetDomainNode =
                            _this.getTargetNode(domainDraggerEndPos)
                        if (ElementTools.isDatatype(targetDomainNode)) {
                            targetDomainNode = null
                            console.log(
                                "---------------TARGET NODE IS A DATATYPE/ LITERAL ------------",
                            )
                        }
                        _this.shadowClone.hideClone(true)
                        if (targetDomainNode === null) {
                            d.redrawEverything()
                            _this.shadowClone.hideParentProperty(false)
                        } else {
                            d.updateDomain(targetDomainNode)
                            _this.update()
                            _this.shadowClone.hideParentProperty(false)
                        }
                    } else {
                        d.locked = false
                        const pnp = _this.options.pickAndPinModule
                        if (pnp.enabled && moved) {
                            if (d.id) {
                                // node
                                pnp.handle(d, true)
                            }
                            if (d.property) {
                                pnp.handle(d.property, true)
                            }
                        }
                    }
                },
            )

        // Apply the zooming factor.
        this.zoom = d3.behavior
            .zoom()
            .duration(150)
            .scaleExtent([
                this.options.minMagnification,
                this.options.maxMagnification,
            ])
            .on("zoom", () => {
                this.#zoomed()
            })
        this.draggerObjectsArray.push(this.classDragger)
        this.draggerObjectsArray.push(this.rangeDragger)
        this.draggerObjectsArray.push(this.domainDragger)
        this.draggerObjectsArray.push(this.shadowClone)
        this.force.stop()
    }

    lazyRefresh() {
        this.#redrawContent()
        this.#recalculatePositions()
    }

    #hiddenRecalculatePositions() {
        this.finishedLoadingSequence = false
        if (!this.options.loadingModule.loadingWasSuccessFul) {
            this.force.stop()
            d3.select("#progressBarValue").node().innerHTML = ""
            this.updateProgressBarMode()
            this.options.loadingModule.showErrorDetailsMessage()
            if (
                this.keepDetailsCollapsedOnLoading &&
                !this.adjustingGraphSize
            ) {
                this.options.loadingModule.collapseDetails()
            }
            return
        }
        if (!this.updateRenderingDuringSimulation) {
            const value = 1.0 - 10 * this.force.alpha()
            let percent = Math.round(200 * value) + "%"
            this.options.loadingModule.setPercentValue(percent)
            d3.select("#progressBarValue").style("width", percent)
            d3.select("#progressBarValue").node().innerHTML = percent

            if (value > 0.49) {
                this.updateRenderingDuringSimulation = true
                // show graph container;
                if (this.graphContainer) {
                    this.graphContainer.style("opacity", "1")
                    percent = "100%"
                    d3.select("#progressBarValue").style("width", percent)
                    d3.select("#progressBarValue").node().innerHTML = percent
                    this.options.ontologyMenu.append_message_toLastBulletPoint(
                        "done",
                    )
                    d3.select("#reloadCachedOntology").classed(
                        "hidden",
                        !this.showReloadButtonAfterLayoutOptimization,
                    )
                    if (this.showFilterWarning && !this.seenFilterWarning) {
                        this.options.warningModule.showFilterHint()
                        this.seenFilterWarning = true
                    }
                }

                if (this.initialLoad) {
                    if (!this._paused) {
                        this.force.resume() // resume force
                    }
                    this.initialLoad = false
                }
                this.finishedLoadingSequence = true
                if (this.showFPS) {
                    this.force.on("tick", () => {
                        this.#recalculatePositionsWithFPS()
                    })
                    this.#recalculatePositionsWithFPS()
                } else {
                    this.force.on("tick", () => {
                        this.#recalculatePositions()
                    })
                    this.#recalculatePositions()
                }
                if (
                    this.centerGraphViewOnLoad &&
                    this.force.nodes().length > 0
                ) {
                    if (this.force.nodes().length < 10) {
                        this.forceRelocationEvent(true) // uses dynamic zoomer;
                    } else {
                        this.forceRelocationEvent()
                    }
                    this.centerGraphViewOnLoad = false
                }
                this.showEditorHintIfNeeded()

                if (!this.options.loadingModule.missingImportsWarning) {
                    this.options.loadingModule.hideLoadingIndicator()
                    this.options.ontologyMenu.append_bulletPoint(
                        "Successfully loaded ontology",
                    )
                    this.options.loadingModule.setSuccessful()
                } else {
                    this.options.loadingModule.showWarningDetailsMessage()
                    this.options.ontologyMenu.append_bulletPoint(
                        "Loaded ontology with warnings",
                    )
                }
            }
        }
    }

    showEditorHintIfNeeded() {
        if (!this.seenEditorHint && this.isEditorMode) {
            this.seenEditorHint = true
            this.options.warningModule.showEditorHint()
        }
        this.showFPS
    }

    setForceTickFunctionWithFPS() {
        this.showFPS = true
        if (this.force && this.finishedLoadingSequence) {
            this.force.on("tick", () => {
                this.#recalculatePositionsWithFPS()
            })
        }
    }

    setDefaultForceTickFunction() {
        this.showFPS = false
        if (this.force && this.finishedLoadingSequence) {
            this.force.on("tick", () => {
                this.#recalculatePositions()
            })
        }
    }

    #recalculatePositionsWithFPS() {
        // compute the fps
        this.#recalculatePositions()
        this.now = Date.now()
        const diff = this.now - this.then
        const fps = (1000 / diff).toFixed(2)

        this.debugContainer.node().innerHTML =
            "FPS: " +
            fps +
            "<br>" +
            "Nodes: " +
            this.force.nodes().length +
            "<br>" +
            "Links: " +
            this.force.links().length
        this.then = Date.now()
    }

    #recalculatePositions() {
        if (!this.nodeElements) {
            console.warn(
                `Cannot recalculatePositions when nodeElements is ${this.nodeElements}`,
            )
            return
        }

        const _this = this
        // add switch for edit mode to make this faster;
        if (!this.isEditorMode) {
            this.nodeElements.attr("transform", function (node) {
                return "translate(" + node.x + "," + node.y + ")"
            })

            // Set label group positions
            this.labelGroupElements.attr("transform", function (label) {
                // force centered positions on single-layered links
                const link = label.link
                if (link.layers === 1 && !link.loops) {
                    const linkDomainIntersection =
                        MathUtils.calculateIntersection(
                            link.range,
                            link.domain,
                            0,
                        )
                    const linkRangeIntersection =
                        MathUtils.calculateIntersection(
                            link.domain,
                            link.range,
                            0,
                        )
                    const position = MathUtils.calculateCenter(
                        linkDomainIntersection,
                        linkRangeIntersection,
                    )
                    label.x = position.x
                    label.y = position.y
                }
                return "translate(" + label.x + "," + label.y + ")"
            })
            // Set link paths and calculate additional information
            this.linkPathElements.attr("d", function (l) {
                if (l.isLoop()) {
                    return MathUtils.calculateLoopPath(l)
                }
                const curvePoint = l.label
                const pathStart = MathUtils.calculateIntersection(
                    curvePoint,
                    l.domain,
                    1,
                )
                const pathEnd = MathUtils.calculateIntersection(
                    curvePoint,
                    l.range,
                    1,
                )
                return _this.curveFunction([pathStart, curvePoint, pathEnd])
            })

            // Set cardinality positions
            this.cardinalityElements.attr("transform", function (property) {
                const label = property.link.label,
                    pos = MathUtils.calculateIntersection(
                        label,
                        property.range,
                        _this.CARDINALITY_HDISTANCE,
                    ),
                    normalV = MathUtils.calculateNormalVector(
                        label,
                        property.range,
                        _this.CARDINALITY_VDISTANCE,
                    )
                return (
                    "translate(" +
                    (pos.x + normalV.x) +
                    "," +
                    (pos.y + normalV.y) +
                    ")"
                )
            })
            this.#updateHaloRadius()
            return
        }

        // TODO: this is Editor redraw function // we need to make this faster!!
        this.nodeElements.attr("transform", function (node) {
            return "translate(" + node.x + "," + node.y + ")"
        })

        // Set label group positions
        this.labelGroupElements.attr("transform", function (label) {
            // force centered positions on single-layered links
            const link = label.link
            if (link.layers === 1 && !link.loops) {
                const linkDomainIntersection = MathUtils.calculateIntersection(
                    link.range,
                    link.domain,
                    0,
                )
                const linkRangeIntersection = MathUtils.calculateIntersection(
                    link.domain,
                    link.range,
                    0,
                )
                const position = MathUtils.calculateCenter(
                    linkDomainIntersection,
                    linkRangeIntersection,
                )
                label.x = position.x
                label.y = position.y
                label.linkRangeIntersection = linkRangeIntersection
                label.linkDomainIntersection = linkDomainIntersection
                if (
                    link.property.focused ||
                    _this.hoveredPropertyElement !== undefined
                ) {
                    _this.rangeDragger.updateElement()
                    _this.domainDragger.updateElement()
                    // shadowClone.setPosition(link.property.range.x,link.property.range.y);
                    // shadowClone.setPositionDomain(link.property.domain.x,link.property.domain.y);
                }
            } else {
                label.linkDomainIntersection = MathUtils.calculateIntersection(
                    link.label,
                    link.domain,
                    0,
                )
                label.linkRangeIntersection = MathUtils.calculateIntersection(
                    link.label,
                    link.range,
                    0,
                )
                if (
                    link.property.focused ||
                    _this.hoveredPropertyElement !== undefined
                ) {
                    _this.rangeDragger.updateElement()
                    _this.domainDragger.updateElement()
                    // shadowClone.setPosition(link.property.range.x,link.property.range.y);
                    // shadowClone.setPositionDomain(link.property.domain.x,link.property.domain.y);
                }
            }
            return "translate(" + label.x + "," + label.y + ")"
        })
        // Set link paths and calculate additional information
        this.linkPathElements.attr("d", function (l) {
            if (l.isLoop()) {
                const ptrAr = MathUtils.getLoopPoints(l)
                l.label.linkRangeIntersection = ptrAr[1]
                l.label.linkDomainIntersection = ptrAr[0]

                if (
                    l.property.focused ||
                    _this.hoveredPropertyElement !== undefined
                ) {
                    _this.rangeDragger.updateElement()
                    _this.domainDragger.updateElement()
                }
                return MathUtils.calculateLoopPath(l)
            }
            const curvePoint = l.label
            const pathStart = MathUtils.calculateIntersection(
                curvePoint,
                l.domain,
                1,
            )
            const pathEnd = MathUtils.calculateIntersection(
                curvePoint,
                l.range,
                1,
            )
            l.linkRangeIntersection = pathStart
            l.linkDomainIntersection = pathEnd
            if (
                l.property.focused ||
                _this.hoveredPropertyElement !== undefined
            ) {
                _this.domainDragger.updateElement()
                _this.rangeDragger.updateElement()
                // shadowClone.setPosition(l.property.range.x,l.property.range.y);
                // shadowClone.setPositionDomain(l.property.domain.x,l.property.domain.y);
            }
            return _this.curveFunction([pathStart, curvePoint, pathEnd])
        })

        // Set cardinality positions
        this.cardinalityElements.attr("transform", function (property) {
            const label = property.link.label,
                pos = MathUtils.calculateIntersection(
                    label,
                    property.range,
                    _this.CARDINALITY_HDISTANCE,
                ),
                normalV = MathUtils.calculateNormalVector(
                    label,
                    property.range,
                    _this.CARDINALITY_VDISTANCE,
                )
            return (
                "translate(" +
                (pos.x + normalV.x) +
                "," +
                (pos.y + normalV.y) +
                ")"
            )
        })

        if (this.hoveredNodeElement) {
            this.#setDeleteHoverElementPosition(this.hoveredNodeElement)
            this.#setAddDataPropertyHoverElementPosition(
                this.hoveredNodeElement,
            )
            if (!this.draggingStarted) {
                this.classDragger.setParentNode(this.hoveredNodeElement)
            }
        }
        if (this.hoveredPropertyElement) {
            this.#setDeleteHoverElementPositionProperty(
                this.hoveredPropertyElement,
            )
        }
        this.#updateHaloRadius()
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} property
     */
    updatePropertyDraggerElements(property) {
        if (property.type !== "owl:DatatypeProperty") {
            this.shadowClone.setParentProperty(property)
            this.rangeDragger.setParentProperty(property)
            this.rangeDragger.hideDragger(false)
            this.rangeDragger.addMouseEvents()
            this.domainDragger.setParentProperty(property)
            this.domainDragger.hideDragger(false)
            this.domainDragger.addMouseEvents()
        } else {
            this.rangeDragger.hideDragger(true)
            this.domainDragger.hideDragger(true)
            this.shadowClone.hideClone(true)
        }
    }

    #addClickEvents() {
        const _this = this

        /**
         * @param {any} selectedElement
         */
        function executeModules(selectedElement) {
            for (const module of _this.options.selectionModules) {
                module.handle(selectedElement)
            }
        }

        this.nodeElements.on("click", function (clickedNode) {
            // manaual double clicker // helper for iphone 6 etc...
            if (_this.touchDevice && _this.#doubletap()) {
                d3.event.stopPropagation()
                if (_this.isEditorMode) {
                    clickedNode.raiseDoubleClickEdit(
                        _this.#defaultIriValue(clickedNode),
                    )
                }
            } else {
                executeModules(clickedNode)
            }
        })

        this.nodeElements.on("dblclick", function (clickedNode) {
            d3.event.stopPropagation()
            if (_this.isEditorMode) {
                clickedNode.raiseDoubleClickEdit(
                    _this.#defaultIriValue(clickedNode),
                )
            }
        })

        this.labelGroupElements
            .selectAll(".label")
            .on("click", function (clickedProperty) {
                executeModules(clickedProperty)
                // this is for enviroments that do not define dblClick function;
                if (_this.touchDevice && _this.#doubletap()) {
                    d3.event.stopPropagation()
                    if (_this.isEditorMode) {
                        clickedProperty.raiseDoubleClickEdit(
                            _this.#defaultIriValue(clickedProperty),
                        )
                    }
                }

                // currently removed the selection of an element to invoke the dragger
                // if (isEditorMode===true && clickedProperty.editingTextElement!==true) {
                //     return;
                //      // We say that Datatype properties are not allowed to have domain range draggers
                //      if (clickedProperty.focused && clickedProperty.type !== "owl:DatatypeProperty") {
                //          shadowClone.setParentProperty(clickedProperty);
                //          rangeDragger.setParentProperty(clickedProperty);
                //          rangeDragger.hideDragger(false);
                //          rangeDragger.addMouseEvents();
                //          domainDragger.setParentProperty(clickedProperty);
                //          domainDragger.hideDragger(false);
                //          domainDragger.addMouseEvents();
                //
                //          if (clickedProperty.domain===clickedProperty.range){
                //              clickedProperty.labelObject.increasedLoopAngle=true;
                //              #recalculatePositions();
                //
                //          }
                //
                //      } else if (clickedProperty.focused && clickedProperty.type === "owl:DatatypeProperty") {
                //          shadowClone.setParentProperty(clickedProperty);
                //          rangeDragger.setParentProperty(clickedProperty);
                //          rangeDragger.hideDragger(true);
                //          rangeDragger.addMouseEvents();
                //          domainDragger.setParentProperty(clickedProperty);
                //          domainDragger.hideDragger(false);
                //          domainDragger.addMouseEvents();
                //
                //      }
                //      else {
                //          rangeDragger.hideDragger(true);
                //          domainDragger.hideDragger(true);
                //          if (clickedProperty.domain===clickedProperty.range){
                //              clickedProperty.labelObject.increasedLoopAngle=false;
                //              #recalculatePositions();
                //
                //          }
                //      }
                //  }
            })
        this.labelGroupElements
            .selectAll(".label")
            .on("dblclick", function (clickedProperty) {
                d3.event.stopPropagation()
                if (_this.isEditorMode) {
                    clickedProperty.raiseDoubleClickEdit(
                        _this.#defaultIriValue(clickedProperty),
                    )
                }
            })
    }

    /**
     * @param {BaseElement} element
     */
    #defaultIriValue(element) {
        // get the iri of that element;
        if (this.options.generalOntologyMetaData.iri) {
            const str2Compare =
                this.options.generalOntologyMetaData.iri + element.id
            return element.iri === str2Compare
        }
        return false
    }

    /** Adjusts the containers current scale and position. */
    #zoomed() {
        if (this.forceNotZooming) {
            this.zoom.translate(this.graphTranslation)
            this.zoom.scale(this.zoomFactor)
            return
        }

        let zoomEventByMWheel = false
        if (d3.event.sourceEvent) {
            if (d3.event.sourceEvent.deltaY) {
                zoomEventByMWheel = true
            }
        }
        if (!zoomEventByMWheel) {
            if (this.transformAnimation) {
                return
            }
            this.zoomFactor = d3.event.scale
            this.graphTranslation = d3.event.translate
            this.graphContainer.attr(
                "transform",
                "translate(" +
                    this.graphTranslation +
                    ")scale(" +
                    this.zoomFactor +
                    ")",
            )
            this.#updateHaloRadius()
            this.options.zoomSlider.updateZoomSliderValue(this.zoomFactor)
            return
        }
        /** animate the transition **/
        const _this = this
        this.zoomFactor = d3.event.scale
        this.graphTranslation = d3.event.translate
        this.graphContainer
            .transition()
            .tween("attr.translate", function () {
                return function (t) {
                    _this.transformAnimation = true
                    const tr = d3.transform(
                        _this.graphContainer.attr("transform"),
                    )
                    _this.graphTranslation[0] = tr.translate[0]
                    _this.graphTranslation[1] = tr.translate[1]
                    _this.zoomFactor = tr.scale[0]
                    _this.#updateHaloRadius()
                    _this.options.zoomSlider.updateZoomSliderValue(
                        _this.zoomFactor,
                    )
                }
            })
            // @ts-ignore
            .each("end", function () {
                _this.transformAnimation = false
            })
            .attr(
                "transform",
                "translate(" +
                    this.graphTranslation +
                    ")scale(" +
                    this.zoomFactor +
                    ")",
            )
            .ease("linear")
            .duration(250)
    }

    #redrawGraphContainer() {
        this.#remove()
        this.graphContainer = d3
            .selectAll(this.options.graphContainerSelector)
            .append("svg")
            .classed("vowlGraph", true)
            .attr("width", this.options.width)
            .attr("height", this.options.height)
            .call(this.zoom)
            .append("g")

        // add touch and double click functions
        const svgGraph = d3.selectAll(".vowlGraph")
        this.originalD3_dblClickFunction = svgGraph.on("dblclick.zoom")
        this.originalD3_touchZoomFunction = svgGraph.on("touchstart")
        svgGraph.on("touchstart", () => {
            this.#touchzoomed()
        })
        if (this.isEditorMode) {
            svgGraph.on("dblclick.zoom", () => {
                this.modified_dblClickFunction()
            })
        } else {
            svgGraph.on("dblclick.zoom", this.originalD3_dblClickFunction)
        }
    }

    #generateEditElements() {
        this.addDataPropertyGroupElement = this.editContainer
            .append("g")
            .classed("hidden-in-export", true)
            .classed("hidden", true)
            .classed("addDataPropertyElement", true)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
        this.addDataPropertyGroupElement
            .append("circle")
            // .classed("deleteElement", true)
            .attr("r", 12)
            .attr("cx", 0)
            .attr("cy", 0)
            .append("title")
            .text("Add Datatype Property")
        this.addDataPropertyGroupElement
            .append("line")
            // .classed("deleteElementIcon ",true)
            .attr("x1", -8)
            .attr("y1", 0)
            .attr("x2", 8)
            .attr("y2", 0)
            .append("title")
            .text("Add Datatype Property")
        this.addDataPropertyGroupElement
            .append("line")
            // .classed("deleteElementIcon",true)
            .attr("x1", 0)
            .attr("y1", -8)
            .attr("x2", 0)
            .attr("y2", 8)
            .append("title")
            .text("Add Datatype Property")
        if (this.options.useAccuracyHelper) {
            this.addDataPropertyGroupElement
                .append("circle")
                .attr("r", 15)
                .attr("cx", -7)
                .attr("cy", 7)
                .classed("superHiddenElement", true)
                .classed("superOpacityElement", !this.options.showDraggerObject)
        }
        this.deleteGroupElement = this.editContainer
            .append("g")
            .classed("hidden-in-export", true)
            .classed("hidden", true)
            .classed("deleteParentElement", true)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
        this.deleteGroupElement
            .append("circle")
            .attr("r", 12)
            .attr("cx", 0)
            .attr("cy", 0)
            .append("title")
            .text("Delete This Node")
        const crossLen = 5
        this.deleteGroupElement
            .append("line")
            .attr("x1", -crossLen)
            .attr("y1", -crossLen)
            .attr("x2", crossLen)
            .attr("y2", crossLen)
            .append("title")
            .text("Delete This Node")
        this.deleteGroupElement
            .append("line")
            .attr("x1", crossLen)
            .attr("y1", -crossLen)
            .attr("x2", -crossLen)
            .attr("y2", crossLen)
            .append("title")
            .text("Delete This Node")
        if (this.options.useAccuracyHelper) {
            this.deleteGroupElement
                .append("circle")
                .attr("r", 15)
                .attr("cx", 7)
                .attr("cy", -7)
                .classed("superHiddenElement", true)
                .classed("superOpacityElement", !this.options.showDraggerObject)
        }
    }

    getClassDataForTtlExport() {
        const allNodes = this.unfilteredData.nodes
        const nodeData = []
        for (let i = 0; i < allNodes.length; i++) {
            const node = allNodes[i]
            if (
                node.type !== "rdfs:Literal" &&
                node.type !== "rdfs:Datatype" &&
                node.type !== "owl:Thing"
            ) {
                nodeData.push(node)
            }
        }
        return nodeData
    }

    getPropertyDataForTtlExport() {
        const propertyData = []
        const allProperties = this.unfilteredData.properties
        for (let i = 0; i < allProperties.length; i++) {
            const property = allProperties[i]
            // currently using only the object properties
            if (
                property.type === "owl:ObjectProperty" ||
                property.type === "owl:DatatypeProperty" ||
                property.type === "owl:ObjectProperty"
            ) {
                propertyData.push(property)
            } else {
                if (property.type === "rdfs:subClassOf") {
                    property.baseIri = "http://www.w3.org/2000/01/rdf-schema#"
                    property.iri =
                        "http://www.w3.org/2000/01/rdf-schema#subClassOf"
                }
                if (property.type === "owl:disjointWith") {
                    property.baseIri = "http://www.w3.org/2002/07/owl#"
                    property.iri = "http://www.w3.org/2002/07/owl#disjointWith"
                }
            }
        }
        return propertyData
    }

    // NOTE: Disabled to save memory while this method is not used
    // /**
    //  * This function is a no-op. It is currently not used anywhere in the code base.
    //  * @returns An empty array. Always.
    //  */
    // graph.getAxiomsForTtlExport = function () {
    //     const axioms = [];
    //     const allProperties = unfilteredData.properties;
    //     for (const i = 0; i < allProperties.length; i++) {
    //         // currently using only the object properties
    //         if (allProperties[i].type === "owl:ObjectProperty" ||
    //             allProperties[i].type === "owl:DatatypeProperty" ||
    //             allProperties[i].type === "owl:ObjectProperty" ||
    //             allProperties[i].type === "rdfs:subClassOf"
    //         ) { } else { }
    //     }
    //     return axioms;
    // }

    #redrawContent() {
        if (!this.graphContainer) {
            return
        }

        // Empty the graph container
        this.graphContainer.selectAll("*").remove()

        // Last container -> elements of this container overlap others
        this.linkContainer = this.graphContainer
            .append("g")
            .classed("linkContainer", true)
        this.cardinalityContainer = this.graphContainer
            .append("g")
            .classed("cardinalityContainer", true)
        this.labelContainer = this.graphContainer
            .append("g")
            .classed("labelContainer", true)
        this.nodeContainer = this.graphContainer
            .append("g")
            .classed("nodeContainer", true)

        // adding editing Elements
        const draggerPathLayer = this.graphContainer
            .append("g")
            .classed("linkContainer", true)
        this.draggerLayer = this.graphContainer
            .append("g")
            .classed("editContainer", true)
        this.editContainer = this.graphContainer
            .append("g")
            .classed("editContainer", true)

        draggerPathLayer.classed("hidden-in-export", true)
        this.editContainer.classed("hidden-in-export", true)
        this.draggerLayer.classed("hidden-in-export", true)

        // Add an extra container for all markers
        let markerContainer = this.linkContainer.append("defs")

        const _this = this
        const drElement = this.draggerLayer
            .selectAll(".node")
            .data(_this.draggerObjectsArray)
            .enter()
            .append("g")
            .classed("node", true)
            .classed("hidden-in-export", true)
            .attr("id", function (d) {
                return d.id
            })
            .call(_this.dragBehaviour)
        drElement.each(function (node) {
            node.svgRoot = d3.select(this)
            node.svgPathLayer(draggerPathLayer)
            if (node instanceof ShadowClone) {
                node.drawClone()
                node.hideClone(true)
            } else {
                node.drawNode()
                node.hideDragger(true)
            }
        })
        this.#generateEditElements()

        // Add an extra container for all markers
        markerContainer = this.linkContainer.append("defs")

        // Draw nodes
        this.nodeElements = this.nodeContainer
            .selectAll(".node")
            .data(this.classNodes)
            .enter()
            .append("g")
            .classed("node", true)
            .attr("id", function (d) {
                return d.id
            })
            .call(this.dragBehaviour)

        this.nodeElements.each(function (node) {
            node.draw(d3.select(this))
        })

        // Draw label groups (property + inverse)
        this.labelGroupElements = this.labelContainer
            .selectAll(".labelGroup")
            .data(this.labelNodes)
            .enter()
            .append("g")
            .classed("labelGroup", true)
            .call(this.dragBehaviour)
        this.labelGroupElements.each(function (label) {
            const success = label.draw(d3.select(this))
            label.property.labelObject = label
            // Remove empty groups without a label.
            if (!success) {
                d3.select(this).remove()
            }
        })

        // Place subclass label groups on the bottom of all labels
        this.labelGroupElements.each(function (label) {
            // the label might be hidden e.g. in compact notation
            if (!this.parentNode) {
                return
            }

            if (ElementTools.isRdfsSubClassOf(label.property)) {
                const parentNode = this.parentNode
                parentNode.insertBefore(this, parentNode.firstChild)
            }
        })

        // Draw cardinality elements
        this.cardinalityElements = this.cardinalityContainer
            .selectAll(".cardinality")
            .data(this.properties)
            .enter()
            .append("g")
            .classed("cardinality", true)
        this.cardinalityElements.each(function (property) {
            const success = property.drawCardinality(d3.select(this))
            // Remove empty groups without a label.
            if (!success) {
                d3.select(this).remove()
            }
        })

        // Draw links
        this.linkGroups = this.linkContainer
            .selectAll(".link")
            .data(this.links)
            .enter()
            .append("g")
            .classed("link", true)
        this.linkGroups.each(function (link) {
            link.draw(d3.select(this), markerContainer)
        })

        this.linkPathElements = this.linkGroups.selectAll("path")
        // Select the path for direct access to receive a better performance
        this.#addClickEvents()
    }

    #remove() {
        if (this.graphContainer) {
            // Select the parent element because the graph container is a group (e.g. for zooming)
            d3.select(this.graphContainer.node().parentNode).remove()
        }
    }

    updateCanvasContainerSize() {
        if (this.graphContainer) {
            const svgElement = d3.selectAll(".vowlGraph")
            svgElement.attr("width", this.options.width)
            svgElement.attr("height", this.options.height)
            this.graphContainer.attr(
                "transform",
                "translate(" +
                    this.graphTranslation +
                    ")scale(" +
                    this.zoomFactor +
                    ")",
            )
        }
    }

    // Updates only the style of the graph.
    updateStyle() {
        this.#refreshGraphStyle()
        if (!this.options.loadingModule.loadingWasSuccessFul) {
            this.force.stop()
        } else {
            this.force.start()
        }
    }

    /**
     * Entrypoint for repeated ontology loading
     */
    load() {
        this.#redrawGraphContainer()
        this.#loadGraphData()
        this.currentData = this.unfilteredData
        this.update(this.unfilteredData, true)
    }

    fastUpdate() {
        // fast update function for editor calls;
        // -- experimental ;
        this.#quick_refreshGraphData()
        this.#updateNodeMap()
        this.force.start()
        this.#redrawContent()
        this.updatePulseIds(this.allPulseNodeIDs)
        this.#refreshGraphStyle()
        this.#updateHaloStyles()
    }

    #updateNodeMap() {
        this.forceNodeMap.clear()
        const forceNodes = this.force.nodes()
        for (let i = 0; i < forceNodes.length; i++) {
            const node = forceNodes[i]
            if (node.id) {
                this.forceNodeMap.set(node.id, i)
                // check for equivalents
                const eqs = node.equivalents
                if (eqs && eqs.length > 0) {
                    for (let j = 0; j < eqs.length; j++) {
                        const eqObject = eqs[j]
                        this.forceNodeMap.set(eqObject.id, i)
                    }
                }
            }
            if (node.property) {
                this.forceNodeMap.set(node.property.id, i)
                const inverse = node.inverse
                if (inverse) {
                    this.forceNodeMap.set(inverse.id, i)
                }
            }
        }
    }

    #updateHaloStyles() {
        for (const node of this.force.nodes()) {
            if (node.id) {
                const haloElement = node.haloGroupElement
                if (haloElement) {
                    const halo = haloElement.selectAll(".searchResultA")
                    halo.classed("searchResultA", false)
                    halo.classed("searchResultB", true)
                }
            }
            if (node.property) {
                const haloElement = node.property.haloGroupElement
                if (haloElement) {
                    const halo = haloElement.selectAll(".searchResultA")
                    halo.classed("searchResultA", false)
                    halo.classed("searchResultB", true)
                }
            }
        }
    }

    /**
     * Updates the graphs displayed data and style.
     * @note `data` will be mutated by this function.
     * @param {{ nodes: BaseNode[]; properties: BaseProperty[]; }} data
     */
    update(data = this.currentData, init = false) {
        if (!this.options.loadingModule.loadingWasSuccessFul) {
            return
        }
        this.keepDetailsCollapsedOnLoading = false
        this.#refreshGraphData(data, init)
        this.#updateNodeMap()
        this.force.start()
        this.#redrawContent()
        this.updatePulseIds(this.allPulseNodeIDs)
        this.#refreshGraphStyle()
        this.#updateHaloStyles()
    }

    /**
     * resetting the graph
     */
    reset() {
        if (this.unfilteredData) {
            this.#filterFunction(
                this.options.nodeDegreeFilter,
                this.unfilteredData,
                true,
            )
        }
        this.currentData = this.unfilteredData

        // window size
        const w = 0.5 * this.options.width
        const h = 0.5 * this.options.height
        // computing initial translation for the graph due to the dynamic default zoom level
        const tx = w - this.defaultZoom * w
        const ty = h - this.defaultZoom * h
        this.zoom.translate([tx, ty]).scale(this.defaultZoom)
    }

    zoomOut() {
        const minMag = this.options.minMagnification
        const maxMag = this.options.maxMagnification
        const stepSize = (maxMag - minMag) / 10
        let val = this.zoomFactor - stepSize
        if (val < minMag) {
            val = minMag
        }
        const cx = 0.5 * this.options.width
        const cy = 0.5 * this.options.height
        const cp = this.#getWorldPosFromScreen(
            cx,
            cy,
            this.graphTranslation,
            this.zoomFactor,
        )
        const sP = [cp.x, cp.y, this.options.height / this.zoomFactor]
        const eP = [cp.x, cp.y, this.options.height / val]
        const pos_intp = d3.interpolateZoom(sP, eP)

        const _this = this
        this.graphContainer
            .attr("transform", this.#transform(sP, cx, cy))
            .transition()
            .duration(250)
            .attrTween("transform", function () {
                return function (t) {
                    return _this.#transform(pos_intp(t), cx, cy)
                }
            })
            // @ts-ignore
            .each("end", function () {
                _this.graphContainer.attr(
                    "transform",
                    "translate(" +
                        _this.graphTranslation +
                        ")scale(" +
                        _this.zoomFactor +
                        ")",
                )
                _this.zoom.translate(_this.graphTranslation)
                _this.zoom.scale(_this.zoomFactor)
                _this.#updateHaloRadius()
                _this.options.zoomSlider.updateZoomSliderValue(_this.zoomFactor)
            })
    }

    zoomIn() {
        const minMag = this.options.minMagnification
        const maxMag = this.options.maxMagnification
        const stepSize = (maxMag - minMag) / 10
        let val = this.zoomFactor + stepSize
        if (val > maxMag) {
            val = maxMag
        }
        const cx = 0.5 * this.options.width
        const cy = 0.5 * this.options.height
        const cp = this.#getWorldPosFromScreen(
            cx,
            cy,
            this.graphTranslation,
            this.zoomFactor,
        )
        const sP = [cp.x, cp.y, this.options.height / this.zoomFactor]
        const eP = [cp.x, cp.y, this.options.height / val]
        const pos_intp = d3.interpolateZoom(sP, eP)

        const _this = this
        this.graphContainer
            .attr("transform", this.#transform(sP, cx, cy))
            .transition()
            .duration(250)
            .attrTween("transform", function () {
                return function (t) {
                    return _this.#transform(pos_intp(t), cx, cy)
                }
            })
            // @ts-ignore
            .each("end", function () {
                _this.graphContainer.attr(
                    "transform",
                    "translate(" +
                        _this.graphTranslation +
                        ")scale(" +
                        _this.zoomFactor +
                        ")",
                )
                _this.zoom.translate(_this.graphTranslation)
                _this.zoom.scale(_this.zoomFactor)
                _this.#updateHaloRadius()
                _this.options.zoomSlider.updateZoomSliderValue(_this.zoomFactor)
            })
    }

    //** --------------------------------------------------------- **/
    //** -- data related handling                               -- **/
    //** --------------------------------------------------------- **/

    clearAllGraphData() {
        if (
            this.getVisibleNodeElements() &&
            !this.getVisibleNodeElements().empty()
        ) {
            this.cachedJsonOBJ =
                this.options.exportMenu.createJSON_exportObject()
        } else {
            this.cachedJsonOBJ = null
        }
        this.force.stop()
        if (this.unfilteredData) {
            this.unfilteredData.nodes = []
            this.unfilteredData.properties = []
        }
    }

    // removes data when data could not be loaded
    clearGraphData() {
        this.force.stop()
        const sidebar = this.options.sidebar
        if (sidebar) {
            sidebar.clearOntologyInformation()
        }
        if (this.graphContainer) {
            this.#redrawGraphContainer()
        }
    }

    generateDictionary() {
        this.trie = new Trie()

        /**
         * @param {BaseElement} item
         */
        const addItem = (item) => {
            const label = item.labelForCurrentLanguage()
            if (label) {
                this.trie.add(label.toLowerCase(), item.id)
            }
            // Add all equivalents
            if (item.equivalents && item.equivalents.length > 0) {
                const eqsLabels = item
                    .equivalentsString()
                    .toLowerCase()
                    .split(", ")
                for (const label of eqsLabels) {
                    this.trie.add(label, item.id)
                }
            }
        }

        const invalidNodes = this.options.emptyLiteralFilter.removedNodes
        for (const node of this.unfilteredData.nodes) {
            if (invalidNodes.has(node.id)) {
                continue
            }
            addItem(node)
        }
        for (const property of this.unfilteredData.properties) {
            addItem(property)
        }
    }

    updateProgressBarMode() {
        const loadingModule = this.options.loadingModule
        const state = loadingModule.progressBarMode

        switch (state) {
            case 0:
                loadingModule.setErrorMode()
                break
            case 1:
                loadingModule.setBusyMode()
                break
            case 2:
                loadingModule.setPercentMode()
                break
            default:
                loadingModule.setPercentMode()
        }
    }

    /**
     * @param {boolean} val
     */
    setFilterWarning(val) {
        this.showFilterWarning = val
    }

    #loadGraphData() {
        this.force.stop()
        this.force.nodes([])
        this.force.links([])
        this.visiblePulseNodeIDs.clear()
        this.clearGraphData()

        this.showFilterWarning = false
        this.parser = new Parser(this)
        this.parser.parse(this.options.data)
        this.unfilteredData = {
            nodes: this.parser.nodes,
            properties: this.parser.properties,
        }

        // Clear the previous search entries
        this.options.searchMenu = new SearchMenu(this)
        this.options.searchMenu.setup()

        // fixing class and property id counter for the editor
        this.eN = this.unfilteredData.nodes.length + 1
        this.eP = this.unfilteredData.properties.length + 1

        // using the ids of elements if to ensure that loaded elements will not get the same id;
        for (let p = 0; p < this.unfilteredData.properties.length; p++) {
            const currentId = this.unfilteredData.properties[p].id
            if (currentId.indexOf("objectProperty") !== -1) {
                // could be ours;
                const idStr = currentId.split("objectProperty")
                if (idStr[0].length === 0) {
                    const idInt = parseInt(idStr[1])
                    if (this.eP < idInt) {
                        this.eP = idInt + 1
                    }
                }
            }
        }
        // using the ids of elements if to ensure that loaded elements will not get the same id;
        for (let n = 0; n < this.unfilteredData.nodes.length; n++) {
            const currentId_Nodes = this.unfilteredData.nodes[n].id
            if (currentId_Nodes.indexOf("Class") !== -1) {
                // could be ours;
                const idStr_Nodes = currentId_Nodes.split("Class")
                if (idStr_Nodes[0].length === 0) {
                    const idInt_Nodes = parseInt(idStr_Nodes[1])
                    if (this.eN < idInt_Nodes) {
                        this.eN = idInt_Nodes + 1
                    }
                }
            }
        }

        this.initialLoad = true
        this.options.warningModule.closeFilterHint()

        // loading handler
        const loadingModule = this.options.loadingModule
        this.updateRenderingDuringSimulation = true
        const validOntology = this.options.loadingModule.loadingWasSuccessFul
        if (this.graphContainer && validOntology) {
            this.updateRenderingDuringSimulation = false
            this.options.ontologyMenu.append_bulletPoint(
                "Generating visualization ... ",
            )
            loadingModule.setPercentMode()

            if (this.unfilteredData.nodes.length > 0) {
                this.graphContainer.style("opacity", "0")
                this.force.on("tick", () => {
                    this.#hiddenRecalculatePositions()
                })
            } else {
                this.graphContainer.style("opacity", "1")
                if (this.showFPS === true) {
                    this.force.on("tick", () => {
                        this.#recalculatePositionsWithFPS()
                    })
                } else {
                    this.force.on("tick", () => {
                        this.#recalculatePositions()
                    })
                }
            }
            this.force.start()
        } else {
            this.force.stop()
            this.options.ontologyMenu.append_bulletPoint(
                "Failed to load ontology",
            )
            loadingModule.setErrorMode()
        }
        // update general MetaOBJECT
        this.options.clearGeneralMetaObject()
        this.options.editSidebar.clearMetaObjectValue()
        if (this.options.data !== undefined) {
            const header = this.options.data.header
            if (header) {
                if (header.iri) {
                    this.options.addOrUpdateGeneralObjectEntry(
                        "iri",
                        header.iri,
                    )
                }
                if (header.title) {
                    this.options.addOrUpdateGeneralObjectEntry(
                        "title",
                        header.title,
                    )
                }
                if (header.author) {
                    this.options.addOrUpdateGeneralObjectEntry(
                        "author",
                        header.author,
                    )
                }
                if (header.version) {
                    this.options.addOrUpdateGeneralObjectEntry(
                        "version",
                        header.version,
                    )
                }
                if (header.description) {
                    this.options.addOrUpdateGeneralObjectEntry(
                        "description",
                        header.description,
                    )
                }
                if (header.prefixList) {
                    const pL = header.prefixList
                    for (const pr in pL) {
                        if (pL.hasOwnProperty(pr)) {
                            const val = pL[pr]
                            this.options.addPrefix(pr, val)
                        }
                    }
                }
                // get other metadata;
                if (header.other) {
                    const otherObjects = header.other
                    for (const name in otherObjects) {
                        if (otherObjects.hasOwnProperty(name)) {
                            const otherObj = otherObjects[name]
                            if (
                                otherObj.hasOwnProperty("identifier") &&
                                otherObj.hasOwnProperty("value")
                            ) {
                                this.options.addOrUpdateMetaObjectEntry(
                                    otherObj.identfier,
                                    otherObj.value,
                                )
                            }
                        }
                    }
                }
            }
        }
        this.parser.parseSettings()
        this.graphUpdateRequired = this.parser.settingsImported
        this.centerGraphViewOnLoad = true
        if (this.parser.settingsImportGraphZoomAndTranslation) {
            this.centerGraphViewOnLoad = false
        }
        this.options.editSidebar.updateGeneralOntologyInfo()
        this.options.editSidebar.updatePrefixUi()
        this.options.editSidebar.updateElementWidth()
    }

    handleOnLoadingError() {
        this.force.stop()
        this.clearGraphData()
        this.options.ontologyMenu.append_bulletPoint("Failed to load ontology")
        d3.select("#progressBarValue").node().innerHTML = ""
        d3.select("#progressBarValue").classed("busyProgressBar", false)
        this.options.loadingModule.setErrorMode()
        this.options.loadingModule.showErrorDetailsMessage()
    }

    #quick_refreshGraphData() {
        this.links = LinkCreator.createLinks(this.properties)
        this.labelNodes = this.#computeLabelNodes(this.links)
        this.#storeLinksOnNodes(this.classNodes, this.links)
        this.#setForceLayoutData(this.classNodes, this.labelNodes, this.links)
    }

    /**
     * @param {(PlainLink | BoxArrowLink | ArrowLink)[]} links
     */
    #computeLabelNodes(links) {
        return links.map(function (/** @type {{ label: Label; }} */ link) {
            return link.label
        })
    }

    /**
     * Applies the data of the graph options object and parses it. The graph is not redrawn.
     * @note `data` will be mutated by this function.
     * @param {{ nodes: BaseNode[]; properties: BaseProperty[]; }} data
     */
    #refreshGraphData(data, init = false) {
        // Filter the data
        for (const module of this.options.filterModules) {
            data = this.#filterFunction(module, data, init)
        }
        this.options.focuserModule.handle(undefined, true)
        this.classNodes = data.nodes
        this.properties = data.properties
        this.links = LinkCreator.createLinks(this.properties)
        this.labelNodes = this.#computeLabelNodes(this.links)
        this.#storeLinksOnNodes(this.classNodes, this.links)
        this.#setForceLayoutData(this.classNodes, this.labelNodes, this.links)
    }

    /**
     * Create a subgraph with `rootNodeIDs` as root.
     * @param {string[]} rootNodeIDs
     */
    loadSearchData(rootNodeIDs) {
        let rootNodes = []
        let allRendered = true
        for (const nodeID of rootNodeIDs) {
            allRendered =
                allRendered && this.forceNodeMap.get(nodeID) !== undefined
            const node = this.nodeMap.get(nodeID)
            if (node) {
                rootNodes.push(node)
            } else {
                // This is not a node - maybe a link?
                const prop = this.propertyMap.get(nodeID)
                if (prop) {
                    rootNodes.push(prop.domain)
                    rootNodes.push(prop.range)
                } else {
                    console.log(
                        `Failed to find a node or property with id '${rootNodeIDs}'`,
                    )
                }
            }
        }

        // Skip expensive graph generation if all nodes are currently rendered
        if (!allRendered) {
            let selectedNodes = this.#breadthFirstSearchDepth(rootNodes, 2)
            let selectedProperties = []

            for (const property of this.unfilteredData.properties) {
                if (
                    selectedNodes.get(property.domain.id) &&
                    selectedNodes.get(property.range.id)
                ) {
                    selectedProperties.push(property)
                }
            }
            this.currentData = {
                nodes: Array.from(selectedNodes.values()),
                properties: selectedProperties,
            }
            this.#filterFunction(
                this.options.nodeDegreeFilter,
                this.currentData,
                true,
            )
            this.update(this.currentData)
        }
        this.resetSearchHighlight()
        this.highLightNodes(rootNodeIDs)
    }

    /**
     * @param {AbstractFilter} module
     * @param {{ nodes: BaseNode[]; properties: BaseProperty[]; }} data
     * @param {boolean} [initializing]
     */
    #filterFunction(module, data, initializing) {
        this.links = LinkCreator.createLinks(this.unfilteredData.properties)
        this.#storeLinksOnNodes(this.unfilteredData.nodes, this.links)
        if (initializing) {
            if (module.initialize) {
                module.initialize(data.nodes, data.properties)
            }
        }
        module.filter(data.nodes, data.properties)
        return {
            nodes: module.filteredNodes,
            properties: module.filteredProperties,
        }
    }

    /**
     * Breadth First Search to a certain depth
     * @param {BaseNode[]} rootNodes Begin search from these nodes
     * @param {number} depth How many edges, starting from `rootNodes`, should be explored.
     * @returns {Map<string,BaseNode>} Nodes visited. A map of nodeIDs to nodes.
     */
    #breadthFirstSearchDepth(rootNodes, depth) {
        let visited = new Map()
        let frontier = new Deque(rootNodes)

        // For every depth
        for (let i = 0; i <= depth; i++) {
            // Keep static reference to the length
            let length = frontier.length

            // For every node
            for (let j = 0; j < length; j++) {
                let currentNode = frontier.shift()
                let linkArr = currentNode.links

                // For every edge
                for (let k = 0; k < linkArr.length; k++) {
                    let currentLink = linkArr[k]
                    let domainNode = currentLink.domain
                    let rangeNode = currentLink.range

                    // If the edge is connected to our current node, add the other end of the
                    // edge only if it hasn't already been visited or appended to our frontier
                    if (domainNode === currentNode) {
                        if (!visited.get(rangeNode.id)) {
                            frontier.push(rangeNode)
                        }
                    } else if (rangeNode === currentNode) {
                        if (!visited.get(domainNode.id)) {
                            frontier.push(domainNode)
                        }
                    }
                }
                visited.set(currentNode.id, currentNode)
            }
        }
        return visited
    }

    //** --------------------------------------------------------- **/
    //** -- force-layout related functions                      -- **/
    //** --------------------------------------------------------- **/
    /**
     * @param {BaseNode[]} nodes
     * @param {(PlainLink | BoxArrowLink | ArrowLink)[]} links
     */
    #storeLinksOnNodes(nodes, links) {
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].links = []
        }
        // look for properties where this node is the domain or range
        for (let i = 0; i < links.length; i++) {
            const link = links[i]
            const domainobj = link.domain
            let existingDomainLinks = domainobj.links
            if (existingDomainLinks === undefined) {
                existingDomainLinks = [link]
            } else {
                existingDomainLinks.push(link)
            }
            link.domain.links = existingDomainLinks

            const rangeobj = link.range
            let existingRangeLinks = rangeobj.links
            if (existingRangeLinks === undefined) {
                existingRangeLinks = [link]
            } else {
                existingRangeLinks.push(link)
            }
            link.range.links = existingRangeLinks
        }
    }

    /**
     * @param {BaseNode[]} classNodes
     * @param {Label[]} labelNodes
     * @param {(PlainLink | BoxArrowLink | ArrowLink)[]} links
     */
    #setForceLayoutData(classNodes, labelNodes, links) {
        /**
         * @type {LinkPart[]}
         */
        let d3Links = []
        for (const link of links) {
            d3Links = d3Links.concat(link.linkParts())
        }

        /**
         * @type {(BaseNode | Label)[]}
         */
        const d3Nodes = [].concat(classNodes).concat(labelNodes)
        this.#setPositionOfOldLabelsOnNewLabels(this.force.nodes(), labelNodes)

        this.force.nodes(d3Nodes).links(d3Links)
    }

    // The label nodes are positioned randomly, because they are created from scratch if the data changes and lose
    // their position information. With this hack the position of old labels is copied to the new labels.
    /**
     * @param {string | any[]} oldLabelNodes
     * @param {any[]} labelNodes
     */
    #setPositionOfOldLabelsOnNewLabels(oldLabelNodes, labelNodes) {
        for (const labelNode of labelNodes) {
            for (let i = 0; i < oldLabelNodes.length; i++) {
                const oldNode = oldLabelNodes[i]
                if (oldNode.equals(labelNode)) {
                    labelNode.x = oldNode.x
                    labelNode.y = oldNode.y
                    labelNode.px = oldNode.px
                    labelNode.py = oldNode.py
                    break
                }
            }
        }
    }

    // Applies all options that don't change the graph data.
    #refreshGraphStyle() {
        this.zoom = this.zoom.scaleExtent([
            this.options.minMagnification,
            this.options.maxMagnification,
        ])
        if (this.graphContainer) {
            this.zoom.event(this.graphContainer)
        }

        const _this = this
        this.force
            .charge(function (/** @type {BaseElement} */ element) {
                let charge = _this.options.charge
                if (ElementTools.isLabel(element)) {
                    charge *= 0.8
                }
                return charge
            })
            .size([this.options.width, this.options.height])
            .linkDistance((/** @type {LinkPart} */ linkPart) => {
                return this.#calculateLinkPartDistance(linkPart)
            })
            .gravity(this.options.gravity)
            .linkStrength(this.options.linkStrength) // Flexibility of links

        for (const node of this.force.nodes()) {
            node.frozen = this.paused
        }
    }

    /**
     * @param {LinkPart} linkPart
     */
    #calculateLinkPartDistance(linkPart) {
        const link = linkPart.link

        if (link.isLoop()) {
            return this.options.loopDistance
        }

        // divide by 2 to receive the length for a single link part
        let linkPartDistance = this.#getVisibleLinkDistance(link) / 2
        linkPartDistance += linkPart.domain.actualRadius()
        linkPartDistance += linkPart.range.actualRadius()
        return linkPartDistance
    }

    /**
     * @param {PlainLink} link
     */
    #getVisibleLinkDistance(link) {
        if (
            ElementTools.isDatatype(link.domain) ||
            ElementTools.isDatatype(link.range)
        ) {
            return this.options.datatypeDistance
        } else {
            return this.options.classDistance
        }
    }

    //** --------------------------------------------------------- **/
    //** -- animation functions for the nodes --                   **/
    //** --------------------------------------------------------- **/
    animateDynamicLabelWidth() {
        const wantedWidth = this.options.dynamicLabelWidth
        for (const node of this.classNodes) {
            if (ElementTools.isDatatype(node)) {
                node.animateDynamicLabelWidth(wantedWidth)
            }
        }
        for (const property of this.properties) {
            property.animateDynamicLabelWidth(wantedWidth)
        }
    }

    //** --------------------------------------------------------- **/
    //** -- halo and localization functions --                     **/
    //** --------------------------------------------------------- **/
    /**
     * @param {BaseNode} element A d3-force rendered node
     */
    updateHaloRadius(element) {
        this.#computeDistanceToCenter(element)
    }

    #updateHaloRadius() {
        if (this.visiblePulseNodeIDs.size > 0) {
            const forceNodes = this.force.nodes()
            for (const pulseNodeID of this.visiblePulseNodeIDs) {
                const node = forceNodes[pulseNodeID]
                if (node) {
                    if (node.property) {
                        // match search strings with property label
                        if (node.property.inverse) {
                            const searchString = this.options.searchMenu
                                .getSearchString()
                                .toLowerCase()
                            const name = node.property
                                .labelForCurrentLanguage()
                                .toLowerCase()
                            if (name === searchString) {
                                this.#computeDistanceToCenter(node)
                            } else {
                                node.property.removeHalo()
                                if (node.property.inverse) {
                                    if (
                                        !node.property.inverse.haloGroupElement
                                    ) {
                                        node.property.inverse.drawHalo()
                                    }
                                    this.#computeDistanceToCenter(node, true)
                                }
                                if (node.property.equivalents) {
                                    const eq = node.property.equivalents
                                    for (let e = 0; e < eq.length; e++) {
                                        if (!eq[e].haloGroupElement)
                                            eq[e].drawHalo()
                                    }
                                    if (!node.property.haloGroupElement) {
                                        node.property.drawHalo()
                                    }
                                    this.#computeDistanceToCenter(node)
                                }
                            }
                        }
                    }
                    this.#computeDistanceToCenter(node)
                }
            }
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number[]} translate
     * @param {number} scale
     */
    #getScreenCoords(x, y, translate, scale) {
        const xn = translate[0] + x * scale
        const yn = translate[1] + y * scale
        return { x: xn, y: yn }
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number[]} translate
     * @param {number} scale
     */
    #getClickedScreenCoords(x, y, translate, scale) {
        const xn = (x - translate[0]) / scale
        const yn = (y - translate[1]) / scale
        return { x: xn, y: yn }
    }

    /**
     * @param {BaseNode | Label} node A d3-force rendered node
     * @param {boolean} inverse
     */
    #computeDistanceToCenter(node, inverse = false) {
        let container = node
        const w = this.options.width
        const h = this.options.height

        let posXY = this.#getScreenCoords(
            node.x,
            node.y,
            this.graphTranslation,
            this.zoomFactor,
        )
        let highlightOfInv = false

        if (inverse) {
            highlightOfInv = true
            posXY = this.#getScreenCoords(
                node.x,
                node.y + 20,
                this.graphTranslation,
                this.zoomFactor,
            )
        }
        const x = posXY.x
        const y = posXY.y
        let nodeIsRect = false
        let halo
        let roundHalo
        let rectHalo
        let borderPoint_x = 0
        let borderPoint_y = 0
        const offset = 15

        if (node.property && highlightOfInv) {
            if (node.property.inverse) {
                rectHalo = node.property.inverse.haloGroupElement.select("rect")
            } else {
                if (node.property.haloGroupElement) {
                    rectHalo = node.property.haloGroupElement.select("rect")
                } else {
                    node.property.drawHalo()
                    rectHalo = node.property.haloGroupElement.select("rect")
                }
            }
            rectHalo.classed("hidden", true)
            if (node.property.inverse) {
                if (node.property.inverse.haloGroupElement) {
                    roundHalo =
                        node.property.inverse.haloGroupElement.select("circle")
                }
            } else {
                roundHalo = node.property.haloGroupElement.select("circle")
            }
            if (roundHalo.node() === null) {
                const radius = node.property.inverse.labelWidth + 15
                roundHalo = node.property.inverse.haloGroupElement
                    .append("circle")
                    .classed("searchResultB", true)
                    .classed("searchResultA", false)
                    .attr("r", radius + 15)
            }
            halo = roundHalo // swap the halo to be round
            nodeIsRect = true
            container = node.property.inverse
        }

        if (node.id) {
            if (!node.haloGroupElement) {
                return // something went wrong before
            }
            halo = node.haloGroupElement.select("rect")
            if (halo.node() === null) {
                // this is a round node
                nodeIsRect = false
                roundHalo = node.haloGroupElement.select("circle")
                const defaultRadius = node.actualRadius()
                roundHalo.attr("r", defaultRadius + offset)
                halo = roundHalo
            } else {
                // this is a rect node
                nodeIsRect = true
                rectHalo = node.haloGroupElement.select("rect")
                rectHalo.classed("hidden", true)
                roundHalo = node.haloGroupElement.select("circle")
                if (roundHalo.node() === null) {
                    const radius = node.labelWidth
                    roundHalo = node.haloGroupElement
                        .append("circle")
                        .classed("searchResultB", true)
                        .classed("searchResultA", false)
                        .attr("r", radius + offset)
                }
                halo = roundHalo
            }
        }
        if (node.property && !inverse) {
            if (!node.property.haloGroupElement) {
                return // something went wrong before
            }
            rectHalo = node.property.haloGroupElement.select("rect")
            rectHalo.classed("hidden", true)

            roundHalo = node.property.haloGroupElement.select("circle")
            if (roundHalo.node() === null) {
                const radius = node.property.width
                roundHalo = node.property.haloGroupElement
                    .append("circle")
                    .classed("searchResultB", true)
                    .classed("searchResultA", false)
                    .attr("r", radius + 15)
            }
            halo = roundHalo // swap the halo to be round
            nodeIsRect = true
            container = node.property
        }

        if (x < 0 || x > w || y < 0 || y > h) {
            // node outside viewport;
            // check for quadrant and get the correct boarder point (intersection with viewport)
            if (x < 0 && y < 0) {
                borderPoint_x = 0
                borderPoint_y = 0
            } else if (x > 0 && x < w && y < 0) {
                borderPoint_x = x
                borderPoint_y = 0
            } else if (x > w && y < 0) {
                borderPoint_x = w
                borderPoint_y = 0
            } else if (x > w && y > 0 && y < h) {
                borderPoint_x = w
                borderPoint_y = y
            } else if (x > w && y > h) {
                borderPoint_x = w
                borderPoint_y = h
            } else if (x > 0 && x < w && y > h) {
                borderPoint_x = x
                borderPoint_y = h
            } else if (x < 0 && y > h) {
                borderPoint_x = 0
                borderPoint_y = h
            } else if (x < 0 && y > 0 && y < h) {
                borderPoint_x = 0
                borderPoint_y = y
            }
            // kill all pulses of nodes that are outside the viewport
            container.haloGroupElement
                .select("rect")
                .classed("searchResultA", false)
            container.haloGroupElement
                .select("circle")
                .classed("searchResultA", false)
            container.haloGroupElement
                .select("rect")
                .classed("searchResultB", true)
            container.haloGroupElement
                .select("circle")
                .classed("searchResultB", true)
            halo.classed("hidden", false)
            // compute in pixel coordinates length of difference vector
            const borderRadius_x = borderPoint_x - x
            const borderRadius_y = borderPoint_y - y

            let len =
                borderRadius_x * borderRadius_x +
                borderRadius_y * borderRadius_y
            len = Math.sqrt(len)

            const normedX = borderRadius_x / len
            const normedY = borderRadius_y / len

            len = len + 20 // add 20 px;

            // re-normalized vector
            const newVectorX = normedX * len + x
            const newVectorY = normedY * len + y
            // compute world coordinates of this point
            const wX = (newVectorX - this.graphTranslation[0]) / this.zoomFactor
            const wY = (newVectorY - this.graphTranslation[1]) / this.zoomFactor

            // compute distance in world coordinates
            const dx = wX - node.x
            let dy = wY - node.y
            if (highlightOfInv) {
                dy = wY - node.y - 20
            }
            if (!highlightOfInv && node.property && node.property.inverse)
                dy = wY - node.y + 20

            let newRadius = Math.sqrt(dx * dx + dy * dy)
            halo = container.haloGroupElement.select("circle")
            // sanity checks and setting new halo radius
            if (!nodeIsRect) {
                const defaultRadius = node.actualRadius() + offset
                if (newRadius < defaultRadius) {
                    newRadius = defaultRadius
                }
                halo.attr("r", newRadius)
            } else {
                const defaultRadius = 0.5 * container.width
                if (newRadius < defaultRadius) {
                    newRadius = defaultRadius
                }
                halo.attr("r", newRadius)
            }
        } else {
            // node is in viewport , render original;
            // reset the halo to original radius
            const defaultRadius = node.actualRadius() + 15
            if (!nodeIsRect) {
                halo.attr("r", defaultRadius)
            } else {
                // this is rectangular node render as such
                halo = container.haloGroupElement.select("rect")
                halo.classed("hidden", false)
                //halo.classed("searchResultB", true);
                //halo.classed("searchResultA", false);
                const aCircHalo = container.haloGroupElement.select("circle")
                aCircHalo.classed("hidden", true)

                container.haloGroupElement
                    .select("rect")
                    .classed("hidden", false)
                container.haloGroupElement
                    .select("circle")
                    .classed("hidden", true)
            }
        }
    }

    /**
     * @param {number[]} p
     * @param {number} cx
     * @param {number} cy
     */
    #transform(p, cx, cy) {
        // one iteration step for the locate target animation
        this.zoomFactor = this.options.height / p[2]
        this.graphTranslation = [
            cx - p[0] * this.zoomFactor,
            cy - p[1] * this.zoomFactor,
        ]
        this.#updateHaloRadius()
        // update the values in case the user wants to break the animation
        this.zoom.translate(this.graphTranslation)
        this.zoom.scale(this.zoomFactor)
        this.options.zoomSlider.updateZoomSliderValue(this.zoomFactor)
        return (
            "translate(" +
            this.graphTranslation[0] +
            "," +
            this.graphTranslation[1] +
            ")scale(" +
            this.zoomFactor +
            ")"
        )
    }

    /**
     * @param {{ x: any; y: any; }} element
     */
    zoomToElementInGraph(element) {
        this.#targetLocationZoom(element)
    }

    /**
     * @param {{ x: any; y: any; }} target
     */
    #targetLocationZoom(target) {
        // store the original information
        const cx = 0.5 * this.options.width
        const cy = 0.5 * this.options.height
        const cp = this.#getWorldPosFromScreen(
            cx,
            cy,
            this.graphTranslation,
            this.zoomFactor,
        )
        const sP = [cp.x, cp.y, this.options.height / this.zoomFactor]

        const zoomLevel = Math.max(
            this.defaultZoom + 0.5 * this.defaultZoom,
            this.defaultTargetZoom,
        )
        const eP = [target.x, target.y, this.options.height / zoomLevel]
        const pos_intp = d3.interpolateZoom(sP, eP)

        let lenAnimation = pos_intp.duration
        if (lenAnimation > 2500) {
            lenAnimation = 2500
        }

        const _this = this
        this.graphContainer
            .attr("transform", _this.#transform(sP, cx, cy))
            .transition()
            .duration(lenAnimation)
            .attrTween("transform", function () {
                return function (t) {
                    return _this.#transform(pos_intp(t), cx, cy)
                }
            })
            // @ts-ignore
            .each("end", function () {
                _this.graphContainer.attr(
                    "transform",
                    "translate(" +
                        _this.graphTranslation +
                        ")scale(" +
                        _this.zoomFactor +
                        ")",
                )
                _this.zoom.translate(_this.graphTranslation)
                _this.zoom.scale(_this.zoomFactor)
                _this.#updateHaloRadius()
            })
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number[]} translate
     * @param {number[] | any} scale
     */
    #getWorldPosFromScreen(x, y, translate, scale) {
        const temp = scale[0]
        let xn, yn
        if (temp) {
            xn = (x - translate[0]) / temp
            yn = (y - translate[1]) / temp
        } else {
            xn = (x - translate[0]) / scale
            yn = (y - translate[1]) / scale
        }
        return { x: xn, y: yn }
    }

    /**
     * Cycle through `visiblePulseNodeIDs` safely
     */
    *locationID() {
        let visibleIDArr = Array.from(this.visiblePulseNodeIDs)
        let location = 0
        // Only cycle while we have visible pulse nodes
        while (this.visiblePulseNodeIDs.size > 0) {
            yield visibleIDArr[location]
            location = (location + 1) % visibleIDArr.length
        }
        // If we reach this point, the cycle is reset with new visible pulse nodes
    }

    /**
     * Move the center of the viewport to this location
     */
    locateSearchResult() {
        if (this.transformAnimation) {
            return // << prevents incrementing the location id if we are in an animation
        }
        const nextID = this.locationID().next().value
        if (nextID !== undefined) {
            const node = this.force.nodes()[nextID]
            if (node.id) {
                node.foreground()
            }
            if (node.property) {
                node.property.foreground()
            }
            this.#targetLocationZoom(node)
        }
    }

    resetSearchHighlight() {
        // get all nodes (handle also already filtered nodes )
        this.visiblePulseNodeIDs.clear()

        // clear from stored nodes
        const nodes = this.unfilteredData.nodes
        const props = this.unfilteredData.properties
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            if (node.removeHalo) node.removeHalo()
        }
        for (let i = 0; i < props.length; i++) {
            const prop = props[i]
            if (prop.removeHalo) prop.removeHalo()
        }
    }

    /**
     * Determines which nodes of `nodeIDs` are currently rendered in d3-force
     * and stores them in attribute `visiblePulseNodeIDs`.
     * @param {string[]} nodeIDs
     * @returns {Set<string>} The IDs of `nodeIDs` which are not rendered
     */
    updatePulseIds(nodeIDs) {
        this.visiblePulseNodeIDs.clear()
        const forceNodes = this.force.nodes()
        let missedIDs = new Set()
        for (const nodeID of nodeIDs) {
            const forceID = this.forceNodeMap.get(nodeID)
            if (forceID !== undefined) {
                const forceNode = forceNodes[forceID]
                if (forceNode.id || forceNode.property) {
                    this.visiblePulseNodeIDs.add(forceID)
                }
            } else {
                missedIDs.add(nodeID)
            }
        }
        if (this.visiblePulseNodeIDs.size > 0) {
            d3.select("#locateSearchResult").classed("highlighted", true)
            d3.select("#locateSearchResult").node().title = "Locate search term"
        } else {
            d3.select("#locateSearchResult").classed("highlighted", false)
            d3.select("#locateSearchResult").node().title = "Nothing to locate"
        }
        return missedIDs
    }

    /**
     * @param {string[]} nodeIDs
     */
    highLightNodes(nodeIDs) {
        if (nodeIDs.length === 0) {
            return // Nothing to highlight
        }

        this.allPulseNodeIDs = nodeIDs
        const missedIDs = this.updatePulseIds(nodeIDs)
        const forceNodes = this.force.nodes()
        for (const pulseID of this.visiblePulseNodeIDs) {
            const node = forceNodes[pulseID]
            if (node.id) {
                node.foreground()
                node.drawHalo()
            }
            if (node.property) {
                node.property.foreground()
                node.property.drawHalo()
            }
        }

        // Highlight the nodes not currently rendered
        for (const missedID of missedIDs) {
            const node = this.nodeMap.get(missedID)
            if (node) {
                node.drawHalo()
            } else {
                const property = this.propertyMap.get(missedID)
                if (property) {
                    property.drawHalo()
                }
            }
        }
        this.#updateHaloRadius()
    }

    hideHalos() {
        const haloElements = d3.selectAll(".searchResultA,.searchResultB")
        haloElements.classed("hidden", true)
        return haloElements
    }

    /**
     * @param {{ x: number; y: number; }} node
     */
    #nodeInViewport(node) {
        const w = this.options.width
        const h = this.options.height
        const posXY = this.#getScreenCoords(
            node.x,
            node.y,
            this.graphTranslation,
            this.zoomFactor,
        )
        const x = posXY.x
        const y = posXY.y
        const retVal = !(x < 0 || x > w || y < 0 || y > h)
        return retVal
    }

    getBoundingBoxForTex() {
        const halos = this.hideHalos()
        const bbox = this.graphContainer.node().getBoundingClientRect()
        halos.classed("hidden", false)
        const w = this.options.width
        const h = this.options.height

        // get the graph coordinates
        const topLeft = this.#getWorldPosFromScreen(
            0,
            0,
            this.graphTranslation,
            this.zoomFactor,
        )
        const botRight = this.#getWorldPosFromScreen(
            w,
            h,
            this.graphTranslation,
            this.zoomFactor,
        )
        const t_topLeft = this.#getWorldPosFromScreen(
            bbox.left,
            bbox.top,
            this.graphTranslation,
            this.zoomFactor,
        )
        const t_botRight = this.#getWorldPosFromScreen(
            bbox.right,
            bbox.bottom,
            this.graphTranslation,
            this.zoomFactor,
        )

        // tighten up the bounding box;
        let tX = Math.max(t_topLeft.x, topLeft.x)
        let tY = Math.max(t_topLeft.y, topLeft.y)
        let bX = Math.min(t_botRight.x, botRight.x)
        let bY = Math.min(t_botRight.y, botRight.y)

        // tighten further;
        const forceNodes = this.force.nodes()
        const contentBBox = {
            tx: 1000000000000,
            ty: 1000000000000,
            bx: -1000000000000,
            by: -1000000000000,
        }
        for (let i = 0; i < forceNodes.length; i++) {
            const node = forceNodes[i]
            if (node) {
                if (node.property) {
                    if (this.#nodeInViewport(node)) {
                        if (node.property.labelElement === undefined) {
                            continue
                        }
                        const bbx = node.property.labelElement
                            .node()
                            .getBoundingClientRect()
                        if (bbx) {
                            contentBBox.tx = Math.min(contentBBox.tx, bbx.left)
                            contentBBox.bx = Math.max(contentBBox.bx, bbx.right)
                            contentBBox.ty = Math.min(contentBBox.ty, bbx.top)
                            contentBBox.by = Math.max(
                                contentBBox.by,
                                bbx.bottom,
                            )
                        }
                    }
                } else if (this.#nodeInViewport(node)) {
                    const bbx = node.nodeElement.node().getBoundingClientRect()
                    if (bbx) {
                        contentBBox.tx = Math.min(contentBBox.tx, bbx.left)
                        contentBBox.bx = Math.max(contentBBox.bx, bbx.right)
                        contentBBox.ty = Math.min(contentBBox.ty, bbx.top)
                        contentBBox.by = Math.max(contentBBox.by, bbx.bottom)
                    }
                }
            }
        }
        const tt_topLeft = this.#getWorldPosFromScreen(
            contentBBox.tx,
            contentBBox.ty,
            this.graphTranslation,
            this.zoomFactor,
        )
        const tt_botRight = this.#getWorldPosFromScreen(
            contentBBox.bx,
            contentBBox.by,
            this.graphTranslation,
            this.zoomFactor,
        )

        tX = Math.max(tX, tt_topLeft.x)
        tY = Math.max(tY, tt_topLeft.y)

        bX = Math.min(bX, tt_botRight.x)
        bY = Math.min(bY, tt_botRight.y)
        // y axis flip for tex
        return [tX, -tY, bX, -bY]
    }

    #updateTargetElement() {
        const bbox = this.graphContainer.node().getBoundingClientRect()
        // get the graph coordinates
        const bboxOffset = 50 // default radius of a node;
        const topLeft = this.#getWorldPosFromScreen(
            bbox.left,
            bbox.top,
            this.graphTranslation,
            this.zoomFactor,
        )
        const botRight = this.#getWorldPosFromScreen(
            bbox.right,
            bbox.bottom,
            this.graphTranslation,
            this.zoomFactor,
        )

        let w = this.options.width
        if (this.options.leftSidebar.visibleSidebar) {
            w -= 200
        }
        const h = this.options.height
        topLeft.x += bboxOffset
        topLeft.y -= bboxOffset
        botRight.x -= bboxOffset
        botRight.y += bboxOffset

        const g_w = botRight.x - topLeft.x
        const g_h = botRight.y - topLeft.y

        // endpoint position calculations
        const posX = 0.5 * (topLeft.x + botRight.x)
        const posY = 0.5 * (topLeft.y + botRight.y)
        let cx = 0.5 * w
        const cy = 0.5 * h

        if (this.options.leftSidebar.visibleSidebar) {
            cx += 200
        }
        const cp = this.#getWorldPosFromScreen(
            cx,
            cy,
            this.graphTranslation,
            this.zoomFactor,
        )

        // zoom factor calculations and fail safes;
        let newZoomFactor = 1.0 // fail save if graph and window are squares
        //get the smaller one
        const a = w / g_w
        const b = h / g_h
        newZoomFactor = a < b ? a : b

        // fail saves
        if (newZoomFactor > this.zoom.scaleExtent()[1]) {
            newZoomFactor = this.zoom.scaleExtent()[1]
        }
        if (newZoomFactor < this.zoom.scaleExtent()[0]) {
            newZoomFactor = this.zoom.scaleExtent()[0]
        }

        // apply Zooming
        const sP = [cp.x, cp.y, h / this.zoomFactor]
        const eP = [posX, posY, h / newZoomFactor]

        const pos_intp = d3.interpolateZoom(sP, eP)
        return [pos_intp, cx, cy]
    }

    /**
     * @param {boolean} [dynamic]
     */
    forceRelocationEvent(dynamic) {
        if (!this.graphContainer) {
            console.warn(
                `Cannot forceRelocationEvent when graphContainer is ${this.graphContainer}`,
            )
            return
        }

        // we need to kill the halo to determine the bounding box;
        const halos = this.hideHalos()
        const bbox = this.graphContainer.node().getBoundingClientRect()
        halos.classed("hidden", false)

        // get the graph coordinates
        const bboxOffset = 50 // default radius of a node;
        const topLeft = this.#getWorldPosFromScreen(
            bbox.left,
            bbox.top,
            this.graphTranslation,
            this.zoomFactor,
        )
        const botRight = this.#getWorldPosFromScreen(
            bbox.right,
            bbox.bottom,
            this.graphTranslation,
            this.zoomFactor,
        )

        let w = this.options.width
        if (this.options.leftSidebar.visibleSidebar) {
            w -= 200
        }
        const h = this.options.height
        topLeft.x += bboxOffset
        topLeft.y -= bboxOffset
        botRight.x -= bboxOffset
        botRight.y += bboxOffset

        const g_w = botRight.x - topLeft.x
        const g_h = botRight.y - topLeft.y

        // endpoint position calculations
        const posX = 0.5 * (topLeft.x + botRight.x)
        const posY = 0.5 * (topLeft.y + botRight.y)
        let cx = 0.5 * w
        const cy = 0.5 * h

        if (this.options.leftSidebar.visibleSidebar) {
            cx += 200
        }
        const cp = this.#getWorldPosFromScreen(
            cx,
            cy,
            this.graphTranslation,
            this.zoomFactor,
        )

        // zoom factor calculations and fail safes;
        let newZoomFactor = 1.0 // fail save if graph and window are squares
        //get the smaller one
        const a = w / g_w
        const b = h / g_h
        newZoomFactor = a < b ? a : b

        // fail saves
        if (newZoomFactor > this.zoom.scaleExtent()[1]) {
            newZoomFactor = this.zoom.scaleExtent()[1]
        }
        if (newZoomFactor < this.zoom.scaleExtent()[0]) {
            newZoomFactor = this.zoom.scaleExtent()[0]
        }

        // apply Zooming
        const sP = [cp.x, cp.y, h / this.zoomFactor]
        const eP = [posX, posY, h / newZoomFactor]

        const pos_intp = d3.interpolateZoom(sP, eP)
        let lenAnimation = pos_intp.duration
        if (lenAnimation > 2500) {
            lenAnimation = 2500
        }
        const _this = this
        this.graphContainer
            .attr("transform", this.#transform(sP, cx, cy))
            .transition()
            .duration(lenAnimation)
            .attrTween("transform", function () {
                return function (t) {
                    if (dynamic) {
                        const param = _this.#updateTargetElement()
                        // @ts-ignore
                        const nV = param[0](t)
                        return _this.#transform(nV, cx, cy)
                    }
                    return _this.#transform(pos_intp(t), cx, cy)
                }
            })
            // @ts-ignore
            .each("end", function () {
                if (dynamic) {
                    return
                }
                _this.graphContainer.attr(
                    "transform",
                    "translate(" +
                        _this.graphTranslation +
                        ")scale(" +
                        _this.zoomFactor +
                        ")",
                )
                _this.zoom.translate(_this.graphTranslation)
                _this.zoom.scale(_this.zoomFactor)
                _this.options.zoomSlider.updateZoomSliderValue(_this.zoomFactor)
            })
    }

    isADraggerActive() {
        return (
            this.classDragger.mouseButtonPressed ||
            this.domainDragger.mouseButtonPressed ||
            this.rangeDragger.mouseButtonPressed
        )
    }

    //** --------------------------------------------------------- **/
    //** -- VOWL EDITOR  create/ edit /delete functions --         **/
    //** --------------------------------------------------------- **/
    /**
     * @note This mutates `unfilteredData` and `properties`
     * @param {BaseNode} element
     * @returns {boolean} True if the node was changed succesfully
     */
    changeNodeType(element) {
        const typeString = d3.select("#typeEditor").node().value

        if (!this.sanityCheckClasses(element, typeString)) {
            // call reselection to restore previous type selection
            this.options.editSidebar.updateSelectionInformation(element)
            return false
        }

        const prototype = nodeClassMap.get(typeString.toLowerCase())
        const aNode = new prototype(this)
        aNode.x = element.x
        aNode.y = element.y
        aNode.px = element.x
        aNode.py = element.y
        aNode.id = element.id
        aNode.copyInformation(element)

        if (typeString === "owl:Thing") {
            aNode.label = "Thing"
        } else if (!ElementTools.isDatatype(element)) {
            if (element.backupLabel !== undefined) {
                aNode.label = element.backupLabel
            } else if (aNode.backupLabel !== undefined) {
                aNode.label = aNode.backupLabel
            } else {
                aNode.label = "NewClass"
            }
        }

        if (typeString === "rdfs:Datatype") {
            if (aNode.dType === "undefined") {
                aNode.label = "undefined"
            } else {
                const identifier = aNode.dType.split(":")[1]
                aNode.label = identifier
            }
        }

        // updates the property domain and range
        for (let i = 0; i < this.unfilteredData.properties.length; i++) {
            const property = this.unfilteredData.properties[i]
            if (property.domain === element) {
                property.domain = aNode
            }
            if (property.range === element) {
                property.range = aNode
            }
        }

        // update for fastUpdate:
        for (let i = 0; i < this.properties.length; i++) {
            const property = this.properties[i]
            if (property.domain === element) {
                property.domain = aNode
            }
            if (property.range === element) {
                property.range = aNode
            }
        }

        // Update internal data with the new node
        this.nodeMap.set(element.id, aNode)
        let i = this.unfilteredData.nodes.indexOf(element)
        if (i !== -1) {
            this.unfilteredData.nodes[i] = aNode
        } else {
            this.unfilteredData.nodes.push(aNode)
        }
        i = this.classNodes.indexOf(element)
        if (i !== -1) {
            this.classNodes[i] = aNode
        } else {
            this.classNodes.push(aNode)
        }

        // Update trie
        this.trie.remove(
            element.labelForCurrentLanguage().toLowerCase(),
            element.id,
        )
        this.trie.add(aNode.labelForCurrentLanguage().toLowerCase(), aNode.id)

        this.fastUpdate()

        this.options.focuserModule.handle(aNode)
        element = null
        return true
    }

    /**
     * @note This mutates `unfilteredData` and `properties`
     * @param {BaseProperty} element
     * @returns {boolean} True if the property was changed succesfully
     */
    changePropertyType(element) {
        const typeString = d3.select("#typeEditor").node().value

        // create warning
        if (
            !this.sanityCheckProperty(element.domain, element.range, typeString)
        ) {
            return false
        }

        const propPrototype = propertyClassMap.get(typeString.toLowerCase())
        const aProp = new propPrototype(this)
        aProp.copyInformation(element)
        aProp.id = element.id

        element.domain.removePropertyElement(element)
        element.range.removePropertyElement(element)
        aProp.domain = element.domain
        aProp.range = element.range

        if (element.backupLabel !== undefined) {
            aProp.label = element.backupLabel
        } else {
            aProp.label = "newObjectProperty"
        }

        if (aProp.type === "rdfs:subClassOf") {
            aProp.iri = "http://www.w3.org/2000/01/rdf-schema#subClassOf"
        } else if (
            element.iri === "http://www.w3.org/2000/01/rdf-schema#subClassOf"
        ) {
            aProp.iri =
                this.options.getGeneralMetaObjectProperty("iri") + aProp.id
        }

        if (
            !this.propertyCheckExistenceChecker(
                aProp,
                element.domain,
                element.range,
            )
        ) {
            this.options.editSidebar.updateSelectionInformation(element)
            return false
        }

        aProp.domain.addProperty(aProp)
        aProp.range.addProperty(aProp)
        if (element.labelObject && aProp.labelObject) {
            aProp.labelObject.x = element.labelObject.x
            aProp.labelObject.px = element.labelObject.px
            aProp.labelObject.y = element.labelObject.y
            aProp.labelObject.py = element.labelObject.py
        }

        // // TODO: change its base IRI to proper value
        // const ontoIRI="http://someTest.de";
        // aProp.baseIri=ontoIRI;
        // aProp.iri=aProp.baseIri+aProp.id;

        // Update internal data with the new property
        this.propertyMap.set(element.id, aProp)
        let i = this.unfilteredData.properties.indexOf(element)
        if (i !== -1) {
            this.unfilteredData.properties[i] = aProp
        } else {
            this.unfilteredData.properties.push(aProp)
        }
        i = this.properties.indexOf(element)
        if (i !== -1) {
            this.properties[i] = aProp
        } else {
            this.properties.push(aProp)
        }

        this.fastUpdate()
        this.options.focuserModule.handle(aProp)
        element = null
        return true
    }

    removeEditElements() {
        this.rangeDragger.hideDragger(true)
        this.domainDragger.hideDragger(true)
        this.shadowClone.hideClone(true)

        this.classDragger.hideDragger(true)
        if (this.addDataPropertyGroupElement)
            this.addDataPropertyGroupElement.classed("hidden", true)
        if (this.deleteGroupElement)
            this.deleteGroupElement.classed("hidden", true)

        if (this.hoveredNodeElement) {
            if (this.hoveredNodeElement.pinned === false) {
                this.hoveredNodeElement.locked = this._paused
                this.hoveredNodeElement.frozen = this._paused
            }
        }
        if (this.hoveredPropertyElement) {
            if (this.hoveredPropertyElement.pinned === false) {
                this.hoveredPropertyElement.locked = this._paused
                this.hoveredPropertyElement.frozen = this._paused
            }
        }
    }

    get editorMode() {
        const create_entry = d3.select("#empty")
        const create_container = d3.select("#emptyContainer")

        create_entry.node().checked = this.isEditorMode
        if (!this.isEditorMode) {
            create_container.node().title =
                "Enable editing in modes menu to create a new ontology"
            create_entry.node().title =
                "Enable editing in modes menu to create a new ontology"
            create_entry.style("pointer-events", "none")
        } else {
            create_container.node().title = "Creates a new empty ontology"
            create_entry.node().title = "Creates a new empty ontology"
            d3.select("#useAccuracyHelper").style("color", "#2980b9")
            d3.select("#useAccuracyHelper").style("pointer-events", "auto")
            create_entry.node().disabled = false
            create_entry.style("pointer-events", "auto")
        }
        return this.isEditorMode
    }

    /**
     * @param {boolean} val
     */
    set editorMode(val) {
        const create_entry = d3.select("#empty")
        const create_container = d3.select("#emptyContainer")
        const modeOfOpString = d3.select("#modeOfOperationString").node()

        this.options.setEditorModeForDefaultObject(val)
        // if (seenEditorHint===false  && val===true){
        //     seenEditorHint=true;
        //     this.options.warningModule.showEditorHint();
        // }
        this.isEditorMode = val

        if (create_entry) {
            create_entry.classed("disabled", !this.isEditorMode)
            if (!this.isEditorMode) {
                create_container.node().title =
                    "Enable editing in modes menu to create a new ontology"
                create_entry.node().title =
                    "Enable editing in modes menu to create a new ontology"
                create_entry.node().disabled = true
                d3.select("#useAccuracyHelper").style("color", "#979797")
                d3.select("#useAccuracyHelper").style("pointer-events", "none")
                create_entry.style("pointer-events", "none")
            } else {
                create_container.node().title = "Creates a new empty ontology"
                create_entry.node().title = "Creates a new empty ontology"
                d3.select("#useAccuracyHelper").style("color", "#2980b9")
                d3.select("#useAccuracyHelper").style("pointer-events", "auto")
                create_entry.style("pointer-events", "auto")
            }
        }

        // adjust compact notation
        // selector = compactNotationOption;
        // box =ModuleCheckbox
        const compactNotationContainer = d3.select(
            "#compactnotationModuleCheckbox",
        )
        if (compactNotationContainer) {
            compactNotationContainer.classed("disabled", !this.isEditorMode)
            if (this.isEditorMode === false) {
                compactNotationContainer.node().title = ""
                compactNotationContainer.node().disabled = false
                compactNotationContainer.style("pointer-events", "auto")
                d3.select("#compactNotationOption").style("color", "")
                d3.select("#compactNotationOption").node().title = ""
                this.options.emptyLiteralFilter.enabled = true
                // this.update() // REVIEW: Check if needed
            } else {
                // if editor Mode
                //1) uncheck the element
                d3.select("#compactNotationOption").node().title =
                    "Compact notation can only be used in view mode"
                compactNotationContainer.node().disabled = true
                compactNotationContainer.node().checked = false
                this.options.compactNotationModule.enabled = false
                this.options.emptyLiteralFilter.enabled = false
                this.executeCompactNotationModule()
                this.executeEmptyLiteralFilter()
                // this.lazyRefresh() // REVIEW: Check if needed
                compactNotationContainer.style("pointer-events", "none")
                d3.select("#compactNotationOption").style("color", "#979797")
            }
        }

        if (modeOfOpString) {
            if (this.touchDevice) {
                modeOfOpString.innerHTML = "touch able device detected"
            } else {
                modeOfOpString.innerHTML = "point & click device detected"
            }
        }

        const svgGraph = d3.selectAll(".vowlGraph")
        if (this.isEditorMode) {
            this.options.leftSidebar.showSidebar(
                this.options.leftSidebar.getSidebarVisibility(),
                true,
            )
            this.options.leftSidebar.hideCollapseButton(false)
            this.options.editSidebar.updatePrefixUi()
            this.options.editSidebar.updateElementWidth()
            svgGraph.on("dblclick.zoom", () => {
                this.modified_dblClickFunction()
            })
        } else {
            svgGraph.on("dblclick.zoom", this.originalD3_dblClickFunction)
            this.options.leftSidebar.showSidebar(false)
            this.options.leftSidebar.hideCollapseButton(true)
            // hide hovered edit elements
            this.removeEditElements()
        }
        this.options.sidebar.updateShowedInformation()
        this.options.editSidebar.updateElementWidth()
    }

    /**
     * @param {{ x: any; y: any; }} pos
     */
    #createNewNodeAtPosition(pos) {
        const typeToCreate = d3.select("#defaultClass").node().title
        const prototype = nodeClassMap.get(typeToCreate.toLowerCase())
        const aNode = new prototype(this)
        let autoEditElement = false

        if (typeToCreate === "owl:Thing") {
            aNode.label = "Thing"
        } else {
            aNode.label = "NewClass"
            autoEditElement = true
        }
        aNode.x = pos.x
        aNode.y = pos.y
        aNode.px = aNode.x
        aNode.py = aNode.y
        aNode.id = "Class" + this.eN++
        // aNode._paused=true;
        aNode.baseIri = d3.select("#iriEditor").node().value
        aNode.iri = aNode.baseIri + aNode.id

        this.#addNewNodeElement(aNode)

        // Update trie
        this.trie.add(aNode.labelForCurrentLanguage().toLowerCase(), aNode.id)

        this.fastUpdate()
        this.options.focuserModule.handle(aNode, true)
        aNode.frozen = this._paused
        aNode.locked = this._paused
        aNode.enableEditing(autoEditElement)
    }

    /**
     * @param {BaseNode} element
     */
    #addNewNodeElement(element) {
        this.nodeMap.set(element.id, element)
        this.unfilteredData.nodes.push(element)
        if (this.classNodes.indexOf(element) === -1) {
            this.classNodes.push(element)
        }
    }

    /**
     * @param {BaseProperty} element
     */
    #addNewPropertyElement(element) {
        this.propertyMap.set(element.id, element)
        this.unfilteredData.properties.push(element)
        if (this.properties.indexOf(element) === -1) {
            this.properties.push(element)
        }
    }

    /**
     * @param {any[]} position
     */
    getTargetNode(position) {
        const dx = position[0]
        const dy = position[1]
        let tN = null
        let minDist = 1000000000000

        // This is a bit OVERKILL for the computation of one node >> TODO: KD-TREE SEARCH
        for (const node of this.unfilteredData.nodes) {
            const cDist = Math.sqrt(
                (node.x - dx) * (node.x - dx) + (node.y - dy) * (node.y - dy),
            )
            if (cDist < minDist) {
                minDist = cDist
                tN = node
            }
        }

        if (this.hoveredNodeElement) {
            const offsetDist = this.hoveredNodeElement.actualRadius() + 30
            if (minDist > offsetDist) return null
            if (tN.renderType === "rect") return null
            if (
                tN === this.hoveredNodeElement &&
                minDist <= this.hoveredNodeElement.actualRadius()
            ) {
                return tN
            } else if (
                tN === this.hoveredNodeElement &&
                minDist > this.hoveredNodeElement.actualRadius()
            ) {
                return null
            }
            return tN
        } else {
            return minDist > tN.actualRadius() + 30 ? null : tN
        }
    }

    /**
     * @param {BaseNode} domain
     * @param {BaseNode} range
     * @param {string} typeString
     * @param {any} header
     * @param {any} action
     */
    genericPropertySanityCheck(domain, range, typeString, header, action) {
        if (domain === range && typeString === "rdfs:subClassOf") {
            this.options.warningModule.showWarning(
                header,
                "rdfs:subClassOf can not be created as loops (domain == range)",
                action,
                1,
                domain,
            )
            return false
        }
        if (domain === range && typeString === "owl:disjointWith") {
            this.options.warningModule.showWarning(
                header,
                "owl:disjointWith can not be created as loops (domain == range)",
                action,
                1,
                domain,
            )
            return false
        }
        // allProps[i].type==="owl:allValuesFrom"  ||
        // allProps[i].type==="owl:someValuesFrom"
        if (domain.type === "owl:Thing" && typeString === "owl:allValuesFrom") {
            this.options.warningModule.showWarning(
                header,
                "owl:allValuesFrom can not originate from owl:Thing",
                action,
                1,
                domain,
            )
            return false
        }
        if (
            domain.type === "owl:Thing" &&
            typeString === "owl:someValuesFrom"
        ) {
            this.options.warningModule.showWarning(
                header,
                "owl:someValuesFrom can not originate from owl:Thing",
                action,
                1,
                domain,
            )
            return false
        }
        if (range.type === "owl:Thing" && typeString === "owl:allValuesFrom") {
            this.options.warningModule.showWarning(
                header,
                "owl:allValuesFrom can not be connected to owl:Thing",
                action,
                1,
                range,
            )
            return false
        }
        if (range.type === "owl:Thing" && typeString === "owl:someValuesFrom") {
            this.options.warningModule.showWarning(
                header,
                "owl:someValuesFrom can not be connected to owl:Thing",
                action,
                1,
                range,
            )
            return false
        }
        return true // we can Change the domain or range
    }

    /**
     * @param {string} url
     */
    checkIfIriClassAlreadyExist(url) {
        // search for a class node with this url
        const allNodes = this.unfilteredData.nodes
        for (let i = 0; i < allNodes.length; i++) {
            if (
                ElementTools.isDatatype(allNodes[i]) ||
                allNodes[i].type === "owl:Thing"
            ) {
                continue
            }
            // now we are a real class;
            // get class IRI
            const classIRI = allNodes[i].iri

            // this gives me the node for halo
            if (url === classIRI) {
                return allNodes[i]
            }
        }
        return false
    }

    /**
     * @param {BaseNode} classElement
     * @param {string} targetType
     */
    sanityCheckClasses(classElement, targetType) {
        // this is added due to someValuesFrom properties
        // we should not be able to change a classElement to a owl:Thing
        // when it has a property attached to it that uses these restrictions
        if (targetType === "owl:Class") {
            return true
        } else {
            // collect all properties which have that one as a domain or range
            const allProps = this.unfilteredData.properties
            for (let i = 0; i < allProps.length; i++) {
                const property = allProps[i]
                if (
                    property.range === classElement ||
                    property.domain === classElement
                ) {
                    // check for the type of that property
                    if (property.type === "owl:someValuesFrom") {
                        this.options.warningModule.showWarning(
                            "Can not change class type",
                            "The element has a property that is of type owl:someValuesFrom",
                            "Element type not changed!",
                            1,
                            classElement,
                        )
                        return false
                    }
                    if (property.type === "owl:allValuesFrom") {
                        this.options.warningModule.showWarning(
                            "Can not change class type",
                            "The element has a property that is of type owl:allValuesFrom",
                            "Element type not changed!",
                            1,
                            classElement,
                        )
                        return false
                    }
                }
            }
        }
        return true
    }

    /**
     * @param {BaseProperty} property
     * @param {BaseNode} domain
     * @param {BaseNode} range
     */
    propertyCheckExistenceChecker(property, domain, range) {
        if (
            property.type === "rdfs:subClassOf" ||
            property.type === "owl:disjointWith"
        ) {
            const allProps = this.unfilteredData.properties
            for (let i = 0; i < allProps.length; i++) {
                const _property = allProps[i]
                if (_property === property) {
                    continue
                }
                if (
                    _property.domain === domain &&
                    _property.range === range &&
                    _property.type === property.type
                ) {
                    this.options.warningModule.showWarning(
                        "Warning",
                        "This triple already exist!",
                        "Element not created!",
                        1,
                        undefined,
                    )
                    return false
                }
                if (
                    _property.domain === range &&
                    _property.range === domain &&
                    _property.type === property.type
                ) {
                    this.options.warningModule.showWarning(
                        "Warning",
                        "Inverse assignment already exist! ",
                        "Element not created!",
                        1,
                        undefined,
                    )
                    return false
                }
            }
        }
        return true
    }

    /**
     * @param {BaseNode} domain
     * @param {BaseNode} range
     * @param {string} typeString
     */
    sanityCheckProperty(domain, range, typeString) {
        // check for duplicate triple in the element;
        if (
            typeString === "owl:objectProperty" &&
            this.options.objectPropertyFilter.enabled
        ) {
            this.options.warningModule.showWarning(
                "Warning",
                "Object properties are filtered out in the visualization!",
                "Element not created!",
                1,
                undefined,
            )
            return false
        }
        if (
            typeString === "owl:disjointWith" &&
            this.options.disjointPropertyFilter.enabled
        ) {
            this.options.warningModule.showWarning(
                "Warning",
                "owl:disjointWith properties are filtered out in the visualization!",
                "Element not created!",
                1,
                undefined,
            )
            return false
        }
        if (domain === range && typeString === "rdfs:subClassOf") {
            this.options.warningModule.showWarning(
                "Warning",
                "rdfs:subClassOf can not be created as loops (domain == range)",
                "Element not created!",
                1,
                domain,
            )
            return false
        }
        if (domain === range && typeString === "owl:disjointWith") {
            this.options.warningModule.showWarning(
                "Warning",
                "owl:disjointWith  can not be created as loops (domain == range)",
                "Element not created!",
                1,
                domain,
            )
            return false
        }
        if (
            domain.type === "owl:Thing" &&
            typeString === "owl:someValuesFrom"
        ) {
            this.options.warningModule.showWarning(
                "Warning",
                "owl:someValuesFrom can not originate from owl:Thing",
                "Element not created!",
                1,
                domain,
            )
            return false
        }
        if (domain.type === "owl:Thing" && typeString === "owl:allValuesFrom") {
            this.options.warningModule.showWarning(
                "Warning",
                "owl:allValuesFrom can not originate from owl:Thing",
                "Element not created!",
                1,
                domain,
            )
            return false
        }
        if (range.type === "owl:Thing" && typeString === "owl:allValuesFrom") {
            this.options.warningModule.showWarning(
                "Warning",
                "owl:allValuesFrom can not be connected to owl:Thing",
                "Element not created!",
                1,
                range,
            )
            return false
        }
        if (range.type === "owl:Thing" && typeString === "owl:someValuesFrom") {
            this.options.warningModule.showWarning(
                "Warning",
                "owl:someValuesFrom can not be connected to owl:Thing",
                "Element not created!",
                1,
                range,
            )
            return false
        }
        return true // we can create a property
    }

    /**
     * @param {BaseNode} domain
     * @param {BaseNode} range
     * @param {number[]} draggerEndposition
     */
    #createNewObjectProperty(domain, range, draggerEndposition) {
        // check type of the property that we want to create;
        const defaultPropertyName = d3.select("#defaultProperty").node().title

        // check if we are allow to create that property
        if (!this.sanityCheckProperty(domain, range, defaultPropertyName)) {
            return false
        }

        const propPrototype = propertyClassMap.get(
            defaultPropertyName.toLowerCase(),
        )
        const aProp = new propPrototype(this)
        aProp.id = "objectProperty" + this.eP++
        aProp.domain = domain
        aProp.range = range
        aProp.label = "newObjectProperty"
        aProp.baseIri = d3.select("#iriEditor").node().value
        aProp.iri = aProp.baseIri + aProp.id

        // check for duplicate;
        if (!this.propertyCheckExistenceChecker(aProp, domain, range)) {
            return false
        }

        let autoEditElement = false
        if (defaultPropertyName === "owl:objectProperty") {
            autoEditElement = true
        }
        let pX = 0.49 * (domain.x + range.x)
        let pY = 0.49 * (domain.y + range.y)

        if (domain === range) {
            // we use the dragger endposition to determine an angle to put the loop there;
            const dirD_x = draggerEndposition[0] - domain.x
            const dirD_y = draggerEndposition[1] - domain.y

            // normalize;
            const len = Math.sqrt(dirD_x * dirD_x + dirD_y * dirD_y)

            // it should be very hard to set the position on the same sport but why not handling this
            let nx = dirD_x / len
            let ny = dirD_y / len

            if (isNaN(len)) {
                nx = 0
                ny = -1
            }

            // get domain actual raidus
            const offset = 2 * domain.actualRadius() + 50
            pX = domain.x + offset * nx
            pY = domain.y + offset * ny
        }

        // add this property to domain and range;
        domain.addProperty(aProp)
        range.addProperty(aProp)

        this.#addNewPropertyElement(aProp)

        // Update trie
        this.trie.add(aProp.labelForCurrentLanguage().toLowerCase(), aProp.id)

        this.fastUpdate()

        aProp.labelObject.x = pX
        aProp.labelObject.px = pX
        aProp.labelObject.y = pY
        aProp.labelObject.py = pY

        aProp.frozen = this._paused
        aProp.locked = this._paused
        domain.frozen = this._paused
        domain.locked = this._paused
        range.frozen = this._paused
        range.locked = this._paused
        this.options.focuserModule.handle(aProp)
        this.activateHoverElementsForProperties(
            true,
            aProp,
            false,
            this.touchDevice,
        )
        aProp.labelObject.increasedLoopAngle = true
        aProp.enableEditing(autoEditElement)
        return true
    }

    /**
     * @param {BaseNode} node
     */
    createDataTypeProperty(node) {
        // random postion issues;
        clearTimeout(this.nodeFreezer)
        // tells user when element is filtered out
        if (this.options.datatypeFilter.enabled) {
            this.options.warningModule.showWarning(
                "Warning",
                "Datatype properties are filtered out in the visualization!",
                "Element not created!",
                1,
                undefined,
            )
            return
        }

        let aNode
        // create a default datatype Node >> HERE LITERAL;
        const defaultDatatypeName = d3.select("#defaultDatatype").node().title
        if (defaultDatatypeName === "rdfs:Literal") {
            const prototype = nodeClassMap.get("rdfs:literal")
            aNode = new prototype(this)
            aNode.label = "Literal"
            aNode.iri = "http://www.w3.org/2000/01/rdf-schema#Literal"
            aNode.baseIri = "http://www.w3.org/2000/01/rdf-schema#"
        } else {
            const prototype = nodeClassMap.get("rdfs:datatype")
            aNode = new prototype(this)
            if (defaultDatatypeName === "undefined") {
                const identifier = "undefined"
                aNode.label = identifier
                // TODO : HANDLER FOR UNDEFINED DATATYPES!!<<<>>>>>>>>>>>..
                aNode.iri = "http://www.undefinedDatatype.org/#" + identifier
                aNode.baseIri = "http://www.undefinedDatatype.org/#"
                aNode.dType = defaultDatatypeName
            } else {
                const identifier = defaultDatatypeName.split(":")[1]
                aNode.label = identifier
                aNode.dType = defaultDatatypeName
                aNode.iri = "http://www.w3.org/2001/XMLSchema#" + identifier
                aNode.baseIri = "http://www.w3.org/2001/XMLSchema#"
            }
        }

        const nX = node.x - node.actualRadius() - 100
        const nY = node.y + node.actualRadius() + 100
        aNode.x = nX
        aNode.y = nY
        aNode.px = aNode.x
        aNode.py = aNode.y
        aNode.id = "NodeId" + this.eN++

        // add also the datatype Property to it
        const propPrototype = propertyClassMap.get("owl:datatypeproperty")
        const aProp = new propPrototype(this)
        aProp.id = "datatypeProperty" + this.eP++

        // create the connection
        aProp.domain = node
        aProp.range = aNode
        aProp.label = "newDatatypeProperty"

        // TODO: change its base IRI to proper value
        const ontoIri = d3.select("#iriEditor").node().value
        aProp.baseIri = ontoIri
        aProp.iri = ontoIri + aProp.id

        this.#addNewNodeElement(aNode)
        this.#addNewPropertyElement(aProp)
        this.generateDictionary()
        this.fastUpdate()

        const _this = this
        this.nodeFreezer = setTimeout(function () {
            if (node && node.frozen && !node.pinned && !_this._paused) {
                node.frozen = _this._paused
                node.locked = _this._paused
            }
        }, 1000)
        this.options.focuserModule.handle(undefined)
        if (node) {
            node.frozen = true
            node.locked = true
        }
    }

    /**
     * @param {BaseNode[]} nodesToRemove
     * @param {BaseProperty[]} propsToRemove
     */
    removeNodesViaResponse(nodesToRemove, propsToRemove) {
        for (let i = 0; i < propsToRemove.length; i++) {
            const property = propsToRemove[i]
            this.propertyMap.delete(property.id)
            let id = this.unfilteredData.properties.indexOf(property)
            if (id !== -1) {
                this.unfilteredData.properties.splice(id, 1)
            }
            id = this.properties.indexOf(property)
            if (id !== -1) {
                this.properties.splice(id, 1)
            }
            this.trie.remove(
                property.labelForCurrentLanguage().toLowerCase(),
                property.id,
            )
            propsToRemove[i] = null
        }
        for (let i = 0; i < nodesToRemove.length; i++) {
            const node = nodesToRemove[i]
            let id = this.unfilteredData.nodes.indexOf(node)
            if (id !== -1) {
                this.unfilteredData.nodes.splice(id, 1)
            }
            id = this.classNodes.indexOf(node)
            if (id !== -1) {
                this.classNodes.splice(id, 1)
            }
            this.trie.remove(
                node.labelForCurrentLanguage().toLowerCase(),
                node.id,
            )
            nodesToRemove[i] = null
        }
        this.fastUpdate()
        this.options.focuserModule.handle(undefined)
        nodesToRemove = null
        propsToRemove = null
    }

    /**
     * @param {BaseNode} node
     */
    removeNodeViaEditor(node) {
        const propsToRemove = []
        const nodesToRemove = []
        let datatypes = 0

        nodesToRemove.push(node)
        for (let i = 0; i < this.unfilteredData.properties.length; i++) {
            if (
                this.unfilteredData.properties[i].domain === node ||
                this.unfilteredData.properties[i].range === node
            ) {
                propsToRemove.push(this.unfilteredData.properties[i])
                if (
                    this.unfilteredData.properties[
                        i
                    ].type.toLocaleLowerCase() === "owl:datatypeproperty" &&
                    this.unfilteredData.properties[i].range !== node
                ) {
                    nodesToRemove.push(this.unfilteredData.properties[i].range)
                    datatypes++
                }
            }
        }
        if (propsToRemove.length + nodesToRemove.length > 2) {
            let text =
                "You are about to delete 1 class and " +
                propsToRemove.length +
                " properties"
            if (datatypes !== 0) {
                text =
                    "You are about to delete 1 class, " +
                    datatypes +
                    " datatypes  and " +
                    propsToRemove.length +
                    " properties"
            }
            this.options.warningModule.responseWarning(
                "Removing elements",
                text,
                "Awaiting response!",
                (nodesToRemove, propsToRemove) => {
                    this.removeNodesViaResponse(nodesToRemove, propsToRemove)
                },
                [nodesToRemove, propsToRemove],
            )
        } else {
            this.removeNodesViaResponse(nodesToRemove, propsToRemove)
        }
    }

    /**
     * @param {BaseProperty} property
     */
    removePropertyViaEditor(property) {
        property.domain.removePropertyElement(property)
        property.range.removePropertyElement(property)

        let nodesToRemove = []
        let propsToRemove = [property]

        if (property.type.toLocaleLowerCase() === "owl:datatypeproperty") {
            nodesToRemove.push(property.range)
        }
        if (property.inverse) {
            property.inverse.inverse = undefined
        }
        this.removeNodesViaResponse(nodesToRemove, propsToRemove)
        this.hoveredPropertyElement = undefined
    }

    executeColorExternalsModule() {
        this.options.colorExternalsModule.filter(
            this.unfilteredData.nodes,
            this.unfilteredData.properties,
        )
    }

    executeCompactNotationModule() {
        if (this.unfilteredData) {
            this.options.compactNotationModule.filter(
                this.unfilteredData.nodes,
                this.unfilteredData.properties,
            )
        }
    }

    executeEmptyLiteralFilter() {
        if (this.unfilteredData && this.unfilteredData.nodes.length > 1) {
            this.options.emptyLiteralFilter.filter(
                this.unfilteredData.nodes,
                this.unfilteredData.properties,
            )
            this.unfilteredData.nodes =
                this.options.emptyLiteralFilter.filteredNodes
            this.unfilteredData.properties =
                this.options.emptyLiteralFilter.filteredProperties
        }
    }

    //** --------------------------------------------------------- **/
    //** -- Touch behaviour functions --                   **/
    //** --------------------------------------------------------- **/
    modified_dblClickFunction() {
        d3.event.stopPropagation()
        d3.event.preventDefault()
        // get position where we want to add the node;
        const grPos = this.#getClickedScreenCoords(
            d3.event.clientX,
            d3.event.clientY,
            this.getTranslation(),
            this.getScaleFactor(),
        )
        this.#createNewNodeAtPosition(grPos)
    }

    #doubletap() {
        const touch_time = d3.event.timeStamp
        let numTouchers = 1
        if (d3.event && d3.event.touches && d3.event.touches.length) {
            numTouchers = d3.event.touches.length
        }
        if (touch_time - this.last_touch_time < 300 && numTouchers === 1) {
            d3.event.stopPropagation()
            if (this.isEditorMode) {
                //graph.modified_dblClickFunction();
                d3.event.preventDefault()
                d3.event.stopPropagation()
                this.last_touch_time = touch_time
                return true
            }
        }
        this.last_touch_time = touch_time
        return false
    }

    #touchzoomed() {
        this.forceNotZooming = true
        const touch_time = d3.event.timeStamp
        if (
            touch_time - this.last_touch_time < 300 &&
            d3.event.touches.length === 1
        ) {
            d3.event.stopPropagation()
            if (this.isEditorMode) {
                //graph.modified_dblClickFunction();
                d3.event.preventDefault()
                d3.event.stopPropagation()
                this.zoom.translate(this.graphTranslation)
                this.zoom.scale(this.zoomFactor)
                this.modified_dblTouchFunction()
            } else {
                this.forceNotZooming = false
                if (this.originalD3_touchZoomFunction)
                    this.originalD3_touchZoomFunction() // REVIEW: Might be context issues when calling
            }
            return
        }
        this.forceNotZooming = false
        this.last_touch_time = touch_time
        // TODO: WORK AROUND TO CHECK FOR ORIGINAL FUNCTION
        if (this.originalD3_touchZoomFunction)
            this.originalD3_touchZoomFunction() // REVIEW: Might be context issues when calling
    }

    modified_dblTouchFunction() {
        d3.event.stopPropagation()
        d3.event.preventDefault()
        if (this.isEditorMode) {
            const xy = d3.touches(d3.selectAll(".vowlGraph").node())
            const grPos = this.#getClickedScreenCoords(
                xy[0][0],
                xy[0][1],
                this.getTranslation(),
                this.getScaleFactor(),
            )
            this.#createNewNodeAtPosition(grPos)
        }
    }

    //** --------------------------------------------------------- **/
    //** -- Hover and Selection functions, adding edit elements -- **/
    //** --------------------------------------------------------- **/

    /**
     * @param {boolean} touchBehaviour
     */
    #delayedHiddingHoverElements(touchBehaviour = false) {
        if (touchBehaviour) {
            return
        }
        if (this.hoveredNodeElement) {
            if (this.hoveredNodeElement.editingTextElement) {
                return
            }
            this.delayedHider = setTimeout(() => {
                this.deleteGroupElement.classed("hidden", true)
                this.addDataPropertyGroupElement.classed("hidden", true)
                this.classDragger.hideDragger(true)
                if (
                    this.hoveredNodeElement &&
                    !this.hoveredNodeElement.pinned &&
                    !this._paused &&
                    !this.hoveredNodeElement.editingTextElement
                ) {
                    this.hoveredNodeElement.frozen = false
                    this.hoveredNodeElement.locked = false
                }
            }, 1000)
        }
        if (this.hoveredPropertyElement) {
            if (this.hoveredPropertyElement.editingTextElement) {
                return
            }
            this.delayedHider = setTimeout(() => {
                this.deleteGroupElement.classed("hidden", true)
                this.addDataPropertyGroupElement.classed("hidden", true)
                this.classDragger.hideDragger(true)
                this.rangeDragger.hideDragger(true)
                this.domainDragger.hideDragger(true)
                this.shadowClone.hideClone(true)
                if (
                    this.hoveredPropertyElement &&
                    this.hoveredPropertyElement.focused &&
                    this.options.drawPropertyDraggerOnHover
                ) {
                    this.hoveredPropertyElement.labelObject.increasedLoopAngle = false
                    // lazy update
                    this.#recalculatePositions()
                }
                if (
                    this.hoveredPropertyElement &&
                    !this.hoveredPropertyElement.pinned &&
                    !this._paused &&
                    !this.hoveredPropertyElement.editingTextElement
                ) {
                    this.hoveredPropertyElement.frozen = false
                    this.hoveredPropertyElement.locked = false
                }
            }, 1000)
        }
    }

    // TODO : experimental code for updating dynamic label with and its hover element
    hideHoverPropertyElementsForAnimation() {
        this.deleteGroupElement.classed("hidden", true)
    }

    killDelayedTimer() {
        clearTimeout(this.delayedHider)
        clearTimeout(this.nodeFreezer)
    }

    /**
     * @param {BaseProperty} property
     */
    showHoverElementsAfterAnimation(property) {
        this.#setDeleteHoverElementPositionProperty(property)
        this.deleteGroupElement.classed("hidden", false)
    }

    #editElementHoverOnHidden() {
        this.classDragger.nodeElement.classed("classDraggerNodeHovered", true)
        this.classDragger.nodeElement.classed("classDraggerNode", false)
        this.#editElementHoverOn()
    }

    #editElementHoverOutHidden() {
        this.classDragger.nodeElement.classed("classDraggerNodeHovered", false)
        this.classDragger.nodeElement.classed("classDraggerNode", true)
        this.#editElementHoverOut()
    }

    /**
     * @param {boolean} touch
     */
    #editElementHoverOn(touch = false) {
        if (touch) {
            return
        }
        clearTimeout(this.delayedHider) // ignore touch behaviour
    }

    /**
     * @param {boolean} touchBehaviour
     */
    #editElementHoverOut(touchBehaviour = false) {
        if (this.hoveredNodeElement) {
            if (
                this.ignoreOtherHoverEvents ||
                touchBehaviour ||
                this.hoveredNodeElement.editingTextElement
            ) {
                return
            }
            this.delayedHider = setTimeout(() => {
                if (this.isADraggerActive()) {
                    return
                }
                this.deleteGroupElement.classed("hidden", true)
                this.addDataPropertyGroupElement.classed("hidden", true)
                this.classDragger.hideDragger(true)
                if (
                    this.hoveredNodeElement &&
                    !this.hoveredNodeElement.pinned &&
                    !this._paused
                ) {
                    this.hoveredNodeElement.frozen = false
                    this.hoveredNodeElement.locked = false
                }
            }, 1000)
        }
        if (this.hoveredPropertyElement) {
            if (
                this.ignoreOtherHoverEvents ||
                touchBehaviour ||
                this.hoveredPropertyElement.editingTextElement
            ) {
                return
            }
            this.delayedHider = setTimeout(() => {
                if (this.isADraggerActive()) {
                    return
                }
                this.deleteGroupElement.classed("hidden", true)
                this.addDataPropertyGroupElement.classed("hidden", true)
                this.classDragger.hideDragger(true)
                if (
                    this.hoveredPropertyElement &&
                    !this.hoveredPropertyElement.pinned &&
                    !this._paused
                ) {
                    this.hoveredPropertyElement.frozen = false
                    this.hoveredPropertyElement.locked = false
                }
            }, 1000)
        }
    }

    /**
     * @param {boolean} val
     * @param {BaseProperty} property
     * @param {boolean} inversed
     * @param {boolean} touchBehaviour
     */
    activateHoverElementsForProperties(
        val,
        property,
        inversed,
        touchBehaviour,
    ) {
        if (!this.isEditorMode) {
            return // nothing to do;
        }
        if (touchBehaviour === undefined) {
            touchBehaviour = false
        }

        if (val) {
            clearTimeout(this.delayedHider)
            if (this.hoveredPropertyElement) {
                if (
                    this.hoveredPropertyElement.domain ===
                    this.hoveredPropertyElement.range
                ) {
                    this.hoveredPropertyElement.labelObject.increasedLoopAngle = false
                    this.#recalculatePositions()
                }
            }

            this.hoveredPropertyElement = property
            if (this.options.drawPropertyDraggerOnHover) {
                if (property.type !== "owl:DatatypeProperty") {
                    if (property.domain === property.range) {
                        property.labelObject.increasedLoopAngle = true
                        this.#recalculatePositions()
                    }
                    this.shadowClone.setParentProperty(property, inversed)
                    this.rangeDragger.setParentProperty(property, inversed)
                    this.rangeDragger.hideDragger(false)
                    this.rangeDragger.addMouseEvents()
                    this.domainDragger.setParentProperty(property, inversed)
                    this.domainDragger.hideDragger(false)
                    this.domainDragger.addMouseEvents()
                } else if (property.type === "owl:DatatypeProperty") {
                    this.shadowClone.setParentProperty(property, inversed)
                    this.rangeDragger.setParentProperty(property, inversed)
                    this.rangeDragger.hideDragger(true)
                    this.rangeDragger.addMouseEvents()
                    this.domainDragger.setParentProperty(property, inversed)
                    this.domainDragger.hideDragger(false)
                    this.domainDragger.addMouseEvents()
                }
            } else {
                // hide when we dont want that option
                if (this.options.drawPropertyDraggerOnHover) {
                    this.rangeDragger.hideDragger(true)
                    this.domainDragger.hideDragger(true)
                    this.shadowClone.hideClone(true)
                    if (property.domain === property.range) {
                        property.labelObject.increasedLoopAngle = false
                        this.#recalculatePositions()
                    }
                }
            }

            if (this.hoveredNodeElement) {
                if (
                    this.hoveredNodeElement &&
                    !this.hoveredNodeElement.pinned &&
                    !this._paused
                ) {
                    this.hoveredNodeElement.frozen = false
                    this.hoveredNodeElement.locked = false
                }
            }
            this.hoveredNodeElement = undefined
            this.deleteGroupElement.classed("hidden", false)
            this.#setDeleteHoverElementPositionProperty(property)
            this.deleteGroupElement.selectAll("*").on("click", () => {
                if (touchBehaviour && !property.focused) {
                    this.options.focuserModule.handle(property)
                    return
                }
                this.removePropertyViaEditor(property)
                d3.event.stopPropagation()
            })
            this.classDragger.hideDragger(true)
            this.addDataPropertyGroupElement.classed("hidden", true)
        } else {
            this.#delayedHiddingHoverElements()
        }
    }

    /**
     * Set opacity style for all elements
     */
    updateDraggerElements() {
        this.rangeDragger.draggerObject.classed(
            "superOpacityElement",
            !this.options.showDraggerObject,
        )
        this.domainDragger.draggerObject.classed(
            "superOpacityElement",
            !this.options.showDraggerObject,
        )
        this.classDragger.draggerObject.classed(
            "superOpacityElement",
            !this.options.showDraggerObject,
        )
        this.nodeContainer
            .selectAll(".superHiddenElement")
            .classed("superOpacityElement", !this.options.showDraggerObject)
        this.labelContainer
            .selectAll(".superHiddenElement")
            .classed("superOpacityElement", !this.options.showDraggerObject)
        this.deleteGroupElement
            .selectAll(".superHiddenElement")
            .classed("superOpacityElement", !this.options.showDraggerObject)
        this.addDataPropertyGroupElement
            .selectAll(".superHiddenElement")
            .classed("superOpacityElement", !this.options.showDraggerObject)
    }

    /**
     * @param {BaseNode} node
     */
    #setAddDataPropertyHoverElementPosition(node) {
        if (node.renderType === "round") {
            const scale = 0.5 * Math.sqrt(2.0)
            const oX = scale * node.actualRadius()
            const oY = scale * node.actualRadius()
            const delX = node.x - oX
            const delY = node.y + oY
            this.addDataPropertyGroupElement.attr(
                "transform",
                "translate(" + delX + "," + delY + ")",
            )
        }
    }

    /**
     * @param {BaseNode} node
     */
    #setDeleteHoverElementPosition(node) {
        let delX, delY
        if (node.renderType === "round") {
            const scale = 0.5 * Math.sqrt(2.0)
            const oX = scale * node.actualRadius()
            const oY = scale * node.actualRadius()
            delX = node.x + oX
            delY = node.y - oY
        } else {
            delX = node.x + 0.5 * node.labelWidth + 6
            delY = node.y - 0.5 * node.height - 6
        }
        this.deleteGroupElement.attr(
            "transform",
            "translate(" + delX + "," + delY + ")",
        )
    }

    /**
     * @param {BaseProperty} property
     */
    #setDeleteHoverElementPositionProperty(property) {
        if (property && property.labelElement) {
            const pos = [property.labelObject.x, property.labelObject.y]
            const widthElement = parseFloat(property.shapeElement.attr("width"))
            const heightElement = parseFloat(
                property.shapeElement.attr("height"),
            )
            const delX = pos[0] + 0.5 * widthElement + 6
            let delY = pos[1] - 0.5 * heightElement - 6
            // this is the lower element
            if (property.labelElement.attr("transform") === "translate(0,15)") {
                delY += 15
            }
            // this is upper element
            if (
                property.labelElement.attr("transform") === "translate(0,-15)"
            ) {
                delY -= 15
            }
            this.deleteGroupElement.attr(
                "transform",
                "translate(" + delX + "," + delY + ")",
            )
        } else {
            this.deleteGroupElement.classed("hidden", true) // hide when there is no property
        }
    }

    /**
     * @param {boolean} val
     * @param {BaseNode} node
     * @param {boolean} touchBehaviour
     */
    activateHoverElements(val, node, touchBehaviour) {
        if (!this.isEditorMode) {
            return // nothing to do;
        }
        if (touchBehaviour === undefined) {
            touchBehaviour = false
        }
        if (val) {
            if (this.options.drawPropertyDraggerOnHover) {
                this.rangeDragger.hideDragger(true)
                this.domainDragger.hideDragger(true)
                this.shadowClone.hideClone(true)
            }
            // make them visible
            clearTimeout(this.delayedHider)
            clearTimeout(this.nodeFreezer)
            if (this.hoveredNodeElement && !node.pinned && !this._paused) {
                this.hoveredNodeElement.frozen = false
                this.hoveredNodeElement.locked = false
            }
            this.hoveredNodeElement = node
            if (node && !node.frozen && !node.pinned) {
                node.frozen = true
                node.locked = false
            }
            if (
                this.hoveredPropertyElement &&
                !this.hoveredPropertyElement.focused
            ) {
                this.hoveredPropertyElement.labelObject.increasedLoopAngle = false
                this.#recalculatePositions()
                // update the loopAngles;
            }
            this.hoveredPropertyElement = undefined
            this.deleteGroupElement.classed("hidden", false)
            this.#setDeleteHoverElementPosition(node)

            this.deleteGroupElement
                .selectAll("*")
                .on("click", () => {
                    if (touchBehaviour && !node.focused) {
                        this.options.focuserModule.handle(node)
                        return
                    }
                    this.removeNodeViaEditor(node)
                    d3.event.stopPropagation()
                })
                .on("mouseover", () => {
                    this.#editElementHoverOn(touchBehaviour)
                })
                .on("mouseout", () => {
                    this.#editElementHoverOut(touchBehaviour)
                })

            this.addDataPropertyGroupElement.classed("hidden", true)
            this.classDragger.nodeElement
                .on("mouseover", () => {
                    this.#editElementHoverOn()
                })
                .on("mouseout", () => {
                    this.#editElementHoverOut()
                })
            this.classDragger.draggerObject
                .on("mouseover", () => {
                    this.#editElementHoverOnHidden()
                })
                .on("mouseout", () => {
                    this.#editElementHoverOutHidden()
                })

            // add the dragger element;
            if (node.renderType === "round") {
                this.classDragger.svgRoot = this.draggerLayer
                this.classDragger.setParentNode(node)
                this.classDragger.hideDragger(false)
                this.addDataPropertyGroupElement.classed("hidden", false)
                this.#setAddDataPropertyHoverElementPosition(node)
                this.addDataPropertyGroupElement
                    .selectAll("*")
                    .on("click", () => {
                        if (touchBehaviour && !node.focused) {
                            this.options.focuserModule.handle(node)
                            return
                        }
                        this.createDataTypeProperty(node)
                        d3.event.stopPropagation()
                    })
                    .on("mouseover", () => {
                        this.#editElementHoverOn(touchBehaviour)
                    })
                    .on("mouseout", () => {
                        this.#editElementHoverOut(touchBehaviour)
                    })
            } else {
                this.classDragger.hideDragger(true)
            }
        } else {
            this.#delayedHiddingHoverElements(touchBehaviour)
        }
    }
}
