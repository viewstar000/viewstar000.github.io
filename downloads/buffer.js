function GLBuffer(glContext, bufferType, arrayData){
    this.gl = glContext;
    this.buffer = glContext.createBuffer();
    this.bufferType = bufferType;
    this.bindData(arrayData, gl.STATIC_DRAW);
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


function GLFloatBuffer(glContext, bufferType, data){
    GLBuffer.call(this, glContext, bufferType, new Float32Array(data));
}

GLFloatBuffer.prototype = Object.create(GLBuffer.prototype);

GLFloatBuffer.prototype.bindAttrib = function(attrib, itemSize) {
    this.bind();
    this.gl.vertexAttribPointer(attrib, itemSize, this.gl.FLOAT, false, 0, 0);
    return this;
};