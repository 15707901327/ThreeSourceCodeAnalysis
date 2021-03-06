/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

/**
 * 控制器执行轨道运动，玩偶（缩放）和平移。
 * 与TrackballControls不同，它维护“up”方向object.up（默认为+ Y）。
 *  轨道 - 鼠标左键/触摸：单指移动
 *  缩放 - 中间鼠标或鼠标滚轮/触摸：双指展开或挤压
 *  平移 - 右键鼠标，或鼠标左键+ ctrl / meta / shiftKey，或箭头键/触摸：双指移动
 *
 * 参数：
 *  object：相机
 *  domElement：控制事件添加元素
 */
THREE.OrbitControls = function(object, domElement) {

  this.object = object;

  // 事件默认添加到整个文档对象
  this.domElement = (domElement !== undefined) ? domElement : document;

  // Set to false to disable this control
  // 设置控制器是否启用
  this.enabled = true;

  // "target" sets the location of focus, where the object orbits around
  // 设置轨道环绕的焦点
  this.target = new THREE.Vector3();

  // How far you can dolly in and out ( PerspectiveCamera only )
  // 可以移动的远近距离
  this.minDistance = 0;
  this.maxDistance = Infinity;

  // How far you can zoom in and out ( OrthographicCamera only )
  // 可以放大缩小的范围
  this.minZoom = 0;
  this.maxZoom = Infinity;

  // How far you can orbit vertically, upper and lower limits.
  // 可以垂直绕行多远,上限和下限
  // Range is 0 to Math.PI radians.
  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  // How far you can orbit horizontally, upper and lower limits.
  // 可以水平绕行多远,上限和下限
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
  this.minAzimuthAngle = -Infinity; // radians
  this.maxAzimuthAngle = Infinity; // radians

  // Set to true to enable damping (inertia)
  // 设置为true以启动阻尼（惯性）
  // If damping is enabled, you must call controls.update() in your animation loop
  // 如果启用阻尼，则必须在动画循环中调用controls.update（）
  this.enableDamping = false;
  this.dampingFactor = 0.25;

  // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // 这个选项实际上可以使进出进入; 为了向后兼容，保留为“缩放”。
  // Set to false to disable zooming
  // 设置为false以禁用缩放
  this.enableZoom = true;
  this.zoomSpeed = 1.0;

  // Set to false to disable rotating
  // 设置为false以禁用旋转
  this.enableRotate = true;
  this.rotateSpeed = 1.0;

  // 设置为 false 以禁用平移
  this.enablePan = true;
  this.panSpeed = 1.0;
  this.screenSpacePanning = false; // 如果为true，则在屏幕空间中平移
  this.keyPanSpeed = 7.0;	// 每个箭头按键移动的像素

  // Set to true to automatically rotate around the target
  // If auto-rotate is enabled, you must call controls.update() in your animation loop
  // 设置为true以自动绕目标旋转
  this.autoRotate = false;
  this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

  // Set to false to disable use of the keys
  // 设置为false禁用键值
  this.enableKeys = true;

  // The four arrow keys
  this.keys = {LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40};

  // Mouse buttons
  this.mouseButtons = {LEFT: THREE.MOUSE.LEFT, MIDDLE: THREE.MOUSE.MIDDLE, RIGHT: THREE.MOUSE.RIGHT};

  /************* for reset ********************************/
  this.target0 = this.target.clone();
  this.position0 = this.object.position.clone();
  this.zoom0 = this.object.zoom;

  /************* public methods ***************************/
  this.getPolarAngle = function() {

    return spherical.phi;

  };

  this.getAzimuthalAngle = function() {

    return spherical.theta;

  };

  this.saveState = function() {

    scope.target0.copy(scope.target);
    scope.position0.copy(scope.object.position);
    scope.zoom0 = scope.object.zoom;

  };

  this.reset = function() {

    scope.target.copy(scope.target0);
    scope.object.position.copy(scope.position0);
    scope.object.zoom = scope.zoom0;

    scope.object.updateProjectionMatrix();
    scope.dispatchEvent(changeEvent);

    scope.update();

    state = STATE.NONE;

  };

  // this method is exposed, but perhaps it would be better if we can make it private...
  this.update = function() {

    var offset = new THREE.Vector3();

    // so camera.up is the orbit axis
    var quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
    var quatInverse = quat.clone().inverse();

    var lastPosition = new THREE.Vector3();
    var lastQuaternion = new THREE.Quaternion();

    return function update() {

      // 相机的位置
      var position = scope.object.position;
      // 相机位置与焦点的偏移
      offset.copy(position).sub(scope.target);
      // rotate offset to "y-axis-is-up" space
      // 将偏移旋转到“y轴向上”空间
      offset.applyQuaternion(quat);
      // angle from z-axis around y-axis
      // z轴绕y轴的角度
      spherical.setFromVector3(offset);

      // 设置自动旋转角度
      if (scope.autoRotate && state === STATE.NONE) {
        rotateLeft(getAutoRotationAngle());
      }

      // 设置添加方位角、极角
      spherical.theta += sphericalDelta.theta;
      spherical.phi += sphericalDelta.phi;

      // restrict theta to be between desired limits
      spherical.theta = Math.max(scope.minAzimuthAngle, Math.min(scope.maxAzimuthAngle, spherical.theta));
      // restrict phi to be between desired limits
      spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));

      // 限制phi
      spherical.makeSafe();

      spherical.radius *= scale;

      // restrict radius to be between desired limits
      spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

      // move target to panned location
      scope.target.add(panOffset);

      offset.setFromSpherical(spherical);

      // rotate offset back to "camera-up-vector-is-up" space
      offset.applyQuaternion(quatInverse);

      position.copy(scope.target).add(offset);

      scope.object.lookAt(scope.target);

      // 计算阻尼
      if (scope.enableDamping === true) {
        sphericalDelta.theta *= (1 - scope.dampingFactor);
        sphericalDelta.phi *= (1 - scope.dampingFactor);

        panOffset.multiplyScalar(1 - scope.dampingFactor);
      } else {
        sphericalDelta.set(0, 0, 0);
        panOffset.set(0, 0, 0);
      }

      scale = 1;

      // update condition is:
      // min(camera displacement, camera rotation in radians)^2 > EPS
      // using small-angle approximation cos(x/2) = 1 - x^2 / 8

      if (zoomChanged ||
        lastPosition.distanceToSquared(scope.object.position) > EPS ||
        8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {

        scope.dispatchEvent(changeEvent);

        lastPosition.copy(scope.object.position);
        lastQuaternion.copy(scope.object.quaternion);
        zoomChanged = false;

        return true;

      }

      return false;

    };

  }();

  this.dispose = function() {

    scope.domElement.removeEventListener('contextmenu', onContextMenu, false);
    scope.domElement.removeEventListener('mousedown', onMouseDown, false);
    scope.domElement.removeEventListener('wheel', onMouseWheel, false);

    scope.domElement.removeEventListener('touchstart', onTouchStart, false);
    scope.domElement.removeEventListener('touchend', onTouchEnd, false);
    scope.domElement.removeEventListener('touchmove', onTouchMove, false);

    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);

    window.removeEventListener('keydown', onKeyDown, false);

    //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

  };

  //
  // internals
  //

  var scope = this;

  var changeEvent = {type: 'change'};
  var startEvent = {type: 'start'};
  var endEvent = {type: 'end'};

  // 状态
  var STATE = {
    NONE: -1, // 无操作
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2, // 平移
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY_PAN: 4
  };
  var state = STATE.NONE;

  var EPS = 0.000001;

  // current position in spherical coordinates
  var spherical = new THREE.Spherical();
  var sphericalDelta = new THREE.Spherical();

  var scale = 1;
  var panOffset = new THREE.Vector3(); // 平移距离
  var zoomChanged = false;

  // 旋转变量
  var rotateStart = new THREE.Vector2(); // 开始坐标
  var rotateEnd = new THREE.Vector2(); // 结束坐标
  var rotateDelta = new THREE.Vector2(); // 旋转单位数度

  // 平移变量
  var panStart = new THREE.Vector2(); // 开始平移的坐标
  var panEnd = new THREE.Vector2();
  var panDelta = new THREE.Vector2(); // 平移距离

  // 缩放变量
  var dollyStart = new THREE.Vector2(); // 开始坐标
  var dollyEnd = new THREE.Vector2();
  var dollyDelta = new THREE.Vector2();

  /**
   * 获取自动旋转角度
   * @returns {number}
   */
  function getAutoRotationAngle() {
    return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
  }

  /**
   * 获取缩放大小
   * @returns {number}
   */
  function getZoomScale() {
    return Math.pow(0.95, scope.zoomSpeed);
  }

  /**
   * 设置球形方位角
   * @param angle
   */
  function rotateLeft(angle) {
    sphericalDelta.theta -= angle;
  }

  /**
   * 设置球形的极角
   * @param angle
   */
  function rotateUp(angle) {
    sphericalDelta.phi -= angle;
  }

  var panLeft = function() {

    var v = new THREE.Vector3();

    /**
     * 计算平移距离x
     * @param distance 平移距离
     * @param objectMatrix
     */
    return function panLeft(distance, objectMatrix) {

      // 获取相机的x轴，单位向量
      v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
      v.multiplyScalar(-distance);

      panOffset.add(v);

    };

  }();

  var panUp = function() {

    var v = new THREE.Vector3();

    return function panUp(distance, objectMatrix) {

      if (scope.screenSpacePanning === true) {

        v.setFromMatrixColumn(objectMatrix, 1);

      } else {

        v.setFromMatrixColumn(objectMatrix, 0);
        v.crossVectors(scope.object.up, v);

      }

      v.multiplyScalar(distance);

      panOffset.add(v);

    };

  }();

  // deltaX and deltaY are in pixels; right and down are positive
  var pan = function() {

    var offset = new THREE.Vector3();
    /**
     * @param deltaX x 移动偏移
     * @param deltaY 移动偏移
     * @type {pan}
     */
    return function pan(deltaX, deltaY) {

      var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

      if (scope.object.isPerspectiveCamera) {

        // perspective
        var position = scope.object.position;
        offset.copy(position).sub(scope.target);
        var targetDistance = offset.length();

        // half of the fov is center to top of screen
        // 获取物体所在面高度的一半
        targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180.0);

        // we use only clientHeight here so aspect ratio does not distort speed
        // 2 * deltaX * targetDistance / element.clientHeight 计算物体移动距离
        panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
        panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);

      } else if (scope.object.isOrthographicCamera) {

        // orthographic
        panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
        panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);

      } else {

        // camera neither orthographic nor perspective
        console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
        scope.enablePan = false;

      }

    };

  }();

  /**
   * 设置缩放
   * @param dollyScale
   */
  function dollyIn(dollyScale) {
    if (scope.object.isPerspectiveCamera) {
      scale /= dollyScale;
    } else if (scope.object.isOrthographicCamera) {
      scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
      scope.object.updateProjectionMatrix();
      zoomChanged = true;
    } else {
      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
      scope.enableZoom = false;
    }
  }

  function dollyOut(dollyScale) {
    if (scope.object.isPerspectiveCamera) {
      scale *= dollyScale;
    } else if (scope.object.isOrthographicCamera) {
      scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale));
      scope.object.updateProjectionMatrix();
      zoomChanged = true;
    } else {

      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
      scope.enableZoom = false;

    }
  }

  //
  // event callbacks - update the object state
  //
  // 设置开始旋转的坐标
  function handleMouseDownRotate(event) {
    //console.log( 'handleMouseDownRotate' );
    rotateStart.set(event.clientX, event.clientY);
  }

  /**
   * 设置缩放开始坐标
   * @param event
   */
  function handleMouseDownDolly(event) {
    //console.log( 'handleMouseDownDolly' );
    dollyStart.set(event.clientX, event.clientY);
  }

  /**
   * 设置开始平移的位置
   * @param event
   */
  function handleMouseDownPan(event) {
    panStart.set(event.clientX, event.clientY);
  }

  /**
   * 旋转
   * @param event
   */
  function handleMouseMoveRotate(event) {

    //console.log( 'handleMouseMoveRotate' );
    rotateEnd.set(event.clientX, event.clientY);

    rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
    // 整个绘图区域的旋转角度设置为360°，根据移动的距离计算旋转的角度
    rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height

    rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);

    rotateStart.copy(rotateEnd);

    scope.update();
  }

  /**
   * 缩放
   * @param event
   */
  function handleMouseMoveDolly(event) {

    //console.log( 'handleMouseMoveDolly' );

    dollyEnd.set(event.clientX, event.clientY);

    dollyDelta.subVectors(dollyEnd, dollyStart);

    if (dollyDelta.y > 0) {
      dollyIn(getZoomScale());
    } else if (dollyDelta.y < 0) {
      dollyOut(getZoomScale());
    }

    dollyStart.copy(dollyEnd);

    scope.update();
  }

  /**
   * 移动
   * @param event
   */
  function handleMouseMovePan(event) {

    panEnd.set(event.clientX, event.clientY);

    panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);

    pan(panDelta.x, panDelta.y);

    panStart.copy(panEnd);

    scope.update();

  }

  function handleMouseUp(event) {

    // console.log( 'handleMouseUp' );

  }

  function handleMouseWheel(event) {

    // console.log( 'handleMouseWheel' );
    if (event.deltaY < 0) {
      dollyOut(getZoomScale());
    } else if (event.deltaY > 0) {
      dollyIn(getZoomScale());
    }
    scope.update();

  }

  function handleKeyDown(event) {

    //console.log( 'handleKeyDown' );

    var needsUpdate = false;

    switch(event.keyCode){

      case scope.keys.UP:
        pan(0, scope.keyPanSpeed);
        needsUpdate = true;
        break;

      case scope.keys.BOTTOM:
        pan(0, -scope.keyPanSpeed);
        needsUpdate = true;
        break;

      case scope.keys.LEFT:
        pan(scope.keyPanSpeed, 0);
        needsUpdate = true;
        break;

      case scope.keys.RIGHT:
        pan(-scope.keyPanSpeed, 0);
        needsUpdate = true;
        break;

    }

    if (needsUpdate) {

      // prevent the browser from scrolling on cursor keys
      event.preventDefault();

      scope.update();

    }

  }

  function handleTouchStartRotate(event) {

    //console.log( 'handleTouchStartRotate' );

    rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);

  }

  function handleTouchStartDollyPan(event) {

    //console.log( 'handleTouchStartDollyPan' );

    if (scope.enableZoom) {

      var dx = event.touches[0].pageX - event.touches[1].pageX;
      var dy = event.touches[0].pageY - event.touches[1].pageY;

      var distance = Math.sqrt(dx * dx + dy * dy);

      dollyStart.set(0, distance);

    }

    if (scope.enablePan) {

      var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
      var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

      panStart.set(x, y);

    }

  }

  function handleTouchMoveRotate(event) {

    //console.log( 'handleTouchMoveRotate' );

    rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);

    rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    rotateLeft(2 * Math.PI * rotateDelta.x / element.clientHeight); // yes, height

    rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);

    rotateStart.copy(rotateEnd);

    scope.update();

  }

  function handleTouchMoveDollyPan(event) {

    //console.log( 'handleTouchMoveDollyPan' );

    if (scope.enableZoom) {

      var dx = event.touches[0].pageX - event.touches[1].pageX;
      var dy = event.touches[0].pageY - event.touches[1].pageY;

      var distance = Math.sqrt(dx * dx + dy * dy);

      dollyEnd.set(0, distance);

      dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));

      dollyIn(dollyDelta.y);

      dollyStart.copy(dollyEnd);

    }

    if (scope.enablePan) {

      var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
      var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

      panEnd.set(x, y);

      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);

      pan(panDelta.x, panDelta.y);

      panStart.copy(panEnd);

    }

    scope.update();

  }

  function handleTouchEnd(event) {

    //console.log( 'handleTouchEnd' );

  }

  //
  // event handlers - FSM: listen for events and reset state
  //

  /**
   * 鼠标按下事件
   * @param event
   */
  function onMouseDown(event) {

    if (scope.enabled === false) return;
    event.preventDefault();

    // Manually set the focus since calling preventDefault above
    // prevents the browser from setting it automatically.

    scope.domElement.focus ? scope.domElement.focus() : window.focus();

    switch(event.button){
      case scope.mouseButtons.LEFT:
        // 判断是否使用组合键值
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (scope.enablePan === false) return;
          handleMouseDownPan(event);
          state = STATE.PAN;
        } else {
          if (scope.enableRotate === false) return;
          handleMouseDownRotate(event);
          state = STATE.ROTATE;
        }
        break;
      case scope.mouseButtons.MIDDLE:
        if (scope.enableZoom === false) return;
        handleMouseDownDolly(event);
        state = STATE.DOLLY;
        break;
      case scope.mouseButtons.RIGHT:
        if (scope.enablePan === false) return;
        handleMouseDownPan(event);
        state = STATE.PAN;
        break;
    }

    if (state !== STATE.NONE) {
      document.addEventListener('mousemove', onMouseMove, false);
      document.addEventListener('mouseup', onMouseUp, false);
      scope.dispatchEvent(startEvent);
    }
  }

  /**
   * 鼠标移动事件
   * @param event
   */
  function onMouseMove(event) {

    if (scope.enabled === false) return;
    event.preventDefault();

    switch(state){
      case STATE.ROTATE:
        if (scope.enableRotate === false) return;
        handleMouseMoveRotate(event);
        break;
      case STATE.DOLLY:
        if (scope.enableZoom === false) return;
        handleMouseMoveDolly(event);
        break;
      case STATE.PAN:
        if (scope.enablePan === false) return;
        handleMouseMovePan(event);
        break;
    }

  }

  /**
   * 鼠标释放事件
   * @param event
   */
  function onMouseUp(event) {

    if (scope.enabled === false) return;

    handleMouseUp(event);

    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mouseup', onMouseUp, false);

    scope.dispatchEvent(endEvent);

    state = STATE.NONE;
  }

  function onMouseWheel(event) {

    if (scope.enabled === false || scope.enableZoom === false || (state !== STATE.NONE && state !== STATE.ROTATE)) return;

    event.preventDefault();
    event.stopPropagation();

    scope.dispatchEvent(startEvent);

    handleMouseWheel(event);

    scope.dispatchEvent(endEvent);

  }

  function onKeyDown(event) {

    if (scope.enabled === false || scope.enableKeys === false || scope.enablePan === false) return;

    handleKeyDown(event);

  }

  function onTouchStart(event) {

    if (scope.enabled === false) return;

    event.preventDefault();

    switch(event.touches.length){

      case 1:	// one-fingered touch: rotate

        if (scope.enableRotate === false) return;

        handleTouchStartRotate(event);

        state = STATE.TOUCH_ROTATE;

        break;

      case 2:	// two-fingered touch: dolly-pan

        if (scope.enableZoom === false && scope.enablePan === false) return;

        handleTouchStartDollyPan(event);

        state = STATE.TOUCH_DOLLY_PAN;

        break;

      default:

        state = STATE.NONE;

    }

    if (state !== STATE.NONE) {

      scope.dispatchEvent(startEvent);

    }

  }

  function onTouchMove(event) {

    if (scope.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    switch(event.touches.length){

      case 1: // one-fingered touch: rotate

        if (scope.enableRotate === false) return;
        if (state !== STATE.TOUCH_ROTATE) return; // is this needed?

        handleTouchMoveRotate(event);

        break;

      case 2: // two-fingered touch: dolly-pan

        if (scope.enableZoom === false && scope.enablePan === false) return;
        if (state !== STATE.TOUCH_DOLLY_PAN) return; // is this needed?

        handleTouchMoveDollyPan(event);

        break;

      default:

        state = STATE.NONE;

    }

  }

  function onTouchEnd(event) {

    if (scope.enabled === false) return;

    handleTouchEnd(event);

    scope.dispatchEvent(endEvent);

    state = STATE.NONE;

  }

  /**
   * 当启用控制器功能时，禁用右键菜单功能
   * @param event
   */
  function onContextMenu(event) {
    if (scope.enabled === false) return;
    event.preventDefault();
  }

  /************* 注册事件 ***************************/
  scope.domElement.addEventListener('contextmenu', onContextMenu, false);

  scope.domElement.addEventListener('mousedown', onMouseDown, false);
  scope.domElement.addEventListener('wheel', onMouseWheel, false);

  scope.domElement.addEventListener('touchstart', onTouchStart, false);
  scope.domElement.addEventListener('touchend', onTouchEnd, false);
  scope.domElement.addEventListener('touchmove', onTouchMove, false);

  window.addEventListener('keydown', onKeyDown, false);

  // force an update at start

  this.update();

};

THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

Object.defineProperties(THREE.OrbitControls.prototype, {

  center: {

    get: function() {

      console.warn('THREE.OrbitControls: .center has been renamed to .target');
      return this.target;

    }

  },

  // backward compatibility

  noZoom: {

    get: function() {

      console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
      return !this.enableZoom;

    },

    set: function(value) {

      console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
      this.enableZoom = !value;

    }

  },

  noRotate: {

    get: function() {

      console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
      return !this.enableRotate;

    },

    set: function(value) {

      console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
      this.enableRotate = !value;

    }

  },

  noPan: {

    get: function() {

      console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
      return !this.enablePan;

    },

    set: function(value) {

      console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
      this.enablePan = !value;

    }

  },

  noKeys: {

    get: function() {

      console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
      return !this.enableKeys;

    },

    set: function(value) {

      console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
      this.enableKeys = !value;

    }

  },

  staticMoving: {

    get: function() {

      console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
      return !this.enableDamping;

    },

    set: function(value) {

      console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
      this.enableDamping = !value;

    }

  },

  dynamicDampingFactor: {

    get: function() {

      console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
      return this.dampingFactor;

    },

    set: function(value) {

      console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
      this.dampingFactor = value;

    }

  }

});
