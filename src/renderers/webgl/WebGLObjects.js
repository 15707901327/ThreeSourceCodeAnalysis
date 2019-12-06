/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * 对象管理
 * @param gl 上下文
 * @param geometries 几何体管理
 * @param attributes 属性管理
 * @param info{WebGLInfo}
 * @return {{update: update, dispose: dispose}}
 * @constructor
 */
function WebGLObjects( gl, geometries, attributes, info ) {

	var updateList = {};

  /**
   * 更新对象
   * @param object 对象
   * @returns {*}
   */
	function update( object ) {
		var frame = info.render.frame;

		var geometry = object.geometry;
		// 获取buffergeometry几何体
		var buffergeometry = geometries.get( object, geometry );

		// Update once per frame
		if ( updateList[ buffergeometry.id ] !== frame ) {
			if ( geometry.isGeometry ) {
				buffergeometry.updateFromObject( object );
			}

			geometries.update( buffergeometry );
			updateList[ buffergeometry.id ] = frame;
		}

		if ( object.isInstancedMesh ) {

			attributes.update( object.instanceMatrix, gl.ARRAY_BUFFER );

		}

		return buffergeometry;
	}

	function dispose() {

		updateList = {};

	}

	return {

		update: update,
		dispose: dispose

	};
}

export { WebGLObjects };
