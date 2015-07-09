function Rect(glShader, left, top, right, bottom){
    Shape.call(this, glShader);
    this.left       = left;
    this.top        = top;
    this.right      = right;
    this.bottom     = bottom;
    
    this.attrib.vertexPosition.setData([
        this.left,   this.top,
        this.right,  this.top,
        this.right,  this.bottom,
        this.left,   this.bottom
    ]);
    this.attrib.centerPosition.setData([
        (this.left + this.right) / 2, 
        (this.top + this.bottom) / 2
    ], 4 );
    this.indexArray = [
        0, 1, 2,
        0, 2, 3
    ];
    this.vertexCount = 4;
}
Rect.prototype = Object.create(Shape.prototype);
Rect.prototype.left         = null;
Rect.prototype.top          = null;
Rect.prototype.right        = null;
Rect.prototype.bottom       = null;





