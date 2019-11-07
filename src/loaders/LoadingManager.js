/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * 加载管理器
 * @param onLoad
 * @param onProgress
 * @param onError
 * @constructor
 */
function LoadingManager( onLoad, onProgress, onError ) {

	var scope = this;

	var isLoading = false; // 标记是否完成加载
	var itemsLoaded = 0; // 已加载完成
	var itemsTotal = 0; // 加载总数
	var urlModifier = undefined;
	var handlers = [];

	// Refer to #5689 for the reason why we don't set .onStart
	// in the constructor

	this.onStart = undefined;
	this.onLoad = onLoad;
	this.onProgress = onProgress;
	this.onError = onError;

	/**
	 * 开始加载
	 * @param url 路径
	 */
	this.itemStart = function ( url ) {

		itemsTotal ++;

		if ( isLoading === false ) {
			if ( scope.onStart !== undefined ) {
				scope.onStart( url, itemsLoaded, itemsTotal );
			}
		}
		isLoading = true;
	};

	/**
	 * 加载结束
	 * @param url
	 */
	this.itemEnd = function ( url ) {

		itemsLoaded ++;

		if ( scope.onProgress !== undefined ) {
			scope.onProgress( url, itemsLoaded, itemsTotal );
		}

		if ( itemsLoaded === itemsTotal ) {
			isLoading = false;
			if ( scope.onLoad !== undefined ) {
				scope.onLoad();
			}
		}
	};

	/**
	 * 加载错误
	 * @param url
	 */
	this.itemError = function ( url ) {
		if ( scope.onError !== undefined ) {
			scope.onError( url );
		}
	};

	/**
	 * 解析路径
	 * @param url
	 * @returns {*}
	 */
	this.resolveURL = function ( url ) {

		if ( urlModifier ) {
			return urlModifier( url );
		}
		return url;
	};

	this.setURLModifier = function ( transform ) {

		urlModifier = transform;
		return this;

	};

	this.addHandler = function ( regex, loader ) {

		handlers.push( regex, loader );

		return this;

	};

	this.removeHandler = function ( regex ) {

		var index = handlers.indexOf( regex );

		if ( index !== - 1 ) {

			handlers.splice( index, 2 );

		}

		return this;

	};

	this.getHandler = function ( file ) {

		for ( var i = 0, l = handlers.length; i < l; i += 2 ) {

			var regex = handlers[ i ];
			var loader = handlers[ i + 1 ];

			if ( regex.test( file ) ) {

				return loader;

			}

		}

		return null;

	};

}

var DefaultLoadingManager = new LoadingManager();

export { DefaultLoadingManager, LoadingManager };
