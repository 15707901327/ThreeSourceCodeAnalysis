/**
 * @author Mif /  Made on September 25, 2020/
 */

let GradientFragShader = `
#define PI 3.14159265359
#define EPSILON 0.001

varying vec4 v_position;

uniform vec3 color;
uniform float alpha;
uniform float arr[UNROLLED_LOOP_INDEX];
uniform float minWidth;

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
  if (cos < 0.0) {
    return false;
  } else{
    return true;
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

/**
 * 判断是否为同一个点
 * @param A
 * @param A1
 */
bool isSamePoint(vec2 A, vec2 A1) {
  if (abs(A.x - A1.x) < EPSILON && abs(A.y - A1.y) < EPSILON) {
    return true;
  }else{
    return false;
  }
}

/**
  * 计算cosABC
  * @param A 
  * @param B 
  * @param C
  * @param D
  */
float computeCos(vec2 A, vec2 B, vec2 C, vec2 D) {

  vec2 AB = B - A;
  vec2 CD = D - C;
 
  return acos(dot(AB, CD) / (length(AB) * length(CD)));
}

void main() {
  
  vec3 a_color = color;

  vec2 v = vec2(v_position.xy); // 模型坐标
  float gradientAlpha = 1.0;
  float gradientAlpha2 = 1.0;
  
  vec2 tempA1 = vec2(0.0, 0.0);
  vec2 tempB1 = vec2(0.0, 0.0);
  bool isConnect = false;
  int count = 0;
  
  // 计算点与所有边的垂线
  #pragma unroll_loop_start
  for(int i = 0; i < UNROLLED_LOOP_INDEX - 2; i += 2 ){
    vec2 A = vec2(arr[i], arr[i+1]);
    vec2 B = vec2(arr[i+2], arr[i+3]);
     
    // 判断垂点是否在线
    bool isOnLineAB = isOnLine(A, B, v);
    
    // 计算AB中点
    vec2 D = (A + B) / 2.0;
    
    // 计算AB的中垂线向量
    vec2 vecAB = B - A;
    vec2 vecABT = vec2(0.0, 0.0);
    vecABT.x = -vecAB.y;
    vecABT.y = vecAB.x;
    
    // 计算中垂线上一点
    vec2 D1 = D + vecABT;
    
    // 获取垂点坐标
    vec2 d = calculateVerticalPoint(A, B, v);
    // 给定点与垂点距离
    float vd = getTwoPointDistance(v, d); 

    vec2 minP1 = vec2(0.0, 0.0);
    float minP1Distance = -1.0;
    vec2 minP2 = vec2(0.0, 0.0);
    float minP2Distance = -1.0;
    
    vec2 minP3 = d;
    float minP3Distance = vd;
    vec2 minP4 = vec2(0.0, 0.0);
    float minP4Distance = -1.0;
    
    vec2 minD1 = D;
    float minD1Distance = 0.0;
    vec2 minD2 = vec2(0.0, 0.0);
    float minD2Distance = -1.0;
    
    // 标记边是否是凹边
    bool isConcaveEdge = false;
    
    for(int j = 0; j < UNROLLED_LOOP_INDEX - 2; j += 2 ){
      vec2 A1 = vec2(arr[j], arr[j+1]);
      vec2 B1 = vec2(arr[j+2], arr[j+3]);
       
      // 计算中垂线交点
      if(abs(A1.x - A.x) > EPSILON || abs(A1.y - A.y) > EPSILON){
        if (isIntersection(A1, B1, D, D1)) {
          vec2 p = getIntersection(A1, B1, D, D1);
          
          if(!isSameDirection(D, D1, p)){
            if(getTwoPointDistance(D, p) > minWidth){
              if (minD2Distance == -1.0 || minD2Distance > getTwoPointDistance(D, p)) {
                minD2Distance = getTwoPointDistance(D, p);
                minD2 = p;
              }
            }
          } else {
            if (minD1Distance > getTwoPointDistance(D, p)) {
              minD1Distance = getTwoPointDistance(D, p);
              minD1 = p;
            }
          }
        }
      }
       
      // 获取垂点在AB线段上的交点坐标
      if (isOnLineAB) {
        if (isIntersection(A1, B1, v, d)) {
          vec2 p = getIntersection(A1, B1, v, d);

          if(isOnLine(A1, B1, p)){
            // 判断是同向还是异向
            if (isSameDirection(v, d, p)) {
              if (minP1Distance == -1.0 || minP1Distance > getTwoPointDistance(v, p)) {
                minP1Distance = getTwoPointDistance(v, p);
                minP1 = p;
              }
            }else {
              if (minP2Distance == -1.0 || minP2Distance > getTwoPointDistance(v, p)) {
                minP2Distance = getTwoPointDistance(v, p);
                minP2 = p;
              }
            }
          }
        }
      }
       
      // 获取垂点在AB线段外的交点坐标
      if (!isOnLineAB) {
        if (isIntersection(A1, B1, v, d)) {
          vec2 p = getIntersection(A1, B1, v, d);
          
          if(isOnLine(A1, B1, p)){

            // 判断是同向还是异向
            if (isSameDirection(v, d, p)) {
       
              if (minP3Distance > getTwoPointDistance(v, p)) {
                minP3Distance = getTwoPointDistance(v, p);
                minP3 = p;
              }
              
            } else {
              if (minP4Distance == -1.0 || minP4Distance > getTwoPointDistance(v, p)) {
                minP4Distance = getTwoPointDistance(v, p);
                minP4 = p;
              }
            }
          }
        }
      }
       
      // 计算外延长线是否起作用
      if (!(abs(A.x - A1.x) < EPSILON && abs(A.y - A1.y) < EPSILON)) {
        if (isIntersection(A1, B1, v, A)) {
          vec2 p = getIntersection(A1, B1, v, A);

          // 交点不在线段的两个端点
          if (!isSamePoint(p, A1) && !isSamePoint(p, B1)) {
            // 交点在A1B1线段上
            if (!isSameDirection(p, A1, B1)) {
              // 交点在vA线段上
              if (!isSameDirection(p, v, A)) {
                isConcaveEdge = true;
              }
            }
          }
        }
      }
      if (!(abs(A.x - A1.x) < EPSILON && abs(A.y - A1.y) < EPSILON)) {
        if (isIntersection(A1, B1, v, B)) {
          vec2 p = getIntersection(A1, B1, v, B);
          
          // 交点不在线段的两个端点
          if (!isSamePoint(p, A1) && !isSamePoint(p, B1)) {
            // 交点在A1B1线段上
            if (!isSameDirection(p, A1, B1)) {
              // 交点在vB线段上
              if (!isSameDirection(p, v, B)) {
                isConcaveEdge = true;
              }
            }
          }
       }
     }
    }
     
    vec2 centerD = (D + minD2) / 2.0;
    float cDD = getTwoPointDistance(centerD, D);
    
    /*
     * 实现：
     * 1. v到AB的垂点d在AB线段上
     *    1.1 v到AB的垂点d在AB线段上, v点在多边形内
     * 2. v到AB的垂点d在线段AB的延长线上
     *    2.1 v到AB的垂点d在线段AB的延长线上，v点在多边形内
     *        2.1.1 计算凹线对点v的作用
     *    2.2 v到AB的垂点d在线段Ab的延长线上，v点在多边形外
     *        2.2.1 v到AB的垂点d在线段AB的延长线上，v点在多边形外,判断AB线起作用
     * 步骤：
     * 1. vd小于cDD
     */
    if (vd < cDD) {
      // 1. v到AB的垂点d在AB线段上
      if (isOnLineAB) {
        // 1.1 v到AB的垂点d在AB线段上, v点在多边形内
        if (getTwoPointDistance(minP1, d) < EPSILON) {
          gradientAlpha *= smoothstep(0.0, cDD, vd);
        }
      } else {
        // 2.1.1 计算凹线对点v的作用
        if (getTwoPointDistance(minP3, d) < EPSILON || getTwoPointDistance(minP4, d) < EPSILON) {
          /*
           * 实现:
           * 1. 计算凹线对点v的作用
           *    1.1 只有一条直线
           *    1.2 多于一条直线
           *        1.2.1 多于一条直线,前面的线有凹点线
           *        1.2.2 多于一条直线,前面的线没有凹点线
           *              1.2.2.1 多于一条直线,前面的线没有凹点线，当前线有凹点线
           *              1.2.2.2 多于一条直线,前面的线没有凹点线，当前线没有凹点线
           */
          if(count > 0){
            if(isConnect){
            } else{
              if(isSamePoint(tempB1, A) && computeCos(tempA1,tempB1,A,B) > PI / 6.0) {
                isConnect = true;
                gradientAlpha2 *= 1.0 - smoothstep(0.0, cDD, vd);
              } else{
                gradientAlpha2 = 1.0 - smoothstep(0.0, cDD, vd);
              }
            }
          } else{
            gradientAlpha2 = 1.0 - smoothstep(0.0, cDD, vd);
          }
          
          tempA1 = A;
          tempB1 = B;
          count++;
        }
        else {
          // 2.2.1 v到AB的垂点d在线段AB的延长线上，v点在多边形外,判断AB线起作用
          if (!isConcaveEdge) {
            gradientAlpha *= smoothstep(0.0, cDD, vd);
          }
        }
     }
    }
  }
  #pragma unroll_loop_end

  if(isConnect){
     gradientAlpha *= 1.0 - gradientAlpha2;
  }
  
  gl_FragColor = vec4(a_color, alpha * gradientAlpha);
}
 `;
export { GradientFragShader }
