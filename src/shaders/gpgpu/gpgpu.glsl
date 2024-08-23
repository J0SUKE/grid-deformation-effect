void main()
{
    vec2 uv = gl_FragCoord.xy/resolution.xy;

    vec4 color = texture(uGrid,uv);
    
    gl_FragColor = color;
}