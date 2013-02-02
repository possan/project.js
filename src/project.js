(function(ns){

var Unwarp = function(opts) {
	this.options = opts || {};
	this.projectedleft = this.options.projectedleft || 0;
	this.projectedtop = this.options.projectedtop || 0;
	this.projectedwidth = this.options.projectedwidth || 100;
	this.projectedheight = this.options.projectedheight || 100;
	this.flatleft = this.options.flatleft || 0;
	this.flattop = this.options.flattop || 0;
	this.flatwidth = this.options.flatwidth || 100;
	this.flatheight = this.options.flatheight || 100;
	this.projectedCorner = [
		{ x: 0, y: 0 },
		{ x: 0, y: 0 },
		{ x: 0, y: 0 },
		{ x: 0, y: 0 }
	];
	this.projectedCorner = [
		{ x: this.projectedleft + 0, y: this.projectedtop + 0 },
		{ x: this.projectedleft + this.projectedwidth, y: this.projectedtop + 0 },
		{ x: this.projectedleft + this.projectedwidth, y: this.projectedtop + this.projectedheight },
		{ x: this.projectedleft + 0, y: this.projectedtop + this.projectedheight }
	];
	this.matrix = [ [1,0,0],[0,1,0], [0,0,1] ];
	this.invmatrix = [ [1,0,0],[0,1,0], [0,0,1] ];
	this.update();
}

Unwarp.prototype.getProjectedCornerBounds = function() {
	var bounds = {
		left: 99999,
		top: 99999,
		right: -99999,
		bottom: -99999
	};
	for (var i=0; i<4; i++) {
		if (this.projectedCorner[i].x < bounds.left) bounds.left = this.projectedCorner[i].x;
		if (this.projectedCorner[i].x > bounds.right) bounds.right = this.projectedCorner[i].x;
		if (this.projectedCorner[i].y < bounds.top) bounds.top = this.projectedCorner[i].y;
		if (this.projectedCorner[i].y > bounds.bottom) bounds.bottom = this.projectedCorner[i].y;
	}
	bounds.width = bounds.right - bounds.left;
	bounds.height = bounds.bottom - bounds.top;
	return bounds;
}

Unwarp.prototype.update = function() {

	// calculate unwarping matrix + reverse (projection matrix).

	var sub = 1.0;
	var div = 2.0;

	var hw = 1.0;
	var hh = 1.0;
	var hl = 0;
	var ht = 0;

	var scx = (this.projectedleft + this.projectedwidth) / 2.0;
	var scy = (this.projectedtop + this.projectedheight) / 2.0;

	hw = this.projectedwidth / div;
	hh = this.projectedheight / div;
	hl = 0; // this.projectedleft / div;
	ht = 0; // this.projectedtop / div;

	var t_x1 = ((this.projectedCorner[0].x-hl) / hw) - sub;
	var t_y1 = ((this.projectedCorner[0].y-ht) / hh) - sub;

	var t_x2 = ((this.projectedCorner[1].x-hl) / hw) - sub;
	var t_y2 = ((this.projectedCorner[1].y-ht) / hh) - sub;

	var t_x3 = ((this.projectedCorner[3].x-hl) / hw) - sub;
	var t_y3 = ((this.projectedCorner[3].y-ht) / hh) - sub;

	var t_x4 = ((this.projectedCorner[2].x-hl) / hw) - sub;
	var t_y4 = ((this.projectedCorner[2].y-ht) / hh) - sub;

	console.log(t_x1,t_y1);
	console.log(t_x2,t_y2);
	console.log(t_x3,t_y3);
	console.log(t_x4,t_y4);

	var coeff = [[0,0,0],[0,0,0],[0,0,0]];

    var dx1, dx2, dx3, dy1, dy2, dy3;

    dx1 = t_x2 - t_x4;
    dx2 = t_x3 - t_x4;
    dx3 = t_x1 - t_x2 + t_x4 - t_x3;

    dy1 = t_y2 - t_y4;
    dy2 = t_y3 - t_y4;
    dy3 = t_y1 - t_y2 + t_y4 - t_y3;

    if ((dx3 == 0.0) && (dy3 == 0.0))
    {
        coeff[0][0] = t_x2 - t_x1;
        coeff[0][1] = t_x4 - t_x2;
        coeff[0][2] = t_x1;
        coeff[1][0] = t_y2 - t_y1;
        coeff[1][1] = t_y4 - t_y2;
        coeff[1][2] = t_y1;
        coeff[2][0] = 0.0;
        coeff[2][1] = 0.0;
    }
    else
    {
        var det1, det2;

        det1 = dx3 * dy2 - dy3 * dx2;
        det2 = dx1 * dy2 - dy1 * dx2;

        coeff[2][0] = (det2 == 0.0) ? 1.0 : det1 / det2;

        det1 = dx1 * dy3 - dy1 * dx3;

        coeff[2][1] = (det2 == 0.0) ? 1.0 : det1 / det2;

        coeff[0][0] = t_x2 - t_x1 + coeff[2][0] * t_x2;
        coeff[0][1] = t_x3 - t_x1 + coeff[2][1] * t_x3;
        coeff[0][2] = t_x1;

        coeff[1][0] = t_y2 - t_y1 + coeff[2][0] * t_y2;
        coeff[1][1] = t_y3 - t_y1 + coeff[2][1] * t_y3;
        coeff[1][2] = t_y1;
    }

    coeff[2][2] = 1.0;

	console.log('projection matrix', JSON.stringify(coeff));
	this.matrix = coeff;

	function A(r,c) { return coeff[r][c]; }


	var determinant =
		+A(0,0)*(A(1,1)*A(2,2)-A(2,1)*A(1,2))
        -A(0,1)*(A(1,0)*A(2,2)-A(1,2)*A(2,0))
        +A(0,2)*(A(1,0)*A(2,1)-A(1,1)*A(2,0));

	var invdet = 1.0 / determinant;

	var result = [[0,0,0],[0,0,0],[0,0,0]];

	function R(r,c,v) { result[c][r] = v; };

	R(0,0, (A(1,1)*A(2,2)-A(2,1)*A(1,2))*invdet);
	R(1,0,-(A(0,1)*A(2,2)-A(0,2)*A(2,1))*invdet);
	R(2,0, (A(0,1)*A(1,2)-A(0,2)*A(1,1))*invdet);
	R(0,1,-(A(1,0)*A(2,2)-A(1,2)*A(2,0))*invdet);
	R(1,1, (A(0,0)*A(2,2)-A(0,2)*A(2,0))*invdet);
	R(2,1,-(A(0,0)*A(1,2)-A(1,0)*A(0,2))*invdet);
	R(0,2, (A(1,0)*A(2,1)-A(2,0)*A(1,1))*invdet);
	R(1,2,-(A(0,0)*A(2,1)-A(2,0)*A(0,1))*invdet);
	R(2,2, (A(0,0)*A(1,1)-A(1,0)*A(0,1))*invdet);

	console.log('inverted matrix', JSON.stringify(result));
	this.invmatrix = result;

}

Unwarp.prototype.projectedToFlat = function(u, v) {
	/*
		project from projectedspace to flatspace


			a11*j + a12*i + a13
		x = -------------------
			a31*j + a32*i + a33

			a21*j + a22*i + a23
		y = -------------------
			a31*j + a32*i + a33
	*/


	var coeff = this.invmatrix;

	var hsw = this.projectedwidth / 2;
	var hsh = this.projectedheight / 2;
	var htw = this.flatwidth / 1;
	var hth = this.flatheight / 1;
	var scx = (this.projectedleft * 0.0) + (this.projectedwidth * 0.5);
	var scy = (this.projectedtop * 0.0) + (this.projectedheight * 0.5);

	var u2 = (u - 1*scx) / scx;
	var v2 = (v - 1*scy) / scy;

	var xt = (coeff[0][0]*u2) + (coeff[0][1]*v2) + coeff[0][2];
	var yt = (coeff[1][0]*u2) + (coeff[1][1]*v2) + coeff[1][2];
	var di = (coeff[2][0]*u2) + (coeff[2][1]*v2) + coeff[2][2];

	return {
		x: (htw * xt) / di,
		y: (hth * yt) / di
	};
}

Unwarp.prototype.flatToProjected = function(tx, ty) {
	/*
		projects from flatspace to projectedspace

			a11*j + a12*i + a13
		x = -------------------
			a31*j + a32*i + a33

			a21*j + a22*i + a23
		y = -------------------
			a31*j + a32*i + a33
	*/
	var coeff = this.matrix;

	var hsw = this.projectedwidth / 2;
	var hsh = this.projectedheight / 2;
	var htw = this.flatwidth / 1;
	var hth = this.flatheight / 1;

	var u = (tx - 0*htw) / htw;
	var v = (ty - 0*hth) / hth;

	var xt = (coeff[0][0]*u) + (coeff[0][1]*v) + coeff[0][2];
	var yt = (coeff[1][0]*u) + (coeff[1][1]*v) + coeff[1][2];
	var di = (coeff[2][0]*u) + (coeff[2][1]*v) + coeff[2][2];

	return {
		x: hsw + (hsw * xt) / di,
		y: hsh + (hsh * yt) / di
	};
}

var CanvasUnwarp = function(options) {
	// helper method for brute force unwrapping content between canvases
	var options = options || {};
	this.projection = options.projection || null;
	this.projected = options.projected || null;
	this.flat = options.flat || null;
	this.flatleft = options.flatleft || 0;
	this.flattop = options.flattop || 0;
	this.flatwidth = options.flatwidth || 128;
	this.flatheight = options.flatheight || 128;

	this.buffer = options.buffer || null;

	if (options.bufferwidth || options.bufferheight) {
		this.bufferwidth = options.bufferwidth || 128;
		this.bufferheight = options.bufferheight || 128;
		this.bufferelement = document.createElement('canvas');
		this.bufferelement.width = this.bufferwidth;
		this.bufferelement.height = this.bufferheight;
		this.buffer = this.bufferelement.getContext('2d');
		if (options.bufferdebug) {
			document.body.appendChild(this.bufferelement);
		}
	}

	// this.usebuffer = false;
	// this.bufferwidth = options.bufferwidth || 128;
	// this.bufferheight = options.bufferheight || 128;
	if (this.buffer != null) {
		// this.buffer.width = this.bufferwidth;
		// this.buffer.height = this.bufferheight;
		this.projection.flatwidth = this.bufferwidth;
		this.projection.flatheight = this.bufferheight;
		this.projection.update();
	}
}

CanvasUnwarp.prototype.drawProjected = function() {
	// unwarp the contents of the projected quad into the entire flat canvas
	var p = this.projection;

	var bounds = p.getProjectedCornerBounds();

	if (this.buffer != null) {

		// copy to buffer...

		this.buffer.clearRect(0,0, this.bufferwidth, this.bufferheight);
		this.buffer.drawImage(this.flat, this.flatleft, this.flattop, this.flatwidth, this.flatheight, 0, 0, this.bufferwidth, this.bufferheight);


		var srcdata = this.buffer.getImageData(
			0,
			0,
			this.bufferwidth,
			this.bufferheight);

		var targdata = this.projected.getImageData(
			0,
			0,
			p.projectedwidth,
			p.projectedheight);

		var res = 1;
		for (var j=bounds.top; j<=bounds.bottom; j+=res) {
			for (var i=bounds.left; i<=bounds.right; i+=res) {
				var pp = p.projectedToFlat(i, j);
				var sx = Math.round(pp.x);
				var sy = Math.round(pp.y);
				var ot = 4 * (j * p.projectedwidth + i);
				if (sx >= 0 && sy >= 0 && sx < this.bufferwidth && sy < this.bufferheight) {
					var os = 4 * (sy * this.bufferwidth + sx);
					targdata.data[ot+0] = srcdata.data[os+0];
					targdata.data[ot+1] = srcdata.data[os+1];
					targdata.data[ot+2] = srcdata.data[os+2];
					targdata.data[ot+3] = srcdata.data[os+3];
				}
			}
		}

		this.projected.putImageData(targdata, 0, 0);

	} else {

		var srcdata = this.flat.getImageData(
			0,
			0,
			p.flatwidth,
			p.flatheight);

		var targdata = this.projected.getImageData(
			0,
			0,
			p.projectedwidth,
			p.projectedheight);

		var res = 1;
		for (var j=bounds.top; j<=bounds.bottom; j+=res) {
			for (var i=bounds.left; i<=bounds.right; i+=res) {
				var pp = p.projectedToFlat(i, j);
				var sx = Math.round(pp.x);
				var sy = Math.round(pp.y);
				var ot = 4 * (j * p.projectedwidth + i);
				if (sx >= 0 && sy >= 0 && sx < p.flatwidth && sy < p.flatheight) {
					var os = 4 * (sy * p.flatwidth + sx);
					targdata.data[ot+0] = srcdata.data[os+0];
					targdata.data[ot+1] = srcdata.data[os+1];
					targdata.data[ot+2] = srcdata.data[os+2];
					targdata.data[ot+3] = srcdata.data[os+3];
				}
			}
		}
		this.projected.putImageData(targdata, 0, 0);
	}


}

CanvasUnwarp.prototype.drawFlat = function() {
	// unwarp the contents of the projected quad into the entire flat canvas
	var p = this.projection;

	this.flat.clearRect(
		0,
		0,
		p.flatwidth,
		p.flatheight);

	var srcdata = this.projected.getImageData(
		0,
		0,
		p.projectedwidth,
		p.projectedheight);

	var targdata = this.flat.getImageData(
		0,
		0,
		p.flatwidth,
		p.flatheight);

	var res = 1;
	for (var j=0; j<p.flatheight; j+=res) {
		for (var i=0; i<p.flatwidth; i+=res) {
			var pp = p.flatToProjected(i, j);
			var sx = Math.round(pp.x);
			var sy = Math.round(pp.y);
			var ot = 4 * (j * p.flatwidth + i);
			if (sx >= 0 && sy >= 0 && sx < p.projectedwidth && sy < p.projectedheight) {
				var os = 4 * (sy * p.projectedwidth + sx);
				targdata.data[ot+0] = srcdata.data[os+0];
				targdata.data[ot+1] = srcdata.data[os+1];
				targdata.data[ot+2] = srcdata.data[os+2];
				targdata.data[ot+3] = srcdata.data[os+3];
			}
		}
	}

	this.flat.putImageData(targdata, 0, 0);
}

CanvasUnwarp.prototype.cross = function(ctx, x, y, radii, lineWidth) {
	ctx.lineWidth = lineWidth;
	ctx.beginPath();
	ctx.moveTo(x, y-radii);
	ctx.lineTo(x, y+radii);
	ctx.moveTo(x-radii, y);
	ctx.lineTo(x+radii, y);
	ctx.closePath();
	ctx.stroke();
}

CanvasUnwarp.prototype.drawProjectedDebug = function(ctx) {
	ctx.strokeStyle = '#f0f';
	for (var c=0; c<4; c++) {
		this.cross(ctx, this.projection.projectedCorner[c].x, this.projection.projectedCorner[c].y, 10, 3);
	}
}

CanvasUnwarp.prototype.drawFlatDebug = function(ctx) {
	ctx.strokeStyle = '#ff0';
	if (this.buffer != null) {
		this.cross(ctx, this.flatleft, this.flattop, 10, 3);
		this.cross(ctx, this.flatleft + this.flatwidth, this.flattop, 10, 3);
		this.cross(ctx, this.flatleft + this.flatwidth, this.flattop + this.flatheight, 10, 3);
		this.cross(ctx, this.flatleft, this.flattop+ this.flatheight, 10, 3);
	} else {
		this.cross(ctx, this.projection.flatleft, this.projection.flattop, 10, 3);
		this.cross(ctx, this.projection.flatleft + this.projection.flatwidth, this.projection.flattop, 10, 3);
		this.cross(ctx, this.projection.flatleft + this.projection.flatwidth, this.projection.flattop + this.projection.flatheight, 10, 3);
		this.cross(ctx, this.projection.flatleft, this.projection.flattop+ this.projection.flatheight, 10, 3);
	}
}



glMatrixArrayType=typeof Float32Array!="undefined"?Float32Array:typeof WebGLFloatArray!="undefined"?WebGLFloatArray:Array;
var mat4={};
mat4.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;return a};
mat4.create=function(a){var b=new glMatrixArrayType(16);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15]}return b};
mat4.ortho=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2/i;f[6]=0;f[7]=0;f[8]=0;f[9]=0;f[10]=-2/j;f[11]=0;f[12]=-(a+b)/h;f[13]=-(d+c)/i;f[14]=-(g+e)/j;f[15]=1;return f};


window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(callback, element) {
           window.setTimeout(callback, 1000/60);
         };
})();






WebGLUnwarp = function(options) {
	this.projection = options.projection || null;
	this.projected = options.projected || null;
	this.flat = options.flat || null;
	this.flatleft = options.flatleft || 0;
	this.flattop = options.flattop || 0;
	this.flatwidth = options.flatwidth || 1.0;
	this.flatheight = options.flatheight || 1.0;
	this.texture = options.texture || null;
	this.cubeVertexPositionBuffer = null;
	this.cubeVertexTextureCoordBuffer = null;
	this.cubeVertexIndexBuffer = null;
	this.allocated = false;
	this.resolution = options.resolution || 15;
}

WebGLUnwarp.prototype.createFragmentShader = function(gl) {
	var str =
		'precision mediump float;\n'+
		'varying vec2 vTextureCoord;\n'+
		'uniform sampler2D uSampler;\n'+
		'void main(void) {\n'+
		'\tgl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n'+
		'}';
	var shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
	return shader;
}

WebGLUnwarp.prototype.createVertexShader = function(gl) {
	var str =
		'attribute vec3 aVertexPosition;\n'+
	    'attribute vec2 aTextureCoord;\n'+
	    'uniform mat4 uMVMatrix;\n'+
	    'uniform mat4 uPMatrix;\n'+
	    'varying vec2 vTextureCoord;\n'+
	    'void main(void) {\n'+
	    '\tgl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n'+
	    '\tvTextureCoord = aTextureCoord;\n'+
	    '}';
	var shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    	alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

WebGLUnwarp.prototype.mapuv = function(u,v) {
	return {
		u: u * this.flatwidth + this.flatleft,
		v: v * this.flatheight + this.flattop
	}
}

WebGLUnwarp.prototype.drawProjected = function() {
	var gl = this.projected;
	var p = this.projection;

	if (!this.allocated) {
        this.cubeVertexPositionBuffer = gl.createBuffer();
        this.cubeVertexTextureCoordBuffer = gl.createBuffer();
        this.cubeVertexIndexBuffer = gl.createBuffer();

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, this.createVertexShader(gl));
        gl.attachShader(this.shaderProgram, this.createFragmentShader(gl));
        gl.linkProgram(this.shaderProgram);
		if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
			alert("Could not link the shader program!");
			return;
		}

        // gl.useProgram(this.shaderProgram);

        this.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        this.textureCoordAttribute = gl.getAttribLocation(this.shaderProgram, "aTextureCoord");

        this.pMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uPMatrix");
        this.mvMatrixUniform = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
        this.samplerUniform = gl.getUniformLocation(this.shaderProgram, "uSampler");

        this.allocated = true;
	}



    var vertices = [];
    var textureCoords = [];
    var cubeVertexIndices = [];

    var idx = 0;

    var usteps = this.resolution;
    var vsteps = this.resolution;

    for (var vi=0; vi<vsteps; vi++) {
        for (var ui=0; ui<usteps; ui++) {
            var u0 = ui / usteps;
            var v0 = vi / vsteps;
            var u1 = (ui+1.0) / usteps;
            var v1 = (vi+1.0) / vsteps;

            var c0 = this.projection.flatToProjected(100.0 * u0, 100.0 * v0);
            var c1 = this.projection.flatToProjected(100.0 * u1, 100.0 * v0);
            var c2 = this.projection.flatToProjected(100.0 * u1, 100.0 * v1);
            var c3 = this.projection.flatToProjected(100.0 * u0, 100.0 * v1);

            vertices.push(c0.x);
            vertices.push(c0.y);
            vertices.push(0.0);

            vertices.push(c1.x);
            vertices.push(c1.y);
            vertices.push(0.0);

            vertices.push(c2.x);
            vertices.push(c2.y);
            vertices.push(0.0);

            vertices.push(c3.x);
            vertices.push(c3.y);
            vertices.push(0.0);

            var uv0 = this.mapuv(u0, 1-v0);
            var uv1 = this.mapuv(u1, 1-v0);
            var uv2 = this.mapuv(u1, 1-v1);
            var uv3 = this.mapuv(u0, 1-v1);

            textureCoords.push(uv0.u);
            textureCoords.push(uv0.v);

            textureCoords.push(uv1.u);
            textureCoords.push(uv1.v);

            textureCoords.push(uv2.u);
            textureCoords.push(uv2.v);

            textureCoords.push(uv3.u);
            textureCoords.push(uv3.v);

            cubeVertexIndices.push(idx*4+0);
            cubeVertexIndices.push(idx*4+1);
            cubeVertexIndices.push(idx*4+2);

            cubeVertexIndices.push(idx*4+0);
            cubeVertexIndices.push(idx*4+2);
            cubeVertexIndices.push(idx*4+3);

            idx ++;
        }
    }

    gl.useProgram(this.shaderProgram);

    gl.enableVertexAttribArray(this.vertexPositionAttribute);
    gl.enableVertexAttribArray(this.textureCoordAttribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.cubeVertexPositionBuffer.itemSize = 3;
    this.cubeVertexPositionBuffer.numItems = vertices.length / 1;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    this.cubeVertexTextureCoordBuffer.itemSize = 2;
    this.cubeVertexTextureCoordBuffer.numItems = textureCoords.length / 1;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cubeVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    this.cubeVertexIndexBuffer.itemSize = 1;
    this.cubeVertexIndexBuffer.numItems = cubeVertexIndices.length / 1;


    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();
    mat4.identity(pMatrix);
    mat4.ortho(0,p.projectedwidth,p.projectedheight,0,-1,1,pMatrix);
    mat4.identity(mvMatrix);

    gl.uniformMatrix4fv(this.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(this.mvMatrixUniform, false, mvMatrix);


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexPositionBuffer);
    gl.vertexAttribPointer(this.vertexPositionAttribute, this.cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(this.textureCoordAttribute, this.cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cubeVertexIndexBuffer);

    gl.drawElements(gl.TRIANGLES, this.cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);



}











var Project = {};
Project.Unwarp = Unwarp;
Project.Warp = Unwarp;
Project.CanvasUnwarp = CanvasUnwarp;
Project.CanvasWarp = CanvasUnwarp;
Project.WebGLUnwarp = WebGLUnwarp;
Project.WebGLWarp = WebGLUnwarp;
ns.Project = Project;

})(this);