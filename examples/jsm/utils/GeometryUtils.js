/**
 * FMGeometryUtils是Geometry工具类 存放通用的一些工具函数
 */
class GeometryUtils {
	/**
	 * @constructor
	 */
	constructor() {}

	/**
	 * 按比例放大值
	 * @param targetPoints { Array } 目标数组
	 * @param points {Array} 点的数组
	 * @param scaleValue {number} 放大值
	 * @returns {[]}
	 */
	static scalePointsValue(targetPoints, points, scaleValue) {

		let vecArr = [];

		for (let i = 0; i < points.length - 1; i++) {
			let A = new THREE.Vector2(points[i].x, points[i].y);
			let B = new THREE.Vector2(points[i + 1].x, points[i + 1].y);

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
			vecabT.setLength(5.0);

			if (vecArr[i] !== undefined) {
				vecArr[i].add(vecabT);
			} else {
				vecArr[i] = vecabT;
			}

			vecArr[i + 1] = vecabT;
		}

		console.log("向量数组", targetPoints);
		return targetPoints;
	}
}

export { GeometryUtils };
