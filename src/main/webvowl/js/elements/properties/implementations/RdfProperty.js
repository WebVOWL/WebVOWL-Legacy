import BaseProperty from '../BaseProperty';

export default function () {

    var o = function (graph) {
        BaseProperty.apply(this, arguments);

        this.attributes = ["rdf"];
        this.styleClass = "rdfproperty";
        this.type = "rdf:Property";
    };
    o.prototype = Object.create(BaseProperty.prototype);
    o.prototype.constructor = o;

    return o;
} ();
