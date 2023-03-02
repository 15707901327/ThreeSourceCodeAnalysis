import {
    Clock,
    Vector2,
    WebGLRenderTarget
} from 'three';
import {CopyShader} from '../shaders/CopyShader.js';
import {ShaderPass} from './ShaderPass.js';
import {MaskPass} from './MaskPass.js';
import {ClearMaskPass} from './MaskPass.js';

/**
 * 后期渲染合成器
 * @param renderer 渲染器
 * @param renderTarget 渲染目标
 * @constructor
 */
class EffectComposer {

    constructor(renderer, renderTarget) {

        this.renderer = renderer;

        if (renderTarget === undefined) {

            const size = renderer.getSize(new Vector2());
            this._pixelRatio = renderer.getPixelRatio();
            this._width = size.width;
            this._height = size.height;

            renderTarget = new WebGLRenderTarget(this._width * this._pixelRatio, this._height * this._pixelRatio);
            renderTarget.texture.name = 'EffectComposer.rt1';

        } else {

            this._pixelRatio = 1;
            this._width = renderTarget.width;
            this._height = renderTarget.height;

        }

        this.renderTarget1 = renderTarget;
        this.renderTarget2 = renderTarget.clone();
        this.renderTarget2.texture.name = 'EffectComposer.rt2';

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

        // 渲染到屏幕
        this.renderToScreen = true;

        // 保存渲染通道
        this.passes = [];

        this.copyPass = new ShaderPass(CopyShader);

        this.clock = new Clock();

    }

    swapBuffers() {

        const tmp = this.readBuffer;
        this.readBuffer = this.writeBuffer;
        this.writeBuffer = tmp;

    }

    /**
     * 添加通道
     * @param pass
     */
    addPass(pass) {

        this.passes.push(pass);
        pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);

    }

    insertPass(pass, index) {

        this.passes.splice(index, 0, pass);
        pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);

    }

    removePass(pass) {

        const index = this.passes.indexOf(pass);

        if (index !== -1) {

            this.passes.splice(index, 1);

        }

    }

    /**
     * 检查是否是最后一个启动的渲染通道
     * @param passIndex
     * @returns {boolean}
     */
    isLastEnabledPass(passIndex) {

        for (let i = passIndex + 1; i < this.passes.length; i++) {

            if (this.passes[i].enabled) {

                return false;

            }

        }

        return true;

    }

    /**
     * 渲染
     * @param deltaTime 时间
     */
    render(deltaTime) {

        // deltaTime value is in seconds

        if (deltaTime === undefined) {

            deltaTime = this.clock.getDelta();

        }

        // 获取当前渲染目标
        const currentRenderTarget = this.renderer.getRenderTarget();

        let maskActive = false;

        for (let i = 0, il = this.passes.length; i < il; i++) {

            const pass = this.passes[i];

            if (pass.enabled === false) continue;

            // 调用渲染通道的渲染
            pass.renderToScreen = (this.renderToScreen && this.isLastEnabledPass(i));
            pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive);

            if (pass.needsSwap) {

                if (maskActive) {

                    const context = this.renderer.getContext();
                    const stencil = this.renderer.state.buffers.stencil;

                    //context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );
                    stencil.setFunc(context.NOTEQUAL, 1, 0xffffffff);

                    this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime);

                    //context.stencilFunc( context.EQUAL, 1, 0xffffffff );
                    stencil.setFunc(context.EQUAL, 1, 0xffffffff);

                }

                this.swapBuffers();

            }

            if (MaskPass !== undefined) {

                if (pass instanceof MaskPass) {

                    maskActive = true;

                } else if (pass instanceof ClearMaskPass) {

                    maskActive = false;

                }

            }

        }

        this.renderer.setRenderTarget(currentRenderTarget);

    }

    reset(renderTarget) {

        if (renderTarget === undefined) {

            const size = this.renderer.getSize(new Vector2());
            this._pixelRatio = this.renderer.getPixelRatio();
            this._width = size.width;
            this._height = size.height;

            renderTarget = this.renderTarget1.clone();
            renderTarget.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);

        }

        this.renderTarget1.dispose();
        this.renderTarget2.dispose();
        this.renderTarget1 = renderTarget;
        this.renderTarget2 = renderTarget.clone();

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

    }

    setSize(width, height) {

        this._width = width;
        this._height = height;

        const effectiveWidth = this._width * this._pixelRatio;
        const effectiveHeight = this._height * this._pixelRatio;

        this.renderTarget1.setSize(effectiveWidth, effectiveHeight);
        this.renderTarget2.setSize(effectiveWidth, effectiveHeight);

        for (let i = 0; i < this.passes.length; i++) {

            this.passes[i].setSize(effectiveWidth, effectiveHeight);

        }

    }

    setPixelRatio(pixelRatio) {

        this._pixelRatio = pixelRatio;

        this.setSize(this._width, this._height);

    }

    dispose() {

        this.renderTarget1.dispose();
        this.renderTarget2.dispose();

        this.copyPass.dispose();

    }

}

export {EffectComposer};
