/**
 * @author mrdoob / http://mrdoob.com/
 */

function painterSortStable(a, b) {

  if (a.groupOrder !== b.groupOrder) {

    return a.groupOrder - b.groupOrder;

  } else if (a.renderOrder !== b.renderOrder) {

    return a.renderOrder - b.renderOrder;

  } else if (a.program !== b.program) {

    return a.program.id - b.program.id;

  } else if (a.material.id !== b.material.id) {

    return a.material.id - b.material.id;

  } else if (a.z !== b.z) {

    return a.z - b.z;

  } else {

    return a.id - b.id;

  }

}

function reversePainterSortStable(a, b) {

  if (a.groupOrder !== b.groupOrder) {

    return a.groupOrder - b.groupOrder;

  } else if (a.renderOrder !== b.renderOrder) {

    return a.renderOrder - b.renderOrder;

  } else if (a.z !== b.z) {

    return b.z - a.z;

  } else {

    return a.id - b.id;

  }

}

/**
 *
 * @returns {{init: init, opaque: Array, unshift: unshift, sort: sort, transparent: Array, push: push}}
 * @constructor
 */
function WebGLRenderList() {

  // 保存对象渲染项信息
  var renderItems = [];
  var renderItemsIndex = 0;

  var opaque = [];
  var transparent = [];

  // 默认着色器
  var defaultProgram = {id: -1};

  /**
   * 初始化
   */
  function init() {
    renderItemsIndex = 0;

    opaque.length = 0;
    transparent.length = 0;
  }

  /**
   * 信息存放至渲染列表
   * @param object 对象
   * @param geometry 集合体
   * @param material 材质
   * @param groupOrder 渲染级别
   * @param z 深度值
   * @param group
   */
  function getNextRenderItem(object, geometry, material, groupOrder, z, group) {

    var renderItem = renderItems[renderItemsIndex];

    if (renderItem === undefined) {
      renderItem = {
        id: object.id,
        object: object,
        geometry: geometry,
        material: material,
        program: material.program || defaultProgram,
        groupOrder: groupOrder,
        renderOrder: object.renderOrder,
        z: z,
        group: group
      };
      renderItems[renderItemsIndex] = renderItem;
    }
    else {
      renderItem.id = object.id;
      renderItem.object = object;
      renderItem.geometry = geometry;
      renderItem.material = material;
      renderItem.program = material.program || defaultProgram;
      renderItem.groupOrder = groupOrder;
      renderItem.renderOrder = object.renderOrder;
      renderItem.z = z;
      renderItem.group = group;
    }

    renderItemsIndex++;

    return renderItem;

  }

  /**
   * 信息存放至渲染列表
   * @param object 对象
   * @param geometry 集合体
   * @param material 材质
   * @param groupOrder 渲染级别
   * @param z 深度值
   * @param group
   */
  function push(object, geometry, material, groupOrder, z, group) {
    var renderItem = getNextRenderItem(object, geometry, material, groupOrder, z, group);
    (material.transparent === true ? transparent : opaque).push(renderItem);
  }

  /**
   *
   * @param object 对象
   * @param geometry 几何体
   * @param material 材质
   * @param groupOrder 0
   * @param z 0
   * @param group null
   */
  function unshift(object, geometry, material, groupOrder, z, group) {
    var renderItem = getNextRenderItem(object, geometry, material, groupOrder, z, group);
    (material.transparent === true ? transparent : opaque).unshift(renderItem);
  }

  /**
   * 对渲染物体排序
   */
  function sort() {
    if (opaque.length > 1) opaque.sort(painterSortStable);
    if (transparent.length > 1) transparent.sort(reversePainterSortStable);
  }

  return {
    opaque: opaque,
    transparent: transparent,

    init: init,
    push: push,
    unshift: unshift,

    sort: sort
  };

}

/**
 * 渲染列表管理
 * @returns {{get: (function(*=, *=): {init: init, opaque: Array, unshift: unshift, sort: sort, transparent: Array, push: push}), dispose: dispose}}
 * @constructor
 */
function WebGLRenderLists() {

  var lists = new WeakMap();

  function onSceneDispose(event) {

    var scene = event.target;

    scene.removeEventListener('dispose', onSceneDispose);

    lists.delete(scene);

  }

  /**
   * 获取渲染列表
   * @param scene 场景
   * @param camera 相机
   * @returns {{init: init, opaque: Array, unshift: unshift, sort: sort, transparent: Array, push: push}}
   */
  function get(scene, camera) {

    var cameras = lists.get(scene);
    var list;
    if (cameras === undefined) {

      list = new WebGLRenderList();
      lists.set(scene, new WeakMap());
      lists.get(scene).set(camera, list);

      scene.addEventListener('dispose', onSceneDispose);

    }
    else {

      list = cameras.get(camera);
      if (list === undefined) {

        list = new WebGLRenderList();
        cameras.set(camera, list);

      }

    }

    return list;

  }

  function dispose() {

    lists = new WeakMap();

  }

  return {
    get: get,
    dispose: dispose
  };

}


export {WebGLRenderLists};
