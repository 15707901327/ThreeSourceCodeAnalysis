/**
 * @author mrdoob / http://mrdoob.com/
 */

function WebGLIndexedBufferRenderer( gl, extensions, info, capabilities ) {

	var isWebGL2 = capabilities.isWebGL2;

	var mode; // 绘制图形的方式

  /**
   * 设置绘制图形的方式
   * @param value
   */
	function setMode( value ) {

		mode = value;

	}

	var type, bytesPerElement;

	function setIndex( value ) {

		type = value.type;
		bytesPerElement = value.bytesPerElement;

	}

  /**
   * 绘制图形，更新info信息
   * @param start 从哪个顶点开始绘制
   * @param count 指定绘制需要用到多少顶点
   */
	function render( start, count ) {

		gl.drawElements( mode, count, type, start * bytesPerElement );

		info.update( count, mode );

	}

  /**
   * 渲染实例
   * @param geometry
   * @param start
   * @param count
   * @param primcount
   */
	function renderInstances( geometry, start, count, primcount ) {

		if ( primcount === 0 ) return;

		var extension, methodName;

		if ( isWebGL2 ) {
			extension = gl;
			methodName = 'drawElementsInstanced';
		}
		else {
			extension = extensions.get( 'ANGLE_instanced_arrays' );
			methodName = 'drawElementsInstancedANGLE';
			if ( extension === null ) {
				console.error( 'THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.' );
				return;
			}
		}

		extension[ methodName ]( mode, count, type, start * bytesPerElement, primcount );
		info.update( count, mode, primcount );
	}

	//

	this.setMode = setMode;
	this.setIndex = setIndex;
	this.render = render;
	this.renderInstances = renderInstances;

}


export { WebGLIndexedBufferRenderer };
