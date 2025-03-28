let SetOperatorNode = require("../SetOperatorNode");

module.exports = (function () {

  let o = function (graph) {
    SetOperatorNode.apply(this, arguments);

    let that = this,
      superDrawFunction = that.draw;

    this.styleClass("disjointunionof")
      .type("owl:disjointUnionOf");

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
      symbol.append("text")
        .attr("class", "link")
        .text("1")
        .attr("transform", "scale(.7)translate(3,5)");

      symbol.attr("transform", "translate(-" + (that.radius() - 15) / 7 + ",-" + (that.radius() - 15) / 100 + ")");

      that.postDrawActions();
    };
  };
  o.prototype = Object.create(SetOperatorNode.prototype);
  o.prototype.constructor = o;

  return o;
}());
