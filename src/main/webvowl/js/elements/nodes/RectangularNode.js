let BaseNode = require("./BaseNode");
let CenteringTextElement = require("../../util/CenteringTextElement");
let drawTools = require("../drawTools")();
let rectangularElementTools = require("../rectangularElementTools")();

module.exports = (function () {

  let o = function (graph) {
    BaseNode.apply(this, arguments);

    let that = this,
      height = 20,
      width = 60,
      pinGroupElement,
      haloGroupElement,
      labelWidth = 80,
      myWidth = 80,
      defaultWidth = 80,
      shapeElement,
      textBlock,
      smallestRadius = height / 2;

    that.renderType("rect");
    // Properties
    this.height = function (p) {
      if (!arguments.length) return height;
      height = p;
      return this;
    };

    this.width = function (p) {
      if (!arguments.length) return width;
      width = p;
      return this;
    };

    this.getHalos = function () {
      return haloGroupElement;
    };

    // Functions
    // for compatibility reasons // TODO resolve
    this.actualRadius = function () {
      return smallestRadius;
    };

    this.distanceToBorder = function (dx, dy) {
      return rectangularElementTools.distanceToBorder(that, dx, dy);
    };

    this.setHoverHighlighting = function (enable) {
      that.nodeElement().selectAll("rect").classed("hovered", enable);

      let haloGroup = that.getHalos();
      if (haloGroup) {
        let test = haloGroup.selectAll(".searchResultA");
        test.classed("searchResultA", false);
        test.classed("searchResultB", true);
      }

    };


    // overwrite the labelWith;


    this.textWidth = function () {
      return labelWidth;
    };
    this.width = function () {
      return labelWidth;
    };

    this.getMyWidth = function () {
      // use a simple heuristic
      let text = that.labelForCurrentLanguage();
      myWidth = measureTextWidth(text, "text") + 20;

      // check for sub names;
      let indicatorText = that.indicationString();
      let indicatorWidth = measureTextWidth(indicatorText, "subtext") + 20;
      if (indicatorWidth > myWidth)
        myWidth = indicatorWidth;

      return myWidth;
    };

    this.textWidth = function () {
      return that.width();
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

    this.toggleFocus = function () {
      that.focused(!that.focused());
      that.nodeElement().select("rect").classed("focused", that.focused());
      graph.resetSearchHighlight();
      graph.options().searchMenu().clearText();
    };

    /**
     * Draws the rectangular node.
     * @param parentElement the element to which this node will be appended
     * @param [additionalCssClasses] additional css classes
     */
    this.draw = function (parentElement, additionalCssClasses) {
      let cssClasses = that.collectCssClasses();

      that.nodeElement(parentElement);

      if (additionalCssClasses instanceof Array) {
        cssClasses = cssClasses.concat(additionalCssClasses);
      }

      // set the value for that.width()
      // update labelWidth Value;
      if (graph.options().dynamicLabelWidth() === true) labelWidth = Math.min(that.getMyWidth(), graph.options().maxLabelWidth());
      else labelWidth = defaultWidth;

      width = labelWidth;
      shapeElement = drawTools.appendRectangularClass(parentElement, that.width(), that.height(), cssClasses, that.labelForCurrentLanguage(), that.backgroundColor());

      textBlock = new CenteringTextElement(parentElement, that.backgroundColor());
      textBlock.addText(that.labelForCurrentLanguage());

      that.addMouseListeners();

      if (that.pinned()) {
        that.drawPin();
      }
      if (that.halo()) {
        that.drawHalo(false);
      }
    };

    this.drawPin = function () {
      that.pinned(true);
      // if (graph.options().dynamicLabelWidth()===true) labelWidth=that.getMyWidth();
      // else                							labelWidth=defaultWidth;
      // width=labelWidth;
      // console.log("this element label Width is "+labelWidth);
      let dx = -0.5 * labelWidth + 5,
        dy = -1.1 * height;

      pinGroupElement = drawTools.drawPin(that.nodeElement(), dx, dy, this.removePin, graph.options().showDraggerObject, graph.options().useAccuracyHelper());

    };

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

    this.drawHalo = function (pulseAnimation) {
      that.halo(true);

      let offset = 0;
      haloGroupElement = drawTools.drawRectHalo(that, this.width(), this.height(), offset);

      if (pulseAnimation === false) {
        let pulseItem = haloGroupElement.selectAll(".searchResultA");
        pulseItem.classed("searchResultA", false);
        pulseItem.classed("searchResultB", true);
        pulseItem.attr("animationRunning", false);
      }

      if (that.pinned()) {
        let selectedNode = pinGroupElement.node();
        let nodeContainer = selectedNode.parentNode;
        nodeContainer.appendChild(selectedNode);
      }

    };

    this.updateTextElement = function () {
      textBlock.updateAllTextElements();

    };

    this.textBlock = function () {
      return textBlock;
    };

    this.redrawLabelText = function () {
      textBlock.remove();
      textBlock = new CenteringTextElement(that.nodeElement(), that.backgroundColor());
      textBlock.addText(that.labelForCurrentLanguage());
      that.animateDynamicLabelWidth(graph.options().dynamicLabelWidth());
      shapeElement.select("title").text(that.labelForCurrentLanguage());
    };

    this.animateDynamicLabelWidth = function (dynamic) {
      that.removeHalo();
      let height = that.height();
      if (dynamic === true) {
        labelWidth = Math.min(that.getMyWidth(), graph.options().maxLabelWidth());
        shapeElement.transition().tween("attr", function () {
        })
          .ease('linear')
          .duration(100)
          .attr({ x: -labelWidth / 2, y: -height / 2, width: labelWidth, height: height })
          .each("end", function () {
            that.updateTextElement();
          });

      } else {
        labelWidth = defaultWidth;
        that.updateTextElement();
        shapeElement.transition().tween("attr", function () {
        })
          .ease('linear')
          .duration(100)
          .attr({ x: -labelWidth / 2, y: -height / 2, width: labelWidth, height: height });

      }

      // for the pin we dont need to differ between different widths -- they are already set
      if (that.pinned() === true && pinGroupElement) {

        let dx = 0.5 * labelWidth - 10,
          dy = -1.1 * height;

        pinGroupElement.transition()
          .tween("attr.translate", function () {
          })
          .attr("transform", "translate(" + dx + "," + dy + ")")
          .ease('linear')
          .duration(100);
      }
    };

    this.addTextLabelElement = function () {
      let parentElement = that.nodeElement();
      textBlock = new CenteringTextElement(parentElement, this.backgroundColor());
      textBlock.addText(that.labelForCurrentLanguage());
    };


  };
  o.prototype = Object.create(BaseNode.prototype);
  o.prototype.constructor = o;

  return o;
}());
