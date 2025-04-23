import Graph from "../../graph"
import CenteringTextElement from "../../util/CenteringTextElement"
import PrefixTools from "../../util/prefixTools"
import BaseElement from "../BaseElement"
import DrawTools from "../drawTools"
import ArrowLink from "../links/ArrowLink"
import BoxArrowLink from "../links/BoxArrowLink"
import PlainLink from "../links/PlainLink"
import BaseNode from "../nodes/BaseNode"
import { RectangularElementToolsMixin } from "../rectangularElementTools"

export default class BaseProperty extends RectangularElementToolsMixin(
    BaseElement,
) {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        // @ts-ignore
        super(graph)
        if (this.constructor === BaseProperty) {
            throw new Error("Abstract classes can't be instantiated")
        }

        // Basic attributes
        /**
         * @type {BaseNode | undefined} // Can also be a string during parser.js, but is omitted here as it causes the TS compiler to complain too much
         */
        this.domain = undefined
        /**
         * @type {BaseNode | undefined} // Can also be a string during parser.js, but is omitted here as it causes the TS compiler to complain too much
         */
        this.range = undefined
        /**
         * @type {BaseProperty | undefined} // Can also be a string during parser.js, but is omitted here as it causes the TS compiler to complain too much
         */
        this.inverse = undefined
        /**
         * @type {PlainLink | BoxArrowLink | ArrowLink}
         */
        this.link = undefined
        /**
         * @type {string | undefined}
         */
        this.cardinality = undefined
        /**
         * @type {string | undefined}
         */
        this.minCardinality = undefined
        /**
         * @type {string | undefined}
         */
        this.maxCardinality = undefined
        /**
         * @type {BaseProperty[] | undefined} // Can also be a string[] during parser.js, but is omitted here as it causes the TS compiler to complain too much
         */
        this.subproperties = undefined
        /**
         * @type {BaseProperty[] | undefined} // Can also be a string[] during parser.js, but is omitted here as it causes the TS compiler to complain too much
         */
        this.superproperties = undefined
        /**
         * @type {BaseProperty[] | undefined}
         */
        this.redundantProperties = undefined

        // Style attributes
        /**
         * @type {string}
         */
        this.linkType = "normal"
        /**
         * @type {string}
         */
        this.markerType = "filled"
        /**
         * @type {boolean}
         */
        this.labelVisible = true

        // Size attributes
        /**
         * @type {number}
         */
        this.defaultWidth = 80
        /**
         * @type {number}
         */
        this.height = 28 // labelHeight
        /**
         * @type {number}
         */
        this.width = 80 // labelWidth && myWidth
        /**
         * @type {number}
         */
        this.smallestRadius = this.height / 2

        // Element containers
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.cardinalityElement = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.labelElement = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.linkGroup = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.markerElement = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.shapeElement = undefined
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.parent_labelObject = undefined
    }

    // NOTE: Disabled to save memory while this method is not used
    // existingPropertyIRI(url) {
    //     return graph.options.editSidebar.checkForExistingURL(url);
    // }

    get labelObject() {
        return this.parent_labelObject
    }

    /**
     * @param {any[] | any} args
     */
    set labelObject(args) {
        let lo = args
        let once
        if (args instanceof Array) {
            ;[lo, once] = args
        }

        this.parent_labelObject = lo
        if (this.inverse && !once) {
            this.inverse.labelObject = [lo, true]
        }
    }

    getTextWidth() {
        return this.width
    }

    /**
     * @param {number} width
     */
    setTextWidth(width) {
        this.width = width
    }

    markerId() {
        return "marker" + this.id
    }

    /**
     * @param {boolean} val
     */
    hide(val) {
        this.labelElement.classed("hidden", val)
        this.linkGroup.classed("hidden", val)
        if (this.cardinalityElement) {
            this.cardinalityElement.classed("hidden", val)
        }
    }

    // NOTE: Disabled to save memory while this method is not used
    // linkHasMarker() {
    //     return this.linkType !== "dashed";
    // }

    toggleFocus() {
        this.focused = !this.focused
        this.labelElement.select("rect").classed("focused", this.focused)
        this.graph.resetSearchHighlight()
        this.graph.options.searchMenu.clearText()
    }

    redrawElement() {
        this.shapeElement.remove()
        this.textBlock.remove()

        this.drawLabel(this.labelElement)
        this.animateDynamicLabelWidth(this.graph.options.dynamicLabelWidth)
        //this. shapeElement=this.addRect(this.labelElement);
        //
        // const equivalentsString = this.equivalentsString();
        // const suffixForFollowingEquivalents = equivalentsString ? "," : "";
        //
        // this.textBlock = new CenteringTextElement(labelContainer, this.backgroundColor);
        // this.textBlock.addText(this.labelForCurrentLanguage(), "", suffixForFollowingEquivalents);
        // this.textBlock.addEquivalents(equivalentsString);
        // this.textBlock.addSubText(this.indicationString());
    }

    // Reused functions TODO refactor
    /**
     * @param {d3.Selection<any,any,null,undefined>} labelGroup
     */
    draw(labelGroup) {
        /**
         * @param {BaseProperty} property
         */
        function attachLabel(property) {
            const labelContainer = labelGroup
                .append("g")
                .datum(property)
                .classed("label", true)
                .attr("id", property.id)

            property.drawLabel(labelContainer)
            return labelContainer
        }

        if (!this.labelVisible) {
            return undefined
        }
        if (this.graph.options.dynamicLabelWidth === true) {
            this.width = Math.min(
                this.getMyWidth(),
                this.graph.options.maxLabelWidth,
            )
        } else {
            this.width = this.defaultWidth
        }

        this.labelElement = attachLabel(this)
        // Draw an inverse label and reposition both labels if necessary
        if (this.inverse) {
            const yTransformation = this.height / 2 + 1 /* additional space */
            this.inverse.labelElement = attachLabel(this.inverse)
            this.labelElement.attr(
                "transform",
                "translate(" + 0 + ",-" + yTransformation + ")",
            )
            this.inverse.labelElement.attr(
                "transform",
                "translate(" + 0 + "," + yTransformation + ")",
            )
        }

        if (this.pinned) {
            this.drawPin()
        } else if (this.inverse && this.inverse.pinned) {
            this.inverse.drawPin()
        }

        if (this.halo) {
            this.drawHalo()
        }
        return this.labelElement
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} labelContainer
     */
    addRect(labelContainer) {
        const rect = labelContainer
            .append("rect")
            .classed(this.styleClass, true)
            .classed("property", true)
            .attr("x", -this.labelWidth / 2)
            .attr("y", -this.height / 2)
            .attr("width", this.labelWidth)
            .attr("height", this.height)
            .on("mouseover", () => {
                this.#onMouseOver()
            })
            .on("mouseout", () => {
                this.#onMouseOut()
            })

        rect.append("title").text(this.labelForCurrentLanguage())

        if (this.visualAttributes) {
            rect.classed(this.visualAttributes, true)
        }

        let bgColor = this.backgroundColor
        if (this.attributes && this.attributes.indexOf("deprecated") > -1) {
            bgColor = undefined
            rect.classed("deprecatedproperty", true)
        } else {
            rect.classed("deprecatedproperty", false)
        }
        rect.style("fill", bgColor)

        return rect
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} labelContainer
     */
    drawLabel(labelContainer) {
        this.shapeElement = this.addRect(labelContainer)
        const equivalentsString = this.equivalentsString()
        const suffixForFollowingEquivalents = equivalentsString ? "," : ""

        let bgColor = this.backgroundColor
        if (this.attributes && this.attributes.indexOf("deprecated") > -1) {
            bgColor = undefined
        }
        this.textBlock = new CenteringTextElement(labelContainer, bgColor)
        this.textBlock.addText(
            this.labelForCurrentLanguage(),
            "",
            suffixForFollowingEquivalents,
        )
        this.textBlock.addEquivalents(equivalentsString)
        this.textBlock.addSubText(this.indicationString())
    }

    equivalentsString() {
        const equivalentProperties = this.equivalents
        if (!equivalentProperties) {
            return
        }

        return equivalentProperties
            .map(function (/** @type {BaseProperty} */ property) {
                if (property === undefined || typeof property === "string") {
                    // @WORKAROUND
                    return "ERROR"
                }
                return property.labelForCurrentLanguage()
            })
            .join(", ")
    }

    /**
     * @param {d3.Selection<any,any,null,undefined>} container
     * @returns {boolean} True if drawing is successful
     */
    drawCardinality(container) {
        const cardinalityText = this.generateCardinalityText()
        if (cardinalityText) {
            this.cardinalityElement = container
            if (
                cardinalityText.indexOf("A") === 0 &&
                cardinalityText.length === 1
            ) {
                // replacing text elements to svg elements;
                container
                    .classed("cardinality", true)
                    .attr("text-anchor", "middle")
                    .append("path")
                    .classed("cardinality", true)
                    .attr(
                        "d",
                        "m -8.8832678,-11.303355 -7.97e-4,0 0.717374,1.833297 8.22987151,21.371761 8.66826659,-21.2123526 0.797082,-1.9927054 0.02471,0 -0.8218553,1.9927054 -2.2517565,5.4201577 -12.4444429,8e-6 -2.2019394,-5.5795821 z",
                    )
                    .style("fill", "none")
                    .attr("transform", "matrix(0.5,0,0,0.5,0.5,0.5)")
                return true
            } else if (
                cardinalityText.indexOf("E") === 0 &&
                cardinalityText.length === 1
            ) {
                container
                    .classed("cardinality", true)
                    .attr("text-anchor", "middle")
                    .append("path")
                    .classed("cardinality", true)
                    .attr(
                        "d",
                        "m -5.5788451,-8.0958763 10.8749368,0 0,8.34681523 -9.5707468,0.040132 9.5707468,-0.040132 0,8.42707237 -10.9150654,0",
                    )
                    .style("fill", "none")
                    .attr("transform", "matrix(0.5,0,0,0.5,0.5,0.5)")
                return true
            } else {
                container
                    .append("text")
                    .classed("cardinality", true)
                    .attr("text-anchor", "middle")
                    .attr("dy", "0.5ex")
                    .text(cardinalityText)
                return true
            }
        } else {
            return false
        }
    }

    generateCardinalityText() {
        if (this.cardinality) {
            return this.cardinality
        } else if (this.minCardinality || this.maxCardinality) {
            const minBoundary = this.minCardinality || "0"
            const maxBoundary = this.maxCardinality || "*"
            return minBoundary + ".." + maxBoundary
        }
        return undefined
    }

    /**
     * @param {boolean} enable
     */
    setHighlighting(enable) {
        if (this.labelElement && this.labelElement) {
            this.labelElement.select("rect").classed("hovered", enable)
        }
        this.linkGroup.selectAll("path, text").classed("hovered", enable)
        if (this.markerElement) {
            this.markerElement.select("path").classed("hovered", enable)
            if (this.cardinalityElement) {
                this.cardinalityElement
                    .selectAll("path")
                    .classed("hovered-MathSymbol", enable)
                this.cardinalityElement.classed("hovered", enable)
            }
        }
        const subAndSuperProperties = this.#getSubAndSuperProperties()
        subAndSuperProperties.forEach(function (property) {
            if (property.labelElement && property.labelElement) {
                property.labelElement
                    .select("rect")
                    .classed("indirect-highlighting", enable)
            }
        })

        let inversed = false
        if (!this.graph.ignoreOtherHoverEvents) {
            if (this.inverse) {
                inversed = true
            }
            if (!this.graph.touchDevice) {
                this.graph.activateHoverElementsForProperties(
                    enable,
                    this,
                    inversed,
                )
            } else {
                this.labelElement.select("rect").classed("hovered", false)
                this.linkGroup.selectAll("path, text").classed("hovered", false)
                if (this.markerElement) {
                    this.markerElement.select("path").classed("hovered", false)
                    if (this.cardinalityElement) {
                        this.cardinalityElement.classed("hovered", false)
                    }
                }
                this.graph.activateHoverElementsForProperties(
                    enable,
                    this,
                    inversed,
                    true,
                )
            }
        }
    }

    /**
     * Combines the sub- and superproperties into a single array, because
     * they're often used equivalently.
     */
    #getSubAndSuperProperties() {
        /**
         * @type {BaseProperty[]}
         */
        let properties = []
        if (this.subproperties) {
            properties = properties.concat(this.subproperties)
        }
        if (this.superproperties) {
            properties = properties.concat(this.superproperties)
        }
        return properties
    }

    /**
     * Foregrounds the property, its inverse and the link.
     */
    foreground() {
        // check for additional objects this we can highlight
        if (!this.labelElement) return
        if (this.labelElement.node().parentNode === null) {
            return
        }
        const selectedLabelGroup = this.labelElement.node().parentNode,
            labelContainer = selectedLabelGroup.parentNode,
            selectedLinkGroup = this.linkGroup.node(),
            linkContainer = this.linkGroup.node().parentNode
        if (this.animationProcess() === false) {
            labelContainer.appendChild(selectedLabelGroup)
        }
        linkContainer.appendChild(selectedLinkGroup)
    }

    /**
     * Foregrounds the sub- and superproperties of this property.
     * This is separated from the foreground-function to prevent endless loops.
     */
    #foregroundSubAndSuperProperties() {
        for (const property of this.#getSubAndSuperProperties()) {
            if (property.foreground) {
                property.foreground()
            }
        }
    }

    #onMouseOver() {
        if (this.mouseEntered || this.ignoreLocalHoverEvents === true) {
            return
        }
        this.mouseEntered = true
        this.setHighlighting(true)
        this.foreground()
        this.#foregroundSubAndSuperProperties()
    }

    #onMouseOut() {
        this.mouseEntered = false
        this.setHighlighting(false)
    }

    drawPin() {
        this.pinned = true
        if (this.graph.options.dynamicLabelWidth === true) {
            this.width = this.getMyWidth()
        } else {
            this.width = this.defaultWidth
        }
        if (this.inverse) {
            // check which element is rendered on top and add a pin to it
            const tr_that = this.labelElement.attr("transform")
            const tr_inv = this.inverse.labelElement.attr("transform")
            const thatY = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(
                tr_that,
            )[2]
            const invY = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(
                tr_inv,
            )[2]

            if (thatY < invY)
                this.pinGroupElement = DrawTools.drawPin(
                    this.labelElement,
                    -0.5 * this.width + 10,
                    -25,
                    this.removePin,
                    this.graph.options.showDraggerObject,
                    this.graph.options.useAccuracyHelper,
                )
            else
                this.pinGroupElement = DrawTools.drawPin(
                    this.inverse.labelElement,
                    -0.5 * this.inverse.labelWidth + 10,
                    -25,
                    this.removePin,
                    this.graph.options.showDraggerObject,
                    this.graph.options.useAccuracyHelper,
                )
        } else {
            this.pinGroupElement = DrawTools.drawPin(
                this.labelElement,
                -0.5 * this.width + 10,
                -25,
                this.removePin,
                this.graph.options.showDraggerObject,
                this.graph.options.useAccuracyHelper,
            )
        }
    }

    animationProcess() {
        let animRuns = false
        if (this.haloGroupElement) {
            const haloGr = this.haloGroupElement
            const haloEls = haloGr.selectAll(".searchResultA")
            animRuns = haloGr.attr("animationRunning")

            if (typeof animRuns !== "boolean") {
                // parse this to a boolean value
                animRuns = animRuns === "true"
            }
            if (animRuns === false) {
                haloEls.classed("searchResultA", false)
                haloEls.classed("searchResultB", true)
            }
        }
        return animRuns
    }

    /**
     * @param {boolean} pulseAnimation
     */
    drawHalo(pulseAnimation = false) {
        this.halo = true
        const offset = 0
        if (this.labelElement && this.labelElement.node()) {
            const labelNode = this.labelElement.node()
            const labelContainer = labelNode.parentNode
            // do this only if animation is not running
            if (!this.animationProcess() && labelContainer) {
                labelContainer.appendChild(labelNode)
            }
        }
        this.haloGroupElement = DrawTools.drawRectHalo(
            this.labelElement,
            this.width,
            this.height,
            offset,
        )
        if (this.haloGroupElement) {
            const haloNode = this.haloGroupElement.node()
            const haloContainer = haloNode.parentNode
            haloContainer.appendChild(haloNode)
        }
        if (this.pinned) {
            const selectedNode = this.pinGroupElement.node()
            const nodeContainer = selectedNode.parentNode
            nodeContainer.appendChild(selectedNode)
        }
        if (this.inverse && this.inverse.pinned) {
            if (this.inverse.pinGroupElement) {
                const selectedNode = this.inverse.pinGroupElement.node()
                const nodeContainer = selectedNode.parentNode
                nodeContainer.appendChild(selectedNode)
            }
        }
        if (!pulseAnimation) {
            const pulseItem = this.haloGroupElement.selectAll(".searchResultA")
            pulseItem.classed("searchResultA", false)
            pulseItem.classed("searchResultB", true)
            pulseItem.attr("animationRunning", false)
        }
    }

    /**
     * @param {boolean} dynamic
     */
    animateDynamicLabelWidth(dynamic) {
        this.removeHalo()
        if (this.shapeElement === undefined) {
            // this handles setOperatorProperties which dont have a shapeElement!
            return
        }

        const transition = () => {
            const dx = -0.5 * this.width + 10
            const dy = -25
            return [dx, dy]
        }

        super.animateDynamicLabelWidth(dynamic, transition)
    }

    redrawLabelText() {
        this.textBlock.remove()
        this.addTextLabelElement()
        this.animateDynamicLabelWidth(this.graph.options.dynamicLabelWidth)
        this.shapeElement.select("title").text(this.labelForCurrentLanguage())
    }

    addTextLabelElement() {
        const equivalentsString = this.equivalentsString()
        const suffixForFollowingEquivalents = equivalentsString ? "," : ""
        this.textBlock = new CenteringTextElement(
            this.labelElement,
            this.backgroundColor,
        )
        this.textBlock.addText(
            this.labelForCurrentLanguage(),
            "",
            suffixForFollowingEquivalents,
        )
        this.textBlock.addEquivalents(equivalentsString)
        this.textBlock.addSubText(this.indicationString())
    }

    updateTextElement() {
        this.textBlock.updateAllTextElements()
    }

    /**
     * @param {boolean} autoEditing
     */
    enableEditing(autoEditing) {
        if (autoEditing === false) {
            return
        }
        this.raiseDoubleClickEdit(true)
    }

    /**
     * @param {boolean} forceIRISync
     */
    raiseDoubleClickEdit(forceIRISync) {
        d3.selectAll(".foreignelements").remove()
        if (
            this.labelElement === undefined ||
            this.type === "owl:disjointWith" ||
            this.type === "rdfs:subClassOf"
        ) {
            console.log("No Container found")
            return
        }
        if (this.foreignerObject !== undefined) {
            this.labelElement.selectAll(".foreignelements").remove()
        }
        this.backupFullIri = undefined
        this.graph.options.focuserModule.handle(undefined)
        this.graph.options.focuserModule.handle(this)
        this.editingTextElement = true
        this.ignoreLocalHoverEvents = true
        this.labelElement.selectAll("rect").classed("hoveredForEditing", true)
        this.frozen = true
        this.graph.killDelayedTimer()
        this.graph.ignoreOtherHoverEvents = false
        this.foreignerObject = this.labelElement
            .append("foreignObject")
            .attr("x", -0.5 * this.getTextWidth())
            .attr("y", -13)
            .attr("height", 25)
            .attr("class", "foreignelements")
            .on("dragstart", function () {
                return false
            }) // remove drag operations of text element)
            .attr("width", this.getTextWidth() - 2)
        // adding a Style to the fObject
        const editText = this.foreignerObject
            .append("xhtml:input")
            .attr("class", "nodeEditSpan")
            .attr("id", this.id)
            .attr("align", "center")
            .attr("contentEditable", "true")
            .on("dragstart", function () {
                return false
            }) // remove drag operations of text element)

        const bgColor = "#f00"
        const txtWidth = this.getTextWidth() - 2
        // @ts-ignore
        editText.style({
            // 'line-height': '30px',
            align: "center",
            color: "black",
            width: txtWidth + "px",
            "background-color": bgColor,
            "border-bottom": "2px solid black",
        })
        const txtNode = editText.node()
        txtNode.value = this.labelForCurrentLanguage()
        txtNode.focus()
        txtNode.select()
        if (d3.event.stopPropagation) {
            d3.event.stopPropagation()
        }
        if (d3.event.sourceEvent && d3.event.sourceEvent.stopPropagation) {
            d3.event.sourceEvent.stopPropagation()
        }
        // add some events this relate to this object
        editText.on("click", function () {
            if (d3.event.stopPropagation) {
                d3.event.stopPropagation()
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.stopPropagation) {
                d3.event.sourceEvent.stopPropagation()
            }
        })
        // // remove hover Events for now;
        editText.on("mouseout", function () {
            if (d3.event.stopPropagation) {
                d3.event.stopPropagation()
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.stopPropagation) {
                d3.event.sourceEvent.stopPropagation()
            }
        })

        const _this = this
        editText
            .on("mousedown", function () {
                if (d3.event.stopPropagation) {
                    d3.event.stopPropagation()
                }
                if (
                    d3.event.sourceEvent &&
                    d3.event.sourceEvent.stopPropagation
                ) {
                    d3.event.sourceEvent.stopPropagation()
                }
            })
            .on("keydown", function () {
                if (d3.event.keyCode === 13) {
                    this.blur() // REVIEW: Check how this should be called
                    _this.frozen = false // << releases the not after selection
                    _this.locked = false
                }
            })
            .on("keyup", function () {
                if (forceIRISync) {
                    const labelName = editText.node().value
                    const resourceName = labelName.replaceAll(" ", "_")
                    const syncedIRI = _this.baseIri + resourceName
                    _this.backupFullIri = syncedIRI

                    d3.select("#element_iriEditor").node().title = syncedIRI
                    d3.select("#element_iriEditor").node().value =
                        PrefixTools.getPrefixRepresentationForFullURI(syncedIRI)
                }
                d3.select("#element_labelEditor").node().value =
                    editText.node().value
            })
            // add a foreiner element to this thing;
            .on("blur", function () {
                _this.editingTextElement = false
                _this.ignoreLocalHoverEvents = false
                _this.labelElement
                    .selectAll("rect")
                    .classed("hoveredForEditing", false)
                const newLabel = editText.node().value
                _this.labelElement.selectAll(".foreignelements").remove()
                // this.setLabelForCurrentLanguage(classNameConvention(editText.node().value));
                _this.label = newLabel
                _this.backupLabel = newLabel
                _this.redrawLabelText()
                _this.updateHoverElements(true)
                _this.graph.showHoverElementsAfterAnimation(this, false)
                _this.graph.ignoreOtherHoverEvents = false

                _this.frozen = _this.graph.paused
                _this.locked = _this.graph.paused
                _this.domain.frozen = _this.graph.paused
                _this.domain.locked = _this.graph.paused
                _this.range.frozen = _this.graph.paused
                _this.range.locked = _this.graph.paused
                _this.graph.removeEditElements()
                if (_this.backupFullIri) {
                    // console.log("Checking if element is Identical ?");
                    const sanityCheckResult =
                        _this.graph.options.editSidebar.checkProperIriChange(
                            this,
                            _this.backupFullIri,
                        )
                    if (sanityCheckResult !== false) {
                        _this.graph.options.warningModule.showWarning(
                            "Already seen this property",
                            "Input IRI: " +
                                _this.backupFullIri +
                                " for element: " +
                                _this.labelForCurrentLanguage() +
                                " already been set",
                            "Continuing with duplicate property!",
                            1,
                            this,
                        )
                    }
                    _this.iri = _this.backupFullIri
                }
                _this.graph.options.focuserModule.handle(undefined)
                _this.graph.options.focuserModule.handle(this)
                _this.graph.updatePropertyDraggerElements(this)
            })
    }

    /**
     * @param {boolean} enable
     */
    updateHoverElements(enable) {
        if (!this.graph.ignoreOtherHoverEvents) {
            let inversed = false
            if (this.inverse) {
                inversed = true
            }
            if (enable) {
                this.graph.activateHoverElementsForProperties(
                    enable,
                    this,
                    inversed,
                )
            }
        }
    }

    /**
     * @param {any} other
     */
    copyInformation(other) {
        this.label = other.label
        this.iri = other.iri
        this.baseIri = other.baseIri
        if (
            other.type === "owl:ObjectProperty" ||
            other.type === "owl:DatatypeProperty"
        ) {
            this.backupLabel = other.label
        }
        if (other.backupLabel !== undefined) {
            this.backupLabel = other.backupLabel
        }
    }

    actualRadius() {
        return this.smallestRadius
    }
}
