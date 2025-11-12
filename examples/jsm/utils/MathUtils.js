class MathUtils {

	/**
	 * c点到垂线的向量
	 * @param A {THREE.Vector2}
	 * @param B {THREE.Vector2}
	 * @param C {THREE.Vector2}
	 * @returns {number}
	 */
	static verticalVector(A, B, C) {
		let ac = A.clone();
		ac.subVectors(C, A);

		let ab = A.clone();
		ab.subVectors(B, A);

		// A到垂点向量
		let ad = ab.clone();
		ad.multiplyScalar(ac.dot(ab) / (ab.length() * ab.length()));

		let cd = ad.clone();
		cd.sub(ac);
		return cd;
	}

	/**
	 * 根据两点求出垂线过第三点的直线的交点
	 * @param pt1 {THREE.Vector2}
	 * @param pt2 {THREE.Vector2}
	 * @param c {THREE.Vector2}
	 * @returns {number}
	 */
	static calculateVerticalPoint(pt1, pt2, c) {
		let cd = MathUtils.verticalVector(pt1, pt2, c);

		let d = c.clone();
		d.add(cd);
		return d;
	}

	/**
	 * 获取线是否平行
	 * a,b 线上两点
	 * c,d 线上两点
	 * @returns {boolean}
	 */
	static isIntersection(a, b, c, d) {
		let ab = a.clone();
		ab.sub(b)

		let cd = c.clone();
		cd.sub(d);

		if (Math.abs(ab.y * cd.x - ab.x * cd.y) < 0.00001) {
			return false;
		}

		return true;
	}

	/**
	 * 获取两条线线的交点
	 * a,b 线上两点
	 * c,d 线上两点
	 */
	static getIntersection(a, b, c, d) {

		let intersection = a.clone();
		intersection.x = ((b.x - a.x) * (c.x - d.x) * (c.y - a.y) - c.x * (b.x - a.x) * (c.y - d.y) + a.x * (b.y - a.y) * (c.x - d.x)) / ((b.y - a.y) * (c.x - d.x) - (b.x - a.x) * (c.y - d.y));
		intersection.y = ((b.y - a.y) * (c.y - d.y) * (c.x - a.x) - c.y * (b.y - a.y) * (c.x - d.x) + a.y * (b.x - a.x) * (c.y - d.y)) / ((b.x - a.x) * (c.y - d.y) - (b.y - a.y) * (c.x - d.x));

		return intersection;
	}

	/**
	 * 判断向量是否同向
	 */
	static isSameDirection(v, d, p) {
		let vd = d.clone();
		vd.sub(v);

		let vp = p.clone();
		vp.sub(v);

		let cos = vd.dot(vp);
		if (cos < 0) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * 判断是否为同一个点
	 * @param point1
	 * @param point2
	 */
	static isSamePoint(A, A1) {
		let EPSILON = 0.01;
		if (Math.abs(A.x - A1.x) < EPSILON && Math.abs(A.y - A1.y) < EPSILON) {
			return true;
		}else{
			return false;
		}
	}

	static isOnLine(A, B, V) {
		let av = V.clone();
		av.sub(A);
		let ab = B.clone();
		ab.sub(A);
		let cosvab = av.dot(ab);

		let bv = V.clone();
		bv.sub(B);
		let ba = A.clone();
		ba.sub(B);
		let cosvba = bv.dot(ba);

		if (cosvab >= 0.0 && cosvba >= 0.0) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * 计算cosABC
	 * @param A {THREE.Vector2}
	 * @param B {THREE.Vector2}
	 * @param C {THREE.Vector2}
	 */
	static computeCos(A, B, C) {

		let BA = A.clone();
		BA.sub(B);
		let BC = C.clone();
		BC.sub(B);

		return BA.dot(BC) / (BA.length() * BC.length());
	}
}

export { MathUtils };