/**
 * @author mrdoob / http://mrdoob.com/
 */

import { Texture } from './Texture.js';
import { CubeReflectionMapping, RGBFormat } from '../constants.js';

/**
 *
 * @param images
 * @param mapping
 * @param wrapS  纹理水平填充参数
 * @param wrapT 纹理垂直填充参数
 * @param magFilter 纹理放大像素的截取类型
 * @param minFilter 纹理缩小像素的截取类型
 * @param format 图像的内部格式
 * @param type 纹理数据类型
 * @param anisotropy 各向异性过滤 默认1 不进行过滤
 * @param encoding
 * @constructor
 */
function CubeTexture( images, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding ) {

	images = images !== undefined ? images : [];
	mapping = mapping !== undefined ? mapping : CubeReflectionMapping;
	format = format !== undefined ? format : RGBFormat;

	Texture.call( this, images, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding );

	this.flipY = false;
}

CubeTexture.prototype = Object.create( Texture.prototype );
CubeTexture.prototype.constructor = CubeTexture;

CubeTexture.prototype.isCubeTexture = true;

Object.defineProperty( CubeTexture.prototype, 'images', {

	get: function () {

		return this.image;

	},

	set: function ( value ) {

		this.image = value;

	}

} );


export { CubeTexture };
