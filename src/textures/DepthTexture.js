/**
 * @author Matt DesLauriers / @mattdesl
 * @author atix / arthursilber.de
 */

import { Texture } from './Texture.js';
import { NearestFilter, UnsignedShortType, UnsignedInt248Type, DepthFormat, DepthStencilFormat } from '../constants.js';

/**
 * 深度贴图
 * @param width 宽度
 * @param height 高度
 * @param type 纹理数据类型
 * @param mapping
 * @param wrapS  纹理水平填充参数
 * @param wrapT 纹理垂直填充参数
 * @param magFilter 纹理放大像素的截取类型
 * @param minFilter 纹理缩小像素的截取类型
 * @param anisotropy 各向异性过滤 默认1 不进行过滤
 * @param format 纹理像素格式
 * @constructor
 */
function DepthTexture( width, height, type, mapping, wrapS, wrapT, magFilter, minFilter, anisotropy, format ) {

	format = format !== undefined ? format : DepthFormat;

	if ( format !== DepthFormat && format !== DepthStencilFormat ) {
		throw new Error( 'DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat' );
	}

	if ( type === undefined && format === DepthFormat ) type = UnsignedShortType;
	if ( type === undefined && format === DepthStencilFormat ) type = UnsignedInt248Type;

	Texture.call( this, null, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy );

	this.image = { width: width, height: height };

	this.magFilter = magFilter !== undefined ? magFilter : NearestFilter;
	this.minFilter = minFilter !== undefined ? minFilter : NearestFilter;

	this.flipY = false; // 对图像尽心Y轴反转
	this.generateMipmaps	= false;

}

DepthTexture.prototype = Object.create( Texture.prototype );
DepthTexture.prototype.constructor = DepthTexture;
DepthTexture.prototype.isDepthTexture = true;

export { DepthTexture };
