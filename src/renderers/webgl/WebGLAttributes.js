/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * 属性管理
 * @param gl
 * @returns {{get: (function(*=): any), update: update, remove: remove}}
 * @constructor
 */
function WebGLAttributes( gl ) {

	var buffers = new WeakMap();

	/**
	 * 创建缓存区
	 * @param attribute
	 * @param bufferType buffer类型
	 * @return {{buffer: AudioBuffer | WebGLBuffer, type: number, bytesPerElement: number, version}}
	 */
	function createBuffer( attribute, bufferType ) {

		var array = attribute.array;
		var usage = attribute.usage;

		var buffer = gl.createBuffer();

		gl.bindBuffer( bufferType, buffer );
		gl.bufferData( bufferType, array, usage );

		attribute.onUploadCallback();

		var type = gl.FLOAT;

		if ( array instanceof Float32Array ) {

			type = gl.FLOAT;

		}
		else if ( array instanceof Float64Array ) {
			console.warn( 'THREE.WebGLAttributes: Unsupported data buffer format: Float64Array.' );
		}
		else if ( array instanceof Uint16Array ) {
			type = gl.UNSIGNED_SHORT;
		}
		else if ( array instanceof Int16Array ) {
			type = gl.SHORT;
		}
		else if ( array instanceof Uint32Array ) {
			type = gl.UNSIGNED_INT;
		}
		else if ( array instanceof Int32Array ) {
			type = gl.INT;
		}
		else if ( array instanceof Int8Array ) {
			type = gl.BYTE;
		}
		else if ( array instanceof Uint8Array ) {
			type = gl.UNSIGNED_BYTE;
		}

		return {
			buffer: buffer, // 属性的缓冲空间
			type: type, // 属性类型
			bytesPerElement: array.BYTES_PER_ELEMENT,
			version: attribute.version // 版本
		};

	}

	function updateBuffer( buffer, attribute, bufferType ) {

		var array = attribute.array;
		var updateRange = attribute.updateRange;

		gl.bindBuffer( bufferType, buffer );

		if ( updateRange.count === - 1 ) {

			// Not using update ranges

			gl.bufferSubData( bufferType, 0, array );

		} else {

			gl.bufferSubData( bufferType, updateRange.offset * array.BYTES_PER_ELEMENT,
				array.subarray( updateRange.offset, updateRange.offset + updateRange.count ) );

			updateRange.count = - 1; // reset range

		}

	}

	//
	function get( attribute ) {

		if ( attribute.isInterleavedBufferAttribute ) attribute = attribute.data;

		return buffers.get( attribute );

	}

	function remove( attribute ) {

		if ( attribute.isInterleavedBufferAttribute ) attribute = attribute.data;

		var data = buffers.get( attribute );

		if ( data ) {

			gl.deleteBuffer( data.buffer );

			buffers.delete( attribute );

		}

	}

	/**
	 * 更新属性的缓冲空间
	 * @param attribute
	 * @param bufferType
	 */
	function update( attribute, bufferType ) {

		if ( attribute.isInterleavedBufferAttribute ) attribute = attribute.data;

		var data = buffers.get( attribute );

		if ( data === undefined ) {
			buffers.set( attribute, createBuffer( attribute, bufferType ) );
		}
		else if ( data.version < attribute.version ) {
			updateBuffer( data.buffer, attribute, bufferType );
			data.version = attribute.version;
		}

	}

	return {
		get: get,
		remove: remove,
		update: update
	};
}


export { WebGLAttributes };
