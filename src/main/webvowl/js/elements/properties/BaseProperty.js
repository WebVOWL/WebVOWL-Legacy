let BaseElement = require("../BaseElement");
let CenteringTextElement = require("../../util/CenteringTextElement");
let drawTools = require("../drawTools")();
let forceLayoutNodeFunctions = require("../forceLayoutNodeFunctions")();
let rectangularElementTools = require("../rectangularElementTools")();
let math = require("../../util/math")();

module.exports = (function () {

    // Static letiables
    let labelHeight = 28,
        labelWidth = 80,
        smallestRadius = labelHeight / 2;


    // Constructor, private letiables and privileged methods
    let Base = function (graph) {
        BaseElement.apply(this, arguments);

        let that = this,
            // Basic attributes
            cardinality,
            domain,
            inverse,
            link,
            minCardinality,
            maxCardinality,
            range,
            subproperties,
            superproperties,
            // Style attributes
            linkType = "normal",
            markerType = "filled",
            labelVisible = true,
            // Element containers
            cardinalityElement,
            labelElement,
            linkGroup,
            markerElement,
            // Other
            ignoreLocalHoverEvents,
            fobj,
            pinGroupElement,
            haloGroupElement,
            myWidth = 80,
            defaultWidth = 80,
            shapeElement,
            textElement,
            parent_labelObject,
            backupFullIri,

            redundantProperties = [];


        this.existingPropertyIRI = function (url) {
            return graph.options().editSidebar().checkForExistingURL(url);
        };

        this.getHalos = function () {
            return haloGroupElement;
        };

        this.getPin = function () {
            return pinGroupElement;
        };
        this.labelObject = function (lo, once) {
            if (!arguments.length) {
                return parent_labelObject;
            }
            else {
                parent_labelObject = lo;
                if (that.inverse() && once !== true) {
                    that.inverse().labelObject(lo, true);
                }

            }
        };
        this.hide = function (val) {
            that.labelElement().classed("hidden", val);
            that.linkGroup().classed("hidden", val);
            if (that.cardinalityElement())
                that.cardinalityElement().classed("hidden", val);
        };

        // Properties
        this.cardinality = function (p) {
            if (!arguments.length) return cardinality;
            cardinality = p;
            return this;
        };

        this.cardinalityElement = function (p) {
            if (!arguments.length) return cardinalityElement;
            cardinalityElement = p;
            return this;
        };

        this.domain = function (p) {
            if (!arguments.length) return domain;
            domain = p;
            return this;
        };

        this.inverse = function (p) {
            if (!arguments.length) return inverse;
            inverse = p;
            return this;
        };

        this.labelElement = function (p) {
            if (!arguments.length) return labelElement;
            labelElement = p;
            return this;
        };

        this.labelVisible = function (p) {
            if (!arguments.length) return labelVisible;
            labelVisible = p;
            return this;
        };

        this.link = function (p) {
            if (!arguments.length) return link;
            link = p;
            return this;
        };

        this.linkGroup = function (p) {
            if (!arguments.length) return linkGroup;
            linkGroup = p;
            return this;
        };

        this.linkType = function (p) {
            if (!arguments.length) return linkType;
            linkType = p;
            return this;
        };

        this.markerElement = function (p) {
            if (!arguments.length) return markerElement;
            markerElement = p;
            return this;
        };

        this.markerType = function (p) {
            if (!arguments.length) return markerType;
            markerType = p;
            return this;
        };

        this.maxCardinality = function (p) {
            if (!arguments.length) return maxCardinality;
            maxCardinality = p;
            return this;
        };

        this.minCardinality = function (p) {
            if (!arguments.length) return minCardinality;
            minCardinality = p;
            return this;
        };

        this.range = function (p) {
            if (!arguments.length) return range;
            range = p;
            return this;
        };

        this.redundantProperties = function (p) {
            if (!arguments.length) return redundantProperties;
            redundantProperties = p;
            return this;
        };

        this.subproperties = function (p) {
            if (!arguments.length) return subproperties;
            subproperties = p;
            return this;
        };

        this.superproperties = function (p) {
            if (!arguments.length) return superproperties;
            superproperties = p;
            return this;
        };


        // Functions
        this.distanceToBorder = function (dx, dy) {
            return rectangularElementTools.distanceToBorder(that, dx, dy);
        };

        this.linkHasMarker = function () {
            return linkType !== "dashed";
        };

        this.markerId = function () {
            return "marker" + that.id();
        };

        this.toggleFocus = function () {
            that.focused(!that.focused());
            labelElement.select("rect").classed("focused", that.focused());
            graph.resetSearchHighlight();
            graph.options().searchMenu().clearText();
        };
        this.getShapeElement = function () {
            return shapeElement;
        };

        this.textBlock = function () {
            return textElement;
        };

        this.redrawElement = function () {
            shapeElement.remove();
            textElement.remove();

            that.drawLabel(that.labelElement());
            that.animateDynamicLabelWidth(graph.options().dynamicLabelWidth());


            // shapeElement=this.addRect(that.labelElement());
            //
            // let equivalentsString = that.equivalentsString();
            // let suffixForFollowingEquivalents = equivalentsString ? "," : "";
            //
            // textElement = new CenteringTextElement(labelContainer, this.backgroundColor());
            // textElement.addText(this.labelForCurrentLanguage(), "", suffixForFollowingEquivalents);
            // textElement.addEquivalents(equivalentsString);
            // textElement.addSubText(this.indicationString());

        };

        // Reused functions TODO refactor
        this.draw = function (labelGroup) {
            function attachLabel(property) {
                let labelContainer = labelGroup.append("g")
                    .datum(property)
                    .classed("label", true)
                    .attr("id", property.id());

                property.drawLabel(labelContainer);
                return labelContainer;
            }

            if (!that.labelVisible()) {
                return undefined;
            }
            if (graph.options().dynamicLabelWidth() === true) myWidth = Math.min(that.getMyWidth(), graph.options().maxLabelWidth());
            else myWidth = defaultWidth;

            that.labelElement(attachLabel(that));
            // Draw an inverse label and reposition both labels if necessary
            if (that.inverse()) {
                let yTransformation = (that.height() / 2) + 1 /* additional space */;
                that.inverse()
                    .labelElement(attachLabel(that.inverse()));

                that.labelElement()
                    .attr("transform", "translate(" + 0 + ",-" + yTransformation + ")");
                that.inverse()
                    .labelElement()
                    .attr("transform", "translate(" + 0 + "," + yTransformation + ")");
            }

            if (that.pinned()) {
                that.drawPin();
            } else if (that.inverse() && that.inverse().pinned()) {
                that.inverse().drawPin();
            }

            if (that.halo())
                that.drawHalo(false);

            return that.labelElement();
        };

        this.addRect = function (labelContainer) {
            let rect = labelContainer.append("rect")
                .classed(that.styleClass(), true)
                .classed("property", true)
                .attr("x", -that.width() / 2)
                .attr("y", -that.height() / 2)
                .attr("width", that.width())
                .attr("height", that.height())
                .on("mouseover", onMouseOver)
                .on("mouseout", onMouseOut);

            rect.append("title")
                .text(that.labelForCurrentLanguage());

            if (that.visualAttributes()) {
                rect.classed(that.visualAttributes(), true);
            }

            let bgColor = that.backgroundColor();

            if (that.attributes().indexOf("deprecated") > -1) {
                bgColor = undefined;
                rect.classed("deprecatedproperty", true);
            } else {
                rect.classed("deprecatedproperty", false);
            }
            rect.style("fill", bgColor);

            return rect;
        };
        this.drawLabel = function (labelContainer) {
            shapeElement = this.addRect(labelContainer);

            let equivalentsString = that.equivalentsString();
            let suffixForFollowingEquivalents = equivalentsString ? "," : "";

            let bgColor = that.backgroundColor();
            if (that.attributes().indexOf("deprecated") > -1) {
                bgColor = undefined;
            }
            textElement = new CenteringTextElement(labelContainer, bgColor);
            textElement.addText(this.labelForCurrentLanguage(), "", suffixForFollowingEquivalents);
            textElement.addEquivalents(equivalentsString);
            textElement.addSubText(this.indicationString());
        };

        this.equivalentsString = function () {
            let equivalentProperties = that.equivalents();
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
        };

        this.drawCardinality = function (container) {
            let cardinalityText = this.generateCardinalityText();

            if (cardinalityText) {
                that.cardinalityElement(container);
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
                    return true; // drawing successful
                }
            } else {
                return false;
            }
        };

        this.generateCardinalityText = function () {
            if (that.cardinality()) {
                return that.cardinality();
            } else if (that.minCardinality() || that.maxCardinality()) {
                let minBoundary = that.minCardinality() || "0";
                let maxBoundary = that.maxCardinality() || "*";
                return minBoundary + ".." + maxBoundary;
            }
        };

        that.setHighlighting = function (enable) {
            if (that.labelElement && that.labelElement()) {
                that.labelElement().select("rect").classed("hovered", enable);
            }
            that.linkGroup().selectAll("path, text").classed("hovered", enable);
            if (that.markerElement()) {
                that.markerElement().select("path").classed("hovered", enable);
                if (that.cardinalityElement()) {
                    that.cardinalityElement().selectAll("path").classed("hovered-MathSymbol", enable);
                    that.cardinalityElement().classed("hovered", enable);
                }
            }
            let subAndSuperProperties = getSubAndSuperProperties();
            subAndSuperProperties.forEach(function (property) {

                if (property.labelElement && property.labelElement()) {
                    property.labelElement().select("rect")
                        .classed("indirect-highlighting", enable);
                }

            });
            let inversed = false;

            if (graph.ignoreOtherHoverEvents() === false) {
                if (that.inverse()) {
                    inversed = true;
                }

                if (graph.isTouchDevice() === false) {
                    graph.activateHoverElementsForProperties(enable, that, inversed);
                }
                else {
                    that.labelElement().select("rect").classed("hovered", false);
                    that.linkGroup().selectAll("path, text").classed("hovered", false);
                    if (that.markerElement()) {
                        that.markerElement().select("path").classed("hovered", false);
                        if (that.cardinalityElement()) {
                            that.cardinalityElement().classed("hovered", false);
                        }
                    }
                    graph.activateHoverElementsForProperties(enable, that, inversed, true);
                }
            }
        };

        /**
         * Combines the sub- and superproperties into a single array, because
         * they're often used equivalently.
         * @returns {Array}
         */
        function getSubAndSuperProperties() {
            let properties = [];

            if (that.subproperties()) {
                properties = properties.concat(that.subproperties());
            }
            if (that.superproperties()) {
                properties = properties.concat(that.superproperties());
            }

            return properties;
        }

        /**
         * Foregrounds the property, its inverse and the link.
         */
        this.foreground = function () {
            // check for additional objects that we can highlight
            if (!that.labelElement())
                return;
            if (that.labelElement().node().parentNode === null) {
                return;
            }
            let selectedLabelGroup = that.labelElement().node().parentNode,
                labelContainer = selectedLabelGroup.parentNode,
                selectedLinkGroup = that.linkGroup().node(),
                linkContainer = that.linkGroup().node().parentNode;
            if (that.animationProcess() === false) {
                labelContainer.appendChild(selectedLabelGroup);
            }
            linkContainer.appendChild(selectedLinkGroup);
        };

        /**
         * Foregrounds the sub- and superproperties of this property.
         * This is separated from the foreground-function to prevent endless loops.
         */
        function foregroundSubAndSuperProperties() {
            let subAndSuperProperties = getSubAndSuperProperties();

            subAndSuperProperties.forEach(function (property) {
                if (property.foreground) property.foreground();
            });
        }

        function onMouseOver() {
            if (that.mouseEntered() || ignoreLocalHoverEvents === true) {
                return;
            }
            that.mouseEntered(true);
            that.setHighlighting(true);
            that.foreground();
            foregroundSubAndSuperProperties();
        }

        function onMouseOut() {
            that.mouseEntered(false);
            that.setHighlighting(false);
        }

        this.drawPin = function () {
            that.pinned(true);
            if (graph.options().dynamicLabelWidth() === true) myWidth = that.getMyWidth();
            else myWidth = defaultWidth;

            if (that.inverse()) {
                // check which element is rendered on top and add a pin to it
                let tr_that = that.labelElement().attr("transform");
                let tr_inv = that.inverse().labelElement().attr("transform");

                let thatY = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(tr_that)[2];
                let invY = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(tr_inv)[2];

                if (thatY < invY)
                    pinGroupElement = drawTools.drawPin(that.labelElement(), -0.5 * that.width() + 10, -25, this.removePin, graph.options().showDraggerObject, graph.options().useAccuracyHelper());
                else
                    pinGroupElement = drawTools.drawPin(that.inverse().labelElement(), -0.5 * that.inverse().width() + 10, -25, this.removePin, graph.options().showDraggerObject, graph.options().useAccuracyHelper());

            }
            else {
                pinGroupElement = drawTools.drawPin(that.labelElement(), -0.5 * that.width() + 10, -25, this.removePin, graph.options().showDraggerObject, graph.options().useAccuracyHelper());
            }


        };

        /**
         * Removes the pin and refreshs the graph to update the force layout.
         */
        this.removePin = function () {
            that.pinned(false);
            if (pinGroupElement) {
                pinGroupElement.remove();
            }
            graph.updateStyle();
        };

        this.removeHalo = function () {
            that.halo(false);
            if (haloGroupElement) {
                haloGroupElement.remove();
                haloGroupElement = null;
            }
        };

        this.animationProcess = function () {
            let animRuns = false;
            if (that.getHalos()) {
                let haloGr = that.getHalos();
                let haloEls = haloGr.selectAll(".searchResultA");
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
        };

        this.drawHalo = function (pulseAnimation) {
            that.halo(true);
            let offset = 0;
            if (that.labelElement() && that.labelElement().node()) {
                let labelNode = that.labelElement().node();
                let labelContainer = labelNode.parentNode;
                // do this only if animation is not running
                if (that.animationProcess() === false && labelContainer)
                    labelContainer.appendChild(labelNode);
            }
            haloGroupElement = drawTools.drawRectHalo(that, that.width(), that.height(), offset);
            if (haloGroupElement) {
                let haloNode = haloGroupElement.node();
                let haloContainer = haloNode.parentNode;
                haloContainer.appendChild(haloNode);
            }
            let selectedNode;
            let nodeContainer;
            if (that.pinned()) {
                selectedNode = pinGroupElement.node();
                nodeContainer = selectedNode.parentNode;
                nodeContainer.appendChild(selectedNode);
            }
            if (that.inverse() && that.inverse().pinned()) {
                if (that.inverse().getPin()) {
                    selectedNode = that.inverse().getPin().node();
                    nodeContainer = selectedNode.parentNode;
                    nodeContainer.appendChild(selectedNode);
                }
            }
            if (pulseAnimation === false) {
                let pulseItem = haloGroupElement.selectAll(".searchResultA");
                pulseItem.classed("searchResultA", false);
                pulseItem.classed("searchResultB", true);
                pulseItem.attr("animationRunning", false);
            }
        };

        this.getMyWidth = function () {
            let text = that.labelForCurrentLanguage();
            myWidth = measureTextWidth(text, "text") + 20;
            // check for sub names;
            let indicatorText = that.indicationString();
            let indicatorWidth = measureTextWidth(indicatorText, "subtext") + 20;
            if (indicatorWidth > myWidth)
                myWidth = indicatorWidth;

            return myWidth;
        };

        function measureTextWidth(text, textStyle) {
            // Set a default value
            if (!textStyle) {
                textStyle = "text";
            }
            let d = d3.select("body")
                .append("div")
                .attr("class", textStyle)
                .attr("id", "width-test") // tag this element to identify it
                .attr("style", "position:absolute; float:left; white-space:nowrap; visibility:hidden;")
                .text(text),
                w = document.getElementById("width-test").offsetWidth;
            d.remove();
            return w;
        }

        this.textWidth = function () {
            return myWidth;
        };
        this.width = function () {
            return myWidth;
        };

        this.animateDynamicLabelWidth = function (dynamic) {
            that.removeHalo();
            if (shapeElement === undefined) {// this handles setOperatorProperties which dont have a shapeElement!
                return;
            }

            let h = that.height();
            if (dynamic === true) {
                myWidth = Math.min(that.getMyWidth(), graph.options().maxLabelWidth());
                shapeElement.transition().tween("attr", function () {
                })
                    .ease('linear')
                    .duration(100)
                    .attr({ x: -myWidth / 2, y: -h / 2, width: myWidth, height: h })
                    .each("end", function () {
                        that.updateTextElement();
                    });
            } else {
                // Static width for property labels = 80
                myWidth = defaultWidth;
                that.updateTextElement();
                shapeElement.transition().tween("attr", function () {
                })
                    .ease('linear')
                    .duration(100)
                    .attr({ x: -myWidth / 2, y: -h / 2, width: myWidth, height: h });
            }
            if (that.pinned() === true && pinGroupElement) {
                let dx = -0.5 * myWidth + 10,
                    dy = -25;
                pinGroupElement.transition()
                    .tween("attr.translate", function () {
                    })
                    .attr("transform", "translate(" + dx + "," + dy + ")")
                    .ease('linear')
                    .duration(100);
            }
        };

        this.redrawLabelText = function () {
            textElement.remove();
            that.addTextLabelElement();
            that.animateDynamicLabelWidth(graph.options().dynamicLabelWidth());
            shapeElement.select("title").text(that.labelForCurrentLanguage());
        };

        this.addTextLabelElement = function () {
            let labelContainer = that.labelElement();

            let equivalentsString = that.equivalentsString();
            let suffixForFollowingEquivalents = equivalentsString ? "," : "";

            textElement = new CenteringTextElement(labelContainer, this.backgroundColor());
            textElement.addText(this.labelForCurrentLanguage(), "", suffixForFollowingEquivalents);
            textElement.addEquivalents(equivalentsString);
            textElement.addSubText(this.indicationString());
        };

        this.updateTextElement = function () {
            textElement.updateAllTextElements();
        };
        this.enableEditing = function (event, autoEditing) {
            if (autoEditing === false)
                return;
            that.raiseDoubleClickEdit(event, true);
        };

        this.raiseDoubleClickEdit = function (event, forceIRISync) {
            d3.selectAll(".foreignelements").remove();
            if (that.labelElement() === undefined || this.type() === "owl:disjointWith" || this.type() === "rdfs:subClassOf") {
                console.log("No Container found");
                return;
            }
            if (fobj !== undefined) {
                that.labelElement().selectAll(".foreignelements").remove();
            }
            backupFullIri = undefined;
            graph.options().focuserModule().handle(undefined);
            graph.options().focuserModule().handle(event, that);
            that.editingTextElement = true;
            ignoreLocalHoverEvents = true;
            that.labelElement().selectAll("rect").classed("hoveredForEditing", true);
            that.frozen(true);
            graph.killDelayedTimer();
            graph.ignoreOtherHoverEvents(false);
            fobj = that.labelElement().append("foreignObject")
                .attr("x", -0.5 * that.textWidth())
                .attr("y", -13)
                .attr("height", 25)
                .attr("class", "foreignelements")
                .on("start", function (event) {
                    return false;
                }) // remove drag operations of text element
                .attr("width", that.textWidth() - 2);

            // adding a Style to the fObject
            let editText = fobj.append("xhtml:input")
                .attr("class", "nodeEditSpan")
                .attr("id", that.id())
                .attr("align", "center")
                .attr("contentEditable", "true")
                .on("start", function (event) {
                    return false;
                }); // remove drag operations of text element

            let bgColor = '#f00';
            let txtWidth = that.textWidth() - 2;
            editText.style({
                // 'line-height': '30px',
                'align': 'center',
                'color': 'black',
                'width': txtWidth + "px",
                'background-color': bgColor,
                'border-bottom': '2px solid black'
            });
            let txtNode = editText.node();
            txtNode.value = that.labelForCurrentLanguage();
            txtNode.focus();
            txtNode.select();
            if (event.stopPropagation) {
                event.stopPropagation();
            }
            if (event.sourceEvent && event.sourceEvent.stopPropagation) {
                event.sourceEvent.stopPropagation();
            }

            // add some events that relate to this object
            editText.on("click", function (event) {
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                if (event.sourceEvent && event.sourceEvent.stopPropagation) {
                    event.sourceEvent.stopPropagation();
                }
            });
            // // remove hover Events for now;
            editText.on("mouseout", function (event) {
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                if (event.sourceEvent && event.sourceEvent.stopPropagation) {
                    event.sourceEvent.stopPropagation();
                }
            });
            editText.on("mousedown", function (event) {
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                if (event.sourceEvent && event.sourceEvent.stopPropagation) {
                    event.sourceEvent.stopPropagation();
                }
            })
                .on("keydown", function (event) {
                    if (event.code === 13) {
                        this.blur();
                        that.frozen(false); // << releases the not after selection
                        that.locked(false);
                    }
                })
                .on("keyup", function (event) {
                    if (forceIRISync) {
                        let labelName = editText.node().value;
                        let resourceName = labelName.replaceAll(" ", "_");
                        let syncedIRI = that.baseIri() + resourceName;
                        backupFullIri = syncedIRI;

                        d3.select("#element_iriEditor").node().title = syncedIRI;
                        d3.select("#element_iriEditor").node().value = graph.options().prefixModule().getPrefixRepresentationForFullURI(syncedIRI);
                    }
                    d3.select("#element_labelEditor").node().value = editText.node().value;
                })
                .on("blur", function (event) {
                    that.editingTextElement = false;
                    ignoreLocalHoverEvents = false;
                    that.labelElement().selectAll("rect").classed("hoveredForEditing", false);
                    let newLabel = editText.node().value;
                    that.labelElement().selectAll(".foreignelements").remove();
                    // that.setLabelForCurrentLanguage(classNameConvention(editText.node().value));
                    that.label(newLabel);
                    that.backupLabel(newLabel);
                    that.redrawLabelText();
                    updateHoverElements(true);
                    graph.showHoverElementsAfterAnimation(that, false);
                    graph.ignoreOtherHoverEvents(false);

                    that.frozen(graph.paused());
                    that.locked(graph.paused());
                    that.domain().frozen(graph.paused());
                    that.domain().locked(graph.paused());
                    that.range().frozen(graph.paused());
                    that.range().locked(graph.paused());
                    graph.removeEditElements();
                    if (backupFullIri) {
                        // console.log("Checking if element is Identical ?");
                        let sanityCheckResult = graph.options().editSidebar().checkProperIriChange(that, backupFullIri);
                        if (sanityCheckResult !== false) {
                            graph.options().warningModule().showWarning("Already seen this property",
                                "Input IRI: " + backupFullIri + " for element: " + that.labelForCurrentLanguage() + " already been set",
                                "Continuing with duplicate property!", 1, false, sanityCheckResult);
                        }
                        that.iri(backupFullIri);
                    }
                    graph.options().focuserModule().handle(undefined);
                    graph.options().focuserModule().handle(event, that);
                    graph.updatePropertyDraggerElements(that);
                });	// add a foreiner element to this thing;
        };

        // update hover elements
        function updateHoverElements(enable) {
            if (graph.ignoreOtherHoverEvents() === false) {
                let inversed = false;
                if (that.inverse()) {
                    inversed = true;
                }
                if (enable === true) {
                    graph.activateHoverElementsForProperties(enable, that, inversed);
                }
            }
        }
        that.copyInformation = function (other) {
            that.label(other.label());
            that.iri(other.iri());
            that.baseIri(other.baseIri());
            if (other.type() === "owl:ObjectProperty" ||
                other.type() === "owl:DatatypeProperty") {
                that.backupLabel(other.label());
                // console.log("copied backup label"+that.backupLabel());
            }
            if (other.backupLabel() !== undefined) {
                that.backupLabel(other.backupLabel());
            }
        };
        forceLayoutNodeFunctions.addTo(this);
    };

    Base.prototype = Object.create(BaseElement.prototype);
    Base.prototype.constructor = Base;

    Base.prototype.height = function () {
        return labelHeight;
    };

    Base.prototype.width = function () {
        return labelWidth;
    };

    Base.prototype.actualRadius = function () {
        return smallestRadius;
    };

    Base.prototype.textWidth = Base.prototype.width;
    return Base;
}());
