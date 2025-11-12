import {
    Color
} from "../../../../build/three_r125.module.js";

/**
 * Luminosity
 * 注：加权平均的方式来提取亮度
 * http://en.wikipedia.org/wiki/Luminosity
 */
var LuminosityHighPassShader = {

    shaderID: 'luminosityHighPass',

    uniforms: {

        'tDiffuse': {value: null},
        'luminosityThreshold': {value: 1.0},
        'smoothWidth': {value: 1.0},
        'defaultColor': {value: new Color(0x000000)},
        'defaultOpacity': {value: 0.0}

    },

    vertexShader: [

        'varying vec2 vUv;',

        'void main() {',

        '	vUv = uv;',

        '	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

        '}'

    ].join('\n'),

    fragmentShader: [

        'uniform sampler2D tDiffuse;',
        'uniform vec3 defaultColor;',
        'uniform float defaultOpacity;',
        'uniform float luminosityThreshold;',
        'uniform float smoothWidth;',

        'varying vec2 vUv;',

        'void main() {',

        '	vec4 texel = texture2D( tDiffuse, vUv );',

        /*
         * 是平均方法的一个更复杂的版本。它也是平均值，但它通过加权平均来解释人类感知。我们对绿色比其他颜色更敏感，所以绿色加权最大。
         * 其计算公式为亮度为0.21 R +0.72 G +0.07 B.
         */
        '	vec3 luma = vec3( 0.299, 0.587, 0.114 );',
        '	float v = dot( texel.xyz, luma );',

        '	vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );',

        '	float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );',

        '	gl_FragColor = mix( outputColor, texel, alpha );',

        '}'

    ].join('\n')

};

export {LuminosityHighPassShader};
