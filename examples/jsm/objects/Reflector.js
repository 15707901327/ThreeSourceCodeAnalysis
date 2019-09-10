/**
 * @author Slayvin / http://slayvin.net
 */

import {
  Color,
  LinearFilter,
  Math as _Math,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Plane,
  RGBFormat,
  ShaderMaterial,
  UniformsUtils,
  Vector3,
  Vector4,
  WebGLRenderTarget
} from "../../../build/three_r108.module.js";

/**
 * 镜像反射类
 * @param geometry 几何体
 * @param options 参数
 *  color：颜色  0x7F7F7F
 *  textureWidth：512
 *  textureHeight：512
 *  clipBias：0
 *  shader：着色器
 *  recursion：循环渲染 0
 * @constructor
 */
var Reflector = function(geometry, options) {

  Mesh.call(this, geometry);

  this.type = 'Reflector';

  var scope = this;

  options = options || {};

  var color = (options.color !== undefined) ? new Color(options.color) : new Color(0x7F7F7F);
  var textureWidth = options.textureWidth || 512;
  var textureHeight = options.textureHeight || 512;
  var clipBias = options.clipBias || 0;
  var shader = options.shader || Reflector.ReflectorShader;
  var recursion = options.recursion !== undefined ? options.recursion : 0;

  //
  var reflectorPlane = new Plane();
  var normal = new Vector3();
  var reflectorWorldPosition = new Vector3(); // 物体世界坐标
  var cameraWorldPosition = new Vector3(); // 相机世界坐标
  var rotationMatrix = new Matrix4(); // 旋转矩阵
  var lookAtPosition = new Vector3(0, 0, -1);
  var clipPlane = new Vector4();

  var view = new Vector3(); // 相机的位置
  var target = new Vector3(); // 相机的视点
  var q = new Vector4();

  var textureMatrix = new Matrix4();
  var virtualCamera = new PerspectiveCamera();

  // 渲染目标
  var parameters = {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    format: RGBFormat,//图像的内部格式
    stencilBuffer: false // 模板缓冲区
  };
  var renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, parameters);

  if (!_Math.isPowerOfTwo(textureWidth) || !_Math.isPowerOfTwo(textureHeight)) {
    renderTarget.texture.generateMipmaps = false;
  }

  var material = new ShaderMaterial({
    uniforms: UniformsUtils.clone(shader.uniforms),
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader
  });
  material.uniforms["tDiffuse"].value = renderTarget.texture;
  material.uniforms["color"].value = color;
  material.uniforms["textureMatrix"].value = textureMatrix;
  this.material = material;

  this.onBeforeRender = function(renderer, scene, camera) {
    if ('recursion' in camera.userData) {
      if (camera.userData.recursion === recursion) return;
      camera.userData.recursion++;
    }

    // 获取物体世界坐标、相机世界坐标、旋转矩阵
    reflectorWorldPosition.setFromMatrixPosition(scope.matrixWorld);
    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
    rotationMatrix.extractRotation(scope.matrixWorld);

    // 设置平面法线
    normal.set(0, 0, 1);
    normal.applyMatrix4(rotationMatrix);

    // 计算镜面反射后相机的位置
    view.subVectors(reflectorWorldPosition, cameraWorldPosition);
    // Avoid rendering when reflector is facing away（反射器背对时避免渲染）
    if (view.dot(normal) > 0) return;

    view.reflect(normal).negate();
    view.add(reflectorWorldPosition);

    // 镜像后相机视点的坐标
    rotationMatrix.extractRotation(camera.matrixWorld);
    lookAtPosition.set(0, 0, -1); // 设置相机的视点，与法线相反
    lookAtPosition.applyMatrix4(rotationMatrix);
    lookAtPosition.add(cameraWorldPosition);

    target.subVectors(reflectorWorldPosition, lookAtPosition);
    target.reflect(normal).negate();
    target.add(reflectorWorldPosition);

    // 设置相机
    virtualCamera.position.copy(view);
    // 计算镜面反射后相机的上方向
    virtualCamera.up.set(0, 1, 0); // 相机的默认上方向
    virtualCamera.up.applyMatrix4(rotationMatrix);
    virtualCamera.up.reflect(normal);
    virtualCamera.lookAt(target);

    virtualCamera.far = camera.far; // Used in WebGLBackground

    virtualCamera.updateMatrixWorld();
    virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

    virtualCamera.userData.recursion = 0;

    // Update the texture matrix
    // 计算投影纹理矩阵
    textureMatrix.set(
      0.5, 0.0, 0.0, 0.5,
      0.0, 0.5, 0.0, 0.5,
      0.0, 0.0, 0.5, 0.5,
      0.0, 0.0, 0.0, 1.0
    );
    textureMatrix.multiply(virtualCamera.projectionMatrix);
    textureMatrix.multiply(virtualCamera.matrixWorldInverse);
    textureMatrix.multiply(scope.matrixWorld);

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition);
    reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);

    clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant);

    var projectionMatrix = virtualCamera.projectionMatrix;

    // 计算与剪裁平面相对的剪辑空间角点（sgn（clipPlane.x），sgn（clipPlane.y），1,1）
    // 并通过将其乘以投影矩阵的倒数将其转换为相机空间
    q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
    q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
    q.z = -1.0;
    q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

    // Calculate the scaled plane vector（计算缩放平面向量）
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

    // Replacing the third row of the projection matrix（替换投影矩阵的第三行）
    projectionMatrix.elements[2] = clipPlane.x;
    projectionMatrix.elements[6] = clipPlane.y;
    projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
    projectionMatrix.elements[14] = clipPlane.w;

    // Render

    scope.visible = false;

    var currentRenderTarget = renderer.getRenderTarget();

    var currentVrEnabled = renderer.vr.enabled;
    var currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

    renderer.vr.enabled = false; // Avoid camera modification and recursion
    renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    renderer.setRenderTarget(renderTarget);
    renderer.clear();
    renderer.render(scene, virtualCamera);

    renderer.vr.enabled = currentVrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

    renderer.setRenderTarget(currentRenderTarget);

    // Restore viewport

    var viewport = camera.viewport;

    if (viewport !== undefined) {
      renderer.state.viewport(viewport);
    }
    scope.visible = true;
  };

  this.getRenderTarget = function() {

    return renderTarget;

  };

};

Reflector.prototype = Object.create(Mesh.prototype);
Reflector.prototype.constructor = Reflector;

Reflector.ReflectorShader = {

  uniforms: {

    'color': {
      value: null
    },

    'tDiffuse': {
      value: null
    },

    'textureMatrix': {
      value: null
    }

  },
  vertexShader: [
    'uniform mat4 textureMatrix;',
    'varying vec4 vUv;',
    'void main() {',
    '	vUv = textureMatrix * vec4( position, 1.0 ); // 获取投影纹理坐标',
    '	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
    '}'
  ].join('\n'),
  fragmentShader: [
    'uniform vec3 color;',
    'uniform sampler2D tDiffuse;',
    'varying vec4 vUv;',

    'float blendOverlay( float base, float blend ) {',
    '	return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );',
    '}',

    'vec3 blendOverlay( vec3 base, vec3 blend ) {',
    '	return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );',
    '}',

    'void main() {',
    '	vec4 base = texture2DProj( tDiffuse, vUv );',
    '	gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',
    '}'
  ].join('\n')
};

export {Reflector};
