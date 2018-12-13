/**
 * @author mrdoob / http://mrdoob.com/
 */

function WebGLIndexedBufferRenderer(gl, extensions, info, capabilities) {

  var mode; // 绘制图形的方式

  /**
   * 设置绘制图形的方式
   * @param value
   */
  function setMode(value) {

    mode = value;

  }

  var type, bytesPerElement;

  function setIndex(value) {

    type = value.type;
    bytesPerElement = value.bytesPerElement;

  }

  /**
   * 绘制图形，更新info信息
   * @param start 从哪个顶点开始绘制
   * @param count 指定绘制需要用到多少顶点
   */
  function render(start, count) {

    gl.drawElements(mode, count, type, start * bytesPerElement);

    info.update(count, mode);

  }

  function renderInstances(geometry, start, count) {

    var extension;

    if (capabilities.isWebGL2) {

      extension = gl;

    } else {

      var extension = extensions.get('ANGLE_instanced_arrays');

      if (extension === null) {

        console.error('THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.');
        return;

      }

    }

    extension[capabilities.isWebGL2 ? 'drawElementsInstanced' : 'drawElementsInstancedANGLE'](mode, count, type, start * bytesPerElement, geometry.maxInstancedCount);

    info.update(count, mode, geometry.maxInstancedCount);

  }

  //

  this.setMode = setMode;
  this.setIndex = setIndex;
  this.render = render;
  this.renderInstances = renderInstances;

}


export {WebGLIndexedBufferRenderer};
