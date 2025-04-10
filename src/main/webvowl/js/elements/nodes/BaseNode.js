// @ts-nocheck
import { BaseElement } from "../BaseElement"
import { PlainLink } from "../links/PlainLink"
import { BaseProperty } from "../properties/BaseProperty"

export class BaseNode extends BaseElement {
    /**
     * @param {any} graph
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
         * @type {string[] | undefined}
         */
        this.disjointWith = undefined
        /**
         * @type {BaseNode[]}
         */
        this.individuals = []
        /**
         * @type {string[] | undefined}
         */
        this.intersection = undefined
        /**
         * @type {string[] | undefined}
         */
        this.union = undefined
        /**
         * @type {PlainLink[]}
         */
        this.links = []
        /**
         * @type {string}
         */
        this.rendertype = "round"


        // Element containers
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.nodeElement = undefined


        // Editing attributes
        /**
         * @type {BaseProperty[]}
         */
        this.assignedProperties = []
        /**
         * @type {boolean}
         */
        this.editingTextElement = false
    }

    /**
     * @returns {number}
     */
    textWidth() {
        throw new Error("Method textWidth() must be implemented")
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
                    return true;
                }
                if (property.type === "rdfs:subClassOf" && property.type === "rdfs:subClassOf") {
                    return true;
                }
                if (property.type === "owl:disjointWith" && property.type === "owl:disjointWith") {
                    return true;
                }
            }
        return false;
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
        if (this.assignedProperties.indexOf(property) === -1) {
            this.assignedProperties.push(property);
        }
    }

    /**
     * @param {BaseProperty} property
     */
    removePropertyElement(property) {
        const i = this.assignedProperties.indexOf(property);
        if (i !== -1) {
            this.assignedProperties.splice(i, 1);
        }
    }

    /**
     * @param {BaseNode} other
     */
    copyInformation(other) {
        if (other.type !== "owl:Thing") {
            this.label = other.label;
        }
        this.complement = other.complement;
        this.iri = other.iri;
        this.assignedProperties = other.assignedProperties;
        this.baseIri = other.baseIri;
        if (other.type === "owl:Class") {
            this.backupLabel = other.label;
        }
        if (other.backupLabel !== undefined) {
            this.backupLabel = other.backupLabel;
        }
    }

    /**
     * @param {boolean} autoEditing
     */
    enableEditing(autoEditing) {
        if (autoEditing === false) {
            return;
        }
        this.raiseDoubleClickEdit(true);
    }

    /**
     * @param {boolean} forceIRISync
     */
    raiseDoubleClickEdit(forceIRISync) {
        d3.selectAll(".foreignelements").remove();
        if (this.nodeElement === undefined || this.type === "owl:Thing" || this.type === "rdfs:Literal") {
            console.log("No Container found");
            return;
        }
        if (this.foreignerObject !== undefined) {
            this.nodeElement.selectAll(".foreignelements").remove();
        }

        this.backupFullIri = undefined;
        this.graph.options().focuserModule().handle(undefined);
        this.graph.options().focuserModule().handle(this);
        // add again the editing elements to this one
        if (this.graph.isTouchDevice() === true) {
            this.graph.activateHoverElements(true, this, true);
        }
        this.editingTextElement = true;
        this.ignoreLocalHoverEvents = true;
        this.nodeElement.selectAll("circle").classed("hoveredForEditing", true);
        this.graph.killDelayedTimer();
        this.graph.ignoreOtherHoverEvents(false);
        const textWidth = this.textWidth()
        this.foreignerObject = this.nodeElement.append("foreignObject")
            .attr("x", -0.5 * (textWidth - 2))
            .attr("y", -12)
            .attr("height", 30)
            .attr("class", "foreignelements")
            // remove drag operations of text element)
            .on("dragstart", function () {
                return false;
            })
            .attr("width", textWidth - 2);

        var editText = this.foreignerObject.append("xhtml:input")
            .attr("class", "nodeEditSpan")
            .attr("id", this.id)
            .attr("align", "center")
            .attr("contentEditable", "true")
            // remove drag operations of text element)
            .on("dragstart", function () {
                return false;
            });
        editText.style({
            'align': 'center',
            'color': 'black',
            'width': (textWidth - 2) + "px",
            'height': '15px',
            'background-color': '#f00',
            'border-bottom': '2px solid black'
        });
        var txtNode = editText.node();
        txtNode.value = this.labelForCurrentLanguage();
        txtNode.focus();
        txtNode.select();
        this.frozen = true; // << releases the not after selection
        this.locked = true;

        d3.event.stopPropagation();
        // ignoreNodeHoverEvent=true;
        // add some events this relate to this object
        editText.on("click", function () {
            d3.event.stopPropagation();
        });
        // remove hover Events for now;
        editText.on("mouseout", function () {
            d3.event.stopPropagation();
        });
        editText.on("mousedown", function () {
            d3.event.stopPropagation();
        })
            .on("keydown", function () {
                d3.event.stopPropagation();
                if (d3.event.keyCode === 13) {
                    this.blur();
                    this.frozen = false; // << releases the not after selection
                    this.locked = false;
                }
            })
            .on("keyup", function () {
                if (forceIRISync) {
                    var labelName = editText.node().value;
                    var resourceName = labelName.replaceAll(" ", "_");
                    var syncedIRI = this.baseIri + resourceName;
                    this.backupFullIri = syncedIRI;

                    d3.select("#element_iriEditor").node().title = syncedIRI;
                    d3.select("#element_iriEditor").node().value = this.graph.options().prefixModule().getPrefixRepresentationForFullURI(syncedIRI);
                }
                d3.select("#element_labelEditor").node().value = editText.node().value;
            })
            .on("blur", function () { // add a foreiner element to this thing;
                this.editingTextElement = false;
                this.ignoreLocalHoverEvents = false;
                this.nodeElement.selectAll("circle").classed("hoveredForEditing", false);
                var newLabel = editText.node().value;
                this.nodeElement.selectAll(".foreignelements").remove();
                // this.setLabelForCurrentLanguage(classNameConvention(editText.node().value));
                this.label = newLabel;
                this.backupLabel = newLabel;
                this.redrawLabelText();
                this.frozen = this.graph.paused();
                this.locked = this.graph.paused();
                this.graph.ignoreOtherHoverEvents(false);
                if (this.backupFullIri) {
                    const sanityCheckResult = this.graph.checkIfIriClassAlreadyExist(this.backupFullIri);
                    if (sanityCheckResult === false) {
                        this.iri = this.backupFullIri;
                    } else {
                        // throw warning
                        this.graph.options().warningModule().showWarning("Already seen this class",
                            "Input IRI: " + this.backupFullIri + " for element: " + this.labelForCurrentLanguage() + " already been set",
                            "Restoring previous IRI for Element : " + this.iri, 2, false, sanityCheckResult);
                    }
                }
                if (this.graph.isADraggerActive() === false) {
                    this.graph.options().focuserModule().handle(undefined);
                    this.graph.options().focuserModule().handle(this);
                }
            });
    }

    /**
     * @returns {string} the css class of this node
     */
    cssClassOfNode() {
        return "node" + this.id;
    }

    /**
     * Returns css classes generated from the data of this object.
     * @returns {string[]}
     */
    collectCssClasses() {
        var cssClasses = [];
        if (typeof this.styleClass === "string") {
            cssClasses.push(this.styleClass);
        }
        cssClasses = cssClasses.concat(this.visualAttributes);
        return cssClasses;
    }

    // Reused functions TODO refactor
    addMouseListeners() {
        // Empty node
        if (!this.nodeElement) {
            console.warn(`Cannot add mouse listeners to empty nodeElement of ${this}`);
            return;
        }
        this.nodeElement.selectAll("*")
            .on("mouseover", this.#onMouseOver)
            .on("mouseout", this.#onMouseOut);
    }

    animationProcess() {
        var animRuns = false;
        if (this.haloGroupElement) {
            var haloGr = this.haloGroupElement;
            var haloEls = haloGr.selectAll(".searchResultA");
            const animRunsString = haloGr.attr("animationRunning");
            if (typeof animRunsString !== "boolean") {
                // parse this to a boolean value
                animRuns = (animRunsString === 'true');
            }
            if (animRuns === false) {
                haloEls.classed("searchResultA", false);
                haloEls.classed("searchResultB", true);
            }
        }
        return animRuns;
    }

    foreground() {
        const selectedNode = this.nodeElement.node();
        const nodeContainer = selectedNode.parentNode;
        // check if the halo is present and an animation is running
        if (this.animationProcess() === false) {
            // Append hovered element as last child to the container list.
            nodeContainer.appendChild(selectedNode);
        }
    }

    #onMouseOver() {
        if (this.mouseEntered || this.ignoreLocalHoverEvents === true) {
            return;
        }

        const selectedNode = this.nodeElement.node();
        const nodeContainer = selectedNode.parentNode;
        // Append hovered element as last child to the container list.
        if (this.animationProcess() === false) {
            nodeContainer.appendChild(selectedNode);
        }
        if (this.graph.isTouchDevice() === false) {
            this.setHoverHighlighting(true);
            this.mouseEntered = true;
            if (this.graph.editorMode() === true && this.graph.ignoreOtherHoverEvents() === false) {
                this.graph.activateHoverElements(true, this);
            }
        } else {
            if (this.graph.editorMode() === true && this.graph.ignoreOtherHoverEvents() === false) {
                this.graph.activateHoverElements(true, this, true);
            }
        }
    }

    #onMouseOut() {
        this.setHoverHighlighting(false);
        this.mouseEntered = false;
        if (this.graph.editorMode() === true && this.graph.ignoreOtherHoverEvents() === false) {
            this.graph.activateHoverElements(false);
        }
    }
}