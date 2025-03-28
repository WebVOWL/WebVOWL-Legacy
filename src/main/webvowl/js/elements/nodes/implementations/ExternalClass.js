let RoundNode = require("../RoundNode");

module.exports = (function () {

  let o = function (graph) {
    RoundNode.apply(this, arguments);

    this.attributes(["external"])
      .type("ExternalClass");
  };
  o.prototype = Object.create(RoundNode.prototype);
  o.prototype.constructor = o;

  return o;
}());
