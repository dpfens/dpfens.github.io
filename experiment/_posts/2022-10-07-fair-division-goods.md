---
layout: post
title:  "Fair Division of Goods"
description: How to use algorithms in FairPy to efficiently find fair allocations of goods and create fair systems.
keywords: equitable,fair,division,indivisible,goods,python,envy-free,allocation,divisible,cake,cutting
tags: data math python

introduction: How to deterministically allocate goods fairly to agents based on their specific valuations of each good.
---

{% include components/heading.html heading='Overview' level=2 %}

[Fair division](https://en.wikipedia.org/wiki/Fair_division) is the game theory problem of how to divide a finite set of resources so that everyone receives their fair share, even when they have a diverse set of preferences.   There are many variations of fair division problems, based on characteristics of the resources to be divided, the criteria for fairness, and the preferences of the players.

In simple terms, fair division problems are about ensuring that everyone gets their fair share and is equally satisfied/dissatisfied with their allotment.  According to the <a href="https://en.wikipedia.org/wiki/Subjective_theory_of_value">subjective theory of value</a>, each person values goods differently, and so the fairness is evaluated based on the value of the person the good is allocated to.  This is important when we consider the effects 
 of giving/taking away goods/rights on equality/inequality such as the effect of social/welfare programs on the lives of everyday people.  It is more important that we be able to accurately and consistently create and evaluate the efficacy of systems such as social/welfare programs.

Fairness of a division/allocation is is commonly evaluated based on the following properties:

*  [Envy-freeness](https://en.wikipedia.org/wiki/Envy_minimization) - no agent believes that another agent was given a better bundle
*  [Proportionality](https://en.wikipedia.org/wiki/Proportional_division) - each agent is guaranteed their proportional share in terms of total value, independently of what others get.

Most problems do not have a solution that will satisfy both proportionality and be envy-free.  In such scenarios, different algorithms have mechanisms which result in trade-offs between envy-freeness and proportionality.

We can also evaluate allocations on metrics that incorporate aspects of the real-world such as the status of the agents being allocated, such as the wealth of the agents to whom more value is being allocated.  Such metrics could include utilitarian value, egalitarian value, or the largest envy magnitude.

I will use [fairpy](https://github.com/erelsgl/fairpy) to execute the algorithms, so we can focus on applications of fair division problems instead of algorithmic implementations.

{% include components/heading.html heading='Fair Cake Cutting' level=2 %}

[Cake-cutting](https://en.wikipedia.org/wiki/Fair_cake-cutting) problems for are fairly dividing heterogeneous goods/resources that can be divided/distributed by fractional amounts.  There are many algorithms for solving variants of the cake-cutting problem.

*  Asymmetric.  Follows a process where agents have different roles in the division process. For example, in the case of 2 agents, one agent cuts the cake and the other chooses.
*  [Symmetric](https://en.wikipedia.org/wiki/Symmetric_fair_cake-cutting).  Follows a process all agents have the same role in the division process.  For example, all agents cut the cake and a manager (who does not receive a piece of the cake) assigns pieces to agents.
*  [Contiguous Envy-free](https://arxiv.org/abs/1911.05416).  1/3 Envy-free algorithm to allocate contiguous pieces to `n` agents.
*  [Socially efficient cake divisions](https://arxiv.org/abs/1205.3982). Approximate divisions for `n` agents are computed based on a social welfare function.  [Social welfare functions](https://en.wikipedia.org/wiki/Social_welfare_function) attempt to quantify how good each division is for society as a whole.
*  [Last diminisher](https://en.wikipedia.org/wiki/Last_diminisher).  Returns proportional divisions for `n` agents
*  [Time auction](https://dl.acm.org/doi/10.5555/2615731.2617412).  Auctioning a continuous good for maximizing the aggregate utility.

Before we get started with our divisions, we need to define our agents, and their preferences.  We will re-use these agents/preferences across algorithms so we can compare the outputs from the various algorithms.

{% highlight python %}{% raw %}from fairpy.agents import PiecewiseUniformAgent, PiecewiseConstantAgent, PiecewiseConstantAgentNormalized

Doug = PiecewiseUniformAgent ([
    (0,1), # region 0 to 1 (with value 1)
    (1,2), # region 1 to 2 (with value 1)
    (2,2.75), # region 2 to 2.75 (with value 1)
    (2.75,3), # region 2.75 to 3 (with value 1)
    (3,4) # region 3 to 4 (with value 1)
], name="Doug")
Katherine = PiecewiseConstantAgent([
    0.6, # region 0 to 1 (with value 0.6)
    1.2, # region 1 to 2 (with value 1.2)
    1.5, # region 2 to 3 (with value 1.5)
    1.7  # region 3 to 4 (with value 1.7)
], name="Katherine")
agents = [Doug, Katherine]{% endraw %}{% endhighlight %}

A `PiecewiseUniformAgent` is a value function where the size of the interval varies but the value of those intervals stay the same.  In the case of Fairpy, each interval has a value of 1.  In the above example of Doug, the region 2 to 2.75 has the same value as region 2.75 to 3.0.  A `PiecewiseConstantAgent` is a value function where each interval is the same size, but with a different value.  Fairpy also offers a normalized version of the PiecewiseConstantAgent called the `PiecewiseConstantAgentNormalized` with normalizes the intervals and values to be proportions of the total cake.

{% highlight python %}{% raw %}a = PiecewiseConstantAgent([10, 20, 30, 40])
b = PiecewiseConstantAgentNormalized([10, 20, 30, 40])

a.eval(2, 3) # 50
b.eval(0.25, 0.75)  # 0.5

a.eval(2, 4) # 70
b.eval(0.5, 1.00)  # 0.7{% endraw %}{% endhighlight %}

In the above example, each agent has the same values for each of the 4 regions specified.  Above we can see that the proportions of value and size remain the same between the two agents, but in the latter we refer to the values as proportions of the entire cake, rather than in terms of the number of the regions provided by that agent.

`fairpy.agents.Agent` provides a number of methods that can be used to compare agents through their valuation functions and through the allocations we obtain through `fairpy`.  Let's start with comparing agents through their valuation functions:

{% highlight python %}{% raw %}start = 0.0
target_value = 4.9999
for agent in agents:
    agent_name = agent.name()
    total_value = agent.total_value()  # total value of the cake that the agent has ascribed value to
    cake_length = agent.cake_length()  # length of the cake that the agent has ascribed value to
    print('Agent %s: Total cake length = %s (total value=%s)' % (agent_name, cake_length, total_value))

    end = agent.mark(start, target_value)  # the end interval of the cut that the agent has ascribed the target value to
    if end:
        print('Agent %s: value=%s = Cut %s - %s' % (agent_name, target_value, start, end))
    else:
        max_value = agent.eval(start, cake_length)  # value of the remaining cake to the agent
        print('Agent %s: value=%s = %s - %s' % (agent_name, target_value, start, end)){% endraw %}{% endhighlight %}

```
Agent Doug: Total cake length = 4 (total value=4.0)
Agent Doug: value=4.9999 = 0.0 - None
Agent Katherine: Total cake length = 4 (total value=5.0)
Agent Katherine: value=4.9999 = Cut 0.0 - 3.9999411764705886
```

We use can use methods like `agent.total_value()`, `agent.cake_length()`, `agent.eval(start, end)`, and `agent.mark(start, target_value)` to compare the valuation functions of agents.  The `eval` method provides the value to the agent of the interval between the `start` and `end` points of a cake, and the `mark` method provides the `end` of an interval with the given `start` point that the agent would ascribe the `target_value` to.  Using these  methods and the `total_value`, and `cake_length` methods we can compare agents and their valuation functions.

In this section we will be using the `PiecewiseUniformAgent` and `PiecewiseConstantAgent`.

We will start with the `asymmetric_protocol`.  As we said above, this protocol divides a cake by having multiple agents perform different tasks in the division process, ensuring no agent can give themselves a larger piece of the pie or ensure another agent receives a piece smaller than their fair share.

{% highlight python %}{% raw %}from fairpy.cake import cut_and_choose

allocation = cut_and_choose.asymmetric_protocol(agents)
print(allocation){% endraw %}{% endhighlight %}

```
Doug gets {(0, 2.0)} with value 2.
Katherine gets {(2.0, 4)} with value 3.2.
```


{% highlight python %}{% raw %}from fairpy.cake import cut_and_choose

allocation = cut_and_choose.symmetric_protocol(agents)
print(allocation){% endraw %}{% endhighlight %}

```
Doug gets {(0, 2.2333333333333334)} with value 2.23.
Katherine gets {(2.2333333333333334, 4)} with value 2.85.
```

The `fairpy.cake.last_diminisher` algorithm produces an allocation that is proportional but not envy-free (<a href="https://people.math.wisc.edu/~meyer/math141/fairdivision1.html">source</a>).

{% highlight python %}{% raw %}allocation = last_diminisher.last_diminisher(agents)

print(allocation){% endraw %}{% endhighlight %}

```
Doug gets {(0, 2.0)} with value 2.
Katherine gets {(2.0, 4)} with value 3.2.
```

The `fairpy.cake.socially_efficient_cake_divisions` algorithm produces an allocation that is proportional but not envy-free (<a href="https://people.math.wisc.edu/~meyer/math141/fairdivision1.html">source</a>).

{% highlight python %}{% raw %}from fairpy.cake import socially_efficient_cake_divisions

allocation = socially_efficient_cake_divisions.divide(agents, 0.5){% endraw %}{% endhighlight %}

```
Doug gets {(2.2, 3.4705882352941178)} with value 1.27.
Katherine gets {(0.5, 2.2)} with value 1.8.
```

{% include components/heading.html heading='Item Allocation' level=2 %}

*  bag-filling  - Adding items to an agents bag until the value of items in the bag is above their threshold
*  bounded sharing - Sets the max number of potential item sharings to `n - 1`, where `n` is the number of agents
*  [fair enough](https://dl.acm.org/doi/abs/10.1145/3140756) - Allocates the given items to the given agents using the 'Fair Enough' algorithm which
    garantees gamma * MaxiMin Share for each agent.
*  [few queries](https://arxiv.org/abs/1807.11367) - computes an allocation satisfying envy-freeness up to one good (EF1), a relaxation of envy-freeness, using a logarithmic number of queries.
*  [Iterated maximum matching](https://arxiv.org/abs/1912.02797) - Finds a maximum-weight matching with the given preferences, agent_weights and capacities.
*  [Leximin](https://www.wisdom.weizmann.ac.il/~feige/Algs2022/AllocationLecture.pdf) - Find the leximin-optimal (aka Egalitarian) allocation.
*  max welfare - Find an allocation maximizing a given social welfare function. (aka Max Nash Welfare) allocation.
*  [Min sharing](https://arxiv.org/abs/1908.01669) - finds allocation smallest possible number of shared objects in polynomial time
*  [Paterto Optimal (PO) and PROP1 allocation](https://www.sciencedirect.com/science/article/abs/pii/S0167637720301024) - fair allocation of indivisible items under additive utilities in strongly polynomial time
*  [PROPm allocations](https://arxiv.org/abs/2105.11348)
*  [Round robin allocations](https://en.wikipedia.org/wiki/Round-robin_item_allocation)
*  [undercut procedure](https://arxiv.org/pdf/1312.6444.pdf) - fair item assignment between two agents

In the following item allocation examples, I will be using the following agents/preferences to demonstrate the algorithms:

{% highlight python %}{% raw %}instance = {
    "Doug":  {"z":12, "y":10, "x":8, "w":7, "v":4, "u":1}, # value of z is 12, y is 10, etc
    "Mitch":   {"z":14, "y":9, "x":15, "w":4, "v":9, "u":12},
    "Katherine": {"z":19, "y":16, "x":8, "w":6, "v":5, "u":1},
}{% endraw %}{% endhighlight %}

First, we have the <a href="https://en.wikipedia.org/wiki/Round-robin_item_allocation">round robin allocation</a>.  Round robin allocations are envy-free up to 1 object (EF-1), and ensures each agent is allocated the same number of items.  While the algorithm is very simple, it is not efficient for large numbers of agents and large numbers of items.

{% highlight python %}{% raw %}allocation = fairpy.items.round_robin(instance){% endraw %}{% endhighlight %}

```
George gets {w,z} with value 19.
Mitch gets {u,x} with value 27.
Katherine gets {v,y} with value 21.
```

The `fairpy.items.utilitarian_matching` algorithm finds a <a href="https://en.wikipedia.org/wiki/Maximum_weight_matching">maximum weight matching</a> between the agents and the items, where the edge between agents and unallocated items are the agent's value of the item multiplied by the agent's weight.  The maximum weight matching  allocation that maximizes the total aggregate value to the agents.

{% highlight python %}{% raw %}agent_weights = agent_weights = {
    'Mitch': 4, # Mitch is 4x more important than George
    'Katherine': 2, # Katherine is 2x more important than George
    'George': 1
}
item_capacities = dict(z=2, y=5, x=2, w=4, v=1, u=4)
agent_capacities = dict(Mitch=3, Katherine=4, George=5)
allocation = fairpy.items.utilitarian_matching(instance, agent_weights=agent_weights, item_capacities=item_capacities, agent_capacities=agent_capacities){% endraw %}{% endhighlight %}

```
George gets {w,w,y,y,y} with value 44.
Mitch gets {u,x,x} with value 42.
Katherine gets {y,y,z,z} with value 70.
```

The `fairpy.items.iterated_maximum_matching` algorithm (also called the <a href="https://arxiv.org/abs/1912.02797">Bounded Subsidy algorithm</a>) finds a <a href="https://en.wikipedia.org/wiki/Maximum_weight_matching">maximum weight matching</a> between the agents and the items, where the edge between agents and unallocated items are the agent's value of the item multiplied by the agent's weight.  The algorithm iteratively matches a single item to each agent in each round, until no items are left.  The maximum weight matching ensures that the total value allocated is maximized in each round of item allocations.

{% highlight python %}{% raw %}allocation = fairpy.items.iterated_maximum_matching(instance, item_capacities=item_capacities, agent_weights=agent_weights){% endraw %}{% endhighlight %}

```
George gets {w,w,w,y,y,z} with value 53.
Mitch gets {u,u,u,u,x,x} with value 78.
Katherine gets {v,w,y,y,y,z} with value 78.
```

The `fairpy.items.propm_allocation` algorithm finds an allocation of items that meets the <i>PROPm</i>  notion of fairness for proportionality.  The <a href="https://arxiv.org/abs/2105.11348">PROPm</a> notion is a measure of proximity to proportionality, where the proportion of value allocated to each agent is within their maxi-min value of items allocated to other agents of their respective proportionality.  This allocation is particularly useful in scenarios where a proportional allocation cannot be attained by ensuring the allocations are guaranteed to be as close to proportional as possible.<p/>

{% highlight python %}{% raw %}allocation = fairpy.items.propm_allocation(instance){% endraw %}{% endhighlight %}

```
George gets {x,y} with value 18.
Mitch gets {u,v,w} with value 25.
Katherine gets {z} with value 19.
```

The `fairpy.items.max_sum_allocation` algorithm produces an allocation maximizing the Betham social welfare function (sum of value).

{% highlight python %}{% raw %}allocation  = fairpy.items.max_sum_allocation(instance){% endraw %}{% endhighlight %}

```
George gets { 100.0% of w} with value 7.
Mitch gets { 100.0% of x, 100.0% of v, 100.0% of u} with value 36.
Katherine gets { 100.0% of z, 100.0% of y} with value 35.
```

The `fairpy.items.max_product_allocation` algorithm produces an allocation maximizing the Nash social welfare function (product of value).

{% highlight python %}{% raw %}allocation = fairpy.items.max_product_allocation(instance){% endraw %}{% endhighlight %}

```
George gets { 50.03% of z, -0.0% of y, 38.729% of x, 99.999% of w, 0.0% of v, -0.0% of u} with value 16.1.
Mitch gets { -0.0% of z, -0.0% of y, 61.271% of x, 0.0% of w, 100.0% of v, 100.0% of u} with value 30.2.
Katherine gets { 49.97% of z, 100.001% of y, 0.0% of x, 0.0% of w, 0.0% of v, 0.0% of u} with value 25.5.
```

The `fairpy.items.max_minimum_allocation` algorithm  produces an allocation maximizing the max-minimum (aka Egalitarian) social welfare function.

[Fair Enough: Guaranteeing Approximate Maximin Shares](https://dl.acm.org/doi/abs/10.1145/3140756) described the max-minimum (maximin) as <q cite="https://dl.acm.org/doi/abs/10.1145/3140756">maximin share guarantee: each player’s value for his allocation should be at least as high as what he can guarantee by dividing the items into as many bundles as there are players and receiving his least desirable bundle.</q>

{% highlight python %}{% raw %}allocation = fairpy.items.max_minimum_allocation(instance){% endraw %}{% endhighlight %}

```
George gets { 66.775% of z, 91.248% of x, 100.0% of w} with value 22.3.
Mitch gets { 8.752% of x, 100.0% of v, 100.0% of u} with value 22.3.
Katherine gets { 33.225% of z, 100.0% of y} with value 22.3.
```

The `fairpy.items.leximin_optimal_allocation` algorithm finds an allocation that maximizes the minimum value allocated to agents, then the second minimum value to each agent, etc.

<blockquote class="normal" cite="https://www.cs.toronto.edu/~nisarg/papers/leximin.pdf">the leximin mechanism is an extension of the egalitarian equivalence principle put forward by <a href="https://www.jstor.org/stable/1883182">Pazner and Schmeidler</a>, in which one attempts to equalize all agent utilities (and maximize this utility value). This is what the leximin mechanism attempts in its first step of maximizing the minimum utility. However, sometimes the solution obtained is not Pareto optimal. The subsequent steps amend this solution to make it Pareto optimal, and eliminate any waste of resources. Without loss of generality, assume that the leximin mechanism chooses a non-wasteful
allocation...

    <footer>
        <cite>
            <a href="https://www.cs.toronto.edu/~nisarg/papers/leximin.pdf">Leximin Allocations in the Real World</a> 
        </cite>
    </footer>
</blockquote>

Leximin optimal allocations can be found using the following line of code:

{% highlight python %}{% raw %}allocation = fairpy.items.leximin_optimal_allocation(instance){% endraw %}{% endhighlight %}

```
George gets { 66.775% of z, 91.248% of x, 100.0% of w} with value 22.3.
Mitch gets { 8.752% of x, 100.0% of v, 100.0% of u} with value 22.3.
Katherine gets { 33.225% of z, 100.0% of y} with value 22.3.
```

Leximin allocations are primed to make a significant impact on society based on <a href="https://www.cs.toronto.edu/~nisarg/papers/leximin.pdf">recent applications</a> of the leximin mechanism.  The <a href="http://www.spliddit.org/">Spliddit</a> is also actively applying provably fair solutions to real-world problems using fair allocation algorithms.

The `fairpy.items.efficient_envyfree_allocation_with_bounded_sharing` algorithm  finds a maximum Nash welfare (product of values) allocation, which is known to be envy-free and Pareto-optimal.

{% highlight python %}{% raw %}allocation = fairpy.items.efficient_envyfree_allocation_with_bounded_sharing(instance){% endraw %}{% endhighlight %}

```
George gets { 50.029% of z, 38.729% of x, 100.0% of w} with value 16.1.
Mitch gets { 61.271% of x, 100.0% of v, 100.0% of u} with value 30.2.
Katherine gets { 49.971% of z, 100.0% of y} with value 25.5.
```

The `fairpy.items.envyfree_allocation_with_min_sharing` algorithms find an envy-free allocation with minimal sharing in polynomial time.

{% highlight python %}{% raw %}allocation = fairpy.items.envyfree_allocation_with_min_sharing(instance){% endraw %}{% endhighlight %}

```
George gets { 100.0% of y, 100.0% of w} with value 17.
Mitch gets { 100.0% of x, 100.0% of u} with value 27.
Katherine gets { 100.0% of z, 100.0% of v} with value 24.
```

We can analyze these item allocations based on a number of various metrics.  I have written a script below that demonstrates how to use the built-in fairpy methods to calculate these metrics:

{% highlight python %}{% raw %}for agent, own_bundle in zip(allocation.agents, allocation.bundles):
    agent_name = agent.name()

    own_bundle_value = agent.value (own_bundle)

    best_index = agent.best_index(allocation.bundles)  # an index of a bundle that is most-valuable for the agent.
    best_bundle = allocation.bundles[best_index]
    best_bundle_value = agent.value(best_bundle)
    best_bundle_proportion = own_bundle_value / best_bundle_value
    best_bundle_difference = 1 - best_bundle_proportion

    print('Best bundle: #%s: %r (value=%r, %r%% better than assigned)' % (best_index, best_bundle, best_bundle_value, best_bundle_difference * 100))

    maximin_share = agent.value_1_of_c_MMS(c=1)  # Calculates the value of the 1-out-of-c maximin-share
    value_proportional_except_1 = agent.value_proportional_except_c(len(allocation.agents), c=1)  # Calculates the proportional value of that agent, when the c most valuable goods are ignored.
    own_bundle_objects = own_bundle.object_names
    bundle_objects = [bundle.object_names for bundle in allocation.bundles]
    agent.value_except_best_c_goods(own_bundle.object_names, c=1)
    is_ef2 = agent.is_EFc(own_bundle_objects, bundle_objects, c=2) # Checks whether the current agent finds the given allocation envy-free-except-c-goods (EFc).
    is_ef1 = agent.is_EF1(own_bundle_objects, bundle_objects) # Checks whether the current agent finds the given allocation envy-free-except-1-good (EF1).
    is_efx = agent.is_EFx(own_bundle, bundle_objects)
    is_ef = agent.is_EF(own_bundle, allocation.bundles)
    is_PROPc = agent.is_PROPc(own_bundle_objects, len(allocation.agents), c=1)
    is_PROP = agent.is_PROP(own_bundle_objects, len(allocation.agents))
    print('maximin_share=%r, value_proportional_except_1=%r, is_ef2=%r, is_ef1=%r, is_efx=%r, is_ef=%r, is_PROPc=%r, is_PROP=%r' % (maximin_share, value_proportional_except_1, is_ef2, is_ef1, is_efx, is_ef, is_PROPc, is_PROP)){% endraw %}{% endhighlight %}

```
Best bundle: #0: { 100.0% of y, 100.0% of w} (value=17.0, 0.0% better than assigned)
maximin_share=42.0, value_proportional_except_1=Fraction(10, 1), is_ef2=True, is_ef1=True, is_efx=False, is_ef=True, is_PROPc=True, is_PROP=True
Best bundle: #1: { 100.0% of x, 100.0% of u} (value=27.0, 0.0% better than assigned)
maximin_share=63.0, value_proportional_except_1=Fraction(16, 1), is_ef2=True, is_ef1=True, is_efx=False, is_ef=True, is_PROPc=True, is_PROP=True
Best bundle: #2: { 100.0% of z, 100.0% of v} (value=24.0, 0.0% better than assigned)
maximin_share=55.0, value_proportional_except_1=Fraction(12, 1), is_ef2=True, is_ef1=True, is_efx=False, is_ef=True, is_PROPc=True, is_PROP=True
```

**NOTE**: While the documentation says the `agent.is_*` method accepts `fairpy.bundle.Bundle` instances, as arguments the library currently throws a `KeyError` error whenever called.  However, the calculations are successful & accurate if `bundle.object_names` is used as an argument instead.

{% include components/heading.html heading='Conclusion' level=2 %}

Fairpy can be used to allocate goods fairly based on the valuations of each individual agent and to analyze those allocations based on measures of fairness.  Allocations can be performed on allocations of any kind, so long as the agent valuations can be quantified.

I hope to be able to use Fairpy to evaluate systems for allocating goods, such as welfare systems. 
 This library has all of the calculations to objectively measure equality/inequality.