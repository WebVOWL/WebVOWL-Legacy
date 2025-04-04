import BaseProperty from '../BaseProperty';

export default function () {

    var o = function (graph) {
        BaseProperty.apply(this, arguments);

        this.attributes = ["deprecated"];
        this.styleClass = "deprecatedproperty";
        this.type = "owl:DeprecatedProperty";
    };
    o.prototype = Object.create(BaseProperty.prototype);
    o.prototype.constructor = o;

    return o;
} ();
