var gltf = {
  "accessors": [
    {
      "bufferView": 2,
      "componentType": 5126,
      "count": 24,
      "max": [
        12853.1611328125,
        8473.9443359375,
        86089.046875
      ],
      "min": [
        -12853.1611328125,
        -8473.9443359375,
        0
      ],
      "type": "VEC3"
    },
    {
      "bufferView": 2,
      "byteOffset": 288,
      "componentType": 5126,
      "count": 24,
      "max": [
        1,
        1,
        1
      ],
      "min": [
        -1,
        -1,
        -1
      ],
      "type": "VEC3"
    },
    {
      "bufferView": 3,
      "componentType": 5126,
      "count": 24,
      "max": [
        1,
        1,
        0,
        1
      ],
      "min": [
        -1,
        -1,
        0,
        1
      ],
      "type": "VEC4"
    },
    {
      "bufferView": 1,
      "componentType": 5126,
      "count": 24,
      "max": [
        1,
        1
      ],
      "min": [
        0,
        0
      ],
      "type": "VEC2"
    },
    {
      "bufferView": 0,
      "componentType": 5125,
      "count": 36,
      "max": [
        23
      ],
      "min": [
        0
      ],
      "type": "SCALAR"
    },
    {
      "bufferView": 4,
      "componentType": 5126,
      "count": 101,
      "max": [
        3.3333332538604736
      ],
      "min": [
        0
      ],
      "type": "SCALAR"
    },
    {
      "bufferView": 5,
      "componentType": 5126,
      "count": 101,
      "max": [
        0.46818733215332031,
        0.70709228515625,
        0.70709228515625,
        0.70710676908493042
      ],
      "min": [
        -0.70710676908493042,
        -0.49147742986679077,
        -0.49147742986679077,
        -0.46818733215332031
      ],
      "type": "VEC4"
    }
  ],
  "animations": [
    {
      "channels": [
        {
          "sampler": 0,
          "target": {
            "node": 5, // 动画节点下标
            "path": "rotation" // 动画类型
          }
        }
      ],
      "name": "Take 001",
      // 取样器
      "samplers": [
        {
          "input": 5, // 时间值
          "interpolation": "LINEAR", // 插值类型
          "output": 6 // 对象相关属性值
        }
      ]
    }
  ],
  "asset": {
    "extras": {
      "author": "Yangpengcheng (https://sketchfab.com/Yangpengcheng)",
      "license": "CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)",
      "source": "https://sketchfab.com/3d-models/donghua-001-3e9525afb22b4b61a2248ed09cdea7f5",
      "title": "Donghua 001"
    },
    "generator": "Sketchfab-6.82.0",
    "version": "2.0"
  },
  "bufferViews": [
    {
      "buffer": 0,
      "byteLength": 144,
      "byteOffset": 0,
      "name": "floatBufferViews",
      "target": 34963
    },
    {
      "buffer": 0,
      "byteLength": 192,
      "byteOffset": 144,
      "byteStride": 8,
      "name": "floatBufferViews",
      "target": 34962
    },
    {
      "buffer": 0,
      "byteLength": 576,
      "byteOffset": 336,
      "byteStride": 12,
      "name": "floatBufferViews",
      "target": 34962
    },
    {
      "buffer": 0,
      "byteLength": 384,
      "byteOffset": 912,
      "byteStride": 16,
      "name": "floatBufferViews",
      "target": 34962
    },
    {
      "buffer": 0,
      "byteLength": 404,
      "byteOffset": 1296,
      "name": "floatBufferViews"
    },
    {
      "buffer": 0,
      "byteLength": 1616,
      "byteOffset": 1700,
      "byteStride": 16,
      "name": "floatBufferViews"
    }
  ],
  "buffers": [
    {
      "byteLength": 3316,
      "uri": "scene.bin"
    }
  ],
  "materials": [
    {
      "doubleSided": true,
      "name": "Scene_-_Root",
      "pbrMetallicRoughness": {
        "baseColorFactor": [
          1,
          1,
          1,
          1
        ],
        "metallicFactor": 0,
        "roughnessFactor": 0.59999999999999998
      }
    }
  ],
  "meshes": [
    {
      "name": "Box001__0",
      // mesh相关属性
      "primitives": [
        {
          "attributes": {
            "NORMAL": 1,
            "POSITION": 0,
            "TANGENT": 2,
            "TEXCOORD_0": 3
          },
          "indices": 4,
          "material": 0,
          "mode": 4, // 模型绘制方式
          "isSkinnedMesh":false
        }
      ]
    }
  ],
  "nodes": [
    {
      "children": [
        1
      ],
      "name": "RootNode (gltf orientation matrix)",
      "rotation": [
        -0.70710678118654746,
        -0,
        -0,
        0.70710678118654757
      ]
    },
    {
      "children": [
        2
      ],
      "name": "RootNode (model correction matrix)"
    },
    {
      "children": [
        3
      ],
      "matrix": [
        1,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        -1,
        0,
        0,
        0,
        0,
        0,
        1
      ],
      "name": "71a3c2961063436a978b251478b01ed1.fbx"
    },
    {
      "children": [
        4
      ],
      "name": ""
    },
    {
      "children": [
        5
      ],
      "name": "RootNode"
    },
    {
      "children": [
        6
      ],
      "name": "Box001", // 节点名称
      "rotation": [
        -0.7071068286895752,
        -0,
        0,
        0.7071068286895752
      ],
      "translation": [
        -23343.8828125,
        0,
        78644.6875
      ]
    },
    {
      "mesh": 0,
      "name": "Box001__0"
    }
  ],
  "scene": 0,
  "scenes": [
    {
      "name": "OSG_Scene",
      "nodes": [
        0
      ]
    }
  ]
};

