---
layout: post
title:  "Trajectory Analysis"
description: How to extract information from detail trajectory data, and compare trajectories.
keywords: trajectory,vector,distance,convoy,cluster,stop,segmentation
tags: trajectory math python
---

{% include components/heading.html heading='Overview' level=2 %}

For the last couple of years, I have been working with time series data.  As usual, it started with something I was trying to do that involved race results.  But I discovered for myself that trajectory analysis can be applied to many fields.  In fact, it can be applied to any temporal data that uses vector spaces.  Some of the applications include identifying segments of movement, trajectory clustering, convoy detection, pattern mining, and classification, anomaly detection, and predictions.  In this post, I will only cover segmentation, trajectory clustering, and convoy detection.

{% include components/heading.html heading='Segmentation' level=2 %}

{% include components/heading.html heading='Change Points' level=3 %}

Change point detection is a fundamental technique in time series analysis, particularly crucial in trajectory segmentation. This method aims to identify points in a time series where significant changes occur in the underlying statistical properties of the data. In the context of trajectory segmentation, change point detection helps divide complex paths or movements into distinct, meaningful segments, each potentially representing different behaviors, states, or environmental influences.

The primary goal of change point detection in trajectory analysis is to pinpoint moments where the characteristics of movement undergo substantial shifts. These shifts could manifest as changes in speed, direction, acceleration, or other relevant metrics. By identifying these critical points, analysts can break down complex trajectories into simpler, more homogeneous segments, facilitating deeper insights into the behavior of moving entities, be they vehicles, animals, or even particles in a physical system.

Applications of change point detection in trajectory segmentation span various fields. In transportation, it can help identify different phases of a vehicle's journey, such as stops, turns, or changes in traffic conditions. Wildlife researchers use this technique to analyze animal movements, segmenting paths into behaviors like foraging, resting, or migration. In sports analytics, change point detection can break down an athlete's performance into distinct phases, offering insights into strategy changes or fatigue onset.

The effectiveness of change point detection in trajectory segmentation largely depends on the choice of algorithm and its parameters. Some methods focus on detecting abrupt changes, while others are more sensitive to gradual transitions. The selection of an appropriate algorithm often involves balancing factors such as computational efficiency, sensitivity to different types of changes, and robustness to noise in the data. Common approaches include statistical methods like CUSUM (Cumulative Sum), Bayesian techniques, and machine learning-based algorithms.

One notable algorithm is the E-Divisive Means (EDM) method. EDM is a non-parametric approach to change point detection that excels in identifying multiple change points in multivariate time series data. It works by recursively segmenting the time series, maximizing the difference in multivariate means between adjacent segments. This method is particularly useful in trajectory analysis due to its ability to handle multidimensional data, making it suitable for complex trajectories that involve changes in multiple parameters simultaneously. EDM's strength lies in its flexibility and its capacity to detect both subtle and dramatic changes in trajectory characteristics, making it a valuable tool in diverse applications from urban mobility studies to complex system analysis.


{% highlight python linenos %}{% raw %}
from typing import List, Callable
import tomotopy as tp
import random
import math


class EDivisiveMeans:
    """
    Implements the E-Divisive Means algorithm for detecting change points in multivariate time 
    series data.  This algorithm identifies points in a time series where the statistical
    properties of the data change significantly. It's useful for detecting shifts in trends,
    sudden changes in behavior, or transitions between different states in your data.
    The E-Divisive Means algorithm is a non-parametric method that can detect multiple change
    points in multivariate time series. It works by recursively dividing the time series into
    segments and using an energy statistic to measure the difference between segments.
    Configuration:
    The algorithm can be fine-tuned using two main parameters:
    1. Significance Level (alpha):
       - Controls how strict the algorithm is in declaring a change point
       - Lower values make the algorithm more conservative, detecting only very strong changes
       - Higher values make it more sensitive, potentially detecting more subtle changes
       - Range: 0 < alpha < 1, typically set between 0.01 and 0.1
    2. Minimum Segment Size:
       - Defines the smallest number of data points that can be considered a separate segment
       - Helps prevent the algorithm from detecting changes in very short segments of data
       - Should be set based on the granularity of changes you're interested in and your data's 
         sampling rate
       - Example: If your data is sampled daily and you're not interested in changes that occur 
                  over less than a month, you might set this to 30
    Usage Tips:
    - Start with default values and adjust based on your specific needs and data characteristics
    - If you're getting too many change points, try decreasing alpha or increasing min_segment_size
    - If you're not detecting changes you believe are significant, try increasing alpha or 
      decreasing min_segment_size
    - Remember that the appropriate configuration can vary depending on your data and use case
    Detailed Algorithm Explanation:
    1. Initialization: Start with the entire time series as one segment.
    2. Divide and Compare:
       - For each possible splitting point in the current segment:
         a. Calculate the energy statistic between the two resulting sub-segments.
         b. The energy statistic measures the difference between the multivariate distributions
            of the two sub-segments.
       - Identify the splitting point that maximizes the energy statistic.
    3. Statistical Significance:
       - Perform a permutation test to determine if the best split is statistically significant.
       - This involves randomly shuffling the data many times and comparing the energy statistic
         of these shuffled versions to the original split.
    4. Recursion:
       - If the split is significant:
         a. Add this point to the list of change points.
         b. Recursively apply steps 2-4 to each of the two resulting segments.
    5. Termination:
       - Stop when no more significant change points are found, or when segments become too small
         to be further divided (as defined by min_segment_size).
    Key features:
    1. Non-parametric: Does not assume any specific distribution of the data.
    2. Multivariate: Can handle multidimensional data.
    3. Multiple change points: Can detect multiple change points in a single time series.
    4. Statistical significance: Uses permutation tests to ensure statistical significance of
    detected change points.
    Attributes:
        alpha (float): The significance level for the statistical tests (default: 0.05)
        min_segment_size (int): The minimum size of a segment to consider for splitting (default: 30)
        _energy_cache (dict): A cache to store computed energy statistics for efficiency.
    """

    def __init__(self, alpha=0.05, min_segment_size=30):
        """
        Initialize the E-Divisive Means detector.
        Args:
            alpha (float, optional): The significance level for detecting change points. 
                - Range: 0 < alpha < 1
                - Default: 0.05 (5% significance level)
                - Lower values (e.g., 0.01) make the detector more conservative
                - Higher values (e.g., 0.1) make it more sensitive to changes
            min_segment_size (int, optional): The minimum number of data points required in a segment.
                - Default: 30
                - Represents the smallest chunk of data that can be considered its own segment
                - Should be set based on the minimum timeframe over which you expect meaningful 
                  changes to occur in your data
                - Example: For hourly data, setting this to 24 would mean the smallest detectable 
                           change occurs over a day
        Example usage:
            # Default configuration
            detector = EDivisiveMeans()
            # Custom configuration: More sensitive to changes, allowing smaller segments
            sensitive_detector = EDivisiveMeans(alpha=0.1, min_segment_size=20)
            # Custom configuration: More conservative, requiring larger segments
            conservative_detector = EDivisiveMeans(alpha=0.01, min_segment_size=50)
        """
        self.alpha = alpha
        self.min_segment_size = min_segment_size
        self._energy_cache = {}

    def detect(self, data):
        """
        Detect change points in the given multivariate time series data.
        Args:
            data (list of list): The multivariate time series data. Each inner list represents a data point
                                 with multiple dimensions.
        Returns:
            list: Indices of detected change points.
        """
        self._energy_cache.clear()  # clear energy cache
        change_points = []
        self._recursive_segmentation(data, 0, len(data), change_points)
        self._energy_cache.clear()
        return change_points

    def _recursive_segmentation(self, data, start_index, end_index, change_points):
        """
        Recursively segment the data to find change points.
        Args:
            data (list of list): The multivariate time series data.
            start_index (int): The start index of the current segment.
            end_index (int): The end index of the current segment.
            change_points (list): List to store detected change points.
        """
        if end_index - start_index < 2 * self.min_segment_size:
            return

        max_energy = float('-inf')
        best_split = None

        for i in range(start_index + self.min_segment_size, end_index - self.min_segment_size + 1):
            energy = self._calculate_energy_statistic(data, start_index, i, end_index)
            if energy > max_energy:
                max_energy = energy
                best_split = i

        if best_split is not None and self._is_statistically_significant(data[start_index:end_index], max_energy):
            change_points.append(best_split)
            self._recursive_segmentation(data, start_index, best_split, change_points)
            self._recursive_segmentation(data, best_split, end_index, change_points)

    def _calculate_energy_statistic(self, data, start1, end1, end2):
        """
        Calculate the energy statistic between two segments of the data.
        The energy statistic measures the difference between two multivariate distributions.
        It is defined as:
        E = (2 * n1 * n2 / (n1 + n2)) * ||mean1 - mean2||^2
        where n1 and n2 are the sizes of the two segments, mean1 and mean2 are their respective
        multivariate means, and ||.||^2 is the squared Euclidean norm.
        Args:
            data (list of list): The multivariate time series data.
            start1 (int): Start index of the first segment.
            end1 (int): End index of the first segment (exclusive) / Start index of the second segment.
            end2 (int): End index of the second segment (exclusive).
        Returns:
            float: The calculated energy statistic.
        """
        cache_key = f"{start1},{end1},{end2}"

        # Check if the result is already in the cache
        if cache_key in self._energy_cache:
            return self._energy_cache[cache_key]

        n1 = end1 - start1
        n2 = end2 - end1
        mean1 = self._calculate_mean(data, start1, end1)
        mean2 = self._calculate_mean(data, end1, end2)
        diff = self._subtract_means(mean1, mean2)

        energy = (2 * n1 * n2 / (n1 + n2)) * self._dot_product(diff, diff)

        # Store the result in the cache
        self._energy_cache[cache_key] = energy
        return energy
    
    def _is_statistically_significant(self, segment_data, energy, num_permutations=1000):
        """
        Determine if a split is statistically significant using a permutation test.
        This method uses stratified sampling and adaptive importance sampling to improve
        efficiency while maintaining accuracy.
        Args:
            segment_data (list of list): The data segment to test.
            energy (float): The energy statistic of the proposed split.
            num_permutations (int): The number of permutations to use in the test.
        Returns:
            bool: True if the split is statistically significant, False otherwise.
        """
        segment_size = len(segment_data)
        num_strata = min(10, segment_size)
        strata_size = segment_size // num_strata
        strata = []

        # Create strata based on energy values
        for i in range(num_strata):
            start_index = i * strata_size
            end_index = segment_size if i == num_strata - 1 else (i + 1) * strata_size
            strata.append(segment_data[start_index:end_index])

        num_greater_or_equal = 0
        total_permutations = 0

        # Calculate the maximum number of permutations that could still lead to a significant result
        max_allowed_greater_or_equal = math.floor(self.alpha * num_permutations)

        for i in range(num_permutations):
            selected_stratum = random.choice(strata)
            shuffled_data = self._shuffle(selected_stratum[:])
            max_permuted_energy = float('-inf')

            for j in range(1, len(selected_stratum)):
                perm_energy = self._calculate_energy_statistic(shuffled_data, 0, j, len(selected_stratum))
                max_permuted_energy = max(max_permuted_energy, perm_energy)

            if max_permuted_energy >= energy:
                num_greater_or_equal += 1

            total_permutations += 1

            # Early stopping condition: if we've exceeded the maximum allowed number of greater-or-equal energies
            if num_greater_or_equal > max_allowed_greater_or_equal:
                return False

            # Early stopping condition: if it's impossible to reach significance
            if num_permutations - i + num_greater_or_equal <= max_allowed_greater_or_equal:
                return True

            # Adaptive importance sampling
            if max_permuted_energy >= energy:
                observed_significance = num_greater_or_equal / total_permutations
                additional_permutations = math.floor(num_permutations * max(0.1, observed_significance / self.alpha))
                for k in range(additional_permutations):
                    shuffled_data = self._shuffle(selected_stratum[:])
                    max_permuted_energy = float('-inf')

                    for j in range(1, len(selected_stratum)):
                        perm_energy = self._calculate_energy_statistic(shuffled_data, 0, j, len(selected_stratum))
                        max_permuted_energy = max(max_permuted_energy, perm_energy)

                    if max_permuted_energy >= energy:
                        num_greater_or_equal += 1

                    total_permutations += 1

                    # Check early stopping conditions after each additional permutation
                    if num_greater_or_equal > max_allowed_greater_or_equal:
                        return False
                    if num_permutations - i - k + num_greater_or_equal <= max_allowed_greater_or_equal:
                        return True

        p_value = num_greater_or_equal / total_permutations
        return p_value <= self.alpha

    def _shuffle(self, array):
        """
        Shuffle the given array in-place using the Fisher-Yates algorithm.
        Args:
            array (list): The array to shuffle.
        Returns:
            list: The shuffled array.
        """
        for i in range(len(array) - 1, 0, -1):
            j = random.randint(0, i)
            array[i], array[j] = array[j], array[i]
        return array
    
    def _calculate_mean(self, data, start_index, end_index):
        """
        Calculate the mean of a segment of multivariate data.
        Args:
            data (list of list): The multivariate time series data.
            start_index (int): The start index of the segment.
            end_index (int): The end index of the segment (exclusive).
        Returns:
            list: The mean vector of the segment.
        """
        dimensions = len(data[0])
        mean = [0] * dimensions

        for i in range(start_index, end_index):
            for j in range(dimensions):
                mean[j] += data[i][j]

        for j in range(dimensions):
            mean[j] /= (end_index - start_index)

        return mean
    
    def _subtract_means(self, mean1, mean2):
        """
        Subtract two mean vectors.
        Args:
            mean1 (list): The first mean vector.
            mean2 (list): The second mean vector.
        Returns:
            list: The difference between the two mean vectors.
        """
        return [val1 - val2 for val1, val2 in zip(mean1, mean2)]
    
    def _dot_product(self, v1, v2):
        """
        Calculate the dot product of two vectors.
        Args:
            v1 (list): The first vector.
            v2 (list): The second vector.
        Returns:
            float: The dot product of the two vectors.
        """
        return sum([val1 * val2 for val1, val2 in zip(v1, v2)])

{% endraw %}
{% endhighlight %}

The E-Divisive Means (EDM) algorithm offers several distinct advantages over other change point detection methods, particularly in the context of trajectory segmentation. One of its primary strengths is its non-parametric nature, which allows it to operate effectively without making strong assumptions about the underlying distribution of the data. This flexibility makes EDM well-suited for real-world trajectory data, which often exhibits complex, non-Gaussian behaviors. Additionally, EDM's ability to handle multivariate time series is crucial for trajectory analysis, where multiple parameters (such as position, velocity, and acceleration) may change simultaneously. Unlike some traditional methods that struggle with high-dimensional data, EDM maintains its effectiveness as the number of variables increases. The algorithm's divisive approach, which recursively splits the time series, allows it to detect multiple change points with high accuracy, even when the number of change points is unknown a priori. This feature is particularly valuable in trajectory segmentation, where the number of behavioral changes or environmental transitions is often not known in advance. Furthermore, EDM has shown robustness to noise and outliers, a common challenge in real-world trajectory data. Its computational efficiency, especially when implemented with optimizations, makes it suitable for large-scale trajectory datasets, enabling practical applications in fields ranging from urban planning to wildlife ecology.

{% include components/heading.html heading='Movement' level=3 %}

While change point detection methods like E-Divisive Means offer powerful tools for trajectory segmentation, they represent just one approach in a diverse toolkit for analyzing movement data. As we shift our focus, it's important to recognize that different segmentation techniques can reveal various aspects of trajectory behavior, each offering unique insights. One such complementary method is stop point detection, which focuses specifically on identifying locations where a moving entity pauses or remains stationary for a significant period. This technique is particularly valuable in contexts where the cessation of movement is as informative as the movement itself, such as in urban mobility studies or logistics analysis. Stop point detection algorithms typically employ criteria like spatial and temporal thresholds to distinguish genuine stops from brief pauses or GPS inaccuracies. By combining change point detection with stop point analysis and other segmentation methods, researchers and analysts can build a more comprehensive understanding of trajectory behaviors. This multi-faceted approach allows for the extraction of richer insights, capturing both the dynamic changes in movement patterns and the significant stationary events that punctuate these movements. As we delve deeper into trajectory segmentation techniques, we'll explore how these various methods can be integrated to provide a holistic view of movement data across different domains and applications.

Movement segmentation is simple:  It identifies when an object is considers moving, and when it is considered not moving.  This is most commonly used in services like Google Maps to determine when someone is at a given store, restaurant, home, etc. and when they are just passing by.

Segmentation allows developers to reduce the number of uninformative data points in a trajectory by not storing many data points for when an object is not moving.  If used along with <a href="/blog/simplification-summarization">trajectory simplification</a> methods, like Ramer-Douglas-Puecker or Visvalingham-Whyatt, trajectories can be greatly simplified without losing useful information.

Here is a definition of the <a href="https://online-journals.org/index.php/i-joe/article/viewFile/3881/3315">T-DBSCAN algorithm</a>, which is a fairly straightforward algorithm for identifying stops and movement segments in a given trajectory.  T-DBSCAN is a modified version of the DBSCAN density clustering algorithm, which required the following parameters for defining ho to segment the given trajectory points. `eps` is the maximum distance between two sequential points to be considered a neighbor, `c_eps` determines the furthest distance a point can be from another and still be considered at-rest. `min_points` is the minimum number of points needed to be within `eps` distance of a point to be considered at-rest.

In this implementation, all points in the trajectory are assumed to have been recorded at consistent intervals, and thus do not include timestamps.

{% highlight python linenos %}{% raw %}import math

def euclidean_distance(p1, p2):
    p1_length = len(p1)
    p2_length = len(p2)

    if p1_length != p2_length:
        raise ValueError('Points must have same number of dimensions (%r != %r)' % (p1_length, p2_length))

    distance = 0.0
    for i in range(p1_length):
        distance += math.pow(p2[i] - p1[i], 2)
    return math.sqrt(distance)


class TDBSCAN(object):
    """
    Trajectory DBSCAN (T-DBSCAN)
    Attributes:
        eps (float): The maximum distance between two sequential points to be
            considered a stop
        c_eps (float): The maximum distance to consider before considered a
            move
        min_points (int): The minimum number of neighbors to have before
            considered a cluster
    An algorithm for segmenting time-ordered location points in a trajectory,
    while identifying if the object was moving or not
    Originally published in T-DBSCAN: A Spatiotemporal Density Clustering for
    GPS Trajectory Segmentation
    See: https://online-journals.org/index.php/i-joe/article/viewFile/3881/3315
    """
    MOVING = -1
    STOP = 1

    def __init__(self, eps, c_eps, min_points=2, **kwargs):
        """
        Arguments:
            eps (float): The maximum distance between two sequential points to be considered a stop
            c_eps (float): The maximum distance to consider before considered a move
            min_points (int): The minimum number of neighbors to have before considered a cluster
        Keyword Arguments:
            distance_func (func): Calculates the distance between two points.
                defaults to Euclidean distance
        """
        if c_eps < eps:
            raise ValueError("eps(%r) must be lower than c_eps(%r)" % (eps, c_eps))
        self.eps = eps
        self.c_eps = c_eps
        self.min_points = min_points
        self.distance_func = kwargs.get('distance_func', euclidean_distance)

    def fit_predict(self, X, y=None, **kwargs):
        """
        Identifies segments in a trajectory where the object is likely not
        moving
        Arguments:
            X(list|tuple): A time-ordered list of trajectory points
        Returns:
            tuple:
                tuple: stop clusters for each data point
                tuple: state for each segment between data points
        """
        trajectory_point_count = len(X)

        cluster = 0
        max_id = 0
        clusters = [-1 for _ in range(trajectory_point_count)]
        while max_id < trajectory_point_count:
            neighbors = self._neighbors(max_id, X, self.eps, self.c_eps, self.distance_func)
            if len(neighbors) >= self.min_points:
                cluster += 1
                max_id = self._expand_cluster(X, max_id, neighbors, self.eps, self.c_eps, self.min_points, self.distance_func, clusters, cluster)
            max_id += 1

        cluster_intervals = []
        previous_index_cluster = clusters[0]
        cluster_start = cluster_stop = 0

        for i in range(1, trajectory_point_count):
            index_cluster = clusters[i]
            is_last_point = i == trajectory_point_count - 1
            if index_cluster != previous_index_cluster or is_last_point:
                cluster_intervals.append((cluster_start, cluster_stop))
                cluster_start = i
            cluster_stop = i
            previous_index_cluster = index_cluster

        self._merge(clusters, cluster_intervals)

        segment_types = [self.MOVING] * (trajectory_point_count - 1)
        for start_index, end_index in cluster_intervals:
            for i in range(start_index, end_index):
                segment_types[i] = self.STOP

        return clusters, segment_types

    @classmethod
    def _merge(cls, clusters, cluster_intervals):
        i = 0
        while i < len(cluster_intervals) - 1:
            i_cluster_interval = cluster_intervals[i]
            j = i + 1
            j_cluster_interval = cluster_intervals[j]
            is_overlapping = cls._is_temporally_overlapping(i_cluster_interval, j_cluster_interval)
            if not is_overlapping:
                cluster_intervals.pop(j)
                new_cluster_interval = i_cluster_interval[0], j_cluster_interval[-1]
                cluster_intervals[i] = new_cluster_interval

                cluster_id = clusters[i_cluster_interval[0]]
                for k in range(*j_cluster_interval):
                    clusters[k] = cluster_id
            else:
                i = i + 1

    @staticmethod
    def _is_temporally_overlapping(c1_interval, c2_interval):
        return max(c1_interval) <= min(c2_interval)

    @staticmethod
    def _neighbors(index, X, eps, c_eps, distance_func):
        output = set()
        trajectory_point_count = len(X)
        for neighbor_index in range(index + 1, trajectory_point_count):

            neighbor = X[neighbor_index]
            distance = distance_func(X[index], neighbor)
            if distance < eps:
                output.add(neighbor_index)
            elif distance > c_eps:
                break
        return output

    @classmethod
    def _expand_cluster(cls, X, point_index, neighbor_indices, eps, c_eps, min_points, distance_func, clusters, cluster):
        max_id = point_index
        clusters[point_index] = cluster
        neighbor_indices = list(neighbor_indices)
        while neighbor_indices:
            neighbor_indices.sort()
            index = neighbor_indices.pop(0)
            if index > max_id:
                max_id = index
            n_neighbors = cls._neighbors(index, X, eps, c_eps, distance_func)
            threshold_met = len(n_neighbors) >= min_points
            if clusters[index] < 0 or threshold_met:
                clusters[index] = cluster
                if threshold_met:
                    neighbor_indices += list(n_neighbors)

        return max_id{% endraw %}{% endhighlight %}

Here is an example of how to use this code:

{% highlight python linenos %}{% raw %}trajectory = [
    (1, 1),
    (1, 1.2),
    (1, 1.4),
    (22, 45),
    (22, 45.3),
    (5, 4.5),
    (5, 4.8),
    (5, 4.4),
    (5, 4.8),
    (5, 5.6),
    (8, 7),
    (6, 6),
    (8, 9)
]
eps = 0.8
c_eps = 2
min_points = 1
clf = TDBSCAN(eps, c_eps, min_points)
clusters, segment_types = clf.fit_predict(trajectory)
for start_index in range(len(trajectory) - 1):
    end_index = start_index + 1
    segment_type = segment_types[start_index]
    segment_type_description = 'STOP' if segment_type == TDBSCAN.STOP else 'MOVE'

    start_point = trajectory[start_index]
    end_point = trajectory[end_index]
    print('Start Index: %i%r, End Index: %i%r, segment type: %r' % (start_index, start_point, end_index, end_point, segment_type_description)){% endraw %}{% endhighlight %}

which produces the following output:

<pre>Start Index: 0(1, 1), End Index: 1(1, 1.2), segment type: 'STOP'
Start Index: 1(1, 1.2), End Index: 2(1, 1.4), segment type: 'STOP'
Start Index: 2(1, 1.4), End Index: 3(22, 45), segment type: 'MOVE'
Start Index: 3(22, 45), End Index: 4(22, 45.3), segment type: 'STOP'
Start Index: 4(22, 45.3), End Index: 5(5, 4.5), segment type: 'MOVE'
Start Index: 5(5, 4.5), End Index: 6(5, 4.8), segment type: 'STOP'
Start Index: 6(5, 4.8), End Index: 7(5, 4.4), segment type: 'STOP'
Start Index: 7(5, 4.4), End Index: 8(5, 4.8), segment type: 'STOP'
Start Index: 8(5, 4.8), End Index: 9(5, 5.6), segment type: 'STOP'
Start Index: 9(5, 5.6), End Index: 10(8, 7), segment type: 'MOVE'
Start Index: 10(8, 7), End Index: 11(6, 6), segment type: 'STOP'
Start Index: 11(6, 6), End Index: 12(8, 9), segment type: 'MOVE'</pre>

It appears that based on these points and configuration of the T-DBSCAN algorithm, there are a 3 duplicate points (number 6,7 and 8) where the object is at-rest, and can be deleted without losing any information.

{% include components/heading.html heading='Clustering' level=2 %}

Clustering is a process by which data is partitioned into exclusive groups based on some metric. 
 Since trajectories can have many points over time, clustering can be applied in numerous ways to produce different meaningful clusterings:

*  **Which objects objects close together at a a given point in time?** This indicates if a given number of objects were close to each other at a given point in time
*  **Where are the interesting places?**.  Or, to put it more precisely, are there regions that are frequently visited by a given object or by many objects?
*  **Are the trajectories of these objects similar (at during a given time interval)?**  This identifies if objects were together and moved together, or if their relative movements were similar.
*  **Are the clusters at these two different points in time the same cluster?**   Over time objects can change membership of clusters, as in the case of animals in herds.  But even though a heard has lost and gained a few members, it is still the same pack.

While all distance-based metrics (ex. Euclidean distance, Great Circle Distance, etc) can be used to for clustering trajectories, there a handful of higher-level distance metrics that can be particularly effective for trajectories that use these distance metrics as an input parameter.  These metrics largely determine how similar trajectories are to each other, by comparing the segments in each trajectory for similarities in movements.  These metrics are:

<dl>
    <dt><a href="https://en.wikipedia.org/wiki/Hausdorff_distance">Hausdorff Distance</a></dt>
    <dd>Measures the similary of two trajectories by considering how close every point of one trajectory to some points of the other.  Scipy has an <a href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.distance.directed_hausdorff.html">implementation</a> of the directed Hausdorff distance for Euclidean distances.
    </dd>

    <dt><a href="https://en.wikipedia.org/wiki/Earth_mover%27s_distance">Earth Mover's Distance</a></dt>
    <dd>Earth Movers Distance (EMD) is an method for clustering trajectories, as it can account for different trajectory lengths, noisy trajectories, and trajectories with stops.
    </dd>

    <dt>Dynamic Time Warping Distance</dt>
    <dd>A sequence alignment method to find an optimal matching between two trajectories and measure the similarity without considering lengths and time ordering.  For a thorough synopsis I would recommend visiting the <a href="https://en.wikipedia.org/wiki/Dynamic_time_warping">wikipedia</a> page and using the <a href="https://github.com/slaypni/fastdtw">FastDTW</a> for production usage.
    </dd>

    <dt>Longest Common Subsequence</dt>
    <dd>LCSS aims at finding the longest common subsequence in all sequences, and the length of the longest subsequence could be the similarity between two arbitrary trajectories with different lengths (LCSS) aims at finding the longest common subsequence in all sequences, and the length of the longest subsequence could be the similarity between two trajectories with different lengths.
    </dd>
</dl>

While these metrics are very effective for clustering trajectories, they do not yield any information about the relationships between clusters identified at snapshots throughout trajectories.  The following algorithm can be used to identify clusters over multiple snapshots and accounts for varying memberships of clusters over time.  When the algorithm identifies a cluster that is similar to a cluster in a previous timestamp, the cluster is assigned the same identifier as that previous cluster.

{% highlight python linenos %}{% raw %}import math


class MovingDBSCAN(object):
    """
    A density-based clustering algorithm used for moving clusters.
    Density-based clustering identifies clusters as groups of samples that
    are all grouped closer together in space.  In some applications, samples
    can move in space over time where they join/leave clusters.  This algorithm
    tracks clusters as they move through space and identifies them as the
    same cluster or as new cluster based on the membership of the clusters over
    time.
    This implementation keeps track of all past clusters and their memberships.
    Fo recurring clusters, membership of the most recent cluster is compared.
    So, this implementation will identify clusters that existed in the past
    but not necessarily in the immediate past snapshot
    Original paper: On Discovering Moving Clusters in Spatio-temporal Data
    https://link.springer.com/chapter/10.1007/11535331_21
    Examples:  Migrating animal herds, convoys of cars, etc.
    """
    __slots__ = ('clf', )

    def __init__(self, clf):
        self.clf = clf

    def fit_predict(self, X, y=None, sample_weight=None, integrity_threshold=0.5, only_current=True):
        columns = len(X[0])
        row_count = len(X)
        column_clusters = []

        if isinstance(integrity_threshold, (list, tuple)):
            if len(integrity_threshold) != columns:
                raise ValueError('Must provide the same number of integrity thresholds(%i) as columns(%i)' % (len(integrity_threshold), columns))
            elif not all(isinstance(value, float) and 0.0 <= value <= 1.0 for value in integrity_threshold):
                raise ValueError('All integrity thresholds (%r) must be floats between 0 and 1' % integrity_threshold)
        elif not isinstance(integrity_threshold, float) or 0.0 >= integrity_threshold or integrity_threshold > 1.0:
            raise ValueError('integrity_threshold (%r) must be provided as a float between 0 and 1' % integrity_threshold)
        else:
            integrity_threshold = [integrity_threshold for _ in range(columns)]
        column_iterator = range(columns)

        existing_clusters = dict()

        for column, threshold in zip(column_iterator, integrity_threshold):
            values = [row[column] if isinstance(row[column], (list, set)) else [row[column]] for row in X]
            clusters = self.clf.fit_predict(values, y=y, sample_weight=sample_weight)

            unique_clusters = set(clusters)
            unique_clusters.discard(-1)

            for cluster in unique_clusters:
                cluster_indices = set(index for index in range(row_count) if clusters[index] == cluster)

                similarities = dict()
                for existing_cluster_id in existing_clusters:
                    existing_cluster_indices = existing_clusters[existing_cluster_id]

                    intersection = existing_cluster_indices & cluster_indices
                    if not intersection:
                        continue

                    union = len(existing_cluster_indices) + len(cluster_indices) - len(intersection)
                    jaccard_similarity = float(len(intersection)) / union
                    similarities[existing_cluster_id] = jaccard_similarity

                # only check if the most similar cluster is above threshold
                if similarities:
                    max_existing_cluster = max(similarities, key=similarities.get)
                    if similarities[max_existing_cluster] >= threshold:
                        new_cluster_id = max_existing_cluster
                    else:
                        new_cluster_id = len(existing_clusters)
                else:
                    new_cluster_id = len(existing_clusters)

                existing_clusters[new_cluster_id] = cluster_indices

                for row in cluster_indices:
                    clusters[row] = new_cluster_id

            column_clusters.append(clusters)

        # convert from column-based to row-based
        row_clusters = []
        for index in range(row_count):
            row = []
            for column in range(columns):
                row.append(column_clusters[column][index])
            row_clusters.append(row)
        return row_clusters{% endraw %}{% endhighlight %}

This apprroach produces a list of cluster IDs for each point in each object's trajectorty.  These cluster IDs indicate which cluster the object was a member of at each point.  If the object is not a member of any cluster, they are assigned a cluster ID of -1.  for example, if the algorithm produced the following list of cluster IDs:

{% highlight json %}{% raw %}[0,0,0, 1, -1, 2]{% endraw %}{% endhighlight %}

Then it indicates that it was a part of the same cluster (Cluster #0) for the first 3 snapshots, then joined Cluster 1, then was not a member of any cluster, and lastly joined Cluster 2.

{% include components/heading.html heading='Convoys' level=2 %}

Sometimes we are only interested in identifying the objects that travel together.  Convoy detection is just that: identifying objects that stay together for a given period of time/distance.  While this information can be inferred from the results of the MovingDBSCAN algorithm, doing so is not very efficient, nor scale-able.  The following is a an algorithm which more efficiently determines which objects traveled together for a given time interval.  While there are more efficient algorithms, this one is fairly simple and easy to comprehend.

{% highlight python linenos %}{% raw %}class ConvoyCandidate(object):
    """
    Attributes:
        indices(set): The object indices assigned to the convoy
        is_assigned (bool):
        start_time (int):  The start index of the convoy
        end_time (int):  The last index of the convoy
    """
    __slots__ = ('indices', 'is_assigned', 'start_time', 'end_time')

    def __init__(self, indices, is_assigned, start_time, end_time):
        self.indices = indices
        self.is_assigned = is_assigned
        self.start_time = start_time
        self.end_time = end_time

    def __repr__(self):
        return '<%r %r indices=%r, is_assigned=%r, start_time=%r, end_time=%r>' % (self.__class__.__name__, id(self), self.indices, self.is_assigned, self.start_time, self.end_time)


class CMC(object):
    """
    An implementation of the Coherence Moving Cluster (CMC) algorithm

    Attributes:
        k (int):  Minimum number of consecutive timestamps to be considered a convoy
        m (int):  Minimum number of members to be considered a convoy

    Original paper: Discovery of Convoys in Trajectory Databases
    https://arxiv.org/pdf/1002.0963.pdf
    """
    def __init__(self, clf, k, m):
        self.clf = clf
        self.k = k
        self.m = m

    def fit_predict(self, X, y=None, sample_weight=None):
        convoy_candidates = set()
        columns = len(X[0])
        column_iterator = range(columns)
        output_convoys = []

        for column in column_iterator:
            current_convoy_candidates = set()
            values = [row[column] if isinstance(row[column], (list, set)) else [row[column]] for row in X]
            if len(values) < self.m:
                continue
            clusters = self.clf.fit_predict(values, y=y, sample_weight=sample_weight)
            unique_clusters = set(clusters)
            clusters_indices = dict((cluster, ConvoyCandidate(indices=set(), is_assigned=False, start_time=None, end_time=None)) for cluster in unique_clusters)

            for index, cluster_assignment in enumerate(clusters):
                clusters_indices[cluster_assignment].indices.add(index)

            # update existing convoys
            for convoy_candidate in convoy_candidates:
                convoy_candidate_indices = convoy_candidate.indices
                convoy_candidate.is_assigned = False
                for cluster in unique_clusters:
                    cluster_indices = clusters_indices[cluster].indices
                    cluster_candidate_intersection = cluster_indices & convoy_candidate_indices
                    if len(cluster_candidate_intersection) < self.m:
                        continue
                    convoy_candidate.indices = cluster_candidate_intersection
                    current_convoy_candidates.add(convoy_candidate)
                    convoy_candidate.end_time = column
                    clusters_indices[cluster].is_assigned = convoy_candidate.is_assigned = True

                # check if candidates qualify as convoys
                candidate_life_time = (convoy_candidate.end_time - convoy_candidate.start_time) + 1
                if (not convoy_candidate.is_assigned or column == column_iterator[-1]) and candidate_life_time >= self.k:
                    output_convoys.append(convoy_candidate)

            # create new candidates
            for cluster in unique_clusters:
                cluster_data = clusters_indices[cluster]
                if cluster_data.is_assigned:
                    continue
                cluster_data.start_time = cluster_data.end_time = column
                current_convoy_candidates.add(cluster_data)
            convoy_candidates = current_convoy_candidates
        return output_convoys{% endraw %}{% endhighlight %}

This algorithm produces a list of `ConvoyCandidate` instances, which indicates the `indices` of the objects in the convoy, the `start_time` which is the first index  the convoy is formed, and the `end_time` which is the last index of the convoy's existence.

{% highlight python %}{% raw %}from sklearn.cluster import DBSCAN

clustering_clf = DBSCAN(eps=5)
clf = CMC(clustering_clf, k=2, m=4)
data = (
    [[932.0], [1870.0], [2814.0], [3749.0], [4693.0], [5595.0], [6461.0], [7392.0]],
    [[938.0], [1873.0], [2820.0], [3750.0], [4695.0], [5612.0], [6552.0], [7499.0]],
    ...
)
convoys = clf.fit_predict(data)
for convoy in convoys:
    print('Convoy')
    for i in convoy.indices:
        print('%i: %r - Start Time: %r, End Time: %r' % (i, data[i], convoy.start_time, convoy.end_time){% endraw %}{% endhighlight %}

{% include components/heading.html heading='Other Applications of Trajectory Analysis' level=2 %}

As I said earlier, trajectory analysis can be applied to any object that changes positions in a vector space over time.  Based on this definition, trajectory analysis can be applied to many applications beyond geospatial trajectories.

Let's first consider the example of users on a website.  Users consume/read consume website content over time, based on what is being published by the website and as their short/long-term interests change over time.  By quantifying the consumed content into a point in vector space (using <a href="/blog/nlp-exploration-topic-models"> content topics</a>, content types, content authors, boolean vectors based on manually assigned tags, etc), the website can create a "trajectory" over time of their users.  Then these trajectories can be analyzed to inform content production, marketing, and recommendation systems:

*  Users can be clustered based on their trajectories and subtrajectories to create new marketing segments based on mutual interests/changing interests with other users, and to make  content recommendations based on the trajectories of user's peers in their assigned clusters.
*  Trajectories can be segmented and clustered to identify important/frequently visited "points" for guiding the production of future content
Using topic models, trajectory analysis can be used to analyze documents themselves.  Typical documents do not contain the same information in each sentence, each sentence builds on each other to convey a large idea.  By considering a document as a time-series of sentence-topic distributions, we can create a trajectory. 

<figure>
    <img class="lazy-load" data-src="https://res.cloudinary.com/ddf6a1kku/image/upload/v1608680558/sentence_topic_trajectory_k6cezr.svg" alt="A visualization of mapping topics of sentences are used to create a vector space, where sentences are denoted by coordinates based on their topics.  In this example, the topics of  second paragraph/trajectory are similar in the first, second, and fourth sentence but differs significantly in the third sentence" style="width: 100%;" />
    <figcaption>Here are two paragraphs which have been converted to a trajectory in a vector space. 
 The color of each sentence in each paragraph corresponds to a point in each respective trajectory.  The trajectories of the two paragraph are similar with the exception of the third point, in which the second trajectory differs significantly from the first trajectory.  Using convoy detectection, we could determine that the two paragraph approximately follow the same topic trajectory until the third paragraph.</figcaption>
</figure>

This trajectory can be used to:

*  Identify continuous sections of content that are about the same set of topics, using trajectory segmentation
*  Identify documents and subsections of documents that have similar progressions of topics through the documents, as well as common/uncommon progressions of topics, using trajectory clustering.

There are many more examples of applications of trajectory analysis on other types of data.  I will add those here as I come up with them, and supporting images/diagrams.

{% include components/heading.html heading='Conclusion and Further Reading' level=2 %}
Trajectory Analysis can be used to great advantage when used on geospatial trajectories, and has great applications on non-traditional trajectories as well.  

For more reading, see:

*  <a href="https://online-journals.org/index.php/i-joe/article/viewFile/3881/3315">T-DBSCAN: A Spatiotemporal Density Clustering for GPS Trajectory Segmentation</a>
*  <a href="https://www.researchgate.net/publication/314110266_An_Improved_DBSCAN_Algorithm_to_Detect_Stops_in_Individual_Trajectories">An Improved DBSCAN Algorithm to Detect Stops in Individual Trajectories</a>
*  <a href="https://ieeexplore.ieee.org/document/5548396">DB-SMoT: A Direction-Based Spatio-Temporal Clustering Method</a>
*  <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7472055/pdf/sensors-20-04571.pdf">Big Trajectory Data Mining: A Survey of Methods, Applications, and Services</a>
*  <a href="https://link.springer.com/chapter/10.1007/11535331_21">On Discovering Moving Clusters in Spatio-temporal Data</a>
*  <a href="https://arxiv.org/pdf/1002.0963.pdf">Discovery of Convoys in Trajectory Databases</a>