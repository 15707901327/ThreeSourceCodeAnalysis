/**
 * @author mrdoob / http://mrdoob.com/
 */

/**
 * 创建着色器
 * @param gl 上下文
 * @param type 着色器类型
 * @param string 着色器字符串
 * @returns {WebGLShader}
 * @constructor
 */
function WebGLShader( gl, type, string ) {

	const shader = gl.createShader( type );

	gl.shaderSource( shader, string );
	gl.compileShader( shader );

	return shader;

}

export { WebGLShader };
