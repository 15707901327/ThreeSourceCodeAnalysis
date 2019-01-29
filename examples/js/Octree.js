/*!
 *
 * threeoctree.js (r60) / https://github.com/collinhover/threeoctree
 * (sparse) dynamic 3D spatial representation structure for fast searches.
 *
 * @author Collin Hover / http://collinhover.com/
 * based on Dynamic Octree by Piko3D @ http://www.piko3d.com/ and Octree by Marek Pawlowski @ pawlowski.it
 *
 */
(function (THREE) {

  "use strict";

  /*===================================================

  utility

  =====================================================*/

  // 检测是否是数字
  function isNumber(n) {

    return !isNaN(n) && isFinite(n);

  }

  function isArray(target) {

    return Object.prototype.toString.call(target) === '[object Array]';

  }

  function toArray(target) {

    return target ? (isArray(target) !== true ? [target] : target) : [];

  }

  /**
   * 查找value在数组中的下标
   * @param array {Array}
   * @param value
   * @returns {number} 如果查找到，返回数组的下标，否则返回-1
   */
  function indexOfValue(array, value) {
    for (var i = 0, il = array.length; i < il; i++) {
      if (array[i] === value) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 查找数组array中对象的property属性值为value的对象，在数组中的小标
   * @param array 保存对象的数组
   * @param property 对象的属性名称
   * @param value 对象的属性值
   * @returns {number} 对象在数组中的下标，如果没有找到返回-1
   */
  function indexOfPropertyWithValue(array, property, value) {

    for (var i = 0, il = array.length; i < il; i++) {
      if (array[i][property] === value) {
        return i;
      }
    }
    return -1;
  }

  /*===================================================

  octree

  =====================================================*/

  /**
   * 八叉树对象
   * @param parameters {Object}
   *    tree：树的主结构THREE.Octree实例对象
   *    scene：场景
   *    depthMax：设置树的最大深度，默认 Infinity
   *    objectsThreshold：节点拆分或合并之前的最大对象数量，默认8
   *    overlapPct：介于0和1之间的节点将相互重叠,有助于插入位于多个节点上的对象，默认0.15
   *    undeferred：当undeferred = true时，立即插入对象,而不是延迟到下一个octree.update（）调用,这可能会降低性能，因为它会强制更新矩阵，默认false
   *    root：根节点 THREE.OctreeNode对象实例，默认创建一个THREE.OctreeNode对象实例
   *    INDEX_OUTSIDE_POS_X：
   *    INDEX_OUTSIDE_NEG_X：
   *    INDEX_OUTSIDE_POS_Y:
   *    INDEX_OUTSIDE_NEG_Y:
   *    INDEX_OUTSIDE_POS_Z:
   *    INDEX_OUTSIDE_NEG_Z:
   * @constructor
   */
  THREE.Octree = function (parameters) {

    // 处理参数
    parameters = parameters || {};

    parameters.tree = this;

    // 静态属性（不建议修改）
    this.nodeCount = 0; // 树中节点的数量

    this.INDEX_INSIDE_CROSS = -1; // 内部交叉索引
    this.INDEX_OUTSIDE_OFFSET = 2; // 索引超出偏移量

    // INDEX_OUTSIDE_* 索引超出
    this.INDEX_OUTSIDE_POS_X = isNumber(parameters.INDEX_OUTSIDE_POS_X) ? parameters.INDEX_OUTSIDE_POS_X : 0;
    this.INDEX_OUTSIDE_NEG_X = isNumber(parameters.INDEX_OUTSIDE_NEG_X) ? parameters.INDEX_OUTSIDE_NEG_X : 1;
    this.INDEX_OUTSIDE_POS_Y = isNumber(parameters.INDEX_OUTSIDE_POS_Y) ? parameters.INDEX_OUTSIDE_POS_Y : 2;
    this.INDEX_OUTSIDE_NEG_Y = isNumber(parameters.INDEX_OUTSIDE_NEG_Y) ? parameters.INDEX_OUTSIDE_NEG_Y : 3;
    this.INDEX_OUTSIDE_POS_Z = isNumber(parameters.INDEX_OUTSIDE_POS_Z) ? parameters.INDEX_OUTSIDE_POS_Z : 4;
    this.INDEX_OUTSIDE_NEG_Z = isNumber(parameters.INDEX_OUTSIDE_NEG_Z) ? parameters.INDEX_OUTSIDE_NEG_Z : 5;

    // 索引外地图
    this.INDEX_OUTSIDE_MAP = [];
    this.INDEX_OUTSIDE_MAP[this.INDEX_OUTSIDE_POS_X] = {index: this.INDEX_OUTSIDE_POS_X, count: 0, x: 1, y: 0, z: 0};
    this.INDEX_OUTSIDE_MAP[this.INDEX_OUTSIDE_NEG_X] = {index: this.INDEX_OUTSIDE_NEG_X, count: 0, x: -1, y: 0, z: 0};
    this.INDEX_OUTSIDE_MAP[this.INDEX_OUTSIDE_POS_Y] = {index: this.INDEX_OUTSIDE_POS_Y, count: 0, x: 0, y: 1, z: 0};
    this.INDEX_OUTSIDE_MAP[this.INDEX_OUTSIDE_NEG_Y] = {index: this.INDEX_OUTSIDE_NEG_Y, count: 0, x: 0, y: -1, z: 0};
    this.INDEX_OUTSIDE_MAP[this.INDEX_OUTSIDE_POS_Z] = {index: this.INDEX_OUTSIDE_POS_Z, count: 0, x: 0, y: 0, z: 1};
    this.INDEX_OUTSIDE_MAP[this.INDEX_OUTSIDE_NEG_Z] = {index: this.INDEX_OUTSIDE_NEG_Z, count: 0, x: 0, y: 0, z: -1};

    this.FLAG_POS_X = 1 << (this.INDEX_OUTSIDE_POS_X + 1); // 2
    this.FLAG_NEG_X = 1 << (this.INDEX_OUTSIDE_NEG_X + 1); // 4
    this.FLAG_POS_Y = 1 << (this.INDEX_OUTSIDE_POS_Y + 1); // 8
    this.FLAG_NEG_Y = 1 << (this.INDEX_OUTSIDE_NEG_Y + 1); // 16
    this.FLAG_POS_Z = 1 << (this.INDEX_OUTSIDE_POS_Z + 1); // 32
    this.FLAG_NEG_Z = 1 << (this.INDEX_OUTSIDE_NEG_Z + 1); // 46

    this.utilVec31Search = new THREE.Vector3();
    this.utilVec32Search = new THREE.Vector3();

    // 通过场景来形象化八叉树
    this.scene = parameters.scene;
    if (this.scene) {
      var helper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)), 0xff0066);
      this.visualGeometry = helper.geometry;
      this.visualMaterial = helper.material;
    }

    // properties
    this.objects = []; // 保存添加的mesh对象
    this.objectsMap = {}; // 保存添加mesh对象的键值对 {key：mesh对象的uuid，value:mesh}
    this.objectsData = []; // 保存OctreeObjectData对象实例的数组

    // 延迟添加属性
    this.undeferred = parameters.undeferred || false; // 当undeferred = true时，立即插入对象,而不是延迟到下一个octree.update（）调用,这可能会降低性能，因为它会强制更新矩阵
    this.objectsDeferred = []; // 保存延迟添加的对象

    this.depthMax = isNumber(parameters.depthMax) ? parameters.depthMax : Infinity; // 设置树的最大深度
    this.objectsThreshold = isNumber(parameters.objectsThreshold) ? parameters.objectsThreshold : 8; // 节点拆分或合并之前的最大对象数量(一个盒子中，几何体的个数，如果大于这个值，则继续对盒子进行拆分)
    this.overlapPct = isNumber(parameters.overlapPct) ? parameters.overlapPct : 0.15; // 介于0和1之间的节点将相互重叠,有助于插入位于多个节点上的对象

    this.root = parameters.root instanceof THREE.OctreeNode ? parameters.root : new THREE.OctreeNode(parameters);

  };

  THREE.Octree.prototype = {

    /**
     * 把objectsDeferred中保存的延迟对象添加到树中
     */
    update: function () {

      // 添加所有等待渲染周期的延迟对象
      if (this.objectsDeferred.length > 0) {

        for (var i = 0, il = this.objectsDeferred.length; i < il; i++) {

          var deferred = this.objectsDeferred[i];
          this.addDeferred(deferred.object, deferred.options);
        }
        this.objectsDeferred.length = 0;
      }
    },

    /**
     * 把对象添加到树中，分为立即添加和延迟添加（添加的对象暂时保存到objectsDeferred数组中）
     * @param object:加入树中的对象
     * @param options{Object}
     *    useFaces{Boolean}:
     */
    add: function (object, options) {

      // 立即添加
      if (this.undeferred) {

        this.updateObject(object);

        this.addDeferred(object, options);

      } else {
        // 延迟添加

        // 延迟添加，直到更新为止
        this.objectsDeferred.push({object: object, options: options});
      }
    },

    /**
     * 把延迟数组中的对象添加到树中
     * @param object: 要添加到树中的对象
     * @param options{Object}
     *    useFaces{Boolean}
     */
    addDeferred: function (object, options) {

      var i, l,
        geometry,
        faces,
        useFaces,
        vertices,
        useVertices,
        objectData;

      // 数据检查
      // ensure object is not object data
      if (object instanceof THREE.OctreeObjectData) {
        object = object.object;
      }
      // check uuid to avoid duplicates
      if (!object.uuid) {
        object.uuid = THREE.Math.generateUUID();
      }

      if (!this.objectsMap[object.uuid]) {

        // store
        this.objects.push(object);
        this.objectsMap[object.uuid] = object;

        // check options
        if (options) {
          useFaces = options.useFaces;
          useVertices = options.useVertices;
        }

        if (useVertices === true) {
          geometry = object.geometry;
          vertices = geometry.vertices;

          for (i = 0, l = vertices.length; i < l; i++) {
            this.addObjectData(object, vertices[i]);
          }

        } else if (useFaces === true) {

          geometry = object.geometry;
          faces = geometry.faces;

          for (i = 0, l = faces.length; i < l; i++) {
            this.addObjectData(object, faces[i]);
          }

        } else {
          this.addObjectData(object);
        }
      }
    },

    /**
     * 使用THREE.OctreeObjectData实例对象包裹网格对象，添加到树中的节点上
     * @param object：添加的mesh对象
     * @param part
     */
    addObjectData: function (object, part) {

      var objectData = new THREE.OctreeObjectData(object, part);
      // console.log(objectData);

      // add to tree objects data list
      this.objectsData.push(objectData);

      // add to nodes
      this.root.addObject(objectData);
    },

    /**
     * 从树中删除对象
     * @param object:要删除的对象
     */
    remove: function (object) {

      var i, l,
        objectData = object, // 要删除的对象
        index,
        objectsDataRemoved;

      // 确保对象不是索引搜索的对象数据
      if (object instanceof THREE.OctreeObjectData) {
        object = object.object;
      }

      // check uuid
      if (this.objectsMap[object.uuid]) {

        this.objectsMap[object.uuid] = undefined;

        // 检查并从对象，节点和数据列表中删除
        index = indexOfValue(this.objects, object);
        if (index !== -1) {

          this.objects.splice(index, 1);

          // remove from nodes
          objectsDataRemoved = this.root.removeObject(objectData);

          // remove from objects data list
          for (i = 0, l = objectsDataRemoved.length; i < l; i++) {

            objectData = objectsDataRemoved[i];
            index = indexOfValue(this.objectsData, objectData);
            if (index !== -1) {
              this.objectsData.splice(index, 1);
            }
          }
        }
      } else if (this.objectsDeferred.length > 0) {

        // 从延迟对象数组中删除对象
        index = indexOfPropertyWithValue(this.objectsDeferred, 'object', object);
        if (index !== -1) {
          this.objectsDeferred.splice(index, 1);
        }
      }
    },

    extend: function (octree) {

      var i, l,
        objectsData,
        objectData;

      if (octree instanceof THREE.Octree) {

        // for each object data

        objectsData = octree.objectsData;

        for (i = 0, l = objectsData.length; i < l; i++) {

          objectData = objectsData[i];

          this.add(objectData, {useFaces: objectData.faces, useVertices: objectData.vertices});

        }

      }

    },

    rebuild: function () {

      var i, l,
        node,
        object,
        objectData,
        indexOctant,
        indexOctantLast,
        objectsUpdate = [];

      // check all object data for changes in position
      // assumes all object matrices are up to date

      for (i = 0, l = this.objectsData.length; i < l; i++) {

        objectData = this.objectsData[i];

        node = objectData.node;

        // update object

        objectData.update();

        // if position has changed since last organization of object in tree

        if (node instanceof THREE.OctreeNode && !objectData.positionLast.equals(objectData.position)) {

          // get octant index of object within current node

          indexOctantLast = objectData.indexOctant;

          indexOctant = node.getOctantIndex(objectData);

          // if object octant index has changed

          if (indexOctant !== indexOctantLast) {

            // add to update list

            objectsUpdate.push(objectData);

          }

        }

      }

      // update changed objects

      for (i = 0, l = objectsUpdate.length; i < l; i++) {

        objectData = objectsUpdate[i];

        // remove object from current node

        objectData.node.removeObject(objectData);

        // add object to tree root

        this.root.addObject(objectData);

      }

    },

    updateObject: function (object) {

      var i, l,
        parentCascade = [object], // 保存object以及它的所有的父类
        parent,
        parentUpdate;

      // search all parents between object and root for world matrix update 搜索对象和根之间的所有父母以进行世界矩阵更新

      // 把object所有的父类添加到 parentCascade
      parent = object.parent;
      while (parent) {
        parentCascade.push(parent);
        parent = parent.parent;
      }

      for (i = 0, l = parentCascade.length; i < l; i++) {

        parent = parentCascade[i];

        if (parent.matrixWorldNeedsUpdate === true) {
          parentUpdate = parent;
        }
      }

      // update world matrix starting at uppermost parent that needs update

      if (typeof parentUpdate !== 'undefined') {

        parentUpdate.updateMatrixWorld();

      }

    },

    /**
     * 搜索OctreeNode，organizeByObject控制是否对结果进行去重
     * @param position ：射线的原点坐标
     * @param radius：搜索半径
     * @param organizeByObject true
     * @param direction: 射线的方向
     * @returns {*}
     */
    search: function (position, radius, organizeByObject, direction) {

      var i, l,
        objects, // 包含 OctreeNode实例对象的数组
        objectData, // OctreeNode实例对象
        node,
        object, // OctreeNode实例对象中的object
        results, // 包含resultData的数组，返回值
        resultData, // 包含object、faces、vertices的对象
        resultsObjectsIndices, // 保存OctreeNode实例对象中的object的数组
        resultObjectIndex, // resultsObjectsIndices的下标
        directionPct; // direction的每个分量取倒数

      // add root objects
      objects = [].concat(this.root.objects);

      // ensure radius (i.e. distance of ray) is a number 确保半径（即射线距离）是一个数字
      if (!(radius > 0)) {
        radius = Number.MAX_VALUE;
      }

      // if direction passed, normalize and find pct 如果方向通过，规范化并找到pct
      if (direction instanceof THREE.Vector3) {
        direction = this.utilVec31Search.copy(direction).normalize();
        directionPct = this.utilVec32Search.set(1, 1, 1).divide(direction);
      }

      // search each node of root
      for (i = 0, l = this.root.nodesIndices.length; i < l; i++) {
        node = this.root.nodesByIndex[this.root.nodesIndices[i]];
        objects = node.search(position, radius, objects, direction, directionPct);
      }

      // if should organize results by object
      if (organizeByObject === true) {

        results = []; // 存放objectData
        resultsObjectsIndices = []; // 存放object

        // for each object data found
        for (i = 0, l = objects.length; i < l; i++) {

          objectData = objects[i];
          object = objectData.object;

          // 数组的下标
          resultObjectIndex = indexOfValue(resultsObjectsIndices, object);

          // if needed, create new result data
          if (resultObjectIndex === -1) {
            resultData = {
              object: object,
              faces: [],
              vertices: []
            };
            results.push(resultData);
            resultsObjectsIndices.push(object);
          } else {
            resultData = results[resultObjectIndex];
          }

          // object data has faces or vertices, add to list
          if (objectData.faces) {
            resultData.faces.push(objectData.faces);
          } else if (objectData.vertices) {
            resultData.vertices.push(objectData.vertices);
          }
        }
      } else {
        results = objects;
      }
      return results;
    },

    /**
     * 设置树的根节点
     * @param root
     */
    setRoot: function (root) {

      if (root instanceof THREE.OctreeNode) {

        // store new root
        this.root = root;

        // update properties
        this.root.updateProperties();
      }
    },

    getDepthEnd: function () {

      return this.root.getDepthEnd();

    },

    getNodeCountEnd: function () {

      return this.root.getNodeCountEnd();

    },

    getObjectCountEnd: function () {

      return this.root.getObjectCountEnd();

    },

    toConsole: function () {

      this.root.toConsole();

    }

  };

  /*===================================================

  object data

  =====================================================*/

  /**
   * 保存网格对象的基本信息，包裹添加的网格对象
   * 初始化时，根据对象计算位置和半径
   * @param object：要保存的mesh对象
   * @param part
   * @constructor
   */
  THREE.OctreeObjectData = function (object, part)  {

    /*
     * this.node : 树中根节点 Octree.root -> THREE.OctreeNode
     */

    // properties
    this.object = object; // 添加到树中的对象

    // handle part by type
    if (part instanceof THREE.Face3) {
      this.faces = part;
      this.face3 = true;
      this.utilVec31FaceBounds = new THREE.Vector3();
    } else if (part instanceof THREE.Vector3) {
      this.vertices = part;
    }

    this.radius = 0; // 几何体包围盒子的半径
    this.position = new THREE.Vector3(); // 几何体中心点在世界坐标系中的坐标

    // initial update
    if (this.object instanceof THREE.Object3D) {
      this.update();
    }

    // 最后更新对象数据位置
    this.positionLast = this.position.clone();
  };

  THREE.OctreeObjectData.prototype = {

    /**
     * 根据当前对象计算this.radius、this.position
     */
    update: function () {

      if (this.face3) {

        this.radius = this.getFace3BoundingRadius(this.object, this.faces);
        this.position.copy(this.faces.centroid).applyMatrix4(this.object.matrixWorld);

      } else if (this.vertices) {

        this.radius = this.object.material.size || 1;
        this.position.copy(this.vertices).applyMatrix4(this.object.matrixWorld);

      } else {

        if (this.object.geometry) {

          if (this.object.geometry.boundingSphere === null) {
            this.object.geometry.computeBoundingSphere();
          }

          this.radius = this.object.geometry.boundingSphere.radius;
          this.position.copy(this.object.geometry.boundingSphere.center).applyMatrix4(this.object.matrixWorld);

        } else {

          this.radius = this.object.boundRadius;
          this.position.setFromMatrixPosition(this.object.matrixWorld);

        }

      }

      this.radius = this.radius * Math.max(this.object.scale.x, this.object.scale.y, this.object.scale.z);

    },

    getFace3BoundingRadius: function (object, face) {

      if (face.centroid === undefined) face.centroid = new THREE.Vector3();

      var geometry = object.geometry || object,
        vertices = geometry.vertices,
        centroid = face.centroid,
        va = vertices[face.a], vb = vertices[face.b], vc = vertices[face.c],
        centroidToVert = this.utilVec31FaceBounds,
        radius;

      centroid.addVectors(va, vb).add(vc).divideScalar(3);
      radius = Math.max(centroidToVert.subVectors(centroid, va).length(), centroidToVert.subVectors(centroid, vb).length(), centroidToVert.subVectors(centroid, vc).length());

      return radius;

    }

  };

  /**
   * @param parameters {Object}
   *    tree: 当前节点所在的树
   *    position：基础方格的位置
   *    radius：基础方格的半径
   *    parent：
   *    indexOctant：几何体的在树中的索引
   * @constructor
   */
  THREE.OctreeNode = function (parameters) {

    /*
    * OctreeNode中的变量说明
    *   nodesIndices：保存indexOctant
    *   nodesByIndex：保存node的节点和索引
    *   objects：{Array}// 保存当前树节点上的 THREE.OctreeObjectData 实例对象
    */

    // utility
    this.utilVec31Branch = new THREE.Vector3();
    this.utilVec31Expand = new THREE.Vector3();
    this.utilVec31Ray = new THREE.Vector3();

    // handle parameters
    parameters = parameters || {};

    // store or create tree
    if (parameters.tree instanceof THREE.Octree) {
      this.tree = parameters.tree;
    } else if (parameters.parent instanceof THREE.OctreeNode !== true) {
      parameters.root = this;
      this.tree = new THREE.Octree(parameters);
    }

    // basic properties
    this.id = this.tree.nodeCount++;
    this.position = parameters.position instanceof THREE.Vector3 ? parameters.position : new THREE.Vector3(); // 基础方格的位置
    this.radius = parameters.radius > 0 ? parameters.radius : 1; // 基础方格的半径
    this.indexOctant = parameters.indexOctant; // 几何体的在树中的索引
    this.depth = 0;

    // 重置并分配父项
    this.reset();
    this.setParent(parameters.parent);

    // additional properties
    this.overlap = this.radius * this.tree.overlapPct; // 重叠
    this.radiusOverlap = this.radius + this.overlap; // 半径加重叠（收缩的半径）
    this.left = this.position.x - this.radiusOverlap;
    this.right = this.position.x + this.radiusOverlap;
    this.bottom = this.position.y - this.radiusOverlap;
    this.top = this.position.y + this.radiusOverlap;
    this.back = this.position.z - this.radiusOverlap;
    this.front = this.position.z + this.radiusOverlap;

    // visual
    if (this.tree.scene) {
      this.visual = new THREE.LineSegments(this.tree.visualGeometry, this.tree.visualMaterial);
      this.visual.scale.set(this.radiusOverlap * 2, this.radiusOverlap * 2, this.radiusOverlap * 2);
      this.visual.position.copy(this.position);
      this.tree.scene.add(this.visual);
    }
  };

  THREE.OctreeNode.prototype = {

    /**
     * 设置节点的父类，并更新父类的属性
     * @param parent
     */
    setParent: function (parent) {

      // store new parent
      if (parent !== this && this.parent !== parent) {

        this.parent = parent;
        // update properties
        this.updateProperties();
      }
    },

    /**
     * 根据父类的属性来设置当前对象以及他的子类的属性
     */
    updateProperties: function () {

      var i, l;

      // properties

      if (this.parent instanceof THREE.OctreeNode) {

        this.tree = this.parent.tree;
        this.depth = this.parent.depth + 1;

      } else {

        this.depth = 0;

      }

      // cascade

      for (i = 0, l = this.nodesIndices.length; i < l; i++) {

        this.nodesByIndex[this.nodesIndices[i]].updateProperties();

      }

    },

    /**
     * 初始化this.objects、this.nodesIndices、this.nodesByIndex
     * @param cascade
     * @param removeVisual
     */
    reset: function (cascade, removeVisual) {

      var i, l,
        node,
        nodesIndices = this.nodesIndices || [],
        nodesByIndex = this.nodesByIndex;

      this.objects = [];
      this.nodesIndices = [];
      this.nodesByIndex = {};

      // 未设父节点
      for (i = 0, l = nodesIndices.length; i < l; i++) {

        node = nodesByIndex[nodesIndices[i]];

        node.setParent(undefined);

        if (cascade === true) {

          node.reset(cascade, removeVisual);

        }
      }

      // 视觉
      if (removeVisual === true && this.visual && this.visual.parent) {

        this.visual.parent.remove(this.visual);

      }

    },

    /**
     *
     * @param node THREE.OctreeNode
     * @param indexOctant
     */
    addNode: function (node, indexOctant) {

      node.indexOctant = indexOctant;

      if (indexOfValue(this.nodesIndices, indexOctant) === -1) {

        this.nodesIndices.push(indexOctant);

      }

      this.nodesByIndex[indexOctant] = node;

      if (node.parent !== this) {

        node.setParent(this);

      }

    },

    removeNode: function (indexOctant) {

      var index,
        node;

      index = indexOfValue(this.nodesIndices, indexOctant);

      this.nodesIndices.splice(index, 1);

      node = node || this.nodesByIndex[indexOctant];

      delete this.nodesByIndex[indexOctant];

      if (node.parent === this) {

        node.setParent(undefined);

      }

    },

    /**
     * 把当前节点赋值给相应的OctreeObjectData实例对象的node上
     * @param object：THREE.OctreeObjectData 实例对象
     */
    addObject: function (object) {

      var index,
        indexOctant,
        node;

      // 获取对象八分区索引
      indexOctant = this.getOctantIndex(object);

      // 如果对象完全包含在八分区中，则添加到子树中
      if (indexOctant > -1 && this.nodesIndices.length > 0) {

        node = this.branch(indexOctant);

        node.addObject(object);

      } else if (indexOctant < -1 && this.parent instanceof THREE.OctreeNode) {

        // 如果对象位于边界之外，则添加到父节点
        this.parent.addObject(object);

      } else {

        // 添加到此对象列表
        index = indexOfValue(this.objects, object);
        if (index === -1) {
          this.objects.push(object);
        }

        // 节点引用
        object.node = this;

        // 检查是否需要展开，拆分或两者兼而有之
        this.checkGrow();
      }
    },

    addObjectWithoutCheck: function (objects) {

      var i, l,
        object;

      for (i = 0, l = objects.length; i < l; i++) {

        object = objects[i];

        this.objects.push(object);

        object.node = this;

      }

    },

    removeObject: function (object) {

      var i, l,
        nodesRemovedFrom,
        removeData;

      // cascade through tree to find and remove object

      removeData = this.removeObjectRecursive(object, {
        searchComplete: false,
        nodesRemovedFrom: [],
        objectsDataRemoved: []
      });

      // if object removed, try to shrink the nodes it was removed from

      nodesRemovedFrom = removeData.nodesRemovedFrom;

      if (nodesRemovedFrom.length > 0) {

        for (i = 0, l = nodesRemovedFrom.length; i < l; i++) {

          nodesRemovedFrom[i].shrink();

        }

      }

      return removeData.objectsDataRemoved;

    },

    removeObjectRecursive: function (object, removeData) {

      var i, l,
        index = -1,
        objectData,
        node,
        objectRemoved;

      // find index of object in objects list

      // search and remove object data (fast)
      if (object instanceof THREE.OctreeObjectData) {

        // remove from this objects list

        index = indexOfValue(this.objects, object);

        if (index !== -1) {

          this.objects.splice(index, 1);
          object.node = undefined;

          removeData.objectsDataRemoved.push(object);

          removeData.searchComplete = objectRemoved = true;

        }

      } else {

        // search each object data for object and remove (slow)

        for (i = this.objects.length - 1; i >= 0; i--) {

          objectData = this.objects[i];

          if (objectData.object === object) {

            this.objects.splice(i, 1);
            objectData.node = undefined;

            removeData.objectsDataRemoved.push(objectData);

            objectRemoved = true;

            if (!objectData.faces && !objectData.vertices) {

              removeData.searchComplete = true;
              break;

            }

          }

        }

      }

      // if object data removed and this is not on nodes removed from

      if (objectRemoved === true) {

        removeData.nodesRemovedFrom.push(this);

      }

      // if search not complete, search nodes

      if (removeData.searchComplete !== true) {

        for (i = 0, l = this.nodesIndices.length; i < l; i++) {

          node = this.nodesByIndex[this.nodesIndices[i]];

          // try removing object from node

          removeData = node.removeObjectRecursive(object, removeData);

          if (removeData.searchComplete === true) {

            break;

          }

        }

      }

      return removeData;

    },

    /**
     * 判断如果超过最大值，拆分树上的节点
     */
    checkGrow: function () {
      // if object count above max
      if (this.objects.length > this.tree.objectsThreshold && this.tree.objectsThreshold > 0) {
        this.grow();
      }
    },

    /**
     * 拆分树上的节点
     */
    grow: function () {

      var indexOctant,
        object,
        objectsExpand = [], // 保存位于半径之外的对象
        objectsExpandOctants = [], // 保存位于半径之外对象的索引
        objectsSplit = [],
        objectsSplitOctants = [],
        objectsRemaining = [],
        i, l;

      // 遍历当前树节点上的 THREE.OctreeObjectData 实例对象，并对网格在八分之一内、八分之一外、横跨八分之一等进行分别存储
      for (i = 0, l = this.objects.length; i < l; i++) {
        object = this.objects[i];

        // get object octant index
        indexOctant = this.getOctantIndex(object);

        if (indexOctant > -1) {

          // 如果在八分之一内
          objectsSplit.push(object);
          objectsSplitOctants.push(indexOctant);
        } else if (indexOctant < -1) {

          // 位于半径之外
          objectsExpand.push(object);
          objectsExpandOctants.push(indexOctant);
        } else {
          // 横跨八分之一的界限
          objectsRemaining.push(object);
        }
      }

      // if has objects to split
      if (objectsSplit.length > 0) {

        objectsRemaining = objectsRemaining.concat(this.split(objectsSplit, objectsSplitOctants));

      }

      // if has objects to expand
      if (objectsExpand.length > 0) {
        objectsRemaining = objectsRemaining.concat(this.expand(objectsExpand, objectsExpandOctants));
      }

      // store remaining
      this.objects = objectsRemaining;

      // merge check
      this.checkMerge();
    },

    split: function (objects, octants) {

      var i, l,
        indexOctant,
        object,
        node,
        objectsRemaining;

      // if not at max depth

      if (this.depth < this.tree.depthMax) {

        objects = objects || this.objects;

        octants = octants || [];

        objectsRemaining = [];

        // for each object

        for (i = 0, l = objects.length; i < l; i++) {

          object = objects[i];

          // get object octant index

          indexOctant = octants[i];

          // if object contained by octant, branch this tree

          if (indexOctant > -1) {

            node = this.branch(indexOctant);

            node.addObject(object);

          } else {

            objectsRemaining.push(object);

          }

        }

        // if all objects, set remaining as new objects

        if (objects === this.objects) {

          this.objects = objectsRemaining;

        }

      } else {

        objectsRemaining = this.objects;

      }

      return objectsRemaining;

    },

    branch: function (indexOctant) {

      var node,
        overlap,
        radius,
        radiusOffset,
        offset,
        position;

      // node exists

      if (this.nodesByIndex[indexOctant] instanceof THREE.OctreeNode) {

        node = this.nodesByIndex[indexOctant];

      } else {

        // properties

        radius = (this.radiusOverlap) * 0.5;
        overlap = radius * this.tree.overlapPct;
        radiusOffset = radius - overlap;
        offset = this.utilVec31Branch.set(indexOctant & 1 ? radiusOffset : -radiusOffset, indexOctant & 2 ? radiusOffset : -radiusOffset, indexOctant & 4 ? radiusOffset : -radiusOffset);
        position = new THREE.Vector3().addVectors(this.position, offset);

        // node

        node = new THREE.OctreeNode({
          tree: this.tree,
          parent: this,
          position: position,
          radius: radius,
          indexOctant: indexOctant
        });

        // store

        this.addNode(node, indexOctant);

      }

      return node;

    },

    /**
     *
     * @param objects{Array}：包含THREE.OctreeObjectData对象
     * @param octants{Array}：包含THREE.OctreeObjectData对象索引值
     * @returns {*}
     */
    expand: function (objects, octants) {

      var i, l,
        object,
        objectsRemaining,
        objectsExpand,
        indexOctant,
        flagsOutside,
        indexOutside,
        indexOctantInverse,
        iom = this.tree.INDEX_OUTSIDE_MAP,
        indexOutsideCounts,
        infoIndexOutside1,
        infoIndexOutside2,
        infoIndexOutside3,
        indexOutsideBitwise1,
        indexOutsideBitwise2,
        infoPotential1,
        infoPotential2,
        infoPotential3,
        indexPotentialBitwise1,
        indexPotentialBitwise2,
        octantX, octantY, octantZ,
        overlap,
        radius,
        radiusOffset,
        radiusParent,
        overlapParent,
        offset = this.utilVec31Expand,
        position,
        parent;

      // handle max depth down tree

      if (this.tree.root.getDepthEnd() < this.tree.depthMax) {

        objects = objects || this.objects;
        octants = octants || [];

        objectsRemaining = [];
        objectsExpand = [];

        // 重置计数
        for (i = 0, l = iom.length; i < l; i++) {
          iom[i].count = 0;
        }

        // 对于所有外部对象，找到包含大多数对象的外部八分圆，找到xyz六个位置中包含的个数
        for (i = 0, l = objects.length; i < l; i++) {

          object = objects[i];

          // get object octant index
          indexOctant = octants[i];

          // 如果在此之外的对象包含在计算中
          if (indexOctant < -1) {

            // 将八分度索引转换为外部标志（添加时计算的值，没有减去 this.tree.INDEX_OUTSIDE_OFFSET）
            flagsOutside = -indexOctant - this.tree.INDEX_OUTSIDE_OFFSET;

            // 检查按位标志
            // x
            if (flagsOutside & this.tree.FLAG_POS_X) {
              iom[this.tree.INDEX_OUTSIDE_POS_X].count++;
            } else if (flagsOutside & this.tree.FLAG_NEG_X) {
              iom[this.tree.INDEX_OUTSIDE_NEG_X].count++;
            }

            // y
            if (flagsOutside & this.tree.FLAG_POS_Y) {
              iom[this.tree.INDEX_OUTSIDE_POS_Y].count++;
            } else if (flagsOutside & this.tree.FLAG_NEG_Y) {
              iom[this.tree.INDEX_OUTSIDE_NEG_Y].count++;
            }

            // z
            if (flagsOutside & this.tree.FLAG_POS_Z) {
              iom[this.tree.INDEX_OUTSIDE_POS_Z].count++;
            } else if (flagsOutside & this.tree.FLAG_NEG_Z) {
              iom[this.tree.INDEX_OUTSIDE_NEG_Z].count++;
            }

            // store in expand list
            objectsExpand.push(object);
          } else {
            objectsRemaining.push(object);
          }
        }

        // if objects to expand
        if (objectsExpand.length > 0) {

          // 浅拷贝索引外部地图
          indexOutsideCounts = iom.slice(0);

          // sort outside index count so highest is first
          indexOutsideCounts.sort(function (a, b) {
            return b.count - a.count;
          });

          // 获得最高的外部指数
          // first is first
          infoIndexOutside1 = indexOutsideCounts[0];
          indexOutsideBitwise1 = infoIndexOutside1.index | 1;

          // 第二个是（后两个按位OR 1中的一个），与（第一个按位OR 1）不相反，
          infoPotential1 = indexOutsideCounts[1];
          infoPotential2 = indexOutsideCounts[2];

          infoIndexOutside2 = (infoPotential1.index | 1) !== indexOutsideBitwise1 ? infoPotential1 : infoPotential2;
          indexOutsideBitwise2 = infoIndexOutside2.index | 1;

          // 第三个是（下三个OR 1中的一个），与（第一个或第二个按位OR 1）不相反
          infoPotential1 = indexOutsideCounts[2];
          infoPotential2 = indexOutsideCounts[3];
          infoPotential3 = indexOutsideCounts[4];

          indexPotentialBitwise1 = infoPotential1.index | 1;
          indexPotentialBitwise2 = infoPotential2.index | 1;

          infoIndexOutside3 = indexPotentialBitwise1 !== indexOutsideBitwise1 && indexPotentialBitwise1 !== indexOutsideBitwise2 ? infoPotential1 : indexPotentialBitwise2 !== indexOutsideBitwise1 && indexPotentialBitwise2 !== indexOutsideBitwise2 ? infoPotential2 : infoPotential3;

          // 基于外部八分圆指数得到这个八分圆法线
          octantX = infoIndexOutside1.x + infoIndexOutside2.x + infoIndexOutside3.x;
          octantY = infoIndexOutside1.y + infoIndexOutside2.y + infoIndexOutside3.y;
          octantZ = infoIndexOutside1.z + infoIndexOutside2.z + infoIndexOutside3.z;

          // 根据八分法正常得到这个八分圆指标
          indexOctant = this.getOctantIndexFromPosition(octantX, octantY, octantZ);
          indexOctantInverse = this.getOctantIndexFromPosition(-octantX, -octantY, -octantZ);

          // properties
          overlap = this.overlap;
          radius = this.radius;

          // 父母的半径来自反转此重叠，除非重叠百分比为0
          radiusParent = this.tree.overlapPct > 0 ? overlap / ((0.5 * this.tree.overlapPct) * (1 + this.tree.overlapPct)) : radius * 2;
          overlapParent = radiusParent * this.tree.overlapPct;

          // 父亲偏移是父母与孩子的半径+重叠之间的差异
          radiusOffset = (radiusParent + overlapParent) - (radius + overlap);
          offset.set(indexOctant & 1 ? radiusOffset : -radiusOffset, indexOctant & 2 ? radiusOffset : -radiusOffset, indexOctant & 4 ? radiusOffset : -radiusOffset);
          position = new THREE.Vector3().addVectors(this.position, offset);

          // parent
          parent = new THREE.OctreeNode({
            tree: this.tree,
            position: position,
            radius: radiusParent
          });

          // 设置self为父节点
          parent.addNode(this, indexOctantInverse);

          // set parent as root
          this.tree.setRoot(parent);

          // add all expand objects to parent
          for (i = 0, l = objectsExpand.length; i < l; i++) {
            this.tree.root.addObject(objectsExpand[i]);
          }
        }

        // if all objects, set remaining as new objects
        if (objects === this.objects) {
          this.objects = objectsRemaining;
        }
      } else {
        objectsRemaining = objects;
      }
      return objectsRemaining;
    },

    shrink: function () {

      // merge check

      this.checkMerge();

      // contract check

      this.tree.root.checkContract();

    },

    checkMerge: function () {

      var nodeParent = this,
        nodeMerge;

      // traverse up tree as long as node + entire subtree's object count is under minimum

      while (nodeParent.parent instanceof THREE.OctreeNode && nodeParent.getObjectCountEnd() < this.tree.objectsThreshold) {

        nodeMerge = nodeParent;
        nodeParent = nodeParent.parent;

      }

      // if parent node is not this, merge entire subtree into merge node

      if (nodeParent !== this) {

        nodeParent.merge(nodeMerge);

      }

    },

    merge: function (nodes) {

      var i, l,
        j, k,
        node;

      // handle nodes

      nodes = toArray(nodes);

      for (i = 0, l = nodes.length; i < l; i++) {

        node = nodes[i];

        // gather node + all subtree objects

        this.addObjectWithoutCheck(node.getObjectsEnd());

        // reset node + entire subtree

        node.reset(true, true);

        // remove node

        this.removeNode(node.indexOctant, node);

      }

      // merge check

      this.checkMerge();

    },

    checkContract: function () {

      var i, l,
        node,
        nodeObjectsCount,
        nodeHeaviest,
        nodeHeaviestObjectsCount,
        outsideHeaviestObjectsCount;

      // find node with highest object count

      if (this.nodesIndices.length > 0) {

        nodeHeaviestObjectsCount = 0;
        outsideHeaviestObjectsCount = this.objects.length;

        for (i = 0, l = this.nodesIndices.length; i < l; i++) {

          node = this.nodesByIndex[this.nodesIndices[i]];

          nodeObjectsCount = node.getObjectCountEnd();
          outsideHeaviestObjectsCount += nodeObjectsCount;

          if (nodeHeaviest instanceof THREE.OctreeNode === false || nodeObjectsCount > nodeHeaviestObjectsCount) {

            nodeHeaviest = node;
            nodeHeaviestObjectsCount = nodeObjectsCount;

          }

        }

        // subtract heaviest count from outside count

        outsideHeaviestObjectsCount -= nodeHeaviestObjectsCount;

        // if should contract

        if (outsideHeaviestObjectsCount < this.tree.objectsThreshold && nodeHeaviest instanceof THREE.OctreeNode) {

          this.contract(nodeHeaviest);

        }

      }

    },

    contract: function (nodeRoot) {

      var i, l,
        node;

      // handle all nodes

      for (i = 0, l = this.nodesIndices.length; i < l; i++) {

        node = this.nodesByIndex[this.nodesIndices[i]];

        // if node is not new root

        if (node !== nodeRoot) {

          // add node + all subtree objects to root

          nodeRoot.addObjectWithoutCheck(node.getObjectsEnd());

          // reset node + entire subtree

          node.reset(true, true);

        }

      }

      // add own objects to root

      nodeRoot.addObjectWithoutCheck(this.objects);

      // reset self

      this.reset(false, true);

      // set new root

      this.tree.setRoot(nodeRoot);

      // contract check on new root

      nodeRoot.checkContract();

    },

    /**
     * 以基础方格为基点，求出当前几何体相对与基点的x\y\z的相对位置（把各个位置的表示的数值相加，得到几何体在树中的索引）
     * @param objectData THREE.OctreeObjectData 实例对象
     * @returns {*}
     */
    getOctantIndex: function (objectData) {

      var i, l,
        positionObj, // 对象的中心点世界坐标
        radiusObj, // 对象的半径
        position = this.position, // 基础方格的位置
        radiusOverlap = this.radiusOverlap, // 基础方格的半径
        overlap = this.overlap, // 重叠值
        deltaX, deltaY, deltaZ,
        distX, distY, distZ,
        distance,
        indexOctant = 0;

      // handle type
      if (objectData instanceof THREE.OctreeObjectData) {
        radiusObj = objectData.radius;
        positionObj = objectData.position;

        // 最后更新对象数据位置
        objectData.positionLast.copy(positionObj);
      } else if (objectData instanceof THREE.OctreeNode) {

        positionObj = objectData.position;

        radiusObj = 0;

      }

      // 当前对象的位置减去基点坐标的位置
      deltaX = positionObj.x - position.x;
      deltaY = positionObj.y - position.y;
      deltaZ = positionObj.z - position.z;

      // 获取绝对值（当前对象中心到基点方格的中心距离）
      distX = Math.abs(deltaX);
      distY = Math.abs(deltaY);
      distZ = Math.abs(deltaZ);
      // 对象到基点在3个坐标轴上最远的距离
      distance = Math.max(distX, distY, distZ);

      // 如果在外面，则使用按位标志来指示对象在哪个侧面之外
      if (distance + radiusObj > radiusOverlap) {
        // x
        if (distX + radiusObj > radiusOverlap) {
          // ^ 异或运算
          indexOctant = indexOctant ^ (deltaX > 0 ? this.tree.FLAG_POS_X : this.tree.FLAG_NEG_X);
        }
        // y
        if (distY + radiusObj > radiusOverlap) {
          indexOctant = indexOctant ^ (deltaY > 0 ? this.tree.FLAG_POS_Y : this.tree.FLAG_NEG_Y);
        }

        // z
        if (distZ + radiusObj > radiusOverlap) {
          indexOctant = indexOctant ^ (deltaZ > 0 ? this.tree.FLAG_POS_Z : this.tree.FLAG_NEG_Z);
        }
        objectData.indexOctant = -indexOctant - this.tree.INDEX_OUTSIDE_OFFSET;
        return objectData.indexOctant;
      }

      // return octant index from delta xyz

      if (deltaX - radiusObj > -overlap) {

        // x right

        indexOctant = indexOctant | 1;

      } else if (!(deltaX + radiusObj < overlap)) {

        // x left

        objectData.indexOctant = this.tree.INDEX_INSIDE_CROSS;
        return objectData.indexOctant;

      }

      if (deltaY - radiusObj > -overlap) {

        // y right

        indexOctant = indexOctant | 2;

      } else if (!(deltaY + radiusObj < overlap)) {

        // y left

        objectData.indexOctant = this.tree.INDEX_INSIDE_CROSS;
        return objectData.indexOctant;

      }


      if (deltaZ - radiusObj > -overlap) {

        // z right

        indexOctant = indexOctant | 4;

      } else if (!(deltaZ + radiusObj < overlap)) {

        // z left

        objectData.indexOctant = this.tree.INDEX_INSIDE_CROSS;
        return objectData.indexOctant;

      }

      objectData.indexOctant = indexOctant;
      return objectData.indexOctant;

    },

    /**
     * 根据坐标计算indexOctant
     * @param x
     * @param y
     * @param z
     * @returns {number}
     */
    getOctantIndexFromPosition: function (x, y, z) {

      var indexOctant = 0;

      if (x > 0) {

        indexOctant = indexOctant | 1;

      }

      if (y > 0) {

        indexOctant = indexOctant | 2;

      }

      if (z > 0) {

        indexOctant = indexOctant | 4;

      }

      return indexOctant;

    },

    search: function (position, radius, objects, direction, directionPct) {

      var i, l,
        node,
        intersects;

      // test intersects by parameters

      if (direction) {

        intersects = this.intersectRay(position, direction, radius, directionPct);

      } else {

        intersects = this.intersectSphere(position, radius);

      }

      // if intersects

      if (intersects === true) {

        // gather objects

        objects = objects.concat(this.objects);

        // search subtree

        for (i = 0, l = this.nodesIndices.length; i < l; i++) {

          node = this.nodesByIndex[this.nodesIndices[i]];

          objects = node.search(position, radius, objects, direction);

        }

      }

      return objects;

    },

    intersectSphere: function (position, radius) {

      var distance = radius * radius,
        px = position.x,
        py = position.y,
        pz = position.z;

      if (px < this.left) {

        distance -= Math.pow(px - this.left, 2);

      } else if (px > this.right) {

        distance -= Math.pow(px - this.right, 2);

      }

      if (py < this.bottom) {

        distance -= Math.pow(py - this.bottom, 2);

      } else if (py > this.top) {

        distance -= Math.pow(py - this.top, 2);

      }

      if (pz < this.back) {

        distance -= Math.pow(pz - this.back, 2);

      } else if (pz > this.front) {

        distance -= Math.pow(pz - this.front, 2);

      }

      return distance >= 0;

    },

    intersectRay: function (origin, direction, distance, directionPct) {

      if (typeof directionPct === 'undefined') {

        directionPct = this.utilVec31Ray.set(1, 1, 1).divide(direction);

      }

      var t1 = (this.left - origin.x) * directionPct.x,
        t2 = (this.right - origin.x) * directionPct.x,
        t3 = (this.bottom - origin.y) * directionPct.y,
        t4 = (this.top - origin.y) * directionPct.y,
        t5 = (this.back - origin.z) * directionPct.z,
        t6 = (this.front - origin.z) * directionPct.z,
        tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6)),
        tmin;

      // ray would intersect in reverse direction, i.e. this is behind ray
      if (tmax < 0) {

        return false;

      }

      tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));

      // if tmin > tmax or tmin > ray distance, ray doesn't intersect AABB
      if (tmin > tmax || tmin > distance) {

        return false;

      }

      return true;

    },

    /**
     * 获取树的深度
     * @param depth
     * @returns {*} 树的深度
     */
    getDepthEnd: function (depth) {

      var i, l,
        node;

      if (this.nodesIndices.length > 0) {
        for (i = 0, l = this.nodesIndices.length; i < l; i++) {
          node = this.nodesByIndex[this.nodesIndices[i]];
          depth = node.getDepthEnd(depth);
        }
      } else {
        depth = !depth || this.depth > depth ? this.depth : depth;
      }
      return depth;
    },

    getNodeCountEnd: function () {

      return this.tree.root.getNodeCountRecursive() + 1;

    },

    getNodeCountRecursive: function () {

      var i, l,
        count = this.nodesIndices.length;

      for (i = 0, l = this.nodesIndices.length; i < l; i++) {

        count += this.nodesByIndex[this.nodesIndices[i]].getNodeCountRecursive();

      }

      return count;

    },

    getObjectsEnd: function (objects) {

      var i, l,
        node;

      objects = (objects || []).concat(this.objects);

      for (i = 0, l = this.nodesIndices.length; i < l; i++) {

        node = this.nodesByIndex[this.nodesIndices[i]];

        objects = node.getObjectsEnd(objects);

      }

      return objects;

    },

    getObjectCountEnd: function () {

      var i, l,
        count = this.objects.length;

      for (i = 0, l = this.nodesIndices.length; i < l; i++) {

        count += this.nodesByIndex[this.nodesIndices[i]].getObjectCountEnd();

      }

      return count;

    },

    getObjectCountStart: function () {

      var count = this.objects.length,
        parent = this.parent;

      while (parent instanceof THREE.OctreeNode) {

        count += parent.objects.length;
        parent = parent.parent;

      }

      return count;

    },

    toConsole: function (space) {

      var i, l,
        node,
        spaceAddition = '   ';

      space = typeof space === 'string' ? space : spaceAddition;

      console.log((this.parent ? space + ' octree NODE > ' : ' octree ROOT > '), this, ' // id: ', this.id, ' // indexOctant: ', this.indexOctant, ' // position: ', this.position.x, this.position.y, this.position.z, ' // radius: ', this.radius, ' // depth: ', this.depth);
      console.log((this.parent ? space + ' ' : ' '), '+ objects ( ', this.objects.length, ' ) ', this.objects);
      console.log((this.parent ? space + ' ' : ' '), '+ children ( ', this.nodesIndices.length, ' )', this.nodesIndices, this.nodesByIndex);

      for (i = 0, l = this.nodesIndices.length; i < l; i++) {

        node = this.nodesByIndex[this.nodesIndices[i]];

        node.toConsole(space + spaceAddition);

      }

    }

  };

  /*===================================================

  raycaster additional functionality

  =====================================================*/

  THREE.Raycaster.prototype.intersectOctreeObject = function (object, recursive) {

    var intersects,
      octreeObject,
      facesAll,
      facesSearch;

    if (object.object instanceof THREE.Object3D) {

      octreeObject = object;
      object = octreeObject.object;

      // temporarily replace object geometry's faces with octree object faces

      facesSearch = octreeObject.faces;
      facesAll = object.geometry.faces;

      if (facesSearch.length > 0) {

        object.geometry.faces = facesSearch;

      }

      // intersect

      intersects = this.intersectObject(object, recursive);

      // revert object geometry's faces

      if (facesSearch.length > 0) {

        object.geometry.faces = facesAll;

      }

    } else {

      intersects = this.intersectObject(object, recursive);

    }

    return intersects;

  };

  THREE.Raycaster.prototype.intersectOctreeObjects = function (objects, recursive) {

    var i, il,
      intersects = [];

    for (i = 0, il = objects.length; i < il; i++) {

      intersects = intersects.concat(this.intersectOctreeObject(objects[i], recursive));

    }

    return intersects;

  };

}(THREE));
