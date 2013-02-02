(function(ns){

var Unwarp = function(opts) {
	this.options = opts || {};
	this.projectedleft = this.options.projectedleft || 0;
	this.projectedtop = this.options.projectedtop || 0;
	this.projectedstride = this.options.projectedstride || 100;
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


var Project = {};
Project.Unwarp = Unwarp;
Project.Warp = Unwarp;
Project.CanvasUnwarp = CanvasUnwarp;
Project.CanvasWarp = CanvasUnwarp;
ns.Project = Project;

})(this);