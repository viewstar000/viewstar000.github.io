function GLShader(glContext){
    this.gl = glContext;
}

GLShader.prototype.gl               = null;
GLShader.prototype.vertexShader     = null;
GLShader.prototype.fragmentShader   = null;
GLShader.prototype.shaderProgram    = null;
GLShader.prototype.__attrib         = {};
GLShader.prototype.__uniform        = {};

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

GLShader.prototype.attrib = function(name){
    if (this.__attrib[name]){
        return this.__attrib[name];
    }else{
        this.__attrib[name] = this.gl.getAttribLocation(this.shaderProgram, name);
        this.gl.enableVertexAttribArray(this.__attrib[name]);
        return this.__attrib[name];
    }
};

GLShader.prototype.uniform = function(name){
    if (this.__uniform[name]){
        return this.__uniform[name];
    }else{
        this.__uniform[name] = this.gl.getUniformLocation(this.shaderProgram, name);
        return this.__uniform[name];
    }
}