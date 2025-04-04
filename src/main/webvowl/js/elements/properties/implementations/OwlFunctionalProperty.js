import BaseProperty from '../BaseProperty';

export default function () {

    var o = function (graph) {
        BaseProperty.apply(this, arguments);

        this.attributes = ["functional"];
        this.styleClass = "functionalproperty";
        this.type = "owl:FunctionalProperty";
    };
    o.prototype = Object.create(BaseProperty.prototype);
    o.prototype.constructor = o;

    return o;
} ();
