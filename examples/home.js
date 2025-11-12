import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { MTLLoader } from './jsm/loaders/MTLLoader.js';
import { OBJLoader } from './jsm/loaders/OBJLoader.js';
import { MathUtils } from '../examples/jsm/utils/MathUtils.js';
import { GeometryUtils } from '../examples/jsm/utils/GeometryUtils.js';
import { GradientVertShader } from './gradient/v6/GradientVertShader.js';

import { GradientFragShader } from './gradient/v6/v6-3/GradientFragShader.js';
import { pointsData } from './gradient/v6/v6-3/data.js';

/**
 * 场景初始化区
 */
(function(PGL) {
	/**
	 * 场景创建类
	 * @param config 加载配置文件
	 * @param options
	 *  container: 挂载点
	 *  enabledClick：控制是否开启射线拾取 true
	 *  enabledSkyBox: 开启天空盒子 true
	 */
	PGL.scene3D = function(config, options) {
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
		init: function() {
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
				if (_this.orbitControls) {
					_this.orbitControls.update();
				}
				_this.render();
				_this.stats.update();
				//
				// console.log(_this.camera.position);
			}

			// 天空盒子
			if (this.enabledSkyBox) {
				this.initSkyBox();
			}

			// 射线摄取
			this.rayControls = new PGL.RayControls(this.camera, this.scene, {
				domElement: this.webGLRenderer.domElement
			});
			this.rayControls.selectObjectsCallBack = function(mesh) {
				_this.selectObjectsCallBack(mesh);
			};
			this.rayControls.selectFirstObjectCallBack = function(object) {
				console.log(object);
			};
		},
		initWebGLRenderer: function() {
			this.webGLRenderer = new THREE.WebGLRenderer({
				antialias: true
			});
			this.webGLRenderer.shadowMap.enabled = true;
			this.webGLRenderer.shadowMap.type = THREE.VSMShadowMap;
			this.webGLRenderer.setSize(this.getWidth(), this.getHeight());
			this.webGLRenderer.setClearColor(0x000000);
			this.container.appendChild(this.webGLRenderer.domElement);
		},
		initScene: function() {
			this.scene = new THREE.Scene();
			// this.scene.background = new THREE.Color(0xff0000);

			// this.scene.fog = new THREE.Fog(0xffffff, 300, 1200);
			var axes = new THREE.AxesHelper(100);
			this.scene.add(axes);
		},
		initCamera: function() {
			this.camera = new THREE.PerspectiveCamera(45, this.getWidth() / this.getHeight(), 0.1, 30000);
			this.camera.position.set(-44.84938961774735, 58.131056826939, 27.007293192608213);
			this.camera.lookAt(-30, 20, 0);
		},
		initLight: function() {
			// var ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
			// this.scene.add(ambientLight);

			// var light = new THREE.DirectionalLight(0xffffff, 1.0);
			// light.position.set(0, 100.0, 0);
			// light.castShadow = true;
			// this.scene.add(light);

			// var helper = new THREE.DirectionalLightHelper( light, 4 );
			// this.scene.add( helper );

			// var SpotLight = new THREE.SpotLight(0xffffff, .6);
			// SpotLight.castShadow = true;
			// SpotLight.position.set(0, 10, 0);
			// SpotLight.shadow.mapSize.width = 4096;
			// SpotLight.shadow.mapSize.height = 4096;
			// this.scene.add(SpotLight);
		},
		initOrbitControls: function() {
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
			// this.orbitControls.minDistance = 0.1;
			//设置相机距离原点的最远距离
			// this.orbitControls.maxDistance = 30000;
			//是否开启右键拖拽
			this.orbitControls.enablePan = true;
			this.orbitControls.enableRotatePhi = false;
			var orbitControls = this.orbitControls;

		},
		initStats: function() {
			this.stats = new Stats();
			this.container.appendChild(this.stats.dom);
		},
		render: function() {
			this.webGLRenderer.render(this.scene, this.camera);
		},
		initEvent: function() {
			var _onWindowResize = this._bind(this, this.onWindowResize);
			window.addEventListener("resize", _onWindowResize, false)
		},

		initObject: function() {

			const _this = this;

			new GLTFLoader().load('models/gltf/cube-material-color.glb', function (gltf) {
				var model = gltf.scene;
				_this.scene.add(model);
			});
		},

		/***
		 * 放大基点
		 * @private
		 */
		scaleValuePoints2(targetPoints, points) {
			if (this._scaleValue === 0) {
				targetPoints = points;
			}

			return GeometryUtils.scalePointsValue(targetPoints, points, 5.0);
		},

		/**
		 * 计算渐变数组
		 */
		computeGradientPoints(arr, points, EPSIANGLE) {
			let count = 0;

			for (let i = 0; i < points.length - 1; i++) {

				let A;
				let A1 = points[i];
				let B;
				if (i == 0) {
					A = new THREE.Vector2(points[points.length - 2].x, points[points.length - 2].y);
					B = new THREE.Vector2(points[i + 1].x, points[i + 1].y);
				} else if (i == points.length - 2) {
					A = new THREE.Vector2(points[i - 1 - count].x, points[i - 1 - count].y);
					B = new THREE.Vector2(points[0].x, points[0].y);
				} else {
					A = new THREE.Vector2(points[i - 1 - count].x, points[i - 1 - count].y);
					B = new THREE.Vector2(points[i + 1].x, points[i + 1].y);
				}

				// 去掉小于epsAngle角度的点
				let cosAA1B = MathUtils.computeCos(A, A1, B);
				// 1. 当两个点过于接近时,去掉
				if (cosAA1B > Math.cos((180 - EPSIANGLE) * Math.PI / 180) && cosAA1B < Math.cos(EPSIANGLE * Math.PI / 180) && B.distanceTo(A1) > 0.1) {
					arr.push(points[i].x, points[i].y);
					count = 0;
				} else {
					count++;
				}
			}
			arr.push(arr[0], arr[1]);
		},

		/**
		 * 创建平面shape
		 * @param points
		 * @param isClose
		 * @returns shape {THREE.Shape}
		 */
		createShape(points, isClose) {
			const shape = new THREE.Shape();

			shape.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				shape.lineTo(points[i].x, points[i].y)
			}
			if (isClose) {
				shape.lineTo(points[0].x, points[0].y)
			}
			return shape;
		},

		/**
		 * 添加天空盒子
		 */
		initSkyBox: function() {
			let texture = new THREE.TextureLoader().load('textures/skybox/sky.png');
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
		getHeight: function() {
			return $(this.container).height();
		},
		getWidth: function() {
			return $(this.container).width();
		},
		/***************************** 事件 ************************************/
		onWindowResize: function() {
			this.camera.aspect = this.getWidth() / this.getHeight();
			this.camera.updateProjectionMatrix();
			this.render();
			this.webGLRenderer.setSize(this.getWidth(), this.getHeight());
		},
		_bind: function(scope, fn) {
			return function() {
				fn.apply(scope, arguments);
			};
		},

		/***************************** 回调函数 ********************************/
		/**
		 * 射线拾取回调函数
		 */
		selectObjectsCallBack: function(mesh) {
		}
	});
})(PGL);

$(function() {
	var scene3D = new PGL.scene3D({}, {
		container: document.getElementById("container"),
		enabledSkyBox: false
	});
	scene3D.init();
});