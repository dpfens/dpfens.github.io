---
layout: post
title: "petgraph-wasm: Fast Graph Algorithms for the Browser"
description: "A WebAssembly port of Rust's petgraph for JavaScript and TypeScript. It runs graph algorithms like shortest paths, centrality, max flow, and cliques on thousands of nodes in under a millisecond, fast enough to use inside an interactive UI."
keywords: graph algorithms, WebAssembly, WASM, Rust, TypeScript, JavaScript, Node.js, petgraph, browser, real-time, network analysis, graph visualization, dependency graph, DAG, topological sort, cycle detection, connected components, graph coloring, scheduling, max flow, minimum cost flow, shortest path, centrality, typed arrays, local-first, graphology alternative
tags: typescript math graph rust wasm
introduction: "Graphs show up everywhere, but in the browser, anything beyond a small graph usually means a server round trip or a frozen UI. petgraph-wasm brings Rust's petgraph library to JavaScript through WebAssembly, so most operations on a 5,000-node graph finish in well under a millisecond, leaving room to run several analyses inside a single 16 ms frame."
---

A few years ago, a project at work had me solving a problem with min-cost flow. I'd known graphs as a data structure, but this was the first time I saw a messy real-world problem collapse into a clean, solvable model. That sent me down a path of reading about graph algorithms in my spare time, which turned into several years of it. The more I learned, the more problems I recognized as graph problems in disguise: scheduling, assignment, dependencies, routing. Modeled that way, they often had solutions that were both better and cheaper to compute than the ad hoc approaches people reached for.

The catch was where those solutions could run. The tools I used were Python libraries like `networkx`, which is pleasant but slow, and `graph-tool`, which is fast but firmly server-side. Getting anything interesting in front of a user meant building and running a backend just to answer a graph question. I didn't want my ideas tied to a particular stack or to infrastructure someone had to pay for and maintain.

So I took [petgraph](https://github.com/petgraph/petgraph), a lean graph library from the Rust ecosystem, compiled it to WebAssembly, and extended it with the algorithms I kept needing that it didn't have. The result runs 3x to nearly 300x faster than [graphology](https://graphology.github.io/) and [ngraph.graph](https://github.com/anvaka/ngraph.graph), and most operations on a 5,000-node graph finish in under a millisecond. That's fast enough for optimization and network analysis that used to need a server to run on the user's own device, which changes both what's practical to build and who can build it.

The benchmarks below come from a 2011 desktop CPU, slower per core than most current phones and laptops, and I've included the case where `petgraph-wasm` loses to a pure-JavaScript library, along with my explanation of why.


{% include components/heading.html heading='Quick Start' level=2 %}

`petgraph-wasm` runs in the browser and Node.js and ships with TypeScript types. This example models a small pipeline, where edge weights are step durations:

{% highlight typescript linenos %}{% raw %}
import { Digraph } from 'petgraph-wasm';

const names = ['fetch', 'parse', 'validate', 'transform', 'publish'];

using g = new Digraph();                       // freed automatically at end of scope
g.addNodes(names.length);
g.addEdges(
  Uint32Array.of(0, 1, 1, 2, 3),               // from
  Uint32Array.of(1, 2, 3, 4, 4),               // to
  Float64Array.of(2, 1, 4, 1, 3),              // duration of each step
);

g.isCyclic();                                  // false
Array.from(g.toposort(), i => names[i]);       // a valid execution order

using fastest = g.shortestPathWeighted(0, 4);  // fetch -> publish
if (fastest) {
  console.log(fastest.cost);                   // 4
  console.log(Array.from(fastest.path, i => names[i]));
  // ['fetch', 'parse', 'validate', 'publish']
}
{% endraw %}{% endhighlight %}

A few things to know up front:

- **Nodes are numbers.** The graph stores only structure and weights. Keep names and other attributes in your own `Array` or `Map`, indexed by node id.
- **Results are typed arrays.** Methods like `toposort()` return a `Uint32Array`, which is why the example wraps it in `Array.from` to map ids back to names.
- **Free what you allocate.** Graphs and result objects live in WASM memory, so JavaScript's garbage collector doesn't reclaim them. The `using` keyword (TypeScript 5.2+) handles this for you. Without it, call `.free()` yourself.
- **Pick the right graph type.** `Digraph` and `Ungraph` are the basic directed and undirected graphs. On those, `removeNode` can swap the last node into the freed slot and silently renumber your nodes. The `Stable` variants (`StableDigraph`, `StableUngraph`) keep node ids fixed when you remove nodes, which is what you want in an interactive editor.

For details on real-life applications, see [Recipes](#recipes).

{% include components/heading.html heading='Why Graphs in the Browser?' level=2 %}

Graphs can model a wide array of problems, including dependencies, routes, schedules, networks, relationships, interactions, etc. The usual assumption is that anything graph-shaped belongs on a server often in a dedicated graph database like Neo4J because you run into performance issues in the browser. Running the algorithms in the browser changes what you can build, and let's you skip building slow transport layers.

{% include components/heading.html heading='Interactivity That a Round Trip Cannot Deliver' level=3 %}

There are many small problems that are easy to solve once they are framed as a graph:

* Would this edit create a cycle?
* What is the cheapest route if I remove this edge?
* Which tasks can run in parallel?

In the past, answering them meant sending data to a backend, which was overkill for such small questions and too slow to feel interactive.  It was the least-worst option because the server had the fastest means of solving it, but there was a lot of overhead in sending it to/from the server which made realtime interactivity unfeasible because transport time, so you had to batch all your operations in a single request which tightly coupled your UI and backend which slowed down development time.

When you can get an answer for a graph operaton in well under a millisecond, you can focus your logic on best practices instead of minimizing latency while giving user's ability to drag a node, change a weight, or delete an edge and see the result recompute instantly. You can check a change locally, for example rejecting a dependency that would introduce a cycle, before anything is saved. Combinatorial and optimization problems that used to be batch jobs (validation, cycle checking, coloring, matching, flow, spanning trees, etc) can become a realtime GUI a user explores by idly poking at it. An educator can put an interactive shortest-path or max-flow demo on a static page for students to experiment with.  The developer might even be able to run their own sensitivity analysis against it to suggest to the user what tweaks would be most effective.

{% include components/heading.html heading='No Backend to Pay For or Operate' level=3 %}

Backend graph infrastructure can be expensive, and many problems don't need what it provides. If the graph doesn't need to be persisted in a product like Neo4j or TigerGraph, you're paying for storage, availability, and a query engine you aren't using. And a graph service is more than the algorithm. It's an API to design, an endpoint to secure and rate-limit, a deployment to operate, and a failure mode your frontend has to handle.

Or, if you were like me and used `networkx` or `graph-tool` through a Python backend (or another language's tools), you can avoid the persistence, availability, and query engine costs.  But now you have tied yourself to a single backend language for a data structure problem, you may have to scale if you get a spike in traffic of large graphs, and still have to deal with the transport logic and latency.

Moving the computation to the client removes all of that. Each user brings their own CPU, so server-side compute cost doesn't rise with traffic/graph size, and since nothing runs server-side, more of the application can live on static hosting such as GitHub Pages. A front-end developer who needs a graph to compute an answer just calls a method.

{% include components/heading.html heading='Local-First, Private, and Offline' level=3 %}

If the data never leaves the device, no transport logic/latency, there is nothing to leak in transit, and no server-side copy to protect. That makes graph analysis viable for sensitive data such as personal notes, internal dependency maps, and anything a user would not want to upload. It also means the application works offline, because the computation does not depend on a connection.

{% include components/heading.html heading='It Runs on the Backend Too' level=3 %}

Nothing about the library is browser-only. The same package runs in Node.js and in other WASM-capable environments, including edge and serverless runtimes where a native binary or a heavy database is not an option. In those places it is faster than the pure-JavaScript graph libraries, though it is not faster than native Rust or a dedicated graph database. Because the browser and the server use the same implementation, you get identical results in both places and do not have to maintain two versions that drift apart.

{% include components/heading.html heading='When a Backend Is Still the Right Answer' level=3 %}

None of this means graph databases are unnecessary. A persistent backend is still the right choice when:

- The graph must survive across sessions and devices, and be the system of record.
- Multiple users read and write the same graph, and consistency matters.
- The graph is too large to fit comfortably in browser memory (WASM has a 4GB memory limit).
- You need query-style access over a huge dataset, not whole-graph algorithms.

Even then, the line is not as sharp as it first appears. If the graph can be rebuilt at start-up, from a relational database, an API response, or a file, `petgraph-wasm` can still do the analysis on the client. The backend stays the source of truth for storage, and the browser handles the computation. Persistence and computation are separate concerns, and only the first one requires a server.

{% include components/heading.html heading='Designing the API for JavaScript' level=2 %}

{% include components/heading.html heading='Numbers In, Typed Arrays Out' level=3 %}

Nodes are identified by unsigned integers, so `Uint32Array` shows up throughout the API as both a parameter and a return type. This comes directly from `petgraph`, which keeps the graph structure thin and doesn't store anything it doesn't need.

More broadly, the library makes extensive use of typed arrays and the [Struct-of-Arrays (SoA)](https://en.wikipedia.org/wiki/AoS_and_SoA) pattern, primarily to keep data transfer cheap, with memory efficiency as a bonus.

Typed arrays have native support in the toolchains that compile to WASM, such as `wasm-bindgen` for Rust and Emscripten for C and C++. They also store their items contiguously in memory, which makes iterating over them fast and cache-friendly.

That contiguity is why SoA generally beats the Array-of-Structs (AoS) approach on cache efficiency. With WASM, SoA has a second makes crossing the WASM-JS boundary cheap by reducing the number of objects that need to be converted to JS.

Moving data across the WASM-JS boundary can be expensive, and the cost depends mostly on how many separate values have to be converted. Suppose a call returns 1,000 edges. Structured as an Array of Structs:

{% highlight typescript %}{% raw %}
interface Edge {
  id: number;
  weight: number;
}
{% endraw %}{% endhighlight %}

each of the 1,000 objects has to be converted and allocated on the JavaScript side individually. Structured as a Struct of Arrays:

{% highlight typescript %}{% raw %}
interface Edges {
  ids: Uint32Array;
  weights: Float64Array;
}
{% endraw %}{% endhighlight %}

the whole result crosses as two bulk copies, one per typed array, no matter how many edges there are. That turns 1,000 conversions into two. It's an easy win, and it gives TypeScript developers stronger types than `number[]`.

{% include components/heading.html heading='Memory Ownership Across the WASM Boundary' level=3 %}

JavaScript developers rarely think about freeing memory, because the garbage collector does it for them. Graphs and result objects in `petgraph-wasm` live in WebAssembly's linear memory, which the Javascript garbage collector can't see. A JavaScript wrapper holding a large graph looks like a tiny object to the collector, so it feels no pressure to reclaim it.

JavaScript does offer `FinalizationRegistry`, which can run cleanup after a wrapper is collected, but the spec makes no promise about when that happens, or whether it happens at all. For a library that may hold large graphs, I wanted cleanup to be predictable, so ownership is explicit: every graph and result object has a `free()` method. TypeScript 5.2's `using` declarations make this far less of a burden. `using g = new Digraph()` frees the graph when it goes out of scope, much like `with` in Python or RAII in Rust and C++.

{% include components/heading.html heading='Benchmarks' level=2 %}

To feel real-time, an interaction has to finish its work inside a single frame, which is about 16 ms at 60 frames per second. That budget is the yardstick for everything below.

Median latency on a 5,000-node chain graph, compared against [graphology](https://graphology.github.io/) and [ngraph.graph](https://github.com/anvaka/ngraph.graph):

| Operation | `petgraph-wasm` | graphology | ngraph.graph |
|---|---|---|---|
| BFS traversal | 220 µs | 15.7 ms (71x slower) | 2.4 ms (11x slower) |
| Connected components | 101 µs | 29.5 ms (293x slower) | 3.1 ms (31x slower) |
| Cycle detection | 205 µs | 16.4 ms (80x slower) | 2.5 ms (12x slower) |
| Shortest path, weighted | 1.38 ms | 40.0 ms (29x slower) | 4.1 ms (3x slower) |
| Bulk insert, 9,999 edges | 303 µs | 54.0 ms (178x slower) | 10.1 ms (33x slower) |
| Betweenness centrality | 475 ms | 6.4 s (13.5x slower) | 7.0 s (14.8x slower) |

There are a few useful ways to read these numbers:

- **Bigger graphs at the same latency.** For the roughly linear-time operations, such as traversal, connected components, cycle detection, and topological sort, the multiplier is a fair estimate of how much larger a graph `petgraph-wasm` can handle in the time the alternative needs for 5,000 nodes.
- **More work per interaction.** A real application rarely runs just one algorithm per interaction. A single drag might trigger a cycle check, a layout update, and a fresh set of centrality scores. In the 16.4 ms graphology needs for one cycle-detection call, `petgraph-wasm` can run BFS, DFS, connected components, cycle detection, topological sort, and degree centrality, all in about 1.2 ms, with roughly 15 ms of the frame left over.
- **Margin on slower devices.** I ran these on an AMD FX-8120, an eight-core desktop CPU from 2011. Most current phones and laptops are faster per core, so these margins are closer to a worst case for `petgraph-wasm` and a best case for the JavaScript libraries. A graphology call that already takes 13 to 16 ms here has little room left before it drops frames on a budget laptop, while most `petgraph-wasm` calls use well under 10% of a frame.

If a computation is still too heavy for the main thread, it can move to a Web Worker. The graph lives in the worker, and results come back as typed arrays, which can be transferred rather than copied. This way the page UI stays responsive while the work runs on another thread.

{% include components/heading.html heading='Where It Does Not Win' level=3 %}

On the same 5,000-node benchmark, `petgraph`'s built-in strongly connected components (SCC) took 137 ms in petgraph-wasm, about 10x slower than graphology's 13.9 ms. That is surprising, because SCC is a linear-time algorithm and the rest of the suite finishes in a few hundred microseconds.

| Operation | `petgraph-wasm` | `graphology` | `ngraph.graph` |
|---|---|---|---|
| Strongly connected components | 137 ms | **13.9 ms (9.8x faster)** | not benchmarked |

My best explanation is that the cost is in delivering the answer, not computing it. The benchmark graph is a chain, so every node is its own strongly connected component, and the result is 5,000 one-node groups. That's the Array-of-Structs case from earlier showing up in the wild. The algorithm finishes almost instantly, and then each group crosses the boundary as its own object, with its own allocation and wrapper. `graphology` never crosses a boundary, so on this shape it pays nothing for delivery.

The general lesson is that a WASM call's speed depends on three things: the algorithm, how much data crosses the boundary, and how many separate objects it crosses as. Most graph algorithms return one flat array, so only the algorithm matters. A few return many small groups, and for those the object count can dominate.

The full results, including per-topology numbers and scaling data, are in [BENCHMARKS.md](https://github.com/dpfens/petgraph-wasm/blob/main/BENCHMARKS.md) in the repo.

{% include components/heading.html heading='Extending petgraph, Not Just Wrapping It' level=2 %}

Most of the methods in `petgraph-wasm` started as direct ports of `petgraph`'s own implementations. But `petgraph` deliberately keeps a small core, and it didn't have several algorithms I needed.

The building blocks are all exposed, so in principle the missing algorithms could be written in TypeScript on top of them. In practice that would be slower than pure JavaScript. Every call to a neighbor lookup or edge weight crosses the WASM-JS boundary, and an algorithm that makes thousands of small calls pays that cost thousands of times.

So I wrote the missing algorithms in Rust, where they run entirely inside WASM and cross the boundary once, with the finished result. That makes `petgraph-wasm` both a wrapper around `petgraph` and an extension of it, and I keep adding to it the same way. The algorithms I've implemented or reimplemented this way include:

* `betweennessCentrality`
* `closenessCentrality`
* `degreeCentrality`
* `connectedComponents`
* `maxFlow`
* `minCostFlow`
* `minCut`
* `minStCut`
* `tarjanScc`
* `topologicalLayers`

Between these and the ported methods, `petgraph-wasm` includes algorithms that neither JavaScript library offers at all, such as max flow, min-cost flow, dominator trees, and maximal cliques.

Long term, I think several of these belong in `petgraph` itself. For now, I'm refining them here.

{% include components/heading.html heading='Recipes' level=2 %}

Each recipe below is a small pattern you can lift into your own code. Unless a recipe says otherwise, assume `g` is a `StableDigraph`, that the graph classes and `Direction` are imported from `petgraph-wasm`, and that anything living in WASM memory is released with `using` or `.free()`.

{% include components/heading.html heading='Using the Ripple Effect' level=3 %}

Most people meet graph propagation through spreadsheets, signals, or cache invalidation: change a node, then update everything downstream in the right order. The same idea works in less obvious places. In each recipe below, a small change to the graph ripples outward and the library answers a useful question about it.

{% include components/heading.html heading='Autocomplete That Knows What Comes Next' level=4 %}

After someone types "5 km", the next unit is probably a smaller one. Real unit systems are messier than a single chain, though. Some systems branch, some are connected, and some have nothing to do with each other. People also skip steps, as in "2 mi 40 ft" with no yards.

A graph handles all of this with the same few calls. Edges point from larger to smaller units, and the weight is how natural the step feels (1 for the obvious next unit, higher for a skip). The state you hold is still just the last unit typed.

{% highlight typescript linenos %}{% raw %}
// [larger, smaller, cost]: lower cost = more natural next step
const edges: [string, string, number][] = [
  // astronomical and metric: one connected chain
  ['ly','AU',1], ['AU','km',1], ['km','m',1], ['m','cm',1], ['cm','mm',1], ['m','mm',2],
  // imperial: a separate family, with skip edges for real-world shortcuts
  ['mi','yd',1], ['yd','ft',1], ['ft','in',1], ['mi','ft',2], ['yd','in',2],
  // nautical joins metric partway down
  ['nmi','m',1.5],
  // time
  ['d','h',1], ['h','min',1], ['min','s',1], ['s','ms',1], ['h','s',2], ['d','min',2],
  // mass
  ['st','lb',1], ['lb','oz',1], ['t','kg',1], ['kg','g',1], ['g','mg',1],
];

const symbols = [...new Set(edges.flatMap(([a, b]) => [a, b]))];
const id = new Map(symbols.map((s, i) => [s, i]));
const ix = (s: string) => id.get(s)!;

const g = new StableDigraph();
g.addNodes(symbols.length);
g.addEdges(
  Uint32Array.from(edges, e => ix(e[0])),
  Uint32Array.from(edges, e => ix(e[1])),
  Float64Array.from(edges, e => e[2]),
);
if (g.isCyclic()) throw new Error('unit table contains a cycle');
{% endraw %}{% endhighlight %}

Suggestions are everything reachable, ranked by cost. A single `bellmanFord` call from the last unit scores every candidate at once. After `mi`, you get `yd`, then `ft`, then `in`. After `ft`, you get only `in`. Typing `AU` gives `km, m, cm, mm`. Nothing needs to be special-cased, because the graph's shape already encodes what is plausible.

{% highlight typescript linenos %}{% raw %}
function suggestNext(typed: string[], limit = 4): string[] {
  const last = ix(typed[typed.length - 1]);
  using r = g.bellmanFord(last);
  const dist = r.distances, reachable = r.distances_mask;
  return symbols
    .map((_, i) => i)
    .filter(i => i !== last && reachable[i])
    .sort((a, b) => dist[a] - dist[b])
    .slice(0, limit)
    .map(i => symbols[i]);
}
{% endraw %}{% endhighlight %}

Validation falls out of the same structure. Connected components tell you which family a unit belongs to, so "5 km 3 min" is rejected as mixing systems. Reachability tells you whether the order makes sense, so "3 in 5 ft" is rejected as out of order.

{% highlight typescript %}{% raw %}
function validate(typed: string[]): { ok: boolean; reason?: string; } {
  const family = g.connectedComponents();
  for (let i = 1; i < typed.length; i++) {
    const a = ix(typed[i - 1]), b = ix(typed[i]);
    if (family[a] !== family[b]) return { ok: false, reason: `${typed[i-1]} and ${typed[i]} measure different things` };
    if (!g.hasPathConnecting(a, b)) return { ok: false, reason: `${typed[i]} should come before ${typed[i-1]}` };
  }
  return { ok: true };
}
{% endraw %}{% endhighlight %}


New units can go through the same edit guard as any other change, covered in the next recipe. Because `StableDigraph` keeps node indices fixed, you can add and remove units at runtime without invalidating anything you've stored.

{% include components/heading.html heading='Guarding Every Edit, and Saying How to Fix It' level=4 %}

In an editor where users draw dependencies, you have to answer "can this edge be added?" on every attempt, sometimes on every pointer move while a connector is being dragged. Adding an edge from `source` to `target` creates a cycle exactly when `target` can already reach `source`, so a single reachability query settles it without touching the graph.

When the answer is no, don't just say no. Once the user lets go of the connector, run the edit on a copy and ask which edges would break the cycle. The clone costs more than the reachability check, so save it for the drop rather than every pointer move.

`tryAddDependency` treats an existing edge as a success, rejects self-loops and cycle-closing edges, and otherwise adds the edge. It assumes the graph is acyclic to begin with, which is the invariant the guard maintains.

{% highlight typescript linenos %}{% raw %}
function tryAddDependency(g: StableDigraph, source: number, target: number): boolean {
  if (g.hasEdge(source, target)) return true;     // already present
  if (source === target || g.hasPathConnecting(target, source)) {
    return false;                                 // would close a cycle
  }
  g.addEdge(source, target);
  return true;
}

function explainCycle(g: StableDigraph, from: number, to: number): {from: number; to: number; }[] {
  using trial = g.clone();
  trial.addEdge(from, to);
  if (!trial.isCyclic()) return null;
  const fixes = trial.greedyFeedbackArcSet();   // heuristic, not guaranteed minimal
  const result = fixes.map(e => ({ from: e.from, to: e.to }));
  fixes.forEach(e => e.free());
  return result;
}
{% endraw %}{% endhighlight %}

{% include components/heading.html heading='Recomputing Only What a Change Touches' level=4 %}

This is the spreadsheet pattern, with early cutoff. Walk the nodes in topological order and re-evaluate a node only if something upstream actually changed. If its recomputed value is the same, stop the ripple there.

{% highlight typescript linenos %}{% raw %}
function propagate(
  g: StableDigraph,
  changed: number,
  evaluate: (node: number) => boolean,   // returns true if the value changed
) {
  const dirty = new Set([changed]);
  for (const n of g.toposort()) {        // assumes a DAG; guard edits with isCyclic()
    if (!dirty.has(n)) continue;
    if (n === changed || evaluate(n)) {
      for (const m of g.neighbors(n, Direction.Outgoing)) dirty.add(m);
    }
  }
}
{% endraw %}{% endhighlight %}

This is the same pattern that libraries like `Angular` use for `signals`.

{% include components/heading.html heading='Probing a Delete Before It Happens' level=4 %}

Before a user confirms a destructive action, run it on a throwaway copy of the graph and compare. Two questions are worth asking. The first is what would no longer be reachable from the root, which you can show before the user commits: "Deleting this will orphan 3 reports and 2 automations."

{% highlight typescript %}{% raw %}
function orphanedBy(g: StableDigraph, root: number, victim: number) {
  const before = new Set(g.bfsOrder(root));
  using probe = g.clone();
  probe.removeNode(victim);              // stable graph: no indices shift
  const after = new Set(probe.bfsOrder(root));
  return [...before].filter(n => n !== victim && !after.has(n));
}
{% endraw %}{% endhighlight %}

The second is structural: would removing the node split the graph into more separate pieces? Nodes where the answer is yes are called cut vertices, or articulation points. Think of a single router whose failure partitions a network, or one person who is the only link between two teams. Count the components, remove the node from a clone, and count again. If the number went up, the node was holding things together. Here `hovered` is the id of the node under the pointer. The check ignores edge direction, so on a directed graph it measures weak connectivity.

{% highlight typescript %}{% raw %}
const before = g.connectedComponentsCount();
using probe = g.clone();
probe.removeNode(hovered);
const isCutVertex = probe.connectedComponentsCount() > before;
{% endraw %}{% endhighlight %}

Both checks need only a clone and a few linear passes, so you can run them on whatever the user is hovering over and highlight cut vertices live.

{% include components/heading.html heading='Disabled Options With Reasons' level=4 %}

In a configurator, choosing an engine disables incompatible transmissions along "excludes" edges. Because the effect flows along edges, you can explain it by following the path back to the choice that caused it.

{% highlight typescript %}{% raw %}
function whyDisabled(g: StableDigraph, chosen: number, option: number) {
  using p = g.shortestPath(chosen, option);
  return p ? Array.from(p.path) : null;   // e.g. [Turbo, Sport Pack, Manual Gearbox]
}
{% endraw %}{% endhighlight %}

Permission systems get the same benefit. "Has access" becomes "has access because of this group, inside that folder."

{% include components/heading.html heading='Two Rules of Thumb' level=4 %}

1. **Track the frontier, not the whole graph.** The structure is static, and the state is a small set of active nodes.
2. **Keep edge metadata.** Weights, labels, and reasons turn reachability into explanation, which is often the real UX win.

{% include components/heading.html heading='Structure, Capacity, and Scheduling' level=3 %}

The ripple recipes ask what a single change touches. These ask something about the graph as a whole: how it divides, what holds it together, where it is constrained, and in what order work can happen. In `petgraph-wasm` they are fast enough to rerun on every edit.

{% include components/heading.html heading='Analyzing Each Component on Its Own' level=4 %}

A graph is often several unrelated graphs in one.  The dependencies of separate teams, and unconnected clusters in a social network which have no edges to other node in the graph. If you run a normalized centrality on the whole graph, the normalized scores are scaled by the size of the whole graph, so a clear hub in a five-node cluster looks unimportant next to a hub in a five-hundred-node cluster. To rank nodes fairly, we can split the graph by component and score each piece separately.

`connectedComponents()` returns one label per node. For each distinct label, clone the graph, drop every node with a different label using `retainNodes`, and run the analysis on what is left. Because this is a `StableDigraph`, removing nodes does not renumber the survivors, so the node ids in each result still refer to your original graph. The cost is one `clone` per component, which is fine for a handful of clusters but may be worth rethinking if you have thousands of tiny ones.

{% highlight typescript linenos %}{% raw %}
const g: StableDigraph = new StableDigraph();
...

const labels = g.connectedComponents();      // Uint32Array, one label per node
const uniqueLabels = new Set(labels);

const results = [];
for (const label of uniqueLabels) {
  using sub = g.clone();        // clone
  sub.retainNodes(idx => labels[idx] === label);    // keep one component
  const c = sub.betweennessCentrality(true);        // normalized to this component's size
  results.push({ label, nodes: c.nodes, scores: c.scores });
  c.free();
}
...
g.free();
{% endraw %}{% endhighlight %}

{% include components/heading.html heading='A Draggable Bottleneck' level=4 %}

[Max flow](https://en.wikipedia.org/wiki/Maximum_flow_problem) answers "how much can get from here to there?" for anything with capacities: pipes, bandwidth, the throughput of a pipeline, people moving through a venue. Edge weights are the capacities, and `maxFlow(source, sink)` returns the total flow, the flow on every edge, and the min cut, which is the set of nodes on the source's side of the narrowest cross-section of the network.

Edges whose flow equals their capacity are saturated. The saturated edges that cross from the source side to the other side make up the min cut, and those are the ones limiting the whole network from having a higher capacity (also called a bottleneck). Widening a saturated edge that does not cross the cut changes nothing. Hook this up to a capacity slider or to draggable source and sink handles, recompute on each move, and shade the two sides while coloring the saturated edges.

Two practical notes. `maxFlow` is only available on the directed graph types, and `edge_flows` lines up with `edgeWeights()`, so you can compare `flows[i]` against `capacity[i]`. Also, read `r.edge_flows` into a local variable once. Each access to a getter returns a fresh copy of the array across the WASM boundary, so reading it inside a loop would copy it on every iteration.

{% highlight typescript %}{% raw %}
using r = g.maxFlow(source, sink);
const capacity = g.edgeWeights();
const flows = r.edge_flows;                       // read the getter once
const sourceSide = new Set(r.min_cut_source_side);
// edges where flows[i] >= capacity[i] are saturated; shade source/sink sides
{% endraw %}{% endhighlight %}

{% include components/heading.html heading='Assignment With Max Flow, and a Reason When It Fails' level=4 %}

Assignment problems are everywhere. We shifts to people, reviewers to pull requests, jobs to machines, and talks to rooms. The usual approach is a loop with a few `if` statements, which works until someone asks "why couldn't this be filled?" Matching algorithms don't help much either, because they pair things one-to-one, and real workers can take several tasks. Max flow handles that. You model the problem as a network, with tasks on one side, workers on the other, and each worker's capacity on the edge to the sink. One call tells you the best possible assignment. The part I find most interesting is the min cut behind the answer, which identifies the group of tasks that can't all be served, so the failure comes with an explanation.

{% highlight typescript linenos %}{% raw %}
function assign(tasks: Task[], workers: Worker[]) {
  const S = 0, T = 1;
  const tNode = (i: number) => 2 + i;
  const wNode = (j: number) => 2 + tasks.length + j;
  const froms: number[] = [], tos: number[] = [], caps: number[] = [];
  const add = (a: number, b: number, c: number) => { froms.push(a); tos.push(b); caps.push(c); };

  tasks.forEach((_, i) => add(S, tNode(i), 1));
  tasks.forEach((t, i) => workers.forEach((w, j) => { if (w.canDo(t)) add(tNode(i), wNode(j), 1); }));
  workers.forEach((w, j) => add(wNode(j), T, w.capacity));

  using g = new Digraph();
  g.addNodes(2 + tasks.length + workers.length);
  g.addEdges(Uint32Array.from(froms), Uint32Array.from(tos), Float64Array.from(caps));

  using r = g.maxFlow(S, T);
  const flows = r.edge_flows;                       // read the getter once
  const assigned = [];
  for (let k = 0; k < flows.length; k++) {
    if (flows[k] > 0 && froms[k] >= 2 && froms[k] < 2 + tasks.length && tos[k] >= 2 + tasks.length) {
      assigned.push({ task: froms[k] - 2, worker: tos[k] - 2 - tasks.length });
    }
  }
  const stuck = Array.from(r.min_cut_source_side).filter(n => n >= 2 && n < 2 + tasks.length);
  return { assigned, unassignable: tasks.length - r.flow, stuck };
}
{% endraw %}{% endhighlight %}

The network has a source `S` and a sink `T`, then one node per task, then one node per worker. Edges run from `S` to each task with capacity 1, because each task is assigned once. They run from a task to a worker with capacity 1 when the worker can do it, and from each worker to `T` with that worker's capacity. Max flow pushes as many units through as it can, so `r.flow` is the number of tasks that got assigned.

Every task-to-worker edge that carries flow is an assignment, which is what the loop over `flows` extracts. The index checks only keep edges that start at a task node and end at a worker node. `froms`, `tos`, and `caps` are built in the same order as the edges, so `flows[k]` is the flow on edge `k`.

The failure case is the min cut, just as in the bottleneck recipe. Here `r.min_cut_source_side` contains the tasks that went unassigned along with the tasks competing for the same full workers, and `stuck` filters it down to task nodes. That is your explanation: these tasks need more capacity than their eligible workers have. Filtering for worker nodes instead tells you which workers are the limiting ones.

Plenty of problems that seem complex become much simpler once you model them as flow problems, especially assignment problems. Assigning ads or content to slots is the clearest example. Each ad is eligible for some placements (by targeting, format, page, or some other mechanism), each advertiser has a daily cap, and each slot holds a fixed number of ads, so the model above tells you the most inventory you can fill and which constraints are leaving slots empty. Prioritized content positioning is the same shape: editors' picks, sponsored items, and recommended posts compete for a limited number of homepage or feed positions, each with its own eligibility rules and quotas. The same model covers a few other everyday problems like:

* Assigning reviewers to pull requests without overloading anyone
* Placing jobs onto workers with limited slots
* Spreading notifications across users who each have a daily limit

When some pairings are better than others, such as a higher-paying ad or a better-matched reviewer, the structure stays the same and you swap `maxFlow` for `minCostFlow`, putting the preference on each edge as a cost. Because it runs in under a few milliseconds on the client, you can build an editor where someone changes a quota or an eligibility rule and sees fill rates and conflicts update immediately instead of waiting on a batch job, then send the solved logic to the server when it's time to commit.

{% include components/heading.html heading='Scheduling With a Proof of Optimality' level=4 %}

Scheduling problems such as exam timetables, meeting slots, and frequency assignment reduce to graph coloring. Each item is a node, an edge means two items conflict (they share a student, a person, or a resource), and a color is a time slot. A valid coloring puts conflicting items in different slots, and the number of colors is the number of slots you need. Finding the fewest possible slots is NP-hard, so `dsaturColoring()` uses a fast heuristic that is usually good but not guaranteed to be minimal.

The proof comes from the other direction. A set of items that all conflict with each other, called a clique, needs a separate slot for each member, so the largest clique is a lower bound on the number of slots. If DSatur's color count equals that bound, no schedule can do better, and you can tell the user the result is provably optimal. If the two numbers differ, the true minimum is somewhere between them, and you at least know how far off the heuristic could be.

Coloring and cliques are undirected concepts, so this recipe uses an undirected graph (`Ungraph` or `StableUngraph`) instead of the `StableDigraph` used elsewhere. `maximalCliques()` can be exponential on dense graphs, so consider skipping it above a certain size, or running it in a Web Worker.

{% highlight typescript %}{% raw %}
// g is a StableUngraph: an edge means "these two can't share a slot"
using coloring = g.dsaturColoring();
const cliques = g.maximalCliques() ?? [];   // can be exponential on dense graphs
const lowerBound = Math.max(0, ...cliques.map(c => c.nodes.length));
cliques.forEach(c => c.free());
const provablyOptimal = coloring.num_colors === lowerBound;
{% endraw %}{% endhighlight %}

{% include components/heading.html heading='Running a DAG of Async Tasks' level=4 %}

Given a dependency graph of async work such as build steps, data-loading tasks, or migrations, `topologicalLayers()` groups the nodes into layers. Every node's prerequisites sit in earlier layers, so everything inside a layer is independent and can run at the same time. `execute` runs one layer at a time with `Promise.all`. It is the simplest correct way to get parallelism out of a DAG, and the layers are also handy for drawing the graph in columns.

Each layer is a WASM object, so the `finally` block frees them even if a task throws.

{% highlight typescript linenos %}{% raw %}
async function execute(g: StableDigraph, run: (id: number) => Promise<void>) {
  const layers = g.topologicalLayers();
  try {
    for (const layer of layers) {
      await Promise.all(Array.from(layer.nodes, run));
    }
  } finally {
    layers.forEach(l => l.free());
  }
}
{% endraw %}{% endhighlight %}

That's the simplest correct version, but it leaves workers idle. A layer waits for its slowest task, even when tasks in the next layer already have everything they need, and nothing caps how many run at once. `executeEager` fixes both by tracking how many unfinished dependencies each node has, which is its incoming degree. A node starts as soon as that count reaches zero, subject to a concurrency limit.

When a task finishes, the code decrements the counter of each dependent and queues the ones that hit zero. The loop keeps up to `limit` tasks in flight and wakes whenever one finishes. After the setup it only works with plain numbers, so there are no WASM objects to free. `ready.pop()` takes the most recently unblocked task first. If some tasks matter more than others, sort `ready` by priority before popping. Note that a rejected task rejects the whole run, so wrap `run` in a `try`/`catch` if independent branches should keep going.

{% highlight typescript linenos %}{% raw %}
async function executeEager(g: StableDigraph, run: (id: number) => Promise<void>, limit = 4) {
  const waiting = new Map<number, number>();
  for (const n of g.nodes()) waiting.set(n, g.degree(n, Direction.Incoming));
  const ready = [...waiting].filter(([, d]) => d === 0).map(([n]) => n);
  const running = new Set<Promise<void>>();

  while (ready.length || running.size) {
    while (ready.length && running.size < limit) {
      const n = ready.pop()!;
      const p: Promise<void> = run(n)
        .then(() => {
          for (const m of g.neighbors(n, Direction.Outgoing)) {
            const left = waiting.get(m)! - 1;
            waiting.set(m, left);
            if (left === 0) ready.push(m);
          }
        })
        .finally(() => running.delete(p));
      running.add(p);
    }
    await Promise.race(running);
  }
}
{% endraw %}{% endhighlight %}

{% include components/heading.html heading='What\'s Next' level=2 %}

I don't have a roadmap for `petgraph-wasm`, and I'd rather say that than invent one. The library is already useful to me, so from here it grows the way it started: I'll use it in my own projects, and when one needs an algorithm it doesn't have, I'll add it. The custom algorithms listed earlier exist because `petgraph` didn't cover something I wanted, and I expect the next methods to arrive the same way.

The direction I've been most drawn to is network science. One of the first books I read on networks was Easley and Kleinberg's *[Networks, Crowds, and Markets](https://www.cs.cornell.edu/home/kleinber/networks-book/)* which treats graphs as models of how people and markets behave such as:

* how ideas cascade
* why weak ties carry new information,
* how matching markets arrive at their prices

all of which uses same assignment mathematics as the min-cost flow that started this project.  The library already covers some of that ground through basic centrality, k-cores, bridges, and assortativity, but community detection and cascade simulation / percolation are probably the gaps I will close next.  Network-science ideas are hard to get an intuition around from static diagrams or descriptions so adding support would help support interactive explainers, which is probably one of the best ways people interact with them and get to know them without opening a textbook.

The bigger idea on my mind is porting more libraries from Rust, C, and C++ to WASM.  There is a lot of fast, mature code in those languages that has never been usable from a web page without a server in between. This project taught me that compiling the code is the easy half. The hard half is the interface design: deciding how the data should be shaped so the API feels natural to a JavaScript developer and is also cheap to move across the WASM/JS boundary. Typed arrays, structs of arrays, and explicit ownership were the answers I landed on here, and I expect to reuse them in the next port. A port is only as useful as its interface, and a good interface is usually the one a developer can use without having to think about WASM at all. I expect the next one to start the way this one did: with a problem I knew how to solve, but not where I wanted to solve it.

I'm also better prepared for that work than when I started. Reading *[The Linux Programming Interface](https://man7.org/tlpi/)* gave me a much better feel for memory, file descriptors, and the system interfaces that native libraries depend on. That knowledge is what you need when writing glue code between a native library and a runtime with no operating system underneath it.

If there's an algorithm `petgraph-wasm` is missing, or a native library you'd like to see in the browser, open an issue on the [GitHub repo](https://github.com/dpfens/petgraph-wasm).