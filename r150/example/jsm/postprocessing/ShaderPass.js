import {
    ShaderMaterial,
    UniformsUtils
} from 'three';
import {Pass, FullScreenQuad} from './Pass.js';

/**
 * shader材质通道
 * @param shader shader或则shader数据
 * @param textureID
 * @constructor
 */
class ShaderPass extends Pass {

    constructor(shader, textureID) {

        super();

        this.textureID = (textureID !== undefined) ? textureID : 'tDiffuse';

        if (shader instanceof ShaderMaterial) {

            this.uniforms = shader.uniforms;

            this.material = shader;

        } else if (shader) {

            this.uniforms = UniformsUtils.clone(shader.uniforms);

            this.material = new ShaderMaterial({

                defines: Object.assign({}, shader.defines),
                uniforms: this.uniforms,
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader

            });

        }

        this.fsQuad = new FullScreenQuad(this.material);

    }

    /**
     * 渲染
     * @param renderer 渲染器
     * @param writeBuffer 写入缓冲
     * @param readBuffer 读取缓冲
     */
    render(renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */) {

        if (this.uniforms[this.textureID]) {

            this.uniforms[this.textureID].value = readBuffer.texture;

        }

        this.fsQuad.material = this.material;

        if (this.renderToScreen) {

            renderer.setRenderTarget(null);
            this.fsQuad.render(renderer);

        } else {

            renderer.setRenderTarget(writeBuffer);
            // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
            if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
            this.fsQuad.render(renderer);

        }

    }

    dispose() {

        this.material.dispose();

        this.fsQuad.dispose();

    }

}

export {ShaderPass};
