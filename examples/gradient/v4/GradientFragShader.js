/**
 * @author Mif /  Made on September 25, 2020/
 */

let GradientFragShader = `

varying vec4 v_position;

uniform vec3 color;
uniform float alpha;
uniform vec2 center;
uniform float arr[UNROLLED_LOOP_INDEX];

float getDistance(vec2 a, vec2 b, vec2 c){
  return (abs((b.y - a.y) * c.x +(a.x - b.x) * c.y + ((b.x * a.y) -(a.x * b.y)))) / (sqrt(pow(b.y - a.y, 2.0) + pow(a.x - b.x, 2.0)));
}

void main() {

  vec2 v = vec2(v_position.xy); // 模型坐标
  float gradientAlpha = 1.0;
 
  #pragma unroll_loop_start
  for(int i = 0; i < UNROLLED_LOOP_INDEX - 2; i += 2 ){
     vec2 A = vec2(arr[i], arr[i+1]);
     vec2 B = vec2(arr[i+2], arr[i+3]);
     
     float cd = getDistance(A, B, center); // 中点与边的距离
     float vd = getDistance(A, B, v); // 点与边的交点距离
     
     if(vd < cd){
       gradientAlpha *= smoothstep(0.0, cd, vd);
     }
  }
  #pragma unroll_loop_end

  gl_FragColor = vec4(color, alpha * gradientAlpha);
}
 `;

export { GradientFragShader }