/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { WebGLLights } from './WebGLLights.js';

/**
 * 渲染状态
 * @returns {{init: init, pushLight: pushLight, pushShadow: pushShadow, state: {shadowsArray: Array, lightsArray: Array, lights: {setup, state}}, setupLights: setupLights}}
 * @constructor
 */
function WebGLRenderState() {

	var lights = new WebGLLights();

	var lightsArray = []; // 记录渲染的灯光
	var shadowsArray = [];

	function init() {

		lightsArray.length = 0;
		shadowsArray.length = 0;

	}

	/**
	 * 记录渲染的灯光
	 * @param light
	 */
	function pushLight( light ) {
		lightsArray.push( light );
	}

	function pushShadow( shadowLight ) {

		shadowsArray.push( shadowLight );

	}

	/**
	 * 设置灯光
	 * @param camera 相机
	 */
	function setupLights( camera ) {
		lights.setup( lightsArray, shadowsArray, camera );
	}

	var state = {
		lightsArray: lightsArray,
		shadowsArray: shadowsArray,

		lights: lights
	};

	return {
		init: init,
		state: state,
		setupLights: setupLights,

		pushLight: pushLight,
		pushShadow: pushShadow
	};

}

/**
 * 渲染状态管理
 * @returns {{get: (function(*, *): {init: init, pushLight: pushLight, pushShadow: pushShadow, state: {shadowsArray: Array, lightsArray: Array, lights: {setup, state}}, setupLights: setupLights}), dispose: dispose}}
 * @constructor
 */
function WebGLRenderStates() {

	var renderStates = new WeakMap();

	function onSceneDispose( event ) {

		var scene = event.target;

		scene.removeEventListener( 'dispose', onSceneDispose );

		renderStates.delete( scene );

	}

	/**
	 * 获取渲染状态
	 * @param scene 场景
	 * @param camera 相机
	 * @returns {{init: init, pushLight: pushLight, pushShadow: pushShadow, state: {shadowsArray: Array, lightsArray: Array, lights: {setup, state}}, setupLights: setupLights}}
	 */
	function get( scene, camera ) {

		var renderState;

		if ( renderStates.has( scene ) === false ) {
			renderState = new WebGLRenderState();
			renderStates.set( scene, new WeakMap() );
			renderStates.get( scene ).set( camera, renderState );

			scene.addEventListener( 'dispose', onSceneDispose );
		}
		else {
			if ( renderStates.get( scene ).has( camera ) === false ) {
				renderState = new WebGLRenderState();
				renderStates.get( scene ).set( camera, renderState );
			} else {
				renderState = renderStates.get( scene ).get( camera );
			}
		}

		return renderState;
	}

	function dispose() {

		renderStates = new WeakMap();

	}

	return {
		get: get,
		dispose: dispose
	};

}


export { WebGLRenderStates };
