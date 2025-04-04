import BaseProperty from '../BaseProperty';

export default function () {

    var o = function (graph) {
        BaseProperty.apply(this, arguments);

        this.attributes = ["transitive"];
        this.styleClass = "transitiveproperty";
        this.type = "owl:TransitiveProperty";
    };
    o.prototype = Object.create(BaseProperty.prototype);
    o.prototype.constructor = o;

    return o;
} ();
