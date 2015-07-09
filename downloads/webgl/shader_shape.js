// ------------------------------------------------------------------
// Class ShapeAttribute
// ------------------------------------------------------------------
function ShapeAttribute (name, shaderAttr) {
    this.name       = name;
    this.shaderAttr = shaderAttr;
    this.dataArray  = null;
    this.buffer     = null;
}

ShapeAttribute.prototype.setData = function(dataArray, repeat) {
    if(repeat){
        this.dataArray = [];
        for (var i = repeat; i >= 0; i--) {
            this.dataArray = this.dataArray.concat(dataArray);
        }
    }else{
        this.dataArray = dataArray;
    }
    this.cleanBuffer();
};

ShapeAttribute.prototype.bindToShader = function(usage) {
    if(!this.buffer){
        this.buffer = this.shaderAttr.createBuffer(usage);
        this.buffer.bindData(this.dataArray);
    }
    this.shaderAttr.bindBuffer(this.buffer);
};

ShapeAttribute.prototype.cleanBuffer = function() {
    if(this.buffer){
        this.buffer.delete();
        this.buffer = null;
    }
};

ShapeAttribute.prototype.delete = function() {
    this.cleanBuffer();
};


// ------------------------------------------------------------------
// Class ShapeUniform
// ------------------------------------------------------------------
function ShapeUniform (name, shaderUniform) {
    this.name           = name;
    this.shaderUniform  = shaderUniform;
    this.value          = null;
}

ShapeUniform.prototype.setValue = function(value) {
    this.value = value;
};

ShapeUniform.prototype.bindToShader = function() {
    if (this.value != null){
        this.shaderUniform.bindValue(this.value);
    }
};


// ------------------------------------------------------------------
// Class Shape
// ------------------------------------------------------------------
function Shape (glShader, drawType) {
    this.shader     = glShader;
    this.drawType   = drawType || glShader.gl.TRIANGLE_FAN;
    this.attrib     = {};
    this.uniform    = {};
    for (var name in glShader.attrib){
        this.attrib[name] = new ShapeAttribute(name, glShader.attrib[name]);
    }
    for (var name in glShader.uniform){
        this.uniform[name] = new ShapeUniform(name, glShader.uniform[name]);
    }
}

Shape.prototype.shader      = null;
Shape.prototype.attrib      = null;
Shape.prototype.uniform     = null;
Shape.prototype.vertexCount = 0;
Shape.prototype.indexArray  = null;

Shape.prototype.getVertexCount = function () {
    return this.vertexCount;
}

Shape.prototype.getIndexArray = function() {
    return this.indexArray;
};

Shape.prototype.draw = function(usage) {
    var gl = this.shader.gl;
    for (var name in this.attrib){
        this.attrib[name].bindToShader();
    }
    for (var name in this.uniform){
        this.uniform[name].bindToShader();
    }
    gl.drawArrays(this.drawType, 0, this.getVertexCount());
};

Shape.prototype.delete = function() {
    for (var name in this.attrib){
        this.attrib[name].delete();
    }
};


// ------------------------------------------------------------------
// Class ShapeGroup
// ------------------------------------------------------------------
function ShapeGroup (glShader, drawType) {
    Shape.call(this, glShader, drawType || glShader.gl.TRIANGLES);
    this.shapes     = [];
    this.hasChanged = true;
}

ShapeGroup.prototype = Object.create(Shape.prototype);
ShapeGroup.prototype.shapes         = null;
ShapeGroup.prototype.indexBuffer    = null;
ShapeGroup.prototype.hasChanged     = false;

ShapeGroup.prototype.append = function(shape){
    this.shapes.push(shape);
    this.hasChanged = true;
}

ShapeGroup.prototype.takeFrom = function(shapes){
    while(shapes.length){
        this.shapes.push(shapes.shift());
    }
    this.hasChanged = true;
}

ShapeGroup.prototype.draw = function(usage) {
    var gl = this.shader.gl;
    if(this.hasChanged){
        for (var name in this.attrib){
            this.attrib[name].setData([]);
        }
        this.indexArray = [];
        var offset      = 0;
        for (var i = 0; i < this.shapes.length; i++){
            for (var name in this.attrib){
                this.attrib[name].dataArray = this.attrib[name].dataArray.concat(this.shapes[i].attrib[name].dataArray);  
            }
            var shapeIndexArray = this.shapes[i].getIndexArray();
            for (var j = 0; j < shapeIndexArray.length; j++){
                this.indexArray.push(shapeIndexArray[j] + offset);
            }
            offset += this.shapes[i].getVertexCount();
        }
        this.indexBuffer = new GLBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, Uint16Array, this.indexArray, usage || gl.STREAM_DRAW);
        this.hasChanged = false;
    }
    for (var name in this.attrib){
        this.attrib[name].bindToShader(usage || gl.STREAM_DRAW);
    }
    for (var name in this.uniform){
        this.uniform[name].bindToShader();
    }
    this.indexBuffer.bind();
    gl.drawElements(gl.TRIANGLES, this.indexArray.length, gl.UNSIGNED_SHORT, 0);
}

ShapeGroup.prototype.delete = function() {
    for (var name in this.attrib){
        this.attrib[name].delete();
    }
    this.indexBuffer.delete();
};
