import {Ray} from '../math/Ray.js';
import {Layers} from './Layers.js';

/**
 * 参数：
 *  origin：射线的起点向量
 *  direction：射线的方向向量，应该归一化
 *  near：所有返回的结果应该比 near 远。Near不能为负，默认值为0。
 *  far：所有返回的结果应该比 far 近。Far 不能小于 near，默认值为无穷大。
 * */
class Raycaster {
	
	constructor(origin, direction, near = 0, far = Infinity) {
		
		this.ray = new Ray(origin, direction);
		// direction is assumed to be normalized (for accurate distance calculations)
		
		this.near = near;
		this.far = far;
		this.camera = null;
		this.layers = new Layers();
		
		this.params = {
			Mesh : {},
			Line : {threshold : 1},
			LOD : {},
			Points : {threshold : 1},
			Sprite : {}
		};
		
	}
	
	set(origin, direction) {
		
		// direction is assumed to be normalized (for accurate distance calculations)
		
		this.ray.set(origin, direction);
		
	}
	
	setFromCamera(coords, camera) {
		
		if (camera.isPerspectiveCamera) {
			
			this.ray.origin.setFromMatrixPosition(camera.matrixWorld);
			this.ray.direction.set(coords.x, coords.y, 0.5).unproject(camera).sub(this.ray.origin).normalize();
			this.camera = camera;
			
		} else if (camera.isOrthographicCamera) {
			
			this.ray.origin.set(coords.x, coords.y, (camera.near + camera.far) / (camera.near - camera.far)).unproject(camera); // set origin in plane of camera
			this.ray.direction.set(0, 0, -1).transformDirection(camera.matrixWorld);
			this.camera = camera;
			
		} else {
			
			console.error('THREE.Raycaster: Unsupported camera type: ' + camera.type);
			
		}
		
	}
	
	/**
	 * 参数：
	 *  object：检测该物体是否与射线相交
	 *  recursive：如果设置，则会检测物体所有的子代
	 * 返回：
	 *  相交的结果会以一个数组的形式返回，其中的元素依照距离排序，越近的排在越前
	 */
	intersectObject(object, recursive = true, intersects = []) {
		
		intersectObject(object, this, intersects, recursive);
		intersects.sort(ascSort);
		return intersects;
		
	}
	
	/**
	 * 参数：
	 *  object：检测这些物体是否与射线相交
	 *  recursive：true 检测设备的所有子类
	 * 返回：
	 *  相交的结果会以一个数组的形式返回，其中的元素依照距离排序，越近的排在越前
	 */
	intersectObjects(objects, recursive = true, intersects = []) {
		
		for (let i = 0, l = objects.length; i < l; i++) {
			
			intersectObject(objects[i], this, intersects, recursive);
			
		}
		
		intersects.sort(ascSort);
		
		return intersects;
		
	}
	
}

function ascSort(a, b) {
	
	return a.distance - b.distance;
	
}

function intersectObject(object, raycaster, intersects, recursive) {
	
	if (object.layers.test(raycaster.layers)) {
		
		object.raycast(raycaster, intersects);
		
	}
	
	if (recursive === true) {
		
		const children = object.children;
		
		for (let i = 0, l = children.length; i < l; i++) {
			
			intersectObject(children[i], raycaster, intersects, true);
			
		}
		
	}
	
}

export {Raycaster};
