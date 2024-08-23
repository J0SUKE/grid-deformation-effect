uniform sampler2D uTexture;
uniform sampler2D uGrid;

varying vec2 vUv;
uniform vec2 uContainerResolution;
uniform vec2 uImageResolution;


vec2 coverUvs(vec2 imageRes,vec2 containerRes)
{
    float imageAspectX = imageRes.x/imageRes.y;
    float imageAspectY = imageRes.y/imageRes.x;
    
    float containerAspectX = containerRes.x/containerRes.y;
    float containerAspectY = containerRes.y/containerRes.x;

    vec2 ratio = vec2(
        min(containerAspectX / imageAspectX, 1.0),
        min(containerAspectY / imageAspectY, 1.0)
    );

    vec2 newUvs = vec2(
        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    return newUvs;
}


void main()
{
    vec2 newUvs = coverUvs(uImageResolution,uContainerResolution);            
    vec2 squareUvs = coverUvs(vec2(1.),uContainerResolution);
    
    vec4 image = texture2D(uTexture,newUvs);    
    vec4 displacement = texture2D(uGrid,squareUvs);

    gl_FragColor = displacement;
}