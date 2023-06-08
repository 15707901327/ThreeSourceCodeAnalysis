/**
 * 加载管理器
 * @param onLoad
 * @param onProgress
 * @param onError
 * @constructor
 */
class LoadingManager {
	
	constructor(onLoad, onProgress, onError) {
		
		const scope = this;
		
		let isLoading = false;// 标记是否完成加载
		let itemsLoaded = 0;// 已加载完成
		let itemsTotal = 0;// 加载总数
		let urlModifier = undefined;
		const handlers = [];
		
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
		this.itemStart = function (url) {
			
			itemsTotal++;
			
			if (isLoading === false) {
				if (scope.onStart !== undefined) {
					scope.onStart(url, itemsLoaded, itemsTotal);
				}
			}
			isLoading = true;
		};
		
		/**
		 * 加载结束
		 * @param url
		 */
		this.itemEnd = function (url) {
			
			itemsLoaded++;
			
			if (scope.onProgress !== undefined) {
				scope.onProgress(url, itemsLoaded, itemsTotal);
			}
			
			if (itemsLoaded === itemsTotal) {
				isLoading = false;
				if (scope.onLoad !== undefined) {
					scope.onLoad();
				}
			}
		};
		
		/**
		 * 加载错误
		 * @param url
		 */
		this.itemError = function (url) {
			if (scope.onError !== undefined) {
				scope.onError(url);
			}
		};
		
		/**
		 * 解析路径
		 * @param url
		 * @returns {*}
		 */
		this.resolveURL = function (url) {
			
			if (urlModifier) {
				return urlModifier(url);
			}
			return url;
		};
		
		this.setURLModifier = function (transform) {
			
			urlModifier = transform;
			return this;
			
		};
		
		this.addHandler = function (regex, loader) {
			
			handlers.push(regex, loader);
			
			return this;
			
		};
		
		this.removeHandler = function (regex) {
			
			const index = handlers.indexOf(regex);
			
			if (index !== -1) {
				
				handlers.splice(index, 2);
				
			}
			
			return this;
			
		};
		
		this.getHandler = function (file) {
			
			for (let i = 0, l = handlers.length; i < l; i += 2) {
				
				const regex = handlers[i];
				const loader = handlers[i + 1];
				
				if (regex.global) regex.lastIndex = 0; // see #17920
				
				if (regex.test(file)) {
					
					return loader;
					
				}
				
			}
			
			return null;
			
		};
		
	}
	
}

const DefaultLoadingManager = /*@__PURE__*/ new LoadingManager();

export {DefaultLoadingManager, LoadingManager};
