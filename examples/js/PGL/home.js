var PGL = PGL || {};
/**
 * 场景初始化区
 */
(function (PGL) {
    /**
     *
     * @param config 加载配置文件
     * @param options
     *  container: 挂载点
     *  enabledClick：控制是否开启射线拾取 true
     *  enabledSkyBox: 开启天空盒子 true
     */
    PGL.scene3D = function (config, options) {
        this.config = config || {
            modelData: {}
        };
        this.options = options || {};

        this.container = options.container !== undefined ? options.container : document.getElementById("container");
        this.enabledClick = options.enabledClick !== undefined ? options.enabledClick : true;
        this.enabledSkyBox = options.enabledSkyBox !== undefined ? options.enabledSkyBox : true;
    };
    Object.assign(PGL.scene3D.prototype, {
        /**
         * 初始化场景
         */
        init: function () {
            var _this = this;

            this.initWebGLRenderer();
            this.initScene();
            this.initCamera();
            this.initLight();
            this.initOrbitControls();
            this.initStats();
            this.initObject();

            this.initEvent();
            animate();

            function animate() {
                requestAnimationFrame(animate);

                //更新控制器
                _this.orbitControls.update();
                _this.render();
                _this.stats.update();
            }

            // 天空盒子
            if (this.enabledSkyBox) {
                this.initSkyBox();
            }

            // 射线摄取
            this.rayControls = new PGL.RayControls(this.camera, this.scene, {
                domElement: this.webGLRenderer.domElement
            });
            this.rayControls.selectObjectsCallBack = function (mesh) {
                _this.selectObjectsCallBack(mesh);
            };
            this.rayControls.selectFirstObjectCallBack = function (object) {
                console.log(object);
            };
        },
        initWebGLRenderer: function () {
            this.webGLRenderer = new THREE.WebGLRenderer({
                antialias: true
            });
            this.webGLRenderer.setSize(this.getWidth(), this.getHeight());
            this.container.appendChild(this.webGLRenderer.domElement);
        },
        initScene: function () {
            this.scene = new THREE.Scene();
            // this.scene.fog = new THREE.Fog(0xffffff, 300, 1200);
            var axes = new THREE.AxesHelper(100);
            this.scene.add(axes);
        },
        initCamera: function () {
            this.camera = new THREE.PerspectiveCamera(45, this.getWidth() / this.getHeight(), 0.1, 30000);
            this.camera.position.set(0, 0, 10);
        },
        initLight: function () {
            var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);

            var light = new THREE.DirectionalLight(0xffffff, .6);
            light.position.set(-200, 200, 100);
            light.castShadow = true;
            this.scene.add(light);

            var SpotLight = new THREE.SpotLight(0xffffff, .6);
            SpotLight.castShadow = true;
            SpotLight.position.set(-200, 200, -200);
            SpotLight.shadow.mapSize.width = 4096;
            SpotLight.shadow.mapSize.height = 4096;
            this.scene.add(SpotLight);
        },
        initOrbitControls: function () {
            this.orbitControls = new THREE.OrbitControls(this.camera, this.webGLRenderer.domElement);
            // 如果使用animate方法时，将此函数删除
            //controls.addEventListener( 'change', render );
            // 使动画循环使用时阻尼或自转 意思是否有惯性
            this.orbitControls.enableDamping = false;
            //动态阻尼系数 就是鼠标拖拽旋转灵敏度
            this.orbitControls.dampingFactor = 0.5;
            //是否可以缩放
            this.orbitControls.enableZoom = true;
            //是否自动旋转
            this.orbitControls.autoRotate = false;
            //设置相机距离原点的最远距离
            this.orbitControls.minDistance = 1;
            //设置相机距离原点的最远距离
            this.orbitControls.maxDistance = 30000;
            //是否开启右键拖拽
            this.orbitControls.enablePan = true;
        },
        initStats: function () {
            this.stats = new Stats();
            this.container.appendChild(this.stats.dom);
        },
        render: function () {
            this.webGLRenderer.render(this.scene, this.camera);
        },
        initEvent: function () {
            var _onWindowResize = this._bind(this, this.onWindowResize);
            window.addEventListener("resize", _onWindowResize, false)
        },

        initObject: function () {
            // var bufferGeometry = new THREE.BufferGeometry();
            //
            // var positions = new Float32Array([0.0, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
            // bufferGeometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            //
            // var meshPhongMaterial = new THREE.MeshPhongMaterial({
            //     color: new THREE.Color(1, 0, 0)
            // });
            //
            // var mesh = new THREE.Mesh(bufferGeometry, meshPhongMaterial);
            // mesh.translateX(1);
            // mesh.translateZ(1);
            // this.scene.add(mesh);

            var arr = [
                [1595.4724409459159, 1041.732283463236, 3188.9763779527557],
                [1442.283464570064, 1061.4173228333239, 3188.9763779527557],
                [1439.7756082573906, 1041.9011850086972, 3188.9763779527557],
                [1326.8110236222856, 1056.417322838679, 3188.9763779527557],
                [1318.6644509895705, 993.0206945817918, 3188.9763779527557],
                [1201.850393700879, 1008.0314960742835, 3188.9763779527557],
                [1192.0066499132663, 926.5920583079569, 3188.9763779527557],
                [942.9527559056878, 957.9527559031267, 3188.9763779527557],
                [957.0816006031819, 1070.6826108763926, 3188.9763779527557],
                [1067.6771653569303, 1059.8031496151816, 3188.9763779527557],
                [1081.8110236222856, 1178.0708661398385, 3188.9763779527557],
                [1022.7742626913823, 1185.2520342373755, 3188.9763779527557],
                [559.09448818909, 1241.6535433139652, 3188.9763779527557],
                [576.1811023624614, 1371.889763794141, 3188.9763779527557],
                [537.8346456727013, 1377.677165364148, 3188.9763779527557],
                [554.9606299218722, 1513.6220472438727, 3188.9763779527557],
                [121.9685039371252, 1567.9133858340792, 3188.9763779527557],
                [73.83644800400361, 1199.0361214308068, 3188.9763779527557],
                [38.42519685160369, 1202.362204725854, 3188.9763779527557],
                [0.0, 901.6141732311808, 3188.9763779527557],
                [58.42519685253501, 892.5984252069611, 3188.9763779527557],
                [40.91911472566426, 753.1579855580349, 3188.9763779527557],
                [32.36220472631976, 685.0000000081491, 3188.9763779527557],
                [186.06299212714657, 661.9291338615585, 3188.9763779527557],
                [209.40486221201718, 817.4353809368331, 3188.9763779527557],
                [263.6614173245616, 809.2913385957945, 3188.9763779527557],
                [267.5196850411594, 836.0236220604274, 3188.9763779527557],
                [310.5665064752102, 830.7290009928402, 3188.9763779527557],
                [275.3937007873319, 544.7637795391493, 3188.9763779527557],
                [471.9291338613257, 520.5905511903111, 3188.9763779527557],
                [490.30254986835644, 669.9718096419238, 3188.9763779527557],
                [573.9370078779757, 659.6850393721834, 3188.9763779527557],
                [582.9044392122887, 732.5928850562777, 3188.9763779527557],
                [627.9921259842813, 727.0472441015299, 3188.9763779527557],
                [576.4566929177381, 314.8031496172771, 3188.9763779527557],
                [788.1889763786457, 290.39370079385117, 3188.9763779527557],
                [805.8395712063648, 443.49837654060684, 3188.9763779527557],
                [816.3779527572915, 442.2834645737894, 3188.9763779527557],
                [853.6466452209279, 438.3672053345945, 3188.9763779527557],
                [823.1496063014492, 176.10236221388914, 3188.9763779527557],
                [940.8320026430301, 159.68693953799084, 3188.9763779527557],
                [936.0236220480874, 126.06299212784506, 3188.9763779527557],
                [1101.4599444968626, 102.94272087700665, 3188.9763779527557],
                [1140.345388983842, 381.1862095859833, 3188.9763779527557],
                [1180.2105137649924, 375.7512698126957, 3188.9763779527557],
                [1168.0314960656688, 266.6141732421238, 3188.9763779527557],
                [1225.5171938766725, 260.83906630333513, 3188.9763779527557],
                [1198.3464566962793, 32.83464567968622, 3188.9763779527557],
                [1461.2598425210454, 0.0, 3188.9763779527557]
            ];
            var extrudeMesh = new THREE.ExtrudeMesh();
            var geometry = extrudeMesh.createExtrudeBufferGeometry(arr, 100);
            var material = new THREE.MeshPhongMaterial({color: 0x00ff00});
            var mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);
        },
        /**
         * 添加天空盒子
         */
        initSkyBox: function () {
            let texture = new THREE.TextureLoader().load('../statics/image/skybox/sky.png');
            let sphereGeometry = new THREE.SphereGeometry(700, 50, 50);
            sphereGeometry.scale(-1, 1, 1);
            let sphereMaterial = new THREE.MeshBasicMaterial({
                map: texture
            });
            let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            this.scene.add(sphere);
        },

        /**
         * 获取渲染面的范围
         * @returns {*|jQuery}
         */
        getHeight: function () {
            return $(this.container).height();
        },
        getWidth: function () {
            return $(this.container).width();
        },
        /***************************** 事件 ************************************/
        onWindowResize: function () {
            this.camera.aspect = this.getWidth() / this.getHeight();
            this.camera.updateProjectionMatrix();
            this.render();
            this.webGLRenderer.setSize(this.getWidth(), this.getHeight());
        },
        _bind: function (scope, fn) {
            return function () {
                fn.apply(scope, arguments);
            };
        },

        /***************************** 回调函数 ********************************/
        /**
         * 射线拾取回调函数
         */
        selectObjectsCallBack: function (mesh) {
        }
    });
})(PGL);

$(function () {
    var scene3D = new PGL.scene3D({}, {
        container: document.getElementById("container"),
        enabledSkyBox: false
    });
    scene3D.init();
});