import RoundNode from '../RoundNode';

export default function () {

    var o = function (graph) {
        RoundNode.apply(this, arguments);

        var superDrawFunction = this.draw;

        this.attributes = ["rdf"];
        this.label = "Resource";
        this.radius(30);
        this.styleClass = "rdfsresource";
        this.type = "rdfs:Resource";

        this.draw = function (element) {
            superDrawFunction(element, ["rdf", "dashed"]);
        };
    };
    o.prototype = Object.create(RoundNode.prototype);
    o.prototype.constructor = o;

    return o;
} ();
