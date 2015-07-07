function Rect(left, top, right, bottom){
    this.left   = left;
    this.top    = top;
    this.right  = right;
    this.bottom = bottom;
}

Rect.prototype.left     = null;
Rect.prototype.top      = null;
Rect.prototype.right    = null;
Rect.prototype.bottom   = null;

Rect.prototype.toFloatBuffer = function(glContext, usage) {
    return new GLFloatBuffer(gl, gl.ARRAY_BUFFER, [
        this.left,   this.top,
        this.right,  this.top,
        this.right,  this.bottom,
        this.left,   this.bottom,
    ], usage || glContext.STREAM_DRAW);
};