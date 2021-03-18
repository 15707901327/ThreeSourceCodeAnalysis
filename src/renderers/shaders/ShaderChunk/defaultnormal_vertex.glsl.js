export default /* glsl */`
vec3 transformedNormal = objectNormal;

// 使用instance
#ifdef USE_INSTANCING

	transformedNormal = mat3( instanceMatrix ) * transformedNormal;

#endif

transformedNormal = normalMatrix * transformedNormal;

// 翻面
#ifdef FLIP_SIDED

	transformedNormal = - transformedNormal;

#endif

// 切线
#ifdef USE_TANGENT

	vec3 transformedTangent = normalMatrix * objectTangent;

	#ifdef FLIP_SIDED

		transformedTangent = - transformedTangent;

	#endif

#endif
`;
