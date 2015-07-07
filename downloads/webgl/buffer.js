function GLBuffer(glContext, bufferType, arrayData, bindParam){
    this.gl = glContext;
    this.buffer = glContext.createBuffer();
    this.bufferType = bufferType;
    if (arrayData){
        this.bindData(arrayData, bindParam || this.gl.STATIC_DRAW);
    }
}

GLBuffer.prototype.gl           = null;
GLBuffer.prototype.buffer       = null;
GLBuffer.prototype.bufferType   = null;

GLBuffer.prototype.bind = function() {
    this.gl.bindBuffer(this.bufferType, this.buffer);
    return this;
};

GLBuffer.prototype.bindData = function(arrayData, param) {
    if (arrayData){
        this.bind();
        this.gl.bufferData(this.bufferType, arrayData, param);
    }
    return this;
};

GLBuffer.prototype.bindAttrib = function(attrib, itemSize, dataType) {
    this.bind();
    this.gl.vertexAttribPointer(attrib, itemSize, dataType, false, 0, 0);
    return this;
};

GLBuffer.prototype.delete = function() {
    this.gl.deleteBuffer(this.buffer);
};


function GLFloatBuffer(glContext, bufferType, data, bindParam){
    GLBuffer.call(this, glContext, bufferType, data && new Float32Array(data), bindParam);
}

GLFloatBuffer.prototype = Object.create(GLBuffer.prototype);

GLFloatBuffer.prototype.bindAttrib = function(attrib, itemSize) {
    this.bind();
    this.gl.vertexAttribPointer(attrib, itemSize, this.gl.FLOAT, false, 0, 0);
    return this;
};
