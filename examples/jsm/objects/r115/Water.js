/**
 * @author jbouny / https://github.com/jbouny
 *
 * Work based on :
 * @author Slayvin / http://slayvin.net : Flat mirror for three.js
 * @author Stemkoski / http://www.adelphi.edu/~stemkoski : An implementation of water shader based on the flat mirror
 * @author Jonas Wagner / http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

import {
	Color,
	FrontSide,
	LinearFilter,
	MathUtils,
	Matrix4,
	Mesh,
	PerspectiveCamera,
	Plane,
	RGBFormat,
	ShaderMaterial,
	UniformsLib,
	UniformsUtils,
	Vector3,
	Vector4,
	WebGLRenderTarget
} from '../../../../build/three_r115.module.js';

/**
 * 模拟水效果
 * @param geometry 水面几何体
 * @param options 参数
 * @constructor
 */
var Water = function ( geometry, options ) {

	Mesh.call( this, geometry );

	var scope = this;

	options = options || {};

	var textureWidth = options.textureWidth !== undefined ? options.textureWidth : 512;
	var textureHeight = options.textureHeight !== undefined ? options.textureHeight : 512;

	var clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
	var alpha = options.alpha !== undefined ? options.alpha : 1.0;
	var time = options.time !== undefined ? options.time : 0.0;
	var normalSampler = options.waterNormals !== undefined ? options.waterNormals : null;
	var sunDirection = options.sunDirection !== undefined ? options.sunDirection : new Vector3( 0.70707, 0.70707, 0.0 );
	var sunColor = new Color( options.sunColor !== undefined ? options.sunColor : 0xffffff );
	var waterColor = new Color( options.waterColor !== undefined ? options.waterColor : 0x7F7F7F );
	var eye = options.eye !== undefined ? options.eye : new Vector3( 0, 0, 0 );
	var distortionScale = options.distortionScale !== undefined ? options.distortionScale : 20.0;
	var side = options.side !== undefined ? options.side : FrontSide;
	var fog = options.fog !== undefined ? options.fog : false;

	//

	var mirrorPlane = new Plane();
    var normal = new Vector3();                // 法线
    var mirrorWorldPosition = new Vector3();   // 镜像位置
    var cameraWorldPosition = new Vector3();   // 相机位置
    var rotationMatrix = new Matrix4();        // 物体的旋转角度
	var lookAtPosition = new Vector3( 0, 0, - 1 );
	var clipPlane = new Vector4();

    var view = new Vector3();                  // 视口
	var target = new Vector3();
	var q = new Vector4();

	var textureMatrix = new Matrix4();

    var mirrorCamera = new PerspectiveCamera();// 镜面相机

	var parameters = {
		minFilter: LinearFilter,
		magFilter: LinearFilter,
        format: RGBFormat
	};

    // 渲染目标
	var renderTarget = new WebGLRenderTarget( textureWidth, textureHeight, parameters );

	if ( ! MathUtils.isPowerOfTwo( textureWidth ) || ! MathUtils.isPowerOfTwo( textureHeight ) ) {

		renderTarget.texture.generateMipmaps = false;

	}

	var mirrorShader = {

		uniforms: UniformsUtils.merge( [
			UniformsLib[ 'fog' ],
			UniformsLib[ 'lights' ],
			{
                'normalSampler': {value: null},
                'mirrorSampler': {value: null},
                'alpha': {value: 1.0},
                'time': {value: 0.0},
                'size': {value: 1.0},
                'distortionScale': {value: 20.0},
                'textureMatrix': {value: new Matrix4()},
                'sunColor': {value: new Color(0x7F7F7F)},
                'sunDirection': {value: new Vector3(0.70707, 0.70707, 0)},
                'eye': {value: new Vector3()},
                'waterColor': {value: new Color(0x555555)}
			}
		] ),

		vertexShader: [
			'uniform mat4 textureMatrix;',
			'uniform float time;',

			'varying vec4 mirrorCoord;',
			'varying vec4 worldPosition;',

		 	'#include <common>',
		 	'#include <fog_pars_vertex>',
			'#include <shadowmap_pars_vertex>',
			'#include <logdepthbuf_pars_vertex>',

			'void main() {',
			'	mirrorCoord = modelMatrix * vec4( position, 1.0 );',
			'	worldPosition = mirrorCoord.xyzw;',
			'	mirrorCoord = textureMatrix * mirrorCoord;',
			'	vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );',
			'	gl_Position = projectionMatrix * mvPosition;',

			'#include <logdepthbuf_vertex>',
			'#include <fog_vertex>',
			'#include <shadowmap_vertex>',
			'}'
		].join( '\n' ),

		fragmentShader: [
			'uniform sampler2D mirrorSampler;',
			'uniform float alpha;',
			'uniform float time;',
			'uniform float size;',
			'uniform float distortionScale;',
			'uniform sampler2D normalSampler;',
			'uniform vec3 sunColor;',
			'uniform vec3 sunDirection;',
			'uniform vec3 eye;',
			'uniform vec3 waterColor;',

			'varying vec4 mirrorCoord;',
			'varying vec4 worldPosition;',

			'vec4 getNoise( vec2 uv ) {',
			'	vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);',
			'	vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );',
			'	vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );',
			'	vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );',
			'	vec4 noise = texture2D( normalSampler, uv0 ) +',
			'		texture2D( normalSampler, uv1 ) +',
			'		texture2D( normalSampler, uv2 ) +',
			'		texture2D( normalSampler, uv3 );',
			'	return noise * 0.5 - 1.0;',
			'}',

			'void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {',
			'	vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );',
			'	float direction = max( 0.0, dot( eyeDirection, reflection ) );',
			'	specularColor += pow( direction, shiny ) * sunColor * spec;',
			'	diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;',
			'}',

			'#include <common>',
			'#include <packing>',
			'#include <bsdfs>',
			'#include <fog_pars_fragment>',
			'#include <logdepthbuf_pars_fragment>',
			'#include <lights_pars_begin>',
			'#include <shadowmap_pars_fragment>',
			'#include <shadowmask_pars_fragment>',

			'void main() {',

			'#include <logdepthbuf_fragment>',
			'	vec4 noise = getNoise( worldPosition.xz * size );',
			'	vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );',

			'	vec3 diffuseLight = vec3(0.0);',
			'	vec3 specularLight = vec3(0.0);',

			'	vec3 worldToEye = eye-worldPosition.xyz;',
			'	vec3 eyeDirection = normalize( worldToEye );',
			'	sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );',

			'	float distance = length(worldToEye);',

			'	vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;',
			'	vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );',

			'	float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );',
			'	float rf0 = 0.3;',
			'	float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );',
			'	vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;',
			'	vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);',
			'	vec3 outgoingLight = albedo;',
			'	gl_FragColor = vec4( outgoingLight, alpha );',

			'#include <tonemapping_fragment>',
			'#include <fog_fragment>',
			'}'
		].join( '\n' )

	};

	var material = new ShaderMaterial( {
		fragmentShader: mirrorShader.fragmentShader,
		vertexShader: mirrorShader.vertexShader,
		uniforms: UniformsUtils.clone( mirrorShader.uniforms ),
		lights: true,
		side: side,
		fog: fog
	} );

	material.uniforms[ "mirrorSampler" ].value = renderTarget.texture;
	material.uniforms[ "textureMatrix" ].value = textureMatrix;
	material.uniforms[ "alpha" ].value = alpha;
	material.uniforms[ "time" ].value = time;
	material.uniforms[ "normalSampler" ].value = normalSampler;
	material.uniforms[ "sunColor" ].value = sunColor;
	material.uniforms[ "waterColor" ].value = waterColor;
	material.uniforms[ "sunDirection" ].value = sunDirection;
	material.uniforms[ "distortionScale" ].value = distortionScale;

	material.uniforms[ "eye" ].value = eye;

	scope.material = material;

	scope.onBeforeRender = function ( renderer, scene, camera ) {

        /**
         * 第一步：构建虚拟的相机
         */
        // 反射面的世界位置
		mirrorWorldPosition.setFromMatrixPosition( scope.matrixWorld );
        // camera的世界位置
		cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );

        // 水面的旋转矩阵
		rotationMatrix.extractRotation( scope.matrixWorld );

		// 计算镜面法线
		normal.set( 0, 0, 1 );                // 初始平面法向量
		normal.applyMatrix4( rotationMatrix );// 计算旋转后的平面法向量

		// 计算镜面相机位置
		view.subVectors( mirrorWorldPosition, cameraWorldPosition );// camera -> mirrorCarmera 向量
        if (view.dot(normal) > 0) return;  // 避免在镜子背对时渲染
        view.reflect(normal).negate();     // 得到反射向量的反向量
        view.add(mirrorWorldPosition);     // 投影面位置加上该向量得到虚拟相机的位置

        // 计算相机视点位置
		rotationMatrix.extractRotation( camera.matrixWorld );

		lookAtPosition.set( 0, 0, - 1 );
		lookAtPosition.applyMatrix4( rotationMatrix );
		lookAtPosition.add( cameraWorldPosition );

        // 计算镜面相机视点
		target.subVectors( mirrorWorldPosition, lookAtPosition );
		target.reflect( normal ).negate();
		target.add( mirrorWorldPosition );

        // 设置镜面相机
        mirrorCamera.position.copy(view);             // 设置相机位置
        mirrorCamera.up.set(0, 1, 0);                 // 设置相机上方向
		mirrorCamera.up.applyMatrix4( rotationMatrix );
		mirrorCamera.up.reflect( normal );
        mirrorCamera.lookAt(target);                  // 设置相机视点

		mirrorCamera.far = camera.far; // Used in WebGLBackground

		mirrorCamera.updateMatrixWorld();
        mirrorCamera.projectionMatrix.copy(camera.projectionMatrix); // 设置投影矩阵

        /**
         * 第二步：将虚拟相机的渲染结果映射到投影面上
         * 初始化一个默认矩阵，这是初始化的矩阵主要是为了把屏幕坐标和[-1, 1]映射到[0, 1]的纹理坐标
         * 然后将该矩阵乘以模型、视图、投影矩阵，经过模型、视图、投影矩阵变换的坐标为屏幕坐标，再经过上述矩阵后就可以映射为纹理坐标了
         * Update the texture matrix
         */
		textureMatrix.set(
			0.5, 0.0, 0.0, 0.5,
			0.0, 0.5, 0.0, 0.5,
			0.0, 0.0, 0.5, 0.5,
			0.0, 0.0, 0.0, 1.0
		);
		textureMatrix.multiply( mirrorCamera.projectionMatrix );
		textureMatrix.multiply( mirrorCamera.matrixWorldInverse );

        /**
         * 进一步的完善
         * 调整虚拟相机渲染时的投影矩阵，将相机的近裁剪面重置为投影面，避免对倒影面下方对物体进行投影，clipBias参数是对裁剪面进行了一个偏移，
         * 具体对算法请参考: http://www.terathon.com/code/oblique.html
         * 解释这种技术的论文: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
         */
		mirrorPlane.setFromNormalAndCoplanarPoint( normal, mirrorWorldPosition );
		mirrorPlane.applyMatrix4( mirrorCamera.matrixWorldInverse );

		clipPlane.set( mirrorPlane.normal.x, mirrorPlane.normal.y, mirrorPlane.normal.z, mirrorPlane.constant );

		var projectionMatrix = mirrorCamera.projectionMatrix;

		q.x = ( Math.sign( clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
		q.y = ( Math.sign( clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
		q.z = - 1.0;
		q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

		// Calculate the scaled plane vector
		clipPlane.multiplyScalar( 2.0 / clipPlane.dot( q ) );

		// Replacing the third row of the projection matrix
		projectionMatrix.elements[ 2 ] = clipPlane.x;
		projectionMatrix.elements[ 6 ] = clipPlane.y;
		projectionMatrix.elements[ 10 ] = clipPlane.z + 1.0 - clipBias;
		projectionMatrix.elements[ 14 ] = clipPlane.w;

		eye.setFromMatrixPosition( camera.matrixWorld );

		// 记录原始渲染目标以及属性
		var currentRenderTarget = renderer.getRenderTarget();

		var currentXrEnabled = renderer.xr.enabled;
		var currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

		scope.visible = false;

		renderer.xr.enabled = false; // Avoid camera modification and recursion
		renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

		renderer.setRenderTarget( renderTarget );
		if ( renderer.autoClear === false ) renderer.clear();
		renderer.render( scene, mirrorCamera );

        // 重新设置回原有的渲染目标以及参数
		scope.visible = true;

		renderer.xr.enabled = currentXrEnabled;
		renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

		renderer.setRenderTarget( currentRenderTarget );

        // 恢复视口
		var viewport = camera.viewport;

		if ( viewport !== undefined ) {

			renderer.state.viewport( viewport );

		}

	};

};

Water.prototype = Object.create( Mesh.prototype );
Water.prototype.constructor = Water;

export { Water };
