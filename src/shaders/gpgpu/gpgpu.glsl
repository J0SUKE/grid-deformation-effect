uniform vec2 uMouse;
uniform vec2 uDeltaMouse;
uniform float uMouseMove;
uniform float uGridSize;
uniform float uRelaxation;
uniform float uDistance;


void main()
{
    vec2 uv = gl_FragCoord.xy/resolution.xy;

    vec4 color = texture(uGrid,uv);

    float dist = distance(uv,uMouse);
    dist = 1.-(smoothstep(0.,uDistance/uGridSize,dist));


    vec2 delta = uDeltaMouse;

    color.rg+=delta*dist;
    color.rg*=min(uRelaxation,uMouseMove);
    

    gl_FragColor = color;
}