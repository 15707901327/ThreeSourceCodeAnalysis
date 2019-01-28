// javascript-astar 0.4.1
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Implements the astar search algorithm in javascript using a Binary Heap.
// Includes Binary Heap (with modifications) from Marijn Haverbeke.
// http://eloquentjavascript.net/appendix2.html
(function (definition) {
	/* global module, define */
	if (typeof module === 'object' && typeof module.exports === 'object') {
		module.exports = definition();
	} else if (typeof define === 'function' && define.amd) {
		define([], definition);
	} else {
		var exports = definition();
		window.astar = exports.astar;
		window.Graph = exports.Graph;
	}
})(function () {

	function pathTo(node) {
		var curr = node;
		var path = [];
		while (curr.parent) {
			path.unshift(curr);
			curr = curr.parent;
		}
		return path;
	}

	/**
	 * 获取一个二叉堆的实例
	 * @return {BinaryHeap}
	 */
	function getHeap() {
		return new BinaryHeap(function (node) {
			return node.f;
		});
	}

	var astar = {
		/**
		 * Perform an A* Search on a graph given a start and end node.
		 * @param {Graph} graph
		 * @param {GridNode} start 开始节点
		 * @param {GridNode} end 结束节点
		 * @param {Object} [options]
		 * @param {bool} [options.closest] 指定在目标无法访问时是否将路径返回到最近的节点。
		 * @param {Function} [options.heuristic] 启发式功能（参见astar.heuristics）。
		 */
		search: function (graph, start, end, options) {
			/**
			 * 1. 重置graph结构中保存的数据
			 */
			graph.cleanDirty();

			options = options || {};
			var heuristic = options.heuristic || astar.heuristics.manhattan;
			var closest = options.closest || false;

			var openHeap = getHeap();
			var closestNode = start; // 将开始节点设置为最接近的节点

			// 曼哈顿距离
			start.h = heuristic(start, end);
			graph.markDirty(start);

			openHeap.push(start);

			while (openHeap.size() > 0) {

				// 获取堆中最后一个元素
				var currentNode = openHeap.pop();

				// End case -- result has been found, return the traced path.
				if (currentNode === end) {
					return pathTo(currentNode);
				}

				// 正常情况 - 将currentNode从打开移动到关闭，处理其每个邻居。
				currentNode.closed = true;

				// 查找当前节点的所有邻居。
				var neighbors = graph.neighbors(currentNode);

				for (var i = 0, il = neighbors.length; i < il; ++i) {
					var neighbor = neighbors[i];

					if (neighbor.closed || neighbor.isWall()) {
						// Not a valid node to process, skip to next neighbor.
						continue;
					}

					// g得分是从开始到当前节点的最短距离。
					// 我们需要检查我们到达这个邻居的路径是否是我们所见过的最短路径。
					var gScore = currentNode.g + neighbor.getCost(currentNode);
					var beenVisited = neighbor.visited;

					if (!beenVisited || gScore < neighbor.g) {

						// 找到该节点的最佳（到目前为止）路径。 获取节点的分数，看看它有多好。
						neighbor.visited = true;
						neighbor.parent = currentNode; // 上一个节点
						neighbor.h = neighbor.h || heuristic(neighbor, end); // 到结束点x、y之和
						neighbor.g = gScore; // g得分是从开始到当前节点的最短距离。
						neighbor.f = neighbor.g + neighbor.h;
						graph.markDirty(neighbor);
						if (closest) {
							// If the neighbour is closer than the current closestNode or if it's equally close but has
							// a cheaper path than the current closest node then it becomes the closest node
							if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
								closestNode = neighbor;
							}
						}

						if (!beenVisited) {
							// 推送到堆将根据'f'值将其放在适当的位置。
							openHeap.push(neighbor);
						} else {
							// 已经看过节点了，但是因为它已被重新调整，我们需要在堆中对它重新排序
							openHeap.rescoreElement(neighbor);
						}
					}
				}
			}

			if (closest) {
				return pathTo(closestNode);
			}

			// No result was found - empty array signifies failure to find path.
			return [];
		},
		// See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
		heuristics: {
			/**
			 * 出租车几何或曼哈顿距离
			 * @param pos0
			 * @param pos1
			 * @return {number}
			 */
			manhattan: function (pos0, pos1) {
				var d1 = Math.abs(pos1.x - pos0.x);
				var d2 = Math.abs(pos1.y - pos0.y);
				return d1 + d2;
			},
			diagonal: function (pos0, pos1) {
				var D = 1;
				var D2 = Math.sqrt(2);
				var d1 = Math.abs(pos1.x - pos0.x);
				var d2 = Math.abs(pos1.y - pos0.y);
				return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
			}
		},
		/**
		 * 设置节点的基本参数为默认状态
		 * @param node
		 */
		cleanNode: function (node) {
			node.f = 0; // 开始到结束点当前的最短距离
			node.g = 0; // 开始点到当前点的最短距离
			node.h = 0; // 当前节点到结束点的曼哈顿距离
			node.visited = false; // 标记是否经过过该节点
			node.closed = false;
			node.parent = null; // 到达该节点的上一个节点
		}
	};

	/**
	 * 记录绘图的结构(A graph memory structure)
	 * @param {Array} gridIn 2D array of input weights
	 * @param {Object} [options]
	 * @param {bool} [options.diagonal] Specifies whether diagonal moves are allowed
	 */
	function Graph(gridIn, options) {
		options = options || {};
		this.nodes = []; // 一维数组保存节点{x,y,weight}
		this.diagonal = !!options.diagonal;
		this.grid = []; // 二维数组保存节点
		for (var x = 0; x < gridIn.length; x++) {
			this.grid[x] = [];

			for (var y = 0, row = gridIn[x]; y < row.length; y++) {
				var node = new GridNode(x, y, row[y]);
				this.grid[x][y] = node;
				this.nodes.push(node);
			}
		}
		this.init();
	}

	/**
	 * 初始化节点
	 */
	Graph.prototype.init = function () {
		this.dirtyNodes = []; // 存放脏节点
		for (var i = 0; i < this.nodes.length; i++) {
			astar.cleanNode(this.nodes[i]);
		}
	};

	/**
	 * 把节点改变了的值，重置为初始状态，
	 * 设置数组this.dirtyNodes = []
	 */
	Graph.prototype.cleanDirty = function () {
		for (var i = 0; i < this.dirtyNodes.length; i++) {
			astar.cleanNode(this.dirtyNodes[i]);
		}
		this.dirtyNodes = [];
	};

	/**
	 * 添加数据
	 * @param node
	 */
	Graph.prototype.markDirty = function (node) {
		this.dirtyNodes.push(node);
	};

	/**
	 * 获取当前节点的邻居
	 * @param node
	 * @return {Array}
	 */
	Graph.prototype.neighbors = function (node) {
		var ret = [];
		var x = node.x;
		var y = node.y;
		var grid = this.grid;

		// West
		if (grid[x - 1] && grid[x - 1][y]) {
			ret.push(grid[x - 1][y]);
		}

		// East
		if (grid[x + 1] && grid[x + 1][y]) {
			ret.push(grid[x + 1][y]);
		}

		// South
		if (grid[x] && grid[x][y - 1]) {
			ret.push(grid[x][y - 1]);
		}

		// North
		if (grid[x] && grid[x][y + 1]) {
			ret.push(grid[x][y + 1]);
		}

		if (this.diagonal) {
			// Southwest
			if (grid[x - 1] && grid[x - 1][y - 1]) {
				ret.push(grid[x - 1][y - 1]);
			}

			// Southeast
			if (grid[x + 1] && grid[x + 1][y - 1]) {
				ret.push(grid[x + 1][y - 1]);
			}

			// Northwest
			if (grid[x - 1] && grid[x - 1][y + 1]) {
				ret.push(grid[x - 1][y + 1]);
			}

			// Northeast
			if (grid[x + 1] && grid[x + 1][y + 1]) {
				ret.push(grid[x + 1][y + 1]);
			}
		}

		return ret;
	};

	Graph.prototype.toString = function () {
		var graphString = [];
		var nodes = this.grid;
		for (var x = 0; x < nodes.length; x++) {
			var rowDebug = [];
			var row = nodes[x];
			for (var y = 0; y < row.length; y++) {
				rowDebug.push(row[y].weight);
			}
			graphString.push(rowDebug.join(" "));
		}
		return graphString.join("\n");
	};

	/**
	 * 网格节点的基本数据
	 * @param x 坐标
	 * @param y 坐标
	 * @param weight 权重
	 * @constructor
	 */
	function GridNode(x, y, weight) {
		this.x = x;
		this.y = y;
		this.weight = weight;
	}

	GridNode.prototype.toString = function () {
		return "[" + this.x + " " + this.y + "]";
	};

	/**
	 * 获取到fromNeighbor节点的距离
	 * @param fromNeighbor
	 * @return {*}
	 */
	GridNode.prototype.getCost = function (fromNeighbor) {
		// Take diagonal weight into consideration.
		if (fromNeighbor && fromNeighbor.x !== this.x && fromNeighbor.y !== this.y) {
			return this.weight * 1.41421;
		}
		return this.weight;
	};

	GridNode.prototype.isWall = function () {
		return this.weight === 0;
	};

	/**
	 * 二叉堆
	 *     小
	 *    /  \
	 *   大   大
	 * @param scoreFunction
	 * @constructor
	 */
	function BinaryHeap(scoreFunction) {
		this.content = []; // 保存节点
		this.scoreFunction = scoreFunction; // 获取节点f值
	}

	BinaryHeap.prototype = {
		/**
		 * 将新元素添加到数组的末尾。
		 * @param element
		 */
		push: function (element) {
			// 将新元素添加到数组的末尾。
			this.content.push(element);

			// Allow it to sink down.
			this.sinkDown(this.content.length - 1);
		},
		/**
		 * 弹出堆中第一个值
		 * @return {*}
		 */
		pop: function () {
			// Store the first element so we can return it later.
			var result = this.content[0];
			// Get the element at the end of the array.
			var end = this.content.pop();
			// If there are any elements left, put the end element at the
			// start, and let it bubble up.
			if (this.content.length > 0) {
				this.content[0] = end;
				this.bubbleUp(0);
			}
			return result;
		},
		remove: function (node) {
			var i = this.content.indexOf(node);

			// When it is found, the process seen in 'pop' is repeated
			// to fill up the hole.
			var end = this.content.pop();

			if (i !== this.content.length - 1) {
				this.content[i] = end;

				if (this.scoreFunction(end) < this.scoreFunction(node)) {
					this.sinkDown(i);
				} else {
					this.bubbleUp(i);
				}
			}
		},
		/**
		 * 二叉树数组长度
		 * @return {number}
		 */
		size: function () {
			return this.content.length;
		},
		rescoreElement: function (node) {
			this.sinkDown(this.content.indexOf(node));
		},
		/**
		 *
		 * @param n
		 */
		sinkDown: function (n) {
			// 获取必须沉没的元素。
			var element = this.content[n];

			// 当为0时，元素不能再下沉。
			while (n > 0) {

				// 计算父元素的索引，然后获取它。
				var parentN = ((n + 1) >> 1) - 1;
				var parent = this.content[parentN];
				// 如果父元素更大，则交换元素。
				if (this.scoreFunction(element) < this.scoreFunction(parent)) {
					this.content[parentN] = element;
					this.content[n] = parent;
					// Update 'n' to continue at the new position.
					n = parentN;
				}
				// Found a parent that is less, no need to sink any further.
				else {
					break;
				}
			}
		},
		bubbleUp: function (n) {
			// 查找目标元素及其分数。
			var length = this.content.length;
			var element = this.content[n];
			var elemScore = this.scoreFunction(element);

			while (true) {
				// 计算子元素的索引。
				var child2N = (n + 1) << 1;
				var child1N = child2N - 1;
				// 这用于存储元素的新位置（如果有）。
				var swap = null;
				var child1Score;
				// 如果存在第一个子节点（在数组内）...
				if (child1N < length) {
					// 查找并计算其得分。
					var child1 = this.content[child1N];
					child1Score = this.scoreFunction(child1);

					// 如果分数小于我们的元素，我们需要交换。
					if (child1Score < elemScore) {
						swap = child1N;
					}
				}

				// Do the same checks for the other child.
				if (child2N < length) {
					var child2 = this.content[child2N];
					var child2Score = this.scoreFunction(child2);
					if (child2Score < (swap === null ? elemScore : child1Score)) {
						swap = child2N;
					}
				}

				// If the element needs to be moved, swap it, and continue.
				if (swap !== null) {
					this.content[n] = this.content[swap];
					this.content[swap] = element;
					n = swap;
				}
				// Otherwise, we are done.
				else {
					break;
				}
			}
		}
	};

	return {
		astar: astar,
		Graph: Graph
	};

});