function GLTexture(glContext, textureType){
    this.gl = glContext;
    this.texture = this.gl.createTexture();
    this.textureType = textureType || this.gl.TEXTURE_2D;
}

GLTexture.prototype.gl              = null;
GLTexture.prototype.texture         = null;
GLTexture.prototype.textureType     = null;

GLTexture.prototype.bind = function() {
    this.gl.bindTexture(this.textureType, this.texture);
};

GLTexture.prototype.unbind = function() {
    this.gl.bindTexture(this.textureType, null);
};

GLTexture.prototype.activeWith = function(shader, index, uniformName) {
    this.gl.activeTexture(this.gl.TEXTURE0 + index);
    this.bind();
    this.gl.uniform1i(shader.uniform(uniformName), index);
};

GLTexture.prototype.loadImage = function(src, noRepating, callback) {
    var self    = this;
    var gl      = this.gl;
    var image   = new Image();
    image.onload = function() { 
        self.bind();
        gl.texImage2D(self.textureType, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(self.textureType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(self.textureType, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        if (noRepating) { // must enable this when image size not euqal power of two
            gl.texParameteri(self.textureType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(self.textureType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(self.textureType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.generateMipmap(self.textureType);
        self.unbind();
        if (callback){
            callback(self);
        }
    };
    image.src = src;
}


function GLFrameBufferTexture(glContext, textureType, width, height){
    GLTexture.call(this, glContext, textureType);
    
    var gl      = this.gl;
    this.width  = width || 512;
    this.height = height || 512;

    this.frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    this.frameBuffer.width = this.width;
    this.frameBuffer.height = this.height;

    this.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
        
    this.renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderBuffer);

    gl.clearColor(0.0, 0.0, 0.0, 1.0); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    this.unbind();
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

GLFrameBufferTexture.prototype              = Object.create(GLTexture.prototype);
GLFrameBufferTexture.prototype.width        = null;
GLFrameBufferTexture.prototype.height       = null;
GLFrameBufferTexture.prototype.frameBuffer  = null;
GLFrameBufferTexture.prototype.renderBuffer = null;

GLFrameBufferTexture.prototype.begin = function() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
};

GLFrameBufferTexture.prototype.end = function() {
    this.bind();
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
    this.unbind();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
};

