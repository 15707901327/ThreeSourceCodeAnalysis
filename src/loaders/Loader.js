import { DefaultLoadingManager } from './LoadingManager.js';

/**
 * @author alteredq / http://alteredqualia.com/
 */

/**
 * 加载器
 * @param manager
 * @constructor
 */
function Loader( manager ) {

	this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;

	// 加载策略
	this.crossOrigin = 'anonymous';
	// 路径
	this.path = '';
	// 资源加载路径
	this.resourcePath = '';

}

Object.assign( Loader.prototype, {

	load: function ( /* url, onLoad, onProgress, onError */ ) {},

	parse: function ( /* data */ ) {},

	setCrossOrigin: function ( crossOrigin ) {

		this.crossOrigin = crossOrigin;
		return this;

	},

	/**
	 * 设置路径
	 * @param path
	 * @returns {Loader}
	 */
	setPath: function ( path ) {
		this.path = path;
		return this;
	},

	setResourcePath: function ( resourcePath ) {

		this.resourcePath = resourcePath;
		return this;

	}

} );

export { Loader };
