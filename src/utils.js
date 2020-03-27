/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * 获取数组中最小值
 * @param array
 * @returns {number|*}
 */
function arrayMin( array ) {

	if ( array.length === 0 ) return Infinity;

	var min = array[ 0 ];

	for ( var i = 1, l = array.length; i < l; ++ i ) {

		if ( array[ i ] < min ) min = array[ i ];

	}

	return min;

}

/**
 * 获取数组中最大值
 * @param array
 * @returns {number|*}
 */
function arrayMax( array ) {
	if ( array.length === 0 ) return - Infinity;
	var max = array[ 0 ];
	for ( var i = 1, l = array.length; i < l; ++ i ) {
		if ( array[ i ] > max ) max = array[ i ];
	}
	return max;
}

export { arrayMin, arrayMax };
