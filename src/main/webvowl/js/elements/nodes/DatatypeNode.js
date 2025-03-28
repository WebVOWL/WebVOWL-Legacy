let RectangularNode = require("./RectangularNode");

module.exports = (function () {

  let o = function (graph) {
    RectangularNode.apply(this, arguments);
  };
  o.prototype = Object.create(RectangularNode.prototype);
  o.prototype.constructor = o;

  return o;
}());
