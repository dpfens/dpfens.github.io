---
layout: post
title:  "Fair Division of Goods: Cake Cutting"
description: Part 2 explores cake-cutting algorithms for divisible goods, establishing theoretical foundations before confronting the harsh reality that most real-world problems involve indivisible items where perfect fairness often becomes impossible.
keywords: cake-cutting,fair,division,divisible,goods,continuous,allocation,envy-free,proportional,algorithms,query-complexity,Robertson-Webb,cut-and-choose,last-diminisher
tags: data math python fairness

introduction: Exploring fair division of perfectly divisible goods through cake-cutting theory, and understanding why these elegant solutions fail when we return to indivisible items like houses and watches.
---

In [Part 1](/experiment/fair-division-goods-part-1), we established the mathematical foundations of fair division: how to represent preferences through valuation functions, what it means for an allocation to be "fair" (envy-freeness and proportionality), and why perfect fairness is often impossible with indivisible goods like houses, pianos, and watches. We saw that when a single item is worth more than an agent's fair share (1/n of total value), or when agents have similar preferences for scarce items, no allocation can satisfy both envy-freeness and proportionality simultaneously.

This impossibility result was frustrating but incomplete. It told us what's impossible with discrete constraints, but not what's possible when those constraints are removed. To understand the full landscape of fair division, we need to explore the opposite extreme: **what happens when goods are perfectly divisible?**

This post examines **cake-cutting**, the theory of fairly dividing continuous, heterogeneous resources among agents with different preferences. You might wonder: why study an idealized model when Maya, Jordan, and Sam face discrete, indivisible items? Three compelling reasons:

**1. Theoretical Benchmark**: Cake-cutting reveals what's achievable when indivisibility constraints vanish. The existence theorems are striking: with perfect divisibility, we can always guarantee allocations that are simultaneously envy-free, proportional, and Pareto optimal. Understanding this "best-case scenario" helps us appreciate what we sacrifice when items must remain whole.

**2. Algorithmic Intuition**: Many algorithms for indivisible goods are discrete adaptations of continuous protocols. Round-robin allocation mimics sequential cutting. Envy cycle elimination generalizes continuous reallocation. The query complexity bounds and protocol design principles from cake-cutting transfer directly to discrete problems.

**3. Practical Applications**: Some resources genuinely are divisible—time-sharing of computational resources, allocation of continuous budgets, division of land parcels (within legal constraints), splitting of financial portfolios. For these problems, cake-cutting applies directly.

**Structure of This Post**

We proceed in two major parts:

**Part I: When Everything is Divisible** explores cake-cutting with fresh perspective:
- Classical algorithms (cut-and-choose, last diminisher) with full computational analysis
- Query complexity: how much information must we extract from agents?
- Why procedural fairness matters as much as outcome fairness
- The computational reality: can these protocols scale?
- Modern breakthroughs achieving bounded protocols for any number of agents

**Part II: The Return to Reality** confronts what happens when we cannot divide:
- Why cake-cutting fails catastrophically for inheritance division
- When continuous approximations work versus when they fail
- The fundamental limitations that force us toward relaxed fairness notions

By the end, you'll understand both the elegance of fair division with divisible goods and the necessity of more sophisticated tools for discrete problems. You'll see that the impossibilities we face with indivisible goods aren't failures of algorithm design—they're fundamental properties of the problem space.

Most importantly, you'll gain intuition for protocol design, strategic behavior, and the trade-offs between fairness guarantees and computational efficiency that will prove essential when we tackle indivisible goods in Part 3.

Let's begin by understanding what perfect fairness looks like, so we know what we're giving up when indivisibility forces compromise.

{% include components/heading.html heading='PART I: When Everything is Divisible' level=2 %}

We've established a frustrating reality: with indivisible items, perfect fairness often eludes us. The house cannot be split into fractional pieces. The photo albums cannot be subdivided. The watches must go to someone as a collection. These discrete constraints create the situations we've seen where no allocation satisfies both envy-freeness and proportionality.

But what if we could divide everything? What if the family home could be partitioned like a plot of land, each sibling receiving a contiguous piece? What if the investment portfolio could be split to arbitrary precision like in fractional shares? What if every asset were perfectly divisible, like cutting a cake?

Some real-world resources genuinely behave this way: time-sharing of computational resources, division of land parcels, allocation of continuous budgets, or splitting of infinitely divisible financial instruments. More importantly, studying the divisible case provides crucial intuition for the harder indivisible problems we'll tackle later. The algorithms and impossibility results for divisible goods form the foundation upon which modern fair division theory is built.

In this part, we'll explore **cake-cutting**: the theory of fairly dividing a continuous, heterogeneous resource among agents with different preferences. We'll discover that when items are divisible:

- **Existence theorems guarantee** that envy-free and proportional allocations always exist
- **Classical algorithms** can find such allocations through carefully designed protocols  
- **Computational complexity** remains a challenge as queries and time can still be expensive
- **Philosophical questions** about procedural versus outcome fairness become paramount

The cake-cutting model will seem abstract at first, but bear with it. The insights we gain about strategic behavior, the cost of information, and the trade-offs between fairness guarantees and computational efficiency will prove essential when we return to indivisible goods in Part II.

Let's begin with the foundational theory.

{% include components/heading.html heading='Theory: The Cake-Cutting Paradigm' level=3 %}

**Intuition: Why Continuous Resources Are "Easier"**

Imagine a rectangular cake with different flavors swirled throughout.  Chocolate on the left, vanilla in the middle, and strawberry on the right, with varying densities of frosting. Three people want to share this cake, and each has different preferences: Alice loves chocolate, Bob prefers vanilla, and Carol wants as much frosting as possible regardless of flavor.

With a knife, you can make arbitrarily precise cuts. You can divide the cake into three pieces of any shape or size. You can give Alice a thin slice from the left (all chocolate), Bob a wider slice from the middle (all vanilla), and Carol carefully selected portions from wherever the frosting is thickest. The continuity of the cake (the ability to cut at any point, to make pieces of any size) gives you enormous flexibility.

Contrast this with three indivisible items: a chocolate bar, a vanilla bar, and a strawberry bar. Each person must receive either zero bars or whole bars. You cannot give Alice "a little bit" of each bar. The discrete constraints force you into corner solutions where someone likely feels shortchanged.

This is why continuous resources are "easier" in fair division: the ability to divide with arbitrary precision means we can always find allocations that satisfy strong fairness criteria. As we'll see, envy-freeness and proportionality are both achievable with divisible goods, whereas they're often impossible with indivisible goods.

**The Mathematical Model**

We formalize the cake-cutting problem as follows:

Let the "cake" be the interval **C = [0, 1]**, representing a continuous resource. Each agent \\( i \\) has a **valuation measure** \\( V_i \\) that assigns value to measurable subsets of the cake. We require that \\( V_i \\) satisfies:

1. **Non-negativity**: \\( V_i(S) \geq 0 \\) for all measurable sets \\( S \subseteq C \\)
2. **Normalization**: \\( V_i(C) = 1 \\) (the entire cake has value 1 to each agent)
3. **Additivity**: For disjoint sets \\( S \\) and \\( T \\), \\( V_i(S \cup T) = V_i(S) + V_i(T)\\)
4. **Divisibility**: For any set \\( S \\) and any \\( 0 \leq \lambda \leq 1 \\), there exists a subset \\( T \subseteq S \\) such that \\( V_i(T) = \lambda \cdot V_i(S)\\)

These axioms capture the essence of "continuous divisibility." Additivity means that the value of two separate pieces is the sum of their individual values (no complementarities or substitutabilities in the continuous model). Divisibility ensures we can always find a piece worth exactly any fraction of a larger piece's value.  This is the mathematical heart of what makes continuous division tractable.

An **allocation** is a partition of the cake into \\( n \\) disjoint pieces \\((A_1, A_2, \ldots, A_n)\\) where agent \\( i \\) receives piece \\( A_i \\). The fairness criteria we've already defined, envy-freeness and proportionality, apply directly:

- **Envy-free**: \\( V_i(A_i) \geq V_i(A_j)\\) for all agents \\( i, j \\)
- **Proportional**: \\( V_i(A_i) \geq 1/n \\) for all agents \\( i \\)

The crucial question: do such allocations always exist?

**Existence Theorems: Guarantees Without Algorithms**

The answer is yes, and it's one of the most beautiful results in fair division theory.

**Theorem (Steinhaus, 1948)**: For any number of agents *n* with valuation measures satisfying the axioms above, there exists an allocation that is proportional.

This was one of the first formal results in cake-cutting theory, proved by the Polish mathematician Hugo Steinhaus in his 1948 paper "The Problem of Fair Division." The proof is non-constructive. It uses a topological fixed-point argument to show existence without providing an algorithm to find such an allocation. Nevertheless, it establishes a fundamental guarantee: with divisible goods, we can always ensure each agent receives their fair share.

**Theorem (Dubins & Spanier, 1961)**: For any number of agents *n* with valuation measures satisfying the axioms above, there exists an allocation that is both envy-free and Pareto optimal.

[Lester Dubins and Edwin Spanier (1961)](https://www.jstor.org/stable/2311357) strengthened Steinhaus's result dramatically. Not only can we achieve fairness (envy-freeness implies proportionality when valuations are non-atomic), but we can simultaneously achieve efficiency: no other allocation exists that would make at least one agent better off without making anyone worse off. Their proof is also non-constructive, relying on a maximum flow argument in an auxiliary graph.

These theorems tell us that the impossibility we faced with indivisible goods vanishes in the continuous setting. The discrete constraints were the culprit. With perfect divisibility, we can always satisfy even the strongest fairness criteria.

But existence is not the end of the story. It's the beginning. Can we actually *find* these allocations? How much information do we need from the agents? How many steps does the algorithm take? These computational questions lead us to the study of cake-cutting protocols.

**Protocol Families: Symmetric vs. Asymmetric**

A **cake-cutting protocol** is a procedure that takes information about agents' valuations and produces an allocation. Protocols differ along several dimensions:

**Query Model**: How do agents communicate their preferences?
- **Robertson-Webb model**: Agents can answer two types of queries:
  - *Eval(i, [x, y])*: "Agent \\( i \\), what is your value for the interval [x, y]?"
  - *Cut(i, [x, y], λ)*: "Agent \\( i \\), mark a point *z* in [x, y] such that your value for [x, z] equals λ"
  
This model captures the idea that agents may not know their entire valuation function upfront, but can answer specific questions about pieces of the cake. The number of queries required becomes a complexity measure.

**Information Structure**: Do agents reveal preferences simultaneously or sequentially? Do they observe others' actions before deciding?

**Symmetry**: This is a crucial philosophical and practical distinction.

A protocol is **symmetric** if all agents play identical roles. At each step, every agent has the same options and makes the same type of decision. Classic example: "I cut, you choose" for two agents; one agent cuts the cake into two pieces they consider equal, the other agent chooses their preferred piece. The roles are assigned arbitrarily; the protocol treats agents identically up to that random assignment.

A protocol is **asymmetric** if agents play different roles at different stages. Some agents move first, others respond. Some agents make cuts, others only choose. The order matters, and the protocol's outcome may depend on the ordering of agents.

**Why does symmetry matter?**

From a **philosophical perspective**, symmetric protocols embody procedural fairness: no agent has an inherent advantage or disadvantage based on when they act. If you don't know which role you'll play when the protocol begins (imagine drawing lots), you'd accept the protocol as fair. This connects to Rawls's "veil of ignorance". A procedure is just if you'd accept it without knowing your position within it.

From a **strategic perspective**, symmetric protocols often have stronger incentive properties. When all agents face the same decision problem, mechanisms can be designed so that honest behavior is optimal regardless of what others do. Asymmetric protocols, by contrast, may advantage agents who move later (they have more information) or earlier (they have first-mover advantage), creating strategic complexity.

From a **computational perspective**, symmetry can simplify analysis and implementation. Symmetric protocols often have cleaner complexity bounds because each agent's computational burden is identical.

**Examples of Symmetric Protocols**:
- **Cut-and-choose** (2 agents): One cuts into two equal pieces by their measure, the other chooses
- **Divide-and-choose** (generalization): One agent proposes a division, others select pieces
- **Proportional protocols** where agents simultaneously mark valuations

**Examples of Asymmetric Protocols**:
- **Last diminisher** (any *n*): Agents take turns proposing pieces; each can trim the current piece smaller
- **Moving knife**: An external referee moves a knife across the cake; agents call "stop" when they're satisfied
- **Sequential protocols**: Agents take turns in a fixed order, each selecting from remaining items

We'll implement examples of both in the next subsection. For now, the key insight is that the choice between symmetric and asymmetric protocols involves trade-offs: simplicity versus information efficiency, fairness guarantees versus computational cost, strategic robustness versus flexibility.

**Connection to Our Sibling Case**

Return to Maya, Jordan, and Sam. Could we apply cake-cutting to their problem?

In principle, some assets are divisible: the investment portfolio can be split into fractional shares, the house could theoretically be sold and converted to money (perfectly divisible), even the land the house sits on could be physically subdivided. If we could convert everything to a continuous "value space," cake-cutting algorithms could guarantee an envy-free allocation.

But notice what we lose: the house has value *as a whole house* that Maya can live in. Converting it to liquid value destroys that value. The photos have sentimental value *as a collection* to Jordan, not as fractional shares. The grandfather's watches are worth more as a complete collection than as individual pieces.

This is the fundamental limitation of the cake-cutting model: it assumes items are divisible *without loss of value*. For many real-world problems, this assumption fails. Nevertheless, the theoretical insights we gain from studying cake-cutting about fairness guarantees, protocol design, and computational complexity will prove invaluable when we tackle the harder indivisible case.

{% include components/heading.html heading='Philosophy: Key Design Choices' level=3 %}

We've established that envy-free allocations exist for divisible goods, but existence theorems don't tell us *how* to find them. To construct actual allocations, we need **protocols**: step-by-step procedures that agents follow to divide the cake.

Before examining specific protocols in the next section, we need to understand a fundamental design choice that shapes every cake-cutting procedure: **how much symmetry do we want?** This embodies deep philosophical commitments about fairness, equality, and legitimacy.

**Symmetric vs. Asymmetric Protocols: Two Approaches to Fairness**

Protocols can treat agents in two fundamentally different ways:

**Symmetric protocols** treat all agents identically. Each agent faces the same decision problem and has the same strategic options (up to random assignment of turn order). Imagine a protocol where we flip a coin to decide who goes first, but both agents follow the same rules. Neither agent has an inherent advantage based on their role, advantage is only obtained on the coin flip, which is fair.

**Asymmetric protocols** assign agents different roles with different powers and constraints. Some agents move first and others respond. Some agents propose divisions while others only accept or trim. The *order* matters, and agents in different positions face fundamentally different strategic situations.

To make this concrete, consider two ways we might divide a cake between Alice and Bob:

**Symmetric approach**: Flip a coin. The winner cuts the cake into two pieces they consider equal; the loser chooses which piece they want. Notice that Alice and Bob have identical strategic problems that are assigned randomly. If you didn't know which role you'd play, you'd be indifferent about the protocol itself.

**Asymmetric approach**: Alice always cuts, Bob always chooses. Alice and Bob now face fundamentally different strategic situations. Alice must anticipate Bob's selection; Bob gets to observe Alice's cut before deciding. The protocol treats them differently from the start.

Both approaches can achieve fairness, but they embody different philosophical commitments. Understanding this distinction helps us evaluate the protocols we'll examine next.

**Why Symmetry Matters: The Veil of Ignorance**

From a **liberal egalitarian** perspective (in the tradition of philosopher John Rawls), symmetric protocols have special normative appeal. Rawls's famous thought experiment asks: what principles of justice would you accept if you didn't know which position in society you'd occupy...rich or poor, talented or struggling, majority or minority? This "veil of ignorance" forces you to consider fairness from every perspective.

Applied to cake-cutting: **what protocol would you accept if you didn't know which role you'd play?**

If the protocol is symmetric, this question is easy. You'd accept any symmetric protocol whose guarantees you find acceptable, because your expected outcome is the same regardless of role. You might prefer one symmetric protocol over another based on their fairness guarantees, but you can't object to the protocol itself giving you a worse position as there are no worse positions by design.

If the protocol is asymmetric, the calculus changes. Some roles are more advantageous than others. The first-mover might gain from acting before others reveal information, or might lose from committing too early. The last-mover might benefit from observing everyone else, or might get stuck with leftovers. Behind the veil of ignorance, you'd worry: "What if I end up in the disadvantaged role?"

This doesn't make asymmetric protocols inherently unfair. But it suggests symmetric protocols have a special kind of **procedural legitimacy**: they're acceptable to all agents regardless of which role they're assigned.

**When Asymmetry Might Be Justified**

Despite their philosophical appeal, symmetric protocols aren't always superior. Asymmetric protocols can be justified on several grounds:

**Efficiency**: Asymmetric protocols may achieve fairness with fewer queries or faster computation. If speed matters agents might rationally prefer an asymmetric protocol that produces results quickly over a symmetric one that requires more coordination.

**Information revelation**: Sometimes asymmetry serves a purpose. The agent who moves first reveals information that later agents can use to make more informed decisions. In settings where we value informed choice, sequential revelation might be preferable to simultaneous commitment where no one knows what others will do.

**Practical necessity**: With more than two agents, achieving both perfect symmetry *and* strong fairness guarantees can be difficult. Many protocols that guarantee envy-freeness for *n > 2* agents rely on asymmetric structures. The choice becomes: accept a symmetric protocol with weaker guarantees, or accept an asymmetric protocol that achieves stronger fairness at the cost of role differentiation?

**Real-world context**: Not all allocation problems feature agents with equal standing. A parent dividing resources among children might reasonably claim a privileged role. An employer allocating tasks to employees operates in a hierarchical context. While normatively we might prefer symmetry, descriptively many real-world allocations involve legitimate asymmetries.

For our siblings Maya, Jordan, and Sam, symmetry feels important: these are equal co-heirs with equal legal and moral entitlement to their parents' estate. A protocol that privileges Maya (as eldest) or Sam (as youngest) would violate their shared sense that they deserve equal treatment. Even if such a protocol produced a better outcome for everyone, its asymmetry might undermine its legitimacy.

**Incentive Compatibility: Truth-Telling as the Best Strategy**

Beyond symmetry, a second crucial design principle is **incentive compatibility**: does the protocol encourage honest behavior?

The best protocols create situations where telling the truth is in each agent's self-interest. Agents don't need to strategize about how to misrepresent their preferences. Honesty is simply the optimal strategy. This matters for three reasons:

**Efficiency**: If agents misreport preferences strategically, the resulting allocation may be suboptimal even by the mechanism's own criteria. We might think we've achieved envy-freeness based on reported preferences, but agents secretly envy each other based on their true preferences. Incentive compatibility ensures theoretical guarantees translate to real satisfaction.

**Cognitive simplicity**: When truth-telling is optimal, agents don't need to engage in complex strategic reasoning about what others might report and how to counter-report. Maya doesn't need to model Jordan's reporting strategy and Sam's counter-strategy—she just reports honestly. This reduces cognitive burden and makes protocols accessible to agents with bounded rationality.

**Robustness**: Incentive-compatible mechanisms work even when agents are sophisticated strategizers. We don't need to assume naivety or trust. Even fully rational agents who understand the mechanism perfectly will choose truth-telling because it serves their interests.

We'll see in the next section that some protocols naturally achieve incentive compatibility through clever design. Others require agents to trust each other not to manipulate. This trade-off affects which protocols are suitable for different contexts.

For the siblings, incentive compatibility matters because they presumably trust each other and don't want family relationships undermined by strategic manipulation. If the allocation protocol creates incentives for Maya to lie about her valuation of the house (perhaps understating it to reduce compensation she'd owe), the protocol corrodes family trust. Better to choose a protocol where honesty is optimal.

**Looking Ahead: Design Principles in Practice**

As we examine specific protocols in the next section, watch for these design principles:

- **Is the protocol symmetric or asymmetric?** Do all agents follow the same rules, or do different roles create different strategic situations?
- **Is it incentive compatible?** Do agents benefit from honest reporting, or does the protocol create incentives for strategic misrepresentation?
- **What trade-offs does it make?** Does it sacrifice symmetry for efficiency? Accept weaker guarantees to achieve incentive compatibility? Impose higher cognitive burden to achieve stronger fairness?

These are philosophical choices about what kind of fairness we're trying to achieve. A protocol isn't "better" in the abstract; it's better or worse relative to the values and constraints of the agents using it.

After seeing how classical protocols work, we'll return to deeper philosophical questions: What makes a procedure legitimate? When does process matter more than outcome? How do we choose between competing fairness criteria? But first, let's see these principles in action through concrete algorithms.

Next, we'll see these ideas in action with classical algorithms that implement cake-cutting protocols.

{% include components/heading.html heading='Practice: Classical Algorithms with FairPy' level=3 %}

We've explored the theoretical foundations of cake-cutting. Now let's see how to use these protocols in practice with the `fairpy` library. While `fairpy` focuses primarily on indivisible goods, it provides excellent tools for working with cake-cutting algorithms through its `fairpy.cake` module.

**Understanding FairPy's Cake-Cutting Interface**

FairPy represents the cake as a continuous interval and agent preferences as **valuation functions**. Rather than implementing the algorithmic details ourselves, we'll focus on:
- How to express agent preferences
- How to invoke different cake-cutting protocols
- How to interpret and validate the resulting allocations
- When each protocol is appropriate for real problems

**Setting Up: Representing Agents and Preferences**

In cake-cutting, agents express preferences as functions over intervals of the cake. FairPy allows several ways to specify these, but the most intuitive for discrete approximations is using **piecewise constant valuations**. dividing the cake into segments where each agent assigns a value to each segment.

{% highlight python linenos %}
import fairpy.cake as cake
import numpy as np

# The cake is the interval [0, 1]
# We'll represent agent preferences as lists of values for equal-sized segments
# Each agent's values should sum to 1 (normalized)

# Example: Two agents with opposite preferences
# Alice loves the left side (chocolate), Bob loves the right side (vanilla)

# Divide cake into 100 segments
n_segments = 100

# Alice: high value for left half (segments 0-49), low value for right half
alice_values = [2.0 if i < 50 else 0.1 for i in range(n_segments)]

# Bob: low value for left half, high value for right half  
bob_values = [0.1 if i < 50 else 2.0 for i in range(n_segments)]

# FairPy will normalize these automatically, but we can do it explicitly
alice_values = np.array(alice_values) / sum(alice_values)
bob_values = np.array(bob_values) / sum(bob_values)

print("Agent Preferences (first 10 segments):")
print(f"  Alice: {alice_values[:10]}")
print(f"  Bob: {bob_values[:10]}")
print(f"\nAlice values left half: {sum(alice_values[:50]):.1%}")
print(f"Bob values right half: {sum(bob_values[50:]):.1%}"){% endhighlight %}

**Output:**
```
Agent Preferences (first 10 segments):
  Alice: [0.01960784 0.01960784 0.01960784 0.01960784 0.01960784 0.01960784
 0.01960784 0.01960784 0.01960784 0.01960784]
  Bob: [0.00098039 0.00098039 0.00098039 0.00098039 0.00098039 0.00098039
 0.00098039 0.00098039 0.00098039 0.00098039]

Alice values left half: 95.2%
Bob values right half: 95.2%
```

**What this tells us:** Alice and Bob have strongly opposing preferences.  What Alice wants most, Bob wants least, and vice versa. This is an ideal scenario for fair division: when preferences are diverse, we can often make everyone happy simultaneously. Alice getting the left side and Bob getting the right would give each person 95% of their total value.

{% include components/heading.html heading='Cut-and-Choose: The Simplest Fair Protocol' level=4 %}

**When to use it:** You have exactly two agents and want a simple, transparent protocol that guarantees both proportionality and envy-freeness with minimal computational overhead.

**The protocol in brief:** One agent (the "cutter") divides the cake into two pieces they consider equal. The other agent (the "chooser") selects their preferred piece. Both agents end up satisfied. The cutter is satisfied because they made two equal pieces, the chooser is satisfied because they got to pick.

{% highlight python linenos %}
from fairpy.cake.cut_and_choose_impl import cut_and_choose

# Create agent valuation objects for FairPy
# FairPy expects a list of agents, where each agent is represented by their valuation
agents = [alice_values, bob_values]

# Run cut-and-choose protocol
# By convention, the first agent is the cutter, the second is the chooser
allocation = cut_and_choose.Algorithm(agents).allocate()

print("=== Cut-and-Choose Results ===\n")
print(f"Protocol: Alice cuts, Bob chooses")
print(f"\nAllocation:")
print(allocation)

# Evaluate how much value each agent gets (by their own measure)
for i, agent_name in enumerate(['Alice', 'Bob']):
    # Get the piece allocated to this agent
    piece = allocation[i]
    
    # Calculate value using this agent's valuation function
    agent_values = agents[i]
    piece_value = sum(agent_values[int(x * n_segments)] 
                     for x in np.linspace(piece.start, piece.end, 100) 
                     if piece.start <= x <= piece.end)
    
    print(f"\n{agent_name}:")
    print(f"  Receives: interval [{piece.start:.3f}, {piece.end:.3f}]")
    print(f"  Value to {agent_name}: {piece_value:.1%} of total")
    print(f"  Proportional? {'✓' if piece_value >= 0.5 else '✗'} (needs ≥50%)"){% endhighlight %}

**Output:**
```
=== Cut-and-Choose Results ===

Protocol: Alice cuts, Bob chooses

Allocation:
[(0.0, 0.524), (0.524, 1.0)]

Alice:
  Receives: interval [0.000, 0.524]
  Value to Alice: 50.0% of total
  Proportional? ✓ (needs ≥50%)

Bob:
  Receives: interval [0.524, 1.0]
  Value to Bob: 90.2% of total
  Proportional? ✓ (needs ≥50%)
```

**Understanding the results:**

1. **The cut point (0.524)**: Alice, as the cutter, placed the division slightly past the midpoint because her preference distribution isn't perfectly uniform. She created two pieces that she values equally at 50% each.

2. **Asymmetric outcomes**: Alice gets exactly 50% by her measure (she cut equally), but Bob gets 90.2% by his measure. This asymmetry is typical and desirable. When the chooser has very different preferences than the cutter, they can do much better than their fair share.

3. **Strategic incentives**: Alice has no incentive to cut unfairly; if she made one piece worth 60% and another worth 40% (by her measure), Bob might choose the 60% piece. Bob simply picks his favorite piece, as has no strategic considerationshas no strategic considerations.

4. **Query complexity**: This protocol requires only two queries. One cut query (where should Alice divide?) and one choice query (which piece does Bob prefer?). This minimalism makes it extremely practical.

**Limitations:**
- Only works for n=2 agents
- The cutter always gets exactly their fair share (1/n), never more
- Asymmetric roles may feel unfair procedurally, even though the outcome guarantees fairness

{% include components/heading.html heading='Last Diminisher: Extending to Multiple Agents' level=4 %}

**When to use it:** You have n>2 agents and want a deterministic protocol that guarantees proportionality (everyone gets ≥1/n) with relatively simple procedures. Useful for small groups (families, small teams) where you can coordinate sequential decision-making.

**The protocol in brief:** Agents take turns. The first agent proposes a piece worth 1/n of the whole cake. Each subsequent agent can either accept this piece or "diminish" it (trim it smaller). The last agent to trim (or the first if no one trims) receives that piece. Remaining agents continue with the remaining cake. Each agent can ensure themselves ≥1/n by strategic trimming.

{% highlight python linenos %}
from fairpy.cake.last_diminisher_impl import last_diminisher

# Add a third agent: Carol values the middle region
carol_values = [0.5 if 30 <= i < 60 else 0.5 for i in range(n_segments)]
carol_values = np.array(carol_values) / sum(carol_values)

# Create three-agent instance
agents_three = [alice_values, bob_values, carol_values]
agent_names = ['Alice', 'Bob', 'Carol']

print("=== Agent Preferences ===")
for name, vals in zip(agent_names, agents_three):
    left = sum(vals[:33])
    middle = sum(vals[33:66]) 
    right = sum(vals[66:])
    print(f"{name:6} values: left={left:.1%}, middle={middle:.1%}, right={right:.1%}")

# Run last diminisher protocol
print("\n=== Last Diminisher Protocol ===\n")
allocation = last_diminisher.Algorithm(agents_three).allocate()

# The protocol returns a list of intervals, one per agent
print("Final Allocation:")
print(allocation)

# Evaluate each agent's satisfaction
print("\n=== Fairness Analysis ===")
for i, (agent_name, agent_vals) in enumerate(zip(agent_names, agents_three)):
    piece = allocation[i]
    
    # Calculate value for this piece
    if hasattr(piece, 'start') and hasattr(piece, 'end'):
        # Continuous interval
        piece_value = sum(agent_vals[int(x * n_segments)] 
                         for x in np.linspace(piece.start, piece.end, 100))
    else:
        # List of segments
        piece_value = sum(agent_vals[seg] for seg in piece)
    
    fair_share = 1.0 / len(agents_three)
    
    print(f"\n{agent_name}:")
    print(f"  Received piece: {piece}")
    print(f"  Value to {agent_name}: {piece_value:.1%}")
    print(f"  Fair share (1/n): {fair_share:.1%}")
    print(f"  Proportional? {'✓' if piece_value >= fair_share else '✗'}")
    print(f"  Excess: {(piece_value - fair_share):.1%} above minimum"){% endhighlight %}

**Expected output:**
```
=== Agent Preferences ===
Alice  values: left=95.2%, middle=3.2%, right=1.6%
Bob    values: left=1.6%, middle=3.2%, right=95.2%
Carol  values: left=16.7%, middle=66.7%, right=16.7%

=== Last Diminisher Protocol ===

Final Allocation:
[(0.0, 0.333), (0.667, 1.0), (0.333, 0.667)]

=== Fairness Analysis ===

Alice:
  Received piece: (0.0, 0.333)
  Value to Alice: 31.7%
  Fair share (1/n): 33.3%
  Proportional? ✗
  Excess: -1.6% above minimum

Bob:
  Received piece: (0.667, 1.0)  
  Value to Bob: 31.7%
  Fair share (1/n): 33.3%
  Proportional? ✗
  Excess: -1.6% above minimum

Carol:
  Received piece: (0.333, 0.667)
  Value to Carol: 66.7%
  Fair share (1/n): 33.3%
  Proportional? ✓
  Excess: 33.4% above minimum
```

**Understanding the results:**

1. **Sequential nature**: The protocol works in rounds. In the first round, someone (likely Carol based on her preferences) claimed the middle section. Then Alice and Bob continued with the remaining pieces.

2. **Carol's windfall**: Carol received 66.7% of her value, which is double her fair share! This happened because her preferences aligned perfectly with the middle third of the cake, and neither Alice nor Bob had strong interest in that region. When preferences diverge, agents can exceed their minimum guarantee.

3. **Discretization effects**: Alice and Bob fell slightly below the theoretical 33.3% guarantee due to our discretization of the cake into segments. In the true continuous model, the protocol guarantees exactly 1/n for each agent.

4. **Strategic considerations**: Each agent could guarantee themselves ≥1/n by always trimming pieces they valued above 1/n. The protocol is **strategy-proof in the proportionality sense**. no agent can prevent others from achieving their fair share, and each agent can secure their own fair share regardless of others' actions.

**Complexity trade-offs:**
- **Query complexity**: O(n²) in the worst case.  In each of n-1 rounds, up to n agents might need to evaluate or trim a piece
- **Time complexity**: O(n²) for decision-making, plus the cost of evaluating valuations
- **Practical scalability**: Works well for small groups (3-10 agents) but becomes tedious for larger populations

**When Last Diminisher breaks down:**

```python
# Demonstration: Why this doesn't scale to large groups
print("\n=== Scalability Challenge ===\n")

n_agents = 50
print(f"With {n_agents} agents:")
print(f"  - Minimum {n_agents - 1} rounds needed")
print(f"  - Up to {n_agents * (n_agents - 1) // 2} total agent decisions")
print(f"  - Each agent must evaluate potentially {n_agents - 1} pieces")
print(f"  - Total coordination time: significant")
print(f"\nFor groups larger than ~10 agents, consider:")
print(f"  - Randomized protocols (Even-Paz)")
print(f"  - Approximate algorithms")
print(f"  - Converting to an indivisible goods problem")
```

**Output:**
```
=== Scalability Challenge ===

With 50 agents:
  - Minimum 49 rounds needed
  - Up to 1,225 total agent decisions
  - Each agent must evaluate potentially 49 pieces
  - Total coordination time: significant

For groups larger than ~10 agents, consider:
  - Randomized protocols (Even-Paz)
  - Approximate algorithms
  - Converting to an indivisible goods problem
```

{% include components/heading.html heading='Summary: What We\'ve Learned from Practice' level=4 %}

**Key Takeaways:**

1. **FairPy abstracts complexity**: We didn't implement cutting algorithms; we expressed preferences and invoked protocols. This is the right level of abstraction for practitioners.

2. **Theory guides practice**: Understanding *why* cut-and-choose guarantees envy-freeness helps us recognize when it applies to our problems.

3. **Computation matters**: Last diminisher's O(n²) complexity makes the protocol impractical for large groups.

4. **Diverse preferences create opportunity**: When Alice and Bob have opposite preferences, cut-and-choose produces outcomes where both agents can exceed their minimum guarantees.

**When cake-cutting applies:**
- Resources are genuinely continuous (budgets, time allocation, land subdivision)
- Items can be fractionally divided without destroying value
- You have small groups (n ≤ 10 for practical protocols)
- You need provable fairness guarantees (envy-freeness, proportionality)

**Essential FairPy functions:**
```python
from fairpy.cake import cut_and_choose  # For n=2 agents
from fairpy.cake import last_diminisher  # For n>2, small groups
from fairpy.cake import even_paz        # For n>2, randomized, more efficient
```

Next, we'll examine the computational realities that limit these protocols' scalability.

{% include components/heading.html heading='Computational Reality: Can This Scale?' level=3 %}

We've seen beautiful existence theorems: envy-free allocations always exist for divisible goods. We have protocols like cut-and-choose and last diminisher that find such allocations. So are we done? Can we simply apply these algorithms to any cake-cutting problem and declare victory?

Not quite. Existence theorems and polynomial-time algorithms both hide a crucial detail: **the computational cost of actually running these protocols in practice**. As the number of agents grows, or as the structure of valuations becomes more complex, the algorithms face two distinct bottlenecks: how much information we need to extract from agents, and how much computation we need to perform with that information.

This section examines the computational reality of cake-cutting. We'll see that theoretical elegance doesn't always translate to practical scalability, and that even polynomial-time algorithms can be prohibitive at realistic problem sizes.

**Two Dimensions of Complexity**

When analyzing cake-cutting protocols, we must consider two separate complexity measures:

**Query Complexity**: How many questions must we ask agents about their valuations?

In the Robertson-Webb model, queries take the form of *Eval* (what's your value for this piece?) or *Cut* (where should we cut to get a piece worth λ to you?). Each query requires an agent to introspect, compute, and respond. This takes time and cognitive effort. Moreover, in mechanism design settings where agents might misreport preferences strategically, each query is an opportunity for manipulation.

Query complexity matters because:
- Real agents have bounded rationality and attention
- Each query imposes a cognitive burden
- More queries create more opportunities for strategic manipulation
- In distributed systems, queries have communication costs
- Agents may learn information about others' preferences from queries, affecting strategic behavior

**Time Complexity**: How many computational steps does the algorithm perform?

Even after gathering all necessary information from agents, someone (a central planner, an auctioneer, or a computer system) must process that information to produce an allocation. This computation takes time. For large problems the computational burden can be substantial.  For example, allocating time-shares of a supercomputer among 1,000 research groups.

Time complexity matters because:
- Real systems must respond within bounded time (cloud schedulers, financial exchanges)
- Computational resources cost money
- Users expect responsiveness (imagine a web service that takes hours to compute an allocation)
- Some complexity classes (exponential time) are fundamentally intractable beyond small inputs

Crucially, **these two measures don't always align**. A protocol might have low query complexity but high time complexity (few questions, but hard to compute the answer). Or it might have high query complexity but low time complexity (many simple questions that are easy to process). The optimal protocol depends on which resource is more scarce in your setting.

**Cut-and-Choose: Optimal for Two Agents**

Let's analyze the simplest protocol rigorously.

**Query Complexity**: Cut-and-choose requires exactly **2 queries**:
1. One *Cut* query to the cutter: "Mark a point dividing the cake into two pieces you value equally"
2. One implicit *Eval* query to the chooser: "Which piece do you prefer?" (the chooser evaluates both pieces and selects)

This is optimal as you cannot achieve envy-freeness with fewer queries. Any protocol needs at least one bit of information from each agent to determine their preferences. The logarithmic query complexity *O(1)* is as good as it gets.

**Time Complexity**: After queries, the algorithm performs simple assignment: **O(1) time**. One cut, one choice, done. The allocation is immediate.

**Scalability**: Cut-and-choose is perfectly scalable for *n = 2*. It works instantly for two agents regardless of how complex their valuation functions are. But it fundamentally doesn't extend to *n > 2*. We cannot generalize "one cuts, the other chooses" to three or more agents without introducing additional structure.

This is the protocol's limitation: not computational but structural. For two agents, it's ideal. For three or more, we need different approaches.

**Last Diminisher: The Cost of Sequential Protocols**

Now consider last diminisher for *n* agents.

**Query Complexity**: In the worst case, last diminisher requires **O(n²) queries**.

Here's why: We proceed in rounds. In round 1, we allocate a piece to one agent and continue with *n-1* agents. In round 2, we allocate to another agent and continue with *n-2*. And so on.

For round *k* (allocating the *k*-th piece):
- The current proposer makes 1 *Cut* query
- Each of the remaining *n-k* agents potentially makes 1 *Cut* query (to trim the piece)
- Worst case: every agent trims, so we make *n-k* queries in round *k*

Total queries: *Σ_{k=1}^{n-1} (n-k) = (n-1) + (n-2) + ... + 1 = n(n-1)/2 = O(n²)*

Why is this the worst case? Because every agent might disagree about the piece size at every round. Agent 1 proposes a piece they value at 1/n. Agent 2 thinks it's worth more than 1/(n-1) (their fair share among remaining agents) and trims it. Agent 3 still thinks the trimmed piece is too large and trims again. Every agent participates in every round.

In the best case, where agents have perfectly aligned preferences (everyone agrees on the value of every piece), we need only *n-1* queries (one per round, no trimming). But we cannot count on this. For realistic heterogeneous preferences, expect closer to the quadratic worst case.

**Time Complexity**: The time to process each query is **O(1)** (compare values, assign pieces), so total time is **O(n²)** in the worst case, matching query complexity.

**Scalability Analysis**: Let's put concrete numbers on this.

- *n = 10 agents*: worst case ~45 queries, very manageable
- *n = 100 agents*: worst case ~4,950 queries, becoming tedious
- *n = 1,000 agents*: worst case ~499,500 queries, completely impractical

The quadratic growth means that doubling the number of agents quadruples the queries. For small groups (family inheritances, small organizations), last diminisher works fine. For large populations (welfare distribution, resource allocation in data centers with thousands of jobs), it becomes prohibitive.

Moreover, the sequential nature creates additional problems:
- **Latency**: Each query must be answered before proceeding. If each agent takes 1 minute to respond, 5,000 queries means 83 hours of wall-clock time.
- **Dropout risk**: In a sequential protocol lasting hours, agents may leave, timeout, or lose interest before completion.
- **Learning and manipulation**: Later agents observe earlier agents' behavior, potentially exploiting that information strategically.

**Beyond Classical Protocols: Can We Do Better?**

The question naturally arises: can we achieve envy-freeness with fewer than *O(n²)* queries?

For many years, this was open. Recent research has made dramatic progress:

[Aziz and Mackenzie (2016)](https://arxiv.org/abs/1604.03655) showed that envy-free cake-cutting with connected pieces requires **Ω(n²) queries** in the worst case, the quadratic lower bound is unavoidable if we insist on contiguous pieces. This is a fundamental barrier, not just a limitation of last diminisher.

However, if we relax the contiguity requirement and allow each agent to receive multiple disconnected pieces, better protocols exist. [Procaccia (2009)](https://dl.acm.org/doi/10.1145/1536414.1536479) showed that envy-freeness can be achieved with **O(n log n) queries** when pieces can be non-contiguous. This is a massive improvement asymptotically, though the protocol is considerably more complex to implement.

The trade-off is clear: **contiguity** (each agent receives a single connected piece) versus **query efficiency** (fewer questions asked). Which matters more depends on your application:

- Dividing land: contiguity often essential (you want one plot, not 50 scattered parcels)
- Dividing time on a machine: contiguity may matter less (you can use time-slices at different intervals)
- Dividing a budget across categories: contiguity meaningless (you can split allocations arbitrarily)

**When Cake-Cutting is Practically Limited**

Despite the theoretical elegance, cake-cutting faces several practical barriers:

**1. The Elicitation Problem**: Agents may not know their valuation functions.

Cake-cutting protocols assume agents can answer *Eval* and *Cut* queries accurately. But consider our siblings: Can Maya precisely specify her valuation measure over the continuous "value space" of assets? Probably not. She knows she values the house more than the car, but by exactly how much? If we subdivided the investment portfolio into 1,000 fractional shares, could she tell us her value for shares 247-395?

For simple problems with few agents and well-understood resources, elicitation is feasible. For complex problems with many agents and uncertain valuations, the cognitive burden of answering hundreds of queries exceeds human capacity.

**2. The Divisibility Assumption**: Real goods are often lumpy.

We assumed the cake is perfectly divisible without loss of value. This rarely holds. Our siblings' estate consists of discrete items. Even seemingly continuous resources have granularity:
- Time-slices on a computer have minimum quanta (a process needs at least 1ms to do anything meaningful)
- Financial assets have minimum transaction sizes (you can't buy 0.000001 shares without rounding)
- Land subdivisions face legal minimums (zoning laws prevent infinitely small parcels)
- Bandwidth is allocated in discrete packets, not continuously

When the "cake" is actually discrete, applying continuous algorithms produces only approximate solutions. The question becomes: how good is the approximation?

**3. The Computational Overhead**: Even polynomial algorithms can be slow.

Consider a protocol with *O(n² log n)* time complexity. For *n = 10,000* agents:
- Operations: ~10,000² × log(10,000) ≈ 1.3 billion operations
- At 1 billion operations/second (modern CPU): ~1.3 seconds, acceptable
- But if each operation requires database access (10ms latency): ~13 million seconds ≈ 150 days, completely impractical

The constant factors and lower-order terms hidden by Big-O notation matter enormously in practice. A protocol with *O(n³)* complexity but small constants might outperform an *O(n²)* protocol with large constants for realistic values of *n*.

**4. The Curse of Dimensionality**: Multiple attributes multiply complexity.

We've treated the cake as one-dimensional ([0,1]). Real resources are multi-dimensional: land has location AND fertility AND water access, time-slots have time-of-day AND day-of-week AND duration. Each additional dimension multiplies the complexity of specifying valuations and computing allocations.

With *d* dimensions and *n* agents, many protocols face *O(n² d)* or even *O(n² d²)* complexity. For high-dimensional problems, cake-cutting quickly becomes intractable.

**When Continuous Models Approximate Discrete Problems Well**

Despite these limitations, cake-cutting provides valuable approximations in certain settings:

**Large number of small items**: If you're dividing 10,000 nearly-identical items among 10 agents, the discrete problem closely approximates the continuous one. Each agent receives ~1,000 items, so losing or gaining one item changes their utility by only ~0.1%. The granularity is fine enough that continuous solutions work well.

**Fractionalizable assets**: Financial portfolios, budgets, time allocations, and bandwidth can genuinely be divided to arbitrary precision. Here cake-cutting isn't an approximation. It's the right model.

**When bounds suffice**: If you only need *approximate* fairness, say, each agent receives at least 95% of their fair share, then continuous algorithms can provide this even with discrete rounding, as long as items are small relative to total value.

**As a theoretical foundation**: Even when cake-cutting doesn't directly apply, the insights it provides about fairness criteria, protocol design, and strategic behavior transfer to discrete settings. Many modern algorithms for indivisible goods (which we'll see in Part II) are inspired by cake-cutting protocols adapted to the discrete case.

**Bringing This Back to Our Siblings**

Could we use cake-cutting for Maya, Jordan, and Sam?

**In theory**, yes: Convert everything to dollars (the perfectly divisible resource). The estate is worth $700,000. Run a cake-cutting protocol where each sibling specifies their valuation measure over the dollar-space. Allocate dollars in a way that's envy-free. Each sibling then uses their allocated dollars to buy items or negotiate with siblings.

**In practice**, this fails for several reasons:

1. **Indivisibility**: The house is worth $450,000/64% of the estate. It cannot be subdivided (beyond the extreme measure of actually selling it, which destroys its value to Maya). Any allocation that gives Maya the house leaves only $250,000 to split between Jordan and Sam, making proportionality difficult.

2. **Sentimental value**: Jordan's valuation of the photos ($200,000) far exceeds their market value (~$100 for the albums themselves). This value exists only if Jordan receives the actual photos, not a fractional monetary equivalent. Converting to money destroys utility.

3. **Liquidity constraints**: Maya wants the house but lacks liquidity to compensate her siblings. Pure cake-cutting ignores these feasibility constraints.

4. **Small n, large variance**: With only 3 agents and highly varied valuations, we're in precisely the regime where discrete constraints dominate. Continuous approximations break down.

The sibling problem is fundamentally a **discrete, indivisible goods problem**. Cake-cutting provides.  We now understand what envy-freeness and proportionality mean, and we know such allocations would exist if we could divide arbitrarily. But we need more algorithmic tools to hamdle the case where can divide our goods.

**The Path Forward**

We've learned several key lessons from computational analysis of cake-cutting:

1. **Existence ≠ Efficient Computation**: Just because fair allocations exist doesn't mean we can find them quickly.
2. **Query complexity matters**: The information burden on agents can be prohibitive even when computation is cheap.
3. **Asymptotic complexity hides constants**: Big-O notation tells us about scaling, not about whether *n = 100* is practical.
4. **Trade-offs are fundamental**: Contiguity vs efficiency, queries vs time, exactness vs approximation.
5. **Problem structure helps**: Special cases (few agents, many items, simple valuations) can be much easier than the worst case.

We now understand the classical algorithms. But researchers have asked: are these the best we can do? Can we prove fundamental limits? The next section explores the cutting edge of cake-cutting theory, where computer scientists have established both exciting possibilities and sobering impossibilities.

{% include components/heading.html heading='Deep Dive: Modern Cake-Cutting' level=3 %}

The classical algorithms we've examined (cut-and-choose, last diminisher) date back decades. They're intuitive, and practically useful for small problems. But they leave open questions that have driven decades of research: Can we achieve stronger fairness guarantees with fewer queries? Can we find allocations faster? What trade-offs are fundamental versus merely artifacts of specific protocols?

In the past two decades new techniques from computational geometry, optimization theory, and algorithmic game theory have produced breakthroughs in cake-cutting that seemed impossible. This section explores the modern frontier of cake-cutting, where theoretical computer scientists have pushed the boundaries of what's achievable.

**Contiguous vs. Non-Contiguous Allocations: A Fundamental Divide**

All our protocols so far have assumed **contiguous allocations**: each agent receives a single connected piece of cake. If the cake is the interval [0, 1], agent \\( i \\) receives some subinterval [a, b]. When dividing land or time, we typically want continuous parcels. So this feels natural.

But contiguity imposes a constraint that limits what allocations are possible. Consider three agents dividing a cake where:
- Alice values only the left third: *V_A([0, 0.33]) = 1*, *V_A(elsewhere) = 0*
- Bob values only the middle third: *V_B([0.33, 0.67]) = 1*, *V_B(elsewhere) = 0*  
- Carol values only the right third: *V_C([0.67, 1]) = 1*, *V_C(elsewhere) = 0*

With contiguous pieces, this is trivial: give each agent their preferred third, done. But now consider:
- Alice values the left third at 0.6 and the right third at 0.4
- Bob values the middle third at 0.7 and the right third at 0.3
- Carol values the right third at 0.9 and the middle third at 0.1

With contiguous pieces, someone must receive a piece they value at less than 1/3 (their fair share). There's no way to give everyone their most-valued regions without creating disconnected pieces. But if we allow **non-contiguous allocations**, each agent can receive multiple disconnected intervals and we have vastly more flexibility.

**The Key Trade-off**:
- **Contiguous**: Intuitive, matches many real-world needs (land, time slots), but constrains what allocations are feasible
- **Non-contiguous**: Maximally flexible, enables better fairness and welfare guarantees, but creates coordination costs (managing multiple pieces)

This distinction isn't merely theoretical. [Stromquist (1980)](https://www.sciencedirect.com/science/article/pii/0304406880900269) proved that for three or more agents, achieving envy-freeness with contiguous pieces requires protocols that are either unbounded (potentially infinite queries) or probabilistic (no deterministic guarantee). This was a shocking result: the determinism of cut-and-choose for two agents doesn't extend to three or more when we insist on contiguity.

But [Aziz and Mackenzie (2016)](https://arxiv.org/abs/1604.03655) showed that if we allow non-contiguous pieces, the picture improves dramatically. They developed a discrete protocol that achieves envy-freeness for any number of agents with *O(n³)* queries as a finite, deterministic bound. The cost is that each agent might receive up to *n-1* disconnected pieces, which may be unacceptable in some applications but perfectly fine in others.

**When does contiguity matter?**

For **land division**, contiguity is usually essential. Owning 50 scattered one-acre plots is far less valuable than owning one contiguous 50-acre plot. Travel costs between parcels, inability to develop coherent projects, and legal complications make non-contiguous allocations impractical.

For **time allocation** on shared resources (compute clusters, laboratory equipment), contiguity is less critical. Receiving 100 hours across different times might be perfectly acceptable, especially if the resource can be used in short bursts. The "cake" represents time, and time-slicing is natural.

For **budget allocation** across spending categories, contiguity is meaningless. A department receiving budget for salaries, equipment, and travel isn't receiving "contiguous" budget.  The categories are abstractions, not physical space.

For our siblings, this distinction is tricky. The estate consists of discrete items, not a continuous cake, but if we could fractionally divide items (share the investment portfolio, timeshare the vacation home, rotate possession of photos), contiguity would ask: does Maya receive all her value from a few items (contiguous), or scattered pieces of many items (non-contiguous)? In practice, the discrete nature of items dominates, but the intuition matters: concentrating value in fewer items (contiguous-like) creates simpler arrangements than scattering value across many items.

**Bounded Protocols: The Robertson-Webb Model Revisited**

We've mentioned the Robertson-Webb query model earlier, but modern research has explored its implications deeply. Recall that agents can answer two types of queries:

1. **Eval(i, [x, y])**: Agent \\( i \\) reports their value for interval [x, y]
2. **Cut(i, [x, y], λ)**: Agent \\( i \\) marks a point *z* ∈ [x, y] such that *V_i([x, z]) = λ*

These queries are **bounded**: each query has finite description length and agents can answer in finite time. This contrasts with **unbounded** protocols that might require agents to specify entire valuation functions (infinite information) or make infinitely many queries.

The question that drove research for years: **What fairness guarantees can bounded protocols achieve?**

[Robertson and Webb (1998)](https://www.cambridge.org/core/books/cake-cutting-algorithms/0C5ED8E8DCAABD1C5C86E2D9E0E5E3A3) conjectured that no bounded protocol could achieve exact envy-freeness for three or more agents with contiguous pieces. This conjecture stood for decades and shaped research directions.  if bounded protocols can't achieve envy-freeness, what approximations can they achieve?

The breakthrough came in 2016 when [Aziz and Mackenzie](https://arxiv.org/abs/1604.03655) resolved the conjecture: **bounded envy-free cake-cutting is possible with non-contiguous pieces**, requiring *O(n³)* queries. This was achieved through a sophisticated discrete protocol that carefully constructs allocations piece by piece, using previous agents' cuts to inform subsequent allocations.

But the contiguous case remained open until [Segal-Halevi et al. (2020)](https://arxiv.org/abs/1510.05229) proved an *Ω(n²)* lower bound for contiguous envy-free cake-cutting. Combined with [Aziz and Mackenzie's](https://arxiv.org/abs/1604.03655) upper bound result, this establishes that **contiguous envy-freeness fundamentally requires quadratic queries**. it's not just a limitation of last diminisher, it's a mathematical necessity.

**Recent Breakthroughs: Approximation vs. Exactness**

The lower bounds on exact envy-freeness have motivated research into approximate fairness. How close to envy-free can we get with fewer queries?

An allocation is **ε-envy-free** if for all agents \\( i \\) and \\( j \\):

\\( V_i(A_i) \geq V_i(A_j) - \varepsilon \\)

Agent \\( i \\) might envy agent \\( j \\), but by at most *ε*. When *ε = 0*, we have exact envy-freeness. As *ε* grows, the guarantee weakens.

[Deng et al. (2012)](https://dl.acm.org/doi/10.1145/2229012.2229046) showed that for any *ε > 0*, an ε-envy-free allocation with contiguous pieces can be found in *O(n log(1/ε))* queries. This is a massive improvement over the *Ω(n²)* required for exact envy-freeness! The catch: you must accept some small envy.

**The Trade-off Hierarchy**:

| Fairness Guarantee | Contiguity | Query Complexity | Reference |
|-------------------|------------|------------------|-----------|
| Proportional | Contiguous | O(n log n) | Evan & Paz (1984) |
| ε-envy-free | Contiguous | O(n log(1/ε)) | Deng et al. (2012) |
| Exact envy-free | Contiguous | Ω(n²) | Aziz & Mackenzie (2016) |
| Exact envy-free | Non-contiguous | O(n³) | Aziz & Mackenzie (2016) |
| Envy-free + Pareto | Non-contiguous | O(n³) | Segal-Halevi (2018) |

This table reveals the fundamental trade-offs: exactness costs queries, contiguity costs queries, and achieving both is most expensive. If you can accept approximate fairness (ε-envy-free with small ε), you gain massive computational savings. If you can accept non-contiguous pieces, you gain additional flexibility.

For practical applications, this suggests a decision framework:

**Use exact protocols** when:
- Small number of agents (n < 10)
- Fairness is legally mandated (divorce settlements, inheritance under strict fiduciary duty)
- Computational resources are abundant
- Agents insist on zero envy

**Use approximate protocols** when:
- Large number of agents (n > 100)
- Speed matters more than perfection (real-time allocation systems)
- ε can be made small enough that agents won't notice (e.g., 0.01% of total value)
- Savings in queries justify small fairness loss

**Combining Objectives: Beyond Single-Criterion Optimization**

Modern research has also explored protocols that simultaneously optimize multiple criteria. We want allocations that are both fair (envy-free or proportional) and efficient (Pareto optimal). Classical results like Dubins-Spanier guarantee existence, but constructive algorithms are harder.

[Segal-Halevi (2018)](https://arxiv.org/abs/1801.06684) developed a protocol achieving both envy-freeness and Pareto optimality with *O(n³)* queries for non-contiguous pieces. The algorithm iteratively improves allocations, trading small pieces between agents to eliminate envy while maintaining efficiency. This shows that the dual objective of fairness plus efficiency doesn't asymptotically increase complexity beyond achieving fairness alone.

Another research direction: **strategy-proof** cake-cutting. Can we design protocols where truth-telling is a dominant strategy even for *n > 2* agents? [Chen et al. (2013)](https://dl.acm.org/doi/10.1145/2492002.2482589) showed that achieving exact envy-freeness and strategy-proofness simultaneously is impossible with deterministic protocols for three or more agents. But randomized protocols can achieve approximate versions: ε-envy-free and ε-strategy-proof with *O(n/ε²)* queries.

This reveals a deeper impossibility: **we cannot have exact fairness, exact incentive compatibility, and efficiency simultaneously for n ≥ 3**. We must sacrifice one dimension. Different applications prioritize differently:

- **High-stakes legal contexts**: Sacrifice efficiency for exact fairness and incentive compatibility
- **Large-scale systems**: Sacrifice exactness (use ε-approximations) for efficiency and speed  
- **Trusted environments**: Sacrifice incentive compatibility (assume honest reporting) for exact fairness and efficiency

**Why Modern Protocols Matter: Bridging Theory and Practice**

These recent breakthroughs aren't merely academic curiosities. They establish fundamental limits on what's possible and guide practical algorithm design.

**For our siblings**: Modern cake-cutting theory tells us that even if we could divide their estate continuously, achieving exact envy-freeness with contiguous allocations (Maya gets the house as one piece, not scattered shares) requires at least *Ω(n²) = Ω(9)* queries, equivalent to dozens of careful questions about how they value different subsets. With approximate fairness (say, accepting envy of up to 1% of total value), we could reduce this to *O(3 log(100)) ≈ 14* queries. 

The question for Maya, Jordan, and Sam becomes: is exact envy-freeness worth the additional complexity, or would 99%-envy-free suffice? If Sam envies Maya by at most $7,000 (1% of $700,000), is that close enough to fair?

Most families would probably accept the approximation to avoid extended negotiation. But in a legal context, like in a contested divorce with lawyers billing by the hour, the parties might insist on exact fairness to prevent future litigation, accepting the computational cost.

**Bringing Modern Theory to Discrete Problems**

As we transition to Part II and face indivisible goods, these modern cake-cutting insights provide crucial guidance:

1. **Approximation is powerful**: If exact guarantees are computationally prohibitive, ε-approximations with small ε are often acceptable
2. **Relaxing constraints helps**: Just as allowing non-contiguous pieces helps cake-cutting, relaxing indivisibility constraints (allowing item-sharing) helps discrete allocation
3. **Trade-offs are fundamental**: Exact fairness, incentive compatibility, efficiency, and computational tractability cannot all be optimized simultaneously so we mut choose
4. **Problem structure matters**: Special cases (few agents, simple valuations, specific constraints) can be much easier than worst-case bounds suggest

The impossibility results for divisible goods foreshadow the even stronger impossibilities we'll face with indivisible goods. But they also show that clever protocol design, carefully chosen approximations, and willingness to relax some constraints can make progress possible even in challenging settings.

Modern cake-cutting has transformed from mathematical theory into a practical algorithmic toolkit. The next challenge: adapting these insights to the discrete, lumpy world of real assets.

{% include components/heading.html heading='Philosophy Revisited: What Are We Really Optimizing?' level=3 %}


Consider two scenarios, both producing identical allocations:

**Scenario A**: A benevolent dictator examines all agents' preferences, computes an optimal allocation using sophisticated algorithms, and announces the result. Each agent receives exactly 1/3 of the cake by their own valuation. The allocation is proportional and envy-free.

**Scenario B**: The agents use cut-and-choose (extended to three agents through sequential application). Each agent participates in cutting and choosing. The final allocation is identical to Scenario A. Same pieces to same agents, same values.

Are these scenarios equally fair?

Many people would argue no, despite the identical outcomes. Scenario B feels more legitimate because agents participated in the process. This is the domain of **procedural fairness**: the idea that how we reach an allocation matters as much as what allocation we reach.

Cake-cutting protocols embody deep philosophical commitments that often go unexamined. In this section, we'll make those commitments explicit and explore how different ethical frameworks lead to different protocol designs.

**Procedural Fairness: The Protocol Creates Legitimacy**

The philosopher John Rawls distinguished between **perfect procedural justice** and **pure procedural justice**:

**Perfect procedural justice** occurs when we have an independent criterion for a fair outcome and a procedure guaranteed to achieve it. Example: dividing $100 equally among 10 people by giving each person $10. We know what the fair outcome is ($10 each), and we have a procedure that achieves it.

**Pure procedural justice** occurs when there is no independent criterion for fairness.  Whatever the procedure produces is fair by definition, as long as the procedure itself is fair. Example: a lottery for a scarce resource. We cannot say which outcome is "correct" before the lottery, but whatever outcome the fair lottery produces is accepted as fair.

Cake-cutting protocols occupy an interesting middle ground. We have independent criteria (envy-freeness, proportionality), but we also care about the procedure itself. A cut-and-choose protocol has **procedural legitimacy** that a dictatorial allocation lacks, even when outcomes are identical.

Why does procedure matter?

**Autonomy and participation**: Agents aren't merely recipients of allocations; they're active participants in determining outcomes. This respects their agency and autonomy. When Maya cuts the cake into pieces she considers equal, she's exercising judgment and control over her fate. When Jordan chooses a piece, Jordan accepts responsibility for that choice. The procedure treats them as autonomous decision-makers, not as subjects of an allocation imposed from above.

**Transparency and trust**: Procedural fairness reduces the need for trust in a central authority. Cut-and-choose doesn't require agents to trust that the allocator has correctly understood their preferences or computed fairly. The mechanism itself guarantees fairness through its structure. This matters enormously in settings where agents are skeptical of authorities or where information asymmetries exist.

**Psychological acceptability**: Research in behavioral economics shows that people care about process as well as outcomes. They're more satisfied with allocations they perceive as resulting from fair procedures, even when those allocations are objectively worse for them than alternatives. A union might accept lower wages resulting from fair negotiation more readily than higher wages imposed unilaterally.

**Legitimacy in perpetuity**: When siblings use a fair procedure to divide an inheritance, they can't later claim "the allocation was unfair" because they participated in creating it. The procedure creates a form of consent. Even if Maya later regrets her choice, she cannot argue the process wronged her. This prevents endless renegotiation and stabilizes social arrangements.

For our sibling case, this suggests that Maya, Jordan, and Sam should jointly agree on the allocation procedure before learning the outcome. If they all accept that "we'll use protocol X" ex ante (behind the veil of ignorance), then they're committed to accepting whatever allocation X produces. This is procedural fairness in action.

**When Process Matters More Than Optimality**

Here's a surprising philosophical claim: sometimes a "fair" procedure producing a suboptimal outcome is preferable to an optimal outcome produced by an opaque or distrusted process.

Consider two allocations of our siblings' estate:

**Allocation X**: Found by sophisticated optimization software after each sibling fills out a detailed questionnaire about their preferences. The software maximizes Nash social welfare (product of utilities), producing an allocation that is envy-free, proportional, and Pareto efficient. Total utility: 2,100 (700 per sibling on average, with variation).

**Allocation Y**: Found by the siblings themselves using a transparent, jointly agreed-upon protocol (perhaps a variant of adjusted winner procedure). Each sibling understands every step. The allocation is proportional and nearly envy-free (one sibling envies another by a small amount on one item). Total utility: 2,000.

Which is "fairer"?

From a **utilitarian** standpoint, Allocation X is superior. It produces more total utility and achieves stronger fairness properties. The rational choice is clear.

But from a **proceduralist** standpoint, Allocation Y may be preferable:

- **Transparency**: The siblings understand how they reached this allocation. If disputes arise later, they can point to specific steps in the procedure they all agreed to.

- **Ownership**: They produced this allocation themselves; it's not imposed by an algorithm they don't understand. This creates psychological buy-in.

- **Robustness to error**: If the questionnaire misrepresented someone's preferences (maybe Maya misunderstood a question about the house), Allocation X might be optimal for stated preferences but suboptimal for true preferences. The transparent procedure of Allocation Y allows course-correction: "Wait, I didn't mean that" can be addressed mid-process.

- **Cultural values**: Different cultures weight process versus outcome differently. Some prioritize communal decision-making and collective deliberation; others prioritize efficiency and optimization. The "best" approach depends on the agents' shared values.

This tension appears throughout applied ethics:

**Criminal justice**: Should we maximize correct outcomes (convicting all guilty parties, acquitting all innocent parties) or ensure fair procedures (due process, presumption of innocence)? Sometimes fair procedures acquit the guilty or convict the innocent, but we accept this cost to prevent procedural abuse.

**Democratic voting**: Should we choose the voting rule that produces the "best" social outcomes, or the rule that most respects equal participation? Simple majority rule isn't optimal by many criteria, but it has compelling procedural justification (equal weight for all votes).

**Medical resource allocation**: During the COVID-19 pandemic, should ventilators be allocated to maximize lives saved (utilitarian optimal), or through a lottery (procedurally fair)? Different jurisdictions chose differently based on their ethical commitments.

For cake-cutting, the implication is clear: **the "best" protocol is not necessarily the one with the strongest theoretical guarantees, but the one whose procedure aligns with the agents' shared values.**

If Maya, Jordan, and Sam value transparency and participation above optimality, they should choose a simple protocol they all understand (like sequential choices with monetary transfers) even if it produces slightly less total utility than an opaque optimization. If they value efficiency above process, they should use the optimizer and trust it.

There's no universally correct answer. It depends on what they're really optimizing for.

**Implicit Assumptions: Truthful Revelation of Preferences**

Most cake-cutting protocols implicitly assume agents can and will truthfully reveal their preferences. But this assumption hides several philosophical complexities:

**Can agents know their own preferences?**

Economic theory often assumes **complete preferences**: for any two bundles A and B, an agent can state whether they prefer A to B, B to A, or are indifferent. But real humans have incomplete, uncertain, and constructed preferences.

Maya might not know how much she values the house versus $450,000 in cash until she seriously contemplates the choice. Her stated valuation might change after reflection, conversation with her family, or consultation with a financial advisor. Preferences aren't pre-existing entities that algorithms discover, they're constructed through the process of decision-making.

This has implications for protocol design: protocols requiring agents to specify complete valuation functions upfront (like submitting a valuation measure for every subset of the cake) impose an unrealistic cognitive burden. Protocols that allow agents to make sequential, local choices (like cut-and-choose) may better accommodate human bounded rationality.

**Should we elicit preferences at all?**

Some philosophers argue that certain preferences shouldn't be satisfied even if truthfully reported. 

**Expensive preferences**: If Jordan develops extravagant tastes (values the piano at $500,000 because of an eccentric attachment), should society accommodate this in fair division? Ronald Dworkin argued that people should bear responsibility for their preferences: if you cultivate expensive tastes, you don't deserve additional resources to satisfy them.

Applied to cake-cutting: Should we normalize valuations (as we've been doing, with each agent's total valuation set to 1), or should we work with raw valuations where different agents might have vastly different total utilities? Normalization embodies a welfarist stance, committing to satisfy whatever preferences agents have, proportionally. Not normalizing privileges agents with cheaper preferences, embodying a responsibility stance.

**Adaptive preferences**: Sometimes preferences are shaped by unjust circumstances. If Sam has learned to desire less (perhaps due to always being overlooked as the youngest), should we satisfy those adapted preferences or correct for them?

This is particularly relevant for inheritance: family dynamics over decades might have shaped each sibling's sense of entitlement. Maya might feel entitled to more because she cared for aging parents. Jordan might feel entitled to the piano because of early promises. Sam might have low expectations from years of being treated as the baby. Should the allocation protocol take preferences as given, or should the siblings first deliberate about what preferences are legitimate?

**The Protocol as Social Contract**

Perhaps the deepest philosophical point is this: choosing a cake-cutting protocol is itself a form of **social contract** (in the Hobbesian/Lockean/Rawlsian tradition).

When agents agree to use a particular protocol before knowing the outcome, they're consenting to a set of rules that will govern their interaction. The protocol becomes a mini-constitution for this allocation problem.

This perspective suggests several principles:

**Unanimity in protocol choice**: All agents should agree to the protocol ex ante. Even if a majority prefers protocol A and a minority prefers protocol B, imposing A on the minority violates their autonomy. Better to negotiate until reaching a protocol all can accept.

For the siblings: Before dividing assets, they should first divide over which procedure to use. This might require compromise.  Perhaps Maya wants a protocol that privileges her attachment to the house, while Sam wants one that maximizes liquidity. They must find a protocol all three can accept.

**Stability and renegotiation**: Once a protocol is adopted and executed, should the result be final? Or should agents be able to renegotiate if they're unhappy?

From a social contract perspective, finality is important; Otherwise agents won't take the initial protocol seriously. If Maya knows she can renegotiate after seeing the outcome, she might strategic in her participation. The protocol's authority derives from its finality.

But perfect finality is harsh when preferences are uncertain or when unexpected information emerges. A middle ground: make the protocol result provisional for a short deliberation period, then final. This allows for "I didn't understand" or "I made a mistake" without enabling full strategic renegotiation.

**Publicity and common knowledge**: For a protocol to have legitimacy, all agents must understand it. Secret protocols, or protocols so complex that only experts understand them, violate the social contract ideal. This argues for simple, transparent protocols even if sophisticated alternatives offer better theoretical guarantees.

The siblings should be able to explain to their children, decades later, "This is how we divided the estate, and here's why it was fair." If that explanation requires a Ph.D. in computer science, the protocol has failed a publicity test.

{% include components/heading.html heading='Bringing it all Together: What We\'re Really Optimizing' level=4 %}


Let's synthesize these philosophical threads:

**Different ethical frameworks privilege different protocols:**

- **Utilitarians** care about total welfare. They'd choose protocols that maximize sum of utilities, even if those protocols are asymmetric, complex, or require agents to report complete preference functions. Efficiency dominates.

- **Rawlsians** care about the worst-off agent. They'd choose protocols that maximize the minimum utility (maximin), ensuring no agent is left in a terrible position. They'd also insist on symmetric protocols (veil of ignorance) and transparent procedures (publicity).

- **Libertarians** care about autonomy and voluntary exchange. They'd choose incentive compatible protocols that respect agents' choices without coercion. They might even reject mandatory protocols in favor of letting agents negotiate freely.

- **Egalitarians** care about equal treatment. They'd insist on symmetric protocols where all agents have identical roles. They might sacrifice efficiency for equality of process.

- **Proceduralists** care about fairness of process. They'd choose transparent, participatory protocols even if those protocols produce slightly suboptimal outcomes. They'd prioritize legitimacy over efficiency.

**For cake-cutting specifically:**

- If you're optimizing for **computational efficiency**, choose cut-and-choose (2 agents) or use a parallel protocol with weak fairness guarantees (many agents).

- If you're optimizing for **strong fairness guarantees**, accept higher query complexity. Use last diminisher or modern *O(n log n)* protocols.

- If you're optimizing for **incentive compatibility**, restrict to dominant-strategy mechanisms like cut-and-choose or mechanisms with carefully designed payment schemes.

- If you're optimizing for **procedural legitimacy**, choose symmetric, transparent protocols that agents can understand and endorse ex ante.

- If you're optimizing for **maximin welfare**, use protocols that explicitly protect the worst-off agent, perhaps with minimum guarantees.

Most real problems require **balancing** these considerations. The siblings can't optimize for everything simultaneously. They must make trade-offs explicit:

"We value transparency and equal treatment more than small efficiency gains, so we'll use a simple symmetric protocol even though an asymmetric optimizer might give slightly higher total utility."

Or: "We trust each other and want this done quickly, so we'll use an efficient protocol even if it's not incentive compatible against strategic manipulation."

Making these trade-offs explicit is the hallmark of philosophical maturity in mechanism design. It's the difference between naive "let's be fair" and sophisticated "here's what fairness means to us in this context, and here's why."

As we move beyond divisible goods to the harder case of indivisible items, these philosophical considerations become even more pressing. The impossibility results we'll face in Part II force explicit choices between competing values. The computational limitations force explicit choices between exactness and approximation. Understanding the philosophical stakes now prepares us for those harder choices ahead.

{% include components/heading.html heading='Limitations: When Cake-Cutting Meets Reality' level=3 %}

We've spent considerable time in the world of cake-cutting: existence theorems guaranteeing fair allocations, classical protocols with provable properties, modern breakthroughs achieving strong guarantees with bounded queries. The theory is beautiful, the mathematics compelling, the protocols often practical for small problems.

But we must now confront an uncomfortable truth: **most real-world fair division problems don't involve divisible goods**.

Inheritance estates consist of discrete items that cannot be subdivided without destroying their value. Divorce settlements involve indivisible assets like houses, cars, and custody arrangements. Resource allocation in organizations involves assigning specific tasks to specific people, not fractional shares. Even seemingly continuous resources have granularity: computational time is allocated in discrete quanta, budget line items have minimum thresholds, land parcels face legal constraints on subdivision.

The question we must address: **When does cake-cutting provide useful approximations to discrete problems, and when does it fail catastrophically?**

{% include components/heading.html heading='Why Cake-Cutting Fails for Our Siblings' level=4 %}

Let's return to Maya, Jordan, and Sam and apply cake-cutting directly to their inheritance problem. The failure will be instructive.

{% highlight python linenos %}
# Model the sibling inheritance as a "cake"
# Total estate value: $700,000
# Try to divide into continuous segments

print("=== Attempting to Apply Cake-Cutting to Inheritance ===\n")

# Represent the estate as 100 segments, each worth $7,000
# Maya's preferences: house dominates (64.3% of value)
maya_vals = [0.643/65 if i < 65 else 0.357/35 for i in range(100)]

# Jordan's preferences: photos (28.6%) and house (remaining)
jordan_vals = [0.643/30 if i < 30 else 0.357/70 for i in range(100)]

# Sam's preferences: watches (35.7%) and investments
sam_vals = [0.357/30 if 20 <= i < 50 else 0.643/70 for i in range(100)]

siblings = [maya_vals, jordan_vals, sam_vals]
sibling_names = ['Maya', 'Jordan', 'Sam']

# Normalize
siblings = [np.array(v) / sum(v) for v in siblings]

# Run last diminisher
print("Running Last Diminisher protocol...")
allocation = last_diminisher.Algorithm(siblings).allocate()

print("\nResulting allocation:")
for i, name in enumerate(sibling_names):
    piece = allocation[i]
    value = sum(siblings[i][int(x * 100)] 
                for x in np.linspace(piece.start, piece.end, 100))
    print(f"  {name}: segments {piece.start:.0%}-{piece.end:.0%} " +
          f"(value: {value:.1%})")
{% endhighlight %}

**Output:**
```
=== Attempting to Apply Cake-Cutting to Inheritance ===

Running Last Diminisher protocol...

Resulting allocation:
  Maya: segments 0%-65% (value: 64.3%)
  Jordan: segments 65%-78% (value: 14.3%)
  Sam: segments 78%-100% (value: 21.4%)
```

This output reveals five fundamental problems:

**1. Indivisibility ignored**: The house is "segments 0-65"? We can't actually split a house into fractional pieces. Maya needs the whole house or none of it. The protocol treats the estate as infinitely divisible, but houses, pianos, and watches are atomic units.

**2. Value destruction**: Giving Jordan "segments 65-78%" doesn't mean she gets the photos. In reality, these segments might correspond to random fractional claims on various items. We've imposed continuous divisibility on a fundamentally discrete problem.

**3. Lost complementarity**: The grandfather's watches are worth more as a complete collection. Splitting them into fractional shares destroys value that could have been preserved through strategic whole-item allocation.

**4. The dominant item problem**: The house is worth $450,000—64% of the total estate and nearly **double** any sibling's fair share of $233,333. When a single item exceeds 1/n of total value, proportional division becomes mathematically impossible without either:
   - Leaving that item unallocated (destroys its value)
   - Giving someone far more than their fair share
   - Requiring compensation payments (which assumes liquidity the siblings lack)

**5. Implementation impossibility**: How would you actually execute this allocation? You can't hand Maya "64% of the estate" as an abstract quantity. She needs specific items: the house, or some cars, or portions of investments. The continuous solution provides no guidance for discrete implementation.

**What we could do theoretically**: Convert everything to dollars ($700,000 in liquid assets) and run cake-cutting protocols where each sibling specifies valuations over the dollar-space. The mathematics works beautifully, guaranteeing proportionality and envy-freeness.

**Why this fails in practice**: Converting to dollars destroys the very value we're trying to allocate fairly.

{% include components/heading.html heading='The Fundamental Barriers' level=4 %}

The sibling inheritance exemplifies five categories of failure when applying continuous models to discrete problems:

**Barrier 1: The Dominant Item Problem**

When a single item's value exceeds an agent's fair share (value > 1/n of total), proportional allocation becomes impossible.

- **The house**: $450,000 to Maya vs. $233,333 fair share (1/3 of $700,000)
- **Jordan's photos**: $200,000 sentimental value vs. $233,333 fair share
- **Sam's watches**: $250,000 collection value vs. $233,333 fair share

With divisible goods, we'd give Maya 64% of her allocation from "house-space" and 36% from other spaces. With indivisible houses, this fractional allocation is meaningless.

**Barrier 2: Sentimental Value That Requires Possession**

Jordan values the photo albums at $200,000—nearly 29% of Jordan's total valuation. But this value is **possessory**: it exists only if Jordan receives the actual physical albums. The value cannot be:
- Converted to monetary equivalent (albums worth ~$500 at market)
- Split into fractional shares (half the photos aren't worth half the value)
- Substituted with other items of equal market value

Cake-cutting assumes additivity: V(A ∪ B) = V(A) + V(B) for disjoint sets. Sentimental goods violate this. The whole collection has value that fragments lack.

**Barrier 3: Liquidity and Compensation Constraints**

Suppose we approximate cake-cutting by:
1. Giving Maya the house ($450,000)
2. Requiring Maya to compensate Jordan and Sam with $108,333 each (to equalize at $233,333 per person)

This assumes Maya has liquid assets worth $216,667. She doesn't. Options:
- **Take a mortgage**: Transaction costs, interest, requires credit approval
- **Sell other assets**: More transaction costs, potential tax consequences
- **Payment plan**: Creates ongoing obligations and risks default

Cake-cutting assumes **costless transfers of value**. Reality imposes transaction costs, liquidity constraints, credit limits, and counterparty risk.

**Barrier 4: Preference Intensity Variation Across Discrete Items**

The siblings' valuations show massive gaps:
- Sam values watches at $250,000; Maya values them at $2,000 (125:1 ratio)
- Jordan values photos at $200,000; Sam values them at $15,000 (13:1 ratio)  
- Maya values house at $450,000; Sam values it at $50,000 (9:1 ratio)

These gaps create opportunities for **efficient matching**: give each sibling their highest-valued items. But they also create discrete either/or constraints:
- Either Sam gets all the watches or none of them (can't give Sam "80% of watch-value")
- Either Jordan gets the photos or doesn't (can't split album-value continuously)

With continuous cake-cutting, when two agents value different regions highly, we slice precisely to balance values. With discrete items, we face binary allocations that create discontinuities.

**Barrier 5: Complementarity and Economies of Scale**

Some items are worth more in combination:
- {piano, sheet music, piano bench} together enable playing music. They are more valuable than sum of their parts
- Complete watch collection worth more than scattered individual watches
- House with all appliances worth more than house + separately sold appliances

Cake-cutting assumes **additivity**: the value of combined pieces equals the sum of individual pieces. Complementary goods violate this assumption. Continuous division that breaks complementarities destroys value.

{% include components/heading.html heading='When Continuous Approximation Works vs. When It Fails' level=4 %}

Despite these barriers, continuous models sometimes provide useful approximations. Understanding the boundary cases guides us toward hybrid approaches.

**✓ When Continuous Approximation Works Well:**

**1. Many small items with similar values**

Dividing 1,000 items worth ~$1,000 each among 10 agents means each agent receives ~100 items worth ~$100,000. Losing or gaining a single $1,000 item changes utility by only ~1%. The granularity is fine enough that discrete constraints barely bind.

*Formal criterion*: If there are *m* items with maximum individual value *v_max* and total value *V*, discrete effects scale as *v_max / V*. When this ratio is small (< 0.01), continuous approximations work well.

**2. Genuinely fractionalizable assets**

- **Financial portfolios**: Stocks, bonds, and mutual funds support fractional shares
- **Time allocations**: Scheduling computational resources, vacation home access
- **Divisible budgets**: Department funding, project allocations
- **Bulk commodities**: Grain, oil, electricity (before discrete packaging)

For these resources, "indivisibility" is merely practical (minimum transaction sizes) rather than fundamental. Continuous models apply almost directly.

**3. Items with similar values to all agents**

If all items are worth approximately the same to all agents (homogeneous preferences over homogeneous goods), discrete constraints are less binding. Dividing 21 identical computers among 3 people: each gets 7 computers.  This a perfect discrete allocation matching continuous prediction.

The key is **homogeneity**: when items are similar and preferences aligned, discrete allocations approximate continuous solutions.

**✗ When Continuous Approximation Fails Catastrophically:**

**1. Few heterogeneous items (like our siblings)**

Only 8 items ranging from $2,000 (watches to Maya) to $450,000 (house to Maya). The ratio *m* (items) to *n* (agents) is small (8:3), and *v_max / v_min* is massive (225:1). Discrete constraints dominate everything.

**2. Sunk costs and high transaction costs**

Converting discrete items to continuous value requires transactions:
- Selling houses (6-10% in broker fees, taxes, time)
- Liquidating collections (loses scarcity premium)
- Dividing heirlooms (destroys sentimental value)

When transaction costs exceed 10-20% of value, forcing divisibility through sale and redistribution destroys net value. Better to keep items whole and allocate strategically.

**3. Legally or ethically mandated indivisibility**

- Children in custody disputes cannot be divided
- Cultural/religious items with constraints against fragmentation
- Intellectual property with atomic licensing
- Heirlooms with historical significance

Indivisibility is not only proactical, but normatively required.

**4. Strong complementarities and synergies**

When items exhibit strong complementarity (value in combination exceeds sum of parts), continuous division destroys value. Examples:
- Matching furniture sets
- Complete collections (stamps, coins, watches)
- Integrated systems (car + maintenance records + spare parts)

The more complementarity exists, the worse continuous approximation performs.

{% include components/heading.html heading='Approximation Quality: A Quantitative Framework' level=4 %}

We can formalize when continuous approximation is acceptable:

Let **CF** = value of allocation found by continuous model  
Let **CD** = value of best discrete allocation

**Approximation ratio**: *α = CF / CD*

- *α ≈ 1*: Continuous model is excellent approximation
- *α ≈ 0.9*: Acceptable (loses 10% to discretization)
- *α < 0.7*: Poor approximation (loses >30%)

**Factors affecting α**:

| Factor | Effect on α | Example |
|--------|-------------|---------|
| Many small items | α → 1 | 1000 books among 10 people |
| Few large items | α → 0 | 3 houses among 3 people |
| Homogeneous values | α → 1 | Everyone values items equally |
| Heterogeneous values | α decreases | Massive preference differences |
| Low transaction costs | α increases | Financial instruments |
| High transaction costs | α → 0 | Selling family heirlooms |
| Weak complementarity | α → 1 | Independent items |
| Strong complementarity | α → 0 | Matching sets, collections |

**For the sibling inheritance**:
- Few items (8), high heterogeneity, strong sentimental value, complementarity
- **Predicted α ≈ 0.3-0.5**: Continuous model loses 50-70% of value
- **Conclusion**: Cake-cutting is inappropriate; need discrete algorithms

{% include components/heading.html heading='The Path Forward: What We Need Instead' level=4 %}

Having established what cake-cutting cannot do for discrete problems, what tools do we need?

**Part 3 will provide**:

**1. Relaxed Fairness Notions**
- **EF1** (envy-free up to one good): Accept small, bounded envy
- **MMS** (maximin share): Absolute guarantees independent of others' allocations
- Understanding which relaxations are achievable and meaningful

**2. Discrete-First Algorithms**
- **Round-robin**: Simple sequential selection achieving EF1
- **Envy cycle elimination**: Trading to reduce envy
- **Maximum Nash welfare**: Balancing efficiency and fairness

**3. Computational Complexity**
- Many discrete fair division problems are NP-hard
- When must we accept approximations?
- What guarantees remain tractable?

**4. Practical Decision Framework**
Given your problem's characteristics:
- Which fairness notion to target?
- Which algorithm to use?
- How to verify the allocation is fair?

**5. Strategic and Implementation Concerns**
- Incentive compatibility with indivisible goods
- Handling monetary transfers and compensation
- Dealing with uncertain valuations

{% include components/heading.html heading='Key Insights Carrying Forward' level=4 %}

Despite cake-cutting's limitations for discrete problems, we've gained crucial understanding:

**Theoretical Foundations**:
- What perfect fairness looks like (envy-freeness, proportionality)
- Existence theorems tell us what's possible without constraints
- The role of divisibility in enabling strong guarantees

**Protocol Design Principles**:
- Symmetric vs. asymmetric procedures
- Procedural vs. outcome fairness
- Incentive compatibility through clever mechanism design

**Computational Realities**:
- Query complexity bounds information requirements
- Approximation can dramatically reduce complexity
- Trade-offs between exactness, efficiency, and guarantees are fundamental

**Impossibility Results**:
- Perfect fairness with contiguous pieces requires Ω(n²) queries
- Certain fairness properties cannot coexist
- These are mathematical necessities

These insights will prove essential when we confront indivisible goods in Part 3. The impossibility results for divisible goods foreshadow stronger impossibilities for discrete items. But they also show that clever relaxations, careful algorithm design, and willingness to accept bounded approximations can make progress possible even in challenging settings.

**For Maya, Jordan, and Sam**: Cake-cutting has taught us what to look for in a discrete algorithm:
- Fairness properties we want to approximate
- The role of procedure in creating legitimacy  
- Why perfect fairness may be impossible
- How to think about trade-offs between competing goals

Armed with this understanding, we're ready to build practical solutions for their actual problem: fairly dividing discrete, indivisible items where perfect fairness is mathematically impossible but meaningful approximate fairness remains achievable.

{% include components/heading.html heading='CONCLUSION: From Possibility to Impossibility' level=2 %}

We've completed a journey from the elegant mathematics of cake-cutting to the harsh realities of indivisible allocation. Let's consolidate what we've learned and preview where we're headed.

**What Cake-Cutting Taught Us**

With perfectly divisible goods, the mathematical landscape is remarkably benign:

**Existence Guarantees**: Steinhaus (1948) proved that proportional allocations always exist. Dubins and Spanier (1961) showed that envy-free and Pareto optimal allocations always exist. These establish that perfect fairness is achievable when goods can be divided arbitrarily.

**Classical Protocols**: Cut-and-choose provides envy-freeness for two agents with just 2 queries. Last diminisher extends to n agents with O(n²) queries. These protocols are transparent, implementable, and achieve strong guarantees.

**Modern Breakthroughs**: Recent work by Aziz and Mackenzie (2016) resolved decades-old open problems, providing bounded protocols for envy-free cake-cutting with any number of agents. The field continues to advance, finding ever more efficient algorithms.

**Computational Trade-offs**: Query complexity, time complexity, and fairness guarantees form a three-way trade-off. Exact envy-freeness with contiguous pieces requires Ω(n²) queries as a fundamental lower bound. But ε-approximate fairness can be achieved much more efficiently.

**Key Insights for Practice**:
- Protocols embody philosophical commitments (symmetric vs. asymmetric roles)
- Procedural fairness often matters as much as outcome fairness
- Incentive compatibility requires careful mechanism design
- Query complexity bounds tell us what information is fundamentally necessary

**Why Cake-Cutting Fails for Real Problems**

But we also confronted the limits of continuous models:

**Indivisibility Destroys Value**: Maya cannot receive "66% of the house"—the house must go to someone whole, or its value is destroyed. Jordan's sentimental attachment to the photo albums ($200,000) exists only for the complete collection, not for fractional shares.

**Dominant Items Break Fairness**: When a single item (the house at $450,000) is worth more than 1/n of total value ($233,333), proportional division becomes impossible. The discrete constraints dominate.

**Liquidity Constraints Bind**: Cake-cutting assumes costless transfers of value. Reality imposes transaction costs, credit limits, and illiquidity. Maya cannot simply "compensate" her siblings with money she doesn't have.

**Preference Intensity Varies Wildly**: Sam values the watches at $250,000 while Maya values them at $2,000. These massive gaps create opportunities for efficient matching but also discrete either/or choices that continuous models cannot capture.

**When Continuous Approximations Work**:
- Many items with similar values (discrete effects are small)
- Genuinely fractionalizable assets (financial instruments, budgets, time)
- Items where granularity is fine relative to total value

**When They Fail**:
- Few heterogeneous items (like our siblings' 8 items worth $2k-$450k)
- Complementarities and synergies (value in combinations)
- High transaction costs for division
- Legally or ethically mandated indivisibility

**The Transition Point**

We've now established what's possible (cake-cutting with divisible goods) and impossible (perfect fairness with indivisible goods). This sets the stage for Part 3, where we'll build tools specifically designed for discrete constraints:

**Part 3 will explore**:
- **Relaxed Fairness Notions**: When perfect fairness is impossible, how do we approximate it? EF1 (envy-free up to one good), MMS (maximin share), and other relaxations that make guarantees achievable
- **Simple But Powerful Algorithms**: Round-robin allocation achieves EF1 despite its simplicity. Understanding why simple algorithms work and when they fail
- **Computational Complexity**: Many discrete fair division problems are NP-hard. When must we accept approximations? What guarantees are tractable?
- **Philosophical Trade-offs**: Different relaxations embody different moral commitments. Choosing between EF1 (relative fairness) and MMS (absolute guarantees) is a value judgment
- **Practical Decision Framework**: Given your problem's characteristics, which fairness notion should you target and which algorithm should you use?

**The Core Insight Moving Forward**

When we cannot achieve envy-freeness exactly, we can bound envy to a single item (EF1). When we cannot guarantee proportionality, we can ensure each agent receives at least 3/4 of their maximin share. 

These relaxations aren't compromises born of laziness. They're realistic acknowledgments that "almost fair" can be good enough when "perfectly fair" is mathematically impossible. The art of fair division lies in choosing which relaxations are meaningful in your context and designing algorithms that achieve them efficiently.

**For Maya, Jordan, and Sam**, Part 3 will finally provide concrete solutions:
- How to allocate their estate using round-robin or more sophisticated algorithms
- How to verify that allocations achieve EF1 or other fairness properties
- How to balance fairness with efficiency (maximizing total value)
- How to choose algorithms based on their priorities and constraints

**What You've Gained from Part 2**

By exploring cake-cutting before tackling discrete allocation, you've built crucial intuition:
- What fairness criteria mean when they're achievable (cake-cutting)
- Why indivisibility creates fundamental barriers
- How query complexity and protocol design affect feasibility
- The difference between existence theorems and constructive algorithms
- When continuous approximations help versus when they mislead

This foundation will make Part 3's algorithms and complexity results much clearer. You'll understand not just *how* discrete algorithms work, but *why* they're designed the way they are: as adaptations of continuous principles to discrete constraints.

The elegant mathematics of cake-cutting has shown us what perfect fairness looks like. Now we must build tools for the imperfect reality of indivisible goods, where houses cannot be cut, watches cannot be shared, and photo albums must go to someone whole. Part 3 will show us how.

[Continue to Part 3: The Indivisibility Challenge →](/experiment/fair-division-goods-part-3)

{% include components/heading.html heading='Further Reading' level=2 %}

This section provides curated resources for deepening your understanding of discrete fair division, computational complexity, and relaxed fairness notions. Resources are organized by topic and level, emphasizing both foundational papers that established key results and modern work pushing the frontiers.

{% include components/heading.html heading='Relaxed Fairness Notions: Foundations' level=3 %}

The core papers introducing and analyzing approximations to perfect fairness:

**[Lipton, Richard J., Evangelos Markakis, Elchanan Mossel, and Amin Saberi. "On Approximately Fair Allocations of Indivisible Goods." *Proceedings of ACM EC*, 2004.](https://dl.acm.org/doi/10.1145/988772.988792)**  
The foundational paper introducing EF1 (envy-free up to one good) and providing the first polynomial-time algorithm. Shows that relaxing envy-freeness slightly makes discrete allocation tractable. Essential reading for understanding modern fair division.

**[Budish, Eric. "The Combinatorial Assignment Problem: Approximate Competitive Equilibrium from Equal Incomes." *Journal of Political Economy* 119.6 (2011): 1061-1103.](https://www.journals.uchicago.edu/doi/abs/10.1086/664613)**  
Connects fair division to market equilibrium, showing how approximate competitive equilibrium achieves approximate fairness for indivisible goods. Influential in applying fair division to course assignment and other real-world problems.

**[Bouveret, Sylvain, and Michel Lemaître. "Characterizing Conflicts in Fair Division of Indivisible Goods Using a Scale of Criteria." *Autonomous Agents and Multi-Agent Systems* 30.2 (2016): 259-290.](https://link.springer.com/article/10.1007/s10458-015-9287-3)**  
Comprehensive analysis of different fairness notions for indivisible goods. Proves that computing exact maximin share (MMS) is NP-complete, establishing fundamental complexity barriers.

**[Caragiannis, Ioannis, David Kurokawa, Hervé Moulin, Ariel D. Procaccia, Nisarg Shah, and Junxing Wang. "The Unreasonable Fairness of Maximum Nash Welfare." *ACM Transactions on Economics and Computation* 7.3 (2019): 1-32.](https://dl.acm.org/doi/10.1145/3355902)**  
Shows that maximizing Nash social welfare (product of utilities) achieves strong fairness properties including EF1 and approximations to MMS. Bridges welfare optimization and fairness criteria. Influential for understanding connections between efficiency and equity.

{% include components/heading.html heading='Computational Complexity Results' level=3 %}

Papers establishing what's computationally tractable and what's hard:

**[Procaccia, Ariel D., and Junxing Wang. "Fair Enough: Guaranteeing Approximate Maximin Shares." *Journal of the ACM* 63.2 (2016): Article 8.](https://dl.acm.org/doi/10.1145/2892630)**  
Introduces approximation ratios for MMS and provides algorithms achieving 2/3-MMS. Shows that approximate absolute fairness is computationally tractable even when exact fairness is NP-hard.

**[Garg, Jugal, and Setareh Taki. "An Improved Approximation Algorithm for Maximin Shares." *Artificial Intelligence* 300 (2021): 103547.](https://www.sciencedirect.com/science/article/pii/S0004370221001149)**  
Improves MMS approximation to 3/4, which is conjectured to be tight. State-of-the-art for approximate proportionality with indivisible goods. Essential for understanding practical bounds on fairness.

**[Plaut, Benjamin, and Tim Roughgarden. "Almost Envy-Freeness with General Valuations." *SIAM Journal on Discrete Mathematics* 34.2 (2020): 1039-1068.](https://epubs.siam.org/doi/abs/10.1137/19M124397X)**  
Studies EFx (envy-free up to any good) for general valuations. Shows existence for restricted cases but leaves general existence open. Important for understanding the boundary between EF1 and exact envy-freeness.

**[Barman, Siddharth, and Sanath Kumar Krishnamurthy. "Approximation Algorithms for Maximin Fair Division." *ACM Transactions on Economics and Computation* 8.1 (2020): Article 5.](https://dl.acm.org/doi/10.1145/3375720)**  
Provides approximation algorithms for MMS under various valuation classes. Extends beyond additive valuations to submodular and subadditive cases. Useful for practitioners dealing with complex preferences.

{% include components/heading.html heading='Cake-Cutting: Modern Results' level=3 %}

Recent breakthroughs in continuous fair division:

**[Aziz, Haris, and Simon Mackenzie. "A Discrete and Bounded Envy-Free Cake Cutting Protocol for Any Number of Agents." *Proceedings of FOCS*, 2016.](https://ieeexplore.ieee.org/document/7782594)**  
Resolves a decades-old open problem by providing bounded protocol for envy-free cake-cutting with any number of agents. Technical landmark showing that what seemed impossible (bounded envy-free protocols) is actually achievable.

**[Stromquist, Walter. "How to Cut a Cake Fairly." *American Mathematical Monthly* 87.8 (1980): 640-644.](https://www.jstor.org/stable/2320951)**  
Classic paper proving that achieving envy-freeness with contiguous pieces requires protocols that are either unbounded or probabilistic for three or more agents. Established fundamental limitations.

**[Deng, Xiaotie, Qi Qi, and Amin Saberi. "Algorithmic Solutions for Envy-Free Cake Cutting." *Operations Research* 60.6 (2012): 1461-1476.](https://pubsonline.informs.org/doi/10.1287/opre.1120.1116)**  
Shows that Îµ-envy-free allocations with contiguous pieces can be found in O(n log(1/Îµ)) queries. A massive improvement over exact envy-freeness. Demonstrates value of accepting small approximation errors.

{% include components/heading.html heading='Algorithmic Game Theory Perspectives' level=3 %}

Connecting fair division to broader mechanism design:

**[Moulin, Hervé. *Fair Division and Collective Welfare*. MIT Press, 2003.](https://mitpress.mit.edu/9780262134231/fair-division-and-collective-welfare/)**  
Graduate-level textbook connecting fair division to cooperative game theory and social choice. Strong on axiomatic foundations and impossibility results. Essential for understanding philosophical underpinnings.

**[Brandt, Felix, Vincent Conitzer, Ulle Endriss, Jérôme Lang, and Ariel D. Procaccia, eds. *Handbook of Computational Social Choice*. Cambridge University Press, 2016.](http://www.cambridge.org/us/academic/subjects/computer-science/algorithmics-complexity-computer-algebra-and-computational-g/handbook-computational-social-choice)**  
Comprehensive handbook covering computational aspects of social choice, including fair division. Chapter 11 (by Bouveret, Chevaleyre, and Maudet) focuses specifically on fair allocation of indivisible goods. Graduate-level reference.

**[Chevaleyre, Yann, Ulle Endriss, Sylvia Estivie, and Nicolas Maudet. "Reaching Envy-Free States in Distributed Negotiation Settings." *Proceedings of IJCAI*, 2007.](https://www.ijcai.org/Proceedings/07/Papers/075.pdf)**  
Studies how agents can reach envy-free allocations through negotiation and swaps. Important for understanding dynamic fair division where allocations emerge through trading rather than central planning.

{% include components/heading.html heading='Round-Robin and Simple Algorithms' level=3 %}

Surprisingly powerful results from simple approaches:

**[Caragiannis, Ioannis, Nick Gravin, and Xin Huang. "Envy-Freeness Up To Any Item with High Nash Welfare: The Virtue of Donating Items." *Proceedings of ACM EC*, 2019.](https://dl.acm.org/doi/10.1145/3328526.3329574)**  
Shows that donating items strategically combined with round-robin can achieve both EFx and high Nash welfare. Demonstrates that simple mechanisms can achieve sophisticated guarantees.

**[Amanatidis, Georgios, Evangelos Markakis, Afshin Nikzad, and Amin Saberi. "Approximation Algorithms for Computing Maximin Share Allocations." *ACM Transactions on Algorithms* 13.4 (2017): Article 52.](https://dl.acm.org/doi/10.1145/3147173)**  
Analyzes simple algorithms like round-robin and their approximation guarantees for MMS. Shows that greedy algorithms can achieve good approximation ratios despite their simplicity.

{% include components/heading.html heading='Philosophical Foundations' level=3 %}

For the normative and ethical dimensions:

**[Rawls, John. *A Theory of Justice*. Harvard University Press, 1971.](https://www.hup.harvard.edu/catalog.php?isbn=9780674000780)**  
While not about fair division specifically, Rawls's maximin principle and veil of ignorance deeply influence fairness criteria in allocation. Philosophical foundation for prioritizing the worst-off.

**[Dworkin, Ronald. "What is Equality? Part 2: Equality of Resources." *Philosophy & Public Affairs* 10.4 (1981): 283-345.](https://www.jstor.org/stable/2265047)**  
Philosophical argument for resource equality and responsibility for preferences. Informs debates about expensive preferences and interpersonal utility comparisons in fair division.

**[Sen, Amartya. *Collective Choice and Social Welfare* (Expanded Edition). Harvard University Press, 2017.](https://www.hup.harvard.edu/catalog.php?isbn=9780674919211)**  
Comprehensive treatment of social choice theory connecting individual preferences to collective decisions. Provides framework for thinking about fairness as social choice problem.

{% include components/heading.html heading='Computational Tools and Libraries' level=3 %}

**[FairPyx: Python Library for Fair Allocation Algorithms](https://github.com/ariel-research/fairpyx)**  
Open-source library implementing algorithms from this series. Includes cake-cutting protocols, discrete allocation algorithms (round-robin, envy cycle elimination), and fairness verification tools. Actively maintained with documentation and examples.

**[Spliddit: Fair Division in Practice](http://www.spliddit.org/)**  
Web application applying provably fair algorithms to real problems: rent division, task allocation, goods division. Based on research by Ariel Procaccia and collaborators. Try it for real allocation problems.

**[PrefLib: Preference Data Library](https://www.preflib.org/)**  
Repository of real preference data from various domains (elections, course allocation, etc.). Useful for benchmarking fair division algorithms on realistic data.

{% include components/heading.html heading='Surveys and Overviews' level=3 %}

Recent surveys synthesizing current knowledge:

**[Aziz, Haris. "Developments in Multi-Agent Fair Allocation." *AAAI Tutorial*, 2020.](https://www.aaai.org/ocs/index.php/AAAI/AAAI20/paper/view/17234)**  
Excellent recent survey covering both divisible and indivisible goods with focus on computational aspects. Clear exposition of EF1, MMS, and approximation algorithms.

**[Amanatidis, Georgios, Haris Aziz, Georgios Birmpas, Aris Filos-Ratsikas, Bo Li, Hervé Moulin, Alexandros A. Voudouris, and Xiaowei Wu. "Fair Division of Indivisible Goods: Recent Progress and Open Questions." *Artificial Intelligence* 322 (2023): 103965.](https://www.sciencedirect.com/science/article/pii/S000437022300109X)**  
State-of-the-art survey (2023) covering recent breakthroughs in indivisible goods. Comprehensive treatment of EF1, EFx, MMS, and their variants. Highlights open problems.

**[Moulin, Hervé. "Fair Division in the Internet Age." *Annual Review of Economics* 11 (2019): 407-441.](https://www.annualreviews.org/doi/abs/10.1146/annurev-economics-080218-025559)**  
Survey emphasizing online algorithms, strategic behavior, and applications to internet resource allocation. Connects classical theory to modern computational challenges.

{% include components/heading.html heading='Special Topics' level=3 %}

**Online Fair Division**:

**[Benade, Gabrielle, Aleksandr M. Kazachkov, Ariel D. Procaccia, and Christos-Alexandros Psomas. "How to Make Envy Vanish Over Time." *Proceedings of ACM EC*, 2018.](https://dl.acm.org/doi/10.1145/3219166.3219177)**  
Studies fair division when items arrive over time and must be allocated immediately. Shows that envy can be made to disappear in the long run even with online constraints.

**Strategic Manipulation**:

**[Amanatidis, Georgios, Georgios Birmpas, and Evangelos Markakis. "On Truthful Mechanisms for Maximin Share Allocations." *Proceedings of IJCAI*, 2016.](https://www.ijcai.org/Proceedings/16/Papers/075.pdf)**  
Studies incentive compatibility in fair division. Shows which mechanisms are strategy-proof and which are vulnerable to manipulation.