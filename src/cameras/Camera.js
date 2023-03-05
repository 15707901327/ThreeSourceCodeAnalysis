import { Matrix4 } from '../math/Matrix4.js';
import { Object3D } from '../core/Object3D.js';

class Camera extends Object3D {

	constructor() {

		super();

		this.isCamera = true;

	this.type = 'Camera';

	this.matrixWorldInverse = new Matrix4(); // 视图矩阵
	this.projectionMatrix = new Matrix4(); // 投影矩阵
	this.projectionMatrixInverse = new Matrix4(); // 投影矩阵的逆矩阵

}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.matrixWorldInverse.copy( source.matrixWorldInverse );
		this.projectionMatrix.copy( source.projectionMatrix );
		this.projectionMatrixInverse.copy( source.projectionMatrixInverse );

		return this;

			}

	getWorldDirection( target ) {

		this.updateWorldMatrix( true, false );

		const e = this.matrixWorld.elements;

		return target.set( - e[ 8 ], - e[ 9 ], - e[ 10 ] ).normalize();

	}

  /**
	 * 更新相机以及相机子类的本地和世界坐标矩阵
	 * 设置matrixWorld的倒数矩阵matrixWorldInverse
   * @param force
   */
	updateMatrixWorld( force ) {

		super.updateMatrixWorld( force );

		this.matrixWorldInverse.copy( this.matrixWorld ).invert();

	}

	updateWorldMatrix( updateParents, updateChildren ) {

		super.updateWorldMatrix( updateParents, updateChildren );

		this.matrixWorldInverse.copy( this.matrixWorld ).invert();

	}

	clone() {

		return new this.constructor().copy( this );

	}

}

export { Camera };
