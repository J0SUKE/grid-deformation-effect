uniform sampler2D uTexture;
uniform sampler2D uGrid;
varying vec2 vUv;

uniform vec2 uContainerResolution;
uniform float uDisplacement;
uniform vec2 uImageResolution;
uniform vec2 uRGBshift;


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


float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

void main()
{
    vec2 newUvs = coverUvs(uImageResolution,uContainerResolution);
    
    
    vec2 squareUvs = coverUvs(vec2(1.),uContainerResolution);
    
    vec4 image = texture2D(uTexture,newUvs);
    vec4 displacement = texture2D(uGrid,squareUvs);

    vec2 finalUvs = newUvs - displacement.rg*0.01;
    
    vec4 finalImage = texture2D(uTexture,finalUvs);

    //rgb shift
    vec2 redUvs = finalUvs;
    vec2 blueUvs = finalUvs;
    vec2 greenUvs = finalUvs;    


    vec2 shift = displacement.rg*0.001;

    float displacementStrengh=length(displacement.rg);
    displacementStrengh = clamp(displacementStrengh,0.,2.);
    
    float redStrengh = 1.+displacementStrengh*0.25;
    redUvs += shift*redStrengh;    
    
    float blueStrengh = 1.+displacementStrengh*1.5;
    blueUvs += shift*blueStrengh; 
    
    float greenStrengh = 1.+displacementStrengh*2.;
    greenUvs += shift*greenStrengh;
    
    float red = texture2D(uTexture,redUvs).r;
    float blue = texture2D(uTexture,blueUvs).b;    
    float green = texture2D(uTexture,greenUvs).g;        


    finalImage.r =red;
    finalImage.g =green;
    finalImage.b =blue;

    vec4 visualDisplacement = displacement;
    visualDisplacement*=0.5;
    visualDisplacement+=0.5;    
    
    vec4 final = step(0.5,uDisplacement)*visualDisplacement + (1.-step(0.5,uDisplacement))*finalImage;

    gl_FragColor = final;

    //#include <tonemapping_fragment>
    //#include <colorspace_fragment>
}