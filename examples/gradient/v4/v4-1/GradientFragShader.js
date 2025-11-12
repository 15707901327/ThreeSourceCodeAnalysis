/**
 * @author Mif /  Made on September 25, 2020/
 */

let GradientFragShader =
  `

varying vec4 v_position;

uniform vec3 color;
uniform float alpha;
uniform vec2 center;
uniform float arr[UNROLLED_LOOP_INDEX];

float getDistance(vec2 A, vec2 B, vec2 C){

    vec2 a = C-A;
    vec2 b = B-A;
    vec2 c = dot(a, b) * b / (length(b) * length(b)); 
    float d = length(a - c);

    return d;

}

void main() {

    vec2 V = vec2(v_position.xy); 

    vec2 vs[9];
    vs[0] = vec2(V);
    vs[1] = vec2(V.x - 1.0, V.y + 1.0);
    vs[2] = vec2(V.x, V.y + 1.0);
    vs[3] = vec2(V.x + 1.0, V.y + 1.0);
    vs[4] = vec2(V.x - 1.0, V.y);
    vs[5] = vec2(V.x + 1.0, V.y);
    vs[6] = vec2(V.x - 1.0, V.y - 1.0);
    vs[7] = vec2(V.x, V.y - 1.0);
    vs[8] = vec2(V.x + 1.0, V.y - 1.0);

    float as[9];
    for(int i = 0; i < 9; i++){
        as[i] = 1.0;
    }
    
    #pragma unroll_loop_start

    for(int a = 0; a < 9; a++){

        for(int i = 0; i < UNROLLED_LOOP_INDEX - 2; i += 2 ){

            vec2 A = vec2(arr[i], arr[i+1]);
            vec2 B = vec2(arr[i+2], arr[i+3]);
    
            float cd = getDistance(A, B, center);
            float vd = getDistance(A, B, V);
            
            vec2 AV = A - vs[a];
            vec2 AB = A - B;
            float dotVAB = dot(AV, AB);
            
            vec2 BV = B - vs[a];
            vec2 BA = B - A;
            float dotVBA = dot(BV, BA);
            
            if(vd <= cd && dotVAB >= 0.0 && dotVBA >= 0.0){
                as[a] *= smoothstep(0.0, cd, vd); 
            }
    
        }
        
    }
    
    #pragma unroll_loop_end

    float gradientAlpha = (as[0] * 1.2 + as[1] * 0.8 + as[2] * 0.8 + as[3] * 0.8 + as[4] * 0.8 + as[5] * 0.8 + as[6] * 0.8 + as[7] * 0.8 + as[8]) / 9.0;
    gradientAlpha = as[0];
    
    //gradientAlpha *= log(gradientAlpha + 0.001) + 1.0; 

    gl_FragColor = vec4(color, alpha * gradientAlpha);
}

 `;

export { GradientFragShader }