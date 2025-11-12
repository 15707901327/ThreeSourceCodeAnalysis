/**
 * @author Mif /  Made on September 25, 2020/
 */
let GradientVertShader = `
#include <common> // 包含着色器公共模块(包含常用的数学工具函数以及一些常量定义什么的)
#include <logdepthbuf_pars_vertex>  // 包含深度处理的一些定义

varying vec4 v_position;

void main() {
  v_position = vec4( position, 1.0 );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  
  #include <logdepthbuf_vertex> // logDepth深度运算
}
 `;

export { GradientVertShader }