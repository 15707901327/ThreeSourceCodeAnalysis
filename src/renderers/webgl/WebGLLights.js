/**
 * @author mrdoob / http://mrdoob.com/
 */

import {Color} from '../../math/Color.js';
import {Matrix4} from '../../math/Matrix4.js';
import {Vector2} from '../../math/Vector2.js';
import {Vector3} from '../../math/Vector3.js';

function UniformsCache() {

  /**
   * [灯光id：灯光的相关属性]
   */
  var lights = {};

  return {

    get: function(light) {

      if (lights[light.id] !== undefined) {
        return lights[light.id];
      }

      var uniforms;

      switch(light.type){
        case 'DirectionalLight':
          uniforms = {
            direction: new Vector3(),
            color: new Color()
          };
          break;
        case 'SpotLight':
          uniforms = {
            position: new Vector3(),
            direction: new Vector3(),
            color: new Color(),
            distance: 0,
            coneCos: 0,
            penumbraCos: 0,
            decay: 0
          };
          break;
        case 'PointLight':
          uniforms = {
            position: new Vector3(),
            color: new Color(),
            distance: 0,
            decay: 0
          };
          break;
        case 'HemisphereLight':
          uniforms = {
            direction: new Vector3(),
            skyColor: new Color(),
            groundColor: new Color()
          };
          break;
        case 'RectAreaLight':
          uniforms = {
            color: new Color(),
            position: new Vector3(),
            halfWidth: new Vector3(),
            halfHeight: new Vector3()
          };
          break;

      }

      lights[light.id] = uniforms;

      return uniforms;

    }

  };

}

function ShadowUniformsCache() {

  var lights = {};

  return {

    get: function(light) {

      if (lights[light.id] !== undefined) {

        return lights[light.id];

      }

      var uniforms;

      switch(light.type){

        case 'DirectionalLight':
          uniforms = {
            shadowBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Vector2()
          };
          break;

        case 'SpotLight':
          uniforms = {
            shadowBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Vector2()
          };
          break;

        case 'PointLight':
          uniforms = {
            shadowBias: 0,
            shadowRadius: 1,
            shadowMapSize: new Vector2(),
            shadowCameraNear: 1,
            shadowCameraFar: 1000
          };
          break;

        // TODO (abelnation): set RectAreaLight shadow uniforms

      }

      lights[light.id] = uniforms;

      return uniforms;

    }

  };
}

var nextVersion = 0;

function shadowCastingLightsFirst(lightA, lightB) {

  return (lightB.castShadow ? 1 : 0) - (lightA.castShadow ? 1 : 0);

}

/**
 * 灯光管理
 * @returns {{setup: setup, state: {numPointShadows: number, hemi: Array, ambient: number[], version: number, point: Array, probe: Array, pointShadowMap: Array, pointShadowMatrix: Array, directional: Array, directionalShadowMatrix: Array, spot: Array, numDirectionalShadows: number, spotShadowMap: Array, directionalShadowMap: Array, spotShadowMatrix: Array, numSpotShadows: number, rectArea: Array, hash: {directionalLength: number, numPointShadows: number, hemiLength: number, numDirectionalShadows: number, pointLength: number, rectAreaLength: number, numSpotShadows: number, spotLength: number}}}}
 * @constructor
 */
function WebGLLights() {

  var cache = new UniformsCache();

  var shadowCache = ShadowUniformsCache();

  var state = {

    version: 0,

    hash: {
      directionalLength: -1,
      pointLength: -1,
      spotLength: -1,
      rectAreaLength: -1,
      hemiLength: -1,

      numDirectionalShadows: -1,
      numPointShadows: -1,
      numSpotShadows: -1
    },

    ambient: [0, 0, 0], // 环境光 颜色*强度
    probe: [], // 放置9个三维点
    directional: [], // 放置灯光属性
    directionalShadowMap: [],
    directionalShadowMatrix: [],
    spot: [],
    spotShadow: [],
    spotShadowMap: [],
    spotShadowMatrix: [],
    rectArea: [],
    point: [],
    pointShadow: [],
    pointShadowMap: [],
    pointShadowMatrix: [],
    hemi: []

  };

  for (var i = 0; i < 9; i++) state.probe.push(new Vector3());

  var vector3 = new Vector3();
  var matrix4 = new Matrix4();
  var matrix42 = new Matrix4();

  /**
   * 设置灯光
   * @param lights 灯光数组
   * @param shadows
   * @param camera 相机
   */
  function setup(lights, shadows, camera) {

    // 灯光颜色分量
    var r = 0, g = 0, b = 0;

    // 初始化probe
    for (var i = 0; i < 9; i++) state.probe[i].set(0, 0, 0);

    var directionalLength = 0; // 方向长度
    var pointLength = 0;
    var spotLength = 0;
    var rectAreaLength = 0;
    var hemiLength = 0;

    var numDirectionalShadows = 0;
    var numPointShadows = 0;
    var numSpotShadows = 0;

    // 视图矩阵
    var viewMatrix = camera.matrixWorldInverse;

    lights.sort(shadowCastingLightsFirst);

    // 便利灯光，处理灯光，获取灯光颜色分量
    for (var i = 0, l = lights.length; i < l; i++) {

      var light = lights[i];

      var color = light.color; // 颜色
      var intensity = light.intensity; // 强度
      var distance = light.distance; // 距离

      // 阴影贴图
      var shadowMap = (light.shadow && light.shadow.map) ? light.shadow.map.texture : null;

      if (light.isAmbientLight) {
        r += color.r * intensity;
        g += color.g * intensity;
        b += color.b * intensity;
      } else if (light.isLightProbe) {

        for (var j = 0; j < 9; j++) {

          state.probe[j].addScaledVector(light.sh.coefficients[j], intensity);

        }

      } else if (light.isDirectionalLight) {

        var uniforms = cache.get(light);

        // 颜色是灯光颜色 * 灯光强度
        uniforms.color.copy(light.color).multiplyScalar(light.intensity);
        // 获取光源位置
        uniforms.direction.setFromMatrixPosition(light.matrixWorld);
        // 获取光源指向位置
        vector3.setFromMatrixPosition(light.target.matrixWorld);
        // 计算光源的方向
        uniforms.direction.sub(vector3);
        // 用视图矩阵对向量进行变换（归一化）
        uniforms.direction.transformDirection(viewMatrix);

        uniforms.shadow = light.castShadow;

        if (light.castShadow) {

          var shadow = light.shadow;

          var shadowUniforms = shadowCache.get(light);

          shadowUniforms.shadowBias = shadow.bias;
          shadowUniforms.shadowRadius = shadow.radius;
          shadowUniforms.shadowMapSize = shadow.mapSize;

          state.directionalShadow[directionalLength] = shadowUniforms;
          state.directionalShadowMap[directionalLength] = shadowMap;
          state.directionalShadowMatrix[directionalLength] = light.shadow.matrix;

          numDirectionalShadows++;

        }

        state.directional[directionalLength] = uniforms;

        directionalLength++;

      } else if (light.isSpotLight) {

        var uniforms = cache.get(light);

        uniforms.position.setFromMatrixPosition(light.matrixWorld);
        uniforms.position.applyMatrix4(viewMatrix);

        uniforms.color.copy(color).multiplyScalar(intensity);
        uniforms.distance = distance;

        uniforms.direction.setFromMatrixPosition(light.matrixWorld);
        vector3.setFromMatrixPosition(light.target.matrixWorld);
        uniforms.direction.sub(vector3);
        uniforms.direction.transformDirection(viewMatrix);

        uniforms.coneCos = Math.cos(light.angle);
        uniforms.penumbraCos = Math.cos(light.angle * (1 - light.penumbra));
        uniforms.decay = light.decay;

        if (light.castShadow) {

          var shadow = light.shadow;

          var shadowUniforms = shadowCache.get(light);

          shadowUniforms.shadowBias = shadow.bias;
          shadowUniforms.shadowRadius = shadow.radius;
          shadowUniforms.shadowMapSize = shadow.mapSize;

          state.spotShadow[spotLength] = shadowUniforms;
          state.spotShadowMap[spotLength] = shadowMap;
          state.spotShadowMatrix[spotLength] = light.shadow.matrix;

          numSpotShadows++;

        }

        state.spot[spotLength] = uniforms;

        spotLength++;

      } else if (light.isRectAreaLight) {

        var uniforms = cache.get(light);

        // (a) intensity is the total visible light emitted
        //uniforms.color.copy( color ).multiplyScalar( intensity / ( light.width * light.height * Math.PI ) );

        // (b) intensity is the brightness of the light
        uniforms.color.copy(color).multiplyScalar(intensity);

        uniforms.position.setFromMatrixPosition(light.matrixWorld);
        uniforms.position.applyMatrix4(viewMatrix);

        // extract local rotation of light to derive width/height half vectors
        matrix42.identity();
        matrix4.copy(light.matrixWorld);
        matrix4.premultiply(viewMatrix);
        matrix42.extractRotation(matrix4);

        uniforms.halfWidth.set(light.width * 0.5, 0.0, 0.0);
        uniforms.halfHeight.set(0.0, light.height * 0.5, 0.0);

        uniforms.halfWidth.applyMatrix4(matrix42);
        uniforms.halfHeight.applyMatrix4(matrix42);

        // TODO (abelnation): RectAreaLight distance?
        // uniforms.distance = distance;

        state.rectArea[rectAreaLength] = uniforms;

        rectAreaLength++;

      } else if (light.isPointLight) {

        var uniforms = cache.get(light);

        uniforms.position.setFromMatrixPosition(light.matrixWorld);
        uniforms.position.applyMatrix4(viewMatrix);

        uniforms.color.copy(light.color).multiplyScalar(light.intensity);
        uniforms.distance = light.distance;
        uniforms.decay = light.decay;

        if (light.castShadow) {

          var shadow = light.shadow;

          var shadowUniforms = shadowCache.get(light);

          shadowUniforms.shadowBias = shadow.bias;
          shadowUniforms.shadowRadius = shadow.radius;
          shadowUniforms.shadowMapSize = shadow.mapSize;
          shadowUniforms.shadowCameraNear = shadow.camera.near;
          shadowUniforms.shadowCameraFar = shadow.camera.far;

          state.pointShadow[pointLength] = shadowUniforms;
          state.pointShadowMap[pointLength] = shadowMap;
          state.pointShadowMatrix[pointLength] = light.shadow.matrix;

          numPointShadows++;

        }

        state.point[pointLength] = uniforms;

        pointLength++;

      } else if (light.isHemisphereLight) {

        var uniforms = cache.get(light);

        uniforms.direction.setFromMatrixPosition(light.matrixWorld);
        uniforms.direction.transformDirection(viewMatrix);
        uniforms.direction.normalize();

        uniforms.skyColor.copy(light.color).multiplyScalar(intensity);
        uniforms.groundColor.copy(light.groundColor).multiplyScalar(intensity);

        state.hemi[hemiLength] = uniforms;

        hemiLength++;

      }

    }

    // 环境光
    state.ambient[0] = r;
    state.ambient[1] = g;
    state.ambient[2] = b;

    var hash = state.hash;

    if (hash.directionalLength !== directionalLength ||
      hash.pointLength !== pointLength ||
      hash.spotLength !== spotLength ||
      hash.rectAreaLength !== rectAreaLength ||
      hash.hemiLength !== hemiLength ||
      hash.numDirectionalShadows !== numDirectionalShadows ||
      hash.numPointShadows !== numPointShadows ||
      hash.numSpotShadows !== numSpotShadows) {

      state.directional.length = directionalLength;
      state.spot.length = spotLength;
      state.rectArea.length = rectAreaLength;
      state.point.length = pointLength;
      state.hemi.length = hemiLength;

      state.directionalShadow.length = numDirectionalShadows;
      state.directionalShadowMap.length = numDirectionalShadows;
      state.pointShadow.length = numPointShadows;
      state.pointShadowMap.length = numPointShadows;
      state.spotShadow.length = numSpotShadows;
      state.spotShadowMap.length = numSpotShadows;
      state.directionalShadowMatrix.length = numDirectionalShadows;
      state.pointShadowMatrix.length = numPointShadows;
      state.spotShadowMatrix.length = numSpotShadows;

      hash.directionalLength = directionalLength;
      hash.pointLength = pointLength;
      hash.spotLength = spotLength;
      hash.rectAreaLength = rectAreaLength;
      hash.hemiLength = hemiLength;

      hash.numDirectionalShadows = numDirectionalShadows;
      hash.numPointShadows = numPointShadows;
      hash.numSpotShadows = numSpotShadows;

      state.version = nextVersion++;

    }

  }

  return {
    setup: setup,
    state: state
  };

}

export {WebGLLights};
