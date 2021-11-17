import {
    AdditiveBlending,
    Color,
    LinearFilter,
    MeshBasicMaterial,
    RGBAFormat,
    ShaderMaterial,
    UniformsUtils,
    Vector2,
    Vector3,
    WebGLRenderTarget
} from '../../../build/three.module.js';
import {Pass} from './Pass.js';
import {CopyShader} from '../shaders/CopyShader.js';
import {LuminosityHighPassShader} from '../shaders/LuminosityHighPassShader.js';

/**
 * 虚幻泛光通道
 * @param resolution {THREE.Vector2} 表示泛光所覆盖的场景大小
 * @param strength 表示泛光的强度，值越大明亮的区域越亮，较暗区域变亮的范围越广
 * @param radius 表示泛光散发的半径
 * @param threshold 表示产生泛光的光照强度阈值，如果照在物体上的光照强度大于该值就会产生泛光
 * @constructor
 */
var UnrealBloomPass = function (resolution, strength, radius, threshold) {

    Pass.call(this);

    this.strength = (strength !== undefined) ? strength : 1;
    this.radius = radius;
    this.threshold = threshold;
    this.resolution = (resolution !== undefined) ? new Vector2(resolution.x, resolution.y) : new Vector2(256, 256);

    // create color only once here, reuse it later inside the render function
    this.clearColor = new Color(0, 0, 0);

    // 渲染目标 render targets
    var pars = {
        minFilter: LinearFilter, // 纹理放大像素的截取类型
        magFilter: LinearFilter, // 纹理缩小像素的截取类型
        format: RGBAFormat // 图像的内部格式
    };
    this.renderTargetsHorizontal = [];       // 放置水平渲染目标
    this.renderTargetsVertical = [];         // 放置垂直渲染目标
    this.nMips = 5;                          // 渲染大小递减 1/2

    var resx = Math.round(this.resolution.x / 2); // 渲染目标的宽度
    var resy = Math.round(this.resolution.y / 2); // 渲染目标的长度

    // 提取亮区存放
    this.renderTargetBright = new WebGLRenderTarget(resx, resy, pars);
    this.renderTargetBright.texture.name = 'UnrealBloomPass.bright';
    this.renderTargetBright.texture.generateMipmaps = false;

    for (var i = 0; i < this.nMips; i++) {

        var renderTargetHorizonal = new WebGLRenderTarget(resx, resy, pars);

        renderTargetHorizonal.texture.name = 'UnrealBloomPass.h' + i;
        renderTargetHorizonal.texture.generateMipmaps = false;
        this.renderTargetsHorizontal.push(renderTargetHorizonal);

        var renderTargetVertical = new WebGLRenderTarget(resx, resy, pars);

        renderTargetVertical.texture.name = 'UnrealBloomPass.v' + i;
        renderTargetVertical.texture.generateMipmaps = false;
        this.renderTargetsVertical.push(renderTargetVertical);

        resx = Math.round(resx / 2);
        resy = Math.round(resy / 2);
    }

    // luminosity high pass material 高亮通道材质
    if (LuminosityHighPassShader === undefined) {
        console.error('THREE.UnrealBloomPass relies on LuminosityHighPassShader');
    }
    var highPassShader = LuminosityHighPassShader;
    this.highPassUniforms = UniformsUtils.clone(highPassShader.uniforms);
    this.highPassUniforms['luminosityThreshold'].value = threshold;
    this.highPassUniforms['smoothWidth'].value = 0.01;// 渐变的宽度

    this.materialHighPassFilter = new ShaderMaterial({
        uniforms: this.highPassUniforms,
        vertexShader: highPassShader.vertexShader,
        fragmentShader: highPassShader.fragmentShader,
        defines: {}
    });

    // Gaussian Blur Materials 高斯模糊材质集合
    this.separableBlurMaterials = [];
    var kernelSizeArray = [3, 5, 7, 9, 11];
    var resx = Math.round(this.resolution.x / 2);
    var resy = Math.round(this.resolution.y / 2);

    for (var i = 0; i < this.nMips; i++) {
        this.separableBlurMaterials.push(this.getSeperableBlurMaterial(kernelSizeArray[i]));

        this.separableBlurMaterials[i].uniforms['texSize'].value = new Vector2(resx, resy);

        resx = Math.round(resx / 2);
        resy = Math.round(resy / 2);
    }

    // Composite material
    this.compositeMaterial = this.getCompositeMaterial(this.nMips);
    this.compositeMaterial.uniforms['blurTexture1'].value = this.renderTargetsVertical[0].texture;
    this.compositeMaterial.uniforms['blurTexture2'].value = this.renderTargetsVertical[1].texture;
    this.compositeMaterial.uniforms['blurTexture3'].value = this.renderTargetsVertical[2].texture;
    this.compositeMaterial.uniforms['blurTexture4'].value = this.renderTargetsVertical[3].texture;
    this.compositeMaterial.uniforms['blurTexture5'].value = this.renderTargetsVertical[4].texture;
    this.compositeMaterial.uniforms['bloomStrength'].value = strength;
    this.compositeMaterial.uniforms['bloomRadius'].value = 0.1;
    this.compositeMaterial.needsUpdate = true;

    var bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];
    this.compositeMaterial.uniforms['bloomFactors'].value = bloomFactors;
    this.bloomTintColors = [new Vector3(1, 1, 1), new Vector3(1, 1, 1), new Vector3(1, 1, 1),
        new Vector3(1, 1, 1), new Vector3(1, 1, 1)];
    this.compositeMaterial.uniforms['bloomTintColors'].value = this.bloomTintColors;

    // copy material
    if (CopyShader === undefined) {

        console.error('THREE.UnrealBloomPass relies on CopyShader');

    }

    var copyShader = CopyShader;

    this.copyUniforms = UniformsUtils.clone(copyShader.uniforms);
    this.copyUniforms['opacity'].value = 1.0;

    this.materialCopy = new ShaderMaterial({
        uniforms: this.copyUniforms,
        vertexShader: copyShader.vertexShader,
        fragmentShader: copyShader.fragmentShader,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        transparent: true
    });

    this.enabled = true;
    this.needsSwap = false;

    this._oldClearColor = new Color();
    this.oldClearAlpha = 1;

    // 使用正射相机显示场景
    this.basic = new MeshBasicMaterial();        // 平面材质
    this.fsQuad = new Pass.FullScreenQuad(null);
};

UnrealBloomPass.prototype = Object.assign(Object.create(Pass.prototype), {

    constructor: UnrealBloomPass,

    dispose: function () {

        for (var i = 0; i < this.renderTargetsHorizontal.length; i++) {

            this.renderTargetsHorizontal[i].dispose();

        }

        for (var i = 0; i < this.renderTargetsVertical.length; i++) {

            this.renderTargetsVertical[i].dispose();

        }

        this.renderTargetBright.dispose();

    },

    /**
     * 设置渲染范围
     * @param width
     * @param height
     */
    setSize: function (width, height) {

        var resx = Math.round(width / 2);
        var resy = Math.round(height / 2);

        this.renderTargetBright.setSize(resx, resy);

        for (var i = 0; i < this.nMips; i++) {

            this.renderTargetsHorizontal[i].setSize(resx, resy);
            this.renderTargetsVertical[i].setSize(resx, resy);

            this.separableBlurMaterials[i].uniforms['texSize'].value = new Vector2(resx, resy);

            resx = Math.round(resx / 2);
            resy = Math.round(resy / 2);

        }
    },

    /**
     * 渲染
     * @param renderer 渲染器
     * @param writeBuffer 读缓冲目标
     * @param readBuffer 写缓冲目标
     * @param deltaTime
     * @param maskActive
     */
    render: function (renderer, writeBuffer, readBuffer, deltaTime, maskActive) {

        // 记录清空颜色透明度
        renderer.getClearColor(this._oldClearColor);
        this.oldClearAlpha = renderer.getClearAlpha();

        var oldAutoClear = renderer.autoClear;
        renderer.autoClear = false;

        renderer.setClearColor(this.clearColor, 0);

        if (maskActive) renderer.state.buffers.stencil.setTest(false);

        // Render input to screen
        if (this.renderToScreen) {

            this.fsQuad.material = this.basic;
            this.basic.map = readBuffer.texture;

            renderer.setRenderTarget(null);
            renderer.clear();
            this.fsQuad.render(renderer);
        }

        // 1. Extract Bright Areas 提取亮区
        this.highPassUniforms['tDiffuse'].value = readBuffer.texture;
        this.highPassUniforms['luminosityThreshold'].value = this.threshold;
        this.fsQuad.material = this.materialHighPassFilter;

        renderer.setRenderTarget(this.renderTargetBright);
        renderer.clear();
        this.fsQuad.render(renderer);

        /**
         * Blur All the mips progressively 高斯模糊
         * 处理流程：
         * 1. 设置高斯核半径KERNEL_RADIUS;
         * 2. 降低目标纹理分辨率（用纹理缩放倍数表示）
         * 3. 对亮度纹理进行纵向、横向两次高斯模糊处理
         */
        var inputRenderTarget = this.renderTargetBright;
        for (var i = 0; i < this.nMips; i++) {

            this.fsQuad.material = this.separableBlurMaterials[i];

            this.separableBlurMaterials[i].uniforms['colorTexture'].value = inputRenderTarget.texture;
            this.separableBlurMaterials[i].uniforms['direction'].value = UnrealBloomPass.BlurDirectionX;
            renderer.setRenderTarget(this.renderTargetsHorizontal[i]);
            renderer.clear();
            this.fsQuad.render(renderer);

            this.separableBlurMaterials[i].uniforms['colorTexture'].value = this.renderTargetsHorizontal[i].texture;
            this.separableBlurMaterials[i].uniforms['direction'].value = UnrealBloomPass.BlurDirectionY;
            renderer.setRenderTarget(this.renderTargetsVertical[i]);
            renderer.clear();
            this.fsQuad.render(renderer);

            inputRenderTarget = this.renderTargetsVertical[i];
        }

        // Composite All the mips
        this.fsQuad.material = this.compositeMaterial;
        this.compositeMaterial.uniforms['bloomStrength'].value = this.strength;
        this.compositeMaterial.uniforms['bloomRadius'].value = this.radius;
        this.compositeMaterial.uniforms['bloomTintColors'].value = this.bloomTintColors;

        renderer.setRenderTarget(this.renderTargetsHorizontal[0]);
        renderer.clear();
        this.fsQuad.render(renderer);

        // Blend it additively over the input texture 合并纹理
        this.fsQuad.material = this.materialCopy;
        this.copyUniforms['tDiffuse'].value = this.renderTargetsHorizontal[0].texture;

        if (maskActive) renderer.state.buffers.stencil.setTest(true);

        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
            this.fsQuad.render(renderer);
        } else {
            renderer.setRenderTarget(readBuffer);
            this.fsQuad.render(renderer);
        }

        // Restore renderer settings

        renderer.setClearColor(this._oldClearColor, this.oldClearAlpha);
        renderer.autoClear = oldAutoClear;
    },

    /**
     * 获取可分离的模糊材质
     * @param kernelRadius {number} 内核半径
     * @returns {ShaderMaterial}
     */
    getSeperableBlurMaterial: function (kernelRadius) {
        return new ShaderMaterial({
            defines: {
                'KERNEL_RADIUS': kernelRadius, // 半径
                'SIGMA': kernelRadius
            },

            uniforms: {
                'colorTexture': {value: null},
                'texSize': {value: new Vector2(0.5, 0.5)},
                'direction': {value: new Vector2(0.5, 0.5)}
            },

            vertexShader:
                'varying vec2 vUv;\n\
                void main() {\n\
                    vUv = uv;\n\
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
                }',

            fragmentShader:
                '#include <common>\
                \
                varying vec2 vUv;\n\
                uniform sampler2D colorTexture;\n\
                uniform vec2 texSize;\
                uniform vec2 direction;\
                \
                float gaussianPdf(in float x, in float sigma) {\
                    return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;\
                }\
                \
                void main() {\n\
                    vec2 invSize = 1.0 / texSize;\
                    float fSigma = float(SIGMA);\
                    float weightSum = gaussianPdf(0.0, fSigma);\
                    vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;\
                    \
                    for( int i = 1; i < KERNEL_RADIUS; i ++ ) {\
                        float x = float(i);\
                        float w = gaussianPdf(x, fSigma);\
                        vec2 uvOffset = direction * invSize * x;\
                        vec3 sample1 = texture2D( colorTexture, vUv + uvOffset).rgb;\
                        vec3 sample2 = texture2D( colorTexture, vUv - uvOffset).rgb;\
                        diffuseSum += (sample1 + sample2) * w;\
                        weightSum += 2.0 * w;\
                    }\
                    \
                    gl_FragColor = vec4(diffuseSum/weightSum, 1.0);\n\
                }'
        });
    },

    /**
     * 获取复合材质
     * @param nMips
     * @returns {ShaderMaterial}
     */
    getCompositeMaterial: function (nMips) {

        return new ShaderMaterial({

            defines: {
                'NUM_MIPS': nMips
            },

            uniforms: {
                'blurTexture1': {value: null},
                'blurTexture2': {value: null},
                'blurTexture3': {value: null},
                'blurTexture4': {value: null},
                'blurTexture5': {value: null},
                'dirtTexture': {value: null},
                'bloomStrength': {value: 1.0},
                'bloomFactors': {value: null},
                'bloomTintColors': {value: null},
                'bloomRadius': {value: 0.0}
            },

            vertexShader:
                'varying vec2 vUv;\n\
        void main() {\n\
          vUv = uv;\n\
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\
                }',

            fragmentShader:
                'varying vec2 vUv;\
        uniform sampler2D blurTexture1;\
        uniform sampler2D blurTexture2;\
        uniform sampler2D blurTexture3;\
        uniform sampler2D blurTexture4;\
        uniform sampler2D blurTexture5;\
        uniform sampler2D dirtTexture;\
        uniform float bloomStrength;\
        uniform float bloomRadius;\
        uniform float bloomFactors[NUM_MIPS];\
        uniform vec3 bloomTintColors[NUM_MIPS];\
        \
        float lerpBloomFactor(const in float factor) { \
          float mirrorFactor = 1.2 - factor;\
          return mix(factor, mirrorFactor, bloomRadius);\
        }\
        \
        void main() {\
                    gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) + \
              lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) + \
              lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) + \
              lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) + \
                                                     lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );\
                }'
        });

    }

});

UnrealBloomPass.BlurDirectionX = new Vector2(1.0, 0.0);
UnrealBloomPass.BlurDirectionY = new Vector2(0.0, 1.0);

export {UnrealBloomPass};
