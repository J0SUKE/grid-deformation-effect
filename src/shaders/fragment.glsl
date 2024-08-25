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

    vec2 finalUvs = newUvs - displacement.rg*0.01;
    
    vec4 finalImage = texture2D(uTexture,finalUvs);


    /* 
    * rgb shift 
    */

    //separate set of UVs for each color
    vec2 redUvs = finalUvs;
    vec2 blueUvs = finalUvs;
    vec2 greenUvs = finalUvs;    

    //The shift will follow the displacement direction but with a reduced intensity, 
    //we need the effect to be subtle
    vec2 shift = displacement.rg*0.001;

    //The shift strength will depend on the speed of the mouse move, 
    //since the intensity rely on deltaMouse we just have to use the length of the (red,green) vector    
    float displacementStrength=length(displacement.rg);
    displacementStrength = clamp(displacementStrength,0.,2.);
    
    //We apply different strengths to each color
    
    float redStrength = 1.+displacementStrength*0.25;
    redUvs += shift*redStrength;    
    
    float blueStrength = 1.+displacementStrength*1.5;
    blueUvs += shift*blueStrength; 
    
    float greenStrength = 1.+displacementStrength*2.;
    greenUvs += shift*greenStrength;


    float red = texture2D(uTexture,redUvs).r;
    float blue = texture2D(uTexture,blueUvs).b;    
    float green = texture2D(uTexture,greenUvs).g; 

    //we apply the shift effect to our image
    finalImage.r =red;
    finalImage.g =green;
    finalImage.b =blue;


    gl_FragColor = finalImage;
}