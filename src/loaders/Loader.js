import {DefaultLoadingManager} from './LoadingManager.js';

/**
 * 加载器
 * @param manager
 * @constructor
 */
class Loader {

    constructor(manager) {

        this.manager = (manager !== undefined) ? manager : DefaultLoadingManager;

        // 加载策略
        this.crossOrigin = 'anonymous';
        this.withCredentials = false;
        // 路径
        this.path = '';
        // 资源加载路径
        this.resourcePath = '';
        this.requestHeader = {};

    }

    load( /* url, onLoad, onProgress, onError */) {
    }

    loadAsync(url, onProgress) {

        const scope = this;

        return new Promise(function (resolve, reject) {

            scope.load(url, resolve, onProgress, reject);

        });

    }

    parse( /* data */) {
    }

    setCrossOrigin(crossOrigin) {

        this.crossOrigin = crossOrigin;
        return this;

    }

    setWithCredentials(value) {

        this.withCredentials = value;
        return this;

    }

    /**
     * 设置路径
     * @param path
     * @returns {Loader}
     */
    setPath(path) {

        this.path = path;
        return this;

    }

    setResourcePath(resourcePath) {

        this.resourcePath = resourcePath;
        return this;

    }

    setRequestHeader(requestHeader) {

        this.requestHeader = requestHeader;
        return this;

    }

}

Loader.DEFAULT_MATERIAL_NAME = '__DEFAULT';

export {Loader};
