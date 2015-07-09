require(['jquery-2.1.0.min.js', 'sylvester.js', 'glutils.js'], function () {
    var CANVAS_WIDTH    = 512;
    var CANVAS_HEIGHT   = 512;
    var MAX_FADING      = 100;
    var POINT_SIZE      = 128;

    var gl                  = null;
    var shader              = null;
    var buffers             = {};
    var imageTexture        = null;
    var textureReady        = 0;
    var frameBufferTextures = [];
    var frameBufferIndex    = 0;
    var vertexMatrix            = Matrix.I(4);
    var textureClipMatrix       = Matrix.I(4);
    var textureStretchMatrix    = Matrix.Translation([0.5, 0.5, 0]).multiply(Matrix.Scale([0.5, 0.5, 1, 1]));
    var frag2ScreenMatrix       = Matrix.I(4);

    var vw      = CANVAS_WIDTH;
    var vh      = CANVAS_HEIGHT; 
    var fading  = 0;    
    var points  = [];
    var shapes  = [];
    var rectScreen  = new Rect(0, 0, vw, vh);

    var frameCount = 0;

    function initWebGL(canvas) {
        // 创建全局变量
        gl = null;
        var attr = {
            alpha : true,
            //antialias : true,
            premultipliedAlpha : true
        };
        try {
            // 尝试创建标准上下文，如果失败，回退到试验性上下文
            gl = canvas.getContext("webgl", attr) || canvas.getContext("experimental-webgl", attr);
        }
        catch(e) {}
        // 如果没有GL上下文，马上放弃
        if (!gl) {
            alert("Unable to initialize WebGL. Your browser may not support it.");
        }
        return gl;
    }

    function initShaders (gl) {
        shader = new GLShader(gl);
        shader.setShaderScript('shader-vs', 'shader-fs');
        window.console.log('attr: ' + gl.getProgramParameter(shader.shaderProgram, gl.ACTIVE_ATTRIBUTES));
        window.console.log('attr: ' + JSON.stringify(gl.getActiveAttrib(shader.shaderProgram, 0)));
        return shader;
    }

    function initTextures(gl) {
        imageTexture = new GLTexture(gl);
        imageTexture.loadImage('texture2.png', null, function () {
            textureReady ++;
        });
        frameBufferTextures.push(new GLFrameBufferTexture(gl, null, CANVAS_WIDTH, CANVAS_HEIGHT));
        frameBufferTextures.push(new GLFrameBufferTexture(gl, null, CANVAS_WIDTH, CANVAS_HEIGHT));
    }

    function initScene(gl) {
        if (gl) {  // 只有在 WebGL 可用的时候才继续
            gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // 设置擦除颜色为黑色，不透明
            gl.enable(gl.DEPTH_TEST);                               // 开启“深度测试”, Z-缓存
            gl.enable(gl.BLEND);
            gl.depthFunc(gl.LEQUAL);                                // 这里设置深度测试，满足（深度小或相等的时候才渲染）
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);      // 清除深度缓存的颜色
        }
    }

    function drawScene() {
        if (!textureReady){
            return;
        }

        frameBufferIndex = (frameBufferIndex + 1) % 2;
        var frontFrameBuffer = frameBufferTextures[frameBufferIndex % 2];
        var backFrameBuffer = frameBufferTextures[(frameBufferIndex + 1) % 2];
        // ---------------------------------------------------------------------
        frontFrameBuffer.begin();
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        backFrameBuffer.activeWith(shader, 0, "samplerBack");
        imageTexture.activeWith(shader, 1, "samplerFront");
        gl.uniformMatrix4fv(shader.uniform("vertexMatrix"), false, new Float32Array(vertexMatrix.flatten()));

        buffers.rectBack.bindAttrib(shader.attrib('vertexPosition'), 2);
        gl.uniformMatrix4fv(shader.uniform("textureMatrix"), false, new Float32Array(textureStretchMatrix.flatten()));
        gl.uniform1i(shader.uniform('flag'), 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        if (points.length) {
            gl.uniformMatrix4fv(shader.uniform("textureMatrix"), false, new Float32Array(textureClipMatrix.flatten()));
            gl.uniformMatrix4fv(shader.uniform("frag2ScreenMatrix"), false, new Float32Array(frag2ScreenMatrix.flatten()));
            gl.uniform1i(shader.uniform('flag'), 1);
            gl.uniform4f(shader.uniform('color'), 1.0, 1.0, 1.0, 1.0);
            gl.uniform1f(shader.uniform('pointSize'), POINT_SIZE);
            while(points.length){
                var cp          = points.shift();
                var shape       = shapes.shift();
                var shapeBuffer = shape.toFloatBuffer(gl);
                shapeBuffer.bindAttrib(shader.attrib('vertexPosition'), 2);
                gl.uniform2fv(shader.uniform('posVec'), cp);
                gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
                fading = MAX_FADING;
                shapeBuffer.delete();
            }
        }

        frontFrameBuffer.end();
        // ---------------------------------------------------------------------
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        frontFrameBuffer.activeWith(shader, 0, "samplerBack");
        imageTexture.activeWith(shader, 1, "samplerFront");
        gl.uniformMatrix4fv(shader.uniform("vertexMatrix"), false, new Float32Array(vertexMatrix.flatten()));
        gl.uniformMatrix4fv(shader.uniform("textureMatrix"), false, new Float32Array(textureStretchMatrix.flatten()));

        buffers.rectBack.bindAttrib(shader.attrib('vertexPosition'), 2);
        gl.uniform1i(shader.uniform('flag'), 2);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        // var rect = new Rect(0, 0, vw, vh);
        // var rectBuffer = rect.toFloatBuffer(gl);
        // rectBuffer.bindAttrib(shader.attrib('vertexPosition'), 2);
        // gl.uniformMatrix4fv(shader.uniform("textureMatrix"), false, new Float32Array(textureClipMatrix.flatten()));
        // gl.uniform1i(shader.uniform('flag'), 4);
        // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        // rectBuffer.delete();
        // ---------------------------------------------------------------------
        frameCount ++;
    }

    function refreshPage () {
        if (points.length > 0 || fading > 0){
            fading --;
            drawScene();
        }
        requestAnimationFrame(refreshPage);
    }

    function drawPoint (x, y) {
        points.push([x, y]);
        shapes.push(new Rect(x - POINT_SIZE/2, y - POINT_SIZE/2, x + POINT_SIZE/2, y + POINT_SIZE/2));
    }

    function onClick (event) {
        window.console.log('OnClick ' + event.pageX + ',' + event.pageY);
        drawPoint(event.pageX, event.pageY);
    }

    function onTouch (event) {
        event.preventDefault();
        for (var i=0; i<event.touches.length; i++){
            var touch = event.touches[i];
            window.console.log('Touch Start ' + touch.identifier + ' - ' + touch.pageX + ',' + touch.pageY);
            drawPoint(touch.pageX, touch.pageY);
        }
    }

    function showInfo () {
        $('#info_panel').text('FPS=' + frameCount);
        frameCount = 0;
    }

    function requestFullScreen () {
        var element = document.getElementById('glcanvas');
        var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

        if (requestMethod) 
            requestMethod.call(element);
    }

    function initEvents () {
        $(window).resize(function(){
            $("#glcanvas").width($(window).width() || '100%');
            $("#glcanvas").height($(window).height() || '100%');
            vw = $("#glcanvas").width();
            vh = $("#glcanvas").height();
            window.console.log('onSize w=' + vw + ' h=' + vh);
            rectScreen.left     = 0;
            rectScreen.top      = 0;
            rectScreen.right    = vw;
            rectScreen.bottom   = vh;
            if(buffers.rectBack){
                buffers.rectBack.delete();
            }
            buffers.rectBack = rectScreen.toFloatBuffer(gl, gl.STATIC_DRAW);
            vertexMatrix = Matrix.Translation([-1, 1, 0]).multiply(Matrix.Scale([2.0/vw, -2.0/vh, 1, 1]));
            if (vw > vh){
                textureClipMatrix = Matrix.Translation([0.5, 0.5, 0]).multiply(Matrix.Scale([0.5, vh/vw/2, 1, 1]));
            }else{
                textureClipMatrix = Matrix.Translation([0.5, 0.5, 0]).multiply(Matrix.Scale([vw/vh/2, 0.5, 1, 1]));
            }
            frag2ScreenMatrix   = Matrix.Translation([0, vh, 0]).multiply(Matrix.Scale([vw/CANVAS_WIDTH, -vh/CANVAS_HEIGHT, 1, 1]));
            if(gl){
                gl.viewport(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                drawScene();
            }
        });
        document.getElementById('glcanvas').addEventListener('click', onClick);
        document.getElementById('glcanvas').addEventListener('touchstart', onTouch);
        document.getElementById('glcanvas').addEventListener('touchmove', onTouch);
        document.getElementById('btn_fullscreen').addEventListener('click', requestFullScreen);
        document.addEventListener("fullscreenchange", function () {
            window.console.log('onFullscreenchange');
        }, false);
        document.addEventListener("mozfullscreenchange", function () {
            window.console.log('onMozfullscreenchange');
            $(window).resize();
        }, false);
        document.addEventListener("webkitfullscreenchange", function () {
            window.console.log('onWebkitfullscreenchange');
        }, false);
        window.setInterval(showInfo, 1000);
    }
    

    $(document).ready(function () {
        $('#glcanvas').attr('width', CANVAS_WIDTH);
        $('#glcanvas').attr('height', CANVAS_HEIGHT);
        initWebGL(document.getElementById("glcanvas"));      // 初始化 GL 上下文
        initShaders(gl);
        initTextures(gl);
        initScene(gl);
        initEvents();
        $(window).resize();
        refreshPage();
    });
});