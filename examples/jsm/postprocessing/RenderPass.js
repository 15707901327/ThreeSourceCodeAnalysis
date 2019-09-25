/**
 * @author alteredq / http://alteredqualia.com/
 */


import {Pass} from "../postprocessing/Pass.js";

/**
 * 渲染通道：它只会渲染场景，但不会把结果输出到场景上
 * @param scene 场景
 * @param camera 相机
 * @param overrideMaterial
 * @param clearColor
 * @param clearAlpha
 * @constructor
 */
var RenderPass = function(scene, camera, overrideMaterial, clearColor, clearAlpha) {

  Pass.call(this);

  this.scene = scene;
  this.camera = camera;

  this.overrideMaterial = overrideMaterial;

  this.clearColor = clearColor;
  this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha : 0;

  this.clear = true;
  this.clearDepth = false;
  this.needsSwap = false;
};

RenderPass.prototype = Object.assign(Object.create(Pass.prototype), {

  constructor: RenderPass,

  /**
   * 渲染场景到 readBuffer上
   * @param renderer 渲染器
   * @param writeBuffer 深度渲染缓冲
   * @param readBuffer 可读渲染缓冲
   */
  render: function(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {

    // 关闭自动清空缓冲
    var oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;

    this.scene.overrideMaterial = this.overrideMaterial;

    var oldClearColor, oldClearAlpha;

    if (this.clearColor) {
      oldClearColor = renderer.getClearColor().getHex();
      oldClearAlpha = renderer.getClearAlpha();
      renderer.setClearColor(this.clearColor, this.clearAlpha);
    }

    if (this.clearDepth) {
      renderer.clearDepth();
    }

    // 设置渲染目标
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);

    // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
    if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
    renderer.render(this.scene, this.camera);

    if (this.clearColor) {
      renderer.setClearColor(oldClearColor, oldClearAlpha);
    }

    this.scene.overrideMaterial = null;
    renderer.autoClear = oldAutoClear;
  }
});

export {RenderPass};
