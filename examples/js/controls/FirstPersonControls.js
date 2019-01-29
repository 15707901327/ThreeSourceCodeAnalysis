/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

/**
 * 实现原理：
 * 1.实现相机位置移动
 *  1.1.根据按下的键值来判断相机的移动方向（上下、左右、前后）
 *  1.2.根据鼠标当前位置和屏幕中心位置来计算移动的距离
 *  1.3.使用translateX、translateY 、translateZ三个方法来移动相机的位置
 * 2.实现相机视点切换
 *  2.1.根据鼠标当前位置和屏幕中心位置来计算相机的视点位置
 * object：相机
 * domElement：事件绑定的节点
 */
THREE.FirstPersonControls = function ( object, domElement ) {

	this.object = object;
	this.target = new THREE.Vector3( 0, 0, 0 );

	// 事件绑定的dom，默认为整个文档
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// 设置是否启动控制器
	this.enabled = true;

	// 相机移动的速度
	this.movementSpeed = 1.0;
	// 鼠标移动查看的速度
	this.lookSpeed = 0.005;

	// 设置是否垂直方向移动
	this.lookVertical = true;
	this.autoForward = false;

	// 设置是否启用鼠标控制
	this.activeLook = true;

	// 设置是否垂直移动加成
	this.heightSpeed = false;
	// 垂直移动加成系数
	this.heightCoef = 1.0;
	// 限制最小值
	this.heightMin = 0.0;
	// 限制最大值
	this.heightMax = 1.0;

	// 约束垂直
	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	// 垂直移动加成距离
	this.autoSpeedFactor = 0.0;

	// 鼠标当前坐标
	this.mouseX = 0;
	this.mouseY = 0;

	this.lat = 0;
	this.lon = 0; // 进入初始视角x轴角度
	this.phi = 0; // 初始视角进入后y轴的角度
	this.theta = 0;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;

	this.mouseDragOn = false;

	// 视图的中心点坐标
	this.viewHalfX = 0;
	this.viewHalfY = 0;

	if ( this.domElement !== document ) {

		this.domElement.setAttribute( 'tabindex', - 1 );

	}

	// 计算视图中心点坐标
	this.handleResize = function () {

		if ( this.domElement === document ) {

			this.viewHalfX = window.innerWidth / 2;
			this.viewHalfY = window.innerHeight / 2;

		} else {

			this.viewHalfX = this.domElement.offsetWidth / 2;
			this.viewHalfY = this.domElement.offsetHeight / 2;

		}

	};

	// 按下鼠标键，控制向前还是向后
	this.onMouseDown = function ( event ) {

		if ( this.domElement !== document ) {

			this.domElement.focus();

		}

		event.preventDefault();
		// 设置不在触发同类的点击事件
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = true; break;
				case 2: this.moveBackward = true; break;

			}

		}

		this.mouseDragOn = true;

	};

	// 释放鼠标键，控制向前还是向后
	this.onMouseUp = function ( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = false; break;
				case 2: this.moveBackward = false; break;

			}

		}

		this.mouseDragOn = false;

	};

	// 设置鼠标坐标
	this.onMouseMove = function ( event ) {

		if ( this.domElement === document ) {

			this.mouseX = event.pageX - this.viewHalfX;
			this.mouseY = event.pageY - this.viewHalfY;

		} else {

			this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
			this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

		}

	};

	// 根据按键来控制前进、后退、左右、上下等
	this.onKeyDown = function ( event ) {

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = true; break;

			case 82: /*R*/ this.moveUp = true; break;
			case 70: /*F*/ this.moveDown = true; break;

		}

	};

    // 根据按键来控制前进、后退、左右、上下等
	this.onKeyUp = function ( event ) {

		switch ( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = false; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = false; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = false; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = false; break;

			case 82: /*R*/ this.moveUp = false; break;
			case 70: /*F*/ this.moveDown = false; break;

		}

	};

	this.update = function( delta ) {

		// 判断是否开启控制器
		if ( this.enabled === false ) return;

		// 计算垂直移动的距离
		if ( this.heightSpeed ) {
			// 获取y值为相机的y坐标，但是限制最大最小值
			var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
			// y轴的高度
			var heightDelta = y - this.heightMin;

			// 高度获得的速度
			this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

		} else {

			this.autoSpeedFactor = 0.0;

		}

		// 相机的移动距离
		var actualMoveSpeed = delta * this.movementSpeed;

		//  相机向前移动是相机的实际移动距离加上高度移动距离
		if ( this.moveForward || ( this.autoForward && ! this.moveBackward ) ) this.object.translateZ( - ( actualMoveSpeed + this.autoSpeedFactor ) );
		if ( this.moveBackward ) this.object.translateZ( actualMoveSpeed );

		if ( this.moveLeft ) this.object.translateX( - actualMoveSpeed );
		if ( this.moveRight ) this.object.translateX( actualMoveSpeed );

		if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
		if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

		// 鼠标移动获得的速度值
		var actualLookSpeed = delta * this.lookSpeed;

		if ( ! this.activeLook ) {

			actualLookSpeed = 0;

		}

		// 垂直外观比例
		var verticalLookRatio = 1;

		if ( this.constrainVertical ) {

			verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

		}

		// x移动距离（鼠标移动速度 X mouseX坐标）
		this.lon += this.mouseX * actualLookSpeed;
		// y轴移动距离
		if ( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

		// lat取-85到85之间的值
		this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
		// y获得弧度
		this.phi = THREE.Math.degToRad( 90 - this.lat );
        // x获得弧度
		this.theta = THREE.Math.degToRad( this.lon );

		// ？
		if ( this.constrainVertical ) {

			this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

		}

		var targetPosition = this.target,
			position = this.object.position;

		targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
		targetPosition.y = position.y + 100 * Math.cos( this.phi );
		targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

		this.object.lookAt( targetPosition );

	};

	function contextmenu( event ) {

		event.preventDefault();

	}

	// 去除添加的事件
	this.dispose = function() {

		this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
		this.domElement.removeEventListener( 'mousedown', _onMouseDown, false );
		this.domElement.removeEventListener( 'mousemove', _onMouseMove, false );
		this.domElement.removeEventListener( 'mouseup', _onMouseUp, false );

		window.removeEventListener( 'keydown', _onKeyDown, false );
		window.removeEventListener( 'keyup', _onKeyUp, false );

	};

	var _onMouseMove = bind( this, this.onMouseMove );
	var _onMouseDown = bind( this, this.onMouseDown );
	var _onMouseUp = bind( this, this.onMouseUp );
	var _onKeyDown = bind( this, this.onKeyDown );
	var _onKeyUp = bind( this, this.onKeyUp );

	this.domElement.addEventListener( 'contextmenu', contextmenu, false );
	this.domElement.addEventListener( 'mousemove', _onMouseMove, false );
	this.domElement.addEventListener( 'mousedown', _onMouseDown, false );
	this.domElement.addEventListener( 'mouseup', _onMouseUp, false );

	window.addEventListener( 'keydown', _onKeyDown, false );
	window.addEventListener( 'keyup', _onKeyUp, false );

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	}

	// 设置视图的中心点坐标
	this.handleResize();

};
