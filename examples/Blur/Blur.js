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

Blur.CommonShader = {
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
    '#ifdef GL_ES' +
    'precision mediump float;' +
    '#endif ' +
    'uniform float mode;  // 0普通模糊 1高斯模糊 2动感模糊' +
    'uniform vec2 resolution;' +
    'uniform float GlowRange; // 模糊半径' +
    'uniform float GlowExpand; // 动感模糊角度' +
    'varying vec4 v_fragmentColor;' +
    'varying vec2 v_texCoord;' +
    'void main(){' +
    ' vec4 clraverge = vec4(0,0,0,0);' +
    ' if( GlowRange > 0.0 ){' +
    '   if(mode == 2){' +
    '     float samplerPre = 1;' +
    '     float range = GlowRange * 3;' +
    '     float rad = GlowExpand;' +
    '     for( float j = 1; j <= range ; j += samplerPre ){' +
    '       float dx = 0.002 * cos(rad);' +
    '       float dy = 0.002 * sin(rad);' +
    '       vec2 samplerTexCoord = vec2( v_texCoord.x + j * dx, v_texCoord.y + j * dy);' +
    '       vec2 samplerTexCoord1= vec2( v_texCoord.x - j * dx, v_texCoord.y - j * dy);' +
    '       if( samplerTexCoord.x < 0.0 || samplerTexCoord.x > 1.0 || samplerTexCoord1.x < 0.0 || samplerTexCoord1.x > 1.0|| samplerTexCoord.y < 0.0 || samplerTexCoord.y > 1.0 ||samplerTexCoord1.y < 0.0 || samplerTexCoord1.y > 1.0){' +
    '         continue;' +
    '       }' +
    '       vec4 tc = texture2D( CC_Texture0, samplerTexCoord );' +
    '       vec4 tc1= texture2D( CC_Texture0, samplerTexCoord1 );' +
    '       clraverge += tc;' +
    '       clraverge += tc1;' +
    '     }' +
    '     clraverge /= (range * 2);' +
    '   }else{' +
    '     float samplerPre = 3.0;' +
    '     float radiusX = 1.0 / TextureSize.x;' +
    '     float radiusY = 1.0 / TextureSize.y;' +
    '     float count = 0.0;' +
    '     float range = GlowRange * 2.0;' +
    '     for( float i = -range ; i <= range ; i += samplerPre ){' +
    '       for( float j = -range ; j <= range ; j += samplerPre ){' +
    '         float nx = j;' +
    '         float ny = i;' +
    '         float q = range / 1.75;' +
    '         float gr = (1.0/(2*3.14159*q*q))* exp(-(nx*nx+ny*ny)/(2*q*q))*9.0;' +
    '         vec2 samplerTexCoord = vec2( v_texCoord.x + j * radiusX , v_texCoord.y + i * radiusY );' +
    '         if( samplerTexCoord.x < 0.0)' +
    '           samplerTexCoord.x=-samplerTexCoord.x;' +
    '         else if(samplerTexCoord.x > 1.0)' +
    '           samplerTexCoord.x = 2-samplerTexCoord.x;' +
    '         if(samplerTexCoord.y < 0.0)' +
    '           samplerTexCoord.y=-samplerTexCoord.y;' +
    '         else if(samplerTexCoord.y > 1.0)' +
    '           samplerTexCoord.y = 2-samplerTexCoord.y;' +
    '         vec4 tc = texture2D( CC_Texture0, samplerTexCoord );' +
    '         if(mode == 0)' +
    '           clraverge + =tc;' +
    '         else if(mode == 1)' +
    '           clraverge += tc * gr;' +
    '         count+=1;' +
    '       }' +
    '     }' +
    '     if(mode==0)' +
    '       clraverge /= count;' +
    '   }' +
    ' }' +
    ' gl_FragColor = clraverge;' +
    '}'
  ].join('\n')
};

export {Blur};