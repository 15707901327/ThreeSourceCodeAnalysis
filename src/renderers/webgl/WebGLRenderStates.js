import {WebGLLights} from './WebGLLights.js';

/**
 * 渲染状态
 * @returns {{init: init, pushLight: pushLight, pushShadow: pushShadow, state: {shadowsArray: Array, lightsArray: Array, lights: {setup, state}}, setupLights: setupLights}}
 * @constructor
 */
function WebGLRenderState(extensions, capabilities) {

    const lights = new WebGLLights(extensions, capabilities);

    const lightsArray = []; // 记录渲染的灯光
    const shadowsArray = [];// 记录渲染阴影

    /**
     * 初始化
     */
    function init() {
        lightsArray.length = 0;
        shadowsArray.length = 0;
    }

    /**
     * 记录渲染的灯光
     * @param light
     */
    function pushLight(light) {
        lightsArray.push(light);
    }

    function pushShadow(shadowLight) {

        shadowsArray.push(shadowLight);

    }

    /**
     * 设置灯光
     * @param camera 相机
     */
    function setupLights(physicallyCorrectLights) {

        lights.setup(lightsArray, physicallyCorrectLights);

    }

    function setupLightsView(camera) {

        lights.setupView(lightsArray, camera);

    }

    const state = {
        lightsArray: lightsArray, shadowsArray: shadowsArray,

        lights: lights
    };

    return {
        init: init, state: state, setupLights: setupLights, setupLightsView: setupLightsView,

        pushLight: pushLight, pushShadow: pushShadow
    };

}

/**
 * 渲染状态管理
 * @returns {{get: (function(*, *): {init: init, pushLight: pushLight, pushShadow: pushShadow, state: {shadowsArray: Array, lightsArray: Array, lights: {setup, state}}, setupLights: setupLights}), dispose: dispose}}
 * @constructor
 */
function WebGLRenderStates(extensions, capabilities) {

    let renderStates = new WeakMap();

    function get(scene, renderCallDepth = 0) {

        const renderStateArray = renderStates.get(scene);
        let renderState;

        if (renderStateArray === undefined) {

            renderState = new WebGLRenderState(extensions, capabilities);
            renderStates.set(scene, [renderState]);

        } else {

            if (renderCallDepth >= renderStateArray.length) {

                renderState = new WebGLRenderState(extensions, capabilities);
                renderStateArray.push(renderState);

            } else {

                renderState = renderStateArray[renderCallDepth];

            }
        }

        return renderState;
    }

    function dispose() {

        renderStates = new WeakMap();

    }

    return {
        get: get, dispose: dispose
    };

}

export {WebGLRenderStates};
