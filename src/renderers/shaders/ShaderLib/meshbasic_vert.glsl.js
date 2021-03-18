export default /* glsl */`
#include <common> // 包含着色器公共模块(包含常用的数学工具函数以及一些常量定义什么的)
#include <uv_pars_vertex> // 包含处理uv所需要的一些定义
#include <uv2_pars_vertex> // 包含处理uv2所需要的一些定义
#include <envmap_pars_vertex> 
#include <color_pars_vertex> // 包含顶点颜色所需要的定义
#include <fog_pars_vertex>  // 包含雾化效果所需要的定义
#include <morphtarget_pars_vertex> // 包含变形动画所需要的定义
#include <skinning_pars_vertex> // 包含蒙皮动画所需要的定义
#include <logdepthbuf_pars_vertex>  // 包含深度处理的一些定义
#include <clipping_planes_pars_vertex> // 包含裁剪平面所需要的一些定义

void main() {

	#include <uv_vertex> // uv 数据处理
	#include <uv2_vertex> // uv2 数据处理
	#include <color_vertex>  // 颜色 数据处理
	#include <skinbase_vertex>

	#ifdef USE_ENVMAP

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>

	#endif

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex> // logDepth深度运算

	#include <worldpos_vertex>  // 世界坐标运算
	#include <clipping_planes_vertex>  // 裁剪平面运算
	#include <envmap_vertex>
	#include <fog_vertex>  // 雾化所需要的运算

}
`;
