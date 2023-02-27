import {
    Color
} from 'three';
import {Pass} from './Pass.js';

/**
 * 渲染通道：它只会渲染场景，但不会把结果输出到场景上
 * @param scene 场景
 * @param camera 相机
 * @param overrideMaterial
 * @param clearColor
 * @param clearAlpha
 * @constructor
 */
class RenderPass extends Pass {

    constructor(scene, camera, overrideMaterial, clearColor, clearAlpha) {

        super();

        this.scene = scene;
        this.camera = camera;

        this.overrideMaterial = overrideMaterial;

        this.clearColor = clearColor;
        this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha : 0;

        this.clear = true;
        this.clearDepth = false;
        this.needsSwap = false;
        this._oldClearColor = new Color();

    }

    /**
     * 渲染场景到 readBuffer上
     * @param renderer 渲染器
     * @param writeBuffer 写入缓冲
     * @param readBuffer 读取缓冲
     */
    render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {

        // 关闭自动清空缓冲
        const oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        let oldClearAlpha, oldOverrideMaterial;

        if (this.overrideMaterial !== undefined) {

            oldOverrideMaterial = this.scene.overrideMaterial;

            this.scene.overrideMaterial = this.overrideMaterial;

        }

        if (this.clearColor) {

            renderer.getClearColor(this._oldClearColor);
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

            renderer.setClearColor(this._oldClearColor, oldClearAlpha);

        }

        if (this.overrideMaterial !== undefined) {

            this.scene.overrideMaterial = oldOverrideMaterial;

        }

        renderer.autoClear = oldAutoClear;

    }

}

export {RenderPass};
