---
layout: post
title:  "Boosting Web Performance: Implementing K-Means Clustering with WebAssembly and Emscripten"
description: Exploring complexities of optimizing web performance by implementing K-Means clustering algorithms using WebAssembly and Emscripten.
keywords: WebAssembly,Emscripten,C,C++,K-Means Clustering,Web Performance Optimization,Vectorization,JavaScript,Web Development,Data Science,SIMD
tags: C++ math javascript data

---

In the realm of web development, performance optimization is a constant pursuit. As we push the boundaries of what's possible in the browser, we often find ourselves seeking innovative solutions to enhance speed and efficiency. Enter WebAssembly and Emscripten—two powerful tools that are revolutionizing the way we approach web performance. We'll explore how WebAssembly and Emscripten can be leveraged to implement the K-Means clustering algorithm with exceptional performance. By comparing traditional JavaScript implementations with highly optimized, vectorized C++ versions compiled to WebAssembly, we'll uncover the potential of these cutting-edge technologies.


{% include components/heading.html heading='Why WebAssembly?' level=2 %}

JavaScript, the long-standing backbone of web development, has been the go-to language for creating interactive and dynamic web experiences. However, when it comes to performance-critical tasks, JavaScript has certain limitations that can hinder its efficiency. One of the major performance bottlenecks in JavaScript is its garbage collection mechanism. JavaScript relies on automatic memory management, where the JavaScript engine periodically scans the memory to identify and remove unused objects. While this frees developers from manual memory management, it comes at a performance cost. The garbage collection process can introduce pauses and slowdowns, especially when dealing with large heaps or complex object graphs. This can be particularly problematic for memory-intensive tasks or applications that require consistent and predictable performance.

Another area where JavaScript may suffer from performance loss is in its Just-In-Time (JIT) compilation. JavaScript engines, such as V8 in Chrome or SpiderMonkey in Firefox, employ JIT compilers to optimize JavaScript code during runtime. The JIT compiler analyzes the code and attempts to optimize it based on runtime information and heuristics. However, the effectiveness of JIT compilation can vary depending on the complexity and predictability of the code. In certain scenarios, the JIT compiler may struggle to make optimal decisions, leading to suboptimal performance. Additionally, the JIT compilation process itself introduces overhead, as the compiler needs to analyze and optimize the code on the fly. This overhead can be significant for computationally intensive tasks or code with complex control flow.

In contrast, WebAssembly offers a compelling alternative for performance-critical tasks. WebAssembly is a low-level, binary instruction format that is designed to be executed at near-native speeds. It bypasses the limitations of JavaScript's garbage collection by providing manual memory management capabilities. Developers have fine-grained control over memory allocation and deallocation, allowing for more efficient memory usage and avoiding the performance penalties associated with garbage collection. Moreover, WebAssembly is ahead-of-time (AOT) compiled, meaning that the code is compiled to machine code before execution. This eliminates the need for JIT compilation and its associated overhead, resulting in faster startup times and more predictable performance.

A crucial aspect of delivering a seamless user experience is ensuring that your website responds to user interactions within 200 milliseconds. This 200ms interactivity rule is a well-established guideline that sets the benchmark for perceived responsiveness. However, JavaScript, the backbone of modern web applications, faces a significant challenge in meeting this threshold due to its single-threaded nature. When the browser is executing computationally intensive tasks written in JavaScript, it becomes unresponsive to user input, leading to a frustrating experience.

By leveraging the power of low-level languages like C++, developers can optimize performance-critical code and compile it to WebAssembly using tools like Emscripten. The resulting WebAssembly modules can be seamlessly integrated into JavaScript applications, offloading heavy computations to a separate thread. This frees up the main JavaScript thread to handle user interactions promptly, ensuring that the 200ms interactivity rule is met. Moreover, WebAssembly's near-native performance characteristics enable developers to build highly interactive and responsive web applications without compromising on functionality or user experience. As the demand for rich, immersive web experiences continues to grow, the combination of JavaScript and WebAssembly promises to revolutionize the way we build and interact with websites, making the 200ms interactivity threshold a reality for even the most complex applications.

{% include components/heading.html heading='Understanding WebAssembly and Emscripten' level=2 %}

WebAssembly (WASM), is a low-level, binary instruction format designed to be executed in web browsers. It provides a way to run code written in languages like C, C++, and Rust on the web at near-native speeds, offering performance that is comparable to native applications.

WebAssembly is designed to complement JavaScript, not replace it. It is particularly useful for performance-critical tasks, such as complex algorithms, game engines, virtual machines, and multimedia processing. By offloading computationally intensive tasks to WebAssembly, web applications can achieve significant performance improvements while keeping the flexibility and interactivity of JavaScript.

When it comes to compiling C++ code to WebAssembly, Emscripten is the go-to tool for web developers. Emscripten is an open-source compiler toolchain that allows us to compile C and C++ code into WebAssembly and leverage the performance benefits of WASM in web applications.

Emscripten acts as a bridge between the C++ ecosystem and the web. It provides a way to take existing C++ codebases and bring them to the browser without the need for extensive modifications. This is particularly useful when we have performance-critical code written in C++ that we want to integrate into our web applications.

By using Emscripten, developers can leverage the performance optimizations and low-level control of C++ while still targeting the web platform, as well as take advantage of the vast ecosystem of C++ libraries and frameworks in web projects.

{% include components/heading.html heading='K-Means Clustering' level=2 %}

K-Means clustering is a popular unsupervised machine learning algorithm that aims to partition a dataset into K clusters based on similarity. In the context of image processing, K-Means clustering finds valuable applications in image quantization and dominant color extraction. Let's explore how K-Means clustering works and why it is a good candidate for acceleration using WebAssembly.
At its core, the K-Means clustering algorithm follows a simple yet effective approach:

1. Initialization: The algorithm randomly selects `K` data points from the dataset as the initial cluster centroids.
2. Assignment: Each data point in the dataset is assigned to the nearest centroid based on a distance metric, typically Euclidean distance.
3. Update: The centroids of each cluster are recalculated by taking the mean of all the data points assigned to that cluster.
4. Iteration: Steps 2 and 3 are repeated until convergence, i.e., when the centroids no longer change significantly or a maximum number of iterations is reached.

When applied to image quantization, K-Means clustering can effectively reduce the number of colors in an image while preserving its overall visual appearance. Each pixel in the image is treated as a data point, and the algorithm clusters similar colors together. The resulting cluster centroids represent the dominant colors in the image. By replacing each pixel's color with its corresponding cluster centroid, we obtain a quantized version of the image with a reduced color palette.

The K-Means clustering algorithm is computationally intensive, especially when dealing with large datasets or high-resolution images. This is where WebAssembly comes into play. WebAssembly is designed to provide near-native performance in web browsers, making it an ideal candidate for accelerating performance-critical tasks like K-Means clustering.

By implementing the K-Means clustering algorithm in a language like C++ and compiling it to WebAssembly using tools like Emscripten, we can leverage the low-level performance optimizations offered by WebAssembly. The compiled WebAssembly module can be efficiently executed in the browser, taking advantage of the browser's optimized execution environment and hardware acceleration.

WebAssembly's linear memory model and manual memory management capabilities allow for efficient data manipulation and reduced overhead compared to JavaScript's garbage-collected memory model. This is particularly beneficial for the K-Means clustering algorithm, which involves iterative computations and frequent memory access.

Furthermore, WebAssembly's support for Single Instruction, Multiple Data (SIMD) instructions enables parallelization of certain operations, such as distance calculations and centroid updates. By utilizing SIMD instructions, the K-Means clustering algorithm can achieve significant performance gains, especially when processing large datasets or high-resolution images.

Here is our implementation of the K-Means clustering algorithm (excluding the KDTree implementation for brevity's sake):

{% highlight javascript linenos %}class KMeans {
  /**
   * A configurable implementation of the K-means clustering algorithm
   * 
   * @param {int} minK The number of clusters to be found in the data
   * @param {Function} distanceMetric 
   * @param {object} options
   */

  constructor(minK, distanceMetric, options) {
      this.minK = minK;
      this.distanceMetric = distanceMetric;

      var options = options || {};
      this.maxIterations = options.maxIterations || Number.MAX_SAFE_INTEGER;
      this.meanFunc = options.meanFunc || this._arithmeticMean;
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
          var centroidDimensions = centroids[0].map(function(v, i) {return i});
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
      let sameCount = true;
      for (let i = 0; i < centroids.length; i++) {
          if (!this._compareDatasets(centroids[i], oldCentroids[i])) {
              sameCount = false;
          }
      }
      return sameCount;
  }

  _recalculateCentroids(dataSet, labels) {
      // Each centroid is the arithmetic mean of the points that
      // have that centroid's label. Important: If a centroid is empty (no points have
      // that centroid's label) we should randomly re-initialize it.
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
Discuss the limitations and performance drawbacks of the JavaScript implementation
  _randomBetween(min, max) {
      return Math.floor(
          Math.random() * (max - min) + min
      );
  }
}{% endhighlight %}

This Javascript implementation of k-means clustering has several drawbacks by being implementation in Javascript:

1.  Computational Intensity
    * The K-Means algorithm involves iterative computations, including distance calculations and centroid updates, which can be computationally intensive, especially for large datasets (like image data) or high-dimensional data.
    *  The browser is single-threaded for Javascript, so computationally intensive tasks block user-interaction on the site while the computation is in-progress.
    *  JavaScript, being a dynamically-typed, interpreted language is not as suited for such computationally intensive tasks.
    *  The lack of native support for parallelization in JavaScript can limit the ability to use multi-core processors for faster computation.
2.  Memory Management
    *  JavaScript relies on automatic memory management through garbage collection, which can introduce overhead and performance penalties.
    *  The K-Means algorithm often requires frequent memory allocation and deallocation for storing data points, centroids, and intermediate results.
    *  The garbage collector may introduce pauses and slowdowns, especially when dealing with large datasets or complex data structures.
3. Lack of Typed Arrays
    *  JavaScript does not have native support for typed arrays, which are essential for efficient storage and manipulation of numerical data.
    *  The provided implementation uses regular JavaScript arrays, which are dynamically-typed and can incur additional memory overhead and slower access times compared to typed arrays.
    *  Without typed arrays, the algorithm may not be able to take full advantage of hardware-level optimizations for numerical computations.
4.  Limited Vectorization
    *  JavaScript does not have built-in support for vectorization or SIMD (Single Instruction, Multiple Data) operations.
    *  Vectorization allows for parallel processing of multiple data points simultaneously, which can significantly speed up computations.
    *  The absence of vectorization support in JavaScript means that the algorithm cannot leverage the full potential of modern CPUs for faster execution.


{% include components/heading.html heading='WebAssembly and C++ Implementation of K-Means Clustering' level=2 %}

Now let's create our C++ implementation of K-Means clustering for compilation to WebAssembly.  Several key aspects contribute to C++'s potential for more performant code execution:

1. Static Typing:
    *  C++ is a statically-typed language, meaning that variable types are explicitly declared and checked at compile-time.
    *  Static typing allows for better code optimization by the compiler, as it knows the exact data types being used.
    *  JavaScript, on the other hand, is dynamically-typed, which means that variable types can change during runtime, making it harder for the JavaScript engine to optimize the code.
2. Memory Management:
    *  C++ provides low-level control over memory management through manual memory allocation and deallocation using pointers.
    *  Developers have fine-grained control over memory layout and can optimize memory usage for specific requirements.
    *  JavaScript relies on automatic memory management through garbage collection, which can introduce overhead and potential performance issues.
3. Compiler Optimizations:
    *  C++ compilers, such as Clang or GCC, are highly sophisticated and can perform advanced optimizations during the compilation process
    *  These optimizations include dead code elimination, loop unrolling, and inline expansion, among others.
    *  JavaScript engines, like V8 or SpiderMonkey, also perform optimizations, but they are limited by the dynamic nature of the language and the need for just-in-time (JIT) compilation.
4. Direct Hardware Access:
    *  C++ allows for direct access to hardware resources, such as CPU instructions and memory addresses.
    *  This low-level control enables developers to write highly optimized code that can take full advantage of the underlying hardware.
    *  JavaScript, being a high-level language, does not provide direct access to hardware and relies on the browser or runtime environment for hardware interaction.
5. Ahead-of-Time Compilation:
    *  C++ code is compiled ahead-of-time (AOT) into machine code before execution.
    *  AOT compilation allows for extensive code analysis and optimization, resulting in faster execution times.
    *  JavaScript code is typically interpreted or compiled just-in-time (JIT) during runtime, which can introduce some performance overhead.
6. Lack of Runtime Overhead:
    *  C++ has minimal runtime overhead because it compiles directly to machine code.
    *  There is no need for an interpreter or virtual machine, which can introduce additional layers of abstraction and performance overhead.
    *  JavaScript, being an interpreted language, relies on a JavaScript engine to execute the code, which can add some runtime overhead.
7. Manual Optimization Techniques:
    *  C++ allows developers to manually optimize code using techniques like loop unrolling, cache optimization, and SIMD (Single Instruction, Multiple Data) operations.
    *  JavaScript engines apply some optimizations automatically, but the level of manual optimization is limited compared to C++.

{% highlight cpp linenos %}#ifndef KMEANS_H
#define KMEANS_H

#include <stdlib.h>
#include <tuple>
#include <vector>
#include <algorithm>


namespace clustering {

    template <typename T>
    class KMeans {
    private:
        long int m_k;
        long int m_max_iterations;
        double m_tolerance;
        double (* m_distance)(std::vector<T>, std::vector<T>);

        void initialize_random_centroids(std::vector<std::vector<T> > &data, std::vector<std::vector<T> > &centroids) {
            size_t sample_count = data.size();
            size_t centroid_count = centroids.size();
            size_t dimensions = data.at(0).size();
            size_t i = 0;

            for (i = 0; i < centroid_count; ++i) {
                centroids.at(i) = std::vector<T>(dimensions);
                T random_seed = rand() % (sample_count + 1);
                for (size_t j = 0; j < dimensions; ++j) {
                    centroids.at(i).at(j) = data.at(random_seed).at(j);
                }
            }
        }

        void initialize_kpp_centroids(std::vector<std::vector<T> > &data, std::vector<std::vector<T> > &centroids) {
            size_t sample_count = data.size();
            size_t centroid_count = centroids.size();
            size_t dimensions = data.at(0).size();
            size_t i = 0;

            for (i = 0; i < centroid_count; ++i) {
                centroids.at(i) = std::vector<T>(dimensions);
            }

            std::vector<std::vector<double> > matrix(sample_count);
            for (i = 0; i < sample_count; ++i) {
                matrix.at(i) = std::vector<double>(sample_count);
            }

            #pragma omp parallel for private(i) shared(data, matrix)
            for (i = 0; i < sample_count; ++i) {
                for (size_t j = i; j < sample_count; ++j) {
                    double distance;
                    if (i == j) {
                        distance = 0;
                    } else {
                        distance = m_distance(data.at(i), data.at(j));
                    }
                    matrix.at(i).at(j) = distance;
                    matrix.at(j).at(i) = distance;
                }
            }

            //set first seed
            T random_seed = rand() % (sample_count + 1);
            #pragma omp parallel for private(i) shared(centroids, data)
            for (i = 0; i < dimensions; ++i) {
                centroids.at(0).at(i) = data.at(random_seed).at(i);
            }
            std::vector<T> last_centroid = centroids.at(0);
            long int current_centroid = 1;

            while (current_centroid < m_k) {

                std::vector<double> distances;
                for (size_t j = 0; j < sample_count; ++j) {
                    std::vector<T> potential_point = data.at(j);
                    double current_min_distance = 99999;
                    for (long int k = 0; k < current_centroid; ++k) {
                        double potential_distance = m_distance(centroids.at(k), potential_point);
                        if (potential_distance < current_min_distance) {
                            current_min_distance = potential_distance;
                        }
                    }
                    distances.push_back(current_min_distance);
                }

                size_t last_centroid_index = std::distance(distances.begin(), std::max_element(distances.begin(), distances.end()));
                last_centroid = data.at(last_centroid_index);
                centroids.at(current_centroid) = last_centroid;
                ++current_centroid;
            }
        }

        double update_centroids(std::vector<std::vector<T> > &data, std::vector<std::vector<T> > &centroids, std::vector<long int> &clusters) {
            size_t centroid_count = centroids.size();
            size_t sample_count = data.size();
            size_t i = 0;
            size_t dimensions = data.at(0).size();

            std::vector<std::vector<T> > sums(centroid_count);
            std::vector<std::vector<size_t> > counts(centroid_count);
            std::vector<std::vector<T> > new_centroids(centroid_count);

            for (i = 0; i < centroid_count; ++i) {
                new_centroids.at(i) = std::vector<T>(dimensions);
                sums.at(i) = std::vector<T>(dimensions);
                counts.at(i) = std::vector<size_t>(dimensions);
            }

            #pragma omp parallel for private(i) shared(data, centroids)
            for (i = 0; i < dimensions; ++i) {
                for (size_t j = 0; j < sample_count; ++j) {
                    std::vector<T> sample = data.at(j);
                    long int cluster = clusters.at(j);
                    size_t count = counts.at(cluster).at(i);
                    counts.at(cluster).at(i) = count + 1;
                    sums.at(cluster).at(i) += sample.at(i);
                }
            }

            #pragma omp parallel for private(i) shared(centroids)
            for (i = 0; i < centroid_count; ++i) {
                for (size_t j = 0; j < dimensions; ++j) {
                    T sum = sums.at(i).at(j);
                    size_t count = counts.at(i).at(j);
                    new_centroids.at(i).at(j) = sum / (T)count;
                }
            }

            double changes = 0.0;
            for (i = 0; i < centroid_count; ++i) {
                double distance = m_distance(centroids.at(i), new_centroids.at(i));
                changes += distance;
                for (size_t j = 0; j < dimensions; ++j) {
                    centroids.at(i).at(j) = new_centroids.at(i).at(j);
                }
            }

            return changes;
        }

        long int update_clusters(std::vector<std::vector<T> > &data, std::vector<std::vector<T> > &centroids, std::vector<long int> &clusters) {
            size_t centroid_count = centroids.size();
            size_t sample_count = data.size();
            size_t i = 0;

            long int assignment_changes = 0;

            #pragma omp parallel for private(i) shared(data)
            for (i = 0; i < sample_count; ++i) {
                std::vector<T> sample = data.at(i);
                long int closest_centroid = 0;
                double closest_centroid_distance = 9999999;
                for (size_t j = 0; j < centroid_count; ++j) {
                    std::vector<T> centroid = centroids.at(j);
                    double distance = this->m_distance(sample, centroid);
                    if (distance < closest_centroid_distance) {
                        closest_centroid_distance = distance;
                        closest_centroid = j;
                    }
                }
                if (clusters.at(i) != closest_centroid) {
                    clusters.at(i) = closest_centroid;
                    #pragma omp critical
                    ++assignment_changes;
                }
            }
            return assignment_changes;
        }

    public:
        KMeans(const long int k, const long int max_iterations, const double tolerance, double (* distance_func)(std::vector<T>, std::vector<T>)) {
            m_k = k;
            m_max_iterations = max_iterations;
            m_tolerance = tolerance;
            m_distance = distance_func;
        }

        void setK(const long int k) {
            this->m_k = k;
        }

        long int getK() {
            return this->m_k;
        }

        void setMaxIterations(const long int maxIterations) {
            this->m_max_iterations = maxIterations;
        }

        long int getMaxIterations() {
            return this->m_max_iterations;
        }

        void setTolerance(const double tolerance) {
            this->m_tolerance = tolerance;
        }

        double getTolerance() {
            return this->m_tolerance;
        }

        std::tuple<std::vector<std::vector<T> >, std::vector<long int> > predict(std::vector<std::vector<T> > &data) {

            size_t sample_size = data.size();
            std::vector<long int> clusters(sample_size);
            std::vector<std::vector<T> > centroids(m_k);
            long int current_iteration = 0;
            double centroid_changes = m_tolerance;
            long int assignment_changes = m_tolerance;

            initialize_kpp_centroids(data, centroids);
            while (current_iteration < m_max_iterations && centroid_changes >= m_tolerance) {
                ++current_iteration;
                assignment_changes = update_clusters(data, centroids, clusters);
                centroid_changes = update_centroids(data, centroids, clusters);
            }
            std::tuple<std::vector<std::vector<T> >, std::vector<long int> > output = std::tie(centroids, clusters);
            return output;
        }
    };
}
{% endhighlight %}

When using Emscripten to compile C++ code to WebAssembly for use in JavaScript applications, it's often necessary to create a C++ wrapper class to expose the desired functionality to JavaScript. This wrapper class acts as an interface between the C++ code and the JavaScript environment. By defining a clear and intuitive API in the wrapper class, developers can encapsulate the complexity of the underlying C++ implementation and provide a seamless integration with JavaScript. The wrapper class handles the conversion of data types between C++ and JavaScript, manages memory allocation and deallocation, and defines the public methods and properties that JavaScript code can access.Without a well-designed wrapper class, exposing C++ functionality directly to JavaScript can be cumbersome and error-prone, leading to issues such as memory leaks, unexpected behavior, and difficulties in maintaining and extending the codebase. By investing time in creating a robust and efficient C++ wrapper class, developers can ensure that their WebAssembly modules are easy to use, performant, and maintainable, ultimately enhancing the overall quality and reliability of their JavaScript applications.

Let's create our own K-Means wrapper class in C++ and corresponding C++ distance functions.

{% highlight cpp linenos %}#ifndef WASM_KMEANS_H
#define WASM_KMEANS_H

#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "../kmeans.cpp"

#include "utility.hpp"

namespace wasm {

    namespace cluster {

        struct KResult {
            emscripten::val centroids;
            emscripten::val clusters;
        };

        template <typename T>
        double ssd(std::vector<T> point1, std::vector<T> point2) {
            // Sum of Squared Difference (SSD)
            double distance = 0.0;
            std::size_t dimension1 = point1.size();
            std::size_t dimension2 = point2.size();
            if (dimension1 != dimension2){
                return -1;
            }
            for (std::size_t i = 0; i < dimension1; i++){
                distance += pow(point2[i] - point1[i], 2);
            }
            return distance;
        }

        template <typename T>
        double euclidean(std::vector<T> point1, std::vector<T> point2) {
            // Euclidean Distance
            return sqrt(ssd(point1, point2));
        }

        template <typename T>
        class KMeans {
            static const inline std::unordered_map<std::string, double (* )(T*, T*, long int)> distance_funcs = {
                { "euclidean", euclidean<T> }
            };

            public:
                KMeans(const long int k, const long int max_iterations, const double tolerance, long int dimensions, const std::string distanceFunc) {
                    if (distance_funcs.find(distanceFunc) == distance_funcs.end()) {
                        throw std::invalid_argument(distanceFunc + " is not a valid distance metric");
                    }
                    m_distance_func = distanceFunc;
                    m_instance = new clustering::KMeansContiguous<T>(k, max_iterations, tolerance, dimensions, distance_funcs.at(distanceFunc));
                }

                KResult predict(emscripten::val jsData) {
                    // convert TypedArray to a T* pointer
                    unsigned int jsDataLength= jsData["length"].as<long int>();
                    emscripten::val buffer = jsData["buffer"]; 
                    std::vector<T> byte_data = emscripten::convertJSArrayToNumberVector<T>(jsData);
                    T* data = reinterpret_cast<T*>(&byte_data[0]); 

                    auto results = this->m_instance->predict(data, jsDataLength);
                    free(data);

                    // convert data to Javascript
                    long int dimensions = m_instance->getDimensions();

                    T* centroids = std::get<0>(results);
                    emscripten::val jsCentroids = emscripten::val::array();
                    long int k = m_instance->getK();
                    for (size_t i = 0; i < k; ++i) {
                        jsCentroids.call<void>("push", wasm::utility::contiguousVecToArray<T>(&centroids[i * dimensions], dimensions));
                    }
                    free(centroids);

                    long int * clusters = std::get<1>(results);
                    emscripten::val jsClusters = wasm::utility::contiguousVecToArray<long int>(clusters, jsDataLength / dimensions);
                    free(clusters);
                    return KResult{ jsCentroids, jsClusters};
                }

                void setK(const long int k) {
                    this->m_instance->setK(k);
                }

                long int getK() {
                    return this->m_instance->getK();
                }

                void setMaxIterations(const long int maxIterations) {
                    this->m_instance->setMaxIterations(maxIterations);
                }

                long int getMaxIterations() {
                    return this->m_instance->getMaxIterations();
                }

                void setTolerance(const double tolerance) {
                    this->m_instance->setTolerance(tolerance);
                }

                double getTolerance() {
                    return this->m_instance->getTolerance();
                }

                std::string getDistanceFunc() {
                    return this->m_distance_func;
                }

            private:
                clustering::KMeansContiguous<T> * m_instance;
                std::string m_distance_func;
        };
    }
}{% endhighlight %}

To enhance the interoperability between JavaScript and the underlying C++ `KMeans` class, the wrapper class provides a comprehensive set of getters and setters for all properties. This allows developers to seamlessly read and modify the configuration of the `KMeans` instance at runtime, adapting it to the specific requirements of their application. Moreover, the wrapper class offers a text-based mapping of distance functions to their corresponding C++ implementations, enabling developers to easily select and switch between different distance metrics without diving into the complexities of the C++ codebase. By exposing a clean and intuitive interface, the wrapper class empowers developers to fine-tune and optimize the behavior of the K-Means algorithm, while abstracting away the low-level details of the C++ implementation. This approach not only enhances the flexibility and maintainability of the JavaScript application but also facilitates a more efficient and productive development workflow, ultimately leading to better performance and a smoother user experience.

Next we will need to create our utility functions to translate data between Javascript data structures and C++ data structures and vice versa.


{% highlight cpp linenos %}#ifndef WASM_UTILITY_H
#define WASM_UTILITY_H

#include <emscripten/val.h>

namespace wasm {

    namespace utility {

        template <typename T>
        emscripten::val contiguousVecToArray(T* data, long int dataLength) {
            emscripten::val arr = emscripten::val::array();
            size_t i = 0;
            for (i = 0; i < dataLength; ++i) {
                arr.call<void>("push", std::move(data[i]));
            }
            return arr;
        }

        template <typename T>
        std::vector<T> arrayToVec(emscripten::val array) {
            if (!array.isArray()) {
                throw std::runtime_error("Input is not a valid array");
            }
            unsigned int length = array["length"].as<unsigned int>();
            std::vector<T> result = std::vector<T>(length);
            for (unsigned int i = 0; i < length; ++i) {
                result[i] = array[i].as<T>();
            }
            return result;
        }

        template <typename T>
        std::vector<std::vector<T>> array2DToVec(emscripten::val array) {
            if (!array.isArray()) {
                throw std::runtime_error("Input is not a valid array");
            }
            // Dimensions
            unsigned int arrayLength = array["length"].as<unsigned int>();
            unsigned int columnCount = array[0]["length"].as<unsigned int>(); 
            bool hasBuffer = array[0].hasOwnProperty("buffer");

            // Pre-allocate result vector
            std::vector<std::vector<double>> result(arrayLength);

            // Optimize assuming contiguous inner arrays:
            for (unsigned int i = 0; i < arrayLength; ++i) {
                emscripten::val innerArray = array[i];

                // Get a direct pointer (if possible)
                T* rowData = nullptr;
                if (hasBuffer) { 
                    emscripten::val buffer = innerArray["buffer"]; 
                    rowData = reinterpret_cast<T*>(buffer.as<uintptr_t>());
                }

                if (rowData) {
                    // Super-efficient copy from contiguous data
                    result[i].assign(rowData, rowData + columnCount); 
                } else {
                    // Fallback to the original method if no contiguous buffer
                    result[i].reserve(columnCount);
                    for (size_t col = 0; col < columnCount; ++col) {
                        result[i].push_back(innerArray[col].as<T>());
                    }
                }
            }
            return result;
        }

        template <typename T>
        emscripten::val vecToArray(const std::vector<T>& data) {
            emscripten::val arr = emscripten::val::array();
            for (const auto& value : data) {
                arr.call<void>("push", std::move(value));
            }
            return arr;
        }

        template <typename T>
        emscripten::val vecToTypedArray(const std::vector<T>& data) {
            size_t dataSize = data.size() * sizeof(T);

            // Allocate an ArrayBuffer
            emscripten::val arrayBuffer = emscripten::val::global("ArrayBuffer").new_(dataSize);

            // Access the ArrayBuffer's data directly
            void* arrayBufferMemory = arrayBuffer["data"].as<void*>();

            // Copy the data into the ArrayBuffer's memory
            std::memcpy(arrayBufferMemory, data.data(), dataSize);

            // Create a Float32Array view on the ArrayBuffer
            emscripten::val float32Array = emscripten::val::global("Float32Array").new_(arrayBuffer);

            return float32Array;
        }

    }
}

#endif /* WASM_UTILITY_H */{% endhighlight %}

The utility functions provided in the code snippet serve a crucial role in facilitating seamless data exchange between C++ and JavaScript in a WebAssembly (WASM) context. These functions are essential for businesses and developers looking to leverage the performance benefits of C++ while maintaining the flexibility and interactivity of JavaScript in their web applications.

Overall, these utility functions provide a bridge between C++ and JavaScript in our C++ wrapper class, to keep the focus of the wrapper class on the high-level translation of data between C++ and Javascript. They allow for efficient data transfer, seamless integration, and optimized performance, ultimately leading to improved developer experiences and faster development cycles.

Lastly, we need to create our WASM bindings for Emscripten to create interfaces between our C++ and Javascript.  Creating WASM bindings with Emscripten allows developers to make client-side use of C++ libraries, and apply C++ skills to web development.  

{% highlight cpp linenos %}#include <vector>
#include <tuple>
#include <emscripten/val.h>
#include <emscripten/bind.h>
#include "kmeans.cpp"
#include "utilities.cpp"

using namespace emscripten;
using namespace clustering;


EMSCRIPTEN_BINDINGS(highp) {
    register_vector<int>("VectorInt");
    register_vector<long int>("VectorLongInt");
    register_vector<double>("VectorDouble");
    register_vector<std::vector<double>>("VectorMatrixDouble");
    register_vector<std::string>("VectorString");

    function("JsArrayToVectorDouble", &emscripten::vecFromJSArray<double>);
    function("JsArrayToVectorInt", &emscripten::vecFromJSArray<int>);
    function("JsArrayToVectorString", &emscripten::vecFromJSArray<std::string>);

    value_object<wasm::cluster::KResult>("KResult")
        .field("centroids", &wasm::cluster::KResult::centroids)
        .field("clusters", &wasm::cluster::KResult::clusters);

    class_<wasm::cluster::KMeans<double>>("KMeans")
        .constructor<int, int, double, std::string>()
        .function("setK", &wasm::cluster::KMeans<double>::setK)
        .function("getK", &wasm::cluster::KMeans<double>::getK)
        .function("setMaxIterations", &wasm::cluster::KMeans<double>::setMaxIterations)
        .function("getMaxIterations", &wasm::cluster::KMeans<double>::getMaxIterations)
        .function("setTolerance", &wasm::cluster::KMeans<double>::setTolerance)
        .function("getTolerance", &wasm::cluster::KMeans<double>::getTolerance)
        .function("getDistance", &wasm::cluster::KMeans<double>::getDistanceFunc)
        .function("predict", &wasm::cluster::KMeans<double>::predict);

    function("sad", &distance::sad<double>);
    function("euclidean", &distance::euclidean<double>);
}
{% endhighlight%}

Now we need to execute the `em++` command to compile our C++ into WebAssembly:

{% highlight shell %}em++ -std=c++17 \
    -lembind \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="'KMEANS'" \
    -sALLOW_MEMORY_GROWTH \
    -O2 -gsource-map \
    --profiling \
    --profiling-funcs \
    --tracing \
    -sNO_DISABLE_EXCEPTION_CATCHING \
    -sASSERTIONS \
    -o ./bin/kmeans.js \
    ./bindings.cpp
{% endhighlight %}

Emscripten offers developers a wide range of [command-line flags](https://emscripten.org/docs/tools_reference/emcc.html) allowing fine-grained control over the compilation process, enabling optimization, debugging, and customization of the generated WASM module. 

1. `-lembind`: This flag links the Embind library, which is a C++ binding library for Emscripten. Embind simplifies the process of exposing C++ functions and classes to JavaScript, making it easier to create bindings between the two languages.
2. `-s WASM=1`: This flag specifies that the output should be a WebAssembly module. It instructs Emscripten to compile the C++ code to WASM instead of the default asm.js format.
3. `-s MODULARIZE=1`: This flag modularizes the generated JavaScript code. It wraps the Emscripten runtime and the generated WASM module in a function, allowing for better encapsulation and avoiding global namespace pollution.
4. `-s EXPORT_NAME="'KMEANS'"`: This flag sets the name of the exported JavaScript function that will be used to initialize the WASM module. In this case, the exported function will be named "KMEANS".
5. `-sALLOW_MEMORY_GROWTH`: This flag allows the WASM module's memory to grow dynamically at runtime. By default, WASM modules have a fixed memory size, but enabling this flag allows the module to request more memory as needed.
6. `-O2`: This flag sets the optimization level to 2, which enables a balance between fast compilation and good performance. It applies various optimization techniques to the generated code, resulting in smaller and faster WASM modules.
7. `-gsource-map`: This flag generates a source map file alongside the compiled WASM module. Source maps provide a mapping between the generated WASM code and the original C++ source code, enabling better debugging and profiling experiences.
8. `--profiling`: This flag enables profiling support in the generated WASM module. It adds necessary instrumentation to collect profiling data, allowing developers to analyze and optimize the performance of their WASM code.
9. `--profiling-funcs`: This flag enables function-level profiling. It generates additional profiling information for individual functions, providing more granular performance insights
10. `--tracing`: This flag enables tracing support in the generated WASM module. It allows developers to trace the execution of their WASM code, which can be useful for debugging and understanding the program's flow.
11. `-sNO_DISABLE_EXCEPTION_CATCHING`: This flag disables the automatic disabling of exception catching in the generated WASM module. By default, Emscripten disables exception catching for performance reasons, but this flag allows exceptions to be caught and handled normally.
12.  `-sASSERTIONS`: This flag enables assertions in the generated WASM module. Assertions are used for runtime checks and can help catch bugs and logical errors during development.
13. `-o ./bin/kmeans.js`: This flag specifies the output file name and location for the generated JavaScript file that accompanies the WASM module. In this case, the output file will be named "kmeans.js" and will be placed in the "./bin" directory.
14. `./bindings.cpp`: This is the input file containing the C++ code to be compiled to WASM. It likely includes the bindings code that exposes the necessary functions and classes to JavaScript.

**NOTE**: The  `-gsource-map`, `--profiling`, `--profiling-funcs`, `--tracing`, and `-sASSERTIONS` flags are including for performance profiling and would not be included in a production to increase performance.

{% include components/heading.html heading='Benchmarking Logic' level=3 %}

Benchmarking logic is a critical aspect of comparing the performance of our Javascript `KMeans` algorithm implementation and our Emscripten implementation. By carefully designing and executing benchmarks, we can objectively measure and analyze the execution time, resource usage, and scalability of both implementations under various scenarios.  The test will be to execute K-Means clustering on 667,000 pixels on 4 dimensions (l,a,b,alpha) and assign these pixels to 6 centroids.

The following code will be the basis of our benchmarks:

{% highlight html linenos %}
<html>
    <body>
        <img id="uploaded-image" src="..." />
    </body>
    <script>
        var imgElement = document.querySelector("#uploaded-image"),
            totalTests = 1000,
            maxIterations = 50,
            kClusters = 10,
            rawImgData = loadData(element),
            preparedImgData = prepareData(rawImgData),
            kmeansClf = new KMeans(kClusters, maxIterations, 0.00001, "euclidean"),
            results = [];
        for (var i = 0; i < totalTests; i++) {
            setTimeout(async function () { // timeout included to avoid browser lock-ups, while ensuring consistent measurements
                var start = new Date(),
                    results = await kmeansClf.predict(preparedImgData),
                    duration = (new Date()) - start;
                results.push(duration);
            }, 0);
        }
        // compile results
        var mean = results.reduce((a, b) => a + b) / totalTests,
            stdDeviation = Math.sqrt(results.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / totalTests);
        console.log(mean, stdDeviation);
        /**
         * Loads data from image
         */
        function loadData(element) {
            const canvas = document.createElement("canvas"),
                ctx = canvas.getContext("2d");
            canvas.width = element.width;
            canvas.height = element.height;
            ctx.drawImage(element, 0, 0);
            const imageData = ctx.getImageData(0, 0, element.width, element.height);
            return imageData;
        }
        /*
         * Converts image RGB colors to LAB colors
         * */
        function prepareData(imgData) {
            var output = [];
            for (var i = 0; i < imgData.data.length; i += 4) {
                var rgbColor = [imgData.data[i], imgData.data[i + 1], imgData.data[i + 2], 1.0],
                labColor = rgb2lab(rgbColor);
                output.push(labColor);
            }
            return output;
        }
        /**
         * converts an RGBA color array to an LAB color array
         */
        function rgb2lab(rgba) {
            var r = rgba[0] / 255,
                g = rgba[1] / 255,
                b = rgba[2] / 255,
                alpha = rgba[3], // alpha, untouched
                x,
                y,
                z;
            r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
            g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
            b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

            x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
            y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
            z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

            x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
            y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
            z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

            return new Float32Array([116 * y - 16, 500 * (x - y), 200 * (y - z), alpha]);
        }
    </script>
</html>
{% endhighlight %}

Let's benchmark the  with the Javascript implementation of the K-Means algorithm.

|-----|------------|------------|---------|
|Type |Average (ms)|Std Dev (ms)|Factor   |
|JS   | 17,892      | 203        | 1      |
|WASM | 61,054      | 482        | 3.412 |

That is very underwhelming, especially considering how much work we have put into our WebAssembly implementation.  This C++ K-Means implementation over 3x slower our Javascript implementation.

An important thing to keep in mind is that we are compiling C++ code to WebAssembly, not simply running C++ logic.  So we need to implement the C++ to run optimally in WebAssembly.

1.  The code extensively uses vector methods such as `at()` and `size()` to access and manipulate data. While these methods provide a convenient and safe way to interact with vectors in C++, they can introduce performance overhead when compiled to WebAssembly.
    * `at()`: The `at()` method is used to access elements in a vector, providing bounds checking to ensure that the accessed index within the vector's range.  However, when compiled to WebAssembly, the `at()` method is translated to JavaScript code that performs additional checks and indirections.  These checks and indirections add overhead to each element access, slowing down the overall performance of the code.  In this implementation, everytime we access an item in an array (which is very often), we add another bottleneck.
    * `size()`: The `size()` method is used to retrieve the number of elements in a vector.  In C++, the `size()` method typically has constant-time complexity, as the size of the vector is stored internally. However, when compiled to WebAssembly, the `size()` method may be translated to JavaScript code that calculates the size dynamically, introducing additional overhead.
    *  **Solution**:  To mitigate the performance bottlenecks caused by vector methods, it's recommended to use direct array access whenever possible. Direct array access involves accessing elements using the square bracket notation (`[]`) just as in Javascript instead of the `at()` method, and storing the size of the vector in a separate variable instead of calling `size()` repeatedly.

    {% highlight cpp %}// Instead of using at() method
std::vector<int> data = {1, 2, 3, 4, 5};
int element = data.at(2);

// Use direct array access
std::vector<int> data = {1, 2, 3, 4, 5};
int element = data[2];
{% endhighlight %}
2.  Unnecessary Copies:
    *  Minimize unnecessary copying of data between vectors or other data structures.
    *  **Solution**: Pass vectors by reference or `const` reference whenever possible to avoid the overhead of copying.
3.  The code extensively uses nested `std::vector<T>` to represent and manipulate data. While nested `vectors` provide a convenient way to organize and access multi-dimensional data in C++, they can introduce performance challenges when compiled to WebAssembly.
    * Vectors of vectors do not guarantee contiguous memory layout.  Each inner vector is allocated separately, resulting in fragmented memory. Accessing elements in nested `vectors` requires multiple levels of indirection, as each inner `vector` needs to be accessed separately.  The non-contiguous memory layout can lead to poor cache locality and increased memory access latency.
    * **Solution**:  Use contiguous memory layouts whenever possible. Contiguous memory layouts involve storing multi-dimensional data in a single, flattened array, where elements are laid out sequentially in memory.

    {% highlight cpp %}{% raw %}// Instead of using vectors of vectors
std::vector<std::vector<int>> data = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
int element = data[1][2];

// Use contiguous memory layout
std::vector<int> data = {1, 2, 3, 4, 5, 6, 7, 8, 9};
int rows = 3;
int cols = 3;
int element = data[1 * cols + 2];{% endraw %}{% endhighlight %}


Of these changes, the change from nested `vectors` to contiguous memory layouts will be the most time-consuming change, but will also have a significant increase in performance.

**NOTE**:  I am including these issues to demonstrate that many known optimizations from C/C++ also apply when compiling to WebAssembly via Emscripten (namely contiguous memory layouts), whereas as avoiding unnecessary methods calls to avoid Javascript-WebAssembly translations is a less obvious performance optimization when first starting writing C/C++ for Emscripten.

{% include components/heading.html heading='Vectorization of C++ Implementation' level=3 %}

I have gone ahead and re-implemented the `KMeans` class as `KMeansContiguous`.  This implementation includes all of our optimizations we just listed:

*  It uses direct memory access
*  Passes data by reference between functions
*  Uses contiguous memory for working with raw data, distance matrices, and clustering assignments.

{% highlight cpp linenos %}#ifndef KMEANS_H
#define KMEANS_H

#include <stdlib.h>
#include <tuple>
#include <vector>
#include <algorithm>


namespace clustering {

    template <typename T>
    class KMeansContiguous {
        private:
            long int m_k;
            long int m_max_iterations;
            double m_tolerance;
            long int m_dimensions;
            double (* m_distance)(T*, T*, long int);

            void initialize_random_centroids(T* data, long int dataLength, T* centroids) { 
                size_t i = 0;
                size_t dataPoints = dataLength / m_dimensions;

                srand(time(NULL)); 
                for (i = 0; i < m_k; ++i) {
                    // initialize centroid to a random point from the provided data
                    long int random_seed = rand() % (dataPoints + 1);
                    for (size_t j = 0; j < m_dimensions; ++j) {
                        centroids[i * m_dimensions + j] = data[random_seed * m_dimensions + j];
                    }
                }
            }

            void initialize_kpp_centroids(T* data, long int dataLength, T *centroids) {
                size_t dataPoints = dataLength / m_dimensions;
                size_t i = 0;

                double ** centroidIndices = (double **) malloc(sizeof(double *) * m_k);
                srand(time(NULL)); 

                //set first seed
                size_t random_seed = rand() % (dataPoints + 1);
                centroidIndices[0] = &data[random_seed * m_dimensions];
                #pragma omp parallel for private(i) shared(centroids, data)
                for (i = 0; i < m_dimensions; ++i) {
                    centroids[i] = data[random_seed * m_dimensions + i];
                }
                long int current_centroid = 1;

                while (current_centroid < m_k) {
                    double maxMinDistance = std::numeric_limits<double>::min();
                    long int maxCentroidIndex = 0;
                    for (size_t j = 0; j < dataPoints; ++j) {
                        // check if already selected as a centroid
                        bool isSelected = false;
                        for (size_t k = 0; k < current_centroid; ++k) {
                            if (&data[j * m_dimensions] == centroidIndices[k]) {
                                isSelected = true;
                                break;
                            }
                        }
                        if (isSelected) {
                            continue;
                        }
                        /* end Check if already selected */
                        
                        double currentMinDistance = std::numeric_limits<double>::max();
                        for (long int k = 0; k < current_centroid; ++k) {
                            double potentialDistance = m_distance(&centroids[k * m_dimensions], &data[j * m_dimensions], m_dimensions);
                            if (potentialDistance < currentMinDistance) {
                                currentMinDistance = potentialDistance;
                            }
                        }

                        if (currentMinDistance > maxMinDistance) {
                            maxMinDistance = currentMinDistance;
                            maxCentroidIndex = j;
                        }
                    }

                    centroids[current_centroid * m_dimensions] = data[maxCentroidIndex * m_dimensions];
                    centroidIndices[current_centroid] = &data[maxCentroidIndex * m_dimensions];
                    ++current_centroid;
                }
            }

            double update_centroids(T* data, long int dataLength, T* centroids, long int * clusters) {
                size_t dataPoints = dataLength / m_dimensions;

                long double * sums = (long double *) malloc(sizeof(long double) * m_k * m_dimensions);
                size_t * counts = (size_t *) malloc(sizeof(size_t) * m_k * m_dimensions);
                T * new_centroids = (T *) malloc(sizeof(T) * m_k * m_dimensions);

                size_t i = 0;
                for (size_t cluster = 0; cluster < m_k; ++cluster) {
                    for (size_t dimension = 0; dimension < m_dimensions; ++dimension) {
                        sums[cluster * m_dimensions + dimension] = 0.0;
                    }
                }

                #pragma omp parallel for private(i) shared(data, centroids)
                for (i = 0; i < m_dimensions; ++i) {
                    for (size_t j = 0; j < dataPoints; ++j) {
                        ++counts[clusters[j] * m_dimensions + i];
                        sums[clusters[j] * m_dimensions + i] += data[j * m_dimensions + i];
                    }
                }

                // find euclidean mean of points assigned to each centroid
                // to determine the  new centroid location
                #pragma omp parallel for private(i) shared(centroids)
                for (i = 0; i < m_k; ++i) {
                    // check if has any assignments
                    bool hasAssignments = false;
                    for (size_t j = 0; j < m_dimensions; ++j) {
                        if (counts[i * m_dimensions + j]) {
                            hasAssignments = true;
                            break;
                        }
                    }
                    // if centroid has assignments, move centroid to  euclidean mean of points assigned to it
                    if (hasAssignments) {
                        for (size_t j = 0; j < m_dimensions; ++j) {
                            long double sum = sums[i * m_dimensions + j];
                            size_t count = counts[i * m_dimensions + j];
                            //printf("Sum: %Lf, Count: %f\n", sum, T(count));
                            new_centroids[i * m_dimensions + j] = sum / (T)count;
                        }
                    } else { // if no assignments, assign centroid to a random point
                        size_t random_seed = rand() % (dataPoints + 1);
                        for (size_t j = 0; j < m_dimensions; ++j) {
                            new_centroids[i * m_dimensions + j] = data[random_seed * m_dimensions + j];
                        }
                    }
                }

                double changes = 0.0;
                for (i = 0; i < m_k; ++i) {
                    double distance = m_distance(&centroids[i * m_dimensions], &new_centroids[i * m_dimensions], m_dimensions);
                    changes += distance;
                    for (size_t j = 0; j < m_dimensions; ++j) {
                        centroids[i * m_dimensions + j] = new_centroids[i * m_dimensions + j];
                    }
                }
                return changes;
            }

            long int update_clusters(T* data, long int dataLength, T* centroids, long int * clusters) {
                size_t dataPoints = dataLength / m_dimensions;
                size_t i = 0;
                long int assignment_changes = 0;

                double distance = 0.0;
                long int closest_centroid = 0;
                double closest_centroid_distance = std::numeric_limits<double>::max();
                for (i = 0; i < dataPoints; ++i) {
                    T* sample = &data[i * m_dimensions];
                    closest_centroid = 0;
                    closest_centroid_distance = std::numeric_limits<double>::max();
                    for (size_t j = 0; j < m_k; ++j) {
                        T* centroid = &centroids[j * m_dimensions];
                        distance = this->m_distance(sample, centroid, m_dimensions);
                        if (distance < closest_centroid_distance) {
                            closest_centroid_distance = distance;
                            closest_centroid = j;
                        }
                    }
                    if (clusters[i] != closest_centroid) {
                        clusters[i] = closest_centroid;
                        ++assignment_changes;
                    }
                }
                return assignment_changes;
            }

        public:
            KMeansContiguous(const long int k, const long int max_iterations, const double tolerance, const long int dimensions, double (* distance_func)(T*, T*, long int)) {
                m_k = k;
                m_max_iterations = max_iterations;
                m_tolerance = tolerance;
                m_dimensions = dimensions;
                m_distance = distance_func;
            }

            void setK(const long int k) {
                this->m_k = k;
            }

            long int getK() {
                return this->m_k;
            }

            void setDimensions(const long int dimensions) {
                this->m_dimensions = dimensions;
            }

            long int getDimensions() {
                return this->m_dimensions;
            }

            void setMaxIterations(const long int maxIterations) {
                this->m_max_iterations = maxIterations;
            }

            long int getMaxIterations() {
                return this->m_max_iterations;
            }

            void setTolerance(const double tolerance) {
                this->m_tolerance = tolerance;
            }

            double getTolerance() {
                return this->m_tolerance;
            }

            std::tuple<T * , long int * > predict(T* data, size_t length) {
                long int pointCount = length / m_dimensions;
                long int * clusters = (long int *) malloc(sizeof(long int) * pointCount);
                T* centroids = (T *) malloc(sizeof(T) * m_dimensions * m_k);
                long int current_iteration = 0;
                double centroid_changes = m_tolerance;
                long int assignment_changes = m_tolerance;

                initialize_kpp_centroids(data, length, centroids);
                while (current_iteration < m_max_iterations && centroid_changes >= m_tolerance) {
                    ++current_iteration;
                    assignment_changes = update_clusters(data, length, centroids, clusters);
                    //emscripten_console_log(("Assignment changes: " + std::to_string(assignment_changes)).c_str());
                    centroid_changes = update_centroids(data, length, centroids, clusters);
                }
                //printf("Current iteration: %zu, centroid changes: %f\n", current_iteration, centroid_changes);
                std::tuple<T *, long int *> output = std::tie(centroids, clusters);
                return output;
            }
    };
}{% endhighlight %}

We will need to modify our wrapper C++ class to use the correct `KMeans` implementation, as well as change our distance functions to use contiguous memory and direct array access:

{% highlight cpp %}#ifndef WASM_KMEANS_H
#define WASM_KMEANS_H

#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "../kmeans.cpp"
#include "../distance.hpp"
#include <wasm_simd128.h>

#include "utility.hpp"

namespace wasm {

    namespace cluster {

        struct KResult {
            emscripten::val centroids;
            emscripten::val clusters;
        };

        template <typename T>
        double ssd(T* point1, T* point2, long int dimensions) {
            // Sum of Squared Difference (SSD)
            double distance = 0.0;
            for (std::size_t i = 0; i < dimensions; i++){
                distance += pow(point2[i] - point1[i], 2);
            }
            return distance;
        }

        template <typename T>
        double euclidean(T* point1, T* point2, long int dimensions) {
            // Euclidean Distance
            return sqrt(ssd<T>(point1, point2, dimensions));
        }

        template <typename T>
        class KMeans {
            static const inline std::unordered_map<std::string, double (* )(T*, T*, long int)> distance_funcs = {
                { "euclidean", euclidean<T> }
            };

            public:
                KMeans(const long int k, const long int max_iterations, const double tolerance, long int dimensions, const std::string distanceFunc) {
                    if (distance_funcs.find(distanceFunc) == distance_funcs.end()) {
                        throw std::invalid_argument(distanceFunc + " is not a valid distance metric");
                    }
                    m_distance_func = distanceFunc;
                    m_instance = new clustering::KMeansContiguous<T>(k, max_iterations, tolerance, dimensions, distance_funcs.at(distanceFunc));
                }

                KResult predict(emscripten::val jsData) {
                    // convert TypedArray to a T* pointer
                    unsigned int jsDataLength= jsData["length"].as<long int>();
                    emscripten::val buffer = jsData["buffer"]; 
                    std::vector<T> byte_data = emscripten::convertJSArrayToNumberVector<T>(jsData);
                    T* data = reinterpret_cast<T*>(&byte_data[0]); 

                    auto results = this->m_instance->predict(data, jsDataLength);
                    free(data);

                    // convert data to Javascript
                    long int dimensions = m_instance->getDimensions();

                    T* centroids = std::get<0>(results);
                    emscripten::val jsCentroids = emscripten::val::array();
                    long int k = m_instance->getK();
                    for (size_t i = 0; i < k; ++i) {
                        jsCentroids.call<void>("push", wasm::utility::contiguousVecToArray<T>(&centroids[i * dimensions], dimensions));
                    }
                    free(centroids);

                    long int * clusters = std::get<1>(results);
                    emscripten::val jsClusters = wasm::utility::contiguousVecToArray<long int>(clusters, jsDataLength / dimensions);
                    free(clusters);
                    return KResult{ jsCentroids, jsClusters};
                }

                void setK(const long int k) {
                    this->m_instance->setK(k);
                }

                long int getK() {
                    return this->m_instance->getK();
                }

                void setMaxIterations(const long int maxIterations) {
                    this->m_instance->setMaxIterations(maxIterations);
                }

                long int getMaxIterations() {
                    return this->m_instance->getMaxIterations();
                }

                void setTolerance(const double tolerance) {
                    this->m_instance->setTolerance(tolerance);
                }

                double getTolerance() {
                    return this->m_instance->getTolerance();
                }

                std::string getDistanceFunc() {
                    return this->m_distance_func;
                }

            private:
                clustering::KMeansContiguous<T> * m_instance;
                std::string m_distance_func;
        };
    }
}{% endhighlight %}

Our new Emscripten implementation expects data ato be provided one contiguous memory array.  To provide a good developer experience to front-end developers, we will include a Javascript wrapper class in our WebAssembly library to our Emscripten `KMeans` class allowing developers to continue passing data in as 2-dimensional data while having the wrapper class handle the transformation of that data into a single typed array and passing it to the Emscripten `KMeans` implementation in the expected format.  

{% highlight javascript %}
class KMeans {
    constructor(k, iterations, tolerance, distance) {
        this.k = k;
        this.iterations = iterations;
        this.tolerance = tolerance;
        this.distance = distance;
    }

    async predict(data) {
        var dimensions = data[0].length,
            transformedData = this.constructor.flatten(data),
            module = await new KMEANS();
        var clf = new module.KMeans(this.k, this.iterations, this.tolerance, dimensions, this.distance);
        return clf.predict(transformedData);
    }

    static flatten(data) {
        var dimensions = data[0].length,
            transformedData = new Float32Array(data.length * dimensions);
        // flatten data for classification
        for (var i = 0; i < data.length; i++) {
            var dataEntry = data[i];
            for (var j = 0; j < dimensions; j++) {
                transformedData[i * dimensions + j] = dataEntry[j];
            }
        }
        return transformedData;
    }
}{% endhighlight %}

To keep our Emscripten module simple to use, we will want to include this wrapper in the Emscripten Javacript wrapper for our WebAssembly library using the `--extern-post-js <file-path>` flag:

{% highlight shell %}--extern-post-js ./kmeans-contiguous-wrapper.js{% endhighlight%}

This `--extern-post-js` flag adds the contents of a specified Javascript file to the end of the Emscripten-generated Javascript file.  The custom Javsacript can be used to add wrapper logic around the generated WASM functions/classes, or add library metadata.

Now let's run our benchmarks again:

|Type |Average (ms) |Std Dev (ms)|Factor   |
|-----|-------------|------------|---------|
|JS   | 17,892      | 203        | 1       |
|WASM | 6,569       | 349        | 0.367   |

We now have close to a 2.75x increase in performance compared to our Javascript implementation while keeping the front-end developers experience pretty simple.  But, we can further improve performance by adding SIMD instructions.

{% include components/heading.html heading='SIMD Vectorization' level=3 %}

SIMD is a parallel processing technique that allows a single instruction to perform the same operation on multiple data elements simultaneously. It enables the processor to exploit data-level parallelism and execute multiple calculations in a single clock cycle.

In the context of WebAssembly, SIMD instructions are supported through the SIMD128 extension. This extension introduces a set of 128-bit wide SIMD instructions that can operate on 32-bit floating-point numbers, providing a significant boost in performance for suitable workloads.

{% highlight cpp %}// Without SIMD
float distance = 0.0f;
for (int i = 0; i < dimensions; ++i) {
    float diff = dataPoint[i] - centroid[i];
    distance += diff * diff;
}

// With SIMD (using SIMD128 extension)
#include <wasm_simd128.h>

v128_t simdDistance = wasm_f32x4_splat(0.0f);
for (int i = 0; i < dimensions; i += 4) {
    v128_t simdDataPoint = wasm_v128_load(&dataPoint[i]);
    v128_t simdCentroid = wasm_v128_load(&centroid[i]);
    v128_t simdDiff = wasm_f32x4_sub(simdDataPoint, simdCentroid);
    simdDistance = wasm_f32x4_add(simdDistance, wasm_f32x4_mul(simdDiff, simdDiff));
}
float distance = wasm_f32x4_extract_lane(simdDistance, 0) +
                 wasm_f32x4_extract_lane(simdDistance, 1) +
                 wasm_f32x4_extract_lane(simdDistance, 2) +
                 wasm_f32x4_extract_lane(simdDistance, 3);{% endhighlight %}

In this example, the SIMD version calculates distances for four elements at a time using SIMD128 instructions. The `wasm_v128_load` function loads four floating-point values into a SIMD register, and the subsequent SIMD operations (`wasm_f32x4_sub`, `wasm_f32x4_mul`, and `wasm_f32x4_add`) perform the necessary calculations in parallel. Finally, the individual elements are extracted from the SIMD register and summed up to obtain the final distance.  This example also demonstrates the [Loop unrolling](https://en.wikipedia.org/wiki/Loop_unrolling) optimization technique.

When optimizing with SIMD instructions, it's essential to consider factors such as data layout, memory alignment, and the use of appropriate SIMD operations. By carefully designing the code to take advantage of SIMD parallelism, we can greatly enhance the performance of WebAssembly modules.

To fully leverage SIMD instructions, it's important to ensure that the data layout is compatible with SIMD operations.  Instead of using vectors of vectors, which can lead to non-contiguous memory access, contiguous memory layout is necessary, such as a flattened array.  Aligning data to 16-byte boundaries can further optimize memory access patterns and enable more efficient SIMD operations.

Here is our optimized distance function definition:

{% highlight cpp linenos %}
#include <wasm_simd128.h>

template <typename T>
double ssd(T* point1, T* point2, long int dimensions) {
    // Sum of Squared Difference (SSD)
    T distance = 0.0;

    #ifdef __wasm_simd128__
        v128_t sum = wasm_f64x2_splat(0.0f);

        // Calculate SSD in blocks for better performance
        const int SIMD_BLOCK_SIZE = 2;

        long int i = 0;
        for (; i <= dimensions - SIMD_BLOCK_SIZE; i += SIMD_BLOCK_SIZE) {
            v128_t vec1 = wasm_f64x2_make(point1[i], point1[i + 1]);
            v128_t vec2 = wasm_f64x2_make(point2[i], point2[i + 1]);

            v128_t diff = wasm_f64x2_sub(vec1, vec2);
            v128_t sqr_diff = wasm_f64x2_mul(diff, diff);
            sum = wasm_f64x2_add(sum, sqr_diff);
        }

        // Handle any remaining elements 
        for (; i < dimensions; ++i) {
            printf("remaining\n");
            T diff = point2[i] - point1[i];
            distance += diff * diff; // Avoid unnecessary SIMD conversion
        }

        // Extract the sum from the SIMD vector
        distance += wasm_f64x2_extract_lane(sum, 0) + wasm_f64x2_extract_lane(sum, 1);
    #else
        for (std::size_t i = 0; i < dimensions; i++){
            distance += pow(point2[i] - point1[i], 2);
        }
    #endif
    return distance;
}

template <typename T>
double euclidean(T* point1, T* point2, long int dimensions) {
    // Euclidean Distance
    return sqrt(ssd<T>(point1, point2, dimensions));
}{% endhighlight %}


To compile it with SIMD support we will need to add an extra flag `-msimd128`:

{% highlight shell %}em++ -std=c++17 \
    -lembind \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="'KMEANS'" \
    -msimd128 \
    -sALLOW_MEMORY_GROWTH \
    -O2 -gsource-map \
    --profiling \
    --profiling-funcs \
    --tracing \
    -sNO_DISABLE_EXCEPTION_CATCHING \
    -sASSERTIONS \
    -o ./bin/kmeans.js \
    ./bindings.cpp
{% endhighlight %}

Now let's run our benchmarks again:

|Type |Average (ms) |Std Dev (ms)|Factor   |
|-----|-------------|------------|---------|
|JS   | 17,892      | 203        | 1       |
|WASM | 6,812       | 680        | 0.380   |


Based on these, adding SIMD to our implementation slowed down execution a bit, likely because we only have 4 dimensions in our data.  That said, our implementation could be further optimized:

*  Change the data type from `double` to `float` to reduce the amount of memory usage, and increase memory bandwidth and computation speed.
*  Add SIMD usage in the `update_centroids`, `update_clusters`, `initialize_kpp_centroids`, and `initialize_random_centroids` methods to process multiple elements at once.

{% include components/heading.html heading='Benchmarking and Performance Analysis' level=2 %}

Our benchmarking criteria required the K-means implementations to converge upon the exact weights to test the full performance of the implementations.  In business application we would not likely require such a precise convergence of centroids, and would loosen the tolerance to get results faster.

|Type     |Average (ms)|Std Dev (ms)|Factor   |
|---------|------------|------------|---------|
|JS       | 17,892      | 203        | 1      |
|WASM (naive) | 61,054      | 482        | 3.412 |
|WASM (contiguous) | 6,569       | 349        | 0.367   |
|WASM (contiguous + SIMD) | 6,812       | 680        | 0.380   |

Based on these benchmarks, the key to optimizing performance of WebAssembly via EmScripten is

1.  Contiguous memory layout
2.  Direct memory access
3.  Pass values by reference when possible
4.  SIMD vectorization

By optimizing the K-Means clustering algorithm with WebAssembly, we have demonstrated its potential for enabling real-time interactivity. Our C++ implementation processed over 670,000 data points nearly 50 times in under 7 seconds, a nearly 2.75x speed improvement compared to Javacript methods, all within the browser. This optimization opens up possibilities for advanced features and functionalities in web applications, such as sophisticated data analysis techniques, real-time data streaming, and interactive visualizations. The resulting applications can provide users with richer insights and enhanced decision-making capabilities. Moreover, these optimizations improve scalability and cost-efficiency by allowing client-side resources to handle a higher volume of computational tasks. This enables organizations to serve more users and process more data with existing resources, leading to cost savings and a better return on investment.

{% include components/heading.html heading='Conclusion' level=2 %}

WebAssembly modules can seamlessly interact with JavaScript code, allowing for easy integration into existing web applications.  Emscripten provides bindings and APIs to facilitate communication between WebAssembly and JavaScript, enabling data exchange and function calls.  This interoperability allows us to leverage the strengths of both languages—the performance of WebAssembly for clustering algorithms and the flexibility of JavaScript for user interactions and UI.

Offloading computationally intensive tasks like clustering algorithms to the client-side using WebAssembly can reduce server load and costs.  Scaling becomes more manageable as the computational burden is distributed among users' devices rather than concentrated on the server.  This scalability advantage is particularly significant for applications with a large user base or those dealing with massive datasets.

Whether you're building interactive data visualizations, real-time analytics tools, or complex simulations, exploring WebAssembly can unlock new possibilities for your web projects. With the growing support and ecosystem around WebAssembly, now is the perfect time to dive in and start harnessing its potential. So, if you're looking to push the boundaries of web performance and deliver exceptional user experiences, consider incorporating WebAssembly into your development toolkit. The future of high-performance web applications is here, and WebAssembly is leading the charge.

{% include components/heading.html heading='References' level=2 %}

* [WebAssembly.org](https://webassembly.org/)
* [Emscripten](https://emscripten.org/docs/)
* [MDN](https://developer.mozilla.org/en-US/docs/WebAssembly)
* [W3C Spec](https://www.w3.org/TR/wasm-core-2/)