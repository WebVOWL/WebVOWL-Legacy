import RoundNode from '../RoundNode';

export default function () {

    var o = function (graph) {
        RoundNode.apply(this, arguments);

        var superDrawFunction = this.draw;

        this.label = "Thing";
        this.type = "owl:Thing";
        this.iri = "http://www.w3.org/2002/07/owl#Thing";
        this.radius(30);

        this.draw = function (element) {
            superDrawFunction(element, ["white", "dashed"]);
        };
    };
    o.prototype = Object.create(RoundNode.prototype);
    o.prototype.constructor = o;

    return o;
} ();
