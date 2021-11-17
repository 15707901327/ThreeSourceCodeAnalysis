
/**
 * 渲染通道
 * 作用：渲染场景到渲染目标以供后面通道使用，或者渲染到屏幕（与render一致）
 * @param scene {THREE.Scene} 场景
 * @param camera {THREE.Camera} 相机
 * @param overrideMaterial
 * @param clearColor
 * @param clearAlpha
 * @constructor
 */


import { Pass } from "./Pass.js";

var RenderPass = function (scene, camera, overrideMaterial, clearColor, clearAlpha) {

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
     *
     * @param renderer 渲染器
     * @param writeBuffer { WebGLRenderTarget } 写入缓存区
     * @param readBuffer { WebGLRenderTarget } 读取缓冲区
     */
    render: function (renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {

        // 取消自动刷新
        var oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

		var oldClearColor, oldClearAlpha, oldOverrideMaterial;

        if (this.overrideMaterial !== undefined) {

            oldOverrideMaterial = this.scene.overrideMaterial;

            this.scene.overrideMaterial = this.overrideMaterial;

        }

        if (this.clearColor) {

			oldClearColor = renderer.getClearColor().getHex();
            oldClearAlpha = renderer.getClearAlpha();

            renderer.setClearColor(this.clearColor, this.clearAlpha);

        }

        if (this.clearDepth) {

            renderer.clearDepth();

        }

        renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);

        // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
        if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
        renderer.render(this.scene, this.camera);

        if (this.clearColor) {

			renderer.setClearColor( oldClearColor, oldClearAlpha );

        }

        if (this.overrideMaterial !== undefined) {

            this.scene.overrideMaterial = oldOverrideMaterial;

        }

        renderer.autoClear = oldAutoClear;

    }

});

export {RenderPass};
