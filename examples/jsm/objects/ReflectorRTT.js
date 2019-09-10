/**
 * RTT version
 */


import { Reflector } from "../objects/Reflector.js";

/**
 * 镜像反射类
 * @param geometry 几何体
 * @param options 参数
 *  color：颜色  0x7F7F7F
 *  textureWidth：512
 *  textureHeight：512
 *  clipBias：0
 *  shader：着色器
 *  recursion：循环渲染 0
 * @constructor
 */
var ReflectorRTT = function ( geometry, options ) {
	Reflector.call( this, geometry, options );
	this.geometry.setDrawRange( 0, 0 ); // avoid rendering geometry
};

ReflectorRTT.prototype = Object.create( Reflector.prototype );

export { ReflectorRTT };
