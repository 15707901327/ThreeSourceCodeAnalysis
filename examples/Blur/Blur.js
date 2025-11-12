import * as THREE from "../../build/three_r108.module.js";
import {Vector2} from "../../build/three_r108.module.js";

let Blur = function() {
};
Blur.GaussianShader = {
  uniforms: {
    h: {value: null},
    v: {value: null},
    tDiffuse: {value: null}
  },
  vertexShader: [
    'varying vec2 vUv;' +
    ' void main(){' +
    ' vUv = uv;' +
    ' gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );' +
    '}'
  ].join('\n'),
  fragmentShader: [
    'uniform sampler2D tDiffuse;' +
    'uniform float h;' +
    'uniform float v;' +
    'varying vec2 vUv;' +
    'void main(){' +
    ' vec4 sum = vec4( 0.0 );' +
    // 纵向高斯模糊'
    ' sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * (0.051/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * (0.0918/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * (0.12245/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * (0.1531/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * (0.1633/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * (0.1531/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * (0.12245/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * (0.0918/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * (0.051/2.0);' +
    // 横向高斯模糊
    ' sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * (0.051/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * (0.0918/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * (0.12245/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * (0.1531/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * (0.1633/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * (0.1531/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * (0.12245/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * (0.0918/2.0);' +
    ' sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * (0.051/2.0);' +
    ' gl_FragColor = sum;' +
    '}'
  ].join('\n')
};
Blur.Gaussian2Shader = {
  uniforms: {
    h: {value: null},
    v: {value: null},
    tDiffuse: {value: null}
  },
  vertexShader: [
    'varying vec2 v_texCoord;' +
    ' void main(){' +
    ' v_texCoord = uv;' +
    ' gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );' +
    '}'
  ].join('\n'),
  fragmentShader: [
    'precision mediump float;' +
    'uniform sampler2D tDiffuse;' +
    'uniform float h;' +
    'uniform float v;' +
    'varying vec2 v_texCoord;' +
    'void main(){' +
    ' const float GlowRange = 1.0;' + // 模糊半径
    ' const float samplerPre = 3.0;' +
    ' float count = 0.0;' +
    ' const float range = GlowRange * 2.0;' +
    ' vec4 clraverge = vec4( 0.0 );' +
    '  for( float i = -range ; i <= range ; i += samplerPre ){' +
    '    for( float j = -range ; j <= range ; j += samplerPre ){' +
    '      float nx = j;' +
    '      float ny = i;' +
    '      float q = range / 1.75;' +
    '      float gr = (1.0 / ( 2.0 * 3.14159 * q * q)) * exp( -( nx * nx + ny * ny) / ( 2.0 * q * q)) * 9.0;' +
    '      vec2 samplerTexCoord = vec2( v_texCoord.x + j * h , v_texCoord.y + i * v );' +
    '      if( samplerTexCoord.x < 0.0)' +
    '        samplerTexCoord.x = -samplerTexCoord.x;' +
    '      else if(samplerTexCoord.x > 1.0)' +
    '        samplerTexCoord.x = 2.0 - samplerTexCoord.x;' +
    '      if(samplerTexCoord.y < 0.0)' +
    '        samplerTexCoord.y = -samplerTexCoord.y;' +
    '      else if(samplerTexCoord.y > 1.0)' +
    '        samplerTexCoord.y = 2.0 - samplerTexCoord.y;' +
    '      vec4 tc = texture2D( tDiffuse, samplerTexCoord );' +
    '      clraverge += tc * gr;' +
    '      count += 1.0;' +
    '    }' +
    '  }' +
    ' gl_FragColor = clraverge;' +
    '}'
  ].join('\n')
};

Blur.MotionShader = {
  uniforms: {
    GlowRange: {value: null},
    GlowExpand: {value: null},
    tDiffuse: {value: null}
  },
  vertexShader: [
    'varying vec2 v_texCoord;' +
    ' void main(){' +
    ' v_texCoord = uv;' +
    ' gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );' +
    '}'
  ].join('\n'),
  fragmentShader: [
    'precision mediump float;' +
    'uniform sampler2D tDiffuse;' +
    // 模糊半径
    'const float GlowRange = 2.0;' +
    // 动感模糊角度
    'uniform float GlowExpand;' +
    'varying vec2 v_texCoord;' +
    'void main(){' +
    ' const float samplerPre = 1.0;' +
    ' const float range = GlowRange * 3.0;' +
    ' vec4 clraverge = vec4( 0.0 );' +
    ' clraverge += texture2D( tDiffuse, v_texCoord);' +
    ' float rad = GlowExpand;' +
    ' for( float j = 1.0; j <= range ; j += samplerPre ){' +
    '  float dx = 0.002 * cos(rad);' +
    '  float dy = 0.002 * sin(rad);' +
    '  vec2 samplerTexCoord = vec2( v_texCoord.x + j * dx, v_texCoord.y + j * dy);' +
    '  vec2 samplerTexCoord1= vec2( v_texCoord.x - j * dx, v_texCoord.y - j * dy);' +
    '  if( samplerTexCoord.x < 0.0 || samplerTexCoord.x > 1.0 || samplerTexCoord1.x < 0.0 || samplerTexCoord1.x > 1.0|| samplerTexCoord.y < 0.0 || samplerTexCoord.y > 1.0 ||samplerTexCoord1.y < 0.0 || samplerTexCoord1.y > 1.0){' +
    '    continue;' +
    '  }' +
    '  vec4 tc = texture2D( tDiffuse, samplerTexCoord );' +
    '  vec4 tc1= texture2D( tDiffuse, samplerTexCoord1 );' +
    '  clraverge += tc;' +
    '  clraverge += tc1;' +
    ' }' +
    ' clraverge /= (range * 2.0);' +
    ' gl_FragColor = clraverge;' +
    '}'
  ].join('\n')
};

Blur.GeneralShader = {
  uniforms: {
    h: {value: null},
    v: {value: null},
    tDiffuse: {value: null}
  },
  vertexShader: [
    'varying vec2 v_texCoord;' +
    ' void main(){' +
    ' v_texCoord = uv;' +
    ' gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );' +
    '}'
  ].join('\n'),
  fragmentShader: [
    'precision mediump float;' +
    'uniform sampler2D tDiffuse;' +
    'uniform float h;' +
    'uniform float v;' +
    'varying vec2 v_texCoord;' +
    'void main(){' +
    ' const float GlowRange = 1.0;' + // 模糊半径
    ' const float samplerPre = 3.0;' +
    ' float count = 0.0;' +
    ' const float range = GlowRange * 2.0;' +
    ' vec4 clraverge = vec4( 0.0 );' +
    ' for( float i = -range ; i <= range ; i += samplerPre ){' +
    '   for( float j = -range ; j <= range ; j += samplerPre ){' +
    '     vec2 samplerTexCoord = vec2( v_texCoord.x + j * h , v_texCoord.y + i * v );' +
    '     if( samplerTexCoord.x < 0.0)' +
    '       samplerTexCoord.x = -samplerTexCoord.x;' +
    '     else if(samplerTexCoord.x > 1.0)' +
    '       samplerTexCoord.x = 2.0 - samplerTexCoord.x;' +
    '     if(samplerTexCoord.y < 0.0)' +
    '       samplerTexCoord.y = -samplerTexCoord.y;' +
    '     else if(samplerTexCoord.y > 1.0)' +
    '       samplerTexCoord.y = 2.0 - samplerTexCoord.y;' +
    '     vec4 tc = texture2D( tDiffuse, samplerTexCoord );' +
    '     clraverge += tc;' +
    '     count += 1.0;' +
    '   }' +
    ' }' +
    ' clraverge /= count;' +
    ' gl_FragColor = clraverge;' +
    '}'
  ].join('\n')
};

Blur.RadialShader = {
  uniforms: {
    centerpos: {value: new THREE.Vector2(0.5, 0.5)},
    tDiffuse: {value: null}
  },
  vertexShader: [
    'varying vec2 v_texCoord;' +
    ' void main(){' +
    ' v_texCoord = uv;' +
    ' gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );' +
    '}'
  ].join('\n'),
  fragmentShader: [
    'uniform sampler2D tDiffuse;' +
    'uniform vec2 centerpos;' + // 径向中心点
    'varying vec2 v_texCoord;' +
    'void main(){' +
    ' vec4 clraverge = vec4( 0.0 );' +
    ' float count = 0.0, x1, y1;' +
    ' vec2 cpos = centerpos;' +
    ' const float range = 50.0;' + // 径向范围
    ' for( float j = 1.0; j <= range ; j += 1.0 ){' +
    '   if(cpos.x - v_texCoord.x == 0.0){' +
    '     x1 = v_texCoord.x;' +
    '     y1= v_texCoord.y + (cpos.y - v_texCoord.y) * j / (6.0 * range);' +
    '   }' +
    '   else{' +
    '     float k = (cpos.y - v_texCoord.y) / ( cpos.x - v_texCoord.x );' +
    '     x1= v_texCoord.x + (cpos.x - v_texCoord.x) * j / 200.0;' +
    '     if( ( cpos.x - v_texCoord.x ) * ( cpos.x - x1) < 0.0 )' +
    '        x1 = cpos.x;' +
    '     y1 = cpos.y - cpos.x * k + k * x1;' +
    '     if( x1<0.0 || y1<0.0 || x1>1.0 || y1>1.0 )' +
    '       continue;' +
    '   }' +
    '   clraverge += texture2D( tDiffuse, vec2(x1,y1) );' +
    '   count += 1.0;' +
    ' }' +
    ' clraverge /= count;' +
    ' gl_FragColor = clraverge;' +
    '}'
  ].join('\n')
};

Blur.BlurShader = {
  defines: {
    "KERNEL_RADIUS": null, // kernelRadius 内核半径
    "SIGMA": null          // kernelRadius
  },

  uniforms: {
    "colorTexture": {value: null}, // 贴图
    "texSize": {value: new Vector2(0.5, 0.5)}, // 贴图尺寸
    "direction": {value: new Vector2(0.5, 0.5)}
  },
  vertexShader: [
    'varying vec2 vUv;' +
    'void main() {' +
    ' vUv = uv;' +
    ' gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );' +
    '},'
  ].join('\n'),
  fragmentShader: [
    // '#include <common>' +
    'varying vec2 vUv;' + // uv
    'uniform sampler2D colorTexture;' +
    'uniform vec2 texSize;' +
    'uniform vec2 direction;' +
    'float gaussianPdf(in float x, in float sigma) {' +
    ' return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;' +
    '}' +
    'void main() {' +
    ' vec2 invSize = 1.0 / texSize;' +
    ' float fSigma = float(SIGMA);' +
    ' float weightSum = gaussianPdf(0.0, fSigma);' +
    ' vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;' +
    ' for( int i = 1; i < KERNEL_RADIUS; i ++ ) {' +
    '   float x = float(i);' +
    '   float w = gaussianPdf(x, fSigma);' +
    '   vec2 uvOffset = direction * invSize * x;' +
    '   vec3 sample1 = texture2D( colorTexture, vUv + uvOffset).rgb;' +
    '   vec3 sample2 = texture2D( colorTexture, vUv - uvOffset).rgb;' +
    '   diffuseSum += (sample1 + sample2) * w;' +
    '   weightSum += 2.0 * w;' +
    ' }' +
    ' gl_FragColor = vec4(diffuseSum/weightSum, 1.0);' +
    '}'
  ].join('\n')
};

export {Blur};