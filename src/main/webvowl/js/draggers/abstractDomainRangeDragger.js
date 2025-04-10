import { AbstractDragger } from "./abstractDragger";

export class AbstractDomainRangeDragger extends AbstractDragger {
    constructor(graph) {
        super(graph)

        if (this.constructor === AbstractDomainRangeDragger) {
            throw new Error("Abstract classes can't be instantiated")
        }

        this.x = 0
        this.y = 0
        this.mouseEntered = false
        this.mouseButtonPressed = false
        /**
         * @type {d3.Selection<any,any,null,undefined> | undefined}
         */
        this.draggerObject = undefined
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} root
     */
    set svgRoot(root) {
        super.svgRoot = root
        this.addMouseEvents();
    }

    /**
     * @param {boolean} val
     */
    hideDragger(val) {
        if (this.pathElement) {
            this.pathElement.classed("hidden", val);
        }
        if (this.nodeElement) {
            this.nodeElement.classed("hidden", val);
        }
        if (this.draggerObject) {
            this.draggerObject.classed("hidden", val);
        }
    }

    /**
     * @param {d3.Selection<any, any, null, undefined>} parentProperty A property selection
     * @param {boolean} [inversed]
     * @param {d3.Selection<any,any,null,undefined>} [lowerElement] A node selection
     * @param {d3.Selection<any,any,null,undefined>} [upperElement] A node selection
     * @param {d3.Selection<any,any,null,undefined>} [singleElement] A node selection
     */
    setParentProperty(parentProperty, inversed, lowerElement, upperElement, singleElement) {
        this.parentNode = parentProperty;
        this.isLoopProperty = false;
        if (parentProperty.domain === parentProperty.range) {
            this.isLoopProperty = true;
        }
        if (inversed === true) {
            if (parentProperty.labelElement && parentProperty.labelElement.attr("transform") === "translate(0,15)") {
                // This is the lower element
                if (lowerElement) {
                    this.x = lowerElement.x;
                    this.y = lowerElement.y;
                }
            } else {
                // This is the upper  element
                if (upperElement) {
                    this.x = upperElement.x;
                    this.y = upperElement.y;
                }
            }
        }
        else {
            // This is single element
            if (singleElement) {
                this.x = singleElement.x;
                this.y = singleElement.y;
            }
        }
        this.updateElement();
    }

    redrawEverything() {
        this.setParentProperty(this.parentNode)
    }

    /**
     * @param {string} pathData
     */
    drawNode(pathData) {
        this.pathElement = this.pathLayer.append('line')
            .classed("classNodeDragPath", true);
        this.pathElement.attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 0);

        this.nodeElement = this.rootNodeLayer.append('path').attr("d", pathData);
        this.nodeElement.classed("classDraggerNode", true);
        // this.draggerObject = this.rootNodeLayer.append("circle"); // REVIEW: Check if it should be before or after (classDragger uses this)
        if (this.graph.options().useAccuracyHelper()) {
            this.draggerObject = this.rootNodeLayer.append("circle"); // REVIEW: Check if it should be before or after (domainDragger & rangeDragger uses this)
            this.draggerObject.attr("r", 40)
                .attr("cx", 0)
                .attr("cy", 0)
                .classed("superHiddenElement", true);
            this.draggerObject.classed("superOpacityElement", !this.graph.options().showDraggerObject());
        }
    }

    addMouseEvents() {
        this.rootNodeLayer.selectAll("*").on("mouseover", this.onMouseOver)
            .on("mouseout", this.onMouseOut)
            .on("click", function () {
            })
            .on("dblclick", function () {
            })
            .on("mousedown", this.mouseDown)
            .on("mouseup", this.mouseUp);
    }

    mouseDown() {
        this.nodeElement.style("cursor", "move");
        this.nodeElement.classed("classDraggerNodeHovered", true);
        this.mouseButtonPressed = true;
    }

    mouseUp() {
        this.nodeElement.style("cursor", "auto");
        this.nodeElement.classed("classDraggerNodeHovered", false); // REVIEW: Check if this is needed. It's used on domainDragger & rangeDragger
        this.mouseButtonPressed = false;
    }

    /**
     * @param {boolean} val
     */
    selectedViaTouch(val) {
        this.nodeElement.classed("classDraggerNode", !val);
        this.nodeElement.classed("classDraggerNodeHovered", val);
    }

    onMouseOver() {
        if (this.mouseEntered) {
            return;
        }
        this.nodeElement.classed("classDraggerNode", false);
        this.nodeElement.classed("classDraggerNodeHovered", true);
        let selectedNode = this.rootElement.node();
        let nodeContainer = selectedNode.parentNode;
        nodeContainer.appendChild(selectedNode);
        this.mouseEntered = true;
    }

    onMouseOut() {
        if (this.mouseButtonPressed === true) {
            return;
        }
        this.nodeElement.classed("classDraggerNodeHovered", false);
        this.nodeElement.classed("classDraggerNode", true);
        this.mouseEntered = false;
    }

    // NOTE: Disabled to save memory while this method is not used
    // setAdditionalClassForClass_dragger (name, val) {
    //     // console.log("this should sett the class here")
    //     // this.nodeElement.classed(name,val);
    // }
}