import {
  Color,
  Points,
  UniformsUtils,
  ShaderMaterial,
  BufferGeometry,
  BufferAttribute
} from "../../build/three_r108.module.js";

/**
 * 渐变粒子
 * @param options
 *  color：粒子颜色
 *  num:粒子数量
 *  range:范围
 *  size:20
 * @constructor
 */
function GradientParticles(options) {

  options = options || {};
  var color = (options.color !== undefined) ? new Color(options.color) : new Color(0x0419ff);
  var num = options.num !== undefined ? options.num : 20;
  var range = options.range !== undefined ? options.range : 50;
  var size = options.size !== undefined ? options.size : 20;
  var shader = options.shader || GradientParticles.ParticlesShader;

  this.type = 'GradientParticles';

  var positions = new Float32Array(num * 3);
  var scales = new Float32Array(num);

  for (var i = 0; i < num; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * range;
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * range;
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * range;

    scales[i] = size/2 + Math.random() * size/2;
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

  this.onBeforeRender = function(renderer, scene, camera, geometry, material, group) {
  };
};

GradientParticles.prototype = Object.create(Points.prototype);
GradientParticles.prototype.constructor = GradientParticles;

GradientParticles.ParticlesShader = {
  uniforms: {
    'color': {value: null},
  },
  vertexShader: [
    'attribute float scale;',
    'uniform vec3 color;',
    'varying vec3 v_color;',
    'void main() {',
    '  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
    '  v_color = color;',
    '  gl_PointSize = scale * 1.0;',
    '  gl_Position = projectionMatrix * mvPosition;',
    '}'
  ].join('\n'),
  fragmentShader: [
    'varying vec3 v_color;',
    'void main() {',
    ' vec3 diff = v_color;',
    ' float radius = length( gl_PointCoord - vec2( 0.5, 0.5 ) );',
    ' // 立方体变成球体',
    ' if ( radius > 0.5 ) discard;',
    ' if ( radius < 0.25 ){;',
    '   float blend = smoothstep(0.0, 0.25, radius);',
    '   diff = mix(diff,diff * 0.75,blend);',
    ' };',
    ' if ( radius >= 0.25 && radius < 0.35){;',
    '   float blend = smoothstep(0.25, 0.35, radius);',
    '   diff = mix(diff * 0.75 ,diff * 0.5,blend);',
    ' };',
    ' if ( radius >= 0.35){;',
    '   float blend = smoothstep(0.35, 0.5, radius);',
    '   diff = mix(diff * 0.5 ,diff * 0.25,blend);',
    ' };',
    ' gl_FragColor = vec4(diff,1.0);',
    '}'
  ].join('\n')
};

export {GradientParticles};