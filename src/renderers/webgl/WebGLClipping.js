/**
 * @author tschw
 */

import { Matrix3 } from '../../math/Matrix3.js';
import { Plane } from '../../math/Plane.js';

/**
 * 裁剪
 * @constructor
 */
function WebGLClipping() {

	var scope = this,

		globalState = null,
		numGlobalPlanes = 0, // 裁剪面数量
		localClippingEnabled = false, // 对象级裁剪
		renderingShadows = false,

		plane = new Plane(),
		viewNormalMatrix = new Matrix3(),

		uniform = { value: null, needsUpdate: false };

	this.uniform = uniform;
	this.numPlanes = 0; // 裁剪面数量
	this.numIntersection = 0;

  /**
	 * 初始化
   * @param planes 裁剪面
   * @param enableLocalClipping 是否是对象级的裁剪
   * @param camera 相机
   * @return {boolean|*} 是否启动裁剪
   */
	this.init = function ( planes, enableLocalClipping, camera ) {

    // enable state of previous frame - the clipping code has to
    // run another frame in order to reset the state:
		var enabled = planes.length !== 0 || enableLocalClipping || numGlobalPlanes !== 0 || localClippingEnabled;

		localClippingEnabled = enableLocalClipping;

		globalState = projectPlanes( planes, camera, 0 );
		numGlobalPlanes = planes.length;

		return enabled;

	};

	this.beginShadows = function () {

		renderingShadows = true;
		projectPlanes( null );

	};

	this.endShadows = function () {

		renderingShadows = false;
		resetGlobalState();

	};

  /**
   * 设置裁剪状态
   * @param planes 裁剪面
   * @param clipIntersection 更改剪切平面的行为，以便仅剪切其相交，而不剪切其并集。 默认为false。
   * @param clipShadows 定义是否根据此材质上指定的剪切平面剪切阴影。 默认为false。
   * @param camera 相机
   * @param cache 缓存
   * @param fromCache
   */
	this.setState = function ( planes, clipIntersection, clipShadows, camera, cache, fromCache ) {
		if ( ! localClippingEnabled || planes === null || planes.length === 0 || renderingShadows && ! clipShadows ) {
			// there's no local clipping
			if ( renderingShadows ) {
				// there's no global clipping
				projectPlanes( null );
			} else {
				resetGlobalState();
			}
		}
		else {
			var nGlobal = renderingShadows ? 0 : numGlobalPlanes,
				lGlobal = nGlobal * 4,

				dstArray = cache.clippingState || null;

			uniform.value = dstArray; // ensure unique state

			dstArray = projectPlanes( planes, camera, lGlobal, fromCache );

			for ( var i = 0; i !== lGlobal; ++ i ) {
				dstArray[ i ] = globalState[ i ];
			}

			// 平面数据
			cache.clippingState = dstArray;
			this.numIntersection = clipIntersection ? this.numPlanes : 0;
			this.numPlanes += nGlobal;

		}
	};

	function resetGlobalState() {

		if ( uniform.value !== globalState ) {

			uniform.value = globalState;
			uniform.needsUpdate = numGlobalPlanes > 0;

		}

		scope.numPlanes = numGlobalPlanes;
		scope.numIntersection = 0;

	}

  /**
   * 解析平面数据
   * @param planes 裁剪面
   * @param camera 相机
   * @param dstOffset 偏移
   * @param skipTransform
   * @returns {*} 平面数据
   */
	function projectPlanes( planes, camera, dstOffset, skipTransform ) {

	  // 裁剪面数量
		var nPlanes = planes !== null ? planes.length : 0,
			dstArray = null;

		if ( nPlanes !== 0 ) {

			dstArray = uniform.value;

			if ( skipTransform !== true || dstArray === null ) {

				var flatSize = dstOffset + nPlanes * 4,
					viewMatrix = camera.matrixWorldInverse;

				viewNormalMatrix.getNormalMatrix( viewMatrix );

				if ( dstArray === null || dstArray.length < flatSize ) {
					dstArray = new Float32Array( flatSize );
				}

				for ( var i = 0, i4 = dstOffset; i !== nPlanes; ++ i, i4 += 4 ) {
					plane.copy( planes[ i ] ).applyMatrix4( viewMatrix, viewNormalMatrix );
					plane.normal.toArray( dstArray, i4 );
					dstArray[ i4 + 3 ] = plane.constant;
				}
			}

			uniform.value = dstArray;
			uniform.needsUpdate = true;
		}

		scope.numPlanes = nPlanes;

		return dstArray;

	}

}

export { WebGLClipping };
