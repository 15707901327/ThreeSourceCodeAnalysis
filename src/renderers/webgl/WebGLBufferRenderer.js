/**
 * @author mrdoob / http://mrdoob.com/
 */

function WebGLBufferRenderer(gl, extensions, info, capabilities) {

	var isWebGL2 = capabilities.isWebGL2;

  var mode;

  function setMode(value) {

    mode = value;

  }

  /**
   * 绘制图形，更新info信息
   * @param start 从哪个顶点开始绘制
   * @param count 指定绘制需要用到多少顶点
   */
  function render(start, count) {

    gl.drawArrays(mode, start, count);

    info.update(count, mode);

  }

  /**
   * 绘制instance
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
			methodName = 'drawArraysInstanced';
    }
		else {
      extension = extensions.get('ANGLE_instanced_arrays');
			methodName = 'drawArraysInstancedANGLE';
      if (extension === null) {
        console.error('THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.');
        return;
      }
    }

		extension[ methodName ]( mode, start, count, primcount );

		info.update( count, mode, primcount );
  }

  this.setMode = setMode;
  this.render = render;
  this.renderInstances = renderInstances;

}


export {WebGLBufferRenderer};
