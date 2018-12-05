var PGL = PGL || {};

// 初始化
(function (PGL) {
  /**
   * 初始化渲染器
   * @return {*}
   */
  PGL.initRender = function () {
    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 默认的是，没有设置的这个清晰 THREE.PCFShadowMap
    return renderer;
  };
  /**
   * 初始化场景
   * @return {*}
   */
  PGL.initScene = function () {
    var scene = new THREE.Scene();
    return scene;
  };
  PGL.initPerspectiveCamera = function () {
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 40, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    return camera;
  };
  /**
   * 初始化OrbitControls控制器
   * @param camera 相机
   * @param renderer 渲染器
   * @return {THREE.OrbitControls}
   */
  PGL.initOrbitControls = function (camera, renderer) {
    var controls = new THREE.OrbitControls(camera, renderer.domElement);

    // 如果使用animate方法时，将此函数删除
    //controls.addEventListener( 'change', render );
    // 使动画循环使用时阻尼或自转 意思是否有惯性
    controls.enableDamping = true;
    //动态阻尼系数 就是鼠标拖拽旋转灵敏度
    //controls.dampingFactor = 0.25;
    //是否可以缩放
    controls.enableZoom = true;
    //是否自动旋转
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    //设置相机距离原点的最近距离
    controls.minDistance = 10;
    //设置相机距离原点的最远距离
    controls.maxDistance = 500;
    //是否开启右键拖拽
    controls.enablePan = true;

    return controls;
  };
  /**
   * 添加灯光
   * @param scene 场景
   */
  PGL.initLight = function (scene) {
    scene.add(new THREE.AmbientLight(0x444444));

    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(15, 50, 10);

    light.castShadow = true;

    scene.add(light);
  };
})(PGL);