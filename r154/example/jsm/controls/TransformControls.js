import {
	Object3D,
	Quaternion,
	Vector3
} from 'three';
import {Raycaster} from "../../../../src/core/Raycaster.js";
import {TransformControlsGizmo} from "./TransformControlsGizmo.js";
import {TransformControlsPlane} from "./TransformControlsPlane.js";

/**
 * 变换控制器
 */
class TransformControls extends Object3D {
	
	/**
	 * 变换控制器
	 * @param camera 相机
	 * @param domElement canvas
	 */
	constructor(camera, domElement) {
		
		super();
		
		if (domElement === undefined) {
			
			console.warn('THREE.TransformControls: The second parameter "domElement" is now mandatory.');
			domElement = document;
			
		}
		
		this.isTransformControls = true;
		
		this.visible = false;
		this.domElement = domElement;
		this.domElement.style.touchAction = 'none'; // disable touch scroll
		
		// 控制器辅助线
		this._gizmo = new TransformControlsGizmo();
		this.add(this._gizmo);
		
		// 点击辅助面
		this._plane = new TransformControlsPlane();
		this.add(this._plane);
		
		// Define properties with getters/setter
		// Setting the defined property will automatically trigger change event
		// Defined properties are passed down to gizmo and plane
		
		this.defineProperty('camera', camera);
		this.defineProperty('object', undefined);    // 当前控制物体
		this.defineProperty('enabled', true);        // 标识是否启用事件
		this.defineProperty('axis', null);           // 当前拾取到的坐标轴
		this.defineProperty('mode', 'translate');
		this.defineProperty('space', 'world');       // 坐标空间
		this.defineProperty('size', 1);
		this.defineProperty('dragging', false);     // 标识移动状态
		this.defineProperty('showX', true);
		this.defineProperty('showY', true);
		this.defineProperty('showZ', true);
		
		// Reusable utility variables
		
		const worldPosition = new Vector3();
		const worldPositionStart = new Vector3();
		const worldQuaternion = new Quaternion();
		const worldQuaternionStart = new Quaternion();
		const cameraPosition = new Vector3();
		const cameraQuaternion = new Quaternion();
		const pointStart = new Vector3();
		const pointEnd = new Vector3();
		const rotationAxis = new Vector3();
		const rotationAngle = 0;
		const eye = new Vector3();
		
		// TODO: remove properties unused in plane and gizmo
		
		this.defineProperty('worldPosition', worldPosition);              // 位置
		this.defineProperty('worldPositionStart', worldPositionStart);    // 起始位置
		this.defineProperty('worldQuaternion', worldQuaternion);          // 四元数
		this.defineProperty('worldQuaternionStart', worldQuaternionStart);// 起始四元数
		this.defineProperty('cameraPosition', cameraPosition);
		this.defineProperty('cameraQuaternion', cameraQuaternion);
		this.defineProperty('pointStart', pointStart); // 起始坐标
		this.defineProperty('pointEnd', pointEnd);     // 终点坐标
		this.defineProperty('rotationAxis', rotationAxis);
		this.defineProperty('rotationAngle', rotationAngle);
		this.defineProperty('eye', eye);
		
		this._offset = new Vector3();    // 移动距离
		this._startNorm = new Vector3();
		this._endNorm = new Vector3();
		this._cameraScale = new Vector3();
		
		this._parentPosition = new Vector3();
		this._parentQuaternion = new Quaternion();
		this._parentQuaternionInv = new Quaternion();
		this._parentScale = new Vector3();
		
		this._worldScaleStart = new Vector3();       // 起始旋转
		this._worldQuaternionInv = new Quaternion();
		this._worldScale = new Vector3();
		
		this._positionStart = new Vector3();
		this._quaternionStart = new Quaternion();
		this._scaleStart = new Vector3();
		
		this._raycaster = new Raycaster();
		
		this._tempVector = new Vector3();
		this._tempVector2 = new Vector3();
		this._tempQuaternion = new Quaternion();
		this._unit = {
			X : new Vector3(1, 0, 0),
			Y : new Vector3(0, 1, 0),
			Z : new Vector3(0, 0, 1)
		};
		
		// event
		this._mouseDownEvent = {type : 'mouseDown'};
		this._changeEvent = {type : 'change'};
		this._objectChangeEvent = {type : 'objectChange'};
		this._mouseUpEvent = {type : 'mouseUp', mode : null};
		
		this._getPointer = this.getPointer.bind(this);
		this._onPointerDown = this.onPointerDown.bind(this);
		this._onPointerHover = this.onPointerHover.bind(this);
		this._onPointerMove = this.onPointerMove.bind(this);
		this._onPointerUp = this.onPointerUp.bind(this);
		
		this.domElement.addEventListener('pointerdown', this._onPointerDown);
		this.domElement.addEventListener('pointermove', this._onPointerHover);
		this.domElement.addEventListener('pointerup', this._onPointerUp);
		
	}
	
	// Defined getter, setter and store for a property
	defineProperty(propName, defaultValue) {
		
		let scope = this;
		
		let propValue = defaultValue;
		
		Object.defineProperty(scope, propName, {
			
			get : function () {
				
				return propValue !== undefined ? propValue : defaultValue;
				
			},
			
			set : function (value) {
				
				if (propValue !== value) {
					
					propValue = value;
					scope._plane[propName] = value;
					scope._gizmo[propName] = value;
					
					scope.dispatchEvent({type : propName + '-changed', value : value});
					scope.dispatchEvent(this._changeEvent);
					
				}
				
			}
			
		});
		
		scope[propName] = defaultValue;
		scope._plane[propName] = defaultValue;
		scope._gizmo[propName] = defaultValue;
		
	}
	
	// updateMatrixWorld  updates key transformation variables
	updateMatrixWorld() {
		
		if (this.object !== undefined) {
			
			this.object.updateMatrixWorld();
			
			if (this.object.parent === null) {
				
				console.error('TransformControls: The attached 3D object must be a part of the scene graph.');
				
			} else {
				
				this.object.parent.matrixWorld.decompose(this._parentPosition, this._parentQuaternion, this._parentScale);
				
			}
			
			this.object.matrixWorld.decompose(this.worldPosition, this.worldQuaternion, this._worldScale);
			
			this._parentQuaternionInv.copy(this._parentQuaternion).invert();
			this._worldQuaternionInv.copy(this.worldQuaternion).invert();
			
		}
		
		this.camera.updateMatrixWorld();
		this.camera.matrixWorld.decompose(this.cameraPosition, this.cameraQuaternion, this._cameraScale);
		
		if (this.camera.isOrthographicCamera) {
			
			this.camera.getWorldDirection(this.eye).negate();
			
		} else {
			
			this.eye.copy(this.cameraPosition).sub(this.worldPosition).normalize();
			
		}
		
		super.updateMatrixWorld(this);
		
	}
	
	/**
	 * 悬浮标记当前选中的轴或者面
	 * @param pointer 坐标数据
	 * @param pointer.x x坐标数据
	 * @param pointer.y y坐标数据
	 * @param pointer.button button
	 */
	pointerHover(pointer) {
		
		if (this.object === undefined || this.dragging === true) return;
		
		// 初始化射线检测
		this._raycaster.setFromCamera(pointer, this.camera);
		const intersect = this.intersectObjectWithRay(this._gizmo.picker[this.mode], this._raycaster);
		
		if (intersect) {
			this.axis = intersect.object.name;
		} else {
			this.axis = null;
		}
		
	}
	
	/**
	 * 按下事件
	 * 1. 计算起点
	 * 2. 标识移动状态
	 * @param pointer
	 */
	pointerDown(pointer) {
		
		if (this.object === undefined || this.dragging === true || pointer.button !== 0) return;
		
		if (this.axis !== null) {
			
			// 射线获取起点坐标
			this._raycaster.setFromCamera(pointer, this.camera);
			const planeIntersect = this.intersectObjectWithRay(this._plane, this._raycaster, true);
			if (planeIntersect) {
				
				this.object.updateMatrixWorld();
				this.object.parent.updateMatrixWorld();
				
				this._positionStart.copy(this.object.position);
				this._quaternionStart.copy(this.object.quaternion);
				this._scaleStart.copy(this.object.scale);
				
				this.object.matrixWorld.decompose(this.worldPositionStart, this.worldQuaternionStart, this._worldScaleStart);
				
				this.pointStart.copy(planeIntersect.point).sub(this.worldPositionStart);
				
			}
			
			this.dragging = true;
			this._mouseDownEvent.mode = this.mode;
			this.dispatchEvent(this._mouseDownEvent);
			
		}
		
	}
	
	/**
	 * 移动
	 * @param pointer 坐标数据
	 * @param pointer.x x坐标数据
	 * @param pointer.y y坐标数据
	 * @param pointer.button button
	 */
	pointerMove(pointer) {
		
		const axis = this.axis;
		const mode = this.mode;
		const object = this.object;
		let space = this.space;
		
		if (mode === 'scale') {
			
			space = 'local';
			
		} else if (axis === 'E' || axis === 'XYZE' || axis === 'XYZ') {
			
			space = 'world';
			
		}
		
		if (object === undefined || axis === null || this.dragging === false || pointer.button !== -1) return;
		
		// 计算终点坐标
		this._raycaster.setFromCamera(pointer, this.camera);
		const planeIntersect = this.intersectObjectWithRay(this._plane, this._raycaster, true);
		if (!planeIntersect) return;
		this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart);
		
		if (mode === 'translate') {
			
			// Apply translate
			this._offset.copy(this.pointEnd).sub(this.pointStart);
			
			if (space === 'local' && axis !== 'XYZ') {
				
				this._offset.applyQuaternion(this._worldQuaternionInv);
				
			}
			
			if (axis.indexOf('X') === -1) this._offset.x = 0;
			if (axis.indexOf('Y') === -1) this._offset.y = 0;
			if (axis.indexOf('Z') === -1) this._offset.z = 0;
			
			if (space === 'local' && axis !== 'XYZ') {
				
				this._offset.applyQuaternion(this._quaternionStart).divide(this._parentScale);
				
			} else {
				
				this._offset.applyQuaternion(this._parentQuaternionInv).divide(this._parentScale);
				
			}
			
			// 设置坐标移动
			object.position.copy(this._offset).add(this._positionStart);
			
		} else if (mode === 'scale') {
			
			if (axis.search('XYZ') !== -1) {
				
				let d = this.pointEnd.length() / this.pointStart.length();
				
				if (this.pointEnd.dot(this.pointStart) < 0) d *= -1;
				
				this._tempVector2.set(d, d, d);
				
			} else {
				
				this._tempVector.copy(this.pointStart);
				this._tempVector2.copy(this.pointEnd);
				
				this._tempVector.applyQuaternion(this._worldQuaternionInv);
				this._tempVector2.applyQuaternion(this._worldQuaternionInv);
				
				this._tempVector2.divide(this._tempVector);
				
				if (axis.search('X') === -1) {
					
					this._tempVector2.x = 1;
					
				}
				
				if (axis.search('Y') === -1) {
					
					this._tempVector2.y = 1;
					
				}
				
				if (axis.search('Z') === -1) {
					
					this._tempVector2.z = 1;
					
				}
				
			}
			
			// Apply scale
			
			object.scale.copy(this._scaleStart).multiply(this._tempVector2);
			
		} else if (mode === 'rotate') {
			
			this._offset.copy(this.pointEnd).sub(this.pointStart);
			
			const ROTATION_SPEED = 20 / this.worldPosition.distanceTo(this._tempVector.setFromMatrixPosition(this.camera.matrixWorld));
			
			if (axis === 'E') {
				
				this.rotationAxis.copy(this.eye);
				this.rotationAngle = this.pointEnd.angleTo(this.pointStart);
				
				this._startNorm.copy(this.pointStart).normalize();
				this._endNorm.copy(this.pointEnd).normalize();
				
				this.rotationAngle *= (this._endNorm.cross(this._startNorm).dot(this.eye) < 0 ? 1 : -1);
				
			} else if (axis === 'XYZE') {
				
				this.rotationAxis.copy(this._offset).cross(this.eye).normalize();
				this.rotationAngle = this._offset.dot(this._tempVector.copy(this.rotationAxis).cross(this.eye)) * ROTATION_SPEED;
				
			} else if (axis === 'X' || axis === 'Y' || axis === 'Z') {
				
				this.rotationAxis.copy(this._unit[axis]);
				
				this._tempVector.copy(this._unit[axis]);
				
				if (space === 'local') {
					
					this._tempVector.applyQuaternion(this.worldQuaternion);
					
				}
				
				this.rotationAngle = this._offset.dot(this._tempVector.cross(this.eye).normalize()) * ROTATION_SPEED;
				
			}
			
			// Apply rotate
			if (space === 'local' && axis !== 'E' && axis !== 'XYZE') {
				
				object.quaternion.copy(this._quaternionStart);
				object.quaternion.multiply(this._tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle)).normalize();
				
			} else {
				
				this.rotationAxis.applyQuaternion(this._parentQuaternionInv);
				object.quaternion.copy(this._tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle));
				object.quaternion.multiply(this._quaternionStart).normalize();
				
			}
			
		}
		
		this.dispatchEvent(this._changeEvent);
		this.dispatchEvent(this._objectChangeEvent);
		
	}
	
	/**
	 * 抬起事件
	 * @param pointer
	 */
	pointerUp(pointer) {
		
		if (pointer.button !== 0) return;
		
		if (this.dragging && (this.axis !== null)) {
			
			this._mouseUpEvent.mode = this.mode;
			this.dispatchEvent(this._mouseUpEvent);
		}
		
		this.dragging = false;
		this.axis = null;
		
	}
	
	dispose() {
		
		this.domElement.removeEventListener('pointerdown', this._onPointerDown);
		this.domElement.removeEventListener('pointermove', this._onPointerHover);
		this.domElement.removeEventListener('pointermove', this._onPointerMove);
		this.domElement.removeEventListener('pointerup', this._onPointerUp);
		
		this.traverse(function (child) {
			
			if (child.geometry) child.geometry.dispose();
			if (child.material) child.material.dispose();
			
		});
		
	}
	
	/**
	 * 设置当前控制物体
	 * @param object
	 * @return {TransformControls}
	 */
	attach(object) {
		
		this.object = object;
		this.visible = true;
		
		return this;
		
	}
	
	// 删除当前控制物体
	detach() {
		
		this.object = undefined;
		this.visible = false;
		this.axis = null;
		
		return this;
		
	}
	
	reset() {
		
		if (!this.enabled) return;
		
		if (this.dragging) {
			
			this.object.position.copy(this._positionStart);
			this.object.quaternion.copy(this._quaternionStart);
			this.object.scale.copy(this._scaleStart);
			
			this.dispatchEvent(this._changeEvent);
			this.dispatchEvent(this._objectChangeEvent);
			
			this.pointStart.copy(this.pointEnd);
			
		}
		
	}
	
	// TODO: deprecate
	
	getMode() {
		
		return this.mode;
		
	}
	
	/**
	 * 设置当前移动模式
	 */
	setMode(mode) {
		
		this.mode = mode;
		
	}
	
	setSize(size) {
		
		this.size = size;
		
	}
	
	setSpace(space) {
		
		this.space = space;
		
	}
	
	// mouse / touch event handlers
	
	/**
	 * 通过事件坐标获取屏幕上的点坐标
	 * @param event
	 * @return {{button: (boolean|number|*), x: number, y: number}}
	 */
	getPointer(event) {
		
		if (this.domElement.ownerDocument.pointerLockElement) {
			
			return {
				x : 0,
				y : 0,
				button : event.button
			};
			
		} else {
			
			const rect = this.domElement.getBoundingClientRect();
			
			return {
				x : (event.clientX - rect.left) / rect.width * 2 - 1,
				y : -(event.clientY - rect.top) / rect.height * 2 + 1,
				button : event.button
			};
			
		}
		
	}
	
	/**
	 * 悬浮事件
	 * @param event
	 */
	onPointerHover(event) {
		
		if (!this.enabled) return;
		
		switch (event.pointerType) {
			
			case 'mouse':
			case 'pen':
				this.pointerHover(this._getPointer(event));
				break;
			
		}
		
	}
	
	/**
	 * 按下事件
	 * @param event
	 */
	onPointerDown(event) {
		
		if (!this.enabled) return;
		
		if (!document.pointerLockElement) {
			
			this.domElement.setPointerCapture(event.pointerId);
			
		}
		
		// 注册移动事件
		this.domElement.addEventListener('pointermove', this._onPointerMove);
		
		// 触发悬浮
		this.pointerHover(this._getPointer(event));
		// 触发按下
		this.pointerDown(this._getPointer(event));
		
	}
	
	/**
	 * 移动事件
	 * @param event
	 */
	onPointerMove(event) {
		
		if (!this.enabled) return;
		
		this.pointerMove(this._getPointer(event));
		
	}
	
	/**
	 * 抬起事件
	 * @param event
	 */
	onPointerUp(event) {
		
		if (!this.enabled) return;
		
		this.domElement.releasePointerCapture(event.pointerId);
		
		this.domElement.removeEventListener('pointermove', this._onPointerMove);
		
		this.pointerUp(this._getPointer(event));
		
	}
	
	/**
	 * 射线检测物体
	 * @param object
	 * @param raycaster
	 * @param includeInvisible
	 * @return {*|boolean}
	 */
	intersectObjectWithRay(object, raycaster, includeInvisible) {
		
		const allIntersections = raycaster.intersectObject(object, true);
		
		for (let i = 0; i < allIntersections.length; i++) {
			
			if (allIntersections[i].object.visible || includeInvisible) {
				
				return allIntersections[i];
				
			}
			
		}
		
		return false;
		
	}
	
}

export {TransformControls};
