import RectangularNode from './RectangularNode';

export default function (){
  
  var o = function ( graph ){
    RectangularNode.apply(this, arguments);
  };
  o.prototype = Object.create(RectangularNode.prototype);
  o.prototype.constructor = o;
  
  return o;
}();
