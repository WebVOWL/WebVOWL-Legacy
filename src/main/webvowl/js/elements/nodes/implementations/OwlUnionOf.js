let SetOperatorNode = require("../SetOperatorNode");

module.exports = (function () {

  let o = function (graph) {
    SetOperatorNode.apply(this, arguments);

    let that = this,
      superDrawFunction = that.draw;

    this.styleClass("unionof")
      .type("owl:unionOf");

    this.draw = function (element) {
      superDrawFunction(element);

      let symbol = element.append("g").classed("embedded", true);

      let symbolRadius = 10;
      symbol.append("circle")
        .attr("class", "symbol")
        .attr("r", symbolRadius);
      symbol.append("circle")
        .attr("cx", 10)
        .attr("class", "symbol")
        .classed("fineline", true)
        .attr("r", symbolRadius);
      symbol.append("circle")
        .attr("class", "nofill")
        .classed("fineline", true)
        .attr("r", symbolRadius);
      symbol.append("path")
        .attr("class", "link")
        .attr("d", "m 1,-3 c 0,2 0,4 0,6 0,0 0,0 0,0 0,2 2,3 4,3 2,0 4,-1 4,-3 0,-2 0,-4 0,-6")
        .attr("transform", "scale(.5)translate(5,0)");

      symbol.attr("transform", "translate(-" + (that.radius() - 15) / 7 + ",-" + (that.radius() - 15) / 100 + ")");

      that.postDrawActions();
    };
  };
  o.prototype = Object.create(SetOperatorNode.prototype);
  o.prototype.constructor = o;

  return o;
}());
