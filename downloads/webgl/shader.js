
var SHADER_ATTR_TYPE_MAP = null;


function ShaderAttribute (shader, name, index, location, rawSize, rawType, dataType, arrayType, itemSize) {
    this.shader     = shader;
    this.name       = name;
    this.index      = index;
    this.location   = location;
    this.rawSize    = rawSize;
    this.rawType    = rawType;
    this.dataType   = dataType;
    this.arrayType  = arrayType;
    this.itemSize   = itemSize;
}

ShaderAttribute.prototype.createBuffer = function(usage) {
    return new GLBuffer(this.shader.gl, this.shader.gl.ARRAY_BUFFER, this.arrayType, null, usage || this.shader.gl.STREAM_DRAW);
};

ShaderAttribute.prototype.bindBuffer = function(buffer) {
    buffer.bindAttrib(this.location, this.itemSize, this.dataType);
    return this;
};


function ShaderUniform (shader, name, index, location, rawSize, rawType, isMatrix, uniformMethod) {
    this.shader     = shader;
    this.name       = name;
    this.index      = index;
    this.location   = location;
    this.rawSize    = rawSize;
    this.rawType    = rawType;
    this.isMatrix   = isMatrix;
    this.uniformMethod = uniformMethod;
}

ShaderUniform.prototype.bindValue = function(value) {
    if(this.isMatrix){
        this.shader.gl[this.uniformMethod](this.location, false, new Float32Array(value));
    }else{
        this.shader.gl[this.uniformMethod](this.location, value);
    }
    return this;
};


function GLShader(glContext){
    this.gl = glContext;
    if(!SHADER_ATTR_TYPE_MAP){
        SHADER_ATTR_TYPE_MAP = {};
        SHADER_ATTR_TYPE_MAP[this.gl.FLOAT]         = {dataType : this.gl.FLOAT,    arrayType : Float32Array,   itemSize : 1,   uniformMethod : 'uniform1f'};
        SHADER_ATTR_TYPE_MAP[this.gl.FLOAT_VEC2]    = {dataType : this.gl.FLOAT,    arrayType : Float32Array,   itemSize : 2,   uniformMethod : 'uniform2fv'};
        SHADER_ATTR_TYPE_MAP[this.gl.FLOAT_VEC3]    = {dataType : this.gl.FLOAT,    arrayType : Float32Array,   itemSize : 3,   uniformMethod : 'uniform3fv'};
        SHADER_ATTR_TYPE_MAP[this.gl.FLOAT_VEC4]    = {dataType : this.gl.FLOAT,    arrayType : Float32Array,   itemSize : 4,   uniformMethod : 'uniform4fv'};
        SHADER_ATTR_TYPE_MAP[this.gl.FLOAT_MAT2]    = {dataType : this.gl.FLOAT,    arrayType : Float32Array,   itemSize : 4,   uniformMethod : 'uniformMatrix2fv', isMatrix : true};
        SHADER_ATTR_TYPE_MAP[this.gl.FLOAT_MAT3]    = {dataType : this.gl.FLOAT,    arrayType : Float32Array,   itemSize : 9,   uniformMethod : 'uniformMatrix3fv', isMatrix : true};
        SHADER_ATTR_TYPE_MAP[this.gl.FLOAT_MAT4]    = {dataType : this.gl.FLOAT,    arrayType : Float32Array,   itemSize : 16,  uniformMethod : 'uniformMatrix4fv', isMatrix : true};
        SHADER_ATTR_TYPE_MAP[this.gl.INT]           = {dataType : this.gl.INT,      arrayType : Int32Array,     itemSize : 1,   uniformMethod : 'uniform1i'};
        SHADER_ATTR_TYPE_MAP[this.gl.INT_VEC2]      = {dataType : this.gl.INT,      arrayType : Int32Array,     itemSize : 2,   uniformMethod : 'uniform2iv'};
        SHADER_ATTR_TYPE_MAP[this.gl.INT_VEC3]      = {dataType : this.gl.INT,      arrayType : Int32Array,     itemSize : 3,   uniformMethod : 'uniform3iv'};
        SHADER_ATTR_TYPE_MAP[this.gl.INT_VEC4]      = {dataType : this.gl.INT,      arrayType : Int32Array,     itemSize : 4,   uniformMethod : 'uniform4iv'};
        SHADER_ATTR_TYPE_MAP[this.gl.BOOL]          = {dataType : this.gl.BOOL,     arrayType : Int8Array,      itemSize : 1,   uniformMethod : 'uniform1i'};
        SHADER_ATTR_TYPE_MAP[this.gl.BOOL_VEC2]     = {dataType : this.gl.BOOL,     arrayType : Int8Array,      itemSize : 2,   uniformMethod : 'uniform2iv'};
        SHADER_ATTR_TYPE_MAP[this.gl.BOOL_VEC3]     = {dataType : this.gl.BOOL,     arrayType : Int8Array,      itemSize : 3,   uniformMethod : 'uniform3iv'};
        SHADER_ATTR_TYPE_MAP[this.gl.BOOL_VEC4]     = {dataType : this.gl.BOOL,     arrayType : Int8Array,      itemSize : 4,   uniformMethod : 'uniform4iv'};
        SHADER_ATTR_TYPE_MAP[this.gl.SAMPLER_2D]    = {dataType : this.gl.SAMPLER_2D,   arrayType : Int32Array, itemSize : 1,   uniformMethod : 'uniform1i'};
        SHADER_ATTR_TYPE_MAP[this.gl.SAMPLER_CUBE]  = {dataType : this.gl.SAMPLER_CUBE, arrayType : Int32Array, itemSize : 1,   uniformMethod : 'uniform1i'};  // not sure for array type
    }
}

GLShader.prototype.gl               = null;
GLShader.prototype.vertexShader     = null;
GLShader.prototype.fragmentShader   = null;
GLShader.prototype.shaderProgram    = null;
GLShader.prototype.attrib           = null;
GLShader.prototype.uniform          = null;

GLShader.prototype.setShaderSource = function(vertexSource, fragmentSource) {
    
    this.vertexShader   = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(this.vertexShader, vertexSource);
    this.gl.compileShader(this.vertexShader);
    // See if it compiled successfully
    if (!this.gl.getShaderParameter(this.vertexShader, this.gl.COMPILE_STATUS)) {  
        alert("An error occurred compiling the vertex shaders: " + this.gl.getShaderInfoLog(this.vertexShader));   
    }

    this.fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(this.fragmentShader, fragmentSource);
    this.gl.compileShader(this.fragmentShader); 
    // See if it compiled successfully
    if (!this.gl.getShaderParameter(this.fragmentShader, this.gl.COMPILE_STATUS)) {  
        alert("An error occurred compiling the fragment shaders: " + this.gl.getShaderInfoLog(this.fragmentShader));  
    }

    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, this.vertexShader);
    this.gl.attachShader(this.shaderProgram, this.fragmentShader);
    this.gl.linkProgram(this.shaderProgram);

    // 如果创建着色器失败

    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }

    this.gl.useProgram(this.shaderProgram);
    this.initAttrs();
    this.initUniforms();
};

GLShader.prototype.setShaderScript = function(id1, id2) {
    var shaderScript, theSource, currentChild;
    var vertexSource, fragmentSource;

    shaderScript = document.getElementById(id1);
    if (shaderScript) {
        theSource = "";
        currentChild = shaderScript.firstChild;
        while(currentChild) {
            if (currentChild.nodeType == currentChild.TEXT_NODE) {
                theSource += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }
        if (shaderScript.type == "x-shader/x-fragment") {
            fragmentSource = theSource;
        } else if (shaderScript.type == "x-shader/x-vertex") {
            vertexSource = theSource;
        } else {
            Alert("Unknown shader type (id = "+id1+")");
        }
    }

    shaderScript = document.getElementById(id2);
    if (shaderScript) {
        theSource = "";
        currentChild = shaderScript.firstChild;
        while(currentChild) {
            if (currentChild.nodeType == currentChild.TEXT_NODE) {
                theSource += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }
        if (shaderScript.type == "x-shader/x-fragment") {
            fragmentSource = theSource;
        } else if (shaderScript.type == "x-shader/x-vertex") {
            vertexSource = theSource;
        } else {
            Alert("Unknown shader type (id = "+id2+")");
        }
    }

    this.setShaderSource(vertexSource, fragmentSource);
};

GLShader.prototype.initAttrs = function() {
    this.attrib = {};
    var attrCount = this.gl.getProgramParameter(this.shaderProgram, this.gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < attrCount; i++){
        var attrInfo = this.gl.getActiveAttrib(this.shaderProgram, i);
        this.attrib[attrInfo.name] = new ShaderAttribute(this, 
            attrInfo.name, i, this.gl.getAttribLocation(this.shaderProgram, attrInfo.name),
            attrInfo.size, attrInfo.type, 
            SHADER_ATTR_TYPE_MAP[attrInfo.type].dataType,
            SHADER_ATTR_TYPE_MAP[attrInfo.type].arrayType,
            SHADER_ATTR_TYPE_MAP[attrInfo.type].itemSize);
        this.gl.enableVertexAttribArray(this.attrib[attrInfo.name].location);
    }
};

GLShader.prototype.initUniforms = function() {
    this.uniform = {};
    var uniformCount = this.gl.getProgramParameter(this.shaderProgram, this.gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < uniformCount; i++){
        var uniformInfo = this.gl.getActiveUniform(this.shaderProgram, i);
        this.uniform[uniformInfo.name] = new ShaderUniform(this, 
            uniformInfo.name, i, this.gl.getUniformLocation(this.shaderProgram, uniformInfo.name),
            uniformInfo.size, uniformInfo.type, 
            SHADER_ATTR_TYPE_MAP[uniformInfo.type].isMatrix,
            SHADER_ATTR_TYPE_MAP[uniformInfo.type].uniformMethod);
    }
};
