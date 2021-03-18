export default /* glsl */`
#define LAMBERT

varying vec3 vLightFront;
varying vec3 vIndirectFront;

// 处理渲染正反面
#ifdef DOUBLE_SIDED
	varying vec3 vLightBack;
	varying vec3 vIndirectBack;
#endif
 
#include <common>             // 包含着色器公共模块(包含常用的数学工具函数以及一些常量定义等)
#include <uv_pars_vertex>     // 包含处理uv所需要的一些定义 USE_LIGHTMAP、USE_AOMAP
#include <uv2_pars_vertex>    // 包含处理uv2所需要的一些定义
#include <envmap_pars_vertex> // 包含贴图相关的一些定义
#include <bsdfs>              // 包含灯光相关计算方法
#include <lights_pars_begin>  // 包含灯光相关的一些定义
#include <color_pars_vertex>  // 包含顶点颜色所需要的定义
#include <fog_pars_vertex>    // 包含雾化效果所需要的定义
#include <morphtarget_pars_vertex>      // 包含变形动画所需要的定义
#include <skinning_pars_vertex>         // 包含蒙皮动画所需要的定义
#include <shadowmap_pars_vertex>        // 包含阴影贴图所需的定义
#include <logdepthbuf_pars_vertex>      // 包含对数深度缓存所需的定义
#include <clipping_planes_pars_vertex>  // 包含裁剪平面所需要的一些定义

void main() {

	#include <uv_vertex>    // uv
	#include <uv2_vertex>   // uv2
	#include <color_vertex> // color

	#include <beginnormal_vertex>    // 法线
	#include <morphnormal_vertex>    // 平面法线
	#include <skinbase_vertex>       // 蒙皮
	#include <skinnormal_vertex>     // 蒙皮处理
	#include <defaultnormal_vertex>  // 处理法线

	#include <begin_vertex>            // 顶点坐标
	#include <morphtarget_vertex>      // USE_MORPHTARGETS
	#include <skinning_vertex>         // 处理蒙皮
	#include <project_vertex>          // 投影处理
	#include <logdepthbuf_vertex>      // 深度对数缓存
	#include <clipping_planes_vertex>  // 裁剪面处理

	#include <worldpos_vertex>        // 世界坐标
	#include <envmap_vertex>          // 环境贴图
	#include <lights_lambert_vertex>  // 灯光处理
	#include <shadowmap_vertex>       // 阴影贴图
	#include <fog_vertex>             // 雾化处理
}
`;
