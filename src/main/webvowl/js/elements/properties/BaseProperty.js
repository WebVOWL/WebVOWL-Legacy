import CenteringTextElement from '../../util/CenteringTextElement';
import { BaseElement } from '../BaseElement';
import { DrawTools } from '../drawTools';
import { RectangularElementToolsMixin } from '../rectangularElementTools';

export class BaseProperty extends RectangularElementToolsMixin(BaseElement) {
    constructor(graph) {
        super(graph)

        // Basic attributes
        this.domain                 // Node
        this.range                  // Node
        this.inverse                // String | Number | undefined | null
        this.link                   // Link
        this.cardinality            // String | undefined
        this.minCardinality         // String | undefined
        this.maxCardinality         // String | undefined
        this.subproperties          // Array | undefined
        this.superproperties        // Array | undefined

        // Style attributes
        this.linkType = "normal"
        this.markerType = "filled"
        this.labelVisible = true

        // Element containers
        this.cardinalityElement     // HTMLElement | undefined
        this.labelElement           // HTMLElement | undefined
        this.linkGroup              // HTMLElement | undefined
        this.markerElement          // HTMLElement | undefined

        // Other
        this.ignoreLocalHoverEvents // Boolean
        this.foreignerObject        // HTMLElement | undefined
        this.pinGroupElement        // HTMLElement | undefined
        this.haloGroupElement       // HTMLElement | undefined
        this.defaultWidth = 80
        this.height = 28 // labelHeight
        this.width = 80  // labelWidth && myWidth
        this.smallestRadius = this.height / 2
        this.shapeElement           // HTMLElement | undefined
        this.textBlock              // HTMLElement | undefined
        this.parent_labelObject     // HTMLElement | undefined
        this.backupFullIri          // String | undefined
        this.redundantProperties    // Array | undefined
    }

    // NOTE: Disabled to save memory while this method is not used
    // existingPropertyIRI(url) {
    //     return graph.options().editSidebar().checkForExistingURL(url);
    // }

    get labelObject() {
        return this.parent_labelObject;
    }

    /**
     * @param {Array|any} args
     */
    set labelObject(args) {
        let lo = args,
            once;
        if (args instanceof Array) {
            [lo, once] = args;
        }

        this.parent_labelObject = lo;
        if (this.inverse && once !== true) {
            this.inverse.labelObject([lo, true]);
        }
    }

    hide(val) {
        this.labelElement.classed("hidden", val);
        this.linkGroup.classed("hidden", val);
        if (this.cardinalityElement) {
            this.cardinalityElement.classed("hidden", val);
        }
    }

    // NOTE: Disabled to save memory while this method is not used
    // linkHasMarker() {
    //     return this.linkType !== "dashed";
    // }

    markerId() {
        return "marker" + this.id;
    }

    toggleFocus() {
        this.focused = !this.focused;
        this.labelElement.select("rect").classed("focused", this.focused);
        graph.resetSearchHighlight();
        graph.options().searchMenu().clearText();
    }

    redrawElement() {
        this.shapeElement.remove();
        this.textBlock.remove();

        this.drawLabel(this.labelElement);
        this.animateDynamicLabelWidth(graph.options().dynamicLabelWidth());
        //this. shapeElement=this.addRect(this.labelElement);
        //
        // var equivalentsString = this.equivalentsString();
        // var suffixForFollowingEquivalents = equivalentsString ? "," : "";
        //
        // this.textBlock = new CenteringTextElement(labelContainer, this.backgroundColor);
        // this.textBlock.addText(this.labelForCurrentLanguage(), "", suffixForFollowingEquivalents);
        // this.textBlock.addEquivalents(equivalentsString);
        // this.textBlock.addSubText(this.indicationString());
    }

    // Reused functions TODO refactor
    draw(labelGroup) {
        function attachLabel(property) {
            var labelContainer = labelGroup.append("g")
                .datum(property)
                .classed("label", true)
                .attr("id", property.id);

            property.drawLabel(labelContainer);
            return labelContainer;
        }

        if (!this.labelVisible) {
            return undefined;
        }
        if (graph.options().dynamicLabelWidth() === true) {
            this.width = Math.min(this.getMyWidth(), graph.options().maxLabelWidth());
        } else {
            this.width = this.defaultWidth;
        }

        this.labelElement = attachLabel(this);
        // Draw an inverse label and reposition both labels if necessary
        if (this.inverse) {
            const yTransformation = (this.height / 2) + 1 /* additional space */;
            this.inverse.labelElement = attachLabel(this.inverse);

            this.labelElement.attr("transform", "translate(" + 0 + ",-" + yTransformation + ")");
            this.inverse
                .labelElement
                .attr("transform", "translate(" + 0 + "," + yTransformation + ")");
        }

        if (this.pinned) {
            this.drawPin();
        } else if (this.inverse && this.inverse.pinned) {
            this.inverse.drawPin();
        }

        if (this.halo) {
            this.drawHalo(false);
        }
        return this.labelElement;
    }

    addRect(labelContainer) {
        var rect = labelContainer.append("rect")
            .classed(this.styleClass, true)
            .classed("property", true)
            .attr("x", -this.labelWidth / 2)
            .attr("y", -this.height / 2)
            .attr("width", this.labelWidth)
            .attr("height", this.height)
            .on("mouseover", this.#onMouseOver)
            .on("mouseout", this.#onMouseOut);

        rect.append("title")
            .text(this.labelForCurrentLanguage());

        if (this.visualAttributes) {
            rect.classed(this.visualAttributes, true);
        }

        var bgColor = this.backgroundColor;

        if (this.attributes.indexOf("deprecated") > -1) {
            bgColor = undefined;
            rect.classed("deprecatedproperty", true);
        } else {
            rect.classed("deprecatedproperty", false);
        }
        rect.style("fill", bgColor);

        return rect;
    }

    drawLabel(labelContainer) {
        this.shapeElement = this.addRect(labelContainer);
        var equivalentsString = this.equivalentsString();
        var suffixForFollowingEquivalents = equivalentsString ? "," : "";

        var bgColor = this.backgroundColor;
        if (this.attributes.indexOf("deprecated") > -1) {
            bgColor = undefined;
        }
        this.textBlock = new CenteringTextElement(labelContainer, bgColor);
        this.textBlock.addText(this.labelForCurrentLanguage(), "", suffixForFollowingEquivalents);
        this.textBlock.addEquivalents(equivalentsString);
        this.textBlock.addSubText(this.indicationString());
    }

    equivalentsString() {
        var equivalentProperties = this.equivalents;
        if (!equivalentProperties) {
            return;
        }

        return equivalentProperties
            .map(function (property) {
                if (property === undefined || typeof (property) === "string") { // @WORKAROUND
                    return "ERROR";
                }
                return property.labelForCurrentLanguage();
            })
            .join(", ");
    }

    /**
     * @param {*} container
     * @returns {boolean} True if drawing successful
     */
    drawCardinality(container) {
        const cardinalityText = this.generateCardinalityText();
        if (cardinalityText) {
            this.cardinalityElement = container;
            if (cardinalityText.indexOf("A") === 0 && cardinalityText.length === 1) {
                // replacing text elements to svg elements;
                container.classed("cardinality", true)
                    .attr("text-anchor", "middle")
                    .append("path")
                    .classed("cardinality", true)
                    .attr("d", "m -8.8832678,-11.303355 -7.97e-4,0 0.717374,1.833297 8.22987151,21.371761 8.66826659,-21.2123526 0.797082,-1.9927054 0.02471,0 -0.8218553,1.9927054 -2.2517565,5.4201577 -12.4444429,8e-6 -2.2019394,-5.5795821 z")
                    .style("fill", "none")
                    .attr("transform", "matrix(0.5,0,0,0.5,0.5,0.5)");
                return true;
            } else if (cardinalityText.indexOf("E") === 0 && cardinalityText.length === 1) {
                container.classed("cardinality", true)
                    .attr("text-anchor", "middle")
                    .append("path")
                    .classed("cardinality", true)
                    .attr("d", "m -5.5788451,-8.0958763 10.8749368,0 0,8.34681523 -9.5707468,0.040132 9.5707468,-0.040132 0,8.42707237 -10.9150654,0")
                    .style("fill", "none")
                    .attr("transform", "matrix(0.5,0,0,0.5,0.5,0.5)");
                return true;
            }
            else {
                container.append("text")
                    .classed("cardinality", true)
                    .attr("text-anchor", "middle")
                    .attr("dy", "0.5ex")
                    .text(cardinalityText);
                return true;
            }
        } else {
            return false;
        }
    }

    generateCardinalityText() {
        if (this.cardinality) {
            return this.cardinality;
        } else if (this.minCardinality || this.maxCardinality) {
            var minBoundary = this.minCardinality || "0";
            var maxBoundary = this.maxCardinality || "*";
            return minBoundary + ".." + maxBoundary;
        }
    }

    setHighlighting(enable) {
        if (this.labelElement && this.labelElement) {
            this.labelElement.select("rect").classed("hovered", enable);
        }
        this.linkGroup.selectAll("path, text").classed("hovered", enable);
        if (this.markerElement) {
            this.markerElement.select("path").classed("hovered", enable);
            if (this.cardinalityElement) {
                this.cardinalityElement.selectAll("path").classed("hovered-MathSymbol", enable);
                this.cardinalityElement.classed("hovered", enable);
            }
        }
        var subAndSuperProperties = this.#getSubAndSuperProperties();
        subAndSuperProperties.forEach(function (property) {
            if (property.labelElement && property.labelElement) {
                property.labelElement.select("rect")
                    .classed("indirect-highlighting", enable);
            }
        });

        var inversed = false;
        if (graph.ignoreOtherHoverEvents() === false) {
            if (this.inverse) {
                inversed = true;
            }
            if (graph.isTouchDevice() === false) {
                graph.activateHoverElementsForProperties(enable, this, inversed);
            }
            else {
                this.labelElement.select("rect").classed("hovered", false);
                this.linkGroup.selectAll("path, text").classed("hovered", false);
                if (this.markerElement) {
                    this.markerElement.select("path").classed("hovered", false);
                    if (this.cardinalityElement) {
                        this.cardinalityElement.classed("hovered", false);
                    }
                }
                graph.activateHoverElementsForProperties(enable, this, inversed, true);
            }
        }
    }

    /**
     * Combines the sub- and superproperties into a single array, because
     * they're often used equivalently.
     * @returns {Array}
     */
    #getSubAndSuperProperties() {
        var properties = [];

        if (this.subproperties) {
            properties = properties.concat(this.subproperties);
        }
        if (this.superproperties) {
            properties = properties.concat(this.superproperties);
        }
        return properties;
    }

    /**
     * Foregrounds the property, its inverse and the link.
     */
    foreground() {
        // check for additional objects this we can highlight
        if (!this.labelElement)
            return;
        if (this.labelElement.node().parentNode === null) {
            return;
        }
        var selectedLabelGroup = this.labelElement.node().parentNode,
            labelContainer = selectedLabelGroup.parentNode,
            selectedLinkGroup = this.linkGroup.node(),
            linkContainer = this.linkGroup.node().parentNode;
        if (this.animationProcess() === false) {
            labelContainer.appendChild(selectedLabelGroup);
        }
        linkContainer.appendChild(selectedLinkGroup);
    }

    /**
     * Foregrounds the sub- and superproperties of this property.
     * This is separated from the foreground-function to prevent endless loops.
     */
    #foregroundSubAndSuperProperties() {
        var subAndSuperProperties = this.getSubAndSuperProperties();
        subAndSuperProperties.forEach(function (property) {
            if (property.foreground) property.foreground();
        });
    }

    #onMouseOver() {
        if (this.mouseEntered || this.ignoreLocalHoverEvents === true) {
            return;
        }
        this.mouseEntered = true;
        this.setHighlighting(true);
        this.foreground();
        this.#foregroundSubAndSuperProperties();
    }

    #onMouseOut() {
        this.mouseEntered = false;
        this.setHighlighting(false);
    }

    drawPin() {
        this.pinned = true;
        if (graph.options().dynamicLabelWidth() === true) {
            this.width = this.getMyWidth();
        } else {
            this.width = this.defaultWidth;
        }
        if (this.inverse) {
            // check which element is rendered on top and add a pin to it
            var tr_that = this.labelElement.attr("transform");
            var tr_inv = this.inverse.labelElement.attr("transform");
            var thatY = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(tr_that)[2];
            var invY = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(tr_inv)[2];

            if (thatY < invY)
                this.pinGroupElement = DrawTools.drawPin(this.labelElement, -0.5 * this.width + 10, -25, this.removePin, graph.options().showDraggerObject, graph.options().useAccuracyHelper());
            else
                this.pinGroupElement = DrawTools.drawPin(this.inverse.labelElement, -0.5 * this.inverse.labelWidth + 10, -25, this.removePin, graph.options().showDraggerObject, graph.options().useAccuracyHelper());
        }
        else {
            this.pinGroupElement = DrawTools.drawPin(this.labelElement, -0.5 * this.width + 10, -25, this.removePin, graph.options().showDraggerObject, graph.options().useAccuracyHelper());
        }
    }

    /**
     * Removes the pin and refreshs the graph to update the force layout.
     */
    removePin() {
        this.pinned = false;
        if (this.pinGroupElement) {
            this.pinGroupElement.remove();
        }
        graph.updateStyle();
    }

    removeHalo() {
        this.halo = false;
        if (this.haloGroupElement) {
            this.haloGroupElement.remove();
            this.haloGroupElement = null;
        }
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

    drawHalo(pulseAnimation) {
        this.halo = true;
        var offset = 0;
        if (this.labelElement && this.labelElement.node()) {
            var labelNode = this.labelElement.node();
            var labelContainer = labelNode.parentNode;
            // do this only if animation is not running
            if (this.animationProcess() === false && labelContainer) {
                labelContainer.appendChild(labelNode);
            }
        }
        this.haloGroupElement = DrawTools.drawRectHalo(this, this.width, this.height, offset);
        if (this.haloGroupElement) {
            var haloNode = this.haloGroupElement.node();
            var haloContainer = haloNode.parentNode;
            haloContainer.appendChild(haloNode);
        }
        var selectedNode;
        var nodeContainer;
        if (this.pinned) {
            selectedNode = this.pinGroupElement.node();
            nodeContainer = selectedNode.parentNode;
            nodeContainer.appendChild(selectedNode);
        }
        if (this.inverse && this.inverse.pinned) {
            if (this.inverse.pinGroupElement) {
                selectedNode = this.inverse.pinGroupElement.node();
                nodeContainer = selectedNode.parentNode;
                nodeContainer.appendChild(selectedNode);
            }
        }
        if (pulseAnimation === false) {
            var pulseItem = this.haloGroupElement.selectAll(".searchResultA");
            pulseItem.classed("searchResultA", false);
            pulseItem.classed("searchResultB", true);
            pulseItem.attr("animationRunning", false);
        }
    }

    // Required for class interface compatibility
    textWidth() {
        return this.width;
    }

    animateDynamicLabelWidth(dynamic) {
        this.removeHalo();
        if (this.shapeElement === undefined) { // this handles setOperatorProperties which dont have a shapeElement!
            return;
        }

        var h = this.height;
        if (dynamic === true) {
            this.width = Math.min(this.getMyWidth(), graph.options().maxLabelWidth());
            this.shapeElement.transition().tween("attr", function () {
            })
                .ease('linear')
                .duration(100)
                .attr({ x: -this.width / 2, y: -h / 2, width: this.width, height: h })
                .each("end", function () {
                    this.updateTextElement();
                });
        } else {
            // Static width for property labels = 80
            this.width = this.defaultWidth;
            this.updateTextElement();
            this.shapeElement.transition().tween("attr", function () {
            })
                .ease('linear')
                .duration(100)
                .attr({ x: -this.width / 2, y: -h / 2, width: this.width, height: h });
        }
        if (this.pinned === true && this.pinGroupElement) {
            var dx = -0.5 * this.width + 10, dy = -25;
            this.pinGroupElement.transition()
                .tween("attr.translate", function () {
                })
                .attr("transform", "translate(" + dx + "," + dy + ")")
                .ease('linear')
                .duration(100);
        }
    }

    redrawLabelText() {
        this.textBlock.remove();
        this.addTextLabelElement();
        this.animateDynamicLabelWidth(graph.options().dynamicLabelWidth());
        this.shapeElement.select("title").text(this.labelForCurrentLanguage());
    }

    addTextLabelElement() {
        const equivalentsString = this.equivalentsString();
        const suffixForFollowingEquivalents = equivalentsString ? "," : "";
        this.textBlock = new CenteringTextElement(this.labelElement, this.backgroundColor);
        this.textBlock.addText(this.labelForCurrentLanguage(), "", suffixForFollowingEquivalents);
        this.textBlock.addEquivalents(equivalentsString);
        this.textBlock.addSubText(this.indicationString());
    }

    updateTextElement() {
        this.textBlock.updateAllTextElements();
    }

    enableEditing(autoEditing) {
        if (autoEditing === false) {
            return;
        }
        this.raiseDoubleClickEdit(true);
    }

    raiseDoubleClickEdit(forceIRISync) {
        d3.selectAll(".foreignelements").remove();
        if (this.labelElement === undefined || this.type === "owl:disjointWith" || this.type === "rdfs:subClassOf") {
            console.log("No Container found");
            return;
        }
        if (this.foreignerObject !== undefined) {
            this.labelElement.selectAll(".foreignelements").remove();
        }
        this.backupFullIri = undefined;
        graph.options().focuserModule().handle(undefined);
        graph.options().focuserModule().handle(this);
        this.editingTextElement = true;
        this.ignoreLocalHoverEvents = true;
        this.labelElement.selectAll("rect").classed("hoveredForEditing", true);
        this.frozen = true;
        graph.killDelayedTimer();
        graph.ignoreOtherHoverEvents(false);
        this.foreignerObject = this.labelElement.append("foreignObject")
            .attr("x", -0.5 * this.textWidth())
            .attr("y", -13)
            .attr("height", 25)
            .attr("class", "foreignelements")
            .on("dragstart", function () {
                return false;
            }) // remove drag operations of text element)
            .attr("width", this.textWidth() - 2);
        // adding a Style to the fObject
        var editText = this.foreignerObject.append("xhtml:input")
            .attr("class", "nodeEditSpan")
            .attr("id", this.id)
            .attr("align", "center")
            .attr("contentEditable", "true")
            .on("dragstart", function () {
                return false;
            }); // remove drag operations of text element)

        var bgColor = '#f00';
        var txtWidth = this.textWidth() - 2;
        editText.style({
            // 'line-height': '30px',
            'align': 'center',
            'color': 'black',
            'width': txtWidth + "px",
            'background-color': bgColor,
            'border-bottom': '2px solid black'
        });
        var txtNode = editText.node();
        txtNode.value = this.labelForCurrentLanguage();
        txtNode.focus();
        txtNode.select();
        if (d3.event.stopPropagation) {
            d3.event.stopPropagation();
        }
        if (d3.event.sourceEvent && d3.event.sourceEvent.stopPropagation) {
            d3.event.sourceEvent.stopPropagation();
        }
        // add some events this relate to this object
        editText.on("click", function () {
            if (d3.event.stopPropagation) {
                d3.event.stopPropagation();
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.stopPropagation) {
                d3.event.sourceEvent.stopPropagation();
            }
        });
        // // remove hover Events for now;
        editText.on("mouseout", function () {
            if (d3.event.stopPropagation) {
                d3.event.stopPropagation();
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.stopPropagation) {
                d3.event.sourceEvent.stopPropagation();
            }
        });
        editText.on("mousedown", function () {
            if (d3.event.stopPropagation) {
                d3.event.stopPropagation();
            }
            if (d3.event.sourceEvent && d3.event.sourceEvent.stopPropagation) {
                d3.event.sourceEvent.stopPropagation();
            }
        })
            .on("keydown", function () {
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
                    d3.select("#element_iriEditor").node().value = graph.options().prefixModule().getPrefixRepresentationForFullURI(syncedIRI);
                }
                d3.select("#element_labelEditor").node().value = editText.node().value;
            })
            // add a foreiner element to this thing;
            .on("blur", function () {
                this.editingTextElement = false;
                this.ignoreLocalHoverEvents = false;
                this.labelElement.selectAll("rect").classed("hoveredForEditing", false);
                var newLabel = editText.node().value;
                this.labelElement.selectAll(".foreignelements").remove();
                // this.setLabelForCurrentLanguage(classNameConvention(editText.node().value));
                this.label = newLabel;
                this.backupLabel = newLabel;
                this.redrawLabelText();
                this.updateHoverElements(true);
                graph.showHoverElementsAfterAnimation(this, false);
                graph.ignoreOtherHoverEvents(false);

                this.frozen = graph.paused();
                this.locked = graph.paused();
                this.domain.frozen = graph.paused();
                this.domain.locked = graph.paused();
                this.range.frozen = graph.paused();
                this.range.locked = graph.paused();
                graph.removeEditElements();
                if (this.backupFullIri) {
                    // console.log("Checking if element is Identical ?");
                    var sanityCheckResult = graph.options().editSidebar().checkProperIriChange(this, this.backupFullIri);
                    if (sanityCheckResult !== false) {
                        graph.options().warningModule().showWarning("Already seen this property",
                            "Input IRI: " + this.backupFullIri + " for element: " + this.labelForCurrentLanguage() + " already been set",
                            "Continuing with duplicate property!", 1, false, sanityCheckResult);
                    }
                    this.iri = this.backupFullIri;
                }
                graph.options().focuserModule().handle(undefined);
                graph.options().focuserModule().handle(this);
                graph.updatePropertyDraggerElements(this);
            });
    }

    // update hover elements
    updateHoverElements(enable) {
        if (graph.ignoreOtherHoverEvents() === false) {
            var inversed = false;
            if (this.inverse) {
                inversed = true;
            }
            if (enable === true) {
                graph.activateHoverElementsForProperties(enable, this, inversed);
            }
        }
    }

    copyInformation(other) {
        this.label = other.label;
        this.iri = other.iri;
        this.baseIri = other.baseIri;
        if (other.type === "owl:ObjectProperty" ||
            other.type === "owl:DatatypeProperty") {
            this.backupLabel = other.label;
            // console.log("copied backup label"+this.backupLabel);
        }
        if (other.backupLabel !== undefined) {
            this.backupLabel = other.backupLabel;
        }
    }

    actualRadius() {
        return smallestRadius;
    }
}
