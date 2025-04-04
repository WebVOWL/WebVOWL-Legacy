import RoundNode from '../RoundNode';

export default function () {

  var o = function (graph) {
    RoundNode.apply(this, arguments);

    this.attributes = ["deprecated"];
    this.type = "owl:DeprecatedClass";
    this.styleClass = "deprecated";
    this.indications = ["deprecated"];
  };
  o.prototype = Object.create(RoundNode.prototype);
  o.prototype.constructor = o;

  return o;
} ();
