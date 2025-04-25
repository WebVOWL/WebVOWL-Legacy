import Graph from "../../graph"
import PrefixTools from "../../util/prefixTools"
import BaseElement from "../BaseElement"
import ArrowLink from "../links/ArrowLink"
import BoxArrowLink from "../links/BoxArrowLink"
import PlainLink from "../links/PlainLink"
import BaseProperty from "../properties/BaseProperty"

export default class BaseNode extends BaseElement {
    /**
     * @param {Graph} graph
     */
    constructor(graph) {
        super(graph)
        if (this.constructor === BaseNode) {
            throw new Error("Abstract classes can't be instantiated")
        }

        // Basic attributes
        /**
         * @type {string[] | undefined}
         */
        this.complement = undefined
        /**
         * @type {string[] | undefined}
         */
        this.disjointUnion = undefined
        /**
         * @type {BaseNode[] | undefined}
         */
        this.disjointWith = undefined
        /**
         * @type {BaseNode[] | undefined}
         */
        this.individuals = undefined
        /**
         * @type {string[] | undefined}
         */
        this.intersection = undefined
        /**
         * @type {string[] | undefined}
         */
        this.union = undefined
        /**
         * @type {(PlainLink | BoxArrowLink | ArrowLink)[]}
         */
        this.links = []
        /**
         * @type {string}
         */
        this.renderType = "round"

        // Element containers
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.nodeElement = undefined

        // Editing attributes
        /**
         * @type {BaseProperty[] | undefined}
         */
        this.assignedProperties = undefined
        /**
         * @type {boolean}
         */
        this.editingTextElement = false
    }

    /**
     * @param {boolean} enable
     */
    setHoverHighlighting(enable) {
        throw new Error("Method setHoverHighlighting() must be implemented")
    }

    /**
     * @param {BaseProperty} property
     */
    isPropertyAssignedToThisElement(property) {
        // this goes via IRIS
        // console.log("Element IRI :" + property.iri);
        if (property.type === "rdfs:subClassOf")
            for (const property of this.assignedProperties) {
                if (property.iri === property.iri) {
                    return true
                }
                if (
                    property.type === "rdfs:subClassOf" &&
                    property.type === "rdfs:subClassOf"
                ) {
                    return true
                }
                if (
                    property.type === "owl:disjointWith" &&
                    property.type === "owl:disjointWith"
                ) {
                    return true
                }
            }
        return false
    }

    // NOTE: Disabled to save memory while this method is not used
    // existingPropertyIRI(url) {
    //     // this goes via IRIS
    //     for (const property of this.assignedProperties) {
    //         if (property.iri === url) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    /**
     * @param {BaseProperty} property
     */
    addProperty(property) {
        if (this.assignedProperties instanceof Array) {
            if (this.assignedProperties.indexOf(property) === -1) {
                this.assignedProperties.push(property)
            }
        } else {
            this.assignedProperties = [property]
        }
    }

    /**
     * @param {BaseProperty} property
     */
    removePropertyElement(property) {
        if (this.assignedProperties) {
            const i = this.assignedProperties.indexOf(property)
            if (i !== -1) {
                this.assignedProperties.splice(i, 1)
            }
        }
    }

    /**
     * @param {BaseNode} other
     */
    copyInformation(other) {
        if (other.type !== "owl:Thing") {
            this.label = other.label
        }
        this.complement = other.complement
        this.iri = other.iri
        this.assignedProperties = other.assignedProperties
        this.baseIri = other.baseIri
        if (other.type === "owl:Class") {
            this.backupLabel = other.label
        }
        if (other.backupLabel !== undefined) {
            this.backupLabel = other.backupLabel
        }
    }

    /**
     * @param {boolean} autoEditing
     */
    enableEditing(autoEditing) {
        if (!autoEditing) {
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
            this.nodeElement === undefined ||
            this.type === "owl:Thing" ||
            this.type === "rdfs:Literal"
        ) {
            console.log("No Container found")
            return
        }
        if (this.foreignerObject !== undefined) {
            this.nodeElement.selectAll(".foreignelements").remove()
        }

        this.backupFullIri = undefined
        this.graph.options.focuserModule.handle(undefined)
        this.graph.options.focuserModule.handle(this)
        // add again the editing elements to this one
        if (this.graph.touchDevice) {
            this.graph.activateHoverElements(true, this, true)
        }
        this.editingTextElement = true
        this.ignoreLocalHoverEvents = true
        this.nodeElement.selectAll("circle").classed("hoveredForEditing", true)
        this.graph.killDelayedTimer()
        this.graph.ignoreOtherHoverEvents = false
        const textWidth = this.getTextWidth()
        this.foreignerObject = this.nodeElement
            .append("foreignObject")
            .attr("x", -0.5 * (textWidth - 2))
            .attr("y", -12)
            .attr("height", 30)
            .attr("class", "foreignelements")
            // remove drag operations of text element)
            .on("dragstart", function () {
                return false
            })
            .attr("width", textWidth - 2)

        const editText = this.foreignerObject
            .append("xhtml:input")
            .attr("class", "nodeEditSpan")
            .attr("id", this.id)
            .attr("align", "center")
            .attr("contentEditable", "true")
            // remove drag operations of text element)
            .on("dragstart", function () {
                return false
            })
        // @ts-ignore
        editText.style({
            align: "center",
            color: "black",
            width: textWidth - 2 + "px",
            height: "15px",
            "background-color": "#f00",
            "border-bottom": "2px solid black",
        })
        const txtNode = editText.node()
        txtNode.value = this.labelForCurrentLanguage()
        txtNode.focus()
        txtNode.select()
        this.frozen = true // << releases the not after selection
        this.locked = true

        const _this = this
        d3.event.stopPropagation()
        // ignoreNodeHoverEvent=true;
        // add some events this relate to this object
        editText.on("click", function () {
            d3.event.stopPropagation()
        })
        // remove hover Events for now;
        editText.on("mouseout", function () {
            d3.event.stopPropagation()
        })
        editText
            .on("mousedown", function () {
                d3.event.stopPropagation()
            })
            .on("keydown", function () {
                d3.event.stopPropagation()
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
                        PrefixTools.getPrefixRepresentationForFullURI(
                            syncedIRI,
                            _this.graph,
                        )
                }
                d3.select("#element_labelEditor").node().value =
                    editText.node().value
            })
            .on("blur", function () {
                // add a foreiner element to this thing;
                _this.editingTextElement = false
                _this.ignoreLocalHoverEvents = false
                _this.nodeElement
                    .selectAll("circle")
                    .classed("hoveredForEditing", false)
                const newLabel = editText.node().value
                _this.nodeElement.selectAll(".foreignelements").remove()
                // this.setLabelForCurrentLanguage(classNameConvention(editText.node().value));
                _this.label = newLabel
                _this.backupLabel = newLabel
                _this.redrawLabelText()
                _this.frozen = _this.graph.paused
                _this.locked = _this.graph.paused
                _this.graph.ignoreOtherHoverEvents = false
                if (_this.backupFullIri) {
                    const sanityCheckResult =
                        _this.graph.checkIfIriClassAlreadyExist(
                            _this.backupFullIri,
                        )
                    if (!sanityCheckResult) {
                        _this.iri = _this.backupFullIri
                    } else {
                        // throw warning
                        _this.graph.options.warningModule.showWarning(
                            "Already seen this class",
                            "Input IRI: " +
                                _this.backupFullIri +
                                " for element: " +
                                _this.labelForCurrentLanguage() +
                                " already been set",
                            "Restoring previous IRI for Element : " + _this.iri,
                            2,
                            _this,
                        )
                    }
                }
                if (!_this.graph.isADraggerActive()) {
                    _this.graph.options.focuserModule.handle(undefined)
                    _this.graph.options.focuserModule.handle(_this)
                }
            })
    }

    /**
     * @returns {string} the css class of this node
     */
    cssClassOfNode() {
        return "node" + this.id
    }

    /**
     * Returns css classes generated from the data of this object.
     * @returns {string[]}
     */
    collectCssClasses() {
        let cssClasses = []
        if (typeof this.styleClass === "string") {
            cssClasses.push(this.styleClass)
        }
        if (this.visualAttributes) {
            cssClasses = cssClasses.concat(this.visualAttributes)
        }
        return cssClasses
    }

    // Reused functions TODO refactor
    addMouseListeners() {
        // Empty node
        if (!this.nodeElement) {
            console.warn(
                `Cannot add mouse listeners to empty nodeElement of ${this}`,
            )
            return
        }
        this.nodeElement
            .selectAll("*")
            .on("mouseover", () => {
                this.#onMouseOver()
            })
            .on("mouseout", () => {
                this.#onMouseOut()
            })
    }

    animationProcess() {
        let animRuns = false
        if (this.haloGroupElement) {
            const haloGr = this.haloGroupElement
            const haloEls = haloGr.selectAll(".searchResultA")
            const animRunsString = haloGr.attr("animationRunning")
            if (typeof animRunsString !== "boolean") {
                // parse this to a boolean value
                animRuns = animRunsString === "true"
            }
            if (animRuns === false) {
                haloEls.classed("searchResultA", false)
                haloEls.classed("searchResultB", true)
            }
        }
        return animRuns
    }

    foreground() {
        const selectedNode = this.nodeElement.node()
        const nodeContainer = selectedNode.parentNode
        // check if the halo is present and an animation is running
        if (!this.animationProcess()) {
            // Append hovered element as last child to the container list.
            nodeContainer.appendChild(selectedNode)
        }
    }

    #onMouseOver() {
        if (this.mouseEntered || this.ignoreLocalHoverEvents) {
            return
        }

        const selectedNode = this.nodeElement.node()
        const nodeContainer = selectedNode.parentNode
        // Append hovered element as last child to the container list.
        if (this.animationProcess() === false) {
            nodeContainer.appendChild(selectedNode)
        }
        if (!this.graph.touchDevice) {
            this.setHoverHighlighting(true)
            this.mouseEntered = true
            if (this.graph.editorMode && !this.graph.ignoreOtherHoverEvents) {
                this.graph.activateHoverElements(true, this, false)
            }
        } else {
            if (this.graph.editorMode && !this.graph.ignoreOtherHoverEvents) {
                this.graph.activateHoverElements(true, this, true)
            }
        }
    }

    #onMouseOut() {
        this.setHoverHighlighting(false)
        this.mouseEntered = false
        if (this.graph.editorMode && !this.graph.ignoreOtherHoverEvents) {
            this.graph.activateHoverElements(false, undefined, false)
        }
    }
}
