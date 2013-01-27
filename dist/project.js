(function(ns){

var Unwarp = function(opts) {
	this.options = opts || {};
	this.sourcewidth = this.options.sourcewidth || 100;
	this.sourceheight = this.options.sourceheight || 100;
	this.targetwidth = this.options.targetwidth || 100;
	this.targetheight = this.options.targetheight || 100;
	this.corner = [
		{ x: 0, y: 0 },
		{ x: this.sourcewidth, y: 0 },
		{ x: this.sourcewidth, y: this.sourceheight },
		{ x: 0, y: this.sourceheight }
	];
	this.matrix = [ [1,0,0],[0,1,0], [0,0,1] ];
	this.invmatrix = [ [1,0,0],[0,1,0], [0,0,1] ];
	this.update();
}

Unwarp.prototype.update = function() {

	// calculate unwarping matrix + reverse (projection matrix).

	var sub = 1.0;
	var div = 2.0;

	var hw = this.sourcewidth / div;
	var hh = this.sourceheight / div;

	var t_x1 = (this.corner[0].x / hw) - sub;
	var t_y1 = (this.corner[0].y / hh) - sub;
	var t_x2 = (this.corner[1].x / hw) - sub;
	var t_y2 = (this.corner[1].y / hh) - sub;
	var t_x3 = (this.corner[3].x / hw) - sub;
	var t_y3 = (this.corner[3].y / hh) - sub;	
	var t_x4 = (this.corner[2].x / hw) - sub;
	var t_y4 = (this.corner[2].y / hh) - sub;

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

	// console.log('projection matrix', JSON.stringify(coeff));
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

	// console.log('inverted matrix', JSON.stringify(result));
	this.invmatrix = result;

}

Unwarp.prototype.project = function(u, v) {
	/*
		project from sourcespace to targetspace


			a11*j + a12*i + a13
		x = -------------------
			a31*j + a32*i + a33

			a21*j + a22*i + a23
		y = -------------------
			a31*j + a32*i + a33
	*/

	var coeff = this.invmatrix;

	var hsw = this.sourcewidth / 2;
	var hsh = this.sourceheight / 2; 
	var htw = this.targetwidth / 1;
	var hth = this.targetheight / 1;
	
	var u2 = (u - 1*hsw) / hsw;
	var v2 = (v - 1*hsh) / hsh;

	var xt = (coeff[0][0]*u2) + (coeff[0][1]*v2) + coeff[0][2]; 
	var yt = (coeff[1][0]*u2) + (coeff[1][1]*v2) + coeff[1][2]; 
	var di = (coeff[2][0]*u2) + (coeff[2][1]*v2) + coeff[2][2]; 

	return {
		x: (htw * xt) / di, 
		y: (hth * yt) / di
	};
}

Unwarp.prototype.reverse = function(tx, ty) {
	/*
		projects from targetspace to sourcespace

			a11*j + a12*i + a13
		x = -------------------
			a31*j + a32*i + a33

			a21*j + a22*i + a23
		y = -------------------
			a31*j + a32*i + a33
	*/

	var coeff = this.matrix;

	var hsw = this.sourcewidth / 2;
	var hsh = this.sourceheight / 2;
	var htw = this.targetwidth / 1;
	var hth = this.targetheight / 1;

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
	// helper method for unwrapping content between canvases
	var options = options || {};
	this.projection = options.projection || null;
	this.source = options.source || null;
	this.target = options.target || null;
}

CanvasUnwarp.prototype.draw = function() {
	// unwarp the contents of the source quad into the entire target canvas
	var p = this.projection;

	this.target.clearRect(
		0,
		0,
		p.targetwidth,
		p.targetheight);

	var orig = this.source.getImageData(
		0,
		0,
		p.sourcewidth,
		p.sourceheight);

	var data = this.target.getImageData(
		0,
		0,
		p.targetwidth,
		p.targetheight);

	var res = 1;
	for (var j=0; j<p.targetheight; j+=res) {
		for (var i=0; i<p.targetwidth; i+=res) {
			var pp = p.reverse(i, j);
			var ot = 4 * (j * p.targetwidth + i);
			var os = 4 * (Math.round(pp.y) * p.sourcewidth + Math.round(pp.x));
			data.data[ot+0] = orig.data[os+0];
			data.data[ot+1] = orig.data[os+1];
			data.data[ot+2] = orig.data[os+2];
			data.data[ot+3] = orig.data[os+3];
		}
	}

	this.target.putImageData(data, 0, 0);
}

var Project = {};
Project.Unwarp = Unwarp;
Project.CanvasUnwarp = CanvasUnwarp;
ns.Project = Project;

})(this);