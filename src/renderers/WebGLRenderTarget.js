import { EventDispatcher } from '../core/EventDispatcher.js';
import { Texture } from '../textures/Texture.js';
import { LinearFilter } from '../constants.js';
import { Vector4 } from '../math/Vector4.js';

/**
 * @author szimek / https://github.com/szimek/
 * @author alteredq / http://alteredqualia.com/
 * @author Marius Kintel / https://github.com/kintel
 */

/*
 In options, we can specify:
 * Texture parameters for an auto-generated target texture
 * depthBuffer/stencilBuffer: Booleans to indicate if we should generate these buffers
*/
/**
 * 渲染目标
 * @param width 渲染目标的宽度
 * @param height 渲染目标的长度
 * @param options 参数集合
 * 	wrapS  纹理水平填充参数
 * 	wrapT 纹理垂直填充参数
 *  magFilter 纹理放大像素的截取类型
 *  minFilter 纹理缩小像素的截取类型
 *  format 图像的内部格式
 *  stencilBuffer：是否开启模板缓冲区 true
 *  depthTexture：深度图 THREE.DepthTexture
 * @constructor
 */
function WebGLRenderTarget( width, height, options ) {

	this.width = width;
	this.height = height;

	this.scissor = new Vector4( 0, 0, width, height );
	this.scissorTest = false;

	this.viewport = new Vector4( 0, 0, width, height );

	options = options || {};

	// 贴图
	this.texture = new Texture( undefined, undefined, options.wrapS, options.wrapT, options.magFilter, options.minFilter, options.format, options.type, options.anisotropy, options.encoding );

	// 添加图片，以及参数
	this.texture.image = {};
	this.texture.image.width = width;
	this.texture.image.height = height;

	this.texture.generateMipmaps = options.generateMipmaps !== undefined ? options.generateMipmaps : false;
	// 纹理缩小时像素的取值format
	this.texture.minFilter = options.minFilter !== undefined ? options.minFilter : LinearFilter;

	this.depthBuffer = options.depthBuffer !== undefined ? options.depthBuffer : true;
	this.stencilBuffer = options.stencilBuffer !== undefined ? options.stencilBuffer : true;
	// 深度纹理
	this.depthTexture = options.depthTexture !== undefined ? options.depthTexture : null;

}
WebGLRenderTarget.prototype = Object.assign( Object.create( EventDispatcher.prototype ), {

	constructor: WebGLRenderTarget,

	isWebGLRenderTarget: true,

	setSize: function ( width, height ) {

		if ( this.width !== width || this.height !== height ) {

			this.width = width;
			this.height = height;

			this.texture.image.width = width;
			this.texture.image.height = height;

			this.dispose();

		}

		this.viewport.set( 0, 0, width, height );
		this.scissor.set( 0, 0, width, height );

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( source ) {

		this.width = source.width;
		this.height = source.height;

		this.viewport.copy( source.viewport );

		this.texture = source.texture.clone();

		this.depthBuffer = source.depthBuffer;
		this.stencilBuffer = source.stencilBuffer;
		this.depthTexture = source.depthTexture;

		return this;

	},

	dispose: function () {

		this.dispatchEvent( { type: 'dispose' } );

	}

} );

export { WebGLRenderTarget };
