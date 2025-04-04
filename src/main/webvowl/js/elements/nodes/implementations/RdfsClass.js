import RoundNode from '../RoundNode';

export default function () {

    var o = function (graph) {
        RoundNode.apply(this, arguments);

        this.attributes = ["rdf"];
        this.type = "rdfs:Class";
    };
    o.prototype = Object.create(RoundNode.prototype);
    o.prototype.constructor = o;

    return o;
} ();
