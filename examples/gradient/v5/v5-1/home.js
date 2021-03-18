import { MTLLoader } from './jsm/loaders/MTLLoader.js';
import { OBJLoader } from './jsm/loaders/OBJLoader.js';
import { MathUtils } from '../examples/jsm/utils/MathUtils.js'
import { GradientFragShader } from './v5/v5-2/GradientFragShader.js'
import { GradientVertShader } from './v5/v5-2/GradientVertShader.js'
import { points } from './v5/v5-2/data.js'

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
			var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
			this.scene.add(ambientLight);

			// var light = new THREE.DirectionalLight(0xffffff, 1.0);
			// light.position.set(0, 100.0, 0);
			// light.castShadow = true;
			// this.scene.add(light);

			// var helper = new THREE.DirectionalLightHelper( light, 4 );
			// this.scene.add( helper );

			var SpotLight = new THREE.SpotLight(0xffffff, .6);
			SpotLight.castShadow = true;
			SpotLight.position.set(0, 10, 0);
			SpotLight.shadow.mapSize.width = 4096;
			SpotLight.shadow.mapSize.height = 4096;
			this.scene.add(SpotLight);
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

			const geometry1 = new THREE.PlaneBufferGeometry(500, 500, 500);
			const material1 = new THREE.MeshBasicMaterial({
				color: 0xdad8d4,
				side: THREE.DoubleSide
			});
			const plane = new THREE.Mesh(geometry1, material1);
			plane.position.setY(-10);
			plane.rotation.set(-Math.PI / 2, 0, 0, 'XYZ');
			this.scene.add(plane);

			var heartShape = this.createShape(points);
			var geometry = new THREE.ShapeBufferGeometry(heartShape);

			var arr = [];
			for (let i = 0; i < points.length; i++) {
				arr.push(points[i].x, points[i].y)
			}
			// 创建材质
			let center = new THREE.Vector3();
			let Box3 = new THREE.Box3();
			Box3.setFromPoints(points);
			Box3.getCenter(center);

			let material = new THREE.ShaderMaterial({
				defines: {
					UNROLLED_LOOP_INDEX: arr.length
				},
				uniforms: {
					"color": {
						value: new THREE.Color("#ff0000")
					},
					"alpha": {
						value: 1.0
					},
					"center": {
						value: center
					},
					"arr": {
						value: arr
					},
					"widthScale": {
						value: 3.0
					}
				},
				vertexShader: GradientVertShader,
				fragmentShader: GradientFragShader,
				transparent: true
			});
			var mesh = new THREE.Mesh(geometry, material);
			mesh.rotation.set(-Math.PI / 2, 0, 0, 'XYZ');

			const edges = new THREE.EdgesGeometry(geometry, 1);
			let edgesMaterial = new THREE.MeshBasicMaterial({
				color: 0xff0000
			});
			let line = new THREE.LineSegments(edges, edgesMaterial);

			// this.scene.add(mesh);
			// mesh.add(line);

			this.test(arr);
		},

		test: function(arr) {

			console.log("点的个数", arr.length / 2 - 1);

			let center = new THREE.Vector2(0.0, 0.0);
			let v = new THREE.Vector2(5.0, 3.0);
			let gradientAlpha = 1.0;
			let gradientAlpha2 = 1.0;

			let count = 0;

			// 计算点与所有边的垂线
			for (var i = 0; i < arr.length - 2; i += 2) {
				var A = new THREE.Vector2(arr[i], arr[i + 1]);
				var B = new THREE.Vector2(arr[i + 2], arr[i + 3]);

				// 计算AB中点
				var D = A.clone();
				D.add(B);
				D.divideScalar(2.0);

				// 计算AB的中垂线向量
				var vecAB = B.clone();
				vecAB.sub(A);
				var vecabT = new THREE.Vector2();
				vecabT.x = -vecAB.y;
				vecabT.y = vecAB.x;

				// 计算中垂线上一点
				var D1 = D.clone();
				D1.add(vecabT);

				// 获取垂点坐标
				var d = MathUtils.calculateVerticalPoint(A, B, v);
				// 给定点与垂点距离
				let vd = v.distanceTo(d);

				// 判断垂点是否在线上
				if (MathUtils.isOnLine(A, B, v)) {

					let minP1 = new THREE.Vector2();
					let minP1Distance = 0.0;
					let minP2 = new THREE.Vector2();
					let minP2Distance = 0.0;

					let minP3 = new THREE.Vector2();
					let minP3Distance = 0.0;
					let minP4 = new THREE.Vector2();
					let minP4Distance = 0.0;

					for (let j = 0; j < arr.length - 2; j += 2) {
						let A1 = new THREE.Vector2(arr[j], arr[j + 1]);
						let B1 = new THREE.Vector2(arr[j + 2], arr[j + 3]);

						// 判断垂点是否在线
						let isOnLine = MathUtils.isOnLine(A1, B1, v);

						// 获取焦点坐标
						if (MathUtils.isIntersection(A1, B1, v, d)) {
							let p = MathUtils.getIntersection(A1, B1, v, d);

							// 判断是同向还是异向
							if (MathUtils.isSameDirection(v, d, p)) {

								if (isOnLine) {
									if (minP1Distance === 0.0 || minP1Distance > v.distanceTo(p)) {
										minP1Distance = v.distanceTo(p);
										minP1.copy(p);
									}
								}

								if (minP3Distance === 0.0 || minP3Distance > v.distanceTo(p)) {
									minP3Distance = v.distanceTo(p);
									minP3.copy(p);
								}
							} else {

								if (isOnLine) {
									if (minP2Distance === 0.0 || minP2Distance > v.distanceTo(p)) {
										minP2Distance = v.distanceTo(p);
										minP2.copy(p);
									}
								}

								if (minP4Distance === 0.0 || minP4Distance > v.distanceTo(p)) {
									minP4Distance = v.distanceTo(p);
									minP4.copy(p);
								}
							}
						}
					}

					// 计算中心点
					let center2 = new THREE.Vector2(0.0, 0.0);
					center2.addVectors(minP1, minP2);
					center2.divideScalar(2.0);

					let center3 = new THREE.Vector2(0.0, 0.0);
					center3.addVectors(minP3, minP4);
					center3.divideScalar(2.0);

					let centerD = new THREE.Vector2(0.0, 0.0);
					centerD.addVectors(minD1, minD2);
					centerD.divideScalar(2.0);

					// 中点与垂点的距离
					let cd2 = center2.distanceTo(d);
					let cd3 = center3.distanceTo(d);
					let cd = Math.min(cd2, cd3);
					cd = cd2;
					cd = cd3;

					if (Math.abs(minP3Distance - minP1Distance) < 0.0001) {
						if (vd < cd) {
							gradientAlpha *= vd / cd;
						}
					}

					if (Math.abs(minP3Distance - minP1Distance) > 0.0001) {

						let vp = minP3Distance;
						let cp = center3.distanceTo(minP3);

						if (vp < cp) {
							gradientAlpha2 *= vp / cp;
							count++;
						}
					}
				}
			}

			if (count > 1) {
				// console.log(gradientAlpha2);
			}
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