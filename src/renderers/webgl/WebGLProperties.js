/**
 * @author fordacious / fordacious.github.io
 */

function WebGLProperties() {

	var properties = new WeakMap();

  /**
	 * 获取map，如果未定义，设置为{}
   * @param object
   */
	function get( object ) {

		var map = properties.get( object );

		if ( map === undefined ) {

			map = {};
			properties.set( object, map );

		}

		return map;

	}

	function remove( object ) {

		properties.delete( object );

	}

	function update( object, key, value ) {

		properties.get( object )[ key ] = value;

	}

	function dispose() {

		properties = new WeakMap();

	}

	return {
		get: get,
		remove: remove,
		update: update,
		dispose: dispose
	};

}


export { WebGLProperties };
