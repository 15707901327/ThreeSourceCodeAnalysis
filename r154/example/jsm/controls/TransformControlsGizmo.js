import {
	BoxGeometry,
	BufferGeometry,
	Euler,
	Float32BufferAttribute,
	Line,
	LineBasicMaterial,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	OctahedronGeometry,
	Quaternion,
	SphereGeometry,
	TorusGeometry,
	Vector3
} from 'three';
import {CylinderGeometry} from "../../../../src/geometries/CylinderGeometry.js";

const _tempVector = new Vector3();
const _tempQuaternion = new Quaternion();

// Reusable utility variables

const _tempEuler = new Euler();
const _alignVector = new Vector3(0, 1, 0);
const _zeroVector = new Vector3(0, 0, 0);
const _lookAtMatrix = new Matrix4();
const _tempQuaternion2 = new Quaternion();
const _identityQuaternion = new Quaternion();

const _unitX = new Vector3(1, 0, 0);
const _unitY = new Vector3(0, 1, 0);
const _unitZ = new Vector3(0, 0, 1);

/**
 * 变换控件
 */
class TransformControlsGizmo extends Object3D {
	
	constructor() {
		
		super();
		
		this.isTransformControlsGizmo = true;
		
		this.type = 'TransformControlsGizmo';
		
		// shared materials
		
		const gizmoMaterial = new MeshBasicMaterial({
			depthTest : false,
			depthWrite : false,
			fog : false,
			toneMapped : false,
			transparent : true
		});
		
		const gizmoLineMaterial = new LineBasicMaterial({
			depthTest : false,
			depthWrite : false,
			fog : false,
			toneMapped : false,
			transparent : true
		});
		
		// Make unique material for each axis/color
		
		const matInvisible = gizmoMaterial.clone();
		matInvisible.opacity = 0.15;
		
		const matHelper = gizmoLineMaterial.clone();
		matHelper.opacity = 0.5;
		
		const matRed = gizmoMaterial.clone();
		matRed.color.setHex(0xff0000);
		
		const matGreen = gizmoMaterial.clone();
		matGreen.color.setHex(0x00ff00);
		
		const matBlue = gizmoMaterial.clone();
		matBlue.color.setHex(0x0000ff);
		
		const matRedTransparent = gizmoMaterial.clone();
		matRedTransparent.color.setHex(0xff0000);
		matRedTransparent.opacity = 0.5;
		
		const matGreenTransparent = gizmoMaterial.clone();
		matGreenTransparent.color.setHex(0x00ff00);
		matGreenTransparent.opacity = 0.5;
		
		const matBlueTransparent = gizmoMaterial.clone();
		matBlueTransparent.color.setHex(0x0000ff);
		matBlueTransparent.opacity = 0.5;
		
		const matWhiteTransparent = gizmoMaterial.clone();
		matWhiteTransparent.opacity = 0.25;
		
		const matYellowTransparent = gizmoMaterial.clone();
		matYellowTransparent.color.setHex(0xffff00);
		matYellowTransparent.opacity = 0.25;
		
		const matYellow = gizmoMaterial.clone();
		matYellow.color.setHex(0xffff00);
		
		const matGray = gizmoMaterial.clone();
		matGray.color.setHex(0x787878);
		
		// reusable geometry
		
		const arrowGeometry = new CylinderGeometry(0, 0.04, 0.1, 12);
		arrowGeometry.translate(0, 0.05, 0);
		
		const scaleHandleGeometry = new BoxGeometry(0.08, 0.08, 0.08);
		scaleHandleGeometry.translate(0, 0.04, 0);
		
		const lineGeometry = new BufferGeometry();
		lineGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3));
		
		const lineGeometry2 = new CylinderGeometry(0.0075, 0.0075, 0.5, 3);
		lineGeometry2.translate(0, 0.25, 0);
		
		function CircleGeometry(radius, arc) {
			
			const geometry = new TorusGeometry(radius, 0.0075, 3, 64, arc * Math.PI * 2);
			geometry.rotateY(Math.PI / 2);
			geometry.rotateX(Math.PI / 2);
			return geometry;
			
		}
		
		// Special geometry for transform helper. If scaled with position vector it spans from [0,0,0] to position
		
		function TranslateHelperGeometry() {
			
			const geometry = new BufferGeometry();
			
			geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));
			
			return geometry;
			
		}
		
		// Gizmo definitions - custom hierarchy definitions for setupGizmo() function
		
		const gizmoTranslate = {
			X : [
				[new Mesh(arrowGeometry, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
				[new Mesh(arrowGeometry, matRed), [-0.5, 0, 0], [0, 0, Math.PI / 2]],
				[new Mesh(lineGeometry2, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]]
			],
			Y : [
				[new Mesh(arrowGeometry, matGreen), [0, 0.5, 0]],
				[new Mesh(arrowGeometry, matGreen), [0, -0.5, 0], [Math.PI, 0, 0]],
				[new Mesh(lineGeometry2, matGreen)]
			],
			Z : [
				[new Mesh(arrowGeometry, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
				[new Mesh(arrowGeometry, matBlue), [0, 0, -0.5], [-Math.PI / 2, 0, 0]],
				[new Mesh(lineGeometry2, matBlue), null, [Math.PI / 2, 0, 0]]
			],
			XYZ : [
				[new Mesh(new OctahedronGeometry(0.1, 0), matWhiteTransparent.clone()), [0, 0, 0]]
			],
			XY : [
				[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matBlueTransparent.clone()), [0.15, 0.15, 0]]
			],
			YZ : [
				[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matRedTransparent.clone()), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]
			],
			XZ : [
				[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matGreenTransparent.clone()), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]
			]
		};
		
		const pickerTranslate = {
			X : [
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0.3, 0, 0], [0, 0, -Math.PI / 2]],
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [-0.3, 0, 0], [0, 0, Math.PI / 2]]
			],
			Y : [
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0.3, 0]],
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, -0.3, 0], [0, 0, Math.PI]]
			],
			Z : [
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, -0.3], [-Math.PI / 2, 0, 0]]
			],
			XYZ : [
				[new Mesh(new OctahedronGeometry(0.2, 0), matInvisible)]
			],
			XY : [
				[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0.15, 0]]
			],
			YZ : [
				[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]
			],
			XZ : [
				[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]
			]
		};
		
		const helperTranslate = {
			START : [
				[new Mesh(new OctahedronGeometry(0.01, 2), matHelper), null, null, null, 'helper']
			],
			END : [
				[new Mesh(new OctahedronGeometry(0.01, 2), matHelper), null, null, null, 'helper']
			],
			DELTA : [
				[new Line(TranslateHelperGeometry(), matHelper), null, null, null, 'helper']
			],
			X : [
				[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']
			],
			Y : [
				[new Line(lineGeometry, matHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']
			],
			Z : [
				[new Line(lineGeometry, matHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], 'helper']
			]
		};
		
		const gizmoRotate = {
			XYZE : [
				[new Mesh(CircleGeometry(0.5, 1), matGray), null, [0, Math.PI / 2, 0]]
			],
			X : [
				[new Mesh(CircleGeometry(0.5, 0.5), matRed)]
			],
			Y : [
				[new Mesh(CircleGeometry(0.5, 0.5), matGreen), null, [0, 0, -Math.PI / 2]]
			],
			Z : [
				[new Mesh(CircleGeometry(0.5, 0.5), matBlue), null, [0, Math.PI / 2, 0]]
			],
			E : [
				[new Mesh(CircleGeometry(0.75, 1), matYellowTransparent), null, [0, Math.PI / 2, 0]]
			]
		};
		
		const helperRotate = {
			AXIS : [
				[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']
			]
		};
		
		const pickerRotate = {
			XYZE : [
				[new Mesh(new SphereGeometry(0.25, 10, 8), matInvisible)]
			],
			X : [
				[new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, -Math.PI / 2, -Math.PI / 2]],
			],
			Y : [
				[new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]],
			],
			Z : [
				[new Mesh(new TorusGeometry(0.5, 0.1, 4, 24), matInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]],
			],
			E : [
				[new Mesh(new TorusGeometry(0.75, 0.1, 2, 24), matInvisible)]
			]
		};
		
		const gizmoScale = {
			X : [
				[new Mesh(scaleHandleGeometry, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
				[new Mesh(lineGeometry2, matRed), [0, 0, 0], [0, 0, -Math.PI / 2]],
				[new Mesh(scaleHandleGeometry, matRed), [-0.5, 0, 0], [0, 0, Math.PI / 2]],
			],
			Y : [
				[new Mesh(scaleHandleGeometry, matGreen), [0, 0.5, 0]],
				[new Mesh(lineGeometry2, matGreen)],
				[new Mesh(scaleHandleGeometry, matGreen), [0, -0.5, 0], [0, 0, Math.PI]],
			],
			Z : [
				[new Mesh(scaleHandleGeometry, matBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
				[new Mesh(lineGeometry2, matBlue), [0, 0, 0], [Math.PI / 2, 0, 0]],
				[new Mesh(scaleHandleGeometry, matBlue), [0, 0, -0.5], [-Math.PI / 2, 0, 0]]
			],
			XY : [
				[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matBlueTransparent), [0.15, 0.15, 0]]
			],
			YZ : [
				[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matRedTransparent), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]
			],
			XZ : [
				[new Mesh(new BoxGeometry(0.15, 0.15, 0.01), matGreenTransparent), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]
			],
			XYZ : [
				[new Mesh(new BoxGeometry(0.1, 0.1, 0.1), matWhiteTransparent.clone())],
			]
		};
		
		const pickerScale = {
			X : [
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0.3, 0, 0], [0, 0, -Math.PI / 2]],
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [-0.3, 0, 0], [0, 0, Math.PI / 2]]
			],
			Y : [
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0.3, 0]],
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, -0.3, 0], [0, 0, Math.PI]]
			],
			Z : [
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, 0.3], [Math.PI / 2, 0, 0]],
				[new Mesh(new CylinderGeometry(0.2, 0, 0.6, 4), matInvisible), [0, 0, -0.3], [-Math.PI / 2, 0, 0]]
			],
			XY : [
				[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0.15, 0]],
			],
			YZ : [
				[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0, 0.15, 0.15], [0, Math.PI / 2, 0]],
			],
			XZ : [
				[new Mesh(new BoxGeometry(0.2, 0.2, 0.01), matInvisible), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]],
			],
			XYZ : [
				[new Mesh(new BoxGeometry(0.2, 0.2, 0.2), matInvisible), [0, 0, 0]],
			]
		};
		
		const helperScale = {
			X : [
				[new Line(lineGeometry, matHelper.clone()), [-1e3, 0, 0], null, [1e6, 1, 1], 'helper']
			],
			Y : [
				[new Line(lineGeometry, matHelper.clone()), [0, -1e3, 0], [0, 0, Math.PI / 2], [1e6, 1, 1], 'helper']
			],
			Z : [
				[new Line(lineGeometry, matHelper.clone()), [0, 0, -1e3], [0, -Math.PI / 2, 0], [1e6, 1, 1], 'helper']
			]
		};
		
		// Gizmo creation
		
		this.gizmo = {};
		this.picker = {};
		this.helper = {};
		
		this.add(this.gizmo['translate'] = this.setupGizmo(gizmoTranslate));
		this.add(this.gizmo['rotate'] = this.setupGizmo(gizmoRotate));
		this.add(this.gizmo['scale'] = this.setupGizmo(gizmoScale));
		this.add(this.picker['translate'] = this.setupGizmo(pickerTranslate));
		this.add(this.picker['rotate'] = this.setupGizmo(pickerRotate));
		this.add(this.picker['scale'] = this.setupGizmo(pickerScale));
		this.add(this.helper['translate'] = this.setupGizmo(helperTranslate));
		this.add(this.helper['rotate'] = this.setupGizmo(helperRotate));
		this.add(this.helper['scale'] = this.setupGizmo(helperScale));
		
		// Pickers should be hidden always
		
		this.picker['translate'].visible = false;
		this.picker['rotate'].visible = false;
		this.picker['scale'].visible = false;
		
	}
	
	// Creates an Object3D with gizmos described in custom hierarchy definition.
	
	setupGizmo(gizmoMap) {
		
		const gizmo = new Object3D();
		
		for (const name in gizmoMap) {
			
			for (let i = gizmoMap[name].length; i--;) {
				
				const object = gizmoMap[name][i][0].clone();
				const position = gizmoMap[name][i][1];
				const rotation = gizmoMap[name][i][2];
				const scale = gizmoMap[name][i][3];
				const tag = gizmoMap[name][i][4];
				
				// name and tag properties are essential for picking and updating logic.
				object.name = name;
				object.tag = tag;
				
				if (position) {
					
					object.position.set(position[0], position[1], position[2]);
					
				}
				
				if (rotation) {
					
					object.rotation.set(rotation[0], rotation[1], rotation[2]);
					
				}
				
				if (scale) {
					
					object.scale.set(scale[0], scale[1], scale[2]);
					
				}
				
				object.updateMatrix();
				
				const tempGeometry = object.geometry.clone();
				tempGeometry.applyMatrix4(object.matrix);
				object.geometry = tempGeometry;
				object.renderOrder = Infinity;
				
				object.position.set(0, 0, 0);
				object.rotation.set(0, 0, 0);
				object.scale.set(1, 1, 1);
				
				gizmo.add(object);
				
			}
			
		}
		
		return gizmo;
		
	}
	
	// updateMatrixWorld will update transformations and appearance of individual handles
	
	updateMatrixWorld(force) {
		
		const space = (this.mode === 'scale') ? 'local' : this.space; // scale always oriented to local rotation
		
		const quaternion = (space === 'local') ? this.worldQuaternion : _identityQuaternion;
		
		// Show only gizmos for current transform mode
		
		this.gizmo['translate'].visible = this.mode === 'translate';
		this.gizmo['rotate'].visible = this.mode === 'rotate';
		this.gizmo['scale'].visible = this.mode === 'scale';
		
		this.helper['translate'].visible = this.mode === 'translate';
		this.helper['rotate'].visible = this.mode === 'rotate';
		this.helper['scale'].visible = this.mode === 'scale';
		
		
		let handles = [];
		handles = handles.concat(this.picker[this.mode].children);
		handles = handles.concat(this.gizmo[this.mode].children);
		handles = handles.concat(this.helper[this.mode].children);
		
		for (let i = 0; i < handles.length; i++) {
			
			const handle = handles[i];
			
			// hide aligned to camera
			
			handle.visible = true;
			handle.rotation.set(0, 0, 0);
			handle.position.copy(this.worldPosition);
			
			// 计算缩放
			let factor;
			if (this.camera.isOrthographicCamera) {
				factor = (this.camera.top - this.camera.bottom) / this.camera.zoom;
			} else {
				factor = this.worldPosition.distanceTo(this.cameraPosition) * Math.min(1.9 * Math.tan(Math.PI * this.camera.fov / 360) / this.camera.zoom, 7);
			}
			handle.scale.set(1, 1, 1).multiplyScalar(factor * this.size / 4);
			
			// TODO: simplify helpers and consider decoupling from gizmo
			
			if (handle.tag === 'helper') {
				
				handle.visible = false;
				
				if (handle.name === 'AXIS') {
					
					handle.visible = !!this.axis;
					
					if (this.axis === 'X') {
						
						_tempQuaternion.setFromEuler(_tempEuler.set(0, 0, 0));
						handle.quaternion.copy(quaternion).multiply(_tempQuaternion);
						
						if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this.eye)) > 0.9) {
							
							handle.visible = false;
							
						}
						
					}
					
					if (this.axis === 'Y') {
						
						_tempQuaternion.setFromEuler(_tempEuler.set(0, 0, Math.PI / 2));
						handle.quaternion.copy(quaternion).multiply(_tempQuaternion);
						
						if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this.eye)) > 0.9) {
							
							handle.visible = false;
							
						}
						
					}
					
					if (this.axis === 'Z') {
						
						_tempQuaternion.setFromEuler(_tempEuler.set(0, Math.PI / 2, 0));
						handle.quaternion.copy(quaternion).multiply(_tempQuaternion);
						
						if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this.eye)) > 0.9) {
							
							handle.visible = false;
							
						}
						
					}
					
					if (this.axis === 'XYZE') {
						
						_tempQuaternion.setFromEuler(_tempEuler.set(0, Math.PI / 2, 0));
						_alignVector.copy(this.rotationAxis);
						handle.quaternion.setFromRotationMatrix(_lookAtMatrix.lookAt(_zeroVector, _alignVector, _unitY));
						handle.quaternion.multiply(_tempQuaternion);
						handle.visible = this.dragging;
						
					}
					
					if (this.axis === 'E') {
						
						handle.visible = false;
						
					}
					
					
				} else if (handle.name === 'START') {
					
					handle.position.copy(this.worldPositionStart);
					handle.visible = this.dragging;
					
				} else if (handle.name === 'END') {
					
					handle.position.copy(this.worldPosition);
					handle.visible = this.dragging;
					
				} else if (handle.name === 'DELTA') {
					
					handle.position.copy(this.worldPositionStart);
					handle.quaternion.copy(this.worldQuaternionStart);
					_tempVector.set(1e-10, 1e-10, 1e-10).add(this.worldPositionStart).sub(this.worldPosition).multiplyScalar(-1);
					_tempVector.applyQuaternion(this.worldQuaternionStart.clone().invert());
					handle.scale.copy(_tempVector);
					handle.visible = this.dragging;
					
				} else {
					
					handle.quaternion.copy(quaternion);
					
					if (this.dragging) {
						
						handle.position.copy(this.worldPositionStart);
						
					} else {
						
						handle.position.copy(this.worldPosition);
						
					}
					
					if (this.axis) {
						
						handle.visible = this.axis.search(handle.name) !== -1;
						
					}
					
				}
				
				// If updating helper, skip rest of the loop
				continue;
				
			}
			
			// Align handles to current local or world rotation
			
			handle.quaternion.copy(quaternion);
			
			if (this.mode === 'translate' || this.mode === 'scale') {
				
				// Hide translate and scale axis facing the camera
				
				const AXIS_HIDE_THRESHOLD = 0.99;
				const PLANE_HIDE_THRESHOLD = 0.2;
				
				if (handle.name === 'X') {
					
					if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD) {
						
						handle.scale.set(1e-10, 1e-10, 1e-10);
						handle.visible = false;
						
					}
					
				}
				
				if (handle.name === 'Y') {
					
					if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD) {
						
						handle.scale.set(1e-10, 1e-10, 1e-10);
						handle.visible = false;
						
					}
					
				}
				
				if (handle.name === 'Z') {
					
					if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this.eye)) > AXIS_HIDE_THRESHOLD) {
						
						handle.scale.set(1e-10, 1e-10, 1e-10);
						handle.visible = false;
						
					}
					
				}
				
				if (handle.name === 'XY') {
					
					if (Math.abs(_alignVector.copy(_unitZ).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {
						
						handle.scale.set(1e-10, 1e-10, 1e-10);
						handle.visible = false;
						
					}
					
				}
				
				if (handle.name === 'YZ') {
					
					if (Math.abs(_alignVector.copy(_unitX).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {
						
						handle.scale.set(1e-10, 1e-10, 1e-10);
						handle.visible = false;
						
					}
					
				}
				
				if (handle.name === 'XZ') {
					
					if (Math.abs(_alignVector.copy(_unitY).applyQuaternion(quaternion).dot(this.eye)) < PLANE_HIDE_THRESHOLD) {
						
						handle.scale.set(1e-10, 1e-10, 1e-10);
						handle.visible = false;
						
					}
					
				}
				
			} else if (this.mode === 'rotate') {
				
				// Align handles to current local or world rotation
				
				_tempQuaternion2.copy(quaternion);
				_alignVector.copy(this.eye).applyQuaternion(_tempQuaternion.copy(quaternion).invert());
				
				if (handle.name.search('E') !== -1) {
					
					handle.quaternion.setFromRotationMatrix(_lookAtMatrix.lookAt(this.eye, _zeroVector, _unitY));
					
				}
				
				if (handle.name === 'X') {
					
					_tempQuaternion.setFromAxisAngle(_unitX, Math.atan2(-_alignVector.y, _alignVector.z));
					_tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
					handle.quaternion.copy(_tempQuaternion);
					
				}
				
				if (handle.name === 'Y') {
					
					_tempQuaternion.setFromAxisAngle(_unitY, Math.atan2(_alignVector.x, _alignVector.z));
					_tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
					handle.quaternion.copy(_tempQuaternion);
					
				}
				
				if (handle.name === 'Z') {
					
					_tempQuaternion.setFromAxisAngle(_unitZ, Math.atan2(_alignVector.y, _alignVector.x));
					_tempQuaternion.multiplyQuaternions(_tempQuaternion2, _tempQuaternion);
					handle.quaternion.copy(_tempQuaternion);
					
				}
				
			}
			
			// Hide disabled axes
			handle.visible = handle.visible && (handle.name.indexOf('X') === -1 || this.showX);
			handle.visible = handle.visible && (handle.name.indexOf('Y') === -1 || this.showY);
			handle.visible = handle.visible && (handle.name.indexOf('Z') === -1 || this.showZ);
			handle.visible = handle.visible && (handle.name.indexOf('E') === -1 || (this.showX && this.showY && this.showZ));
			
			// highlight selected axis
			handle.material._color = handle.material._color || handle.material.color.clone();
			handle.material._opacity = handle.material._opacity || handle.material.opacity;
			
			handle.material.color.copy(handle.material._color);
			handle.material.opacity = handle.material._opacity;
			
			if (this.enabled && this.axis) {

				if (handle.name === this.axis) {

					handle.material.color.setHex(0xffff00);
					handle.material.opacity = 1.0;

				} else if (this.axis.split('').some(function (a) {
					
					return handle.name === a;

				})) {

					handle.material.color.setHex(0xffff00);
					handle.material.opacity = 1.0;

				}

			}
			
		}
		
		super.updateMatrixWorld(force);
		
	}
	
}

export {TransformControlsGizmo};
