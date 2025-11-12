import {
  Color,
  Points,
  UniformsUtils,
  ShaderMaterial,
  BufferGeometry,
  BufferAttribute
} from "../../build/three_r108.module.js";

let Particles = function(options) {
  this.type = 'Particles';

  options = options || {};
  var color = (options.color !== undefined) ? new Color(options.color) : new Color(0x7F7F7F);
  var shader = options.shader || Particles.ParticlesShader;

  // 几何体
  var SEPARATION = 100, AMOUNTX = 50, AMOUNTY = 50;
  // 计算数量
  var numParticles = AMOUNTX * AMOUNTY;

  var positions = new Float32Array(numParticles * 3);
  var scales = new Float32Array(numParticles);

  var i = 0, j = 0;
  for (var ix = 0; ix < AMOUNTX; ix++) {
    for (var iy = 0; iy < AMOUNTY; iy++) {
      positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2); // x
      positions[i + 1] = 0; // y
      positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2); // z
      scales[j] = 1;
      i += 3;
      j++;
    }
  }

  var geometry = new BufferGeometry();
  geometry.addAttribute('position', new BufferAttribute(positions, 3));
  geometry.addAttribute('scale', new BufferAttribute(scales, 1));

  // 材质
  var material = new ShaderMaterial({
    uniforms: UniformsUtils.clone(shader.uniforms),
    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader
  });
  material.uniforms["color"].value = color;

  Points.call(this, geometry, material);

  var count = 0;
  this.onBeforeRender = function(renderer, scene, camera, geometry, material, group) {
    var positions = geometry.attributes.position.array;
    var scales = geometry.attributes.scale.array;

    var i = 0, j = 0;
    for (var ix = 0; ix < AMOUNTX; ix++) {
      for (var iy = 0; iy < AMOUNTY; iy++) {
        positions[i + 1] = (Math.sin((ix + count) * 0.3) * 50) + (Math.sin((iy + count) * 0.5) * 50);
        scales[j] = (Math.sin((ix + count) * 0.3) + 1) * 8 + (Math.sin((iy + count) * 0.5) + 1) * 8;

        i += 3;
        j++;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.scale.needsUpdate = true;

    count += 0.1;
  };
};

Particles.prototype = Object.create(Points.prototype);
Particles.prototype.constructor = Particles;

Particles.ParticlesShader = {
  uniforms: {
    'color': {value: null},
  },
  vertexShader: [
    'attribute float scale;',
    'void main() {',
    '  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
    '  gl_PointSize = scale * ( 300.0 / - mvPosition.z );',
    '  gl_Position = projectionMatrix * mvPosition;',
    '}'
  ].join('\n'),
  fragmentShader: [
    'uniform vec3 color;',
    'void main() {',
    ' // 立方体变成球体',
    ' if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;',
    '   gl_FragColor = vec4( color, 1.0 );',
    '}'
  ].join('\n')
};

export {Particles};