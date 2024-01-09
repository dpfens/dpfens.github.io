---
layout: post
title:  "Data Simplification & Summarization"
description: Simplifying polylines and trajectories using the Ramer-Douglas-Puecker algorithm, and summarizing graphs/networks to speed up computations using grouping-based and compression-based algorithms.
keywords: simplification,simplify,line,polyline,trajectory,summary,summarize,graph,network
tags: data graph-theory math python
---

{% include components/heading.html heading='Why?' level=2 %}

Why would we want to simplify data?  We hear all about large technology companies that use "big data" to predict things previously thought to be impossible, such as training a computer to drive a car. 
 So why would we want to take data and simplify it?  Wouldn't that mean we are losing information that we should use?
Before we get to that we should probably answer some basic questions first. Like, what is a polyline?  <em>A polyline is a continuous line made up of many straight line segments</em>.  SVG even defines an element called a [polyline](https://www.w3.org/TR/SVG11/shapes.html#PolylineElement) which is exactly the same as the polylines I am talking about here.  A polyline can represent real-world data such as trajectories, topological lines, and even graphs.   <em>Simplifying a polyline means reducing the number of points in a polyline but still keeping the general shape of the original line.</em>

Polylines often want to be simplified for a few different reasons:

<ul>
    <li><b>Reduce cost of data storage.</b>  Storing many polylines with many points, reducing the number of points in each polyline can save lots of space on the machines hosting the database.  In a cloud-based scenario, this could result in a monthly saving of thousands of dollars by no longer needing to pay for storage space.</li>
    <li><b>Speed up computation of other processes.</b>- Some algorithms that run on polylines can take significantly longer when the polyline contains more points.  By reducing the the number of points, developers can execute these algorithms in less time, and using less memory.</li>
    <li><b>Denoising.</b>  In some cases, polylines may contain noise, or points that are not useful in their application.  For example, in a person's GPS trajectory, many points may be recorded when the person has stopped at a location.  Since only 2 points would be required to indicate when the person arrived and left the location, the other points could be considered noise and not worth storing/processing.</li>
</ul>

A graph is data structure used to represent networks such as social networks, road networks, supply chains, documents, etc.  These networks can be very large and thus difficult for a human to interpret.  Graph summarization focuses on facilitating <q cite="https://arxiv.org/abs/1612.04883">the identification of structure and meaning in data</q> so that humans can interpret the structure of a graph.

{% include components/heading.html heading='How?' level=2 %}

Polyline simplification has many different algorithms.  In fact, there were already many different algorithms in existence by 1990.  To this day, the most popular popular algorithms for polyline simplification are [Ramer-Douglas-Puecker](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm), and [Visvalingham-Whyatt](https://www.semanticscholar.org/paper/The-Douglas-Peucker-Algorithm-for-Line-through-Visvalingam-Whyatt/571e05f74711277f769f8194c2c60d29c70ce749).  These approaches can be applied in any number of dimensions using any calculable distance metric. 

Ramer-Douglas-Puecker measures how different a point is from it's neighbors by measuring the perpendicular distances from the point, to a line between it's two neighbors.  If the point is within a user-specific distance of the line, the point is removed.

{% highlight python linenos %}{% raw %}import numpy as np
import math


def perpendicular_distance(point, a, b):
    """
    perpendicular distance between a point and a line segment

    Arguments:
        point (tuple|list): The point
        a (tuple|list): The start point of the line segment
        b (tuple|list): The end point of the line segment

    Returns:
        float: perpendicular distance
    """
    point = np.array(point)
    a = np.array(a)
    b = np.array(b)
    ba = b - a
    numerator = np.linalg.norm(np.cross(ba, b-point))
    denominator = np.linalg.norm(ba)
    return numerator/denominator


def ramer_douglas_peucker(points, epsilon):
    """
    Algorithm that decimates a curve composed of line segments to a similar curve with fewer points

    Arguments:
        points(list): list of sequential points in the polyline
        epsilon (int|float): The maximum distance from the existing line to be considered an essential point

    Returns:
        list:  The simplified polyline
    """
    dmax = 0
    index = 0

    for i in range(1, len(points) - 1):
        d = perpendicular_distance(points[i], points[0], points[-1])
        if d > dmax:
            index = i
            dmax = d

    if dmax > epsilon:
        results1 = ramer_douglas_peucker(points[:index + 1], epsilon)[:-1]
        results2 = ramer_douglas_peucker(points[index:], epsilon)
        results = results1 + results2
    else:
        results = [points[0], points[-1]]
    return results


if __name__ == '__main__':
    points = [(0,0),(1,0.1),(2,-0.1),(3,5),(4,6),(5,7),(6,8.1),(7,9),(8,9),(9,9)]
    correct = [(0, 0), (2, -0.1), (3, 5), (6, 8.1), (9, 9)]
    epsilon = 1.0
    new_points = ramer_douglas_peucker(points, epsilon)
    print(new_points){% endraw %}{% endhighlight %}

Visvalingham-Whyatt has a fairly intuitive approach.  This approach finds the area of triangles made up between each point and its two neighbors.  The point with the smallest area triangle is removed, then the triangles of it's neighbors are re-calculated, and the point with the smallest area triangle is removed.  This process is performed repeatedly until a user-specified number of minimum points remain in the polyline, or until only the start and end point of the polyline remain.  Unlike Ramer-Douglas-Pueker this approach accounts for both the distance between the point and it's neighbors and the distance between the two neighbors themselves.  This ensures  that when two neighbors of a point are near to each other, the point is more likely to be removed, and less likely to be removed when they are far from each other. It also runs in O(n) time.

{% highlight python linenos %}{% raw %}import numpy as np
import math


def triangle_area(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ab = a - b
    ab_dist = np.linalg.norm(ab)

    cb = c - b
    cb_dist = np.linalg.norm(cb)
    fraction = np.dot(ab, cb) / (ab_dist * cb_dist)
    theta = math.acos(fraction)
    return 0.5 * ab_dist * cb_dist * math.sin(theta)


def visvalingham_whyatt(points, **kwargs):
    """
    Visvalingham-Whyatt algorithm for polyline simplification

    Runs in  linear O(n) time

    Parameters:
        points(list): list of sequential points in the polyline

    Keyword Arguments:
        min_points(int):  Minimum number of points in polyline, defaults to 2
        inplace (bool):  Indicates if the input polyline should remove points from the input list, defaults to False

    Returns:
        list: A list of min_points of the simplified polyline
    """
    point_count = len(points)
    if not kwargs.get('inplace', False):
        new_points = list(points)
    else:
        new_points = points
    areas = [float('inf')]
    point_indexes = list(range(point_count -1))
    for i in range(1, point_count - 1):
        area = triangle_area(points[i - 1], points[i], points[i + 1])
        areas.append(area)

    min_points = kwargs.get('min_points', 2)
    while len(new_points) > min_points:
        smallest_effective_index = min(point_indexes, key=lambda i: areas[i])
        new_points.pop(smallest_effective_index)
        areas.pop(smallest_effective_index)
        point_count = len(new_points)
        point_indexes = list(range(point_count -1))
        # recompute area for point after previous_smallest_effective_index
        if smallest_effective_index > 1:
            areas[smallest_effective_index - 1] = triangle_area(new_points[smallest_effective_index - 2], new_points[smallest_effective_index - 1], new_points[smallest_effective_index])
        # recompute area for point before previous smallest_effective_index
        if smallest_effective_index < point_count - 1:
            areas[smallest_effective_index] = triangle_area(new_points[smallest_effective_index - 1], new_points[smallest_effective_index], new_points[smallest_effective_index + 1])
    return new_points


if __name__ == '__main__':
    points = [(0,0),(1,0.1),(2,-0.1),(3,5),(4,6),(5,7),(6,8.1),(7,9),(8,9),(9,9)]

    point_count = len(points)
    new_points = visvalingham_whyatt(points, min_points=point_count - 2)
    print(points)
    print(new_points){% endraw %}{% endhighlight %}

Graph summarization has relatively few algorithms.  Graphs can contain many nodes, each of which can have one or more edge to any of the other nodes in the graph.   This greatly increases the amount of computation needed to process the graph, and the computational efficiency needed to reasonably process large graphs only became available in the last 20 years.  However, not all algorithms can be used on all types of graphs (static, attributed, temporal, etc.), and many algorithms have different summarization objectives (query time, pattern recognition, visualization, etc).

One approach to graph summarization is removing edges from a graph such that the overall structure of the original graph is preserved.  Dedensification is a process that does this by replacing edges around high-degree nodes and with a compressor node that shares edges between the original sources and targets of the original edges.  For example, let's say we have 10 low-degree nodes with edges to 10 high-degree nodes represented by 100 edges.  Dedensification would replace those 100 edges with a 10 edges connecting to a compressor node, and 10 edges connecting the compressor node to the original high-degree node.  This reduces the number of edges between those nodes by 80%, speeds up algorithm performance on the updated graph and make it easier for viewers to process the number of nodes in the updated graph.

The [SNAP and KSNAP algorithms](http://pages.cs.wisc.edu/~jignesh/publ/summarization.pdf) make graphs easier to interpret by creating a summary graph of supernodes that represent sets of nodes with the same user-specified node attributes and have similar edge connectivity with other supernodes in the graph.  The SNAP algorithm creates a summary graph of supernodes that represent nodes that share node attribute values and share edges of the same type with the same other supernodes.  That way, viewers of the summary graph can assume that the supernodes in the summary graph represent the exact node attributes and edge types from the original graph.

In the case of large graphs, the compressed graph may contain many compressed-nodes that represent a small number of nodes, making the compressed graph still hard to interpret by a human.  KSNAP resolves this by allowing the user to specify the number of supernodes in the produced summary graph.  This allows users to get summaries with varying levels of detail.  For example, high-level summaries may only have a handful of nodes, while a detailed summary may have many nodes.  To achieve a summary graph with fewer nodes the KSNAP algorithm loosens the SNAP constraint of "all nodes in a supernode must have the node attributes and the same edge types with other supernodes" to "all nodes in a supernode must have the same node attributes and <em>similar connectivity</em> with other supernodes in the graph".  This way, the summary graph can still be a fairly accurate summary of the graph structure, and still produce an accurate summary.

To make these graph algorithms more generally available, I wrote the `summarization` module to the networkx Python library which is available in networkx 2.6.  Currently the `dedensify` function and `snap_aggregation` is included, with the `KSNAP` algorithms in [testing](https://github.com/dpfens/networkx/tree/ksnap).

{% include components/heading.html heading='Applications & Conclusion' level=2 %}

Polyline simplication can be applied to time series of data that is represented by a coordinate system.  This means that it could be applied to GPS trajectories, user behavior vectors, financial market positions, and more.  Graph summarization can also be applied to any graph where each node has meaningful attributes and the relationships need to be understood by a human.  To apply graph summarization to attributes of continuous data, you will need to convert the continuous attributes to ordinal categories, or implement [Discovery-driven Graph Summarization](https://ieeexplore.ieee.org/document/5447830) to create those ordinal categories automatically.

These approaches to removing noise from the data can be very useful for efficiently storing and intensive computing, as well as for human consumption.  I would highly recommend using these approaches in industry and personal projects when applicable.