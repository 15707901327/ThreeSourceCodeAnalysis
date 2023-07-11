import {
	DoubleSide,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
	Quaternion,
	Vector3
} from 'three';

class TransformControlsPlane extends Mesh {
	
	constructor() {
		
		super(
			new PlaneGeometry(500, 500, 2, 2),
			new MeshBasicMaterial({
				visible : false,
				wireframe : false,
				side : DoubleSide,
				transparent : true,
				opacity : 1.0,
				toneMapped : false,
				color : 0xff0000
			})
		);
		
		this.isTransformControlsPlane = true;
		
		this.type = 'TransformControlsPlane';
		
	}
	
	updateMatrixWorld(force) {
		
		const _tempVector = new Vector3();

		// Reusable utility variables
		const _alignVector = new Vector3(0, 1, 0);
		const _identityQuaternion = new Quaternion();
		const _dirVector = new Vector3();
		
		let space = this.space;
		
		this.position.copy(this.worldPosition);
		
		if (this.mode === 'scale') space = 'local'; // scale always oriented to local rotation
		
		const _unitX = new Vector3(1, 0, 0);
		const _unitY = new Vector3(0, 1, 0);
		const _unitZ = new Vector3(0, 0, 1);
		
		const _v1 = new Vector3();
		const _v2 = new Vector3();
		const _v3 = new Vector3();
		
		_v1.copy(_unitX).applyQuaternion(space === 'local' ? this.worldQuaternion : _identityQuaternion);
		_v2.copy(_unitY).applyQuaternion(space === 'local' ? this.worldQuaternion : _identityQuaternion);
		_v3.copy(_unitZ).applyQuaternion(space === 'local' ? this.worldQuaternion : _identityQuaternion);
		
		// Align the plane for current transform mode, axis and space.
		
		_alignVector.copy(_v2);
		
		switch (this.mode) {
			
			case 'translate':
			case 'scale':
				switch (this.axis) {
					
					case 'X':
						_alignVector.copy(this.eye).cross(_v1);
						_dirVector.copy(_v1).cross(_alignVector);
						break;
					case 'Y':
						_alignVector.copy(this.eye).cross(_v2);
						_dirVector.copy(_v2).cross(_alignVector);
						break;
					case 'Z':
						_alignVector.copy(this.eye).cross(_v3);
						_dirVector.copy(_v3).cross(_alignVector);
						break;
					case 'XY':
						_dirVector.copy(_v3);
						break;
					case 'YZ':
						_dirVector.copy(_v1);
						break;
					case 'XZ':
						_alignVector.copy(_v3);
						_dirVector.copy(_v2);
						break;
					case 'XYZ':
					case 'E':
						_dirVector.set(0, 0, 0);
						break;
					
				}
				
				break;
			case 'rotate':
			default:
				// special case for rotate
				_dirVector.set(0, 0, 0);
			
		}
		
		if (_dirVector.length() === 0) {
			
			// If in rotate mode, make the plane parallel to camera
			this.quaternion.copy(this.cameraQuaternion);
			
		} else {
			
			const _tempMatrix = new Matrix4();
			_tempMatrix.lookAt(_tempVector.set(0, 0, 0), _dirVector, _alignVector);
			
			this.quaternion.setFromRotationMatrix(_tempMatrix);
			
		}
		
		super.updateMatrixWorld(force);
		
	}
	
}

export {TransformControlsPlane};
