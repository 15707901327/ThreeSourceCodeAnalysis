/**
 * @author alteredq / http://alteredqualia.com/
 */

import { Texture } from './Texture.js';
import { NearestFilter } from '../constants.js';

/**
 *
 * @param data
 * @param width
 * @param height
 * @param format 图像的内部格式
 * @param type 纹理数据类型
 * @param mapping
 * @param wrapS 纹理水平填充参数
 * @param wrapT 纹理垂直填充参数
 * @param magFilter 纹理放大像素的截取类型
 * @param minFilter 纹理缩小像素的截取类型
 * @param anisotropy 各向异性过滤 默认1 不进行过滤
 * @param encoding
 * @constructor
 */
function DataTexture( data, width, height, format, type, mapping, wrapS, wrapT, magFilter, minFilter, anisotropy, encoding ) {

	Texture.call( this, null, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy, encoding );

	this.image = { data: data, width: width, height: height };

	this.magFilter = magFilter !== undefined ? magFilter : NearestFilter;
	this.minFilter = minFilter !== undefined ? minFilter : NearestFilter;

	this.generateMipmaps = false;
	this.flipY = false;
	this.unpackAlignment = 1;

}

DataTexture.prototype = Object.create( Texture.prototype );
DataTexture.prototype.constructor = DataTexture;

DataTexture.prototype.isDataTexture = true;


export { DataTexture };
