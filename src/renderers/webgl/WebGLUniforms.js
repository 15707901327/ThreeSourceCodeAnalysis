/**
 * @author tschw
 * @author Mugen87 / https://github.com/Mugen87
 * @author mrdoob / http://mrdoob.com/
 *
 * Uniforms of a program.
 * Those form a tree structure with a special top-level container for the root,
 * which you get by calling 'new WebGLUniforms( gl, program )'.
 *
 *
 * Properties of inner nodes including the top-level container:
 *
 * .seq - array of nested uniforms
 * .map - nested uniforms by name
 *
 *
 * Methods of all nodes except the top-level container:
 *
 * .setValue( gl, value, [textures] )
 *
 *    uploads a uniform value(s)
 *    the 'textures' parameter is needed for sampler uniforms
 *
 *
 * Static methods of the top-level container (textures factorizations):
 *
 * .upload( gl, seq, values, textures )
 *
 *    sets uniforms in 'seq' to 'values[id].value'
 *
 * .seqWithValue( seq, values ) : filteredSeq
 *
 *    filters 'seq' entries with corresponding entry in values
 *
 *
 * Methods of the top-level container (textures factorizations):
 *
 * .setValue( gl, name, value, textures )
 *
 *    sets uniform with  name 'name' to 'value'
 *
 * .setOptional( gl, obj, prop )
 *
 *    like .set for an optional property of the object
 *
 */

import {CubeTexture} from '../../textures/CubeTexture.js';
import {Texture} from '../../textures/Texture.js';
import {DataTexture2DArray} from '../../textures/DataTexture2DArray.js';
import {DataTexture3D} from '../../textures/DataTexture3D.js';

var emptyTexture = new Texture();
var emptyTexture2dArray = new DataTexture2DArray();
var emptyTexture3d = new DataTexture3D();
var emptyCubeTexture = new CubeTexture();

// --- Utilities ---

// Array Caches (provide typed arrays for temporary by size)

var arrayCacheF32 = [];
var arrayCacheI32 = [];

// Float32Array caches used for uploading Matrix uniforms

var mat4array = new Float32Array(16);
var mat3array = new Float32Array(9);
var mat2array = new Float32Array(4);

// Flattening for arrays of vectors and matrices

function flatten(array, nBlocks, blockSize) {

  var firstElem = array[0];

  if (firstElem <= 0 || firstElem > 0) return array;
  // unoptimized: ! isNaN( firstElem )
  // see http://jacksondunstan.com/articles/983

  var n = nBlocks * blockSize,
    r = arrayCacheF32[n];

  if (r === undefined) {

    r = new Float32Array(n);
    arrayCacheF32[n] = r;

  }

  if (nBlocks !== 0) {

    firstElem.toArray(r, 0);

    for (var i = 1, offset = 0; i !== nBlocks; ++i) {

      offset += blockSize;
      array[i].toArray(r, offset);

    }

  }

  return r;

}

function arraysEqual(a, b) {

  if (a.length !== b.length) return false;

  for (var i = 0, l = a.length; i < l; i++) {

    if (a[i] !== b[i]) return false;

  }

  return true;

}

function copyArray(a, b) {

  for (var i = 0, l = b.length; i < l; i++) {

    a[i] = b[i];

  }

}

// Texture unit allocation

function allocTexUnits(textures, n) {

  var r = arrayCacheI32[n];

  if (r === undefined) {

    r = new Int32Array(n);
    arrayCacheI32[n] = r;

  }

  for (var i = 0; i !== n; ++i)
    r[i] = textures.allocateTextureUnit();

  return r;

}

// --- Setters ---

// Note: Defining these methods externally, because they come in a bunch
// and this way their names minify.

// Single scalar

function setValueV1f(gl, v) {

  var cache = this.cache;

  if (cache[0] === v) return;

  gl.uniform1f(this.addr, v);

  cache[0] = v;

}

// Single float vector (from flat array or THREE.VectorN)

function setValueV2f(gl, v) {

  var cache = this.cache;

  if (v.x !== undefined) {

    if (cache[0] !== v.x || cache[1] !== v.y) {

      gl.uniform2f(this.addr, v.x, v.y);

      cache[0] = v.x;
      cache[1] = v.y;

    }

  } else {

    if (arraysEqual(cache, v)) return;

    gl.uniform2fv(this.addr, v);

    copyArray(cache, v);

  }

}

/**
 *
 * @param gl 上下文
 * @param v 值
 */
function setValueV3f(gl, v) {

  var cache = this.cache;

  if (v.x !== undefined) {

    if (cache[0] !== v.x || cache[1] !== v.y || cache[2] !== v.z) {

      gl.uniform3f(this.addr, v.x, v.y, v.z);

      cache[0] = v.x;
      cache[1] = v.y;
      cache[2] = v.z;

    }

  } else if (v.r !== undefined) {

    if (cache[0] !== v.r || cache[1] !== v.g || cache[2] !== v.b) {

      gl.uniform3f(this.addr, v.r, v.g, v.b);

      cache[0] = v.r;
      cache[1] = v.g;
      cache[2] = v.b;

    }

  } else {

    if (arraysEqual(cache, v)) return;

    gl.uniform3fv(this.addr, v);

    copyArray(cache, v);

  }

}

function setValueV4f(gl, v) {

  var cache = this.cache;

  if (v.x !== undefined) {

    if (cache[0] !== v.x || cache[1] !== v.y || cache[2] !== v.z || cache[3] !== v.w) {

      gl.uniform4f(this.addr, v.x, v.y, v.z, v.w);

      cache[0] = v.x;
      cache[1] = v.y;
      cache[2] = v.z;
      cache[3] = v.w;

    }

  } else {

    if (arraysEqual(cache, v)) return;

    gl.uniform4fv(this.addr, v);

    copyArray(cache, v);

  }

}

// Single matrix (from flat array or MatrixN)

function setValueM2(gl, v) {

  var cache = this.cache;
  var elements = v.elements;

  if (elements === undefined) {

    if (arraysEqual(cache, v)) return;

    gl.uniformMatrix2fv(this.addr, false, v);

    copyArray(cache, v);

  } else {

    if (arraysEqual(cache, elements)) return;

    mat2array.set(elements);

    gl.uniformMatrix2fv(this.addr, false, mat2array);

    copyArray(cache, elements);

  }

}

function setValueM3(gl, v) {

  var cache = this.cache;
  var elements = v.elements;

  if (elements === undefined) {

    if (arraysEqual(cache, v)) return;

    gl.uniformMatrix3fv(this.addr, false, v);

    copyArray(cache, v);

  } else {

    if (arraysEqual(cache, elements)) return;

    mat3array.set(elements);

    gl.uniformMatrix3fv(this.addr, false, mat3array);

    copyArray(cache, elements);

  }

}

function setValueM4(gl, v) {

  var cache = this.cache;
  var elements = v.elements;

  if (elements === undefined) {

    if (arraysEqual(cache, v)) return;

    gl.uniformMatrix4fv(this.addr, false, v);

    copyArray(cache, v);

  } else {

    if (arraysEqual(cache, elements)) return;

    mat4array.set(elements);

    gl.uniformMatrix4fv(this.addr, false, mat4array);

    copyArray(cache, elements);

  }

}

// Single texture (2D / Cube)

function setValueT1(gl, v, textures) {

  var cache = this.cache;
  var unit = textures.allocateTextureUnit();

  if (cache[0] !== unit) {

    gl.uniform1i(this.addr, unit);
    cache[0] = unit;

  }

  textures.safeSetTexture2D(v || emptyTexture, unit);

}

function setValueT2DArray1(gl, v, textures) {

  var cache = this.cache;
  var unit = textures.allocateTextureUnit();

  if (cache[0] !== unit) {

    gl.uniform1i(this.addr, unit);
    cache[0] = unit;

  }

  textures.setTexture2DArray(v || emptyTexture2dArray, unit);

}

function setValueT3D1(gl, v, textures) {

  var cache = this.cache;
  var unit = textures.allocateTextureUnit();

  if (cache[0] !== unit) {

    gl.uniform1i(this.addr, unit);
    cache[0] = unit;

  }

  textures.setTexture3D(v || emptyTexture3d, unit);

}

/**
 *
 * @param gl
 * @param v
 * @param textures
 */
function setValueT6(gl, v, textures) {

  var cache = this.cache;
  var unit = textures.allocateTextureUnit();

  if (cache[0] !== unit) {

    // 将纹理传递给取样器
    gl.uniform1i(this.addr, unit);
    cache[0] = unit;

  }

  textures.safeSetTextureCube(v || emptyCubeTexture, unit);

}

// Integer / Boolean vectors or arrays thereof (always flat arrays)

function setValueV1i(gl, v) {

  var cache = this.cache;

  if (cache[0] === v) return;

  gl.uniform1i(this.addr, v);

  cache[0] = v;

}

function setValueV2i(gl, v) {

  var cache = this.cache;

  if (arraysEqual(cache, v)) return;

  gl.uniform2iv(this.addr, v);

  copyArray(cache, v);

}

function setValueV3i(gl, v) {

  var cache = this.cache;

  if (arraysEqual(cache, v)) return;

  gl.uniform3iv(this.addr, v);

  copyArray(cache, v);

}

function setValueV4i(gl, v) {

  var cache = this.cache;

  if (arraysEqual(cache, v)) return;

  gl.uniform4iv(this.addr, v);

  copyArray(cache, v);

}

// uint

function setValueV1ui(gl, v) {

  var cache = this.cache;

  if (cache[0] === v) return;

  gl.uniform1ui(this.addr, v);

  cache[0] = v;

}

// Helper to pick the right setter for the singular case
/**
 * 得到数据的传输类型
 * @param type
 * @return {*}
 */
function getSingularSetter(type) {

  switch(type){

    case 0x1406:
      return setValueV1f; // FLOAT
    case 0x8b50:
      return setValueV2f; // _VEC2
    case 0x8b51:
      return setValueV3f; // _VEC3
    case 0x8b52:
      return setValueV4f; // _VEC4

    case 0x8b5a:
      return setValueM2; // _MAT2
    case 0x8b5b:
      return setValueM3; // _MAT3
    case 0x8b5c:
      return setValueM4; // _MAT4

    case 0x1404:
    case 0x8b56:
      return setValueV1i; // INT, BOOL
    case 0x8b53:
    case 0x8b57:
      return setValueV2i; // _VEC2
    case 0x8b54:
    case 0x8b58:
      return setValueV3i; // _VEC3
    case 0x8b55:
    case 0x8b59:
      return setValueV4i; // _VEC4

    case 0x1405:
      return setValueV1ui; // UINT

    case 0x8b5e: // SAMPLER_2D
    case 0x8d66: // SAMPLER_EXTERNAL_OES
    case 0x8dca: // INT_SAMPLER_2D
    case 0x8dd2: // UNSIGNED_INT_SAMPLER_2D
    case 0x8b62: // SAMPLER_2D_SHADOW
      return setValueT1;

    case 0x8b5f: // SAMPLER_3D
    case 0x8dcb: // INT_SAMPLER_3D
    case 0x8dd3: // UNSIGNED_INT_SAMPLER_3D
      return setValueT3D1;

    case 0x8b60: // SAMPLER_CUBE
    case 0x8dcc: // INT_SAMPLER_CUBE
    case 0x8dd4: // UNSIGNED_INT_SAMPLER_CUBE
    case 0x8dc5: // SAMPLER_CUBE_SHADOW
      return setValueT6;

    case 0x8dc1: // SAMPLER_2D_ARRAY
    case 0x8dcf: // INT_SAMPLER_2D_ARRAY
    case 0x8dd7: // UNSIGNED_INT_SAMPLER_2D_ARRAY
    case 0x8dc4: // SAMPLER_2D_ARRAY_SHADOW
      return setValueT2DArray1;

  }

}

// Array of scalars
function setValueV1fArray(gl, v) {

  gl.uniform1fv(this.addr, v);

}

// Integer / Boolean vectors or arrays thereof (always flat arrays)
function setValueV1iArray(gl, v) {

  gl.uniform1iv(this.addr, v);

}

function setValueV2iArray(gl, v) {

  gl.uniform2iv(this.addr, v);

}

function setValueV3iArray(gl, v) {

  gl.uniform3iv(this.addr, v);

}

function setValueV4iArray(gl, v) {

  gl.uniform4iv(this.addr, v);

}

// Array of vectors (flat or from THREE classes)

function setValueV2fArray(gl, v) {

  var data = flatten(v, this.size, 2);

  gl.uniform2fv(this.addr, data);

}

function setValueV3fArray(gl, v) {

  var data = flatten(v, this.size, 3);

  gl.uniform3fv(this.addr, data);

}

function setValueV4fArray(gl, v) {

  var data = flatten(v, this.size, 4);

  gl.uniform4fv(this.addr, data);

}

// Array of matrices (flat or from THREE clases)

function setValueM2Array(gl, v) {

  var data = flatten(v, this.size, 4);

  gl.uniformMatrix2fv(this.addr, false, data);

}

function setValueM3Array(gl, v) {

  var data = flatten(v, this.size, 9);

  gl.uniformMatrix3fv(this.addr, false, data);

}

function setValueM4Array(gl, v) {

  var data = flatten(v, this.size, 16);

  gl.uniformMatrix4fv(this.addr, false, data);

}

// Array of textures (2D / Cube)

function setValueT1Array(gl, v, textures) {

  var n = v.length;

  var units = allocTexUnits(textures, n);

  gl.uniform1iv(this.addr, units);

  for (var i = 0; i !== n; ++i) {

    textures.safeSetTexture2D(v[i] || emptyTexture, units[i]);

  }

}

function setValueT6Array(gl, v, textures) {

  var n = v.length;

  var units = allocTexUnits(textures, n);

  gl.uniform1iv(this.addr, units);

  for (var i = 0; i !== n; ++i) {

    textures.safeSetTextureCube(v[i] || emptyCubeTexture, units[i]);

  }

}

// Helper to pick the right setter for a pure (bottom-level) array
/**
 *
 * @param type
 * @returns {setValueV3fArray|setValueV4fArray|setValueV3iArray|setValueV1fArray|setValueV4iArray|setValueM4Array|setValueM2Array|setValueT6Array|setValueT1Array|setValueV2iArray|setValueV1iArray|setValueM3Array|setValueV2fArray}
 */
function getPureArraySetter(type) {

  switch(type){

    case 0x1406:
      return setValueV1fArray; // FLOAT
    case 0x8b50:
      return setValueV2fArray; // _VEC2
    case 0x8b51:
      return setValueV3fArray; // _VEC3
    case 0x8b52:
      return setValueV4fArray; // _VEC4

    case 0x8b5a:
      return setValueM2Array; // _MAT2
    case 0x8b5b:
      return setValueM3Array; // _MAT3
    case 0x8b5c:
      return setValueM4Array; // _MAT4

    case 0x1404:
    case 0x8b56:
      return setValueV1iArray; // INT, BOOL
    case 0x8b53:
    case 0x8b57:
      return setValueV2iArray; // _VEC2
    case 0x8b54:
    case 0x8b58:
      return setValueV3iArray; // _VEC3
    case 0x8b55:
    case 0x8b59:
      return setValueV4iArray; // _VEC4

    case 0x8b5e: // SAMPLER_2D
    case 0x8d66: // SAMPLER_EXTERNAL_OES
    case 0x8dca: // INT_SAMPLER_2D
    case 0x8dd2: // UNSIGNED_INT_SAMPLER_2D
    case 0x8b62: // SAMPLER_2D_SHADOW
      return setValueT1Array;

    case 0x8b60: // SAMPLER_CUBE
    case 0x8dcc: // INT_SAMPLER_CUBE
    case 0x8dd4: // UNSIGNED_INT_SAMPLER_CUBE
    case 0x8dc5: // SAMPLER_CUBE_SHADOW
      return setValueT6Array;
  }
}

/**
 * --- Uniform Classes ---
 * @param id 名称
 * @param activeInfo 信息
 * @param addr 地址
 * @constructor
 */
function SingleUniform(id, activeInfo, addr) {

  this.id = id;
  this.addr = addr;
  this.cache = [];
  this.setValue = getSingularSetter(activeInfo.type);

  // this.path = activeInfo.name; // DEBUG
}

/**
 *
 * @param id
 * @param activeInfo
 * @param addr
 * @constructor
 */
function PureArrayUniform(id, activeInfo, addr) {

  this.id = id;
  this.addr = addr;
  this.cache = [];
  this.size = activeInfo.size;
  this.setValue = getPureArraySetter(activeInfo.type);
  // this.path = activeInfo.name; // DEBUG
}

PureArrayUniform.prototype.updateCache = function(data) {

  var cache = this.cache;

  if (data instanceof Float32Array && cache.length !== data.length) {

    this.cache = new Float32Array(data.length);

  }

  copyArray(cache, data);

};

/**
 * 结构体uniform变量
 * @param id 变量名称
 * @constructor
 */
function StructuredUniform(id) {

  this.id = id;

  this.seq = [];
  this.map = {};
}

StructuredUniform.prototype.setValue = function(gl, value, textures) {

  var seq = this.seq;

  for (var i = 0, n = seq.length; i !== n; ++i) {

    var u = seq[i];
    u.setValue(gl, value[u.id], textures);

  }

};

// --- Top-level ---

// Parser - builds up the property tree from the path strings

var RePathPart = /([\w\d_]+)(\])?(\[|\.)?/g;

// extracts
// 	- the identifier (member name or array index)
//  - followed by an optional right bracket (found when array index)
//  - followed by an optional left bracket or dot (type of subscript)
//
// Note: These portions can be read in a non-overlapping fashion and
// allow straightforward parsing of the hierarchy that WebGL encodes
// in the uniform names.
/**
 * 添加统一变量
 * @param container
 * @param uniformObject
 */
function addUniform(container, uniformObject) {
  container.seq.push(uniformObject);
  container.map[uniformObject.id] = uniformObject;
}

/**
 * 解析uniform变量
 * @param activeInfo{WebGLActiveInfo} uniform变量的相关信息
 * @param addr 属性地址
 * @param container{WebGLUniforms}
 */
function parseUniform(activeInfo, addr, container) {

  var path = activeInfo.name,
    pathLength = path.length;

  // reset RegExp object, because of the early exit of a previous run
  RePathPart.lastIndex = 0;

  while(true){

    /**
     * exec() 方法用于检索字符串中的正则表达式的匹配。
     * 返回一个数组：
     *  0：正则表达式匹配的文本
     *  1：RegExpObject 的第 1 个子表达式相匹配的文本
     *  2：RegExpObject 的第 2 个子表达式相匹配的文本（如果有的话）
     *  index： 属性声明的是匹配文本的第一个字符的位置
     *  input：属性则存放的是被检索的字符串 string
     *  但是，当 RegExpObject 是一个全局正则表达式时，它会在 RegExpObject 的 lastIndex 属性指定的字符处开始检索字符串 string。
     *  当 exec() 找到了与表达式相匹配的文本时，在匹配后，它将把 RegExpObject 的 lastIndex 属性设置为匹配文本的最后一个字符的下一个位置。
     *  这就是说，您可以通过反复调用 exec() 方法来遍历字符串中的所有匹配文本。当 exec() 再也找不到匹配的文本时，它将返回 null，并把 lastIndex 属性重置为 0。
     */
    var match = RePathPart.exec(path),
      matchEnd = RePathPart.lastIndex,

      id = match[1],
      idIsIndex = match[2] === ']',
      subscript = match[3];

    if (idIsIndex) id = id | 0; // convert to integer

    if (subscript === undefined || subscript === '[' && matchEnd + 2 === pathLength) {
      // bare name or "pure" bottom-level array "[0]" suffix
      addUniform(container, subscript === undefined ?
        new SingleUniform(id, activeInfo, addr) :
        new PureArrayUniform(id, activeInfo, addr));
      break;
    } else {
      // step into inner node / create it in case it doesn't exist
      var map = container.map, next = map[id];
      if (next === undefined) {
        next = new StructuredUniform(id);
        addUniform(container, next);
      }
      container = next;
    }
  }
}

// Root Container

/**
 * 管理Uniform及地址
 * @param gl
 * @param program
 * @constructor
 */
function WebGLUniforms(gl, program) {

  this.seq = [];
  this.map = {};

  // 获取变量Uniform的数量
  var n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  for (var i = 0; i < n; ++i) {

    var info = gl.getActiveUniform(program, i),
      addr = gl.getUniformLocation(program, info.name);

    parseUniform(info, addr, this);

  }

}

/**
 *
 * @param gl
 * @param name
 * @param value
 * @param textures
 */
WebGLUniforms.prototype.setValue = function(gl, name, value, textures) {

  var u = this.map[name];

  if (u !== undefined) u.setValue(gl, value, textures);

};

WebGLUniforms.prototype.setOptional = function(gl, object, name) {

  var v = object[name];

  if (v !== undefined) this.setValue(gl, name, v);

};


// Static interface

/**
 * 将uniforms变量传送给着色器
 * @param gl 上下文
 * @param seq uniformsList
 * @param values{Object}
 * @param textures
 */
WebGLUniforms.upload = function(gl, seq, values, textures) {

  for (var i = 0, n = seq.length; i !== n; ++i) {

    var u = seq[i],
      v = values[u.id];

    if (v.needsUpdate !== false) {

      // note: always updating when .needsUpdate is undefined
      u.setValue(gl, v.value, textures);

    }

  }

};

/**
 * 比较同时存在的属性，添加到数组
 * @param seq
 * @param values
 * @return {Array}
 */
WebGLUniforms.seqWithValue = function(seq, values) {

  var r = [];

  for (var i = 0, n = seq.length; i !== n; ++i) {

    var u = seq[i];
    if (u.id in values) r.push(u);

  }

  return r;

};

export {WebGLUniforms};
