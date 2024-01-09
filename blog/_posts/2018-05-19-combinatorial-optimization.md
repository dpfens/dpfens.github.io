---
layout: post
title:  "An Introduction to Optimization: Combinatorial Optimization"
description: Getting Started with solving combinatorial optimization problems
keywords: combinatorics,optimization,python,linear,programming,objective,multi-objective
tags: math operations-research python
---

{% include components/heading.html heading='Overview' level=2 %}

During my time working in fundraising, I worked on the web development side, building and maintaining websites and tools for public and internal use. 
 Many of the problems that kept coming up in my department were optimization problems, many of which were directly related to business operations.  Producing print collateral at optimal pricing, optimizing table layouts for events, scheduling/assigning work, minimizing travel costs, etc. 
 Here I learned that while rule-based programming was useful automating known processes, optimization problems tend to make the biggest difference and time commitment for the majority of business decisions.  These decisions ranged from simple (minimizing paper costs for print invitations), to complex (prioritizing content based on audience demographics/giving potential).  Since moving on to other opportunities, I still dwell on the value of solving optimization problems in business scenarios.

Machine learning is a very prominent field right now.  It is enabling companies to use data to resolve issues and gains insights that were unfeasible to find or even tackle using other methods.  But not all problems can be resolved using machine learning, and historical data does not provide insights for all problems.  For example, there is no amount of seating data for  past weddings that will enable a machine learning model to learn to create a wedding seating chart for minimizing conflicts (that is, unless there are previous weddings where the exact same group attends, which would unusual).  Or for finding the optimal travel route s for FedEx delivery trucks.  These are the problems that are slower to find answers to, but crucial for business (or wedding) operations.

Solving optimization problems efficiently in a computer program is ultimately using mathematical optimization techniques to solve a given problem.    Wikipedia defines <b>Mathematical Optimization</b> as:

<blockquote cite="https://en.wikipedia.org/wiki/Mathematical_optimization">the selection of a best element (with regard to some criterion) from some set of available alternatives.
<footer>—Wikipedia</footer>
</blockquote>

which is a good simple explanation of optimization.  There is no correct solution, only varying degrees of better and worse solutions.  For example if a store wants to set the price for a product to maximize theirs profits, they should not sell a product for less than they purchased it for, and should not sell the product for more than customers will buy it for.  If the store sells the product at a minimal value, their profit will be lower, but if they sell it at a price greater than what customers will pay, then they will get fewer sales.  There is no right or wrong answer, just answers that lead to more/less profit.  Those prices that lead to less profit can be considered sub-optimal solutions to the profit maximization problem. There are many possible prices that can be set for a given problem, optimization algorithms are used to reduce the computations needed to arrive at an optimal solution.

<script type="text/javascript" src="https://ssl.gstatic.com/trends_nrtr/1457_RC03/embed_loader.js"></script> <script type="text/javascript"> trends.embed.renderExploreWidget("TIMESERIES", {"comparisonItem":[{"keyword":"/m/0pf2","geo":"US","time":"today 12-m"},{"keyword":"/m/0bx8h","geo":"US","time":"today 12-m"},{"keyword":"/m/048j8j","geo":"US","time":"today 12-m"},{"keyword":"/m/0byrz","geo":"US","time":"today 12-m"},{"keyword":"/m/026db4","geo":"US","time":"today 12-m"}],"category":0,"property":""}, {"exploreQuery":"date=today%2012-m,today%2012-m,today%2012-m,today%2012-m,today%2012-m&geo=US,US,US,US,US&q=%2Fm%2F0pf2,%2Fm%2F0bx8h,%2Fm%2F048j8j,%2Fm%2F0byrz,%2Fm%2F026db4","guestPath":"https://trends.google.com:443/trends/embed/"}); </script> 

Combinatorial optimization is a subset of mathematical optimization for identifying how to optimize their finite set of resources to optimize production or profits.  While less commonly used than linear programming, combinatorial optimization is an essential skill for finding optimal solutions for business problems.

{% include components/heading.html heading='Subset Sums' level=2 %}

Combinatorial optimization problems are a very common type of problem, writing programs that determine a solution quickly can be difficult, and in some cases, impossible.  For many combinatorial optimization problems, there are currently no efficient methods to solve them at scale.  But, there are many optimization problems that do have efficient solutions, which we will cover.  To start off, we will go through the most common situations for optimizations.  To get started, we will work through the [subset-sum problem](https://en.wikipedia.org/wiki/Subset_sum_problem):

<blockquote cite="https://en.wikipedia.org/wiki/Subset_sum_problem">given a set (or multiset) of integers, is there a non-empty subset whose sum is zero?
<footer>—Wikipedia</footer>
</blockquote>

In this problem, we are attempting to efficiently determine the set of items with the largest sum without exceeding a given number.  This is useful for determining how to efficiently load a shipping truck, without exceeding its maximum weight:

{% highlight python linenos %}
{% raw %}
def subset_sum(input_data, limit, labels=None):
    if not labels:
        labels = input_data
    elif labels and len(input_data) != len(labels):
        raise ValueError('input_data(%r) and labels(%r) must be of equal length' % (input_data,  labels))

    if not limit or limit < 0:
        raise ValueError('limit(%s) must be a positive number' % limit)

    cache = [None for _ in range(limit+1)]
    cache[0] = []

    cache_labels = [None for _ in range(limit+1)]
    cache_labels[0] = []
    for label, new_value in zip(labels, input_data):
        for i in range(limit - new_value, -1, -1):
            if cache[i] is not None:
                cache[i + new_value] = cache[i] + [new_value]
                cache_labels[i + new_value] = cache_labels[i] + [label]
    return max(zip(cache_labels, cache), key=lambda v: sum(v[1]))

data = [13, -3, -25, 20, -3, -16, 0, 18, 20, -7, 12, -5, 12, -5, -22, 15, -4, 7]
# correct answer: max subset: [20, -3, -16, 0, 18, 20, -7, 12, -5, 12], sum: 51
print 'Maximum Subarray: %r, Max: %r' % max_subarray(data)
{% endraw %}
{% endhighlight %}

The subset-sum problem can be used to identify how to fill a container with the most items without exceeding a given capacity.  This could be how to effectively fill a filing cabinet, how to fill a shipping container with the most weight, or how to fill a hard drive with the most files, while leaving minimal unused space

{% include components/heading.html heading='Knapsacks' level=2 %}

The subset-sum problem, is actually a special case of the [knapsack problem](https://en.wikipedia.org/wiki/Knapsack_problem),:

<blockquote cite="https://en.wikipedia.org/wiki/Knapsack_problem">Given a set of items, each with a weight and a value, determine the number of each item to include in a collection so that the total weight is less than or equal to a given limit and the total value is as large as possible.
<footer>—Wikipedia</footer>
</blockquote>

So this is similar to the subset-sum problem, except we are trying to maximize our `value` as well.  This problem involves maximizing the value of the chosen items, while not exceeding the value of our "knapsack". 

{% highlight python linenos %}
{% raw %}
def knapsack(weights, values, capacity):
    item_count = len(weights)
    cache = [[0 for _ in range(capacity + 1)] for _ in range(item_count + 1)]
    
    for i in range(item_count + 1):
        for j in range(capacity + 1):
            old_value = cache[i-1][j]
            if i == 0 or j == 0:
                cache[i][j] = 0
            elif weights[i-1] <= j:
                new_value = values[i-1] + cache[i-1][j-weights[i-1]]
                cache[i][j] = max(old_value, new_value)
            else:
                cache[i][j] = old_value
    return cache[-1][-1]

values = [60, 100, 120]
weights = [10, 20, 30]
capacity = 50
max_value = knapsack(weights, values, capacity)  # 220

{% endraw %}{% endhighlight %}

To get the index of items that were included in the knapsack, we can update the knapsack function to use the following code:

{% highlight python linenos %}
{% raw %}
def knapsack_items(weights, values, capacity):
    item_count = len(weights)
    cache = [[0 for _ in range(capacity + 1)] for _ in range(item_count + 1)]

    # find max value
    for i in range(item_count + 1):
        for j in range(capacity + 1):
            old_value = cache[i-1][j]
            if i == 0 or j == 0:
                cache[i][j] = 0
            elif weights[i-1] <= j:
                new_value = values[i-1] + cache[i-1][j-weights[i-1]]
                cache[i][j] = max(old_value, new_value)
            else:
                cache[i][j] = old_value

    # fetch list of items in knapsack
    max_value = cache[item_count][capacity]
    indices = set()
    for i in range(item_count, 0, -1):
        if max_value <= 0:
            break
        if max_value == cache[i - 1][j]:
            continue
        else:
            indices.add(i - 1)
            max_value = max_value - values[i - 1]
            j = j - weights[i - 1]
    return cache[item_count][capacity], indices

values = [60, 100, 120]
weights = [10, 20, 30]
capacity = 50
max_value, item_indices = knapsack(weights, values, capacity)
print(max_value, item_indices) # 220, {1, 2}
{% endraw %}
{% endhighlight %}

**NOTE**:  in cases where an two items have the same weight and value, they can be considered as iterchangeable items, as doing so would not affect the weight or value of the optimal knapsack.

If you examine this code closely, you may notice that the code is very inefficient, by checking every capacity between 0 and the specified `capacity`.  In cases like above, where the weights are all multiples of 10, we can know that most capacities will not require changes.   We can transform our `weights` and `capacity` values to minimize the number of iterations over the capacity by calculating the greatest common divisor (GCD) of the `weights` and `capacity` values and dividing the values by the GCD.  Here is an example below, which results in the same solution as the original problem as above

{% highlight python linenos %}
{% raw %}
knapsack_gcd = gcd(capacity, *weights)
minified_weights = [int(value / knapsack_gcd) for value in weights]
minified_capacity = int(capacity / knapsack_gcd)
max_value, item_indices = knapsack_items(minified_weights, values, minified_capacity)
print(max_value, item_indices)

{% endraw %}
{% endhighlight %}

Another variation of the knapsack problem is the [Continuous knapsack problem](https://en.wikipedia.org/wiki/Continuous_knapsack_problem), which allows fractions of items to be put in the knapsack.

{% highlight python linenos %}
{% raw %}
def continuous_knapsack(capacity, values, weights):
    """
    fill a container (the "knapsack") with fractional amounts of different
    materials chosen to maximize the value of the selected materials.

    Parameters:
        capacity (int|float): Total weight capacity of the knapsack
        values (list|tuple): Values of weights that can be placed in the knapsack
        weights (list|tuple): Weights of items that can be placed in the knapsack

    Returns:
        total_value (float):  Total value that can be stored in the knapsack
        selected_indices (list):  List of indices of items stored in the knapsack
        selected_fractions (list):  List of fractions of items stored in the knapsack
    """
    costs = []
    values = [float(value) for value in values]
    weights = [float(weight) for weight in weights]
    indices = range(len(weights))
    for i in range(len(weights)):
        costs.append(values[i] / weights[i])

    selected_indices = []
    selected_fractions = []

    # sorting items by value
    items = sorted(zip(indices, values, weights, costs), key=lambda item: item[3], reverse=True)

    total_value = 0
    for index, value, weight, cost in items:
        selected_indices.append(index)
        if capacity - weight >= 0:
            capacity -= weight
            total_value += value
            selected_fractions.append(1.0)
        else:
            fraction = capacity / weight
            total_value += value * fraction
            capacity = capacity - (weight * fraction)
            if fraction > 0:
                selected_fractions.append(fraction)
            break
    return total_value, selected_indices, selected_fractions

weights = [10, 40, 20, 30]
values = [60, 40, 100, 120]
capacity = 50
    
max_value, selected_indices, selected_fractions = continuous_knapsack(capacity, values, weights)  # (240.0, [0, 2, 3], [1.0, 1.0, 0.6666666666666666])
{% endraw%}
{% endhighlight %}

{% include components/heading.html heading='Activity Selection' level=2 %}

Our next problem we will tackle is the [activity selection problem](https://en.wikipedia.org/wiki/Activity_selection_problem):

<blockquote cite="https://en.wikipedia.org/wiki/Activity_selection_problem">The problem is to select the maximum number of activities that can be performed by a single person or machine, assuming that a person can only work on a single activity at a time.
<footer>—Wikipedia</footer>
</blockquote>

This problem can be generalized to this: maximize the number of intervals that can be sequenced without overlapping.

{% highlight python linenos %}
{% raw %}
import heapq

def activity_selection(names, start_times, finish_times):
    assert len(names) == len(start_times) == len(finish_times)

    heap = zip(finish_times, start_times, names)
    heapq.heapify(heap)
    previous_selection = heapq.heappop(heap)
    selections = [previous_selection]

    while heap:
        selection = heapq.heappop(heap)
        if selection[1] >= previous_selection[0]:
            selections.append(selection)
            previous_selection = selection
    return selections
{% endraw %}
{% endhighlight %}

But what about the case where we some intervals are more important than others?  We want to make sure that we maximize the weights of our set of chosen events.

{% highlight python linenos %}
{% raw %}
import heapq

def activity_selection_weighted(names, start_times, finish_times, weights):
    assert len(names) == len(start_times) == len(finish_times) == len(weights)

    heap = zip(finish_times, start_times, names, weights)
    heapq.heapify(heap)
    item_count = len(heap)
    weight_cache = [0] * item_count
    selections = []

    previous_selection = heapq.heappop(heap)
    selections = [previous_selection]
    maxi = -float('inf')

    for i, item in enumerate(heapq.nsmallest(item_count, heap)):
        for j, other_item in enumerate(heapq.nsmallest(i, heap)):
            if other_item[0] <= item[1]:
                weight_cache[i] = max(weight_cache[i], weight_cache[j] + item[3])
            maxi = max(weight_cache[i], maxi)

    for i, item in reversed(list(enumerate(heapq.nsmallest(item_count, heap)))):
        if weight_cache[i] == maxi:
            maxi -= item[3]
            selections.append(item)

    return list(reversed(selections))

activities = 'abcde'
start_times = [10, 12, 12, 13, 15]
finish_times = [11, 13, 12.5, 15, 17]
weights = [1, 3, 2, 5, 1]
print 'Selected Activities (unweighted): %r' % activity_selection(activities, start_times, finish_times)
print 'Selected Activities (weighted): %r' % activity_selection_weighted(activities, start_times, finish_times, weights)

{% endraw %}{% endhighlight %}

Activity selection has applications for scheduling events.  The activity selection problem has applications in scheduling meets, conference scheduling, and in recommending schedules to attendees of events.  This solution to the problem would have been particularly useful for providing a recommended attendance scheduling for alumni.

{% include components/heading.html heading='Task Assignment' level=2 %}

The last combinatorial problem we will cover is the [assignment problem](https://en.wikipedia.org/wiki/Assignment_problem):

<blockquote cite="https://en.wikipedia.org/wiki/Assignment_problem">The problem instance has a number of agents and a number of tasks. Any agent can be assigned to perform any task, incurring some cost that may vary depending on the agent-task assignment. It is required to perform all tasks by assigning exactly one agent to each task and exactly one task to each agent in such a way that the total cost of the assignment is minimized. 
<footer>—Wikipedia</footer>
</blockquote>

This problem requires us to calculate a cost matrix, made of m rows of workers, and n columns of tasks to be completed.  My example is for tasking workers on a flower farm to maximize profit for the farm, based on their wages and rate at which they pick flowers.

{% highlight python linenos %}
{% raw %}
def build_cost_matrix(workers, tasks, cost_func):
    return [[cost_func(worker, task) for task in tasks] for worker in workers]

def profit(worker, task):
    return (worker['rate'] * task) - worker['pay']

workers = [{'pay': 20, 'rate': 300}, {'pay': 10.5, 'rate': 200}, {'pay': 15, 'rate': 150}, {'pay': 6.5, 'rate': 100}, {'pay': 17.5, 'rate': 200}]
flowers =dict(orchid=10, daisy=2.25, daffodil=1.70, dandelion=0.001, grass=0.0001)
flower_labels = flowers.keys()
flower_assignments = flowers.values()

{% endraw %}{% endhighlight %}

We could normally could iterate through every possible combination of workers and flowers and find the maximum profit, especially since we only have 5 workers and 5 assignments, but that would not scale well if we had a large flower-growing business with hundred of workers and hundreds of types of flowers.  We will need to use a more scaleable method.  If we did not have a library, we  would implement a [Hungarian algorithm](https://en.wikipedia.org/wiki/Hungarian_algorithm), however it is a rather complicated algorithm which is a topic for another day.  Fortunately, scipy has an [implementation](https://docs.scipy.org/doc/scipy-0.18.1/reference/generated/scipy.optimize.linear_sum_assignment.html) that we can use:

{% highlight python linenos %}
{% raw %}
from scipy.optimize import linear_sum_assignment

def flower_picker_cost(worker, task):
    return 0 - abs(profit(worker, task))

cost_matrix = build_cost_matrix(workers, flower_assignments, flower_picker_cost)

worker_indexes, assignment_indexes = linear_sum_assignment(cost_matrix)

for worker_index, assignment_index in zip(worker_indexes, assignment_indexes):
    worker = workers[worker_index]
    flower = flower_labels[assignment_index]
    print 'Worker=%r, flower=%s, profitability=$%s' %  (worker, flower, profit(worker, flowers[flower]))

import numpy as np
minimum_cost =  np.array(cost_matrix)[worker_indexes, assignment_indexes].sum()
print 'Maximum profit: $%s' % abs(minimum_cost)

"""
Worker={'pay': 20, 'rate': 300}, flower=orchid, profitability=$2980/hour
Worker={'pay': 10.5, 'rate': 200}, flower=daisy, profitability=$439.5/hour
Worker={'pay': 15, 'rate': 150}, flower=dandelion, profitability=$-14.85/hour
Worker={'pay': 6.5, 'rate': 100}, flower=grass, profitability=$-6.49/hour
Worker={'pay': 17.5, 'rate': 200}, flower=daffodil, profitability=$322.5/hour
Maximum Profit: $3720.6600000000003/hour
"""{% endraw %}{% endhighlight %}

Notice that we made our `flower_picker_cost` function return `0 - profit(worker, task)`.  `scipy.optimize.linear_sum_assignment` implementation is used to minimize a cost function.  Since our measure of success is profitability, we ensure that the cost our most profitable worker-flower assignments return the lowest cost.  We could have used the formula `1 / - profit(worker, task)`, but I wanted to make the cost function simple and easy to interpret for users.  Let's try the same code on a large number of tasks and workers

{% highlight python linenos %}
{% raw %}
workers = [dict(pay=random.random(), rate=random.random()) for i in range(150)]

flowers = dict((flower, random.random() * 2) for flower in ["african corn lily", "ixia", "african lily, agapanthus", "alpine thistle, eryngium", "amaryllis, hippeastrum", "amazon lily, eucharis", "arum, zantedeschia", "baby’s breath, gypsophila", "balloon flower, platycodon", "barberton daisy, gerbera", "bee balm, monarda", "bell flower, campanula", "bells of Ireland, moluccella", "bergamot, monarda", "bird of paradise, strelizia", "bloom, chrysanthemum", "blue throatwort, trachelium", "bottlebrush, banksia", "brodiaea, triteleia (syn)", "broom, genista", "calla lily, zantedeschia", "canterbury bells, campanula", "carnation, dianthus", "china aster, callistephus", "chincerinchee, ornithogalum", "chinese bellflower, platycodon", "christmas rose, hellebore", "cockscomb, celosia", "columbine, aquilegia", "coneflower, rudbeckia/echinacea", "cornflower, centaurea", "corsage orchid, cattleya", "cosmos, cosmea (syn)", "cuban lily, scilla", "daffodil, narcissus", "dill, anethum", "drumstick, craspedia", "eustoma, lisianthus (syn)", "evening primrose, oenothera", "false goat’s beard, false spirea/astilbe", "feverfew, tanacetum parthenium", "flame lily, gloriosa", "flame tip, leucadendron", "flamingo flower, anthurium", "florist’s nighmare, ornithogalum", "floss flower, ageratum", "flowering cherry, prunus", "flowering onion, allium", "forget-me-not, myosotis", "foxglove, digitalis", "foxtail lily, eremurus", "gay feather, liatris", "gentian, gentiana", "gillyflower, matthiola", "ginger, alpinia", "globe amarath, gomphrena", "globe artichoke, cynara", "globe flower, trollius", "globe thistle, echinops", "glory lily, gloriosa", "golden rod, solidago", "golden shower orchid, oncidium", "goosefoot, chenpodium", "grape hyacinth, muscari", "guelder rose, viburnum opulus", "guernsey lily, nerine", "hyacinth, hyacinthus", "jersey lily, alstroemeria", "kangaroo paw, anigozanthos", "kansas feather, liatris", "lady’s mantle, alchemilla", "lady’s slipper orchid, paphiopedilum", "larkspur, delphinium consolida", "lavender, lavandula", "lilac, syringa", "lily, lilium", "lily of the valley, convallaria", "lisianthus, eustoma", "lobster claw, heliconia", "loose strife, lysimachia", "love lies bleeding, amaranthus", "love-in-a-mist, nigella", "lupin, lupinus", "marguerite, chrysanthemum frutescens", "marigold, calendula", "masterwort, astrantia", "michaelmas daisy, aster", "mimosa, acacia", "monkshood, aconitum", "montbretia, crocosmia", "moth orchid, phalenopsis", "mum, chrysanthemum", "obedient plant, physostegia", "ox-eye daisy, leucanthemum vulgare aka chrysanthemum leucanthemum", "painter’s palette, anthurium", "peony, paeonia", "peruvian lily, alstroemeria", "pincushion protea, leucospermum", "plumed thistle, cirsium", "prairie gentian, lisianthus", "prince of Wales feather, amaranthus", "queen Anne’s lace, ammi", "queen Fabiola lily, triteleia (syn brodiaea)", "red-hot poker, kniphofia", "rose, rosa", "safari sunset, leucadendron", "safflower, carthamus", "scabious, scabiosa", "scarlet plume, euphorbia fulgens", "scorpion orchid, aranthera", "sea holly, eryngium", "sea lavender, limonium", "september flower, aster", "singapore orchid, dendrobium", "slipper orchid, paphiopedilum", "snake head, chelone", "snapdragon, antirrhinum", "sneezeweed, helenium", "snow berry, symphoricarpos", "snow on the mountain, eurphorbia marginata", "speedwell, veronica", "spider orchid, arachnis", "spray carnation, dianthus", "spurge, euphorbia", "st john’s wort, hypericum", "star of bethlehem, ornithogalum", "statice, limonium", "stock, matthiola", "stonecrop, sedum", "sugarbush, protea", "sunflower, helianthus", "sweet pea, lathyrus", "sweet sultan, centaurea", "sweet William, dianthus barbatus", "sword lily, gladiolus", "tansy, tanacetum", "tazetta, narcissus", "thistle, eryngium", "tjenkenrientjee, ornithogalum", "transvaal daisy, gerbera", "tuberose, polianthes tuberosa", "tulip, tulipa", "turban buttercup/French buttercup/Persian buttercup, ranunculus", "turtle head, chelone", "ulster mary, alstroemeria", "waxflower, chamaelaucium", "windflower, anemone", "wormwood, artemesia", "yarrow", "achillea"])
flower_labels = flowers.keys()
flower_assignments = flowers.values()

cost_matrix = build_cost_matrix(workers, flower_assignments, flower_picker_cost)

worker_indexes, assignment_indexes = linear_sum_assignment(cost_matrix)

for worker_index, assignment_index in zip(worker_indexes, assignment_indexes):
    worker = workers[worker_index]
    flower = flower_labels[assignment_index]
    print 'Worker=%r, flower=%s, profitability=$%s/hour' %  (worker, flower, profit(worker, flowers[flower]))

{% endraw %}{% endhighlight %}

The assignment problem comes up often in everyday life, such as optimally determining which athletic trainer to assign to each athlete in a queue, determining how to assign technicians to support tickets based on their skillset and location, or determining the optimal way to assign salesperson to potential companies.

{% include components/heading.html heading='Minimum Set Cover' level=2 %}

One such approximation algorithm is that of the [Minimum Set Cover problem](https://en.wikipedia.org/wiki/Set_cover_problem):

<blockquote cite="https://en.wikipedia.org/wiki/Set_cover_problem">Given a set of elements {1,2,...,n} (called the universe) and a collection S of m sets whose union equals the universe, the set cover problem is to identify the smallest sub-collection of  S whose union equals the universe
<footer>—Wikipedia</footer>
</blockquote>

{% highlight python linenos %}
{% raw %}
def set_cover(target_set, all_sets, selection_func=None, max_iterations=1000, min_max=max):
    """
    Finds a list of sets from all_sets that covers all (or the most) items in covering_set.
    If not able to cover all the items in the covering set in max_iterations, will return the best result found
    """

    if selection_func and not hasattr(selection_func, '__call__'):
        raise ValueError('scoring_func(%r) is not callable' % selection_func)

    remaining_items = target_set
    best_solution = []
    if not selection_func:
        selection_func = lambda item: len(set(item) & set(remaining_items))
    iterations = 0
    old_remaining_items = remaining_items
    while len(remaining_items) and iterations < max_iterations:
        iterations += 1
        if not selection_func:
            selected_set = min_max(all_sets, key=selection_func)
        else:
            selected_set = selection_func(remaining_items)
        all_sets.remove(selected_set)
        remaining_items = set(remaining_items) - set(selected_set)
        if len(old_remaining_items) == len(remaining_items):
            if min_max == min:
                continue
            elif min_max == max:
                break
        best_solution.append(selected_set)
        old_remaining_items = remaining_items
    return best_solution

import itertools
import random
import string
alphabet_list = [letter for letter in string.lowercase]
combinations = [list(combo) for combo in itertools.combinations(alphabet_list, 4)]
set_to_cover = random.sample(alphabet_list, 9) + ['!']
print 'Set to Cover: %r' % set_to_cover
print 'Minimum Set Cover: %r, Uncovered Items %r' % set_cover(set_to_cover, combinations)
{% endraw %}{% endhighlight %}

Set coverings can be used to create solutions for purchasing inventory, creating work schedules for shift hours a training room,  creating the minimal team that has the required skillset for a project, or finding the minimal number of officials required to host a meet based on the division requirements.

In our examples, the algorithms solved our problems almost instantaneously.  In a production setting with larger datasets, we would likely rewrite these algorithms as a separate library in Cython to solv larger instances of the problems without performance issues.

{% include components/heading.html heading='Larger problems' level=2 %}

The problems we have examined so far are fairly simple problems.  In a business settings, many problems that need to be resolved have more potential solutions, more constraints, and more dimensions.  Computer scientists and operations research specialists have spent decades building and optimizing specialized libraries for solving these types of problems.  The most time-efficient way for us to use would be to use their optimized libraries to solve our optimization problems.  Their libraries will allow us to focus on solving our business-related issues using the best methods available.


*  [AMPL](https://ampl.com/)
*  [GAMS](https://www.gams.com/)
*  [GLPK](https://www.gnu.org/software/glpk/)
*  [GMPL](https://solverstudio.org/languages/gmpl/)
*  [IBM ILOG CPLEX](https://www.ibm.com/products/ilog-cplex-optimization-studio)
*  [ZIMPL](http://zimpl.zib.de/)
*  [Coin-OR](https://www.coin-or.org/)
*  [Clp](https://www.coin-or.org/Clp/)
*  [GECODE](http://www.gecode.org/)
*  [Gurobi](http://www.gurobi.com/)


The above all are very reputable and optimized libraries for solving optimization problems.  For Python, I would recommend using  Google's [ORTools](https://developers.google.com/optimization/). Google ORTools provides a Python interface to many of the above tools, allowing Python developers to leverage the above libraries without needing to know how each of them work.

Here is a real-life scenario:  Let's say we want to invest in our online advertising and we want to get the most conversions we can using our limited budget, but we have a set of business constraints that we have to meet.  Using only conversion rates across mediums, and our customer reach/dollar, we can find the optimal allocation of funds in less than a quarter of a second.

{% highlight python linenos %}
{% raw %}
from ortools.linear_solver import pywraplp
 
if __name__ == '__main__':
    channels = ['Social Media', 'Referral', 'Organic Search', 'Email', 'Direct']
    # probabilities of conversion from each of the above channels
    conversion_probabilities = [0.0675, 0.128, 0.0577, 0.1723, 0.7387]
    customer_reach = [2, 0.3, 1.8, 0.9, 2]
    constraint_table = {
        'Overall Budget': dict(max=5000, min=0, coefficients=[1, 1, 1, 1, 1]),
        'Direct Budget < 25% of Budget': dict()
    }
 
    solver = pywraplp.Solver('ROI', pywraplp.Solver.CBC_MIXED_INTEGER_PROGRAMMING)
    budgets = dict()
 
    objective = solver.Objective()
    # create variables for the budget of each channel
    for channel, probability in zip(channels, conversion_probabilities):
        # budget cannot be negative
        budget_variable = solver.NumVar(0.0, solver.infinity(), channel)
        # for each channel allocate funds based on conversion rates for each channel
        objective.SetCoefficient(budget_variable, probability)
        budgets[channel] = budget_variable
    # maximize the number of conversions (ROI)
    objective.SetMaximization()
 
    # total budget
    total_budget = solver.Sum(budgets.values())
 
    # total budget <= $5000
    solver.Add(total_budget <= 5000)
    # Social Media < $50
    solver.Add(budgets['Social Media'] <= 50)
    # Direct is < 25% of Total budget
    solver.Add(budgets['Direct'] <= .25 * total_budget)
    # E-mail budget is at least $200
    solver.Add(budgets['Email'] >= 200)
    # Email budget < 3 x Social Media
    solver.Add(budgets['Email'] <= 3 * budgets['Social Media'])
    # Referral budget >= 12% of total budget
    solver.Add(budgets['Referral'] >= .12 * total_budget)
    # Reach 30,000 or more users
    total_reach = sum([budgets[channel] * reach for channel, reach in zip(channels, customer_reach)])
    solver.Add(total_reach >= 30000)
 
    status = solver.Solve()
 
    if status == solver.OPTIMAL:
        for channel, value in budgets.items():
            print '%s: $%r' % (channel, value.solution_value())
        print 'Optimal budget: $%r, reaching %s users' % (total_budget.solution_value(), total_reach.solution_value())
    elif status == solver.FEASIBLE:
        print 'A potentially suboptimal solution was found.'
    else:
        print 'The solver could not solve the problem.'
{% endraw %}{% endhighlight %}

A significant benefit of ORTools is its ability to solve linear, integer and mixed-integer problems and to define the problem at runtime.  Many specialized optimization tools have their own language syntax for creating optimization programs, which makes building the problem at runtime more painful for developers.

{% include components/heading.html heading='Seating Assignment' level=2 %}

One of the biggest pains of brides (so I hear), is to organize the seating charts for wedding receptions.   In a perfect world this wouldn't be a problem because all relatives/friends would love each other's company.  But that's not going to happen.  So brides have to find a way to group the guests so that everyone can enjoy the company of fellow guests, and not be seated with company they don't enjoy (and potentially cause wedding drama). Fortunately, operations researchers identified this type of issue as one worth solving.  In our seating assignment problem, our objective is simple:  maximize the number of people sitting together who like each other. 
We can create a data representation to use to maximize our objective by creating a matrix representation of all sentiments/relationships between all attendees of the wedding.  an edge's weight reflects the sentiment/relationship that one guest has for another.  If the relationship is non-existent or a person feels ambivalent towards the other, the weight should be ~0.
We will have a number of constraints that we will need to account for:

*  A table cannot be assigned more guests than it has seats for
*  A guest cannot have more than 1 assigned seat
*  A guests must have know more at least a given number of guests at their table.  some guests may require more/less known guests than others
*  Tables may have varying capacities due to different types of tables, or  different numbers of available chairs

Now that we have our objectives and constraints we can write our actual model:

{% highlight python linenos %}
{% raw %}
from __future__ import print_function
from ortools.sat.python import cp_model


def seat_assignment(all_tables, table_capacities, min_known_neighbors, relationships, names):
    num_guests = len(relationships)
    all_guests = range(num_guests)

    if isinstance(table_capacities, int):
        table_capacities = [table_capacities] * len(all_tables)

    if isinstance(min_known_neighbors, int):
        min_known_neighbors = [min_known_neighbors] * len(all_tables)

    # Create the cp model.
    model = cp_model.CpModel()

    #
    # Decision variables
    #
    seats = {}
    for table in all_tables:
        for guest in all_guests:
            seats[(table, guest)] = model.NewBoolVar("guest %i seats on table %i" % (guest, table))

    colocated = {}
    for g1 in range(num_guests - 1):
        for g2 in range(g1 + 1, num_guests):
            colocated[(g1, g2)] = model.NewBoolVar("guest %i seats with guest %i" % (g1, g2))

    same_table = {}
    for g1 in range(num_guests - 1):
        for g2 in range(g1 + 1, num_guests):
            for table in all_tables:
                same_table[(g1, g2, table)] = model.NewBoolVar("guest %i seats with guest %i on table %i" % (g1, g2, table))

    # Objective
    total_score = sum(relationships[g1][g2] * colocated[g1, g2] for g1 in range(num_guests - 1) for g2 in range(g1 + 1, num_guests) if relationships[g1][g2] > 0)
    model.Maximize(total_score)

    #
    # Constraints
    #

    # Everybody seats at one table.
    for guest in all_guests:
        seats_per_guest = sum(seats[(table, guest)] for table in all_tables)
        model.Add(seats_per_guest == 1)

    # Tables have a max capacity.
    for table, table_capacity in zip(all_tables, table_capacities):
        assigned_seats_per_table = sum(seats[(table, guest)] for guest in all_guests)
        model.Add(assigned_seats_per_table <= table_capacity)

    # Link colocated with seats
    for g1 in range(num_guests - 1):
        for g2 in range(g1 + 1, num_guests):
            for table in all_tables:
                # Link same_table and seats.  Keeps variables in sync
                guest_table_1 = seats[(table, g1)]
                guest_table_2 = seats[(table, g2)]
                same_table_pairing = same_table[(g1, g2, table)]
                model.AddBoolOr([guest_table_1.Not(), guest_table_2.Not(), same_table_pairing])
                # if same_table_pairing is True, then guest_table_1/2 must be True
                model.AddImplication(same_table_pairing, guest_table_1)
                model.AddImplication(same_table_pairing, guest_table_2)

            # Link colocated and same_table.
            guests_sit_together = sum(same_table[(g1, g2, table)] for table in all_tables)
            model.Add(guests_sit_together == colocated[(g1, g2)])

    # Min known neighbors rule.
    for t, min_neighbors in zip(all_tables, min_known_neighbors):
        known_neighbors = sum(same_table[(g1, g2, t)] for g1 in range(num_guests - 1) for g2 in range(g1 + 1, num_guests) for t in all_tables if relationships[g1][g2] > 0)
        model.Add(known_neighbors >= min_neighbors)

    # Symmetry breaking. First guest seats on the first table.
    model.Add(seats[(0, 0)] == 1)

    # Solve model.
    solver = cp_model.CpSolver()
    status = solver.Solve(model)
    print("conflicts    : %i" % solver.NumConflicts())
    print(" branches     : %i" % solver.NumBranches())
    print("wall time    : %f ms" % solver.WallTime())
    output = dict()
    for (table, guest), seat_variable in seats.items():
        is_seated_at_table = solver.Value(seat_variable)
        if is_seated_at_table:
            guest_name = names[guest]
            output[guest_name] = table
    return output, solver.Value(total_score)


# solve_with_discrete_model()

if __name__ == '__main__':
    import random
    # Connection matrix: who knows who, and how strong
    # is the relation
    relations = [
                 [1, 50, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                 [50, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                 [1, 1, 1, 50, 1, 1, 1, 1, 10, 0, 0, 0, 0, 0, 0, 0, 0],
                 [1, 1, 50, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                 [1, 1, 1, 1, 1, 50, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                 [1, 1, 1, 1, 50, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                 [1, 1, 1, 1, 1, 1, 1, 50, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                 [1, 1, 1, 1, 1, 1, 50, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                 [1, 1, 10, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                 [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 50, 1, 1, 1, 1, 1, 1],
                 [0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 1, 1, 1, 1, 1, 1, 1],
                 [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
                 [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
                 [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
                 [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
                 [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
                 [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]
    ]

    # Names of the guests. B: Bride side, G: Groom side
    names = [
        "John (G)", "Mike (B)", "Kathy (G)", "Cory (B)", "Carmela (G)",
        "Jeff (B)", "Matt (B)", "Brad (B)", "Abby (B)", "Ann (B)",
        "Lee (G)", "Mary (B)", "Bob (B)", "Will (G)", "Scott (B)",
        "Diane (G)", "Laura (B)"
    ]
    table_count = 4
    all_tables = range(table_count)
    table_capacities = 5
    table_capacities = [random.randint(4,6) for table in all_tables]
    min_known_neighbors = 3
    min_known_neighbors = [random.randint(0,3) for table in all_tables]

    print('total guests: %i' % len(relations))
    if isinstance(table_capacities, (list, tuple)):
        total_seats = sum(table_capacities)
    else:
        total_seats = len(all_tables) * table_capacities
    print('total seats: %i' % total_seats)
    results, score = seat_assignment(all_tables, table_capacities, min_known_neighbors, relations, names)
    print('Seating assignments:')
    for guest, table in results.items():
        print('Guest: %r, Table: %r' % (guest, table))
    print('Optimal Score:', score)

{% endraw %}{% endhighlight %}

Using ortools, we were able to create a flexible model that meets all our constraints.  We even allow developers to specify table_capacity and min_known_neighbor constraints as an integer or as a list.  Let's check our output:

```
total guests: 17
total seats: 19
conflicts    : 4253
 branches     : 6426
wall time    : 0.678285 ms
Seating assignments:
Guest: 'Brad (B)', Table: 0
Guest: 'Diane (G)', Table: 2
Guest: 'Bob (G)', Table: 3
Guest: 'Kathy (B)', Table: 1
Guest: 'Laura (G)', Table: 2
Guest: 'John (B)', Table: 0
Guest: 'Cory (B)', Table: 1
Guest: 'Abby (B)', Table: 1
Guest: 'Jeff (B)', Table: 1
Guest: 'Matt (B)', Table: 0
Guest: 'Mary (G)', Table: 3
Guest: 'Carmela (B)', Table: 1
Guest: 'Will (G)', Table: 2
Guest: 'Lee (G)', Table: 3
Guest: 'Mike (B)', Table: 0
Guest: 'Scott (G)', Table: 3
Guest: 'Ann (G)', Table: 3
Optimal Score: 283
```

This model can be expanded to include even more constraints, so our model still has room to grow as more more constraints arise.  This same model can also be applied to other scenarios such as conference seating charts, assigning project teams, etc.


{% highlight python linenos %}{% raw %}from networkx import Graph
from networkx.algorithms import matching


def lane_matching(athletes, lanes, **kwargs):
    athlete_count = len(athletes)
    G = Graph()
    G.add_nodes_from([athlete['name'] for athlete in athletes])
    average_height = sum([athlete['height'] for athlete in athletes]) / athlete_count
    for lane in range(1, lane_count+1):
        G.add_node(lane)
    for athlete in athletes:
        athlete_name = athlete['name']
        preferred_lane = athlete['preferred_lane']
        athlete_height = athlete['height']
        for lane in range(1, lane_count+1):
            score = lane_count
            if lane < kwargs.get('furthest_inner_lane', 3):
                score -= (1.0 / lane * (athlete_height - average_height))
            score -= abs(preferred_lane - lane)
            G.add_edge(athlete_name, lane, weight=score)
    start_time = time.time()
    matches = matching.max_weight_matching(G, maxcardinality=True)
    total_time = (time.time() - start_time) * 1000
    print 'match time: %sms' % total_time
    return matches


if __name__ == '__main__':
    import time
    athletes = [
        dict(name='Sanya Richards-Ross', height=68.0, preferred_lane=4),
        dict(name='Carmelita Jeter', height=64.0, preferred_lane=5),
        dict(name='Wyomia Tyus', height=68.0, preferred_lane=6),
        dict(name='Veronica Campbell-Brown', height=65.0, preferred_lane=6),
        dict(name='Florence Griffith-Joyner', height=67.0, preferred_lane=5),
        dict(name='Wilma Rudolph', height=71.0, preferred_lane=6),
        dict(name='Allyson Felix', height=66.0, preferred_lane=4),
        dict(name='Gail Devers', height=63.0, preferred_lane=4)
    ]
    lane_count = 8
    lanes = range(1, lane_count + 1)
    lane_matches = lane_matching(athletes, lanes)
    print lane_matches{% endraw %}{% endhighlight %}

This code for creating the heats for the 


{% highlight python linenos %}{% raw %}
import math


def exponential_moving_average(iterable, **kwargs):
    iterable_size = len(iterable)
    alpha = kwargs.get('alpha', 2.0 / (iterable_size + 1))
    numerator = 0
    denominator = 0
    base_factor = 1 - alpha
    for i in range(iterable_size):
        if not i:
            numerator = iterable[i]
            denominator = 1.0
            continue
        factor = math.pow(base_factor, i)
        numerator += factor * iterable[i]
        denominator += factor
    return numerator / denominator


def time_series_exponential_moving_average(iterable, **kwargs):
    iterable_size = len(iterable)
    alpha = kwargs.get('alpha', 2.0 / (iterable_size + 1))
    numerator = 0
    denominator = 0
    base_factor = 1.0 - alpha
    for i in range(iterable_size):
        date, value = iterable[i]
        if not i:
            numerator = value
            denominator = 1.0
            previous_date = date
            time_difference = 0.0
            continue
        time_difference = time_difference + (previous_date - date).days
        if not time_difference:
            time_difference = 1.0
        factor = math.pow(base_factor, time_difference)
        numerator += factor * value
        denominator += factor
        previous_date = date
    return numerator / denominator


if __name__ == '__main__':
    import time
    import csv
    import datetime
    file_name = 'performances.csv'
    with open(file_name, 'rb') as input_file:
        data = list(csv.DictReader(input_file))
    athlete_lookup = dict()
    for performance in data:
        entity_id = performance['entity_id']
        performance['date'] = datetime.datetime.strptime(performance['date'], '%Y-%m-%d')

        performance['value'] = float(performance['value'])
        if entity_id not in athlete_lookup:
            athlete_lookup[entity_id] = dict(entity_id=entity_id, performances=[])
        if performance['value']:
            athlete_lookup[entity_id]['performances'].append(performance)

    athletes = []
    for athlete, performance_data in athlete_lookup.items():
        dated_performances = [(performance['date'], performance['value']) for performance in performance_data['performances'][::-1]]
        raw_performances = [performance['value'] for performance in performance_data['performances'][::-1]]
        performance_count = len(raw_performances)
        if performance_count:
            average = sum(raw_performances) / performance_count
            ema = exponential_moving_average(raw_performances, alpha=0.7)
            tsema = time_series_exponential_moving_average(dated_performances, alpha=0.7)
        else:
            average = ema = tsema = 0
        performance_data['average'] = average
        performance_data['ema'] = ema
        performance_data['tsema'] = tsema
        athletes.append(performance_data)
    heat_size = 10
    heats = []
    athletes = sorted(athletes, key=lambda athlete: athlete['tsema'])
    heat = []
    for athlete in athletes:
        heat.append(athlete)
        if len(heat) == heat_size or athlete == athletes[-1]:
            heats.append(heat)
            heat = []
    print heats
{% endraw %}
{% endhighlight %}