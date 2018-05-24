var can;
var gl;
var vao;
var lastUpdate = Date.now();
var iTimeUniform;
var iResolutionUniform;
var interval = 2.0;
var globalTime = 0.0;
var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
out vec2 fragCoord;
// all shaders have a main function
void main() {

  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  fragCoord = a_position.xy;
  gl_Position = a_position;
}
`;

var fragmentShaderSource = `#version 300 es
precision highp float;
uniform float iTime;
uniform vec2 iResolution;
// we need to declare an output for the fragment shader
out vec4 fragColor;
in vec2 fragCoord;

const float HASHSCALE1 = 443.8975;
const vec3 HASHSCALE3 = vec3(443.897, 441.423, 437.195);
const vec4 HASHSCALE4 = vec4(443.897, 441.423, 437.195, 444.129);

const float PI= 3.141592654;

float hash11(float p)
{
	vec3 p3  = fract(vec3(p) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float hash12(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3)
{
	p3  = fract(p3 * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash21(float p)
{
	vec3 p3 = fract(vec3(p) * HASHSCALE3);
	p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx+p3.yz)*p3.zy);

}

vec2 hash22(vec2 p)
{
	vec3 p3 = fract(vec3(p.xyx) * HASHSCALE3);
    p3 += dot(p3, p3.yzx+19.19);
    return fract((p3.xx+p3.yz)*p3.zy);

}

vec2 hash23(vec3 p3)
{
	p3 = fract(p3 * HASHSCALE3);
    p3 += dot(p3, p3.yzx+19.19);
    return fract((p3.xx+p3.yz)*p3.zy);
}

vec3 hash31(float p)
{
   vec3 p3 = fract(vec3(p) * HASHSCALE3);
   p3 += dot(p3, p3.yzx+19.19);
   return fract((p3.xxy+p3.yzz)*p3.zyx); 
}


vec3 hash32(vec2 p)
{
	vec3 p3 = fract(vec3(p.xyx) * HASHSCALE3);
    p3 += dot(p3, p3.yxz+19.19);
    return fract((p3.xxy+p3.yzz)*p3.zyx);
}

vec3 hash33(vec3 p3)
{
	p3 = fract(p3 * HASHSCALE3);
    p3 += dot(p3, p3.yxz+19.19);
    return fract((p3.xxy + p3.yxx)*p3.zyx);

}

//----------------------------------------------------------------------------------------
// 4 out, 1 in...
vec4 hash41(float p)
{
	vec4 p4 = fract(vec4(p) * HASHSCALE4);
    p4 += dot(p4, p4.wzxy+19.19);
    return fract((p4.xxyz+p4.yzzw)*p4.zywx);
    
}

//----------------------------------------------------------------------------------------
// 4 out, 2 in...
vec4 hash42(vec2 p)
{
	vec4 p4 = fract(vec4(p.xyxy) * HASHSCALE4);
    p4 += dot(p4, p4.wzxy+19.19);
    return fract((p4.xxyz+p4.yzzw)*p4.zywx);

}

//----------------------------------------------------------------------------------------
// 4 out, 3 in...
vec4 hash43(vec3 p)
{
	vec4 p4 = fract(vec4(p.xyzx)  * HASHSCALE4);
    p4 += dot(p4, p4.wzxy+19.19);
    return fract((p4.xxyz+p4.yzzw)*p4.zywx);
}

//----------------------------------------------------------------------------------------
// 4 out, 4 in...
vec4 hash44(vec4 p4)
{
	p4 = fract(p4  * HASHSCALE4);
    p4 += dot(p4, p4.wzxy+19.19);
    return fract((p4.xxyz+p4.yzzw)*p4.zywx);
}




float noise(vec2 x) {
	vec2 i = floor(x);
	vec2 f = fract(x);

	// Four corners in 2D of a tile
	float a = hash12(i);
	float b = hash12(i + vec2(1.0, 0.0));
	float c = hash12(i + vec2(0.0, 1.0));
	float d = hash12(i + vec2(1.0, 1.0));


	// Same code, with the clamps in smoothstep and common subexpressions
	// optimized away.
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float pNoise(vec2 p, int res){
    mat2 m = mat2(0.8,-0.6,0.6,0.8);
	float persistance = .5;
    float lac = 2.;
	float f = 1.;
	float amp = 1.;
    float n = 0.;
    float normK = 0.;
	for (int i = 0; i<res; i++){
        normK += amp;
        n += amp*noise(p*f);
        p=m*p;
        f*=lac;
        amp*=persistance;
        
	}
	float nf = n/normK;
	return nf;
}

mat2 rotate2D(float angle)
{
    return mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
}

float billow(vec2 p, int res)
{	
    return abs(2.*pNoise(p,res)-1.);
    
}
float ridged(vec2 p, int res)
{
    return 1.-billow(p,res);
}






float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}
float pcurve( float x, float a, float b )
{
    float k = pow(a+b,a+b) / (pow(a,a)*pow(b,b));
    return k * pow( x, a ) * pow( 1.0-x, b );
}


//modification of this shape http://www.iquilezles.org/www/articles/distance/distance.htm
//Buffer 1
float galaxy(vec2 uv,float t)
{
    float r = length(uv);
    float theta = atan(uv.y,uv.x);
    float res = .1-(r-1.+.7*sin(t+5.*theta+15.*r));
    return res;// 1.-.1*length(uv);
    
}



vec4 buffer1(vec2 intermediateCoord )
{
    vec4 intermediateColor;
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (intermediateCoord+1.)/2.;
    float AR = iResolution.y/iResolution.x;
    uv -= vec2(.5);
    uv.x/=AR;
    uv *= 2.;
    //now uv is a square centered grid such that y=1 and y=-1 are the top and bottom of the screen
    //intermediateColor.x = mod(length(uv),1.);
    uv=rotate2D(0.2)*uv;
    
    vec2 Euv = uv;
    Euv.y *= 7.;
    vec2 Guv=uv*10.;
    Guv.y *= 7.;
    Guv /= 3.;
    float res = galaxy(Guv*.2,iTime);
    float G = clamp(res,0.,1.);
    float G2 = clamp(pow(res-.1,3.),0.,1.);
    
    
    
    float E = pow(1.-clamp(length(Euv/3.),0.,1.),2.);
    float ring=E;
    float ring2 = E;
    float core = 1./pow(length(uv),1.5);
    float galaxyNoise = pNoise(uv*3.,8);
    
	G =G*0.5+ 2.*(G+.2)*galaxyNoise;
    
    
    G2 =cubicPulse(.5,.8,G2);
    
    
    intermediateColor.rgb = G*vec3(0.3+pNoise(uv*8.,2))*vec3(67., 0., 145.)/255.;
    intermediateColor.rgb += (.1+.2*hash12(uv))*G2*vec3(1.,0.3,0.5);
    intermediateColor.rgb +=cubicPulse(0.5,0.2,ring)*vec3(.2);
    intermediateColor.rgb += cubicPulse(.9,0.05,ring2)*vec3(.5+.15*hash12(uv));
    intermediateColor.rgb += vec3(0.5,0,0)*core*galaxyNoise*0.2;
    intermediateColor.rgb -= length(uv/10.);
    intermediateColor.rgb = clamp(intermediateColor.rgb,0.,1.);
    return intermediateColor;
    
}


//Buffer 2

float getDensity(vec2 uv)
{
    uv.y *= 10./3.;
    return pow(length(uv)/20.,.8);
}

float star(vec2 uv,float rot)
{
    
    uv *= 10.;
    float p = .2;
    float r=length(uv);
    
    float theta = atan(uv.y,uv.x)+rot;
    return pow(1.-clamp(r-pow(pow(abs(cos(theta)),p)+pow(abs(sin(theta)),p),-1./p),0.,1.),12.);
    
}

vec4 starfield(vec2 uv)
{
    vec2 cellPos = floor(uv/.2);
    vec2 cellOffset = mod(hash22(cellPos)*123.534,.16)-vec2(.08);
    if(hash12(cellPos) > getDensity(cellPos))
    {
    	float s = star((mod(uv,.2)-vec2(.1)+cellOffset)*(0.5+3.*hash12(cellPos)),hash12(cellPos)*2314.);
    	return vec4(s)*(vec4(0.5)+0.5*abs(vec4(cos(hash12(cellPos)),sin(hash12(cellPos)),0,0)));
    }
    return vec4(0.);
}

vec4 buffer2(vec2 intermediateCoord )
{
    
    vec4 intermediateColor;
    vec2 uv = (intermediateCoord+1.)/2.;
    float AR = iResolution.y/iResolution.x;
    uv -= vec2(.5);
    uv.x/=AR;
    uv *= 2.;
    vec2 uv2=mat2(1.,0.,0.,0.3)*rotate2D(0.2)*vec2(uv.x,uv.y);
    uv=rotate2D(0.2)*uv;
    intermediateColor = starfield(uv*2.);
    intermediateColor.rgb += vec3(0.5)*star(uv2/3.,0.);
    
    return intermediateColor;
    
    
    
}

//buffer 3


    //http://www.iquilezles.org/www/articles/palettes/palettes.htm
vec4 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return vec4(a + b*cos( 6.28318*(c*t+d) ),1);
}


vec4 buffer3(vec2 intermediateCoord )
{
    vec4 intermediateColor;
    vec3 a=vec3(0.218, 0.786, 0.448);
    vec3 b=vec3(0.417, 0.158, 0.081);
    vec3 c=vec3(1.068, 1.648, 0.528);
    vec3 d=vec3(0.308, 1.826, 4.425);
    vec2 uv = (intermediateCoord+1.)/2.;
    float AR = iResolution.y/iResolution.x;
    uv -= vec2(.5);
    uv.x/=AR;
    uv *= 3.;
    uv=rotate2D(-0.2)*uv;
    float ridgeIntensity = pow(ridged(uv*5.,9)+pow(pNoise(uv*5.,9),3.),5.);
    float ridgePresence =pow(clamp(pNoise(uv*2.+vec2(10.,4.),8)-0.2,0.,1.),3.);
    
    
    intermediateColor = ridgeIntensity*ridgePresence*pal(pNoise(uv+vec2(6.3,1.75),8),a,b,c,d);
    return intermediateColor;
}

void main()
{
    vec2 IMC = fragCoord;
    fragColor=buffer1(IMC)+buffer2(IMC)+buffer3(IMC);
    fragColor.a=1.;
    
    
}
`;

function resizeCanvas() {
    var can = document.getElementById("my-canvas");
    can.style.width = window.innerWidth + "px";
    setTimeout(function () {
        can.style.height = window.innerHeight + "px";
    }, 0);
};

function createShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
    gl.deleteShader(shader);
    return undefined;
}

function createProgram(vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
    gl.deleteProgram(program);
    return undefined;
}
function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {

      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
  }

function draw(program) {
    var thisTime = Date.now()
    var dt = thisTime-lastUpdate;
    lastUpdate=thisTime;
    globalTime+=dt/1000.0;
    //console.log(globalTime);
    resize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);
    gl.uniform1f(iTimeUniform,globalTime);
    gl.uniform2f(iResolutionUniform,gl.canvas.width, gl.canvas.height);

    // draw
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
    setTimeout(() => {draw(program);
        
    }, interval);
}

function init() {
    // Webkit/Blink will fire this on load, but Gecko doesn't.
    window.onresize = resizeCanvas;

    // So we fire it manually...
    resizeCanvas();

    can = document.getElementById("my-canvas");
    gl = can.getContext("webgl2");
    if (!gl) {
        return;
    }
    //now create the shaders

    // create GLSL shaders, upload the GLSL source, compile the shaders
    var vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Link the two shaders into a program
    var program = createProgram(vertexShader, fragmentShader);

    // look up where the vertex data needs to go.
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // Create a buffer and put three 2d clip space points in it
    var positionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var positions = [
        -1, -1,
        -1, 1,
        1, -1,
        -1, 1,
        1, -1,
        1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a vertex array object (attribute state)
    vao = gl.createVertexArray();



    // and make it the one we're currently working with
    gl.bindVertexArray(vao);

    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);


    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


    iTimeUniform = gl.getUniformLocation(program, "iTime");
    iResolutionUniform = gl.getUniformLocation(program,"iResolution");

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    setTimeout(() => {draw(program);
        
    }, interval);

}