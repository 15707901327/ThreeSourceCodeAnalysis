(function (PGL) {
  /**
   * 创建场景类
   * @constructor
   */
  PGL.Scene3D = function () {

    this.container = document.getElementById("container"); // 挂载点
    this.doAnimate = false; // 循环执行
    this.useOverrideMaterial = true; //

    this.materialList = [];
    this.geometryList = [];
    this.geometrySize = new THREE.Vector3();
    this.mouse = new THREE.Vector2();

    this.pickingData = {};

    // create buffer for reading a single pixel
    this.pixelBuffer = new Uint8Array(4);

    this.singleMaterial = undefined;
    this.singlePickingMaterial = undefined;

    this.scale = 1.03;

    this.instanceCount = 0; // 实例的个数
    this.objectCount = 0; // 网格的数量

    this.method = "singleMaterial"; // 模式

    this.loader = new THREE.BufferGeometryLoader();
    this.highlightBox = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1), new THREE.MeshLambertMaterial({
      emissive: 0xffff00,
      transparent: true,
      opacity: 0.5
    }));
  };
  Object.assign(PGL.Scene3D.prototype, {
    /***************************** 初始化 *******************************/
    init: function () {

      this.renderer = this.initRender();
      this.pickingRenderTarget = this.initWebGLRenderTarget();
      this.camera = PGL.initPerspectiveCamera();
      this.controls = this.initTrackballControls();
      this.stats = this.initStats();

      this.initGUI();
      this.initMesh();

      var _this = this;
      if (this.doAnimate) animate();

      function animate() {

        if (_this.doAnimate) {
          requestAnimationFrame(animate);
        }
        _this.controls.update();
        _this.stats.update();
        _this.render();
      }

      this.animate = animate;

      window.addEventListener('resize', this.onWindowResize.bind(this), false);
      this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    },

    /**
     * 页面控制
     */
    initGUI: function () {
      var _this = this;
      var animateElm = document.getElementById('animate');
      this.doAnimate = animateElm.checked;
      animateElm.addEventListener("click", function () {
        _this.doAnimate = animateElm.checked;
        _this.animate();
      });

      // 构建模型的数目
      var instanceCountElm = document.getElementById('instanceCount');
      this.instanceCount = parseInt(instanceCountElm.value);
      instanceCountElm.addEventListener("change", function () {
        _this.instanceCount = parseInt(instanceCountElm.value);
        _this.initMesh();
      });

      // 构建的模式
      var methodElm = document.getElementById('method');
      this.method = methodElm.value;
      methodElm.addEventListener("change", function () {
        _this.method = methodElm.value;
        _this.initMesh();
      });

      //
      var overrideElm = document.getElementById('override');
      _this.useOverrideMaterial = overrideElm.checked;
      overrideElm.addEventListener("click", function () {
        _this.useOverrideMaterial = overrideElm.checked;
        _this.initMesh();
      });

      // 重新构建
      var constructElm = document.getElementById('construct');
      constructElm.addEventListener("click", function () {
        _this.initMesh();
      });
    },

    /**
     * 初始化渲染器
     * @return {*}
     */
    initRender: function () {
      var renderer = renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      });
      if (renderer.extensions.get('ANGLE_instanced_arrays') === null) {
        document.getElementById("notSupported").style.display = "";
        return;
      }
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      this.container.appendChild(renderer.domElement);
      if (renderer.extensions.get('ANGLE_instanced_arrays') === null) {
        throw 'ANGLE_instanced_arrays not supported';
      }
      return renderer;
    },

    /**
     * picking render target
     * @return {*}
     */
    initWebGLRenderTarget: function () {
      var pickingRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
      pickingRenderTarget.texture.generateMipmaps = false;
      pickingRenderTarget.texture.minFilter = THREE.NearestFilter;
      return pickingRenderTarget;
    },

    /**
     * 初始化场景
     * @return {*}
     */
    initScene: function () {
      var scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);
      return scene;
    },

    /**
     * 控制器
     * @return {THREE.TrackballControls}
     */
    initTrackballControls: function () {
      var controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
      controls.staticMoving = true;
      return controls;
    },

    // 灯光
    initLight: function () {
      this.scene.add(new THREE.AmbientLight(0xeeeeee));

      var light = new THREE.DirectionalLight(0x00ffff, 1);
      light.position.set(15, 20, 20);
      light.castShadow = true;

      // var helper = new THREE.DirectionalLightHelper(light, 10);
      // this.scene.add(helper);

      this.scene.add(light);
    },

    /**
     * 初始化
     * @return {*}
     */
    initStats: function () {
      var stats = new Stats();
      this.container.appendChild(stats.dom);
      return stats;
    },

    /**
     * 初始化射线检测
     */
    initRayControls: function () {
      var _this = this;
      var RayControls = new PGL.RayControls(this.camera, this.scene, {
        domElement: this.renderer.domElement
      });
      RayControls.selectObjectsCallBack = function (mesh) {
        if (!mesh) {
          return;
        }
        console.log("选中几何体：", mesh);

        _this.materialController.clickChangeColor([mesh], new THREE.Color(0xff0000), true);
      }
    },

    /**
     * 场景中添加几何体
     */
    initObject: function () {
    },

    initMesh: function () {

      this.clean();

      // make instances
      var _this = this;
      this.loader.load('../models/json/suzanne_buffergeometry.json', function (geo) {
        geo = geo.toNonIndexed();
        geo.computeBoundingBox();
        geo.boundingBox.getSize(_this.geometrySize);
        _this.geometryList.push(geo);

        var start = window.performance.now();

        switch (_this.method) {
          case "merged":
            _this.makeMerged(geo);
            break;
          case "instanced":
            _this.makeInstanced(geo);
            break;
          case "singleMaterial":
            _this.makeSingleMaterial(geo);
            break;
          case "multiMaterial":
            _this.makeMultiMaterial(geo);
            break;
        }

        _this.render();

        var end = window.performance.now();

        document.getElementById('materialCount').innerText = _this.materialList.length;
        document.getElementById('objectCount').innerText = _this.objectCount;
        document.getElementById('drawcalls').innerText = _this.renderer.info.render.calls;
        document.getElementById('initTime').innerText = (end - start).toFixed(2);

      });

    },

    /**
     * 清空几何体
     */
    clean: function () {

      THREE.Cache.clear();

      this.materialList.forEach(function (m) {
        m.dispose();
      });

      this.geometryList.forEach(function (g) {
        g.dispose();
      });

      this.scene = this.initScene();

      this.scene.add(this.camera);
      this.scene.add(this.highlightBox);

      this.pickingScene = new THREE.Scene();
      this.pickingData = {};
      this.materialList = [];
      this.geometryList = [];
      this.objectCount = 0;

      this.singleMaterial = undefined;
      this.singlePickingMaterial = undefined;
    },

    /**
     * 添加简单材质
     * @param{THREE.BufferGeometry} geo
     */
    makeSingleMaterial: function (geo) {

      // material
      var vert = document.getElementById('vertMaterial').textContent;
      var frag = document.getElementById('fragMaterial').textContent;

      var material = new THREE.RawShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          color: {
            value: new THREE.Color()
          }
        }
      });
      this.materialList.push(material);

      var pickingMaterial = new THREE.RawShaderMaterial({
        vertexShader: "#define PICKING\n" + vert,
        fragmentShader: "#define PICKING\n" + frag,
        uniforms: {
          pickingColor: {
            value: new THREE.Color()
          }
        }
      });
      this.materialList.push(pickingMaterial);

      if (this.useOverrideMaterial) {
        this.singleMaterial = material;
        this.singlePickingMaterial = pickingMaterial;
      }

      // geometry / mesh
      var matrix = new THREE.Matrix4();

      function onBeforeRender(renderer, scene, camera, geometry, material) {

        var updateList = [];
        var u = material.uniforms;
        var d = this.userData;

        if (u.pickingColor) {
          u.pickingColor.value.setHex(d.pickingColor);
          updateList.push("pickingColor");
        }

        if (u.color) {
          u.color.value.setHex(d.color);
          updateList.push("color");
        }

        if (updateList.length) {

          var materialProperties = renderer.properties.get(material);

          if (materialProperties.program) {

            var gl = renderer.getContext();
            var p = materialProperties.program;
            gl.useProgram(p.program);
            var pu = p.getUniforms();

            updateList.forEach(function (name) {
              pu.setValue(gl, name, u[name].value);
            });
          }
        }
      }

      for (var i = 0; i < this.instanceCount; i++) {

        var object = new THREE.Mesh(geo, material);
        this.objectCount++;
        PGL.Matrix.randomizeMatrix(matrix);
        object.applyMatrix(matrix);

        var pickingObject;
        if (!this.useOverrideMaterial) {
          pickingObject = object.clone();
          this.objectCount++;
        }

        object.material = material;
        object.userData["color"] = Math.random() * 0xffffff;

        if (this.useOverrideMaterial) {
          object.userData["pickingColor"] = i + 1;
          object.onBeforeRender = onBeforeRender;
        } else {
          pickingObject.material = pickingMaterial;
          pickingObject.userData["pickingColor"] = i + 1;
          pickingObject.onBeforeRender = onBeforeRender;
        }

        this.pickingData[i + 1] = object;

        this.scene.add(object);
        if (!this.useOverrideMaterial) this.pickingScene.add(pickingObject);
      }
    },

    /**
     * 几何体没有clone 材质clone
     * @param{THREE.BufferGeometry} geo
     */
    makeMultiMaterial: function (geo) {

      // material
      var vert = document.getElementById('vertMaterial').textContent;
      var frag = document.getElementById('fragMaterial').textContent;

      var material = new THREE.RawShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          color: {
            value: new THREE.Color()
          }
        }
      });

      var pickingMaterial = new THREE.RawShaderMaterial({
        vertexShader: "#define PICKING\n" + vert,
        fragmentShader: "#define PICKING\n" + frag,
        uniforms: {
          pickingColor: {
            value: new THREE.Color()
          }
        }
      });

      // geometry / mesh
      var matrix = new THREE.Matrix4();

      for (var i = 0; i < this.instanceCount; i++) {

        var object = new THREE.Mesh(geo, material);
        this.objectCount++;
        PGL.Matrix.randomizeMatrix(matrix);
        object.applyMatrix(matrix);

        var pickingObject = object.clone();
        this.objectCount++;

        object.material = material.clone();
        object.material.uniforms.color.value.setHex(Math.random() * 0xffffff);
        this.materialList.push(object.material);

        pickingObject.material = pickingMaterial.clone();
        pickingObject.material.uniforms.pickingColor.value.setHex(i + 1);
        this.materialList.push(pickingObject.material);

        this.pickingData[i + 1] = object;

        this.scene.add(object);
        this.pickingScene.add(pickingObject);
      }

      material.dispose();
      pickingMaterial.dispose();
    },

    /**
     * 一个顶点信息，根据矩阵显示多个物体，最终只有一个mesh
     * @param{THREE.BufferGeometry} geo
     */
    makeInstanced: function (geo) {
      var i, ul;

      // material
      var vert = document.getElementById('vertInstanced').textContent;
      var frag = document.getElementById('fragInstanced').textContent;

      var material = new THREE.RawShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag
      });
      this.materialList.push(material);

      var pickingMaterial = new THREE.RawShaderMaterial({
        vertexShader: "#define PICKING\n" + vert,
        fragmentShader: "#define PICKING\n" + frag
      });
      this.materialList.push(pickingMaterial);

      // geometry
      var igeo = new THREE.InstancedBufferGeometry();
      this.geometryList.push(igeo);

      // 设置顶点
      var vertices = geo.attributes.position.clone();
      igeo.addAttribute('position', vertices);

      // 设置矩阵
      var mcol0 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
      var mcol1 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
      var mcol2 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
      var mcol3 = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);

      var matrix = new THREE.Matrix4();
      var me = matrix.elements;

      for (i = 0, ul = mcol0.count; i < ul; i++) {

        PGL.Matrix.randomizeMatrix(matrix);
        var object = new THREE.Object3D();
        this.objectCount++;

        object.applyMatrix(matrix);
        this.pickingData[i + 1] = object;

        mcol0.setXYZ(i, me[0], me[1], me[2]);
        mcol1.setXYZ(i, me[4], me[5], me[6]);
        mcol2.setXYZ(i, me[8], me[9], me[10]);
        mcol3.setXYZ(i, me[12], me[13], me[14]);
      }

      igeo.addAttribute('mcol0', mcol0);
      igeo.addAttribute('mcol1', mcol1);
      igeo.addAttribute('mcol2', mcol2);
      igeo.addAttribute('mcol3', mcol3);

      // 设置颜色
      var randCol = function () {
        return Math.random();
      };
      var colors = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
      for (i = 0, ul = colors.count; i < ul; i++) {
        colors.setXYZ(i, randCol(), randCol(), randCol());
      }
      igeo.addAttribute('color', colors);

      // 设置颜色
      var col = new THREE.Color();
      var pickingColors = new THREE.InstancedBufferAttribute(new Float32Array(this.instanceCount * 3), 3);
      for (i = 0, ul = pickingColors.count; i < ul; i++) {
        col.setHex(i + 1);
        pickingColors.setXYZ(i, col.r, col.g, col.b);
      }
      igeo.addAttribute('pickingColor', pickingColors);

      // mesh
      var mesh = new THREE.Mesh(igeo, material);
      this.scene.add(mesh);

      var pickingMesh = new THREE.Mesh(igeo, pickingMaterial);
      this.pickingScene.add(pickingMesh);
    },

    /**
     * 合并BufferGeometry使用同一个材质
     * @param{THREE.BufferGeometry} geo
     */
    makeMerged: function (geo) {
      var i, ul;
      var j, jl;

      // material
      var vert = document.getElementById('vertMerged').textContent;
      var frag = document.getElementById('fragMerged').textContent;

      var material = new THREE.RawShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag
      });
      this.materialList.push(material);

      var pickingMaterial = new THREE.RawShaderMaterial({
        vertexShader: "#define PICKING\n" + vert,
        fragmentShader: "#define PICKING\n" + frag
      });
      this.materialList.push(pickingMaterial);

      // geometry
      var mgeo = new THREE.BufferGeometry();
      this.geometryList.push(mgeo);

      var pos = geo.attributes.position; // 点的位置
      var posLen = geo.attributes.position.count * 3; // 位置数组的大小
      var vertices = new THREE.BufferAttribute(new Float32Array(this.instanceCount * posLen), 3); // 生成点的集合

      var vertex = new THREE.Vector3();
      var matrix = new THREE.Matrix4();

      // 设置顶点
      for (i = 0, ul = this.instanceCount; i < ul; i++) {

        var offset = i * posLen;

        PGL.Matrix.randomizeMatrix(matrix);

        var object = new THREE.Object3D();
        this.objectCount++;
        object.applyMatrix(matrix);
        this.pickingData[i + 1] = object;

        vertices.set(pos.array, offset);

        for (var k = 0, l = offset; k < posLen; k += 3, l += 3) {
          vertex.fromArray(vertices.array, l);
          vertex.applyMatrix4(matrix);
          vertex.toArray(vertices.array, l);
        }
      }
      mgeo.addAttribute('position', vertices);

      // 设置顶点颜色
      var colCount = posLen / 3; // 点的个数
      var colors = new THREE.BufferAttribute(new Float32Array(this.instanceCount * colCount * 3), 3);
      var randCol = function () {
        return Math.random();
      };
      for (i = 0, ul = this.instanceCount; i < ul; i++) {
        var r = randCol(), g = randCol(), b = randCol();
        for (j = i * colCount, jl = (i + 1) * colCount; j < jl; j++) {
          colors.setXYZ(j, r, g, b);
        }
      }
      mgeo.addAttribute('color', colors);

      // 设置顶点选中颜色
      var col = new THREE.Color();
      var pickingColors = new THREE.BufferAttribute(new Float32Array(this.instanceCount * colCount * 3), 3);
      for (i = 0, ul = this.instanceCount; i < ul; i++) {
        col.setHex(i + 1);
        for (j = i * colCount, jl = (i + 1) * colCount; j < jl; j++) {
          pickingColors.setXYZ(j, col.r, col.g, col.b);
        }
      }
      mgeo.addAttribute('pickingColor', pickingColors);

      // mesh
      var mesh = new THREE.Mesh(mgeo, material);
      this.scene.add(mesh);

      var pickingMesh = new THREE.Mesh(mgeo, pickingMaterial);
      this.pickingScene.add(pickingMesh);
    },

    pick: function () {

      // render the picking scene off-screen
      this.highlightBox.visible = false;

      if (this.singlePickingMaterial) {
        this.scene.overrideMaterial = this.singlePickingMaterial;
        this.renderer.render(this.scene, this.camera, this.pickingRenderTarget);
        this.scene.overrideMaterial = null;
      } else {
        this.renderer.render(this.pickingScene, this.camera, this.pickingRenderTarget);
      }

      // read the pixel under the mouse from the texture
      this.renderer.readRenderTargetPixels(
        this.pickingRenderTarget,
        this.mouse.x,
        this.pickingRenderTarget.height - this.mouse.y,
        1,
        1,
        this.pixelBuffer
      );

      // interpret the pixel as an ID
      var id = (this.pixelBuffer[0] << 16) | (this.pixelBuffer[1] << 8) | (this.pixelBuffer[2]);

      var object = this.pickingData[id];
      if (object) {
        // move the highlightBox so that it surrounds the picked object
        if (object.position && object.rotation && object.scale) {
          this.highlightBox.position.copy(object.position);
          this.highlightBox.rotation.copy(object.rotation);

          this.highlightBox.scale.copy(object.scale)
            .multiply(this.geometrySize)
            .multiplyScalar(this.scale);

          this.highlightBox.visible = true;
        }
      } else {
        this.highlightBox.visible = false;
      }
    },

    /**
     * 渲染调用
     */
    render: function () {
      this.pick();
      this.renderer.render(this.scene, this.camera);
    },

    /***************************** 事件 *******************************/
    onWindowResize: function () {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.pickingRenderTarget.setSize(window.innerWidth, window.innerHeight);
    },

    onMouseMove: function (e) {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.controls.update();
      requestAnimationFrame(this.render.bind(this));
    }
  });
})(PGL);