class KMeans {
    /**
     * A configurable implementation of the K-means clustering algorithm
     * 
     * 
     * @param {int} minK 
     * @param {Function} distanceMetric 
     * @param {object} options
     */

    constructor(minK, distanceMetric, options) {
        this.minK = minK;
        this.distanceMetric = distanceMetric;

        var options = options || {};
        this.distanceThreshold = options.distanceThreshold || 0.0; // minimum threshold of centroid changes to continue iterations
        this.maxIterations = options.maxIterations || Number.MAX_SAFE_INTEGER;
        this.meanFunc = options.meanFunc || this._arithmeticMean;
        this.kDTree = options.kDTree || false;
    }

    validateDataset(dataset) {
        if (!Array.isArray(dataset) || !dataset.length) {
            throw Error('dataset must be array');
        }

        if (dataset.length <= this.minK) {
            throw Error('dataset must have at least ' + this.minK + ' data points');
        }

        for (var i = 0; i < dataset.length; i++) {
            if (!Array.isArray(dataset[i])) {
                console.log(dataset[i]);
                throw Error('dataset points must be an array');
            }

            if (!dataset[i].length) {
                throw Error('dataset points must be a non-empty array');
            }
        }

        return true;
    }

    transform(dataset, options) {
        /**
         * Executes the k-means clustering algorithm against a dataset
         * with the given optional optimization parameters.  Parameters are
         * 
         * - validate (bool):  Indicates if the dataset should be validated
         * - kDTree (bool):  Indicates if a KD-tree should be used to find nearest centroids
         * 
         * @param {Array} dataset
         * @param {object} options
         */
        var options = options || {};
        options.kDTree = options.kDTree || this.kDTree;
        if (options.validate || true) {
            this.validateDataset(dataset);
        }

        let iterations = 0;
        let oldCentroids, labels, centroids;

        // Initialize centroids randomly
        if (options.useNaiveSharding || true) {
            centroids = this._getRandomCentroidsNaiveSharding(dataset);
        } else {
            centroids = this._getRandomCentroids(dataset);
        }

        // Run the main k-means algorithm
        while (!this._shouldStop(oldCentroids, centroids, iterations)) {
            // Save old centroids for convergence test.
            oldCentroids = [...centroids];
            iterations++;

            // Assign labels to each datapoint based on centroids
            labels = this._getLabels(dataset, centroids, options.kDTree);
            centroids = this._recalculateCentroids(dataset, labels);
        }

        const clusters = [];
        for (let i = 0; i < this.minK; i++) {
            clusters.push(labels[i]);
        }
        const results = {
            clusters: clusters,
            centroids: centroids,
            iterations: iterations,
            converged: iterations <= this.maxIterations,
        };
        return results;
    }

    _getLabels(dataSet, centroids, kDTree = true) {
        // prep data structure:
        const labels = {},
            centroidIndices = [];
        for (let c = 0; c < centroids.length; c++) {
            labels[c] = {
                points: [],
                centroid: centroids[c],
            };
            centroidIndices.push(c);
        }
        var tree;
        if (kDTree) {
            var centroidDimensions = centroids[0].map(function(v, i) {
                return i
            });
            tree = new KDTree(centroids, centroidIndices, centroidDimensions, this.distanceMetric);
        }
        // For each element in the dataset, choose the closest centroid. 
        // Make that centroid the element's label.
        for (let i = 0; i < dataSet.length; i++) {
            const a = dataSet[i];
            let closestCentroid, closestCentroidIndex
            if (kDTree) {
                var closestCentroids = tree.nearestNeighbor(a, 1);
                closestCentroid = closestCentroids[0],
                    closestCentroidIndex = closestCentroid.id;
            } else {
                let prevDistance;
                for (let j = 0; j < centroids.length; j++) {
                    let centroid = centroids[j];
                    if (j === 0) {
                        closestCentroid = centroid;
                        closestCentroidIndex = j;
                        prevDistance = this.distanceMetric(a, closestCentroid);
                    } else {
                        // get distance:
                        const distance = this.distanceMetric(a, centroid);
                        if (distance < prevDistance) {
                            prevDistance = distance;
                            closestCentroid = centroid;
                            closestCentroidIndex = j;
                        }
                    }
                }
            }
            // add point to centroid labels:
            labels[closestCentroidIndex].points.push(a);
        }
        return labels;
    }


    _compareDatasets(a, b) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    _getRandomCentroids(dataset) {
        // selects random points as centroids from the dataset
        const numSamples = dataset.length;
        const centroidsIndex = [];
        let index;
        while (centroidsIndex.length < this.minK) {
            index = this._randomBetween(0, numSamples);
            if (centroidsIndex.indexOf(index) === -1) {
                centroidsIndex.push(index);
            }
        }
        const centroids = [];
        for (let i = 0; i < centroidsIndex.length; i++) {
            const centroid = [...dataset[centroidsIndex[i]]];
            centroids.push(centroid);
        }
        return centroids;
    }

    _getRandomCentroidsNaiveSharding(dataset) {
        // implementation of a variation of naive sharding centroid initialization method
        // (not using sums or sorting, just dividing into k shards and calc mean)
        const numSamples = dataset.length;
        const step = Math.floor(numSamples / this.minK);
        const centroids = [];
        for (let i = 0; i < this.minK; i++) {
            const start = step * i;
            let end = step * (i + 1);
            if (i + 1 === this.minK) {
                end = numSamples;
            }
            centroids.push(this._calcMeanCentroid(dataset, start, end));
        }
        return centroids;
    }

    _calcMeanCentroid(dataSet, start, end) {
        const features = dataSet[0].length;
        const n = end - start;
        let mean = [];
        for (let i = 0; i < features; i++) {
            mean.push(0);
        }
        for (let i = start; i < end; i++) {
            for (let j = 0; j < features; j++) {
                mean[j] = mean[j] + dataSet[i][j] / n;
            }
        }
        return mean;
    }

    _shouldStop(oldCentroids, centroids, iterations) {
        if (iterations > this.maxIterations) {
            return true;
        }
        if (!oldCentroids || !oldCentroids.length) {
            return false;
        }

        if (oldCentroids.length === centroids.length) {
            let maxMovement = 0.0;
            for (let i = 0; i < centroids.length; i++) {
                const distance = this.distanceMetric(centroids[i], oldCentroids[i]);
                maxMovement = Math.max(maxMovement, distance);
            }

            if (maxMovement <= this.threshold) {
                return true;
            }

            let haveChanged = true;
            for (let i = 0; i < centroids.length; i++) {
                if (!this._compareDatasets(centroids[i], oldCentroids[i])) {
                    haveChanged = false;
                }
            }
            return haveChanged;
        }
        return false;
    }

    _recalculateCentroids(dataSet, labels) {
        // Each centroid is the arithmetic mean of the points that
        // have that centroid's label.  If no points have
        // a centroid's label, you should randomly re-initialize it.
        let newCentroid;
        const newCentroidList = [];
        for (const k in labels) {
            const centroidGroup = labels[k];
            if (centroidGroup.points.length > 0) {
                // find mean:
                newCentroid = this.meanFunc(centroidGroup.points);
            } else {
                // get new random centroid
                newCentroid = this._getRandomCentroids(dataSet, 1)[0];
            }
            newCentroidList.push(newCentroid);
        }
        return newCentroidList;
    }


    _arithmeticMean(dataset) {
        const totalPoints = dataset.length;
        const means = [];
        for (let j = 0; j < dataset[0].length; j++) {
            means.push(0);
        }
        for (let i = 0; i < dataset.length; i++) {
            const point = dataset[i];
            for (let j = 0; j < point.length; j++) {
                const val = point[j];
                means[j] = means[j] + val / totalPoints;
            }
        }
        return means;
    }

    _randomBetween(min, max) {
        return Math.floor(
            Math.random() * (max - min) + min
        );
    }

    /**
     * Calculates the average Silhouette coefficient for a given clustering result.
     *
     * The Silhouette coefficient is a widely used metric for evaluating the quality of clustering.
     * It measures how well data points are assigned to their clusters by considering both the intra-cluster
     * distance (distance between points within the same cluster) and the inter-cluster distance
     * (distance between points in different clusters).
     *
     * @param {Array<Array<number>>} dataset - The dataset used for clustering.
     * @param {Array<object>} clusters - Array of cluster labels for each data point.
     *
     * @returns {Array} The Silhouette coefficient  for each cluster.
    */
    silhouetteCoefficient(dataset, clusters) {
        const numSamples = dataset.length;
        const numClusters = clusters.length;
        const silhouetteScores = new Array(numSamples).fill(0);
    
        for (let i = 0; i < numSamples; i++) {
            const point = dataset[i];
            let clusterIndex;
            for (let k = 0; k < numClusters; k++) {
                if (clusters[k].points.includes(point)) {
                    clusterIndex = k;
                    break;
                }
            }
    
            const clusterPoints = clusters[clusterIndex].points;
            const withinClusterDist = this._avgDistanceToPoints(point, clusterPoints);
    
            let nearestClusterDist = Infinity;
            for (let k = 0; k < numClusters; k++) {
                if (k !== clusterIndex) {
                    const otherClusterPoints = clusters[k].points;
                    const distToCluster = this._avgDistanceToPoints(point, otherClusterPoints);
                    nearestClusterDist = Math.min(nearestClusterDist, distToCluster);
                }
            }
    
            const silhouetteScore = (nearestClusterDist - withinClusterDist) / Math.max(withinClusterDist, nearestClusterDist);
            silhouetteScores[i] = silhouetteScore;
        }
        return silhouetteScores;
    }

    _avgDistanceToPoints(point, points) {
        const numPoints = points.length;
        let totalDist = 0;
    
        for (let i = 0; i < numPoints; i++) {
            const otherPoint = points[i];
            const dist = this.distanceMetric(point, otherPoint);
            totalDist += dist;
        }
    
        return totalDist / numPoints;
    }

    /**
     * The Davies-Bouldin Index (DBI) is a cluster validity measure used to assess the quality of clustering results.
     * It considers both the within-cluster scatter (compactness) and the between-cluster separation of clusters.
     * Lower DBI values indicate better clustering, with a theoretical minimum of 0 representing perfectly separated clusters.
     * 
     * Lower scores indicate better clustering.
     * A score of 0 indicates perfectly separated clusters.
     * Higher scores indicate more overlap between clusters.
     * 
     * Limitations:
     * DBI can be sensitive to the size and shape of clusters.
     * It may not be suitable for high-dimensional data.
     * 
     * @param {*} dataset 
     * @param {*} labels 
     * @param {*} centroids 
     * @returns {Array} The Davies-Bouldin Index scores for each cluster (a floating-point number).
     */
    daviesBouldinIndex(results) {
        const numClusters = results.clusters.length;
        const dbiScores = new Array(numClusters).fill(0);
    
        for (let i = 0; i < numClusters; i++) {
            const clusterPoints = results.clusters[i].points;
            const withinClusterDist = this._avgDistanceToPoints(results.centroids[i], clusterPoints);
    
            let maxScore = -Infinity;
            for (let j = 0; j < numClusters; j++) {
                if (i !== j) {
                    const otherClusterPoints = results.clusters[j].points;
                    // Calculate the distance between the centroids of the current cluster and the other cluster
                    const betweenClusterDist = this.distanceMetric(results.centroids[i], results.centroids[j]);
                    // Calculate the average distance from the centroid of the other cluster to the points within that cluster
                    const otherWithinClusterDist = this._avgDistanceToPoints(results.centroids[j], otherClusterPoints);
                    // Calculate the score using the formula: (withinClusterDist + otherWithinClusterDist) / betweenClusterDist
                    const score = (withinClusterDist + otherWithinClusterDist) / betweenClusterDist;
                    // Update the maximum score if the current score is higher
                    maxScore = Math.max(maxScore, score);
                }
            }
    
            dbiScores[i] = maxScore;
        }
        return dbiScores;
    }

    /**
     * The Calinski Harabasz Index (CH Index), also known as the variance ratio criterion,
     * is an internal cluster validity index used to assess the quality of clustering results.
     * It measures the ratio of between-cluster dispersion to within-cluster dispersion. In simpler terms,
     * it checks how well-separated the clusters are and how compact they are within themselves.
     * 
     * Interpretation:
     * Higher CH Index scores indicate better clustering results.
     * There's no fixed upper bound, but generally, higher scores suggest better separation and compactness of clusters.
     * Scores closer to 0 indicate poorly separated or scattered clusters.
     * 
     * Advantages:
     * Simple to calculate and interpret.
     * Suitable for comparing clustering results for different numbers of clusters (k).
     * Sensitive to both cluster separation and within-cluster compactness.
     * 
     * Disadvantages:
     * Can be sensitive to the choice of distance metric.
     * May not be reliable for high-dimensional data or complex cluster shapes.
     * 
     * Calinski, T., & Harabasz, J. (1974). A dendrite method for cluster analysis. Communications in Statistics-theory and Methods, 3(1), 1-27.
     * 
     * @param {*} dataset 
     * @param {*} labels 
     * @param {*} centroids 
     * @returns 
     */
    calinskiHarabaszIndex(dataset, results) {
        // Get the number of clusters and data points
        const numClusters = results.clusters.length;
        const numSamples = dataset.length;
    
        // Calculate the overall centroid of the dataset
        const overallCentroid = this._calculateCentroid(dataset);
    
        // Calculate the between-cluster sum of squares (SSB)
        let ssb = 0;
        for (let i = 0; i < numClusters; i++) {
            const clusterSize = results.clusters[i].points.length;
            const clusterCentroid = results.centroids[i];
            const distance = this.distanceMetric(clusterCentroid, overallCentroid);
            ssb += clusterSize * distance;
        }
    
        // Calculate the within-cluster sum of squares (SSW)
        let ssw = 0;
        for (let i = 0; i < numClusters; i++) {
            const clusterPoints = results.clusters[i].points;
            const clusterCentroid = results.centroids[i];
            for (let j = 0; j < clusterPoints.length; j++) {
                const point = clusterPoints[j];
                const distance = this.distanceMetric(point, clusterCentroid);
                ssw += distance;
            }
        }
    
        // Calculate the Calinski-Harabasz Index
        const chIndex = (ssb / (numClusters - 1)) / (ssw / (numSamples - numClusters));
    
        return chIndex;
    }

    _calculateCentroid(points) {
        const numSamples = points.length;
        const numFeatures = points[0].length;
        const centroid = new Array(numFeatures).fill(0);
    
        for (let i = 0; i < numSamples; i++) {
            for (let j = 0; j < numFeatures; j++) {
                centroid[j] += points[i][j];
            }
        }
    
        for (let j = 0; j < numFeatures; j++) {
            centroid[j] /= numSamples;
        }
    
        return centroid;
    }

    meanDistanceBetweenCentroids(clusters) {
        const output = new Array(clusters.length).fill(0),
            centroids = clusters.map(function(cluster) { return cluster.centroid; });
        for (var i = 0; i < clusters.length; i++) {
            output[i] = this._avgDistanceToPoints(clusters[i].centroid, centroids);
        }
        return output;
    }

    meanDistanceWithinClusters(clusters) {
        const output = new Array(clusters.length).fill(0);
        for (var i = 0; i < clusters.length; i++) {
            output[i] = this._avgDistanceToPoints(clusters[i].centroid, clusters[i].points);
        }
        return output;
    }
}


class XMeans extends KMeans {
    /**
     * A configurable implementation of the X-means clustering algorithm.
     * The X-means clustering creates between minK and maxK clusters by
     * splitting a cluster into 2 clusters.  The algorithm splits the
     * cluster with contributes most towards the entropy of the model.
     * 
     * When minK === maxK, behaves exactly like KMeans clustering.
     * 
     * @param {int} minK minimum
     * @param {int} maxK max number of clusters to create
     * @param {Function} distanceMetric 
     * @param {object} options
     */

    constructor(minK, maxK, distanceMetric, options) {
        super(minK, distanceMetric, options);

        if (minK > maxK) {
            throw Error('maxK must be greater than, or equal to minK');
        }
        this.maxK = maxK;

        var options = options || {};
        console.log(options);
        this.splitThreshold = options.splitThreshold || 0.0; // threshold for splitting a cluster
        this.bicThreshold = options.bicThreshold || 0.0; // threshold for stopping the clustering
    }

    transform(dataset, options) {
        /**
         * Executes the k-means clustering algorithm against a dataset
         * with the given optional optimization parameters.  Parameters are
         * 
         * - validate (bool):  Indicates if the dataset should be validated
         * - kDTree (bool):  Indicates if a KD-tree should be used to find nearest centroids
         * 
         * @param {Array} dataset
         * @param {object} options
         */
        var options = options || {};
        options.kDTree = options.kDTree || false;
        if (options.validate || true) {
            this.validateDataset(dataset);
        }

        let iterations = 0;
        let oldCentroids, labels, centroids;

        // Initialize centroids randomly
        if (options.useNaiveSharding || true) {
            centroids = this._getRandomCentroidsNaiveSharding(dataset);
        } else {
            centroids = this._getRandomCentroids(dataset);
        }

        labels = this._getLabels(dataset, centroids, options.kDTree);
        var oldBIC = Number.MAX_SAFE_INTEGER,
            currentBIC = this._calculateBIC(dataset, labels, centroids.map(function(v, i) {
                return i;
            })),
            currentK = this.minK;
        // Run the main X-means algorithm
        while (!this._shouldStop(oldCentroids, centroids, iterations, oldBIC, currentBIC)) {
            // Save old centroids for convergence test.
            oldCentroids = [...centroids];
            iterations++;

            // Assign labels to each datapoint based on centroids
            labels = this._getLabels(dataset, centroids, options.kDTree);
            centroids = this._recalculateCentroids(dataset, labels);

            if (currentK === this.maxK) {
                continue;
            }
            // X-Means calculations

            // Calculate BIC for each cluster to determine the one with highest BIC
            const clusterBICs = [];
            for (var i = 0; i < centroids.length; i++) {
                const clusterBIC = this._calculateBIC(dataset, labels, [i]);
                clusterBICs.push({
                    clusterIndex: i,
                    BIC: clusterBIC
                });
            }
            clusterBICs.sort(function(a, b) {
                return b.BIC - a.BIC;
            });
            const highestBICClusterIndex = clusterBICs[0].clusterIndex;

            // Split the cluster with highest BIC
            const splitClusters = this._splitCluster(labels[highestBICClusterIndex], labels);

            // Calculate BIC for split model
            let splitLabels = Object.assign({}, labels);
            const splitCentroids = centroids.concat(splitClusters.centroids); // add clusters from split
            splitCentroids.splice(highestBICClusterIndex, 1); // remove split cluster
            splitLabels = this._getLabels(dataset, splitCentroids, options.kDTree); // assign labels based on new centroids
            const splitBIC = this._calculateBIC(dataset, splitLabels, splitCentroids.map(function(v, i) {
                return i;
            }));

            // Replace clusters and centroids if BIC is improved
            if (this._isImprovedBIC(currentBIC, splitBIC, this.splitThreshold)) {
                centroids = splitCentroids;
                labels = splitLabels;
                currentK++;
                oldBIC = currentBIC;
                currentBIC = splitBIC;
            }
        }

        const clusters = [];
        for (const cluster in labels) {
            clusters.push(labels[cluster]);
        }
        const results = {
            clusters: clusters,
            centroids: centroids,
            iterations: iterations,
            converged: iterations <= this.maxIterations,
        };
        return results;
    }

    _shouldStop(oldCentroids, centroids, iterations, oldBIC, bic) {
        if (!this._isImprovedBIC(oldBIC, bic, this.bicThreshold)) {
            return true;
        }
        return super._shouldStop(oldCentroids, centroids, iterations);
    }


    _isImprovedBIC(currentBIC, newBIC, threshold) {
        if (threshold > 0 && threshold < 1.0) {
            threshold = threshold * currentBIC;
        }
        return currentBIC - newBIC > threshold;
    }

    _splitCluster(cluster) {
        // Apply k-means with k=2 to the points in the cluster
        const kmeans = new KMeans(2, this.distanceMetric);
        return kmeans.transform(cluster.points);
    }

    _calculateBIC(dataset, labels, centroids) {
        const n = dataset.length;
        const k = centroids.length;
        let withinClusterVariance = 0.0;
        for (var i = 0; i < centroids.length; i++) {
            const centroidIndex = centroids[i];
            const clusterCentroid = labels[centroidIndex].centroid;
            const clusterPoints = labels[centroidIndex].points;

            for (var j = 0; j < clusterPoints.length; j++) {
                const squaredDistance = this.distanceMetric(clusterPoints[j], clusterCentroid);
                withinClusterVariance += squaredDistance;
            }
        }
        const BIC = n * Math.log(withinClusterVariance / n) + k * Math.log(n);
        return BIC;
    }

    _arithmeticMean(dataset) {
        const totalPoints = dataset.length;
        const means = [];
        for (let j = 0; j < dataset[0].length; j++) {
            means.push(0);
        }
        for (let i = 0; i < dataset.length; i++) {
            const point = dataset[i];
            for (let j = 0; j < point.length; j++) {
                const val = point[j];
                means[j] = means[j] + val / totalPoints;
            }
        }
        return means;
    }
}

class KDTree {
    constructor(points, ids, dimensions, distanceFn) {
        this.points = points;
        this.ids = ids;
        this.dimensions = dimensions;
        this.distanceFn = distanceFn;

        var items = [];
        for (var i = 0; i < points.length; i++) {
            var item = {
                point: points[i],
                id: ids[i],
            };
            items.push(item);
        }
        this.root = this._buildTree(items, 0);
        this.maxIdentifier = this.length;
    }

    _buildTree(items, depth) {
        if (items.length === 0) return null;

        const dimensionIndex = depth % this.dimensions.length;
        const dimension = this.dimensions[dimensionIndex];
        const medianIndex = Math.floor(items.length / 2);
        items.sort((a, b) => a.point[dimension] - b.point[dimension]); // Optimize sorting for selected dimension
        const item = items[medianIndex];
        const node = {
            point: item.point,
            id: item.id,
            left: this._buildTree(items.slice(0, medianIndex), depth + 1),
            right: this._buildTree(items.slice(medianIndex + 1), depth + 1),
        };
        return node;
    }

    length() {
        return this.ids.length;
    }

    containsPoint(point) {
        return this.points.indexOf(point) > -1;
    }

    containsId(id) {
        return this.ids.indexOf(id) > -1;
    }

    insert(point, id) {
        if (this.containsId(id)) {
            throw Error(id + ' already in tree');
        }
        this.ids.push(id);
        if (!this.containsPoint(point)) {
            this.points.push(point);
        }
        this.root = this._insertRecursive(this.root, point, 0, id);
    }

    _insertRecursive(node, point, depth, id) {
        if (node === null) return {
            point,
            id: id,
            left: null,
            right: null
        };

        const dimensionIndex = depth % this.dimensions.length;
        const dimension = this.dimensions[dimensionIndex];
        if (point[dimension] < node.point[dimension]) {
            node.left = this._insertRecursive(node.left, point, depth + 1, id);
        } else {
            node.right = this._insertRecursive(node.right, point, depth + 1, id);
        }
        return node;
    }

    findNode(point, node, depth) {
        if (node === null) return null;

        const dimensionIndex = depth % this.dimensions.length;
        const dimension = this.dimensions[dimensionIndex];

        if (point[dimension] < node.point[dimension]) {
            return this.findNode(point, node.left, depth + 1);
        } else if (point[dimension] > node.point[dimension]) {
            return this.findNode(point, node.right, depth + 1);
        } else {
            return node; // Potentially duplicate point found
        }
    }


    update(point, id, newPoint) {
        if (!this.containsId(id)) {
            throw Error(id + ' not found in tree');
        }

        this.root = this._updateRecursive(this.root, point, id, newPoint, 0);

        // Update the point in the points list
        const pointIndex = this.points.indexOf(point);
        this.points[pointIndex] = newPoint;
    }

    _updateRecursive(node, point, id, newPoint, depth) {
        if (node === null) return null;

        const dimensionIndex = depth % this.dimensions.length;
        const dimension = this.dimensions[dimensionIndex];

        if (point[dimension] < node.point[dimension]) {
            node.left = this._updateRecursive(node.left, point, id, newPoint, depth + 1);
        } else if (point[dimension] > node.point[dimension]) {
            node.right = this._updateRecursive(node.right, point, id, newPoint, depth + 1);
        } else {
            if (node.id === id) {
                node.point = newPoint; // Update the point value
                // Check if the new point needs to be repositioned in the tree
                if (!this._isPointValid(node, depth)) {
                    // Re-insert the node to maintain KD-tree properties
                    const removedNode = this._removeRecursive(this.root, node.point, node.id, 0);
                    this.insert(node.point, node.id);
                    return removedNode; // Return the updated subtree
                }
            } else {
                // Point found, but ID doesn't match, try the other subtree
                if (point[dimension] < node.point[dimension]) {
                    node.left = this._updateRecursive(node.left, point, id, newPoint, depth + 1);
                } else {
                    node.right = this._updateRecursive(node.right, point, id, newPoint, depth + 1);
                }
            }
        }

        return node;
    }

    _isPointValid(node, depth) {
        if (node === null) return true;

        const dimensionIndex = depth % this.dimensions.length;
        const dimension = this.dimensions[dimensionIndex];

        const leftValid = this._isPointValid(node.left, depth + 1);
        const rightValid = this._isPointValid(node.right, depth + 1);

        if (!leftValid || !rightValid) return false;

        // Check if the node's point is still valid in its current position
        if (node.left !== null && node.point[dimension] <= node.left.point[dimension]) return false;
        if (node.right !== null && node.point[dimension] >= node.right.point[dimension]) return false;

        return true;
    }

    remove(point, id) {
        if (!this.containsId(id)) {
            throw Error(id + ' not found in tree');
        }

        this.root = this._removeRecursive(this.root, point, id, 0);

        // Remove point and id from the lists
        const pointIndex = this.points.indexOf(point);
        this.points.splice(pointIndex, 1);
        this.ids.splice(this.ids.indexOf(id), 1);
    }

    _removeRecursive(node, point, id, depth) {
        if (node === null) return null;

        const dimensionIndex = depth % this.dimensions.length;
        const dimension = this.dimensions[dimensionIndex];

        if (point[dimension] < node.point[dimension]) {
            node.left = this._removeRecursive(node.left, point, id, depth + 1);
        } else if (point[dimension] > node.point[dimension]) {
            node.right = this._removeRecursive(node.right, point, id, depth + 1);
        } else {
            // Found the node to remove
            if (node.id === id) {
                if (node.left === null && node.right === null) {
                    return null; // Node has no children, simply remove it
                } else if (node.left === null) {
                    return node.right; // Replace with right child
                } else if (node.right === null) {
                    return node.left; // Replace with left child
                } else {
                    // Node has two children, find a replacement from the right subtree
                    const replacementNode = this._findReplacement(node.right);
                    node.point = replacementNode.point;
                    node.id = replacementNode.id;
                    node.right = this._removeRecursive(node.right, replacementNode.point, replacementNode.id, depth + 1);
                }
            } else {
                // Point found, but ID doesn't match, try the other subtree
                if (point[dimension] < node.point[dimension]) {
                    node.left = this._removeRecursive(node.left, point, id, depth + 1);
                } else {
                    node.right = this._removeRecursive(node.right, point, id, depth + 1);
                }
            }
        }

        return node;
    }

    _findReplacement(node) {
        while (node.left !== null) {
            node = node.left;
        }
        return node;
    }

    nearestNeighbor(point, k = 1, maxDistance = null) {
        var nearestNeighbors = [];
        this._nearestNeighborRecursive(this.root, point, 0, nearestNeighbors, k);
        if (maxDistance) {
            nearestNeighbors = nearestNeighbors.filter((v) => v.distance < maxDistance);
        }
        return nearestNeighbors;
    }

    _nearestNeighborRecursive(node, point, depth, nearestNeighbors, k) {
        if (node === null) {
            return;
        }
        const distance = this.distanceFn(point, node.point);
        const dimensionIndex = depth % this.dimensions.length;
        const dimension = this.dimensions[dimensionIndex];

        // Check current node for nearest neighbor
        if (nearestNeighbors.length < k || distance < nearestNeighbors[k - 1].distance) {
            nearestNeighbors.push({
                point: node.point,
                id: node.id,
                distance: distance
            });
            nearestNeighbors.sort((a, b) => a.distance - b.distance);
            if (nearestNeighbors.length > k) {
                nearestNeighbors.pop();
            }
        }

        // Recursively search closer subtree first
        const closerSubtree = point[dimension] < node.point[dimension] ? node.left : node.right;
        const fartherSubtree = closerSubtree === node.left ? node.right : node.left;

        this._nearestNeighborRecursive(closerSubtree, point, depth + 1, nearestNeighbors, k);

        // Check farther subtree only if k nearest neighbors not found or if it might contain closer points
        const potentialCloserDistance = nearestNeighbors[nearestNeighbors.length - 1].distance || Infinity;
        if (Math.abs(point[dimension] - node.point[dimension]) <= potentialCloserDistance) {
            this._nearestNeighborRecursive(fartherSubtree, point, depth + 1, nearestNeighbors, k);
        }
    }

    pointsInRange(min, max) {
        const points = [];
        this._pointsInRangeRecursive(this.root, min, max, points, 0);
        return points;
    }

    _pointsInRangeRecursive(node, min, max, points, depth) {
        if (node === null) {
            return;
        }

        const dimensionIndex = depth % this.dimensions.length;
        const dimension = this.dimensions[dimensionIndex];
        // Check if node's point is within range
        if (node.point[dimension] >= min[dimension] && node.point[dimension] <= max[dimension]) {
            if (this._isPointWithinRange(node.point, min, max)) {
                points.push(node.point);
            }
        }

        // Recursively search subtrees that might contain points in range
        if (min[dimension] <= node.point[dimension]) {
            this._pointsInRangeRecursive(node.left, min, max, points, depth + 1);
        }
        if (max[dimension] >= node.point[dimension]) {
            this._pointsInRangeRecursive(node.right, min, max, points, depth + 1);
        }
    }

    _isPointWithinRange(point, min, max) {
        for (let i = 0; i < this.dimensions.length; i++) {
            const dimensionIndex = depth % this.dimensions.length;
            const dimension = this.dimensions[dimensionIndex];
            if (point[dimension] < min[dimension] || point[dimension] > max[dimension]) {
                return false;
            }
        }
        return true;
    }
}