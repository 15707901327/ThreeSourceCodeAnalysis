import { Ray } from '../math/Ray.js';

/**
 * @author mrdoob / http://mrdoob.com/
 * @author bhouston / http://clara.io/
 * @author stephomi / http://stephaneginier.com/
 */

/**
 * 参数：
 * 	origin：射线的起点向量
 * 	direction：射线的方向向量，应该归一化
 * 	near：所有返回的结果应该比 near 远。Near不能为负，默认值为0。
 * 	far：所有返回的结果应该比 far 近。Far 不能小于 near，默认值为无穷大。
 * */
function Raycaster( origin, direction, near, far ) {

	this.ray = new Ray( origin, direction );
	// direction is assumed to be normalized (for accurate distance calculations)

	this.near = near || 0;
	this.far = far || Infinity;

	this.params = {
		Mesh: {},
		Line: {},
		LOD: {},
		Points: { threshold: 1 },
		Sprite: {}
	};

	Object.defineProperties( this.params, {
		PointCloud: {
			get: function () {
				console.warn( 'THREE.Raycaster: params.PointCloud has been renamed to params.Points.' );
				return this.Points;
			}
		}
	} );
}

function ascSort( a, b ) {

	return a.distance - b.distance;

}

function intersectObject( object, raycaster, intersects, recursive ) {
	if ( object.visible === false ) return;
	object.raycast( raycaster, intersects );
	if ( recursive === true ) {
		var children = object.children;
		for ( var i = 0, l = children.length; i < l; i ++ ) {
			intersectObject( children[ i ], raycaster, intersects, true );
		}
	}
}

Object.assign( Raycaster.prototype, {

	linePrecision: 1,

	set: function ( origin, direction ) {

		// direction is assumed to be normalized (for accurate distance calculations)

		this.ray.set( origin, direction );

	},

	setFromCamera: function ( coords, camera ) {

		if ( ( camera && camera.isPerspectiveCamera ) ) {

			this.ray.origin.setFromMatrixPosition( camera.matrixWorld );
			this.ray.direction.set( coords.x, coords.y, 0.5 ).unproject( camera ).sub( this.ray.origin ).normalize();

		} else if ( ( camera && camera.isOrthographicCamera ) ) {

			this.ray.origin.set( coords.x, coords.y, ( camera.near + camera.far ) / ( camera.near - camera.far ) ).unproject( camera ); // set origin in plane of camera
			this.ray.direction.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );

		} else {

			console.error( 'THREE.Raycaster: Unsupported camera type.' );

		}

	},

	/**
	 * 参数：
	 * 	object：检测该物体是否与射线相交
	 * 	recursive：如果设置，则会检测物体所有的子代
	 * 返回：
	 * 	相交的结果会以一个数组的形式返回，其中的元素依照距离排序，越近的排在越前
	 */
	intersectObject: function ( object, recursive, optionalTarget ) {
		var intersects = optionalTarget || [];
		intersectObject( object, this, intersects, recursive );
		intersects.sort( ascSort );
		return intersects;
	},

    /**
     * 参数：
     * 	object：检测这些物体是否与射线相交
     * 	recursive：如果设置，则会检测物体所有的子代
     * 返回：
     * 	相交的结果会以一个数组的形式返回，其中的元素依照距离排序，越近的排在越前
     */
	intersectObjects: function ( objects, recursive, optionalTarget ) {

		var intersects = optionalTarget || [];

		if ( Array.isArray( objects ) === false ) {

			console.warn( 'THREE.Raycaster.intersectObjects: objects is not an Array.' );
			return intersects;

		}

		for ( var i = 0, l = objects.length; i < l; i ++ ) {

			intersectObject( objects[ i ], this, intersects, recursive );

		}

		intersects.sort( ascSort );

		return intersects;

	}
} );

export { Raycaster };
