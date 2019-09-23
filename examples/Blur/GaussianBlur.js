let GaussianBlur = function() {

};
GaussianBlur.GaussianShader = {
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

export {GaussianBlur};