/**
 * @author Mif /  Made on September 25, 2020/
 */

let GradientFragShader = `

varying vec4 v_position;

uniform vec3 color;
uniform float alpha;
uniform vec2 center;
uniform float arr[UNROLLED_LOOP_INDEX];
uniform float widthScale;

/**
 * 获取两条线线的交点
 * a,b 线上两点
 * c,d 线上两点
 */
vec2 getIntersection(vec2 a, vec2 b, vec2 c, vec2 d) {

	vec2 intersection = vec2(0.0,0.0);
  intersection.x = ((b.x - a.x) * (c.x - d.x) * (c.y - a.y) - c.x * (b.x - a.x) * (c.y - d.y) + a.x * (b.y - a.y) * (c.x - d.x)) / ((b.y - a.y) * (c.x - d.x) - (b.x - a.x) * (c.y - d.y));
  intersection.y = ((b.y - a.y) * (c.y - d.y) * (c.x - a.x) - c.y* (b.y - a.y) * (c.x - d.x) + a.y * (b.x - a.x) * (c.y - d.y))/ ((b.x - a.x) * (c.y - d.y) - (b.y - a.y) * (c.x - d.x));
  
  return intersection;
}

/**
 * 获取两条线线的交点
 * a,b 线上两点
 * c,d 线上两点
 */
bool isIntersection(vec2 a, vec2 b, vec2 c, vec2 d) {
  vec2 ab = a - b;
  vec2 cd = c - d;

  if(abs(ab.y * cd.x - ab.x * cd.y) < 0.00001){
    return false;
  }
  return true;
}

/**
 * c点到垂线的向量
 */
vec2 verticalVector(vec2 A, vec2 B, vec2 C){

    vec2 ac = C - A;
    vec2 ab = B - A;
    // A到垂点向量
    vec2 ad = dot(ac, ab) * ab / (length(ab) * length(ab)); 
 
    return ac - ad;
}

/**
 * 获取点到直线的垂直距离
 */
float getDistance1(vec2 a, vec2 b, vec2 c){
  return length(verticalVector(a, b, c));
}

/**
 * 获取点到直线的垂直距离
 */
float getDistance(vec2 a, vec2 b, vec2 c){
  return (abs((b.y - a.y) * c.x +(a.x - b.x) * c.y + ((b.x * a.y) -(a.x * b.y)))) / (sqrt(pow(b.y - a.y, 2.0) + pow(a.x - b.x, 2.0)));
}

/**
  @brief 根据两点求出垂线过第三点的直线的交点
  @param pt1 直线上的第一个点
  @param pt2 直线上的第二个点
  @param c 垂线上的点
  @return 返回点到直线的垂直交点坐标
  */
vec2 calculateVerticalPoint(vec2 pt1, vec2 pt2, vec2 c)
{
    vec2 dc = verticalVector(pt1, pt2, c);
    vec2 d = c - dc;
    return d;
}

/**
 * 获取两点间距离
 */
float getTwoPointDistance(vec2 a, vec2 b){
  return sqrt(pow(a.x - b.x, 2.0) + pow(a.y - b.y, 2.0));
}

/**
* 判断向量是否同向
*/
bool isSameDirection(vec2 v, vec2 d, vec2 p) {
  vec2 vd = d - v;
  vec2 vp = p - v;
  float cos = dot(vd, vp);
  if (cos > 0.0) {
    return true;
  }

  if (cos < 0.0) {
    return false;
  }
}

/**
 * 判断点是否在线段上
 */
bool isOnLine(vec2 A, vec2 B, vec2 V) {
  vec2 av = V - A;
  vec2 ab = B - A;
  
  float cosvab = dot(av, ab);
  
  vec2 bv = V - B;
  vec2 ba = A - B;
  
  float cosvba = dot(bv, ba);
  
  if(cosvab >= 0.0 && cosvba >= 0.0){
    return true;
  } else{
    return false;
  }
}

void main() {
  
  vec3 a_color = color;

  vec2 v = vec2(v_position.xy); // 模型坐标
  float gradientAlpha = 1.0;
  float gradientAlpha2 = 1.0;
  float gradientAlpha3 = 1.0;
 
  int count = 0;
  int count3 = 0;
  
  // 计算点与所有边的垂线
  #pragma unroll_loop_start
  for(int i = 0; i < UNROLLED_LOOP_INDEX - 2; i += 2 ){
     vec2 A = vec2(arr[i], arr[i+1]);
     vec2 B = vec2(arr[i+2], arr[i+3]);
     
     // 获取垂点坐标
     vec2 d = calculateVerticalPoint(A, B, v);
     // 给定点与垂点距离
     float vd = getTwoPointDistance(v, d); 
     
     // 判断垂点是否在线上
     if(isOnLine(A, B, v)){
     
       vec2 minP1 = vec2(0.0, 0.0);
       float minP1Distance = 0.0;
       vec2 minP2 = vec2(0.0, 0.0);
       float minP2Distance = 0.0;
       
       vec2 minP3 = vec2(0.0, 0.0);
       float minP3Distance = 0.0;
       vec2 minP4 = vec2(0.0, 0.0);
       float minP4Distance = 0.0;
       
       for(int j = 0; j < UNROLLED_LOOP_INDEX - 2; j += 2 ){
          vec2 A1 = vec2(arr[j], arr[j+1]);
          vec2 B1 = vec2(arr[j+2], arr[j+3]);
          
          // 判断垂点是否在线
          bool isOnLine = isOnLine(A1, B1, v);
          
          // 获取焦点坐标
          if(isIntersection(A1, B1, v, d)){
            vec2 p = getIntersection(A1, B1, v, d);

            // 判断是同向还是异向
            if (isSameDirection(v, d, p)) {
            
              if(isOnLine){
                if (minP1Distance == 0.0 || minP1Distance > getTwoPointDistance(v, p)) {
                  minP1Distance = getTwoPointDistance(v, p);
                  minP1 = p;
                }
              }
              
              if (minP3Distance == 0.0 || minP3Distance > getTwoPointDistance(v, p)) {
                minP3Distance = getTwoPointDistance(v, p);
                minP3 = p;
              }
              
            } else {
              if(isOnLine){
                if (minP2Distance == 0.0 || minP2Distance > getTwoPointDistance(v, p)) {
                  minP2Distance = getTwoPointDistance(v, p);
                  minP2 = p;
                }
              }
              
              if (minP4Distance == 0.0 || minP4Distance > getTwoPointDistance(v, p)) {
                minP4Distance = getTwoPointDistance(v, p);
                minP4 = p;
              }
            }
          }
       }
       
       // 计算中心点
       vec2 center2 = (minP1 + minP2) / 2.0;
       vec2 center3 = (minP3 + minP4) / 2.0;
       // 中点与垂点的距离
       float cd2 = getTwoPointDistance(center2, d);
       float cd3 = getTwoPointDistance(center3, d);
       float cd = min(cd2, cd3);
       cd = cd2;
       // cd = cd3;
       
       if(abs(minP3Distance - minP1Distance) < 0.0001){
         if(vd < cd){
           gradientAlpha *= smoothstep(0.0, cd, vd);
         }
       }
    
       if(abs(minP1Distance - minP3Distance) > 0.0001){

         float vp = minP3Distance;
         float cp = getTwoPointDistance(center3, minP3);
         if(vp < cp){
           gradientAlpha2 *= (1.0 - smoothstep(0.0, cp, vp));
           count++;
         }
       }
     }
  }
  #pragma unroll_loop_end
  
  if(count > 1){
    // a_color = vec3(0.0, 1.0, 0.0);
    gradientAlpha *= (1.0 - gradientAlpha2);
  }

  gl_FragColor = vec4(a_color, alpha * gradientAlpha);
  
  #include <logdepthbuf_fragment>
}
 `;

export { GradientFragShader }