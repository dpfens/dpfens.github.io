---
layout: post
title:  "Directed Random Walk Betweenness Centrality"
description: A random-walk betweenness centrality implementation that extends it to directed graphs using absorbing Markov chains
keywords: graph theory, random walk, betweenness, centrality
tags: graph-theory math python
introduction: A Markov chain-based random-walk betweenness centrality for directed graphs using NetworkX
---

 I'm going through old code and publishing the pieces that seem generally useful, and this felt like one of them.  This started as a one-off piece of an evening of tinkering a few months back when I realized that NetworkX didn't offer a way to do random walk betweenness on directed graphs.  This eventually turned into tinkering with a single parameter that configures centrality from strictly-shortest-path (at zero) toward increasingly random walks as it grows, but the solution ended up being unrelated and is a post for another day.

{% include components/heading.html heading='Getting Started' level=2 %}

This is an extension of NetworkX's [current_flow_betweenness_centrality](https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.centrality.current_flow_betweenness_centrality.html).  `current_flow_betweenness_centrality` is not directed, meaning it only applies to networks where cascades are random and can flow in either direction of an edge at any time.  There are many cases when cascades can occur randomly but only in one direction.  For example, in many gossip networks, gossip only flows through people who gossip to others, not those who only receive/listen to gossip.   More generally, I think of this as cases where the cascade occurs on a directed Markov Chain.

{% include components/heading.html heading='The Code' level=2 %}

Below is my implementation for directed current flow betweenness centrality using NetworkX.  It uses the Markov chain approach I mentioned above:


{% highlight python linenos %}{% raw %}"""
Random-Walk Betweenness Centrality for Directed Graphs

This implementation extends Newman's random-walk betweenness centrality measure
to work with directed graphs. The standard NetworkX implementation only supports
undirected graphs.

Based on: M.E.J. Newman, "A measure of betweenness centrality based on random walks",
Social Networks 27 (2005) 39-54.

For directed graphs, we use the absorbing Markov chain approach where the target
node becomes an absorbing state, and we compute the expected number of visits to
each intermediate node.
"""

from __future__ import annotations

import warnings
from typing import Any, Hashable, TypeVar

import networkx as nx
import numpy as np
import numpy.typing as npt
from numpy.linalg import pinv

# A graph node can be any hashable object (NetworkX's own convention);
# this just lets type checkers track "node in, same node type out".
Node = TypeVar("Node", bound=Hashable)

FloatArray = npt.NDArray[np.floating[Any]]


def random_walk_betweenness_centrality(
    G: nx.DiGraph,
    normalized: bool = True,
    weight: str | None = None,
    include_endpoints: bool = True,
) -> dict[Node, float]:
    """
    Compute random-walk betweenness centrality for nodes in a directed graph.

    Random-walk betweenness counts the expected number of times a random walk
    from source s to target t passes through node i, averaged over all s,t pairs.
    It uses "net" flow, meaning back-and-forth movements cancel out.

    Parameters
    ----------
    G : nx.DiGraph
        A directed NetworkX graph. Nodes may be any hashable type.
    normalized : bool, default True
        If True, normalize by dividing by (n-1)(n-2), the theoretical maximum
        number of ordered (source, target) pairs.
    weight : str or None, default None
        Edge attribute key for edge weights. If None, every edge has weight 1.
    include_endpoints : bool, default True
        If True, include s and t themselves in their own betweenness totals.

    Returns
    -------
    dict[Node, float]
        Mapping from each node in `G` to its random-walk betweenness centrality.

    Raises
    ------
    This function does not raise for an empty or single-node graph; both are
    handled as trivial cases (see below) rather than treated as errors.

    Notes
    -----
    We use absorbing Markov chains: for each ordered pair (s, t), t becomes an
    absorbing state, and betweenness for intermediate nodes is read off the
    fundamental matrix of the resulting chain. There's no current-flow analogy
    here the way there is for undirected graphs -- current has to be conserved,
    and directed walks don't conserve "flow" the same way.

    For each pair, the "transient" set is restricted to nodes that are both
    reachable from s and able to reach t (i.e. nodes that lie on some path
    from s to t). Anything else -- dangling nodes, disconnected branches,
    closed cycles that never lead back to t -- is excluded. This matters
    because including such a node in the transient set makes it, in effect,
    a second absorbing state (probability can get permanently stuck there),
    which makes the fundamental matrix singular. Restricting to nodes that
    can actually reach t guarantees no such trap exists: by definition,
    every included node has some positive-probability path onward to t, so
    (I - Q) stays invertible.

    Pairs (s, t) where t is unreachable from s are skipped entirely, since
    such a walk never reaches t and has no well-defined "expected visits on
    the way to t".

    Complexity: O(n^3) per (s, t) pair for the matrix inversion, O(n^2) pairs,
    so O(n^5) overall. This is fine for graphs up to a few hundred nodes but
    is not intended for web-scale graphs.

    Examples
    --------
    >>> import networkx as nx
    >>> G = nx.DiGraph([(0, 1), (1, 2), (2, 0)])
    >>> scores = random_walk_betweenness_centrality(G)
    >>> sorted(scores)
    [0, 1, 2]
    """
    if len(G) == 0:
        return {}
    if len(G) == 1:
        only_node: Node = next(iter(G.nodes()))
        return {only_node: 0.0}

    return _directed_random_walk_betweenness(G, normalized, weight, include_endpoints)


def _directed_random_walk_betweenness(
    G: nx.DiGraph,
    normalized: bool = True,
    weight: str | None = None,
    include_endpoints: bool = True,
) -> dict[Node, float]:
    """
    Random-walk betweenness for directed graphs using absorbing Markov chains.

    For each source-target pair (s, t), we create an absorbing random walk
    where t is the absorbing state. The betweenness of intermediate nodes
    is computed from the fundamental matrix of the absorbing chain.

    Parameters
    ----------
    G : nx.DiGraph
        A directed graph with at least two nodes. Not meant to be called
        directly with a 0- or 1-node graph; use
        :func:`random_walk_betweenness_centrality` for those trivial cases.
    normalized : bool, default True
        If True, divide the raw expected-visit totals by (n-1)(n-2).
    weight : str or None, default None
        Edge attribute key for edge weights. If None, every edge has weight 1.
    include_endpoints : bool, default True
        If True, credit s and t themselves for each pair they anchor.

    Returns
    -------
    dict[Node, float]
        Mapping from each node in `G` to its (optionally normalized)
        random-walk betweenness centrality.
    """
    nodes: list[Node] = list(G.nodes())
    n: int = len(nodes)
    node_to_idx: dict[Node, int] = {node: i for i, node in enumerate(nodes)}

    # W[i, j] is the weight of the edge j -> i (column-oriented: column j
    # holds node j's outgoing edges), which is what we need to build a
    # column-stochastic transition matrix below.
    W: FloatArray = np.zeros((n, n))
    for u, v, data in G.edges(data=True):
        j = node_to_idx[u]  # from
        i = node_to_idx[v]  # to
        w: float = data.get(weight, 1.0) if weight else 1.0
        W[i, j] = w

    out_weights: FloatArray = W.sum(axis=0)
    dangling: npt.NDArray[np.bool_] = out_weights == 0

    # Precompute, for every node, the set of nodes it can reach and the set
    # of nodes that can reach it. Used below to restrict each pair's
    # transient set to nodes that lie on some s -> t path.
    descendants_of: dict[Node, set[Node]] = {v: nx.descendants(G, v) for v in nodes}
    ancestors_of: dict[Node, set[Node]] = {v: nx.ancestors(G, v) for v in nodes}

    betweenness: dict[Node, float] = {node: 0.0 for node in nodes}
    num_pairs: int = 0

    for s_idx in range(n):
        if dangling[s_idx]:
            # A walk can't leave a dangling node, so it can never serve as
            # a source; skip it rather than special-casing a self-loop.
            continue

        s_node = nodes[s_idx]
        reach_from_s = descendants_of[s_node]

        for t_idx in range(n):
            if s_idx == t_idx:
                continue

            t_node = nodes[t_idx]
            if t_node not in reach_from_s:
                # No path s -> t exists; "expected visits en route to t"
                # is undefined, so this pair contributes nothing.
                continue

            num_pairs += 1
            can_reach_t = ancestors_of[t_node]

            # Transient set: s itself, plus any node that both is reachable
            # from s and can still reach t. Everything else is excluded so
            # that (I - Q) is guaranteed invertible (see function docstring
            # on the public entry point for why).
            transient_idx: list[int] = [
                i
                for i in range(n)
                if i != t_idx
                and (
                    i == s_idx
                    or (nodes[i] in can_reach_t and nodes[i] in reach_from_s)
                )
            ]
            nt: int = len(transient_idx)

            Q: FloatArray = np.zeros((nt, nt))
            for col, j in enumerate(transient_idx):
                Q[:, col] = W[transient_idx, j] / out_weights[j]

            I: FloatArray = np.eye(nt)
            N: FloatArray
            try:
                N = np.linalg.inv(I - Q)
            except np.linalg.LinAlgError:
                # Shouldn't happen given the transient-set restriction above,
                # but kept as a guarded fallback rather than a silent one.
                warnings.warn(
                    f"Singular fundamental matrix for pair ({s_node}, {t_node}); "
                    f"falling back to pseudo-inverse. Betweenness for this pair "
                    f"may not have a clean 'expected visits' interpretation."
                )
                N = pinv(I - Q)

            s_transient: int = transient_idx.index(s_idx)
            visits: FloatArray = N[:, s_transient]

            for idx, i in enumerate(transient_idx):
                if i == s_idx and not include_endpoints:
                    continue
                betweenness[nodes[i]] += max(0.0, visits[idx])

            if include_endpoints:
                betweenness[nodes[t_idx]] += 1.0

    if normalized and n > 2:
        norm_factor: int = (n - 1) * (n - 2)  # theoretical max ordered pairs
        for node in betweenness:
            betweenness[node] /= norm_factor

    return betweenness


def random_walk_betweenness_centrality_components(
    G: nx.DiGraph,
    normalized: bool = True,
    weight: str | None = None,
    include_endpoints: bool = True,
) -> dict[Node, float]:
    """
    Compute random-walk betweenness for a possibly disconnected directed graph.

    Runs :func:`_directed_random_walk_betweenness` independently within each
    weakly connected component (there's no walk between components, so
    cross-component pairs simply contribute zero), then optionally normalizes
    using the node count of the whole graph.

    Parameters
    ----------
    G : nx.DiGraph
        A directed graph, possibly with more than one weakly connected
        component.
    normalized : bool, default True
        If True, divide by `(n-1)(n-2)` using `n = len(G)` (the whole graph's
        node count, not each component's).
    weight : str or None, default None
        Edge attribute key for edge weights. If None, every edge has weight 1.
    include_endpoints : bool, default True
        If True, credit s and t themselves for each pair they anchor.

    Returns
    -------
    dict[Node, float]
        Mapping from every node in `G` to its random-walk betweenness
        centrality. Nodes in singleton components get 0.0.
    """
    if len(G) == 0:
        return {}

    betweenness: dict[Node, float] = {node: 0.0 for node in G.nodes()}
    components: list[set[Node]] = list(nx.weakly_connected_components(G))

    for component in components:
        if len(component) <= 1:
            continue

        H: nx.DiGraph = G.subgraph(component).copy()

        comp_betweenness: dict[Node, float] = _directed_random_walk_betweenness(
            H, normalized=False, weight=weight, include_endpoints=include_endpoints
        )

        for node, value in comp_betweenness.items():
            betweenness[node] = value

    if normalized:
        n: int = len(G)
        if n > 2:
            norm_factor: int = (n - 1) * (n - 2)
            for node in betweenness:
                betweenness[node] /= norm_factor

    return betweenness


def current_flow_betweenness_centrality_directed(
    G: nx.DiGraph,
    normalized: bool = True,
    weight: str | None = None,
) -> dict[Node, float]:
    """
    Alias for :func:`random_walk_betweenness_centrality` that works with directed graphs.

    This extends NetworkX's `current_flow_betweenness_centrality` to support
    directed graphs using the absorbing Markov chain interpretation. Provided
    mainly so callers migrating from the undirected NetworkX function can drop
    this in under a matching name; `include_endpoints` is fixed to True to
    mirror NetworkX's default behavior.

    Parameters
    ----------
    G : nx.DiGraph
        A directed NetworkX graph.
    normalized : bool, default True
        If True, normalize by (n-1)(n-2).
    weight : str or None, default None
        Edge attribute key for edge weights. If None, every edge has weight 1.

    Returns
    -------
    dict[Node, float]
        Mapping from each node in `G` to its centrality score.
    """
    return random_walk_betweenness_centrality(
        G, normalized=normalized, weight=weight, include_endpoints=True
    ){% endraw %}{% endhighlight %}


There's no current-flow analogy for directed graphs (current has to be conserved, but directed walks don't conserve "flow" the same way), so this half uses absorbing Markov chains instead.

1. Builds a column-stochastic transition matrix `P` from edge weights (probability of going from node `j` to each of its out-neighbors).
2. For each ordered pair `(source, target)`, makes `target` an absorbing state (once you land there, you stay).
3. Splits out the "transient" states (everything but `target`) into a sub-matrix `Q`.
4. Computes the fundamental matrix `N = (I - Q)^-1` as a standard Markov chain where `N[i,j]` is the expected number of visits to state `i` before absorption, given you started at `j`.
5. Reads off column `source` of `N` which is the expected visit count to every other node on a walk from `source` until it's absorbed at `target`.
6. Sums this over all `(source, target)` pairs.

In my implementation, dangling nodes (nodes with no outgoing edges) are handled as self-loops so the Markov chain doesn't break, and are skipped as sources, since a walk can't go where, we might as well not walk it.

Most importantly performance-wise, my implementation involves inverting the matrix for every ordered pair (which is computationally expensive), but is the only way to define "expected visits" when the walk can't backtrack the way it came.  Frankly, I don't know of a better way to do it that is agnostic to network structure.  So if someone knows a better way, let me know.

Here is the code I tested with in my Jupyter Notebook:

{% highlight python linenos %}{% raw %}from typing import Any

import networkx as nx
import numpy as np


def compare_with_networkx(
    G: nx.Graph | nx.DiGraph,
    verbose: bool = True,
) -> tuple[dict[Any, float], dict[Any, float] | None]:
    """
    Compare this module's implementation against NetworkX's own centrality function.

    For an undirected, connected graph this runs both
    `random_walk_betweenness_centrality` and NetworkX's
    `current_flow_betweenness_centrality` and reports their correlation,
    since Newman's paper shows the two should agree on undirected graphs.
    For directed (or disconnected) graphs there's no NetworkX equivalent to
    compare against, so only our result is returned.

    Parameters
    ----------
    G : nx.Graph or nx.DiGraph
        The graph to evaluate. May be directed or undirected.
    verbose : bool, default True
        If True, print a ranked top-10 comparison (and, for the undirected
        case, the Pearson correlation between the two sets of scores).

    Returns
    -------
    tuple[dict[Any, float], dict[Any, float] | None]
        `(our_result, nx_result)`. `nx_result` is `None` whenever `G`
        is directed or disconnected, since NetworkX's
        `current_flow_betweenness_centrality` doesn't support either case.
    """
    our_result: dict[Any, float] = random_walk_betweenness_centrality(G, normalized=True)

    if G.is_directed():
        if verbose:
            print("NetworkX doesn't support directed graphs for current-flow betweenness")
            print("\nOur implementation:")
            for node, value in sorted(our_result.items(), key=lambda x: -x[1])[:10]:
                print(f"  {node}: {value:.6f}")
        return our_result, None

    if not nx.is_connected(G):
        if verbose:
            print("Graph is not connected, NetworkX will fail")
        return our_result, None

    nx_result: dict[Any, float] = nx.current_flow_betweenness_centrality(G, normalized=True)

    if verbose:
        print("NetworkX current_flow_betweenness_centrality:")
        for node, value in sorted(nx_result.items(), key=lambda x: -x[1])[:10]:
            print(f"  {node}: {value:.6f}")

        print("\nOur implementation:")
        for node, value in sorted(our_result.items(), key=lambda x: -x[1])[:10]:
            print(f"  {node}: {value:.6f}")

        # Check correlation
        nodes: list[Any] = list(G.nodes())
        nx_vals: list[float] = [nx_result[n] for n in nodes]
        our_vals: list[float] = [our_result[n] for n in nodes]
        corr: float = np.corrcoef(nx_vals, our_vals)[0, 1]
        print(f"\nCorrelation: {corr:.6f}")

    return our_result, nx_result


print("\n" + "=" * 70)
print("Test 1: Simple directed cycle with shortcut")
print("=" * 70)
G2 = nx.DiGraph()
G2.add_edges_from([
    (0, 1), (1, 2), (2, 3), (3, 0),  # cycle
    (0, 2),  # shortcut
])
print(f"Directed graph: {G2.number_of_nodes()} nodes, {G2.number_of_edges()} edges")
print("Edges:", list(G2.edges()))
print("\nRandom-walk betweenness (directed):")
result = random_walk_betweenness_centrality(G2)
for node, value in sorted(result.items(), key=lambda x: -x[1]):
    print(f"  Node {node}: {value:.6f}")

print("\n" + "=" * 70)
print("Test 3: Directed acyclic graph (information flow)")
print("=" * 70)
G4 = nx.DiGraph()
G4.add_edges_from([
    ('source', 'a'), ('source', 'b'),
    ('a', 'hub'), ('b', 'hub'),
    ('hub', 'c'), ('hub', 'd'),
    ('c', 'sink'), ('d', 'sink')
])
print("DAG: source -> {a,b} -> hub -> {c,d} -> sink")
print("\nRandom-walk betweenness (directed):")
result = random_walk_betweenness_centrality(G4)
for node, value in sorted(result.items(), key=lambda x: -x[1]):
    print(f"  {node}: {value:.6f}")
print("\nExpected: 'hub' should have highest betweenness")

print("\n" + "=" * 70)
print("Test 5: Directed social network (Twitter-like)")
print("=" * 70)
G6 = nx.DiGraph()
# Hub-and-spoke with some cross-connections
G6.add_edges_from([
    # Followers of hub
    ('user1', 'hub'), ('user2', 'hub'), ('user3', 'hub'),
    ('user4', 'hub'), ('user5', 'hub'),
    # Hub follows some influencers
    ('hub', 'influencer1'), ('hub', 'influencer2'),
    # Users also follow influencers
    ('user1', 'influencer1'), ('user2', 'influencer2'),
    # Some user-to-user connections
    ('user1', 'user2'), ('user3', 'user4'),
    # Influencers follow each other
    ('influencer1', 'influencer2'), ('influencer2', 'influencer1')
])
print(f"Directed graph: {G6.number_of_nodes()} nodes, {G6.number_of_edges()} edges")
print("\nRandom-walk betweenness (directed):")
result = random_walk_betweenness_centrality(G6)
for node, value in sorted(result.items(), key=lambda x: -x[1]):
    print(f"  {node:15s}: {value:.6f}"){% endraw %}{% endhighlight %}


{% highlight text linenos%}{% raw %}======================================================================
Test 1: Simple directed cycle with shortcut
======================================================================
Directed graph: 4 nodes, 5 edges
Edges: [(0, 1), (0, 2), (1, 2), (2, 3), (3, 0)]

Random-walk betweenness (directed):
  Node 0: 2.000000
  Node 2: 2.000000
  Node 3: 2.000000
  Node 1: 1.250000

======================================================================
Test 2: Directed acyclic graph (information flow)
======================================================================
DAG: source -> {a,b} -> hub -> {c,d} -> sink

Random-walk betweenness (directed):
  hub: 0.500000
  a: 0.233333
  b: 0.233333
  c: 0.233333
  d: 0.233333
  source: 0.200000
  sink: 0.200000

Expected: 'hub' should have highest betweenness

======================================================================
Test 3: Directed social network (Twitter-like)
======================================================================
Directed graph: 8 nodes, 13 edges

Random-walk betweenness (directed):
  hub            : 0.357143
  influencer2    : 0.265873
  influencer1    : 0.257937
  user4          : 0.130952
  user2          : 0.119048
  user1          : 0.095238
  user3          : 0.095238
  user5          : 0.071429{% endraw %}{% endhighlight %}

{% include components/heading.html heading='How This Differs From Shortest-Path and Current-Flow Betweenness' level=2 %}

Standard `betweenness_centrality` assumes every cascade takes the single shortest path between `source` and `target`, ignoring anything else even if it's only one step longer. `current_flow_betweenness_centrality` relaxes that: it treats the graph like a resistor network, so "traffic" spreads across every path in proportion to conductance, and it's undirected by construction (current has no notion of forward vs. backward). This implementation sits in between, but in a different dimension than "how many paths": it keeps `current_flow_betweenness_centrality`'s idea of spreading probability across every available route, but replaces the electrical-network analogy with an absorbing Markov chain that only steps along outgoing edges. This has two effects:

* A node on the shortest path can still score low. Shortest-path betweenness gives a node full credit for a pair `(source, target)` when it lies on a minimum-hop path, with no discount for how many comparably-good alternatives exist alongside it. For random walk betweenness, probability mass splits at every node with multiple neighbors/forks, so a node's score depends on how much of that mass survives to reach `target`.
  For example, if `source` has 5 outgoing edges: one goes to node `i`, which then reaches `target` in one more hop (shortest path, length 2), and the other 4 each lead to `target` by a longer, 3-hop route. Shortest-path betweenness credits `i` with the full pair, same as if `source` only had that one edge. The random walk sends only ~1/5 of the mass toward `i` in the first step, so `i` ends up with roughly a fifth of the credit a lone shortest-path route would give it, even though it's still, unambiguously, the fastest way from `source` to `target`.
- A node can score high here for reasons current-flow betweenness can't produce, because current-flow betweenness is symmetric under reversing the graph and this measure isn't. A node that's easy to reach from many sources but hard to leave (or vice versa) gets a directional score that has no undirected analog. Nothing in `current_flow_betweenness_centrality`'s output that captures a node being a funnel in one direction but not the other.

The test outputs illustrate the shape of that difference:

- In the DAG test (Test #2), `hub` scores roughly double any other node (0.5 vs ~0.2-0.23). A shortest-path betweenness on this DAG would show the same qualitative ranking, since there's only one route through.  Current-flow betweenness has no defined output here at all, since NetworkX's implementation requires an undirected, connected graph.
- In the social-network test (Test #3), `hub` and the two `influencer` nodes dominate while the `user*` nodes trail behind. Shortest-path betweenness would likely rank the influencers highly too, since they sit on the reciprocal `influencer1 <-> influencer2` edge and several inbound paths but it wouldn't distinguish between a node that gets a lot of forwarded traffic versus one that merely lies on one particular shortest hop, the way the random-walk score implicitly does by weighting every potential path a walker might take.
- Scores aren't comparable across graphs of different sizes unless you use `normalized=True` as expected-visit counts (like path counts) grow with the number of nodes and source-target pairs. Even normalized, treat these as relative rankings within a single graph rather than as portable, cross-graph numbers.

Practically, use shortest-path betweenness when traffic takes the optimal route and only the optimal route; reach for `current_flow_betweenness_centrality` when direction doesn't matter but you want credit spread across all routes rather than concentrated on one; reach for this when direction matters *and* you want that same credit-spreading behavior current-flow gives you, which is the combo neither built-in NetworkX function covers.

{% include components/heading.html heading='Conclusion' level=2 %}

NetworkX's betweenness measures assume a walk can move either direction along an edge, which doesn't hold for things like gossip, one-way follower graphs, or any process that only propagates forward. This implementation handles that case by tracking, for every pair of nodes, the expected number of times a random walk passes through each other node on its way from one to the other, and it does that even when the graph only allows travel in one direction. However, getting an exact answer here means solving a small linear system for every pair of nodes in the graph, so this is best suited for graphs from a few dozen up to a few hundred nodes, not web-scale graphs (granted NetworkX isn't the right tool for any analysis on large-scale graphs).

With that web-scale limitation, there's a lot of room for improvement. The per-pair matrix inversion is still `O(n^3)`, and running it for every ordered pair is the dominant cost for anything beyond a few hundred nodes. I understand Brandes and Fleischer's trick of reducing current-flow betweenness to a single set of linear systems (rather than one inversion per pair) would be promising to look at. This implementation still treats "expected visits" as the target metric; White and Borgatti have a normalization approach for directed betweenness, built around reciprocated vs. unreciprocated arcs, which might be better for comparing centrality across graphs with very different directedness. If anyone has implemented this using one of those approaches, they might be better options.

{% include components/heading.html heading='See Also' level=2 %}

- M.E.J. Newman, ["A measure of betweenness centrality based on random walks"](https://arxiv.org/abs/cond-mat/0309045), *Social Networks* 27 (2005), 39–54. Defines undirected random-walk betweenness measure and its equivalence to current-flow betweenness, which is what I attempted to extend.
- D.R. White and S.P. Borgatti, ["Betweenness centrality measures for directed graphs"](https://doi.org/10.1016/0378-8733(94)90015-9), *Social Networks* 16 (1994), 335–346. An earlier, geodesic-based (not random-walk) generalization of betweenness to directed graphs, including a normalizing reciprocated vs. unreciprocated arcs.  It's basically an earlier approach for solving random walk betweenness centrality for directed graphs.
- U. Brandes and D. Fleischer, ["Centrality Measures Based on Current Flow"](https://www.uni-konstanz.de/algo/publications/bf-cmbcf-05.pdf), *STACS* 2005, LNCS 3404, 533–544. Frames current-flow betweenness as a set of linear systems solvable without inverting a matrix per source-target pair, which is the bottleneck of my implementation.
- J.G. Kemeny and J.L. Snell, [*Finite Markov Chains*](https://www.math.pku.edu.cn/teachers/yaoy/Fall2011/Kemeny-Snell1976.pdf), Springer (1976). Standard reference for absorbing Markov chains and the fundamental matrix
- S. Brin and L. Page, ["The Anatomy of a Large-Scale Hypertextual Web Search Engine"](http://infolab.stanford.edu/pub/papers/google.pdf), *Computer Networks* 30 (1998), 107–117. PageRank's dangling-node handling (teleportation on dead ends) is the other standard way to resolve the problem around dangling nodes.