(function (PGL) {
  /**
   * 创建场景类
   * @constructor
   */
  PGL.Scene3D = function () {
  };
  Object.assign(PGL.Scene3D.prototype, {
    /***************************** 初始化 *******************************/
    init: function () {
      this.renderer = PGL.initRender();
      document.body.appendChild(this.renderer.domElement);

      this.scene = PGL.initScene();
      var axesHelper = new THREE.AxesHelper(500);
      this.scene.add(axesHelper);

      this.camera = PGL.initPerspectiveCamera();
      this.initLight(this.scene);
      this.controls = PGL.initOrbitControls(this.camera, this.renderer);

      this.initObject();

      this.stats = this.initStats();
      this.materialController = new PGL.MaterialController(); // 初始化切换材质
      this.initRayControls();

      window.onresize = this.onWindowResize.bind(this);

      var _this = this;
      animate();

      function animate() {
        _this.render();
        requestAnimationFrame(animate);
      }
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
      document.body.appendChild(stats.dom);
      return stats;
    },

    /**
     * 场景中添加几何体
     */
    initObject: function () {
      var i;

      var planeGeometry = new THREE.PlaneGeometry(500, 500, 32);
      var meshBasicMaterial = new THREE.MeshLambertMaterial({color: 0xffff00, side: THREE.DoubleSide});
      var plane = new THREE.Mesh(planeGeometry, meshBasicMaterial);
      plane.receiveShadow = true;
      plane.rotateX(Math.PI / 2);
      this.scene.add(plane);

      //创建材质数组和几何体数组
      var meshArr = [];
      var geometries = [];
      var materialArr = [];

      var geometry = new THREE.BoxBufferGeometry(10, 10, 10);
      var material = new THREE.MeshLambertMaterial({color: 0xffffff});
      // instantiate a loader
      var loader = new THREE.TextureLoader();
      loader.load('../textures/hardwood2_diffuse.jpg', function (texture) {
        material.map = texture;
        material.needsUpdate = true;
      });

      var cube = new THREE.Mesh(geometry, material);
      cube.position.set(5, 6, 5);
      cube.updateMatrix();
      // this.scene.add(cube);
      meshArr.push(cube);
      materialArr.push(cube.material);
      geometries.push(cube.geometry);

      var geometry2 = new THREE.BoxBufferGeometry(10, 10, 10);
      var material2 = new THREE.MeshLambertMaterial({color: 0x0000cc});
      var cube2 = new THREE.Mesh(geometry2, material);
      cube2.position.set(5, 6, 15);
      this.scene.add(cube2);
      meshArr.push(cube2);
      materialArr.push(cube2.material);
      geometries.push(cube2.geometry);

      // var mgeo = new THREE.BoxBufferGeometry();
      //
      // var verticesLength = 0; // 点数组的长度
      // for(i = 0; i < meshArr.length;i++){
      //   verticesLength += meshArr[i].geometry.attributes.position.count * 3;
      // }
      // var vertices = new THREE.BufferAttribute(new Float32Array(verticesLength), 3); // 生成点的集合
      //
      // var vertex = new THREE.Vector3();
      // var matrix = new THREE.Matrix4();
      //
      // // 设置位置点
      // var offset = 0;
      // for(i = 0; i < meshArr.length;i++){
      //   meshArr[i].updateMatrix();
      //   matrix = meshArr[i].matrix;
      //
      //   var posLen = meshArr[i].geometry.attributes.position.count * 3; // 位置数组的大小
      //   var pos = meshArr[i].geometry.attributes.position; // 点的位置
      //   vertices.set(pos.array, offset);
      //
      //   for (var k = 0, l = offset; k < posLen; k += 3, l += 3) {
      //     vertex.fromArray(vertices.array, l);
      //     vertex.applyMatrix4(matrix);
      //     vertex.toArray(vertices.array, l);
      //   }
      //
      //   offset  += posLen;
      // }
      // mgeo.addAttribute('position', vertices);
      //
      // // mesh
      // var cube3 = new THREE.Mesh(mgeo, material);
      // cube3.castShadow = true;
      // this.scene.add(cube3);
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
     * 渲染调用
     */
    render: function () {
      this.stats.update();
      this.controls.update();

      this.renderer.render(this.scene, this.camera);
    },

    /***************************** 事件 *******************************/
    onWindowResize: function () {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.render();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  });
})(PGL);