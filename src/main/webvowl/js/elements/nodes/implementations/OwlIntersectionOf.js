let SetOperatorNode = require("../SetOperatorNode");

module.exports = (function () {

  let o = function (graph) {
    SetOperatorNode.apply(this, arguments);

    let that = this,
      superDrawFunction = that.draw,
      INTERSECTION_BACKGROUND_PATH = createIntersectionPath();

    this.styleClass("intersectionof")
      .type("owl:intersectionOf");

    this.draw = function (element) {
      superDrawFunction(element);

      let symbol = element.append("g").classed("embedded", true);

      let symbolRadius = 10;
      symbol.append("path")
        .attr("class", "nostroke")
        .classed("symbol", true)
        .attr("d", INTERSECTION_BACKGROUND_PATH);
      symbol.append("circle")
        .attr("class", "nofill")
        .classed("fineline", true)
        .attr("r", symbolRadius);
      symbol.append("circle")
        .attr("cx", 10)
        .attr("class", "nofill")
        .classed("fineline", true)
        .attr("r", symbolRadius);
      symbol.append("path")
        .attr("class", "nofill")
        .attr("d", "m 9,5 c 0,-2 0,-4 0,-6 0,0 0,0 0,0 0,0 0,-1.8 -1,-2.3 -0.7,-0.6 -1.7,-0.8 -2.9," +
          "-0.8 -1.2,0 -2,0 -3,0.8 -0.7,0.5 -1,1.4 -1,2.3 0,2 0,4 0,6")
        .attr("transform", "scale(.5)translate(5,0)");

      symbol.attr("transform",
        "translate(-" + (that.radius() - 15) / 7 + ",-" + (that.radius() - 15) / 100 + ")");

      that.postDrawActions();
    };

    function createIntersectionPath() {
      let height = 18;

      let offsetX = 5;
      let offsetY = -(height / 2);

      let bezierX = 7;
      let bezierY = 5;
      let bottomBezierY = height - bezierY;

      let startPosition = "M" + offsetX + "," + offsetY;
      let rightSide = "c" + bezierX + "," + bezierY + " " + bezierX + "," + bottomBezierY + " 0," + height;
      let leftSide = "c" + -bezierX + "," + -bezierY + " " + -bezierX + "," + -bottomBezierY + " 0," + -height;

      return startPosition + rightSide + leftSide;
    }
  };
  o.prototype = Object.create(SetOperatorNode.prototype);
  o.prototype.constructor = o;

  return o;
}());
