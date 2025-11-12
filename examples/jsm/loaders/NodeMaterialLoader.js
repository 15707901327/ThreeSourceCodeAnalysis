/**
 * @author sunag / http://www.sunag.com.br/
 */

import {
  DefaultLoadingManager,
  FileLoader
} from "../../../build/three_r108.module.js";

import * as Nodes from "../nodes/Nodes.js";

/**
 * 节点材质加载器
 * @param manager 管理加载器
 * @param library 库
 * @constructor
 */
var NodeMaterialLoader = function(manager, library) {

  this.manager = (manager !== undefined) ? manager : DefaultLoadingManager;

  this.nodes = {}; // 记录节点 {uuid：node}
  this.materials = {}; // 记录材质节点{uuid:node}
  this.passes = {};
  this.names = {}; // 记录节点 {name:node}
  this.library = library || {};

};

var NodeMaterialLoaderUtils = {

  replaceUUIDObject: function(object, uuid, value, recursive) {

    recursive = recursive !== undefined ? recursive : true;

    if (typeof uuid === "object") uuid = uuid.uuid;

    if (typeof object === "object") {

      var keys = Object.keys(object);

      for (var i = 0; i < keys.length; i++) {

        var key = keys[i];

        if (recursive) {

          object[key] = this.replaceUUIDObject(object[key], uuid, value);

        }

        if (key === uuid) {

          object[uuid] = object[key];

          delete object[key];

        }

      }

    }

    return object === uuid ? value : object;

  },

  replaceUUID: function(json, uuid, value) {

    this.replaceUUIDObject(json, uuid, value, false);
    this.replaceUUIDObject(json.nodes, uuid, value);
    this.replaceUUIDObject(json.materials, uuid, value);
    this.replaceUUIDObject(json.passes, uuid, value);
    this.replaceUUIDObject(json.library, uuid, value, false);

    return json;

  }

};

Object.assign(NodeMaterialLoader.prototype, {

  /**
   * 加载
   * @param url 路径
   * @param onLoad 加载完成回调函数
   * @param onProgress 加载过程回调函数
   * @param onError 加载错误回调函数
   * @returns {NodeMaterialLoader}
   */
  load: function(url, onLoad, onProgress, onError) {

    var scope = this;

    var loader = new FileLoader(scope.manager);
    loader.setPath(scope.path);
    loader.load(url, function(text) {
      // 转换为json数据，并解析数据
      onLoad(scope.parse(JSON.parse(text)));
    }, onProgress, onError);
    return this;
  },

  setPath: function(value) {
    this.path = value;
    return this;
  },

  /**
   * 在带名称的节点中，根据uuid查找物体
   * @param uuid
   * @returns {*}
   */
  getObjectByName: function(uuid) {
    return this.names[uuid];
  },

  /**
   * 通过uuid获取节点
   * @param uuid
   * @returns {*}
   */
  getObjectById: function(uuid) {
    return this.library[uuid] ||
      this.nodes[uuid] ||
      this.materials[uuid] ||
      this.passes[uuid] ||
      this.names[uuid];
  },

  /**
   * 获取节点
   * @param uuid
   * @returns {*}
   */
  getNode: function(uuid) {

    var object = this.getObjectById(uuid);

    if (!object) {
      console.warn("Node \"" + uuid + "\" not found.");
    }

    return object;

  },

  /**
   * 解析json，挂载子类的节点
   * @param json
   * @returns {string|(boolean|number)|*}
   */
  resolve: function(json) {

    switch(typeof json){
      case "boolean":
      case "number":
        return json;
      case "string":
        if (/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/i.test(json) || this.library[json]) {
          return this.getNode(json);
        }
        return json;
      default:
        if (Array.isArray(json)) {
          for (var i = 0; i < json.length; i++) {
            json[i] = this.resolve(json[i]);
          }
        } else {
          for (var prop in json) {
            if (prop === "uuid") continue;
            json[prop] = this.resolve(json[prop]);
          }
        }
    }

    return json;

  },

  /**
   * 申明文件中的节点
   * @param json
   * @returns {{material}}
   */
  declare: function(json) {

    var uuid, node, object;

    // 遍历 nodes，创建节点
    for (uuid in json.nodes) {

      node = json.nodes[uuid];

      // 根据节点类型创建节点
      object = new Nodes[node.nodeType + "Node"]();

      // 添加节点名称并记录节点
      if (node.name) {
        object.name = node.name;
        this.names[object.name] = object;
      }

      // 使用uuid记录节点
      this.nodes[uuid] = object;

    }

    // 遍历 materials
    for (uuid in json.materials) {

      node = json.materials[uuid];

      // 创建材质节点
      object = new Nodes[node.type]();

      // 记录节点名称，记录节点
      if (node.name) {
        object.name = node.name;
        this.names[object.name] = object;
      }

      // 记录材质节点
      this.materials[uuid] = object;

    }

    for (uuid in json.passes) {

      node = json.passes[uuid];

      object = new Nodes[node.type]();

      if (node.name) {

        object.name = node.name;

        this.names[object.name] = object;

      }

      this.passes[uuid] = object;

    }

    // 当前材质节点
    if (json.material) this.material = this.materials[json.material];

    if (json.pass) this.pass = this.passes[json.pass];

    return json;

  },

  /**
   * 解析json数据
   * @param json
   * @returns {*|NodeMaterialLoader}
   */
  parse: function(json) {

    var uuid;

    // 申明节点，解析json，挂载子类
    json = this.resolve(this.declare(json));

    // 遍历nodes，更新节点
    for (uuid in json.nodes) {
      this.nodes[uuid].copy(json.nodes[uuid]);
    }

    // 更新材质节点
    for (uuid in json.materials) {
      this.materials[uuid].copy(json.materials[uuid]);
    }

    for (uuid in json.passes) {
      this.passes[uuid].copy(json.passes[uuid]);
    }

    return this.material || this.pass || this;
  }

});

export {NodeMaterialLoader, NodeMaterialLoaderUtils};
