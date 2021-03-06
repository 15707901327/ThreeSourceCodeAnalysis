/**
 * @author mrdoob / http://mrdoob.com/
 */

import {
  NotEqualDepth,
  GreaterDepth,
  GreaterEqualDepth,
  EqualDepth,
  LessEqualDepth,
  LessDepth,
  AlwaysDepth,
  NeverDepth,
  CullFaceFront,
  CullFaceBack,
  CullFaceNone,
  DoubleSide,
  BackSide,
  CustomBlending,
  MultiplyBlending,
  SubtractiveBlending,
  AdditiveBlending,
  NoBlending,
  NormalBlending,
  AddEquation,
  SubtractEquation,
  ReverseSubtractEquation,
  MinEquation,
  MaxEquation,
  ZeroFactor,
  OneFactor,
  SrcColorFactor,
  SrcAlphaFactor,
  SrcAlphaSaturateFactor,
  DstColorFactor,
  DstAlphaFactor,
  OneMinusSrcColorFactor,
  OneMinusSrcAlphaFactor,
  OneMinusDstColorFactor,
  OneMinusDstAlphaFactor
} from '../../constants.js';
import {Vector4} from '../../math/Vector4.js';

/**
 * webgl状态机
 * @param gl 上下文
 * @param extensions 获取扩展的对象
 * @param utils 转换方法
 * @param capabilities
 * @return {{buffers: {color: ColorBuffer, depth: DepthBuffer, stencil: StencilBuffer}, initAttributes: initAttributes, enableAttribute: enableAttribute, enableAttributeAndDivisor: enableAttributeAndDivisor, disableUnusedAttributes: disableUnusedAttributes, enable: enable, disable: disable, getCompressedTextureFormats: getCompressedTextureFormats, useProgram: useProgram, setBlending: setBlending, setMaterial: setMaterial, setFlipSided: setFlipSided, setCullFace: setCullFace, setLineWidth: setLineWidth, setPolygonOffset: setPolygonOffset, setScissorTest: setScissorTest, activeTexture: activeTexture, bindTexture: bindTexture, compressedTexImage2D: compressedTexImage2D, texImage2D: texImage2D, scissor: scissor, viewport: viewport, reset: reset}}
 * @constructor
 */
function WebGLState(gl, extensions, capabilities) {

  var isWebGL2 = capabilities.isWebGL2;

  function ColorBuffer() {

    var locked = false;

    var color = new Vector4();
    var currentColorMask = null;
    var currentColorClear = new Vector4(0, 0, 0, 0);

    return {

      /**
       * 设置在绘制或呈现WebGLFramebuffer时启用或禁用哪些颜色组件
       * @param colorMask true 启动 false 禁用
       */
      setMask: function(colorMask) {

        if (currentColorMask !== colorMask && !locked) {

          gl.colorMask(colorMask, colorMask, colorMask, colorMask);
          currentColorMask = colorMask;

        }

      },

      setLocked: function(lock) {

        locked = lock;

      },

      setClear: function(r, g, b, a, premultipliedAlpha) {

        if (premultipliedAlpha === true) {

          r *= a;
          g *= a;
          b *= a;

        }

        color.set(r, g, b, a);

        if (currentColorClear.equals(color) === false) {

          gl.clearColor(r, g, b, a);
          currentColorClear.copy(color);

        }

      },

      reset: function() {

        locked = false;

        currentColorMask = null;
        currentColorClear.set(-1, 0, 0, 0); // set to invalid state

      }

    };

  }

  function DepthBuffer() {

    var locked = false; // 锁定或释放深度缓存区的写入操作

    var currentDepthMask = null; // 锁定或释放深度缓存区的写入操作
    var currentDepthFunc = null; // 比较函数值
    var currentDepthClear = null;// 绘图区域的深度

    return {

      /**
       * 隐藏面消除 true 启动 false 不启动
       * @param depthTest
       */
      setTest: function(depthTest) {
        if (depthTest) {
          enable(gl.DEPTH_TEST);
        } else {
          disable(gl.DEPTH_TEST);
        }
      },

      /**
       * @param depthMask 指定是锁定深度缓存区的写入操作（false），还是释放（true）
       */
      setMask: function(depthMask) {

        if (currentDepthMask !== depthMask && !locked) {

          gl.depthMask(depthMask);
          currentDepthMask = depthMask;

        }

      },

      /**
       * 将传入像素深度与当前深度缓冲区值进行比较的函数
       * @param depthFunc
       */
      setFunc: function(depthFunc) {

        if (currentDepthFunc !== depthFunc) {

          if (depthFunc) {

            switch(depthFunc){

              case NeverDepth:

                gl.depthFunc(gl.NEVER);
                break;

              case AlwaysDepth:

                gl.depthFunc(gl.ALWAYS);
                break;

              case LessDepth:

                gl.depthFunc(gl.LESS);
                break;

              case LessEqualDepth:

                gl.depthFunc(gl.LEQUAL);
                break;

              case EqualDepth:

                gl.depthFunc(gl.EQUAL);
                break;

              case GreaterEqualDepth:

                gl.depthFunc(gl.GEQUAL);
                break;

              case GreaterDepth:

                gl.depthFunc(gl.GREATER);
                break;

              case NotEqualDepth:

                gl.depthFunc(gl.NOTEQUAL);
                break;

              default:

                gl.depthFunc(gl.LEQUAL);

            }

          } else {

            gl.depthFunc(gl.LEQUAL);

          }

          currentDepthFunc = depthFunc;

        }

      },

      setLocked: function(lock) {

        locked = lock;

      },

      /**
       * 指定绘图区域的深度
       * @param depth
       */
      setClear: function(depth) {
        if (currentDepthClear !== depth) {
          gl.clearDepth(depth);
          currentDepthClear = depth;
        }
      },

      reset: function() {

        locked = false;

        currentDepthMask = null;
        currentDepthFunc = null;
        currentDepthClear = null;

      }

    };

  }

  function StencilBuffer() {

    // 锁定操作
    var locked = false;

    var currentStencilMask = null;
    var currentStencilFunc = null;
    var currentStencilRef = null;
    var currentStencilFuncMask = null;
    var currentStencilFail = null;
    var currentStencilZFail = null;
    var currentStencilZPass = null;
    var currentStencilClear = null;

    return {

      setTest: function(stencilTest) {
        if (!locked) {
          if (stencilTest) {
            enable(gl.STENCIL_TEST);
          } else {
            disable(gl.STENCIL_TEST);
          }
        }
      },

      setMask: function(stencilMask) {

        if (currentStencilMask !== stencilMask && !locked) {

          gl.stencilMask(stencilMask);
          currentStencilMask = stencilMask;

        }

      },

      setFunc: function(stencilFunc, stencilRef, stencilMask) {

        if (currentStencilFunc !== stencilFunc ||
          currentStencilRef !== stencilRef ||
          currentStencilFuncMask !== stencilMask) {

          gl.stencilFunc(stencilFunc, stencilRef, stencilMask);

          currentStencilFunc = stencilFunc;
          currentStencilRef = stencilRef;
          currentStencilFuncMask = stencilMask;

        }

      },

      /**
       *
       * @param stencilFail
       * @param stencilZFail
       * @param stencilZPass
       */
      setOp: function(stencilFail, stencilZFail, stencilZPass) {

        if (currentStencilFail !== stencilFail ||
          currentStencilZFail !== stencilZFail ||
          currentStencilZPass !== stencilZPass) {

          gl.stencilOp(stencilFail, stencilZFail, stencilZPass);

          currentStencilFail = stencilFail;
          currentStencilZFail = stencilZFail;
          currentStencilZPass = stencilZPass;
        }
      },

      setLocked: function(lock) {

        locked = lock;

      },

      setClear: function(stencil) {

        if (currentStencilClear !== stencil) {

          gl.clearStencil(stencil);
          currentStencilClear = stencil;

        }

      },

      reset: function() {

        locked = false;

        currentStencilMask = null;
        currentStencilFunc = null;
        currentStencilRef = null;
        currentStencilFuncMask = null;
        currentStencilFail = null;
        currentStencilZFail = null;
        currentStencilZPass = null;
        currentStencilClear = null;

      }

    };

  }

  //

  var colorBuffer = new ColorBuffer();
  var depthBuffer = new DepthBuffer();
  var stencilBuffer = new StencilBuffer();

  var maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  var newAttributes = new Uint8Array(maxVertexAttributes);
  var enabledAttributes = new Uint8Array(maxVertexAttributes);
  var attributeDivisors = new Uint8Array(maxVertexAttributes);

  var enabledCapabilities = {}; // 保存功能开启状态

  var currentProgram = null; // 当前使用的着色器程序

  var currentBlendingEnabled = null; // 当前混合
  var currentBlending = null; // 当前混合类型
  var currentBlendEquation = null; // 当前混合方程
  var currentBlendSrc = null;
  var currentBlendDst = null;
  var currentBlendEquationAlpha = null; // 透明混合方程
  var currentBlendSrcAlpha = null;
  var currentBlendDstAlpha = null;
  var currentPremultipledAlpha = false;

  var currentFlipSided = null; // 当前缠绕方向 true 顺时针 false 逆时针
  var currentCullFace = null;

  var currentLineWidth = null;

  // 多边形偏移参数
  var currentPolygonOffsetFactor = null;
  var currentPolygonOffsetUnits = null;

  // 获取纹理单元的数量
  var maxTextures = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

  var lineWidthAvailable = false;
  var version = 0;
  var glVersion = gl.getParameter(gl.VERSION);

  if (glVersion.indexOf('WebGL') !== -1) {

    version = parseFloat(/^WebGL\ ([0-9])/.exec(glVersion)[1]);
    lineWidthAvailable = (version >= 1.0);

  } else if (glVersion.indexOf('OpenGL ES') !== -1) {

    version = parseFloat(/^OpenGL\ ES\ ([0-9])/.exec(glVersion)[1]);
    lineWidthAvailable = (version >= 2.0);

  }

  var currentTextureSlot = null; // 当前激活的纹理单元
  // 保存激活的纹理单元对纹理
  var currentBoundTextures = {};

  // 当前裁剪区域
  var currentScissor = new Vector4();
  // 当前绘图区域
  var currentViewport = new Vector4();

  function createTexture(type, target, count) {

    var data = new Uint8Array(4); // 4 is required to match default unpack alignment of 4.
    var texture = gl.createTexture();

    gl.bindTexture(type, texture);
    gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    for (var i = 0; i < count; i++) {

      gl.texImage2D(target + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

    }

    return texture;

  }

  var emptyTextures = {};
  emptyTextures[gl.TEXTURE_2D] = createTexture(gl.TEXTURE_2D, gl.TEXTURE_2D, 1);
  emptyTextures[gl.TEXTURE_CUBE_MAP] = createTexture(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_CUBE_MAP_POSITIVE_X, 6);

  // init

  // 指定绘图区域的颜色
  colorBuffer.setClear(0, 0, 0, 1);
  // 指定绘图区域的深度
  depthBuffer.setClear(1);
  stencilBuffer.setClear(0);

  enable(gl.DEPTH_TEST); // 开启隐藏面消除
  depthBuffer.setFunc(LessEqualDepth);

  setFlipSided(false);
  setCullFace(CullFaceBack);
  enable(gl.CULL_FACE);

  setBlending(NoBlending);

  // 初始化newAttributes为0
  function initAttributes() {

    for (var i = 0, l = newAttributes.length; i < l; i++) {

      newAttributes[i] = 0;

    }

  }

  function enableAttribute(attribute) {

    enableAttributeAndDivisor(attribute, 0);

  }

  function enableAttributeAndDivisor(attribute, meshPerAttribute) {

    newAttributes[attribute] = 1;

    if (enabledAttributes[attribute] === 0) {

      gl.enableVertexAttribArray(attribute);
      enabledAttributes[attribute] = 1;

    }

    if (attributeDivisors[attribute] !== meshPerAttribute) {

      var extension = isWebGL2 ? gl : extensions.get('ANGLE_instanced_arrays');

      extension[isWebGL2 ? 'vertexAttribDivisor' : 'vertexAttribDivisorANGLE'](attribute, meshPerAttribute);
      attributeDivisors[attribute] = meshPerAttribute;

    }

  }

  function disableUnusedAttributes() {

    for (var i = 0, l = enabledAttributes.length; i !== l; ++i) {

      if (enabledAttributes[i] !== newAttributes[i]) {

        gl.disableVertexAttribArray(i);
        enabledAttributes[i] = 0;

      }

    }

  }

  /**
   * 开启功能
   * @param id
   */
  function enable(id) {
    if (enabledCapabilities[id] !== true) {
      gl.enable(id);
      enabledCapabilities[id] = true;
    }
  }

  /**
   * 关闭功能
   * @param id
   */
  function disable(id) {
    if (enabledCapabilities[id] !== false) {
      gl.disable(id);
      enabledCapabilities[id] = false;

    }

  }

  function useProgram(program) {

    if (currentProgram !== program) {

      gl.useProgram(program);

      currentProgram = program;

      return true;

    }

    return false;

  }

  var equationToGL = {
    [AddEquation]: gl.FUNC_ADD,
    [SubtractEquation]: gl.FUNC_SUBTRACT,
    [ReverseSubtractEquation]: gl.FUNC_REVERSE_SUBTRACT
  };

  if (isWebGL2) {

    equationToGL[MinEquation] = gl.MIN;
    equationToGL[MaxEquation] = gl.MAX;

  } else {

    var extension = extensions.get('EXT_blend_minmax');

    if (extension !== null) {

      equationToGL[MinEquation] = extension.MIN_EXT;
      equationToGL[MaxEquation] = extension.MAX_EXT;

    }

  }

  var factorToGL = {
    [ZeroFactor]: gl.ZERO,
    [OneFactor]: gl.ONE,
    [SrcColorFactor]: gl.SRC_COLOR,
    [SrcAlphaFactor]: gl.SRC_ALPHA,
    [SrcAlphaSaturateFactor]: gl.SRC_ALPHA_SATURATE,
    [DstColorFactor]: gl.DST_COLOR,
    [DstAlphaFactor]: gl.DST_ALPHA,
    [OneMinusSrcColorFactor]: gl.ONE_MINUS_SRC_COLOR,
    [OneMinusSrcAlphaFactor]: gl.ONE_MINUS_SRC_ALPHA,
    [OneMinusDstColorFactor]: gl.ONE_MINUS_DST_COLOR,
    [OneMinusDstAlphaFactor]: gl.ONE_MINUS_DST_ALPHA
  };

  /**
   * 设置混合
   * @param blending 混合类型
   * @param blendEquation 混合方程
   * @param blendSrc 源颜色因子
   * @param blendDst 目标颜色因子
   * @param blendEquationAlpha a通道混合方程
   * @param blendSrcAlpha 源颜色因子
   * @param blendDstAlpha 目标颜色因子
   * @param premultipliedAlpha 预乘Alpha
   */
  function setBlending(blending, blendEquation, blendSrc, blendDst, blendEquationAlpha, blendSrcAlpha, blendDstAlpha, premultipliedAlpha) {

    // 关闭混合
    if (blending === NoBlending) {
      if (currentBlendingEnabled) {
        disable(gl.BLEND);
        currentBlendingEnabled = false;
      }
      return;
    }

    // 启动混合
    if (!currentBlendingEnabled) {
      enable(gl.BLEND);
      currentBlendingEnabled = true;
    }

    // 处理预定义混合类型
    if (blending !== CustomBlending) {
      if (blending !== currentBlending || premultipliedAlpha !== currentPremultipledAlpha) {
        // 设置混合方程
        if (currentBlendEquation !== AddEquation || currentBlendEquationAlpha !== AddEquation) {
          gl.blendEquation(gl.FUNC_ADD);
          currentBlendEquation = AddEquation;
          currentBlendEquationAlpha = AddEquation;
        }

        // 设置混合方程参数
        if (premultipliedAlpha) {
          switch(blending){
            case NormalBlending:
              gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
              break;
            case AdditiveBlending:
              gl.blendFunc(gl.ONE, gl.ONE);
              break;
            case SubtractiveBlending:
              gl.blendFuncSeparate(gl.ZERO, gl.ZERO, gl.ONE_MINUS_SRC_COLOR, gl.ONE_MINUS_SRC_ALPHA);
              break;
            case MultiplyBlending:
              gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ZERO, gl.SRC_ALPHA);
              break;
            default:
              console.error('THREE.WebGLState: Invalid blending: ', blending);
              break;
          }
        } else {
          switch(blending){
            case NormalBlending:
              gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
              break;
            case AdditiveBlending:
              gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
              break;
            case SubtractiveBlending:
              gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
              break;
            case MultiplyBlending:
              gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
              break;
            default:
              console.error('THREE.WebGLState: Invalid blending: ', blending);
              break;
          }
        }

        currentBlendSrc = null;
        currentBlendDst = null;
        currentBlendSrcAlpha = null;
        currentBlendDstAlpha = null;

        currentBlending = blending;
        currentPremultipledAlpha = premultipliedAlpha;
      }
      return;
    }

    // 处理自定义混合
    blendEquationAlpha = blendEquationAlpha || blendEquation;
    blendSrcAlpha = blendSrcAlpha || blendSrc;
    blendDstAlpha = blendDstAlpha || blendDst;

    // 设置混合方程
    if (blendEquation !== currentBlendEquation || blendEquationAlpha !== currentBlendEquationAlpha) {

      gl.blendEquationSeparate(equationToGL[blendEquation], equationToGL[blendEquationAlpha]);

      currentBlendEquation = blendEquation;
      currentBlendEquationAlpha = blendEquationAlpha;
    }

    // 设置混合方程参数
    if (blendSrc !== currentBlendSrc || blendDst !== currentBlendDst || blendSrcAlpha !== currentBlendSrcAlpha || blendDstAlpha !== currentBlendDstAlpha) {

      gl.blendFuncSeparate(factorToGL[blendSrc], factorToGL[blendDst], factorToGL[blendSrcAlpha], factorToGL[blendDstAlpha]);

      currentBlendSrc = blendSrc;
      currentBlendDst = blendDst;
      currentBlendSrcAlpha = blendSrcAlpha;
      currentBlendDstAlpha = blendDstAlpha;
    }

    currentBlending = blending;
    currentPremultipledAlpha = null;
  }

  /**
   * 根据材质设置绘制图形的方式（剔除、缠绕方向、混合、偏移）
   * @param material 材质
   * @param frontFaceCW false 顺时针缠绕 true 逆时针缠绕
   */
  function setMaterial(material, frontFaceCW) {

    // 开启剔除效果
    material.side === DoubleSide ? disable(gl.CULL_FACE) : enable(gl.CULL_FACE);

    // 翻面
    var flipSided = (material.side === BackSide);
    if (frontFaceCW) flipSided = !flipSided;

    // 设置缠绕方向来确定多边形正反面
    setFlipSided(flipSided);

    // 设置材质混合
    (material.blending === NormalBlending && material.transparent === false)
      ? setBlending(NoBlending)
      : setBlending(material.blending, material.blendEquation, material.blendSrc, material.blendDst, material.blendEquationAlpha, material.blendSrcAlpha, material.blendDstAlpha, material.premultipliedAlpha);

    depthBuffer.setFunc(material.depthFunc);
    depthBuffer.setTest(material.depthTest);
    depthBuffer.setMask(material.depthWrite);
    colorBuffer.setMask(material.colorWrite);

    var stencilWrite = material.stencilWrite;
    stencilBuffer.setTest(stencilWrite);
    if (stencilWrite) {

      stencilBuffer.setMask(material.stencilWriteMask);
      stencilBuffer.setFunc(material.stencilFunc, material.stencilRef, material.stencilFuncMask);
      stencilBuffer.setOp(material.stencilFail, material.stencilZFail, material.stencilZPass);

    }

    setPolygonOffset(material.polygonOffset, material.polygonOffsetFactor, material.polygonOffsetUnits);

  }

  /**
   * 设置缠绕方向
   * @param flipSided true 顺时针 false 逆时针
   */
  function setFlipSided(flipSided) {

    if (currentFlipSided !== flipSided) {
      if (flipSided) {
        gl.frontFace(gl.CW);
      } else {
        gl.frontFace(gl.CCW);
      }
      currentFlipSided = flipSided;
    }

  }

  /**
   * 剔除面
   * @param cullFace 剔除模式
   */
  function setCullFace(cullFace) {

    if (cullFace !== CullFaceNone) {

      enable(gl.CULL_FACE);

      if (cullFace !== currentCullFace) {

        if (cullFace === CullFaceBack) {

          gl.cullFace(gl.BACK);

        } else if (cullFace === CullFaceFront) {

          gl.cullFace(gl.FRONT);

        } else {

          gl.cullFace(gl.FRONT_AND_BACK);

        }

      }

    } else {

      disable(gl.CULL_FACE);

    }

    currentCullFace = cullFace;

  }

  function setLineWidth(width) {

    if (width !== currentLineWidth) {

      if (lineWidthAvailable) gl.lineWidth(width);

      currentLineWidth = width;

    }

  }

  /**
   * 设置多边形偏移
   * @param polygonOffset true 启动 false 关闭
   * @param factor
   * @param units
   */
  function setPolygonOffset(polygonOffset, factor, units) {

    if (polygonOffset) {
      enable(gl.POLYGON_OFFSET_FILL);

      if (currentPolygonOffsetFactor !== factor || currentPolygonOffsetUnits !== units) {

        gl.polygonOffset(factor, units);

        currentPolygonOffsetFactor = factor;
        currentPolygonOffsetUnits = units;
      }
    } else {
      disable(gl.POLYGON_OFFSET_FILL);
    }
  }

  /**
   * 设置是否启用裁剪
   * @param scissorTest
   */
  function setScissorTest(scissorTest) {
    if (scissorTest) {
      enable(gl.SCISSOR_TEST);
    } else {
      disable(gl.SCISSOR_TEST);
    }
  }

  /**
   * 激活纹理单元，如果没有传入，激活最大的纹理单元
   * @param webglSlot 纹理单元编号
   */
  function activeTexture(webglSlot) {

    if (webglSlot === undefined) webglSlot = gl.TEXTURE0 + maxTextures - 1;

    if (currentTextureSlot !== webglSlot) {
      gl.activeTexture(webglSlot);
      currentTextureSlot = webglSlot;
    }
  }

  /**
   * 绑定纹理对象
   * @param webglType 纹理类型;gl.TEXTURE_2D
   * @param webglTexture： 纹理对象
   */
  function bindTexture(webglType, webglTexture) {

    // 激活纹理单元
    if (currentTextureSlot === null) {
      activeTexture();
    }

    // 保存激活的纹理单元，及相关的纹理贴图
    var boundTexture = currentBoundTextures[currentTextureSlot];
    if (boundTexture === undefined) {
      boundTexture = {type: undefined, texture: undefined};
      currentBoundTextures[currentTextureSlot] = boundTexture;
    }

    if (boundTexture.type !== webglType || boundTexture.texture !== webglTexture) {
      gl.bindTexture(webglType, webglTexture || emptyTextures[webglType]);

      boundTexture.type = webglType;
      boundTexture.texture = webglTexture;

    }

  }

  /**
   * 解绑当前纹理
   */
  function unbindTexture() {

    var boundTexture = currentBoundTextures[currentTextureSlot];

    if (boundTexture !== undefined && boundTexture.type !== undefined) {

      gl.bindTexture(boundTexture.type, null);

      boundTexture.type = undefined;
      boundTexture.texture = undefined;
    }
  }

  function compressedTexImage2D() {

    try{

      gl.compressedTexImage2D.apply(gl, arguments);

    }catch(error){

      console.error('THREE.WebGLState:', error);

    }

  }

  /**
   * 将image指定的图像分配给绑定的目标上的纹理对象。
   */
  function texImage2D() {
    try{
      gl.texImage2D.apply(gl, arguments);
    }catch(error){
      console.error('THREE.WebGLState:', error);
    }
  }

  function texImage3D() {

    try{

      gl.texImage3D.apply(gl, arguments);

    }catch(error){

      console.error('THREE.WebGLState:', error);

    }

  }

  // 设置裁剪区域
  function scissor(scissor) {
    if (currentScissor.equals(scissor) === false) {
      gl.scissor(scissor.x, scissor.y, scissor.z, scissor.w);
      currentScissor.copy(scissor);
    }
  }

  /**
   * 设置绘图区域
   * @param viewport
   */
  function viewport(viewport) {
    if (currentViewport.equals(viewport) === false) {
      gl.viewport(viewport.x, viewport.y, viewport.z, viewport.w);
      currentViewport.copy(viewport);
    }
  }

//

  function reset() {

    for (var i = 0; i < enabledAttributes.length; i++) {

      if (enabledAttributes[i] === 1) {

        gl.disableVertexAttribArray(i);
        enabledAttributes[i] = 0;

      }

    }

    enabledCapabilities = {};

    currentTextureSlot = null;
    currentBoundTextures = {};

    currentProgram = null;

    currentBlending = null;

    currentFlipSided = null;
    currentCullFace = null;

    colorBuffer.reset();
    depthBuffer.reset();
    stencilBuffer.reset();

  }

  return {

    buffers: {
      color: colorBuffer,
      depth: depthBuffer,
      stencil: stencilBuffer
    },

    initAttributes: initAttributes,
    enableAttribute: enableAttribute,
    enableAttributeAndDivisor: enableAttributeAndDivisor,
    disableUnusedAttributes: disableUnusedAttributes,
    enable: enable,
    disable: disable,

    useProgram: useProgram,

    setBlending: setBlending,
    setMaterial: setMaterial,

    setFlipSided: setFlipSided,
    setCullFace: setCullFace,

    setLineWidth: setLineWidth,
    setPolygonOffset: setPolygonOffset,

    setScissorTest: setScissorTest,

    activeTexture: activeTexture,
    bindTexture: bindTexture,
    unbindTexture: unbindTexture,
    compressedTexImage2D: compressedTexImage2D,
    texImage2D: texImage2D,
    texImage3D: texImage3D,

    scissor: scissor,
    viewport: viewport,

    reset: reset

  };

}


export {WebGLState};
