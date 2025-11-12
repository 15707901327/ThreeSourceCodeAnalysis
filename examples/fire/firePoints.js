import * as THREE from '../../build/three_r109.module.js';

var Util = {
  /**
   * 获取从最小值到最大值的整数随机数
   * @param min 最小值
   * @param max 最大值
   * @returns {*}
   */
  getRandomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  },

  /**
   * 角度转弧度
   * @param degrees 角度
   * @returns {number}
   */
  getRadian: function(degrees) {
    return degrees * Math.PI / 180;
  },

  /**
   * 获取球形坐标
   * @param rad1
   * @param rad2
   * @param r
   * @returns {THREE.Vector3}
   */
  getSpherical: function(rad1, rad2, r) {
    var x = Math.cos(rad1) * Math.cos(rad2) * r;
    var z = Math.cos(rad1) * Math.sin(rad2) * r;
    var y = Math.sin(rad1) * r;
    return new THREE.Vector3(x, y, z);
  }
};

/**
 * 粒子移动器
 * @constructor
 */
function Mover() {
  this.position = new THREE.Vector3(); // 粒子位置
  this.velocity = new THREE.Vector3(); // 粒子速度
  this.acceleration = new THREE.Vector3(); // 粒子加速度
  this.anchor = new THREE.Vector3(); // 粒子瞄点
  this.mass = 1; // 粒子大小

  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.a = 1;

  this.time = 0;
  this.is_active = false; // 标记激活
}

Object.assign(Mover.prototype, {
  // 初始化移动器参数
  init: function(vector) {
    this.position = vector.clone();
    this.velocity = vector.clone();
    this.anchor = vector.clone();
    this.acceleration.set(0, 0, 0);

    this.a = 1;

    this.time = 0;
  },

  // 更新位置
  updatePosition: function() {
    this.position.copy(this.velocity);
  },

  // 更新速度
  updateVelocity: function() {
    this.acceleration.divideScalar(this.mass);
    this.velocity.add(this.acceleration);
  },
  /**
   * 设置粒子加速值
   * @param vector
   */
  applyForce: function(vector) {
    this.acceleration.add(vector);
  },
  applyFriction: function() {
    var friction = Force.friction(this.acceleration, 0.1);
    this.applyForce(friction);
  },
  applyDragForce: function(value) {
    var drag = Force.drag(this.acceleration, value);
    this.applyForce(drag);
  },
  hook: function(rest_length, k) {
    var force = Force.hook(this.velocity, this.anchor, rest_length, k);
    this.applyForce(force);
  },
  /**
   * 设置标记激活
   */
  activate: function() {
    this.is_active = true;
  },

  // 灭火
  inactivate: function() {
    this.is_active = false;
  }
});

/**
 * 火焰粒子
 * @param options
 *  gui 控制面板
 *  enableGUI: 启动gui
 * @constructor
 */
function FirePoints(options) {

  options = options || {};
  this.gui = options.gui;
  this.enableGUI = options.enableGUI !== undefined ? options.enableGUI : false;

  this.size = 120;// 粒子大小
  this.movers = []; // 粒子移动计算

  this.activeNum = 5; // 每次释放的粒子数量
  this.height = 150; // 火焰高度
  this.r = 3; // 半径大小
  this.position = new THREE.Vector3(0, 80, 0); // 初始化位置

  this.movers_num = this.activeNum * this.height; // 粒子数量

  this.geometry = null; // 几何体
  this.texture = null; // 贴图
  this.material = null; // 材质

  this.obj = null; // 粒子对象
  this.antigravity = new THREE.Vector3(0, 0.1, 0); // 反重力

  this._init();
}

Object.assign(FirePoints.prototype, {
  /**
   * 初始化创建粒子
   * @private
   */
  _init: function() {
    this._createTexture();

    this.geometry = new THREE.Geometry();
    this.material = new THREE.PointsMaterial({
      color: 0xff6633,
      size: this.size,
      transparent: true,
      opacity: 0.5,
      map: this.texture,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    for (var i = 0; i < this.movers_num; i++) {

      // 移动器
      var mover = new Mover();
      mover.init(this.position);
      this.movers.push(mover);

      // 设置几何体的位置
      this.geometry.vertices.push(mover.position);
    }

    this.obj = new THREE.Points(this.geometry, this.material);

    if (this.enableGUI) {
      var _this = this;
      var param = {
        activeNum: this.activeNum,
        height: this.height,
        positionX:this.position.x,
        positionY:this.position.y,
        positionZ:this.position.z,
        r:this.r
      };
      var firePointControll = this.gui.addFolder("火焰参数");
      firePointControll.add(param, 'activeNum', 0, 10).step(1).onChange(function(val) {
        _this.activeNum = val;
        _this._initMovers();
      });
      firePointControll.add(param, 'height', param.height - 50, param.height + 50).step(1).onChange(function(val) {
        _this.height = val;
        _this._initMovers();
      })
      firePointControll.add(param, 'positionX', param.positionX - 50, param.positionX + 50).step(1).onChange(function(val) {
        _this.position.x = val;
        _this._initMovers();
      })
      firePointControll.add(param, 'positionY', param.positionY - 50, param.positionY + 50).step(1).onChange(function(val) {
        _this.position.y = val;
        _this._initMovers();
      })
      firePointControll.add(param, 'positionZ', param.positionZ - 50, param.positionZ + 50).step(1).onChange(function(val) {
        _this.position.z = val;
        _this._initMovers();
      })
      firePointControll.add(param, 'r', 1, 10).step(1).onChange(function(val) {
        _this.r= val;
        _this._initMovers();
      })
    }
  },

  /**
   * 初始化位置
   * @private
   */
  _initMovers: function() {
    for (var i = 0; i < this.movers.length; i++) {
      this.movers[i].inactivate();
      this.movers[i].init(this.position);
    }
  },

  // 更新粒子
  update: function() {
    var points_vertices = [];

    for (var i = 0; i < this.movers.length; i++) {
      var mover = this.movers[i];
      // 移动激活的粒子
      if (mover.is_active) {
        // 粒子加速度
        mover.applyForce(this.antigravity);
        // 粒子速度
        mover.updateVelocity();
        // 更新粒子位置
        mover.updatePosition();
        if (mover.position.y > this.height + this.position.y) {
          mover.inactivate();
        }
      }

      points_vertices.push(mover.position);
    }
    this.obj.geometry.vertices = points_vertices;
    this.obj.geometry.verticesNeedUpdate = true;
  },

  /**
   * 激活粒子
   * @param num 激活的粒子数量
   */
  activateMover: function() {
    var count = 0;

    // 遍历粒子控制器
    for (var i = 0; i < this.movers.length; i++) {

      var mover = this.movers[i];
      if (mover.is_active) continue;

      // [0.9554820237218405,1)*270
      var rad1 = Util.getRadian(Math.log(Util.getRandomInt(200, 256)) / Math.log(256) * 270);
      // [0,360)
      var rad2 = Util.getRadian(Util.getRandomInt(0, 360));
      // 获取球坐标上的三维坐标
      var force = Util.getSpherical(rad1, rad2, this.r);

      mover.activate();
      mover.init(this.position);
      mover.applyForce(force);

      count++;
      if (count >= this.activeNum) break;
    }
  },

  /**
   * 创建二维贴图
   * @private
   */
  _createTexture: function() {
    var canvas = document.getElementById('show_canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;

    // 渐变的圆
    var grad = ctx.createRadialGradient(100, 100, 20, 100, 100, 100);
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.arc(100, 100, 100, 0, Math.PI / 180, true);
    ctx.fill();

    this.texture = new THREE.Texture(canvas);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.needsUpdate = true;
  }
});

export {FirePoints};