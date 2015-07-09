function GLBuffer(glContext, bufferType, arrayType, arrayData, usage){
    this.gl         = glContext;
    this.buffer     = glContext.createBuffer();
    this.bufferType = bufferType || this.gl.ARRAY_BUFFER;
    this.arrayType  = arrayType  || Float32Array;
    if (arrayData){
        this.bindData(arrayData, usage || this.gl.STATIC_DRAW);
    }
}

GLBuffer.prototype.gl           = null;
GLBuffer.prototype.buffer       = null;
GLBuffer.prototype.bufferType   = null;
GLBuffer.prototype.arrayType    = null;

GLBuffer.prototype.bind = function() {
    this.gl.bindBuffer(this.bufferType, this.buffer);
    return this;
};

GLBuffer.prototype.bindData = function(arrayData, usage) {
    if (arrayData){
        this.bind();
        this.gl.bufferData(this.bufferType, new this.arrayType(arrayData), usage || this.gl.STATIC_DRAW);
    }
    return this;
};

GLBuffer.prototype.bindAttrib = function(attrib, itemSize, dataType) {
    this.bind();
    this.gl.vertexAttribPointer(attrib, itemSize, dataType || this.gl.FLOAT, false, 0, 0);
    return this;
};

GLBuffer.prototype.delete = function() {
    this.gl.deleteBuffer(this.buffer);
};


function GLFloatBuffer(glContext, bufferType, data, usage){
    GLBuffer.call(this, glContext, bufferType, Float32Array, data, usage);
}

GLFloatBuffer.prototype = Object.create(GLBuffer.prototype);

