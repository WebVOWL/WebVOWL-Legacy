import BaseElement from '../BaseElement';

export class BaseNode extends BaseElement {
    constructor(graph) {
        super(graph)

        // Basic attributes
        this.complement     // Array<String> | undefined
        this.disjointUnion  // Array<String> | undefined
        this.disjointWith   // Array<String> | undefined
        this.individuals = [] // Array<BaseNode>
        this.intersection   // Array<String> | undefined
        this.union          // Array<String> | undefined
        this.links          // Array<Link>
        this.rendertype = "round"

        // Additional attributes
        this.foreignerObject    // HTMLElement | undefined // foreigner object for editing
        this.ignoreLocalHoverEvents = false
        this.backupFullIri      // String | undefined

        // Element containers
        this.nodeElement        // HTMLElement | undefined

        // Editing attributes
        this.assignedProperties = []
        this.editingTextElement = false
    }

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

    addProperty(property) {
        if (this.assignedProperties.indexOf(property) === -1) {
            this.assignedProperties.push(property);
        }
    }

    removePropertyElement(property) {
        const i = this.assignedProperties.indexOf(property);
        if (i !== -1) {
            this.assignedProperties.splice(i, 1);
        }
    }

    copyInformation(other) {
        // console.log(other.labelForCurrentLanguage());
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

    enableEditing(autoEditing) {
        if (autoEditing === false) {
            return;
        }
        this.raiseDoubleClickEdit(true);
    }

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
        this.foreignerObject = this.nodeElement.append("foreignObject")
            .attr("x", -0.5 * (this.textWidth() - 2))
            .attr("y", -12)
            .attr("height", 30)
            .attr("class", "foreignelements")
            .on("dragstart", function () {// remove drag operations of text element)
                return false;
            })
            .attr("width", this.textWidth() - 2);

        var editText = this.foreignerObject.append("xhtml:input")
            .attr("class", "nodeEditSpan")
            .attr("id", this.id)
            .attr("align", "center")
            .attr("contentEditable", "true")
            .on("dragstart", function () {// remove drag operations of text element)
                return false;
            });

        var bgColor = '#f00';
        var txtWidth = this.textWidth() - 2;
        editText.style({
            'align': 'center',
            'color': 'black',
            'width': txtWidth + "px",
            'height': '15px',
            'background-color': bgColor,
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
                // console.log("Calling blur on Node!");
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
     * @returns {String} the css class of this node
     */
    cssClassOfNode() {
        return "node" + this.id;
    }

    /**
     * Returns css classes generated from the data of this object.
     * @returns {Array}
     */
    collectCssClasses() {
        var cssClasses = [];
        if (typeof this.styleClass === "String") {
            cssClasses.push(this.styleClass);
        }
        cssClasses = cssClasses.concat(this.visualAttributes);
        return cssClasses;
    }

    // Reused functions TODO refactor
    addMouseListeners() {
        // Empty node
        if (!this.nodeElement) {
            console.warn(this);
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
            animRuns = haloGr.attr("animationRunning");
            if (typeof animRuns !== "boolean") {
                // parse this to a boolean value
                animRuns = (animRuns === 'true');
            }
            if (animRuns === false) {
                haloEls.classed("searchResultA", false);
                haloEls.classed("searchResultB", true);
            }
        }
        return animRuns;
    }

    foreground() {
        var selectedNode = this.nodeElement.node(), nodeContainer = selectedNode.parentNode;
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

        var selectedNode = this.nodeElement.node(), nodeContainer = selectedNode.parentNode;
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