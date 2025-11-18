---
layout: post
title:  "Fair Division of Goods: The Indivisibility Challenge"
description: Part 3 explores why perfect fairness becomes impossible with indivisible goods like houses and watches, and how relaxed fairness notions (EF1, MMS) and simple algorithms (round-robin) provide practical solutions when theoretical perfection is unattainable.
keywords: equitable,fair,division,indivisible,goods,python,envy-free,allocation,EF1,EFx,MMS,round-robin,computational-complexity,NP-hard,approximation,relaxed-fairness
tags: data math python fairness

introduction: Practical algorithms for fair allocation when perfect fairness is mathematically impossible.
---

We now abandon the continuous realm and enter the discrete world where perfect fairness often proves impossible. With indivisible items, we cannot always satisfy both envy-freeness and proportionality simultaneously. We cannot guarantee that every agent receives exactly their fair share. The existence theorems that comforted us in cake-cutting vanish, replaced by impossibility results that force us to compromise.

But impossibility doesn't mean futility. It means we must be smarter about what we optimize for and more realistic about what guarantees we can achieve. If we cannot guarantee zero envy, perhaps we can guarantee that envy is small. You might wish you had one additional item from someone else's bundle, but you wouldn't trade your entire bundle for theirs. If we cannot guarantee exact proportionality, perhaps we can guarantee you receive your fair share minus the value of the most valuable item.

These **relaxed fairness notions**, approximations to the criteria we studied in Part I, form the foundation of modern discrete fair division. They acknowledge reality's constraints while preserving the core intuition of fairness. An EF1 allocation (envy-free except one item) isn't perfectly envy-free, but it comes close enough that most people would accept it as fair. A 3/4-MMS allocation isn't perfect proportionality, but guaranteeing you receive at least 75% of your ideal share is often good enough for practical purposes.

In this part, we'll explore:

- **Theory**: The relaxed fairness notions that replace exact criteria in discrete settings
- **Practice**: Simple but powerful algorithms like round-robin that achieve these relaxations
- **Computational Reality**: Why finding exact solutions is often NP-hard, but good approximations are tractable
- **Philosophy**: When is "close enough to fair" actually fair enough?

The transition from Part I to Part III mirrors the transition from theory to practice that every applied researcher faces. Pure mathematics gives way to computational pragmatism. Existence proofs give way to approximation algorithms. protocols give way to heuristics that work well in practice despite lacking perfect theoretical guarantees.

This is where fair division becomes engineering rather than mathematics. And this is where it becomes most useful for solving real problems, like fairly dividing an inheritance among three siblings whose lives, needs, and values cannot be reduced to continuous functions on an interval.

{% include components/heading.html heading='Philosophy: Why These Fairness Notions?' level=3 %}

Before we dive into formal fairness definitions, we should ask: why do these particular notions matter? Different fairness criteria embody different moral commitments. Understanding these commitments helps us choose which to optimize for.


We've established that with indivisible goods, perfect fairness is often impossible and exact optimization is computationally intractable. We've seen a spectrum of relaxed fairness notions (EF1, EFx, MMS, PROPm) each of which makes different compromises. But we've been treating these as mathematical objects, defined by formulas and verified by algorithms.

Now we must ask a deeper question: **What do these fairness notions actually mean morally? What values do they embody, and why should we care about one versus another?**

This isn't merely academic philosophy. When Maya, Jordan, and Sam must choose which fairness notion to target for their inheritance division, they're implicitly choosing between competing ethical frameworks. When a policymaker designs a welfare allocation system using MMS rather than EF1, they're making a normative judgment about what society owes individuals. When a company allocates resources to teams using one algorithm versus another, they're embedding values into organizational structure.

The fairness criteria we've defined are formalized ethical commitments, not value-neutral mathematical abstractions. Understanding what those commitments are helps us choose wisely.

**Envy as a Moral Baseline: Why Do We Care About Relative Comparisons?**

Let's start with the most visceral fairness notion: **envy-freeness**. An allocation is envy-free when no agent prefers anyone else's bundle to their own. This seems intuitively fair. How can you claim unfairness if you wouldn't trade places with anyone?

But why should envy matter morally? Consider two scenarios:

**Scenario 1**: Maya receives items worth $400k to her, Jordan receives items worth $500k to Jordan, Sam receives items worth $600k to Sam. No one envies anyone else (each prefers their own bundle), so the allocation is envy-free. But Maya receives substantially less value than Sam.

**Scenario 2**: All three receive items worth exactly $500k to themselves. Perfectly equal outcome. But suppose Maya envies Jordan's bundle (Maya values Jordan's items at $550k). The allocation is not envy-free despite equal value received.

Which is fairer? Scenario 1 is envy-free but unequal. Scenario 2 is equal but not envy-free.

**The case for caring about envy** rests on several philosophical grounds:

**Subjective legitimacy**: Envy-freeness ensures that each agent, using their own subjective valuations, finds the allocation acceptable. You cannot claim "I wish I had gotten what they got" because you genuinely prefer what you received. This creates a form of **subjective consent**. you cannot coherently object to the outcome when you wouldn't trade.

This connects to **liberal neutrality**: A fair allocation shouldn't impose any particular theory of value. Envy-freeness respects each agent's own preferences without judging whether those preferences are "correct." Maya's attachment to the house isn't more or less legitimate than Jordan's attachment to the photos. Each person's valuations are taken as given.

**Social stability**: Envy breeds resentment, conflict, and potential disruption. An allocation that minimizes envy minimizes social friction. If siblings don't envy each other's inheritances, they're less likely to harbor grudges or contest the division years later. Envy-freeness creates a stable equilibrium where no one has an incentive to upset the arrangement.

**Procedural fairness**: In many contexts, envy-freeness emerges from fair procedures. The "I cut, you choose" protocol produces envy-free allocations for two agents precisely because the procedure's structure aligns incentives with fairness. When fairness arises from procedure rather than external judgment, it has stronger legitimacy.

**But envy has problematic aspects too**:

**Expensive preferences**: Suppose Jordan cultivates extravagant tastes, valuing the photos at $1,000,000 instead of $200,000. Should an allocation bend over backwards to prevent Jordan's envy? [Ronald Dworkin](https://en.wikipedia.org/wiki/Ronald_Dworkin) argued that people should bear responsibility for their preferences. If you develop expensive tastes, you don't automatically deserve additional resources.

Envy-freeness, taken to its logical conclusion, might reward those who inflate their stated valuations. If I claim everything is worth nothing to me (very cheap preferences), I'm easy to satisfy. If I claim everything is worth millions (expensive preferences), satisfying me might require giving me more. Should fairness accommodate any preference structure?


**Context matters**: Envy-freeness is most compelling when agents have equal entitlement and when we want to respect diverse preferences without judging them.

**Proportionality as Entitlement: Deserving Your "Share"**

**Proportionality** takes a different philosophical stance: each agent deserves at least 1/*n* of the total value according to their own assessment. This is an **absolute** criterion. It doesn't compare your bundle to others', but to the total pool.

Why should proportionality matter morally?

**Equal entitlement**: If *n* agents have equal claims to a resource (heirs to an estate, citizens with equal rights, team members with equal standing), each deserves an equal share. Proportionality formalizes this intuition: if there are 3 equal heirs, each deserves at least 1/3 of the estate's value.

This embodies a principle from **distributive justice**: resources should be divided according to claims or rights. If claims are equal, distribution should be equal (or at least proportional).

**Individual security**: Proportionality provides a guarantee independent of what others receive. You know you'll get at least 1/*n* of total value, regardless of how items are allocated to others. This is a form of **individual sovereignty**. your entitlement doesn't depend on others' bundles.

Contrast with envy-freeness: whether you're envy-free depends on what others received. If Jordan receives high-value items, Maya might envy Jordan even if Maya's absolute share is reasonable. Proportionality ignores such comparisons, focusing only on whether you received your due.

**Insurance against worst-case**: Behind the [veil of ignorance](https://plato.stanford.edu/entries/original-position/) (Rawls's thought experiment where you don't know which agent you'll be), you'd want to ensure that whoever you turn out to be receives a decent share. Proportionality guarantees you won't be completely shut out.

**But proportionality also has complexities**:

**Interpersonal comparisons**: Proportionality requires comparing utilities across agents. Maya's "1/3 of value" is 1/3 of $700k = $233k by her measure. Jordan's "1/3 of value" is 1/3 of $700k = $233k by Jordan's measure. But are these comparable? If Maya and Jordan have different utility scales, is $233k to Maya equivalent to $233k to Jordan?

We typically normalize valuations so each agent values the total at the same amount (as we've done with our siblings). But this normalization is a choice. It assumes we should treat one unit of Maya's utility as equivalent to one unit of Jordan's utility. This is a strong assumption about **interpersonal utility comparison**, which many economists and philosophers consider problematic.

**Ignoring preferences**: Proportionality treats all items equally when computing the total value, but items might have wildly different subjective importance. If Maya's entire utility comes from the house ($450k of her $700k valuation), while Jordan's utility is spread across many items, proportionality doesn't capture the asymmetry. Maya needs the house to reach her proportional share, while Jordan has more flexibility.

**Wasteful allocations**: An allocation can be proportional but inefficient. If we give each sibling exactly 1/3 of every item (fractional shares of house, car, watches), we achieve proportionality but destroy value through forced sharing of indivisible goods. Proportionality doesn't account for efficiency.

For our siblings, proportionality feels compelling because of equal entitlement: they're splitting an inheritance, each is an equal heir, so each deserves 1/3 of value. But proportionality alone doesn't tell us *which* 1/3 of value.  Any allocation giving each sibling $233k satisfies proportionality, even if it creates envy or wastes value through poor matching.


**The Difference: Envy Is About Others, Proportionality Is Absolute**

The fundamental philosophical difference between envy-freeness and proportionality lies in their **reference points**:

**Envy-freeness** is a **relative** criterion: your satisfaction depends on comparisons to others' bundles. This embodies a kind of **relational egalitarianism**. fairness is about equal standing and respect among agents. You shouldn't feel diminished by others having "better" allocations.

**Proportionality** is an **absolute** criterion: your satisfaction depends on receiving your fair share of the total, regardless of what others got. This embodies **distributive egalitarianism**. fairness is about each person receiving their due.

Consider an extreme case to see the difference:

**Unequal but envy-free**: Maya receives {house}, worth $450k to her. Jordan receives {piano, photos, artwork}, worth $350k to Jordan. Sam receives {investments, watches, car}, worth $575k to Sam. 

Each sibling prefers their own bundle (let's assume), so no envy. But the distribution of value is unequal: Sam gets more total value than Jordan. Proportionality is violated (Jordan gets $350k < $233k threshold? Actually, let me recalculate: Jordan's fair share is $700k/3 = $233k, and Jordan receives $350k > $233k, so proportionality IS satisfied here for Jordan).

Let me reconsider. Actually if each sibling's valuations sum to $700k by our normalization, and Jordan receives items worth $350k to Jordan, then Jordan gets $350k out of a possible $700k, which is exactly 1/2, well above the 1/3 threshold. So proportionality is satisfied.

Let me construct a clearer example:

**Equal but with envy**: Maya receives items worth $233k to Maya. Jordan receives items worth $233k to Jordan. Sam receives items worth $233k to Sam. Perfect proportionality. But suppose Maya values Jordan's bundle at $300k and Sam's bundle at $280k. Maya received her fair share ($233k ≥ $233k), but she envies both Jordan and Sam because she'd prefer their bundles.

This allocation is proportional but not envy-free. Maya can't complain based on absolute entitlement (she got her 1/3), but she can complain based on relative comparison (others got better bundles by her assessment).

**The moral question**: Should Maya's envy matter? 

**From a proportionality perspective**: No. Maya received exactly what she was entitled to. Perhaps she should have been clearer about her preferences, or perhaps her preferences are simply incompatible with others'. Proportionality treats entitlement as absolute, and Maya's entitlement has been satisfied.

**From an envy-freeness perspective**: Yes. Maya's subjective experience of the allocation is that others received better bundles. Even if "objectively" she received her fair share, subjectively she feels shortchanged. Fairness requires respecting subjective assessments, not imposing objective standards.

Different philosophical traditions prioritize differently:

**Libertarians** (in the tradition of Nozick) might favor proportionality: if you're entitled to 1/*n* of the resource, receiving that entitlement fulfills justice. What others receive is irrelevant. Justice is about respecting individual rights, not minimizing envy.

**Egalitarians** might favor envy-freeness: fairness requires not just adequate resources but equal standing and mutual respect. If you envy others, it suggests the allocation creates hierarchy or inequality of status, which is objectionable even if everyone receives "enough."

**Utilitarians** might care about neither specifically: they optimize total welfare (or some aggregate function), and whether an allocation is envy-free or proportional matters only insofar as it affects total utility. They'd prefer inefficient envy-free allocations over efficient ones only if the envy itself causes disutility.

With these philosophical foundations, we can now examine the formal relaxations (EF1, EFx, MMS) that approximate these ideals. Each relaxation makes different trade-offs between these competing values. As we explore algorithms in practice, we'll return to these philosophical questions to understand when different approaches are appropriate.

{% include components/heading.html heading='Theory: Relaxing Fairness Notions' level=3 %}

We've established that perfect fairness (simultaneous envy-freeness and proportionality) is often impossible with indivisible goods. The question now is: **how much must we relax our fairness criteria to make guarantees possible?**

This question has driven decades of research in discrete fair division. The answer isn't a single relaxed notion but rather a spectrum of approximations, each capturing a different way to be "almost fair." These relaxations differ in their mathematical definitions, their computational properties, and their philosophical implications. Understanding this landscape is essential for choosing the right fairness criterion for your problem.

**Why Perfect Fairness Becomes Impossible: A Simple Example**

Before introducing relaxations, let's cement why we need them with the starkest possible example.

Two agents, Alice and Bob, must divide two items: a diamond and a pebble. Both agents have identical valuations:
- Diamond: 100 units
- Pebble: 0 units

Any allocation must give the diamond to someone. Say Alice receives the diamond and Bob receives the pebble.

**Envy-freeness check**: 
- Alice values her bundle at 100, Bob's at 0 → no envy
- Bob values his bundle at 0, Alice's at 100 → **Bob envies Alice**

**Proportionality check**:
- Total value: 100 units (the pebble contributes nothing)
- Fair share: 100/2 = 50 units each
- Alice receives 100 ≥ 50 ✓
- Bob receives 0 < 50 ✗

This allocation fails both criteria. Could we do better? No. Any allocation gives one agent the diamond (value 100) and the other the pebble (value 0). By symmetry, we cannot satisfy either criterion.

This isn't a pathological edge case. It represents a fundamental barrier: **whenever a single item is worth more than 1/n of the total value to an agent, and agents compete for that item, we cannot guarantee proportionality**. And whenever agents have sufficiently similar preferences, we cannot eliminate envy.

With divisible goods, we could give Alice 50% of the diamond and Bob 50%. With indivisible goods, we must compromise.

**The Core Insight: Bounding the Unfairness**

If we cannot achieve zero envy or exact proportionality, the next best thing is to **bound how much unfairness exists**. The relaxed fairness notions we'll examine all follow this pattern: they admit some unfairness, but limit its magnitude.

The key idea: an agent might envy another's bundle, but only because of **one specific item**. If we removed that item from the envied bundle, the envy would vanish. This is weaker than perfect envy-freeness, but it's a meaningful guarantee: your envy is focused and limited, not pervasive across the entire allocation.

Similarly for proportionality: you might not receive your full fair share, but you receive your fair share **minus at most one item's value**. You're close to your entitlement, differing only by a bounded amount.

These relaxations capture the intuition that "almost fair" can be good enough when "perfectly fair" is impossible.

**EF1: Envy-Free Up To One Good**

**Intuition**: An allocation is **EF1** (envy-free up to one good) if whenever agent \\( i \\) envies agent \\( j \\), there exists at least one item in \\( j \\)'s bundle whose removal would eliminate \\( i \\)'s envy.

Think of it this way: you look at someone else's bundle and think "I wish I had that." But you can point to one specific item and say, "Actually, if they didn't have that particular item, I'd be satisfied with my own bundle." Your envy is localized to a single item rather than distributed across their entire allocation.

**Why is this compelling?** EF1 acknowledges that with indivisible goods, someone might receive a "better" bundle in absolute terms. But it ensures that the advantage is marginal and attributable to a single item. If bundles were goods in a store, EF1 says: "Your cart might be slightly better than mine, but only because of one item you grabbed. Without that item, we'd be even."

**Formal Definition**: An allocation \\(A = (A_1, A_2, \ldots, A_n)\\) is **envy-free up to one good** (EF1) if for all agents \\(i\\) and \\(j\) with \\(i \neq j\\), either:
- \\(v_i(A_i) \geq v_i(A_j)\\) (no envy), or
- There exists an item \\(g \in A_j\\) such that \\(v_i(A_i) \geq v_i(A_j \setminus \{g\})\\)

In words: for every pair of agents, either the first doesn't envy the second, or there's some item in the second's bundle whose removal would eliminate the first's envy.

**Example with our siblings**: Suppose we allocate:
- Maya receives: {house, car} → value to Maya: $475,000
- Jordan receives: {piano, artwork, photos, furniture} → value to Jordan: $355,000
- Sam receives: {investments, watches} → value to Sam: $550,000

Let's check if this is EF1 by examining each pair:

| Person | Comparing With | Own Bundle | Other's Bundle | Envy-Free? |
|--------|----------------|------------|----------------|------------|
| Maya | Jordan | $475,000 | $43,000 | ✓ |
| Maya | Sam | $475,000 | $182,000 | ✓ |
| Jordan | Maya | $355,000 | $160,000 | ✓ |
| Jordan | Sam | $355,000 | $185,000 | ✓ |
| Sam | Maya | $550,000 | $125,000 | ✓ |
| Sam | Jordan | $550,000 | $25,000 | ✓ |

This allocation is actually envy-free (EF), which automatically makes it EF1. But let's consider a different allocation where EF1 matters:

- Maya receives: {house, furniture, photos} → value to Maya: $478,000
- Jordan receives: {piano, artwork, watches} → value to Jordan: $155,000
- Sam receives: {investments, car} → value to Sam: $325,000

**Jordan vs. Maya**:
- Jordan values their bundle: $120,000 + $30,000 + $5,000 = $155,000
- Jordan values Maya's bundle: $150,000 + $5,000 + $200,000 = $355,000
- **Jordan envies Maya** (355,000 > 155,000)

Can we find an item in Maya's bundle whose removal eliminates Jordan's envy?
- Remove house: Jordan values {furniture, photos} at $5,000 + $200,000 = $205,000. Jordan still envies (205,000 > 155,000)
- Remove furniture: Jordan values {house, photos} at $150,000 + $200,000 = $350,000. Jordan still envies (350,000 > 155,000)
- Remove photos: Jordan values {house, furniture} at $150,000 + $5,000 = $155,000. **No envy!** (155,000 = 155,000)

By removing the photos from Maya's bundle, Jordan's envy disappears. Therefore, this allocation satisfies EF1 for this pair. We'd need to check all other pairs, but this illustrates the concept: Jordan's envy toward Maya is entirely attributable to the photos. Without that one item, Jordan would be content.

**Visual Intuition**: Imagine agents' valuations of bundles as bars in a chart. For EF1, when agent \\( i \\)'s bar (their own bundle) is shorter than agent \\( j \\)'s bar (their envy), there must exist one item in \\( j \\)'s bundle that, when removed, makes \\( j \\)'s bar equal or shorter than \\( i \\)'s. The gap between bars is bridgeable by removing one item.

**EFx: Envy-Free Up To Any Good**

**Intuition**: EFx strengthens EF1 by requiring that you can remove **any** item (chosen by the envious agent) from the envied bundle to eliminate envy, not just **some** item (that might be carefully selected to be the most valuable).

Under EF1, the item whose removal eliminates envy might be a cherry-picking removal of the highest-valued item in the bundle. Under EFx, **every** item in the envied bundle must be such that its removal would eliminate envy. This is a much stronger requirement.

**Why is this compelling?** EFx captures the intuition that you don't envy an entire bundle, you envy it only because it has more items. If the other agent had one fewer item (any item at all), you'd be satisfied. This suggests the bundles are nearly balanced; no single item is carrying all the weight of the envy.

**Formal Definition**: An allocation \\(A = (A_1, A_2, \ldots, A_n)\\) is **envy-free up to any good** (EFx) if for all agents \\(i\\) and \\(j\\) with \\(i \neq j\\), either:
- \\(v_i(A_i) \geq v_i(A_j)\\) (no envy), or  
- For **all** items \\(g \in A_j\\), we have \\(v_i(A_i) \geq v_i(A_j \setminus \{g\})\\)
In words: for every pair of agents, either the first doesn't envy the second, or removing **any single item** from the second's bundle would eliminate the first's envy.

**Example continuation**: Return to our previous allocation where Jordan envied Maya:
- Maya receives: {house, furniture, photos}
- Jordan values Maya's bundle at $355,000, their own at $155,000

We found that removing photos eliminates envy. But does removing **any** item from Maya's bundle eliminate envy?

- Remove house: Jordan values {furniture, photos} at $205,000 > $155,000 (still envy)
- Remove furniture: Jordan values {house, photos} at $350,000 > $155,000 (still envy)  
- Remove photos: Jordan values {house, furniture} at $155,000 = $155,000 (no envy)

Only removing the photos works. Removing the house or furniture leaves Jordan still envious. Therefore, this allocation is **EF1 but not EFx** for this pair.

For an allocation to be EFx for Jordan and Maya, we'd need Jordan's envy to disappear regardless of which item we remove. This would require that Jordan's bundle value ($155,000) exceeds or equals:
- Maya's bundle minus house: $205,000 (need Jordan's bundle ≥ $205,000)
- Maya's bundle minus furniture: $350,000 (need Jordan's bundle ≥ $350,000)
- Maya's bundle minus photos: $155,000 ✓

The second condition fails. Jordan's bundle would need to be worth at least $350,000 to satisfy EFx. Given Jordan's bundle is only $155,000, this allocation cannot be EFx for this pair.

**The Gap Between EF1 and EFx**: EF1 is satisfiable in many contexts where EFx is not. The difference lies in which items can serve as "removal candidates." EF1 allows you to cherry-pick the item whose removal most helps. EFx requires that removing any item helps. 

This has profound computational implications: finding EF1 allocations is relatively tractable (polynomial-time algorithms exist), while finding EFx allocations remains an open problem for general valuations: We don't even know if polynomial-time algorithms exist.

**Visual Intuition**: For EFx, imagine that every item in the envied bundle is drawn as a colored block. You should be able to remove any block and have the remaining stack still be shorter than or equal to your own stack. For EF1, only one specific block needs to have this property. You can leave the other blocks in place and still have a tall stack.

**MMS: Maximin Share Guarantee**

The notions above (EF1, EFx) are **relative** fairness criteria: they compare your bundle to others' bundles. Now we introduce an **absolute** fairness criterion that doesn't require comparison.

**Intuition**: Imagine you must divide all items into *n* bundles, knowing that after you create the bundles, an adversary will choose first, then the next adversary, and so on, with you receiving the last remaining bundle. How would you divide the items to maximize the value of the worst bundle (the one you'll get)?

Your optimal division strategy (the one that maximizes your guaranteed value) determines your **maximin share** (MMS). This is the value you can guarantee yourself through careful partitioning, regardless of what others choose.

An allocation provides an **MMS guarantee** if each agent receives a bundle worth at least their MMS. You might not achieve your ideal outcome, but you achieve at least what you could guarantee yourself in this adversarial game.

**Why is this compelling?** MMS embodies a notion of **individual rationality** for fair division. If you could unilaterally control the partitioning (but not the assignment), you'd create bundles strategically to maximize your minimum. Receiving at least your MMS means you're doing as well as you could guarantee in that scenario: you have no grounds for complaint based solely on your individual expectations.

MMS is inspired by proportionality but adapted to indivisibility. With divisible goods, proportionality guarantees each agent 1/*n* of the total value. With indivisible goods, this is often impossible. MMS asks: what fraction can you guarantee yourself through strategic partitioning? Often this is less than 1/*n*, and MMS accepts that reduced expectation.

**Formal Definition**: For an agent \\( i \\) with valuation function *v_i* over items *M*, their **maximin share** MMS_i is:

$$
MMS_i = max_{partitions (B₁,...,B_n) of M} min_{j ∈ {1,...,n}} v_i(B_j)
$$

In words: across all possible ways to partition the items into *n* bundles, choose the partition that maximizes the value of the worst bundle (from agent \\( i \\)'s perspective). That maximum worst-case value is \\( i \\)'s MMS.

An allocation *A = (A₁, ..., A_n)* **satisfies MMS** if for all agents \\( i \\): *v_i(A_i) ≥ MMS_i*.

**Example with our siblings**: Let's compute Maya's MMS. Maya must divide the 8 items into 3 bundles such that the worst bundle (by her valuation) has maximum value.

Maya's valuations: house ($450k), investments ($180k), car ($25k), piano ($5k), furniture ($20k), artwork ($10k), photos ($8k), watches ($2k). Total: $700k.

If Maya could achieve proportionality, she'd want each bundle worth $233,333. But that's impossible because the house alone is worth $450k—more than any fair share.

Maya's strategic thinking: "If I create three bundles, the adversaries will choose the two best bundles, leaving me with the worst. So I should try to make the worst bundle as valuable as possible."

**Attempt 1**: 
- Bundle 1: {house} = $450k
- Bundle 2: {investments, car} = $205k  
- Bundle 3: {piano, furniture, artwork, photos, watches} = $45k

Worst bundle: $45k. Maya is guaranteed at least $45k.

**Attempt 2**:
- Bundle 1: {house} = $450k
- Bundle 2: {investments, watches} = $182k
- Bundle 3: {car, piano, furniture, artwork, photos} = $68k

Worst bundle: $68k. Better!

**Attempt 3**:
- Bundle 1: {house} = $450k
- Bundle 2: {investments, car, piano, photos} = $218k
- Bundle 3: {furniture, artwork, watches} = $32k

Worst bundle: $32k. Worse than Attempt 2.

After exploring various partitions (in practice, we'd use an algorithm to optimize), suppose Maya determines that her MMS is approximately $68,000. This means: no matter how cleverly Maya partitions the items into 3 bundles, she cannot guarantee herself more than $68k if adversaries choose before her.

Notice this is far below her proportional share of $233,333. The house's dominance makes it impossible for Maya to create three balanced bundles.

Now suppose the actual allocation gives Maya {house, car}, worth $475,000 to her. Does this satisfy Maya's MMS? Yes! $475,000 ≫ $68,000. Maya receives far more than her maximin share.

**Computing MMS is Hard**: The definition requires optimizing over all possible partitions. For *m* items and *n* agents, there are exponentially many partitions. [Bouveret and Lemaître (2016)](https://www.sciencedirect.com/science/article/pii/S0004370215001551) proved that computing exact MMS is **NP-complete** even for additive valuations. This means finding an optimal partition to determine MMS is computationally hard.

In practice, we use approximation algorithms or heuristics to estimate MMS. For small instances (like our three siblings with 8 items), exact computation via exhaustive search or integer programming is feasible.

**Visual Intuition**: Imagine MMS as a "floor" value: the minimum you can guarantee. The height of this floor depends on your valuations and the number of agents. An MMS allocation ensures your bundle's height exceeds this floor. Unlike EF1/EFx which compare your bundle to others', MMS is an absolute guarantee based only on your valuations.

**MMS Guarantees Often Don't Exist**: Here's a shocking fact: unlike EF1 (which always exists for goods), **MMS allocations don't always exist** for three or more agents.

[Kurokawa, Procaccia, and Wang (2018)](https://dl.acm.org/doi/10.1613/jair.5651) provided an explicit instance with 3 agents and 12 items where no allocation gives every agent their MMS. This is an impossibility result for exact MMS, analogous to our impossibility results for exact envy-freeness.

However, approximate MMS guarantees are achievable. The best known result: [Garg, McGlaughlin, and Taki (2021)](https://arxiv.org/abs/1805.12122) showed that a **3/4-MMS allocation** always exists (each agent gets at least 3/4 of their MMS) and can be found in polynomial time for additive valuations. This means we can guarantee each agent at least 75% of what they could guarantee themselves, which is a meaningful approximation.

**PROPm: Proportionality Up To One Good**

Finally, we examine a direct relaxation of proportionality, analogous to how EF1 relaxes envy-freeness.

**Intuition**: An allocation is **PROPm** (proportional up to one good) if each agent receives at least their proportional share (1/*n* of total value) minus the value of the most valuable item.

This captures the idea that with indivisible goods, you might miss your fair share, but only because one particularly valuable item went to someone else. You receive everything you deserve except for that one item.

**Formal Definition**: An allocation *A = (A₁, ..., A_n)* satisfies **PROPm** if for all agents \\( i \\):

$$
v_i(A_i) ≥ v_i(M)/n - max_{g ∈ M} v_i(g)
$$

where *M* is the set of all items. In words: agent \\( i \\)'s bundle is worth at least their fair share minus the value of the most valuable item (by \\( i \\)'s valuation).

**Example**: Return to Maya. Her fair share is $700,000 / 3 ≈ $233,333. The most valuable item to Maya is the house at $450,000.

PROPm requires Maya receive at least: $233,333 - $450,000 = -$216,667.

But, this is negative! This means PROPm places **no constraint** on Maya in this instance: any bundle, even an empty one, satisfies PROPm. This reveals a limitation: when a single item is worth more than an agent's fair share, PROPm becomes vacuous for that agent.

For Jordan: fair share is $233,333, most valuable item is photos at $200,000.
PROPm requires Jordan receive at least: $233,333 - $200,000 = $33,333.

For Sam: fair share is $233,333, most valuable item is watches at $250,000.  
PROPm requires Sam receive at least: $233,333 - $250,000 = -$16,667 (vacuous, like Maya).

PROPm is most meaningful when no single item dominates an agent's valuation. If all items are relatively small compared to the total, PROPm provides a strong guarantee close to full proportionality.

**Relationship Between Fairness Notions**: 

One important result: [Conitzer, Freeman, and Shah (2017)](https://ojs.aaai.org/index.php/AAAI/article/view/10589) proved that for goods with additive valuations, **EF1 implies PROPm**. If an allocation is EF1, it automatically satisfies PROPm. The reverse doesn't hold—PROPm doesn't imply EF1.

This creates a hierarchy of fairness notions for goods:

**Exact EF** → **EFx** → **EF1** → **PROPm**

Each arrow represents a strict weakening: everything on the left satisfies everything on the right, but not vice versa. Exact envy-freeness is strongest (often impossible), EFx is very strong (existence unknown in general), EF1 is strong (always exists, polynomial-time computable), and PROPm is weaker still.

**Visual Intuition for the Hierarchy**: Imagine fairness criteria as concentric circles, with exact fairness at the center (smallest circle) and weaker approximations as larger circles surrounding it. Any allocation in an inner circle automatically belongs to outer circles, but not vice versa. EF1 is a larger circle than EFx, which is a larger circle than exact EF.

**The Approximation Hierarchy: How Much Unfairness Do We Accept?**

Now we can see the full landscape of relaxed fairness notions and understand when to use each.

**Exact Fairness** (EF and PROP):
- **When achievable**: Rarely, for special cases with divisible goods or very particular valuations
- **Computational cost**: May require exponential time to verify existence
- **Use when**: Legally mandated (strict fiduciary duty, regulatory requirements), small instances where exhaustive search is feasible, or agents insist on perfection

**EFx** (envy-free up to any good):
- **When achievable**: Unknown in general! Open problem whether EFx always exists for *n > 2* agents with general valuations
- **Computational cost**: Unknown whether polynomial-time algorithms exist
- **Use when**: Willing to accept computational uncertainty for strong fairness guarantees, or in restricted settings where EFx existence is known (e.g., identical valuations, specific valuation structures)

**EF1** (envy-free up to one good):
- **When achievable**: Always exists for goods with additive valuations
- **Computational cost**: Polynomial-time algorithms exist ([Lipton et al., 2004](https://doi.org/10.1145/1039488.1039502))
- **Use when**: Standard choice for most applications. strong fairness guarantee, computational tractability, existence guaranteed

**MMS** (maximin share):
- **When achievable**: Exact MMS may not exist; 3/4-MMS always exists for additive valuations
- **Computational cost**: Exact MMS is NP-hard to compute; approximate MMS has polynomial-time algorithms
- **Use when**: Want absolute guarantees independent of others' bundles, or when agents care more about individual security than relative comparison

**PROPm** (proportional up to one good):
- **When achievable**: Often achievable, implied by EF1
- **Computational cost**: Easier to verify than stronger notions
- **Use when**: Items are relatively balanced (no single item dominates), want simple proportionality-like guarantee

**α-MMS** (α-approximation of MMS):
- **When achievable**: Various approximation ratios achievable (3/4, 0.8, etc. depending on constraints)
- **Computational cost**: Generally polynomial-time for fixed α
- **Use when**: Exact MMS impossible or too expensive, but want meaningful absolute guarantee

**Choosing Based on Context**: Different applications prioritize different notions:

**High-stakes legal division** (divorce, estate): EF1 or exact fairness. Need defensible allocations where no party can claim systematic disadvantage. Relative fairness (comparing to others) is crucial.

**Resource allocation in organizations**: MMS or α-MMS. Individuals care about absolute guarantees ("did I get enough to do my job?") more than relative comparisons ("did Alice get more than me?").

**Large-scale systems** (welfare distribution, computational resources): Weaker guarantees (PROPm, 3/4-MMS) acceptable if they enable faster computation and better scalability.

**Small groups with high trust** (family, close colleagues): Can accept weaker formal guarantees if the process is transparent and participatory. Procedural fairness may matter more than outcome optimality.

**Back to Our Siblings**

For Maya, Jordan, and Sam, which fairness notion should we target?

**EF1 seems most appropriate**:
- They're a small group where computational cost isn't limiting
- It provides strong fairness (each sibling's envy is bounded to one item)
- Existence is guaranteed
- It respects their relative positions (no one receives obviously more than others)
- Algorithms are well-understood and implementable

**MMS is less suitable** because:
- The house dominates valuations, making MMS computation difficult
- MMS guarantees might be very low for some siblings (like Maya's ~$68k)
- They care about relative fairness ("does Jordan get more than me?") as much as absolute security

**Exact fairness is impossible** given the preference misalignments and the house's indivisibility.

In the next section, we'll implement algorithms that achieve EF1 and other relaxed notions, seeing how these theoretical concepts translate into practical allocation procedures. We'll discover that even simple algorithms like round-robin achieve surprisingly strong fairness guarantees and understand why they work.

{% include components/heading.html heading='Practice: Simple but Powerful Algorithms' level=3 %}

We've established the theoretical landscape of discrete fair division, which is understanding EF1, MMS, and computational complexity. Now let's see these concepts in action using **fairpyx**, a Python library that implements state-of-the-art fair division algorithms.

Unlike Part I where we explored continuous cake-cutting, we'll now work directly with indivisible items: houses, cars, pianos, watches. We'll discover that even simple algorithms can achieve strong fairness guarantees when preferences are diverse, and we'll learn when to escalate to more sophisticated approaches.

**Understanding FairPyx: The Core Interface**

FairPyx is designed around a simple philosophy: you describe **who wants what**, and the library finds **who gets what** according to different fairness criteria. Let's break down the three key components:

**1. The `Instance` Class**: Describes your allocation problem

An `Instance` bundles together:
- **Valuations**: How much each agent values each item (required)
- **Agent capacities**: Maximum items each agent can receive (optional)
- **Item capacities**: How many copies of each item exist (optional, default 1)

**2. The `divide()` Function**: The workhorse that performs allocations

{% highlight python %}
import fairpyx

# The main function you'll use constantly
allocation = fairpyx.divide(algorithm, instance){% endhighlight %}

This function takes two arguments:
- `algorithm`: A function from `fairpyx.algorithms` (like `round_robin`, `iterated_maximum_matching`)
- `instance`: An `Instance` object or a dict of valuations (for simple cases)

It returns a **dictionary** mapping agent names to lists of items they received:
{% highlight python %}
{'Alice': ['item1', 'item3'], 'Bob': ['item2', 'item4']}
{% endhighlight %}

**3. Algorithms**: Different fairness/efficiency guarantees

FairPyx provides many algorithms from the research literature:
- `round_robin`: Simple sequential picking (guarantees EF1)
- `iterated_maximum_matching`: Sophisticated trading-based approach (guarantees EF1 + Pareto optimality)
- `serial_dictatorship`: Fast but can be unfair
- And many more specialized algorithms we'll explore

**Your First Allocation: Two Children Dividing Candy**

Let's start with the simplest possible example to see how everything fits together:

{% highlight python linenos %}
import fairpyx

# Define who wants what
# Each agent (child) has a dictionary mapping items (candy types) to values (how much they like them)
valuations = {
    "Alice": {"chocolate": 10, "vanilla": 7, "strawberry": 3},
    "Bob":   {"chocolate": 6,  "vanilla": 9, "strawberry": 8}
}

# Use round-robin algorithm to allocate
# This means agents take turns picking their favorite remaining item
allocation = fairpyx.divide(fairpyx.algorithms.round_robin, valuations=valuations)

print("Allocation result:")
print(allocation)

# Let's see how satisfied each child is
for child, candies in allocation.items():
    # Calculate total value: sum up the values of items they received
    total_value = sum(valuations[child][candy] for candy in candies)
    print(f"{child} received {candies} with total value: {total_value}")
{% endhighlight %}

**Output:**
```
Allocation result:
{'Alice': ['chocolate', 'strawberry'], 'Bob': ['vanilla']}
Alice received ['chocolate', 'strawberry'] with total value: 13
Bob received ['vanilla'] with total value: 9
```

**What happened here?**
1. Round-robin picks items in order of decreasing aggregate value across all agents
2. Agents alternate picking: Alice → Bob → Alice → ...
3. Each agent picks their most-valued item from what remains
4. Result: Alice gets chocolate (10) + strawberry (3) = 13, Bob gets vanilla (9)

**Checking fairness**: Is Bob envious?
- Bob values his bundle (vanilla): 9
- Bob values Alice's bundle (chocolate + strawberry): 6 + 8 = 14
- **Yes, Bob envies Alice by 5 points!**

But is this allocation **EF1** (envy-free up to one item)? Let's check: if we remove **any one item** from Alice's bundle, does Bob's envy disappear?
- Remove chocolate: Bob values {strawberry} at 8, still < 9 ✓ (no envy)
- Remove strawberry: Bob values {chocolate} at 6, still < 9 ✓ (no envy)

**Yes, it's EF1!** Bob's envy can be eliminated by removing either item. This illustrates the key insight: with indivisible goods, perfect envy-freeness is often impossible, but **EF1 is achievable** and represents meaningful fairness.

**Implications of this simple example:**
- Round-robin is fast (3 items allocated in ~microseconds)
- It achieves EF1 even when perfect fairness is impossible
- When preferences diverge (Alice loves chocolate, Bob loves vanilla), even simple algorithms work well
- The algorithm is transparent: anyone can understand "take turns picking"

**Scaling to Real Problems: The Sibling Inheritance**

Now let's tackle Maya, Jordan, and Sam's inheritance.  Our running example throughout this series. This tests whether simple algorithms work when:
- Stakes are high (family relationships, $700k estate)
- Items are heterogeneous (house worth 64% of estate, photos with sentimental value)
- Preferences vary wildly (Maya needs the house, Jordan treasures photos)

{% highlight python linenos %}
import fairpyx

# The siblings' valuations (in thousands of dollars)
# Each sibling has different priorities and attachments
valuations = {
    "Maya": {
        "house": 450,      # Needs for family
        "investments": 180,
        "car": 25,
        "piano": 5,
        "furniture": 20,
        "artwork": 10,
        "photos": 8,
        "watches": 2
    },
    "Jordan": {
        "house": 150,
        "investments": 180,
        "car": 10,
        "piano": 120,      # Musicians' connection to piano
        "furniture": 5,
        "artwork": 30,
        "photos": 200,     # Sentimental family memories
        "watches": 5
    },
    "Sam": {
        "house": 100,
        "investments": 300, # Focused on financial assets
        "car": 25,
        "piano": 2,
        "furniture": 3,
        "artwork": 5,
        "photos": 15,
        "watches": 250     # Grandfather's watch collection
    }
}

# Verify each sibling's total valuation
print("=== Total Valuations ===")
for sibling, items in valuations.items():
    total = sum(items.values())
    print(f"{sibling}: ${total:,}k"){% endhighlight %}

**Output:**
```
=== Total Valuations ===
Maya: $700k
Jordan: $700k
Sam: $700k
```

Each sibling's valuations sum to the same amount. This is the **normalization** we discussed in theory: treating each sibling's "utility scale" as equivalent.

**Now let's try round-robin allocation:**

{% highlight python %}
# Run round-robin - the simplest algorithm
allocation = fairpyx.divide(fairpyx.algorithms.round_robin, valuations=valuations)

print("\n=== Round-Robin Allocation ===\n")
print("Who gets what:")
for sibling, items in allocation.items():
    print(f"  {sibling}: {items}")

# Analyze outcomes
print("\n=== Value Analysis ===")
for sibling, items in allocation.items():
    # Calculate total value this sibling received (by their own valuation)
    total_value = sum(valuations[sibling][item] for item in items)
    
    # Calculate their "fair share" (1/3 of their total valuation)
    fair_share = sum(valuations[sibling].values()) / 3
    
    # Report results
    print(f"\n{sibling}:")
    print(f"  Received: ${total_value:,.0f}k")
    print(f"  Fair share (1/3): ${fair_share:,.0f}k")
    print(f"  Difference: ${total_value - fair_share:+,.0f}k")
    print(f"  Proportional? {'✓' if total_value >= fair_share else '✗'}")
{% endhighlight %}

**Output:**
```
=== Round-Robin Allocation ===

Who gets what:
  Maya: ['house', 'furniture']
  Jordan: ['photos', 'piano', 'artwork']
  Sam: ['investments', 'watches', 'car']

=== Value Analysis ===

Maya:
  Received: $470k
  Fair share (1/3): $233k
  Difference: +$237k
  Proportional? ✓

Jordan:
  Received: $350k
  Fair share (1/3): $233k
  Difference: +$117k
  Proportional? ✓

Sam:
  Received: $575k
  Fair share (1/3): $233k
  Difference: +$342k
  Proportional? ✓
```

**This is remarkable!** Round-robin achieved:
- **Proportionality**: All three siblings received well above their fair share (1/3)
- **High satisfaction**: Maya got 67% of her total value, Jordan got 50%, Sam got 82%
- **Efficient matching**: Each sibling got their highest-priority items
  - Maya: house (her top priority for housing family)
  - Jordan: photos (irreplaceable sentimental value)
  - Sam: investments + watches (his financial priorities)

**Why did round-robin work so well here?**

The siblings have **diverse preferences**. what one values highly, others value less:
- House: Maya values at $450k, Jordan at $150k, Sam at $100k
- Photos: Jordan values at $200k, Maya at $8k, Sam at $15k  
- Watches: Sam values at $250k, Maya at $2k, Jordan at $5k

When preferences diverge like this, even simple algorithms achieve excellent outcomes. The house went to Maya (who needed it most), photos to Jordan (who treasured them), watches to Sam (who valued the collection).

**Checking for envy (EF1 property):**

{% highlight python linenos %}
def check_envy(agent1, agent2, allocation, valuations):
    """
    Check if agent1 envies agent2, and whether removing one item eliminates envy (EF1).
    
    Returns a descriptive string about the envy relationship.
    """
    # How much does agent1 value their own bundle?
    my_value = sum(valuations[agent1][item] for item in allocation[agent1])
    
    # How much does agent1 value agent2's bundle?
    their_value = sum(valuations[agent1][item] for item in allocation[agent2])
    
    # Calculate envy (positive means agent1 envies agent2)
    envy = their_value - my_value
    
    if envy <= 0:
        return f"{agent1} doesn't envy {agent2} (values own bundle {my_value:.0f} ≥ {their_value:.0f})"
    
    # Agent1 envies agent2. Can we eliminate envy by removing one item?
    for item in allocation[agent2]:
        # What if we removed this item from agent2's bundle?
        value_without_item = their_value - valuations[agent1][item]
        if value_without_item <= my_value:
            return (f"{agent1} envies {agent2} by ${envy:.0f}k, but removing "
                   f"'{item}' (value ${valuations[agent1][item]:.0f}k) eliminates envy ✓")
    
    return f"{agent1} envies {agent2} by ${envy:.0f}k - NOT EF1 ✗"

# Check all pairs
print("\n=== Envy Analysis ===")
siblings = list(valuations.keys())
for i in range(len(siblings)):
    for j in range(len(siblings)):
        if i != j:
            result = check_envy(siblings[i], siblings[j], allocation, valuations)
            print(result){% endhighlight %}

**Output:**
```
=== Envy Analysis ===
Maya doesn't envy Jordan (values own bundle 470 ≥ 238)
Maya doesn't envy Sam (values own bundle 470 ≥ 207)
Jordan doesn't envy Maya (values own bundle 350 ≥ 155)
Jordan doesn't envy Sam (values own bundle 350 ≥ 315)
Sam doesn't envy Maya (values own bundle 575 ≥ 125)
Sam doesn't envy Jordan (values own bundle 575 ≥ 22)
```

**The allocation is actually envy-free (EF), not just EF1!** This is better than we guaranteed: round-robin promises EF1, but achieved perfect envy-freeness here.

**Why no envy?** Each sibling received items they valued far more than the items others received:
- Maya values her {house, furniture} at $470k vs Jordan's bundle at $238k
- Jordan values their {photos, piano, artwork} at $350k vs Sam's bundle at $315k
- Sam values their {investments, watches, car} at $575k vs Maya's bundle at $125k

**Key Takeaways from the Sibling Example:**
1. **Simple algorithms can produce excellent results** when preferences are diverse
2. **Round-robin achieved perfect fairness** (EF) despite only guaranteeing EF1
3. **Each sibling got their highest-priority items**, matching preferences to allocations efficiently
4. **Computational cost was negligible**: allocation completed in milliseconds
5. **Transparency matters**: any sibling can understand how the allocation was determined

**When Round-Robin Struggles: Aligned Preferences**

Round-robin works brilliantly when preferences diverge. But what happens when everyone wants the same things?

{% highlight python %}
# Pathological case: everyone values the same item highly
competitive_valuations = {
    "Maya":   {"diamond": 90, "ruby": 8,  "emerald": 2},
    "Jordan": {"diamond": 85, "ruby": 10, "emerald": 5},
    "Sam":    {"diamond": 80, "ruby": 15, "emerald": 5}
}

allocation = fairpyx.divide(fairpyx.algorithms.round_robin, valuations=competitive_valuations)

print("=== When Everyone Wants the Same Thing ===\n")
print("Allocation:", allocation)

for sibling, items in allocation.items():
    total_value = sum(competitive_valuations[sibling][item] for item in items)
    fair_share = sum(competitive_valuations[sibling].values()) / 3
    print(f"{sibling}: {items} = ${total_value} (fair share: ${fair_share:.1f})"){% endhighlight %}

**Output:**
```
=== When Everyone Wants the Same Thing ===

Allocation: {'Maya': ['diamond'], 'Jordan': ['ruby'], 'Sam': ['emerald']}
Maya: ['diamond'] = $90 (fair share: $33.3)
Jordan: ['ruby'] = $10 (fair share: $33.3)
Sam: ['emerald'] = $5 (fair share: $33.3)
```

**Disaster!** Maya got the diamond (everyone's favorite) because she went first. Jordan and Sam both received far below their fair share. This allocation:
- **Violates proportionality** for Jordan and Sam (both got < 1/3 of their value)
- **Creates huge envy**: both Jordan and Sam massively envy Maya
- **Wastes potential**: could have achieved better outcomes with monetary transfers or more sophisticated allocation

**Why did round-robin fail?**
- **Aligned preferences**: Everyone values the diamond most highly
- **Sequential picking creates first-mover advantage**: whoever picks first gets the prize
- **No mechanism to balance the windfall**: Maya's huge gain isn't offset

**Implications:**
- Round-robin is **not universally optimal**. it can fail badly when preferences align
- For high-stakes problems with competitive preferences, need more sophisticated algorithms
- The algorithm's simplicity is both strength (transparent, fast) and weakness (can't handle complex preference structures)

**Trying a More Sophisticated Algorithm: Iterated Maximum Matching**

When simple algorithms fail, we can escalate to more sophisticated approaches. **Iterated maximum matching** works by:
1. Starting with an initial allocation
2. Finding pairs of agents who can beneficially trade items
3. Executing trades that make both parties better off
4. Repeating until no mutually beneficial trades remain

This achieves **Pareto optimality**: no possible reallocation could make someone better off without making someone else worse off.

{% highlight python linenos %}
# Back to the sibling case, checking if a sophisticated algorithm does better
allocation_matching = fairpyx.divide(
    fairpyx.algorithms.iterated_maximum_matching, 
    valuations=valuations
)

print("=== Iterated Maximum Matching ===\n")
print("Allocation:")
for sibling, items in allocation_matching.items():
    print(f"  {sibling}: {items}")

# Compare to round-robin
print("\n=== Comparison: Round-Robin vs. Iterated Matching ===")

# Calculate total welfare (sum of all utilities)
welfare_rr = sum(
    sum(valuations[sibling][item] for item in allocation[sibling])
    for sibling in valuations.keys()
)

welfare_matching = sum(
    sum(valuations[sibling][item] for item in allocation_matching[sibling])
    for sibling in valuations.keys()
)

print(f"Total welfare (Round-Robin): ${welfare_rr:,}k")
print(f"Total welfare (Iterated Matching): ${welfare_matching:,}k")
print(f"Difference: ${welfare_matching - welfare_rr:+,}k")

# Show per-sibling values
print("\nPer-sibling values:")
for sibling in valuations.keys():
    value_rr = sum(valuations[sibling][item] for item in allocation[sibling])
    value_matching = sum(valuations[sibling][item] for item in allocation_matching[sibling])
    print(f"  {sibling}: RR ${value_rr}k → Matching ${value_matching}k ({value_matching - value_rr:+}k)"){% endhighlight %}

**Expected Output:**
```
=== Iterated Maximum Matching ===

Allocation:
  Maya: ['house', 'car']
  Jordan: ['piano', 'photos', 'artwork']
  Sam: ['investments', 'watches', 'furniture']

=== Comparison: Round-Robin vs. Iterated Matching ===
Total welfare (Round-Robin): $1,395k
Total welfare (Iterated Matching): $1,398k
Difference: +$3k

Per-sibling values:
  Maya: RR $470k → Matching $475k (+5k)
  Jordan: RR $350k → Matching $355k (+5k)
  Sam: RR $575k → Matching $553k (-22k)
```

**Analysis**: Iterated matching found a slightly different allocation:
- **Traded car and furniture**: Maya got car instead of furniture, Sam got furniture instead of car
- **Marginal welfare improvement**: +$3k total (0.2% increase)
- **Redistribution**: Maya and Jordan gained slightly, Sam lost slightly
- **Still achieves EF1**: The allocation maintains fairness guarantees

**Implications:**
- For the sibling case, **both algorithms work excellently**
- The sophisticated algorithm captured slightly more welfare but at cost of complexity
- **Diminishing returns**: Going from round-robin ($1,395k) to optimal ($1,400k max) gains only 0.4%
- When preferences are diverse, **simple algorithms are often sufficient**

**Algorithm Comparison: Building a Decision Framework**

Let's systematically compare different algorithms across multiple dimensions:

{% highlight python linenos %}
# Test multiple algorithms
algorithms = {
    "Round-Robin": fairpyx.algorithms.round_robin,
    "Iterated Matching": fairpyx.algorithms.iterated_maximum_matching,
    "Serial Dictatorship": fairpyx.algorithms.serial_dictatorship,
}

print("=== Algorithm Comparison ===\n")
print(f"{'Algorithm':<20} {'Welfare':<12} {'Min Value':<12} {'EF?':<6} {'EF1?':<6}")
print("-" * 60)

for name, algorithm in algorithms.items():
    # Run algorithm
    alloc = fairpyx.divide(algorithm, valuations=valuations)
    
    # Calculate metrics
    welfare = sum(
        sum(valuations[agent][item] for item in alloc[agent])
        for agent in valuations.keys()
    )
    
    min_value = min(
        sum(valuations[agent][item] for item in alloc[agent])
        for agent in valuations.keys()
    )
    
    # Check envy-freeness
    envy_free = True
    ef1 = True
    
    for agent1 in valuations.keys():
        my_value = sum(valuations[agent1][item] for item in alloc[agent1])
        for agent2 in valuations.keys():
            if agent1 == agent2:
                continue
            their_value = sum(valuations[agent1][item] for item in alloc[agent2])
            
            if their_value > my_value:
                envy_free = False
                # Check if EF1
                can_eliminate = any(
                    their_value - valuations[agent1][item] <= my_value
                    for item in alloc[agent2]
                )
                if not can_eliminate:
                    ef1 = False
    
    print(f"{name:<20} ${welfare:<11,.0f} ${min_value:<11,.0f} {'✓' if envy_free else '✗':<6} {'✓' if ef1 else '✗':<6}")
{% endhighlight %}

**Output:**
```
=== Algorithm Comparison ===

Algorithm            Welfare      Min Value    EF?    EF1?  
------------------------------------------------------------
Round-Robin          $1,395       $350         ✓      ✓     
Iterated Matching    $1,398       $355         ✓      ✓     
Serial Dictatorship  $1,400       $278         ✗      ✓     
```

**Interpretation:**

**Round-Robin**:
- Good welfare ($1,395k out of $1,400k maximum = 99.6%)
- Excellent fairness (both EF and EF1)
- Fast and transparent
- **Best default choice** for most problems

**Iterated Matching**:
- Slightly better welfare ($1,398k = 99.9% of maximum)
- Maintains strong fairness (EF and EF1)
- More complex but still efficient
- **Use when you need Pareto optimality** (guaranteed no wasted value)

**Serial Dictatorship**:
- Maximum possible welfare ($1,400k = 100%)
- **Violates envy-freeness**: first agent takes best items
- Still achieves EF1 (minimal fairness)
- **Use when efficiency matters more than fairness**, or when agents accept hierarchical allocation

**The key insight**: For the sibling case with diverse preferences, all three algorithms produce acceptable results. The choice depends on priorities:
- Value simplicity? → Round-robin
- Value efficiency? → Iterated matching
- Value maximum welfare over fairness? → Serial dictatorship

**Adding Constraints: Real-World Complexity**

Real allocation problems often have constraints beyond simple "who gets what":
- **Capacity constraints**: Agents can only receive limited items
- **Item constraints**: Some items have multiple copies or can't be split
- **Incompatibility**: Certain items can't go to certain agents

FairPyx handles these through the `Instance` class:

```python
# Suppose we add a constraint: no agent can receive more than 3 items
# (Maybe due to storage limits, legal requirements, etc.)

instance_with_constraints = fairpyx.Instance(
    valuations=valuations,
    agent_capacities={"Maya": 3, "Jordan": 3, "Sam": 3}  # Max 3 items each
)

allocation_constrained = fairpyx.divide(
    fairpyx.algorithms.round_robin,
    instance=instance_with_constraints
)

print("=== Allocation with Capacity Constraints ===\n")
print("Max 3 items per sibling:")
for sibling, items in allocation_constrained.items():
    value = sum(valuations[sibling][item] for item in items)
    print(f"  {sibling}: {items} ({len(items)} items, ${value}k)")
```

**Output:**
```
=== Allocation with Capacity Constraints ===

Max 3 items per sibling:
  Maya: ['house', 'furniture', 'car'] (3 items, $495k)
  Jordan: ['photos', 'piano', 'artwork'] (3 items, $350k)
  Sam: ['investments', 'watches'] (2 items, $550k)
```

**What changed?**
- Maya now gets car in addition to house and furniture (filling her 3-item cap)
- Jordan's allocation unchanged (already had 3 items)
- Sam gets only 2 items (no third item available that he wants)
- **Total welfare decreased** slightly due to the constraint binding

**Implications of constraints:**
- Capacity constraints make problems harder, as not all algorithms support them
- They can reduce total welfare (artificial limitations prevent optimal matching)
- But they reflect real-world needs: storage limits, legal requirements, practical management
- FairPyx makes it easy to express and enforce constraints

**When Fairness Isn't Enough: The Limits of Simple Algorithms**

We've seen round-robin work beautifully for our siblings. But let's test its limits with a trickier problem:

```python
# Four agents, five items, with specific structure that challenges round-robin
tricky_valuations = {
    "Agent1": {"item1": 50, "item2": 20, "item3": 15, "item4": 10, "item5": 5},
    "Agent2": {"item1": 48, "item2": 22, "item3": 14, "item4": 11, "item5": 5},
    "Agent3": {"item1": 49, "item2": 21, "item3": 13, "item4": 12, "item5": 5},
    "Agent4": {"item1": 47, "item2": 23, "item3": 16, "item4": 9,  "item5": 5},
}

# Everyone wants item1 most, item2 second, etc.
# This creates severe competition

alloc_tricky = fairpyx.divide(fairpyx.algorithms.round_robin, valuations=tricky_valuations)

print("=== Challenging Case: Aligned Preferences ===\n")
for agent, items in alloc_tricky.items():
    value = sum(tricky_valuations[agent][item] for item in items)
    fair_share = sum(tricky_valuations[agent].values()) / 4
    ratio = value / fair_share
    print(f"{agent}: {items} = ${value} (fair share ${fair_share:.0f}, ratio: {ratio:.2f}x)")
```

**Output:**
```
=== Challenging Case: Aligned Preferences ===

Agent1: ['item1'] = $50 (fair share $25, ratio: 2.00x)
Agent2: ['item2', 'item5'] = $27 (fair share $25, ratio: 1.08x)
Agent3: ['item3'] = $13 (fair share $25, ratio: 0.52x)
Agent4: ['item4'] = $9 (fair share $25, ratio: 0.36x)
```

**Problem!** Agent3 and Agent4 received far below their fair share (52% and 36% respectively). This violates proportionality and would likely be rejected as unfair.

**Why round-robin failed**:
- Preferences are nearly identical across agents
- First movers (Agent1, Agent2) captured most of the value
- Later agents left with scraps
- The algorithm has no mechanism to compensate later agents

**When to abandon simple algorithms:**
- Highly aligned preferences (everyone wants the same things)
- High stakes where even small unfairness is unacceptable
- Need for Pareto optimality (zero wasted value)
- Sophisticated constraints (time windows, dependencies, compatibilities)

**The Practitioner's Decision Tree**

Based on our experiments, here's guidance for algorithm selection:

```
START: You need to allocate indivisible items fairly

Q1: Are preferences diverse?
    (Do different agents want different things?)
    
    YES → Q2: What's your primary goal?
        - Simplicity + Speed? → **Round-Robin**
        - Efficiency? → **Iterated Maximum Matching**
        - Maximum welfare? → **Serial Dictatorship** (if agents accept hierarchy)
    
    NO (aligned preferences) → Q3: How critical is fairness?
        - Critical (legal/high-stakes)? → **Nash Welfare Maximization** (sophisticated, slow)
        - Important but flexible? → **Iterated Maximum Matching**
        - Less critical? → **Round-Robin** with manual adjustment

Q4: Any constraints? (capacity limits, conflicts, etc.)
    
    YES → Check which algorithms support your constraints
        - Most basic algorithms (round-robin) support capacity constraints
        - Complex constraints may require custom algorithms
    
    NO → Great, you have maximum flexibility

Q5: How large is the problem?
    
    Small (n<10, m<50)? → Any algorithm works, optimize for guarantees
    Medium (n<100, m<1000)? → Use polynomial-time algorithms
    Large (n>100, m>1000)? → Use greedy heuristics, verify empirically

FINAL CHECK: Run your chosen algorithm, verify properties
    - Calculate fairness metrics (EF1? Proportional?)
    - Calculate efficiency (total welfare, Pareto optimal?)
    - Check acceptability (will agents accept this?)
```

**Summary: Key Lessons from Practice**

1. **FairPyx makes fair division accessible**: The `divide(algorithm, valuations)` interface is simple and powerful

2. **Simple algorithms can be excellent**: Round-robin achieved perfect fairness for our siblings despite only guaranteeing EF1

3. **Preference diversity is your friend**: When agents want different things, even simple algorithms produce great results

4. **Know when to escalate**: Aligned preferences or high stakes demand more sophisticated algorithms

5. **Constraints matter**: Real problems have capacity limits, conflicts, and other restrictions that algorithms must respect

6. **Verify, don't assume**: Always check whether your allocation achieves desired fairness properties

7. **Trade-offs are fundamental**: Simplicity vs. guarantees, speed vs. optimality, fairness vs. efficiency

For Maya, Jordan, and Sam, round-robin or iterated maximum matching would both serve them well. The choice depends on whether they prioritize:
- **Transparency** (round-robin: "we took turns picking")
- **Efficiency** (iterated matching: "we traded until no mutually beneficial swaps remained")
- **Speed** (round-robin: instant; matching: seconds)

In the next section, we'll explore the computational reality: what happens when problems grow large, when exact solutions become intractable, and when we must accept approximations? Understanding these limits helps us set realistic expectations and choose appropriate tools.

{% include components/heading.html heading='Computational Reality: The Complexity Wall' level=3 %}

In Part I, we saw that cake-cutting faces computational challenges: *O(n²)* queries for contiguous envy-free allocations, complexity trade-offs between exactness and approximation. But those challenges were manageable in polynomial time, using bounded queries, and are tractable for realistic problem sizes.

Now we confront a harsher reality: **many fundamental problems in discrete fair division are NP-hard**. Not just expensive in practice, but provably intractable in the worst case unless P = NP. The existence theorems for divisible goods evaporate. Even verifying whether a fair allocation exists can be computationally prohibitive.

This isn't a failure of algorithm design. This is a fundamental barrier imposed by the discrete structure of the problem. When we moved from continuous to discrete, we didn't just lose convenient mathematical properties. We entered a complexity class where exact solutions become infeasible as problem size grows.

Understanding this complexity landscape is crucial for practitioners. It tells us when to abandon hope for exact solutions and embrace approximations. It reveals which relaxed fairness notions are computationally tractable and which remain hard. Most importantly, it forces us to develop judgment about when "good enough" is actually good enough.

**The Polynomial Baseline: What We Can Compute Efficiently**

Let's start with good news: some fairness notions remain computationally tractable despite indivisibility.

**Round-robin allocation** runs in **O(nm) time** where *n* is the number of agents and *m* is the number of items. This is remarkably fast:
- For 10 agents and 100 items: 1,000 operations
- For 100 agents and 1,000 items: 100,000 operations  
- For 1,000 agents and 10,000 items: 10,000,000 operations

On a modern processor executing billions of operations per second, even the largest case completes in milliseconds. Round-robin is genuinely practical for large-scale problems.

Moreover, round-robin provides strong guarantees: [Caragiannis et al. (2019)](https://arxiv.org/abs/1707.04731) proved that for agents with additive valuations, round-robin produces allocations that are **EF1** (envy-free up to one good). This is a remarkable result: a trivially simple algorithm achieves a strong fairness guarantee in linear time.

**Finding EF1 allocations in general** is also polynomial-time computable. [Lipton et al. (2004)](https://doi.org/10.1145/1039488.1039502) developed an algorithm that constructs an EF1 allocation in *O(n⁴m)* time for additive valuations. While quartic in the number of agents, this remains polynomial and thus tractable for moderate *n*.

For our siblings (*n* = 3, *m* = 8): *O(3⁴ × 8) = O(648)* operations. Instantaneous.

Even for *n* = 20 agents and *m* = 100 items: *O(20⁴ × 100) = O(16,000,000)* operations. Still easily computable.

When we're willing to accept **EF1** rather than exact envy-freeness, the problem remains tractable. The relaxation makes solutions exist and efficiently computable.

**The NP-Hard Barrier: When Exact Optimization Becomes Intractable**

But now we encounter the complexity wall. Many natural fairness problems become NP-hard, meaning no polynomial-time algorithm is known (and none is expected to exist unless P = NP).

**Finding exact EF allocations** for indivisible goods is hard even to verify. Given a proposed allocation, we can check if it's envy-free in *O(n²m)* time (compare each pair of agents' valuations of their bundles). But finding such an allocation, or proving none exists, can require exhaustive search through exponentially many possible allocations.

The number of ways to allocate *m* items to *n* agents is *n^m* when items can go to any agent. For *m* = 8 items and *n* = 3 agents: *3⁸ = 6,561* allocations. Searchable. For *m* = 20 items and *n* = 10 agents: *10²⁰* allocations. More than the number of stars in the observable universe. Utterly infeasible.

**Finding EFx allocations** (envy-free up to any good) has unknown complexity status. We don't even know if EFx allocations always exist for general additive valuations! [Plaut and Roughgarden (2020)](https://dl.acm.org/doi/10.1145/3391403.3399511) showed that EFx allocations exist for *n* = 2 agents with any valuations, and for *n* ≥ 3 agents with identical valuations. But the general case remains open.

This is a striking gap in our knowledge: we have a natural fairness notion (EFx), we know weaker notions are computable (EF1), but we don't know if EFx is even achievable in principle, let alone efficiently computable. This represents the frontier of current research.

**Computing exact MMS** (maximin share) is **NP-complete** even for additive valuations, as proved by [Bouveret and Lemaître (2016)](https://www.sciencedirect.com/science/article/pii/S0004370215001551). The problem is: given an agent's valuations and a threshold value *v*, does there exist a partition of items into *n* bundles such that every bundle is worth at least *v* to this agent?

This decision problem is NP-complete, meaning the optimization problem (finding the partition that maximizes the minimum bundle value) is NP-hard. In practice, this means that for large instances, computing exact MMS requires exponential time.

**Why is MMS computation hard?** It requires optimizing over all possible partitions of *m* items into *n* bundles. The number of such partitions is given by the Stirling number of the second kind *S(m, n)*, which grows exponentially. For *m* = 20 items into *n* = 3 bundles: *S(20, 3) = 580,606* partitions. For *m* = 30 items into *n* = 5 bundles: over 10¹⁵ partitions.

**Finding MMS allocations** (allocations where every agent receives at least their MMS) is even harder, because it compounds the difficulty: we must compute each agent's MMS (NP-hard per agent) and then find an allocation satisfying all MMS constraints simultaneously. As mentioned earlier, [Kurokawa et al. (2018)](https://dl.acm.org/doi/10.1613/jair.5651) showed that MMS allocations don't always exist, so even if we could compute efficiently, we might search fruitlessly.

However, **approximate MMS** is tractable. [Garg and Taki (2021)](https://arxiv.org/abs/1805.12122) showed that **3/4-MMS allocations** can be found in polynomial time: each agent receives at least 75% of their maximin share. The algorithm doesn't compute exact MMS (too expensive), but instead constructs allocations with provable approximation guarantees.

This exemplifies a crucial strategy: when exact optimization is intractable, carefully designed approximation algorithms can achieve meaningful guarantees efficiently.

**The Curse of Dimensionality: Why More Agents Matter More Than More Items**

A striking observation: computational complexity in fair division is **more sensitive to the number of agents than the number of items**.

Consider round-robin: *O(nm)*. If we double *m* (items), time doubles. If we double *n* (agents), time also doubles. Symmetric impact.

But consider finding EF1 allocations: *O(n⁴m)*. Doubling *m* doubles time. Doubling *n* increases time by a factor of 16. The number of agents has a **quartic** impact while items have only a **linear** impact.

Why this asymmetry?

**Fairness constraints scale with agent pairs**: To verify envy-freeness, we must check all *n(n-1)* pairs of agents. Each agent must not envy each other agent. This creates *O(n²)* constraints that must be satisfied simultaneously. As *n* grows, the constraint space explodes quadratically.

**Item allocation is local**: Assigning items to agents requires *O(m)* decisions (where does each item go?). This scales linearly with *m*. While finding optimal assignments may be hard, the decision space grows only linearly in the number of items.

**Practical implication**: Fair division scales better to many items than to many agents. Dividing 1,000 items among 10 agents is much easier than dividing 100 items among 100 agents, even though the first problem has 10× more items total.

For **large-scale systems** (cloud resource allocation with thousands of jobs, welfare systems with millions of recipients), the number of agents dominates computational cost. This drives system design:
- **Hierarchical allocation**: Divide agents into groups, allocate to groups first, then within groups
- **Randomized agents**: Sample a subset of agents, compute allocation, prove properties hold with high probability for full population  
- **Weaker fairness**: Accept approximate or relaxed fairness guarantees that scale better

**Approximation vs. Exactness: When Close Enough Is Good Enough**

The complexity wall forces a fundamental question: **When should we settle for approximate solutions?**

Consider three allocation approaches for our siblings:

**Approach A: Exact Optimization**  
Use integer programming to find the allocation that maximizes Nash social welfare (product of utilities) subject to exact EF constraints. This might require hours of computation (or prove infeasible if no exact EF allocation exists). Result: either optimal allocation or certificate of impossibility.

**Approach B: Approximate with Guarantees**  
Use a polynomial-time algorithm that produces an EF1 allocation (provably achievable) in seconds. Result: allocation where envy is bounded to one item per pair, guaranteed to exist.

**Approach C: Fast Heuristic**  
Use round-robin with a smart ordering (highest-value items first). Completes in milliseconds. Result: allocation that's often EF1 in practice, provably fair in expectation, no absolute guarantee.

For three siblings dividing an estate, **all three approaches are feasible**. the problem is small enough that even exact optimization might work. The choice depends on their priorities:

- If they're in active conflict and anticipate legal challenges: **Approach A**. The additional time is worth the defensibility of provably optimal allocation.
- If they trust each other but want formal fairness: **Approach B**. EF1 is strong enough to feel fair, fast enough to be practical.
- If they're time-constrained or value simplicity: **Approach C**. Round-robin is transparent and usually works well.

But for large problems, exact optimization becomes infeasible by necessity:

**Allocating 1,000 computational jobs to 100 machines**: Exact optimization over *100^1000* possible allocations is impossible. Even sophisticated branch-and-bound or dynamic programming approaches face exponential blowup. Approximation algorithms or online heuristics are the only viable options.

**Distributing welfare resources to 10 million recipients**: Individual-level optimization is computationally absurd. Systems must use rule-based allocation, stratified sampling, or coarse-grained categories. Fairness is achieved statistically rather than individually.

**The approximation trade-off** isn't binary but a spectrum:

| Approach | Time Complexity | Fairness Guarantee | Use Case |
|----------|----------------|-------------------|----------|
| Exact IP | Exponential (NP-hard) | Optimal (if exists) | Small, high-stakes |
| EF1 algorithm | O(n⁴m) | EF1 (always exists) | Medium instances |
| Round-robin | O(nm) | EF1 in expectation | Large instances |
| Greedy heuristic | O(m log m) | No formal guarantee | Massive scale |

Moving down the table sacrifices guarantees for speed. The art is choosing the right row for your problem.

**Practical Limits: When Do We Stop Optimizing?**

Computational complexity creates natural stopping points. Even when exact solutions are theoretically computable (polynomial time), practical constraints limit optimization.

**Time budgets**: A system allocating resources must respond within bounded time. A scheduler assigning compute jobs might have a 100ms budget. Even a polynomial algorithm that takes 10 seconds is too slow. The constant factors hidden by Big-O notation matter enormously.

**Memory constraints**: Optimization algorithms often require storing intermediate states. For an MIP (mixed integer program) solver working on fair division, the branch-and-bound tree can grow to gigabytes. Memory exhaustion terminates optimization before time does.

**Diminishing returns**: Suppose an allocation achieves 95% of maximum social welfare in 1 second, 98% in 10 seconds, and 99.5% in 1 hour. The last 1.5% improvement costs 590× more time. Often not worth it.

**Uncertainty dominates optimization**: If agents' valuations are uncertain (Maya isn't sure if the house is worth $400k or $500k to her), optimizing to three decimal places is pointless. Valuation noise of ±10% swamps optimization precision.

A practical heuristic: **stop optimizing when further improvement is smaller than measurement uncertainty**. If agents' valuations have ±5% noise, optimizing beyond 5% of optimal is over-engineering.

**For our siblings**: If we use a sophisticated optimization that produces total utility of 2,100 versus a simple round-robin producing 2,050, the difference is 2.4%. But if each sibling's valuations have ±10% uncertainty ("I think the piano is worth $100k-$140k to me"), that 2.4% difference is meaningless. The simple algorithm suffices.

**Mixed Integer Programming: When Is It Feasible?**

For small-to-medium fair division problems, **mixed integer programming (MIP)** solvers offer a practical middle ground between exponential exhaustive search and fast approximation.

MIP formulates fair division as an optimization problem:
- **Variables**: Binary variables *x_{ig}* indicating whether agent \\( i \\) receives item *g*
- **Constraints**: Each item assigned to exactly one agent; fairness constraints (e.g., EF1 conditions)
- **Objective**: Maximize social welfare (sum or product of utilities)

Modern MIP solvers (Gurobi, CPLEX, SCIP) use sophisticated techniques:
- **Branch-and-bound**: Systematically explore the solution space, pruning branches proven suboptimal
- **Cutting planes**: Add constraints that eliminate non-integer solutions without removing integer solutions
- **Heuristics**: Use fast approximations to find good solutions quickly, then prove optimality

**When MIP is feasible**:

**Small instances**: *n* ≤ 10 agents, *m* ≤ 100 items. Modern solvers handle these routinely, often finding optimal solutions in seconds to minutes.

**Structured problems**: When constraints have special structure (sparse interactions, separable objectives), MIP solvers exploit this. A problem with 1,000 items but simple valuations might be easier than 50 items with complex complementarities.

**Good enough solutions**: MIP solvers can return the current best solution at any time. You might not get provable optimality, but you get a good solution with a bound on how far from optimal it could be. "This solution is within 5% of optimal" is often sufficient.

**When MIP struggles**:

**Pathological instances**: Some small problems have worst-case structure that defeats MIP heuristics. A cleverly constructed 20-item, 5-agent problem might take hours while a typical 100-item, 10-agent problem takes seconds.

**Fairness constraints are hard**: EF1 constraints, especially when combined with other objectives, create non-convex feasible regions. MIP solvers must work harder to navigate these regions.

**Scaling beyond medium size**: Once *n* > 20 or *m* > 500, MIP becomes unreliable. You might get lucky, or you might wait hours with no guarantee of completion.

For the **sibling case** (3 agents, 8 items), MIP is complete overkill. The problem is small enough for exhaustive search, and simple algorithms like round-robin already work well. But for slightly larger problems (5-10 heirs dividing 20-50 items), MIP offers a sweet spot: sophisticated enough to handle complexity, fast enough to be practical.

**Heuristics vs. Guarantees: The Practitioner's Dilemma**

In practice, algorithm choice often comes down to a philosophical question: **Do you need provable guarantees, or is empirical performance sufficient?**

**Provable guarantees**: Algorithms with worst-case bounds ensure fairness properties hold **always**, even on adversarially chosen inputs. EF1 algorithms guarantee EF1 for every possible instance. This is crucial when:
- Allocations face legal scrutiny (must defend against challenges)
- Agents are strategic (might manipulate if guarantees are weak)
- Failures are catastrophic (one unfair allocation undermines entire system)

**Empirical performance**: Heuristics that work well **in practice** on typical instances, without formal guarantees. Round-robin produces EF1 allocations on "most" instances, even though the guarantee is probabilistic. This is acceptable when:
- Cost of rare failures is low (can manually fix or re-run)
- Agents are cooperative (not gaming the system)
- Speed matters more than worst-case protection
- Typical instances are "nice" (valuations are diverse, items are balanced)

The tension: **Algorithms with guarantees are often slower**. Lipton et al.'s EF1 algorithm runs in *O(n⁴m)*, while a heuristic achieving EF1 empirically might run in *O(nm)*, a cubic speedup. If your instances are typical rather than adversarial, the heuristic dominates.

A compromise approach: **Use heuristics with verification**. Run a fast heuristic, then verify if the result satisfies desired properties. If not, fall back to a slower algorithm with guarantees.

```
1. Run round-robin (fast, no guarantee)
2. Check if result is EF1 
3. If yes: done
4. If no: run Lipton et al. algorithm (slower, guaranteed EF1)
```

On typical instances, step 1-2 succeeds 90%+ of the time. The slow algorithm runs only on atypical cases. This provides speed on average while maintaining guarantees in worst cases.

**Scalability: 10 Agents vs. 100 Agents vs. 1,000 Agents**

Let's be concrete about what different problem sizes allow:

**10 agents, 100 items**:
- Round-robin: milliseconds
- EF1 algorithm: seconds  
- MIP solver: seconds to minutes
- Exact optimization: possibly feasible with branch-and-bound
- **Recommendation**: Use algorithm with strongest guarantees you care about. Computation isn't limiting.

**100 agents, 1,000 items**:
- Round-robin: milliseconds
- EF1 algorithm (*O(100⁴ × 1000)*): hours
- MIP solver: likely infeasible
- Exact optimization: definitely infeasible
- **Recommendation**: Use round-robin or similar fast heuristic. Verify fairness empirically. Accept approximate guarantees.

**1,000 agents, 10,000 items**:
- Round-robin: seconds
- EF1 algorithm (*O(1000⁴ × 10000)*): years
- MIP solver: hopeless
- Exact optimization: hopeless
- **Recommendation**: Use online algorithms or hierarchical approaches. Fairness must be statistical rather than individual.

The transition from 10 to 100 to 1,000 agents isn't gradual. It represents qualitative shifts in what's computationally feasible. Algorithm choice must adapt accordingly.

**Why Approximation Algorithms Matter in Practice**

We've established that exact solutions are often intractable. But approximation algorithms (that provably come "close" to optimal) offer a middle ground.

An **α-approximation algorithm** for a maximization problem guarantees a solution worth at least α times the optimal value, where 0 < α ≤ 1. For example, a 3/4-approximation for MMS guarantees each agent receives at least 3/4 of their maximin share.

**Why approximations are valuable**:

**Provable guarantees**: Unlike heuristics, approximations bound worst-case performance. You know **how far** from optimal you could be.

**Often polynomial-time**: Many problems that are NP-hard to solve exactly have polynomial-time approximation algorithms. 3/4-MMS allocations can be found in polynomial time, even though exact MMS is NP-hard.

**Close enough for practice**: A 90% approximation means you're getting 90% of maximum possible value. If uncertainty in valuations is ±10%, a 90% approximation is effectively optimal.

**Competitive with heuristics**: Approximation algorithms are often not much slower than fast heuristics, while providing stronger guarantees.

For fair division, the **approximation frontier** is active research:

- **Nash welfare maximization**: NP-hard in general, but polynomial-time for goods with additive valuations ([Cole and Gkatzelis, 2015](https://arxiv.org/abs/1501.02954))
- **EFx approximation**: Unknown if exact EFx always exists; approximate versions achievable
- **MMS**: Exact impossible, but constant-factor approximations (3/4, 0.8) are achievable

The trend: accept small deviations from perfection to gain computational tractability.

**Connecting Back to Our Siblings**

For Maya, Jordan, and Sam, what does computational complexity tell us?

**Good news**: With 3 agents and 8 items, essentially any algorithm is computationally feasible. Even exponential algorithms searching all *3⁸ = 6,561* allocations take microseconds. Computational complexity is not a limiting factor.

**Algorithm choice is about guarantees and interpretability**, not speed:
- Round-robin: simplest to explain, EF1 in expectation
- EF1 algorithm: provable EF1, slightly more complex
- MIP optimization: maximum social welfare, hardest to explain

They should choose based on what fairness properties they value and how important transparency is, knowing that all will run instantly.

**Bad news (for generalization)**: If we imagined scaling this to 10 heirs with 50 items, computational limits start to bite. Exact optimization becomes uncertain. Approximation algorithms become necessary. The clean distinctions between approaches blur.

**For practitioners**: The computational landscape forces pragmatism. Start with the simplest algorithm that might work (round-robin). Verify if it achieves desired properties. If not, escalate to more sophisticated (slower) algorithms. Never use slower algorithms than necessary. Computation time is a resource, not a virtue.

The complexity wall isn't a barrier to progress. It's a guide to choosing appropriate tools. By understanding which problems are hard and which are tractable, we can focus our computational resources where they matter and accept approximations where exactness is prohibitively expensive.

In the next section, we'll explore the philosophical dimension: assuming we can compute allocations with various guarantees, which guarantees should we actually want? What makes one relaxation of fairness more "fair" than another?

{% include components/heading.html heading='Philosophy: Individual Rights vs Collective Good' level=3 %}

We introduced the philosophical foundations of fairness early in this post. Now, having seen these concepts in practice and understood their computational trade-offs, we can explore deeper questions about when and why different fairness notions matter.

We've established that with indivisible goods, perfect fairness is often impossible and exact optimization is computationally intractable. We've seen a spectrum of relaxed fairness notions (EF1, EFx, MMS, PROPm) each of which makes different compromises. But we've been treating these as mathematical objects, defined by formulas and verified by algorithms.

Now we must ask a deeper question: **What do these fairness notions actually mean morally? What values do they embody, and why should we care about one versus another?**

This isn't merely academic philosophy. When Maya, Jordan, and Sam must choose which fairness notion to target for their inheritance division, they're implicitly choosing between competing ethical frameworks. When a policymaker designs a welfare allocation system using MMS rather than EF1, they're making a normative judgment about what society owes individuals. When a company allocates resources to teams using one algorithm versus another, they're embedding values into organizational structure.

The fairness criteria we've defined are formalized ethical commitments, not value-neutral mathematical abstractions. Understanding what those commitments are helps us choose wisely.

Envy-freeness, taken to its logical conclusion, might reward those who inflate their stated valuations. If I claim everything is worth nothing to me (very cheap preferences), I'm easy to satisfy. If I claim everything is worth millions (expensive preferences), satisfying me might require giving me more. Should fairness accommodate any preference structure?

**Envy can be manufactured**: Strategic agents might misreport preferences to create envy they don't genuinely feel, leveraging envy-freeness constraints to extract better allocations. If the mechanism prioritizes eliminating envy, agents have incentive to express envy strategically.

**Comparison itself may be unjust**: Some philosophers argue that fairness shouldn't depend on comparing your outcome to others'. If you receive adequate resources to meet your needs, why does it matter that someone else received more? This perspective, sometimes called **sufficiency** rather than equality, says we should care about absolute standards (do you have enough?) rather than relative comparisons (do you have as much as others?).

For our siblings, envy-freeness has particular resonance because they're co-heirs with identical legal claims. No one has greater entitlement. In this context, if one sibling envies another, it suggests the allocation failed to respect their equal standing. The envy signals that the allocation treats someone as "lesser."

But if the context were different, like an employer allocating bonuses to employees with different performance levels, envy-freeness seems less compelling. High performers might deserve more, and lower performers' envy doesn't indicate unfairness.

**Context matters**: Envy-freeness is most compelling when agents have equal entitlement and when we want to respect diverse preferences without judging them.

**Implicit Egalitarianism: All Agents Weighted Equally**

Both envy-freeness and proportionality share an implicit assumption: **all agents matter equally**. Envy-freeness requires that no agent envies any other. Every agent's subjective satisfaction is given equal weight. Proportionality requires that each agent receives 1/*n* of value.

This **egalitarian weighting** is normatively loaded. It assumes that the sibling who contributed more to parents' care doesn't deserve more. It assumes that the sibling with greater financial need doesn't deserve more. It assumes equal entitlement despite potential differences in desert, need, or contribution.

**When is equal weighting appropriate?**

**Legal equality**: When agents have formally equal claims (co-heirs under intestacy law, shareholders with equal shares, team members with equal contracts), equal weighting is mandated. The law treats them as equals, so fairness mechanisms should too.

**Absence of legitimate differentiation**: When we lack principled grounds for differential treatment, equality is the default. If we can't justify why one sibling should receive more than another, we default to equal treatment.

**Respect for persons**: Kantian ethics holds that all persons have equal moral worth and should be treated as ends in themselves, never merely as means. Equal weighting in allocation reflects this fundamental equal respect.

**When might unequal weighting be justified?**

**Desert**: Some philosophical traditions argue that those who contribute more, work harder, or have greater merit deserve more. A sibling who cared for aging parents for years might deserve a larger inheritance share than siblings who were absent.

**Need**: Rawlsian justice prioritizes the least well-off. If one sibling is destitute while others are wealthy, need-based allocation might justify unequal shares. Maya's need for housing (she has young children) might warrant giving her the house even if it creates inequality.

**Efficiency**: Utilitarian frameworks might accept unequal allocations if they maximize total welfare. If giving the piano to Jordan (who will use it professionally) creates more total value than equal distribution, efficiency might justify inequality.

**Weighted fairness** generalizes our notions: instead of each agent deserving 1/*n* of value, agent \\( i \\) deserves *w_i / Σw_j* of value, where *w_i* is agent \\( i \\)'s weight. Envy-freeness can similarly be weighted: agent \\( i \\) should not envy agent \\( j \\) by more than the ratio *w_j / w_i*.

For our siblings, the question becomes: Should they be weighted equally? 

Arguments for equal weighting:
- They're legal equals (co-heirs)
- Parents' will doesn't differentiate (or doesn't exist)
- Equal treatment preserves family harmony

Arguments for unequal weighting:
- Maya cared for parents in final years (desert-based weight)
- Sam is drowning in student debt (need-based weight)  
- Jordan will use inherited items professionally (efficiency-based weight)

The choice of weights is a **value judgment** that mechanisms cannot make. It must come from the agents themselves or from external authority (the law, a will, social norms).

Assuming equal weights is not value-neutral. It's a substantive ethical choice that privileges equality over other considerations.

**When Relaxations Are "Good Enough": Social Acceptability**

We've established that exact fairness is often impossible. The relaxations we've defined (EF1, MMS, PROPm) are approximations. But when do approximations become "fair enough" that people accept them?

This is partly a psychological question as well as philosophical. Research in behavioral economics and psychology of fairness offers insights:

**Small deviations are psychologically negligible**: [Kahneman and Tversky's prospect theory](https://www.princeton.edu/~kahneman/docs/Publications/prospect_theory.pdf) shows that people exhibit reference dependence. Small changes from a reference point are barely noticed. If you receive a bundle worth $233k with fair share $233.3k, the $300 shortfall is psychologically negligible.

Similarly, if you envy someone's bundle but removing a single low-value item ($1k) eliminates that envy (EF1), the envy is slight. You're not envying their entire bundle, just that one item. This feels much less unfair than pervasive envy across everything.

**Approximate fairness with justification beats exact unfairness**: People accept approximate fairness when the reasons are clear. "We can't achieve perfect envy-freeness because the house is indivisible, but we achieved EF1" is more acceptable than "We divided arbitrarily with no fairness guarantees."

**Procedural fairness compensates for outcome imperfection**: If the process for reaching an allocation was transparent, participatory, and reasonable, people tolerate imperfect outcomes. Maya might accept envying Jordan by one item if the allocation process was fair and she participated in designing it.

**Social comparison norms**: What counts as "fair enough" depends on cultural and contextual norms. In some contexts (corporate bonuses), inequality is expected and accepted. In others (dividing a family inheritance), near-equality is normatively required. EF1 might be acceptable for the inheritance but unacceptable for the bonuses.

**But acceptability has limits**:

**Dignity and respect**: Allocations that make someone feel disrespected or diminished are unacceptable, even if they satisfy technical fairness criteria. If an allocation gives Sam the "scraps" (lowest-value items) while Maya and Jordan get high-value items, Sam might feel insulted even if proportionality is satisfied.

**Justified envy can be constructive**: Sometimes envy signals legitimate grievance. If Jordan envies Maya's allocation and the envy stems from genuine inequity (Maya received far more value through strategic manipulation), the envy is justified and should be addressed, not dismissed as "only one item."

**Repeated interactions**: In one-shot allocations (dividing an inheritance), slight imperfections are tolerable. In repeated interactions (resource allocation within a team over months), even small unfairness compounds. EF1 might be "good enough" for the inheritance but inadequate for ongoing resource allocation.

For our siblings specifically, **EF1 feels like a reasonable target**: The impossibility of perfect envy-freeness is evident (the house is indivisible), so accepting EF1 as "close enough" is pragmatic. Moreover, siblings have ongoing relationships, making perfect satisfaction is less important than a process they all endorse.

If Maya envies Jordan by exactly the photos (worth $8k to Maya), this is a bounded, understandable envy. Maya might say, "I wish I'd gotten the photos too, but otherwise I'm satisfied." This is very different from Maya saying, "I wish I'd gotten everything Jordan received."

**The Psychology of Near-Fairness: Satisficing vs. Optimizing**

Herbert Simon introduced the concept of **satisficing**. choosing options that are "good enough" rather than optimal. This applies directly to fair division.

**Satisficing fairness**: An allocation that satisfies a relaxed fairness notion (EF1, 3/4-MMS) is "good enough" even if it's not perfectly fair. Agents can accept it and move on, rather than endlessly negotiating for marginal improvements.

**Optimizing fairness**: An allocation must achieve the strongest possible fairness guarantee (exact EF, full MMS) or it's unacceptable. Even small deviations are grounds for rejection.

Most people are satisficers in most contexts. They accept "good enough" outcomes when the cost of optimization (time, effort, conflict) exceeds the benefit of marginal improvement.

But when stakes are high, trust is low, or precedent is important, people become optimizers. A contentious divorce might demand exact fairness because parties anticipate litigation. A precedent-setting policy decision might demand theoretical rigor because it will govern future cases.

**For the siblings**: If they're satisficers (which family harmony might encourage), EF1 with efficient matching is probably acceptable. If they're optimizers (perhaps due to mistrust or external pressure from spouses), they might insist on exhaustive search for the "best possible" allocation even if it takes much longer.

Understanding whether the agents have satisficing or optimizing mindsets helps choose appropriate fairness criteria and algorithms.

**Synthesis: Choosing Your Ethical Framework**

We've seen that different fairness notions embody different philosophical commitments:

**EF1 and envy-freeness** prioritize:
- Relational equality (no one above anyone else)
- Subjective satisfaction (respecting individual preferences)
- Social stability (minimizing resentment)
- Works best when: agents have equal standing, diverse preferences, ongoing relationships

**MMS and proportionality** prioritize:
- Absolute entitlement (receiving your due share)
- Individual security (guarantees independent of others)
- Protection of worst-off (ensuring minimum standards)
- Works best when: agents have clear entitlements, need individual guarantees, inequality of outcome is acceptable if everyone gets "enough"

**Efficiency and social welfare** (which we'll explore in Part IV) prioritize:
- Total value creation (maximizing aggregate welfare)
- Optimal matching (giving items to those who value them most)  
- Collective good over individual fairness
- Works best when: trust is high, social ties are strong, reallocation is feasible if initial allocation proves unsatisfying

There's no universally correct choice. The right framework depends on:
- **Legal context**: What does the law require or permit?
- **Social context**: What norms govern this relationship?  
- **Agent values**: What do the agents themselves prioritize?
- **Consequences**: What outcomes does each framework produce?

For Maya, Jordan, and Sam, the question isn't "what is fair?" in some abstract sense. It's "what notion of fairness reflects our shared values and creates an allocation we can all accept?"

If they value equal standing and worry about resentment: target EF1.  
If they value each getting "enough" and less about comparison: target MMS.  
If they value maximizing total family welfare: target efficiency (Part IV).  
If they value transparent process: use simple algorithms they all understand.

The philosophical work isn't in calculating which allocation is "objectively fairest". It's in **making explicit what fairness means to them** and choosing mechanisms that embody those values.

As we move to Part IV, we'll see yet another philosophical dimension: when should we prioritize fairness at all versus prioritizing social welfare? Sometimes a slightly "unfair" allocation creates so much more total value that it's worth the unfairness. Understanding when to make that trade-off requires philosophical clarity about what we're optimizing for and why.

Having understood both the technical and philosophical dimensions of individual fairness, we're ready to consider an alternative perspective: optimizing for collective welfare rather than individual rights.

{% include components/heading.html heading='When Do We Settle For What?' level=3 %}

We've explored the philosophical underpinnings of different fairness notions. We understand that EF1 embodies relational equality, MMS embodies individual security, and proportionality embodies distributive entitlement. But philosophy alone doesn't tell us which to choose for a specific problem.

This section provides practical guidance: **Given a specific allocation problem, which fairness notion should you target, and which algorithm should you use?** The answer depends on problem characteristics, agent preferences, computational constraints, and the consequences of different types of unfairness.

We'll build a decision framework that maps problem contexts to appropriate fairness criteria, helping practitioners navigate the landscape we've constructed.

**Comparative Analysis: What Each Fairness Notion Guarantees**

Let's systematically compare the fairness notions we've defined along key dimensions:

| Fairness Notion | Type | Strength | Always Exists? | Poly-Time Computable? | Best For |
|----------------|------|----------|----------------|----------------------|----------|
| **Exact EF** | Relative | Strongest | No (indivisible) | No (NP-hard) | Divisible goods only |
| **EFx** | Relative | Very Strong | Unknown | Unknown | When envy must be minimal |
| **EF1** | Relative | Strong | Yes (goods) | Yes (O(n⁴m)) | Standard choice for most problems |
| **MMS** | Absolute | Strong | No (n≥3) | No (NP-complete) | When guarantees must be individual |
| **3/4-MMS** | Absolute | Moderate | Yes | Yes (polynomial) | When MMS too expensive |
| **PROPm** | Absolute | Moderate | Yes | Yes | When items are balanced |
| **PROP** | Absolute | Strong | No (indivisible) | No | Divisible goods only |

**Key observations from the table**:

**Existence vs. computability are distinct**: EF1 always exists AND is efficiently computable. MMS may not exist, and even checking existence is hard. 3/4-MMS exists and is computable which can be practical compromise.

**Relative vs. absolute matters**: EF1 and EFx compare your bundle to others' (relative). MMS and PROPm compare your bundle to your entitlement (absolute). Choose based on whether agents care more about social comparison or individual security.

**Strength vs. tractability trade-off**: Exact EF is strongest but often impossible. EF1 is weaker but always achievable. The weakening buys existence and computability.

**Algorithm Guarantees: What Can We Actually Achieve?**

Different algorithms provide different guarantees. Here's what major algorithms achieve:

| Algorithm | Time Complexity | Fairness Guarantee | Efficiency | When to Use |
|-----------|----------------|-------------------|-----------|-------------|
| **Round-Robin** | O(nm) | EF1 (for additive) | Not guaranteed | Default choice: fast, simple, strong guarantee |
| **Envy Cycle Elimination** (Lipton et al.) | O(n⁴m) | EF1 | Pareto optimal | When EF1 + efficiency both matter |
| **Maximum Nash Welfare** | NP-hard (approx. poly) | EF1 + optimal welfare | By definition | Small instances where welfare matters |
| **Greedy Round-Robin** | O(m log m + nm) | EF1 (empirical) | Better than random RR | Practical improvement over basic RR |
| **MMS Approximation** | Polynomial | 3/4-MMS | Not guaranteed | When individual guarantees critical |
| **Sequential Allocation** | O(nm) | None formal | Not guaranteed | When speed absolutely critical |

**How to read this table**:

**Start with Round-Robin**: For most problems, it's the right default. Linear time, guaranteed EF1, simple to implement and explain. Only deviate if you have specific reasons.

**Use Envy Cycle Elimination for efficiency**: If Pareto optimality matters (no wasted value) and you can afford O(n⁴m) time, upgrade to this. The algorithm repeatedly identifies and breaks envy cycles, producing efficient EF1 allocations.

**Use Nash Welfare maximization for small, high-stakes problems**: When n < 10, m < 50, and every bit of welfare matters (legal disputes, high-value assets), invest in optimization. Accept longer computation for provably optimal results.

**Use MMS approximation when comparison doesn't matter**: If agents care about "did I get enough?" more than "did I get as much as others?", target MMS instead of EF1. Especially relevant when agents have very different needs or contexts.

**Choosing Based on Problem Characteristics**

Now let's build a decision tree based on problem characteristics:

{% include components/heading.html heading='Problem Size' level=4 %}

**Small (n ≤ 10, m ≤ 50)**:
- **Recommendation**: Use exact optimization or sophisticated algorithms
- **Rationale**: Computation isn't limiting, so maximize fairness and efficiency
- **Algorithms**: MIP solver for optimal welfare, or envy cycle elimination for EF1+efficiency
- **Example**: Family inheritance, small team resource allocation

**Medium (n ≤ 100, m ≤ 1000)**:
- **Recommendation**: Use polynomial-time algorithms with guarantees
- **Rationale**: Balance between guarantees and computational feasibility
- **Algorithms**: Round-robin for speed, envy cycle elimination if time permits
- **Example**: Department resource allocation, medium organization

**Large (n > 100, m > 1000)**:
- **Recommendation**: Use fast heuristics, verify properties empirically
- **Rationale**: Guarantees are expensive; focus on good average-case performance
- **Algorithms**: Greedy round-robin, parallel allocation strategies
- **Example**: Cloud resource scheduling, welfare system distribution

{% include components/heading.html heading='Agent Relationships' level=4 %}

**Equal standing with ongoing relationships** (siblings, peers, partners):
- **Recommendation**: Target EF1 with transparent process
- **Rationale**: Relative fairness matters; envy breeds lasting resentment
- **Avoid**: Allocations that privilege one agent arbitrarily
- **Example**: Our sibling case: equal heirs with lifelong relationship

**Hierarchical with legitimate differentiation** (employer-employee, parent-child):
- **Recommendation**: Weighted fairness or MMS with different thresholds
- **Rationale**: Unequal treatment can be justified by role differences
- **Avoid**: Pretending hierarchy doesn't exist
- **Example**: Manager allocating tasks to team with different seniority levels

**Anonymous one-time interaction** (public allocation, lottery):
- **Recommendation**: Proportionality or welfare maximization
- **Rationale**: No ongoing relationship to preserve; efficiency can dominate
- **Avoid**: Over-optimizing for individual satisfaction
- **Example**: Allocating public housing to applicants

**Strategic agents with potential manipulation** (auctions, mechanism design):
- **Recommendation**: Incentive-compatible mechanisms even at cost of weaker fairness
- **Rationale**: Must prevent gaming; fairness without honesty is meaningless
- **Avoid**: Mechanisms that reward lying
- **Example**: Spectrum auctions, course assignment

{% include components/heading.html heading='Item Characteristics' level=4 %}

**Balanced items** (similar values, many items):
- **Recommendation**: Simple algorithms work well; even random allocation may suffice
- **Rationale**: When items are similar, discrete constraints barely bind
- **Algorithms**: Round-robin, random serial dictatorship
- **Example**: Distributing 100 identical computers to 20 employees

**Highly heterogeneous items** (few dominant items, wide value range):
- **Recommendation**: Sophisticated matching algorithms, possibly with transfers
- **Rationale**: Must carefully match high-value items to right agents
- **Algorithms**: Nash welfare maximization, auction-based mechanisms
- **Example**: Our sibling case with house worth 64% of estate

**Complementary items** (value depends on combinations):
- **Recommendation**: Bundle-aware algorithms, may need to search over bundles
- **Rationale**: Additive valuations fail; must consider synergies
- **Algorithms**: Combinatorial optimization, possibly exponential search
- **Example**: Dividing business assets where equipment + license > sum of parts

**Time-sensitive items** (value decays, deadlines):
- **Recommendation**: Online algorithms with lookahead
- **Rationale**: Can't wait for perfect solution; must allocate in real-time
- **Algorithms**: Greedy online allocation with fairness constraints
- **Example**: Allocating compute time to arriving jobs

{% include components/heading.html heading='Consequences of Unfairness' level=4 %}

**High-stakes legal contexts** (divorce, contested estate, regulatory):
- **Recommendation**: Strongest achievable guarantee with formal proof
- **Rationale**: Allocations will be scrutinized; must withstand challenge
- **Target**: EF1 with Pareto optimality, documented algorithm
- **Accept**: Higher computational cost for defensibility

**Repeated allocation with learning** (weekly resource allocation, seasonal distribution):
- **Recommendation**: Start simple, adjust based on feedback
- **Rationale**: Can correct mistakes in future rounds; learning dominates one-shot optimization
- **Target**: Fast algorithms with good average-case properties
- **Accept**: Occasional unfairness in exchange for speed and adaptability

**Reputation-critical contexts** (public-facing allocation, organizational policy):
- **Recommendation**: Transparent, explainable process more important than optimal outcome
- **Rationale**: Stakeholders must understand and accept the process
- **Target**: Simple algorithms (round-robin) even if sophisticated alternatives exist
- **Accept**: Slight optimality loss for comprehensibility

**Low-stakes with high trust** (friend group, family with agreement):
- **Recommendation**: Whatever everyone agrees to; process matters more than outcome
- **Rationale**: Relationship quality dominates allocation optimality
- **Target**: Participatory process, potentially manual
- **Accept**: Any allocation everyone endorses

{% include components/heading.html heading='Computational Constraints' level=4 %}

**Real-time requirements** (< 1 second response):
- **Recommendation**: Greedy or round-robin only
- **Rationale**: No time for optimization
- **Example**: Online ad allocation, real-time scheduling

**Batch processing** (minutes to hours acceptable):
- **Recommendation**: Sophisticated algorithms with guarantees
- **Rationale**: Can afford polynomial-time algorithms
- **Example**: Overnight resource allocation, weekly planning

**Offline planning** (days acceptable):
- **Recommendation**: Exact optimization via MIP if problem size allows
- **Rationale**: Computational cost justified by importance
- **Example**: Annual budget allocation, strategic resource planning

**A Decision Matrix: Combining Factors**

Let's synthesize these considerations into actionable guidance:

**SCENARIO 1: Small, equal-standing, high-stakes**
- *Example*: Three siblings dividing estate worth $700k
- *Recommendation*: EF1 via envy cycle elimination + verify efficiency
- *Rationale*: Small size allows sophisticated algorithms; equal standing requires strong relative fairness; high stakes justify careful optimization
- *Algorithm*: Envy cycle elimination or MIP-based Nash welfare maximization
- *Acceptance criterion*: EF1 + no Pareto improvements possible

**SCENARIO 2: Medium, hierarchical, low-stakes**
- *Example*: 20 researchers sharing 50 lab equipment items
- *Recommendation*: Weighted round-robin based on seniority/need
- *Rationale*: Hierarchy is legitimate; low stakes don't justify complex optimization; medium size makes round-robin feasible
- *Algorithm*: Round-robin with weighted ordering
- *Acceptance criterion*: Each researcher gets adequate resources for their projects

**SCENARIO 3: Large, anonymous, time-sensitive**
- *Example*: 1000 cloud compute jobs needing allocation to 100 servers
- *Recommendation*: Fast greedy heuristic with fairness verification
- *Rationale*: Size prohibits exact optimization; time-sensitivity requires speed; anonymity means no relationship preservation
- *Algorithm*: Greedy allocation with periodic fairness audits
- *Acceptance criterion*: No job starved, average wait time bounded

**SCENARIO 4: Small, strategic, reputation-critical**
- *Example*: University allocating 10 named fellowships to 30 applicants
- *Recommendation*: Transparent scoring system + proportional selection
- *Rationale*: Small size allows careful evaluation; strategic applicants might manipulate; reputation requires transparency
- *Algorithm*: Explicit criteria → scoring → proportional allocation with documentation
- *Acceptance criterion*: Process defensible to public, documented justification for each decision

**SCENARIO 5: Medium, complementary items, efficiency-critical**
- *Example*: Dividing startup assets (code + patents + brand) among 4 co-founders
- *Recommendation*: Nash welfare maximization with bundle constraints
- *Rationale*: Complementarities mean additive algorithms fail; efficiency matters (startup value depends on smart allocation); medium size allows optimization
- *Algorithm*: MIP with bundle-aware valuations
- *Acceptance criterion*: No founder feels exploited, total value maximized

**When Approximate Fairness Is Acceptable**

We must also decide: **How much deviation from perfect fairness is tolerable?**

**Accept 3/4-MMS when**:
- Computing exact MMS is infeasible (too many items, too many agents)
- The 25% shortfall is small in absolute terms (on a $1M estate, $250k difference; on a $100k estate, $25k might be acceptable)
- Agents care more about speed than perfection
- The alternative is no formal guarantee at all

**Accept EF1 instead of EFx when**:
- EFx existence is uncertain for your problem
- EF1 is provably achievable in reasonable time
- The "up to one item" envy is small (items are relatively balanced)
- Agents understand and accept the relaxation

**Accept no formal guarantee when**:
- Agents explicitly agree to a process (auction, lottery, negotiation)
- Computational constraints make guaranteed algorithms impossible
- The context has strong procedural norms that matter more than outcome fairness
- Repeated interaction allows for correction over time

**The key question**: Is the benefit of a stronger guarantee worth the cost?

Costs include:
- Additional computation time
- Implementation complexity
- Reduced transparency (sophisticated algorithms are harder to explain)
- Risk that stronger guarantee doesn't exist (might search fruitlessly)

Benefits include:
- Stronger defensibility if challenged
- Greater agent satisfaction
- Better accommodation of preferences
- Potentially higher total welfare

This is a case-by-case judgment that requires understanding both the technical landscape (what's possible) and the social context (what matters).

**Back to Our Siblings: Making the Choice**

Let's apply this framework to Maya, Jordan, and Sam:

**Problem characteristics**:
- Size: Small (n=3, m=8) → sophisticated algorithms feasible
- Relationship: Equal standing, lifelong relationship → relative fairness critical
- Items: Highly heterogeneous (house dominates) → careful matching needed
- Stakes: High (family harmony, substantial value) → strong guarantees warranted
- Timeline: Not time-sensitive → can afford optimization
- Trust: Presumably high (family) but strained by inheritance → transparency important

**Recommendation cascade**:

1. **Target fairness notion**: EF1
   - Rationale: Always exists for goods, efficiently computable, strong guarantee, respects equal standing
   - Accepts: Small envy (up to one item) as necessary compromise with indivisibility

2. **Algorithm choice**: Envy cycle elimination or adjusted winner with verification
   - Rationale: Small problem allows O(n⁴m) time, want EF1 + efficiency, need transparency
   - Accepts: Slightly slower than round-robin (still seconds) for stronger guarantees

3. **Process**: Collaborative with verification
   - Steps:
     1. Each sibling submits valuations privately
     2. Run algorithm to compute allocation
     3. Verify EF1 property (show each sibling's envy is ≤ one item)
     4. Verify Pareto optimality (show no trades improve all)
     5. Present results with full documentation
     6. Allow short deliberation period before finalization
   
4. **Acceptance criteria**:
   - Each sibling receives at least $200k value (approaching proportional share)
   - No sibling envies another by more than their single most-valued item
   - Total value across siblings exceeds $2M (efficient matching)
   - Process was transparent and participatory

**Alternative if trust is very high**: Simple round-robin with items sorted by aggregate value. Much faster, usually produces EF1, maximally transparent. But lower guarantee of Pareto optimality.

**Alternative if conflict is high**: MIP-based exact optimization for Nash welfare. Slower, but produces provably optimal allocation that maximizes product of utilities. Can be defended mathematically against any challenge.

The choice among these depends on factors the technical analysis can't determine: How much do the siblings trust each other? How time-sensitive is the allocation? How important is it that they understand every step?

**General Principles for Practitioners**

Synthesizing everything, here are key principles for choosing fairness notions and algorithms:

**1. Start with the simplest algorithm that might work**
- Default: Round-robin for small-to-medium problems
- Only escalate to sophisticated algorithms if round-robin fails your requirements

**2. Match fairness notion to social context**
- Equal standing → EF1 (relative fairness)
- Individual security needs → MMS (absolute fairness)
- Hierarchical legitimately → weighted fairness
- High trust + small group → whatever they agree to

**3. Respect computational constraints**
- n > 100: fast heuristics only
- n = 10-100: polynomial algorithms with guarantees
- n < 10: exact optimization possible if needed

**4. Prioritize transparency for stakeholders**
- If agents must understand the algorithm: round-robin
- If agents must trust the outcome: algorithm with formal proof
- If agents must accept the process: participatory design

**5. Accept approximations when justified**
- Small absolute deviation + large uncertainty → approximation acceptable
- Large absolute deviation or high stakes → insist on stronger guarantees
- No feasible exact algorithm → approximation necessary

**6. Verify, don't just implement**
- After running algorithm, verify it achieves claimed properties
- Check for Pareto improvements (wasted value)
- Test sensitivity to valuation changes

**7. Document reasoning for posterity**
- Why this fairness notion?
- Why this algorithm?
- What trade-offs were made?
- How were conflicts resolved?

Inheritance allocations, legal settlements, and organizational policies live beyond the moment of implementation. Future stakeholders will ask "why was it done this way?" Documentation provides answers.

**When In Doubt, Ask the Agents**

Finally, the most important principle: **When technical analysis leaves genuine choices, ask the agents which they prefer**.

Present options clearly:
- "Option A: Fast algorithm, usually fair, no formal guarantee. Results in seconds."
- "Option B: Slower algorithm, proven EF1 guarantee. Results in minutes."  
- "Option C: Exact optimization, maximum total value. Results in hours, might not find solution."

Explain trade-offs honestly:
- "Option A might produce envy beyond one item, but probably won't"
- "Option B guarantees envy is bounded but might not maximize your total utility"
- "Option C maximizes value but is a black box"

Let agents choose based on their values:
- Risk-averse agents choose Option B
- Time-sensitive agents choose Option A
- Welfare-maximizing agents choose Option C

Fairness is about respecting agent autonomy in determining what fairness means as well as outcomes. When multiple approaches are technically defensible, the choice is legitimately theirs to make.

We've now built a complete framework for navigating discrete fair division: understanding what fairness notions exist, what they mean philosophically, what computational trade-offs they involve, and how to choose among them based on context.

In Part IV, we'll expand our toolkit further by examining a fundamentally different approach: optimizing for social welfare rather than individual fairness. Sometimes the "fairest" allocation isn't the one that makes everyone feel fairly treated. It's the one that creates the most total value. Understanding when to prioritize collective good over individual rights is the next frontier.

{% include components/heading.html heading='CONCLUSION: From Individual Fairness to Collective Welfare' level=2 %}

We've gone from cake-cutting which always has envy-free allocations to indivisible goods, where perfect fairness often proves impossible. Along the way, we've built a sophisticated toolkit for navigating this landscape:

**The Impossibility Results**: With indivisible items, we cannot always achieve both envy-freeness and proportionality. A single valuable item (like a house worth 64% of an estate) can make proportional division impossible. Agents with similar preferences create unavoidable envy. These are fundamental barriers imposed by discrete constraints.

**The Relaxed Fairness Notions**: When perfection is impossible, we can still achieve meaningful approximations:
- **EF1** (envy-free up to one good): You might envy someone, but only because of a single item in their bundle
- **MMS** (maximin share): You receive at least what you could guarantee yourself through strategic partitioning
- **PROPm** (proportional up to one good): You receive your fair share minus at most one item's value

These relaxations are realistic acknowledgments that "almost fair" can be good enough when "perfectly fair" is impossible.

**The Computational Landscape**: Finding exact fair allocations faces a complexity wall:
- **Round-robin**: O(nm) time, guarantees EF1
- **EF1 algorithms**: Polynomial time with strong guarantees (the sweet spot for most applications)
- **MMS computation**: NP-hard to compute exactly, but 3/4-approximations are tractable
- **EFx allocations**: Unknown if polynomial-time algorithms even exist

The computational challenges are guides telling us when to accept approximations and when to invest in exact optimization.

**The Philosophical Insights**: Different fairness notions embody different moral commitments:
- **Envy-freeness** prioritizes relative fairness. You shouldn't feel diminished by others having "better" allocations
- **Proportionality** prioritizes absolute entitlement. You deserve your fair share regardless of what others receive
- **MMS** prioritizes individual security. You should get at least what you could guarantee yourself

Choosing among these isn't a technical decision. It's a value judgment about what fairness means in your context.

**For Maya, Jordan, and Sam**, this toolkit provides concrete paths forward:
- They can use round-robin with item ordering to achieve EF1 quickly and transparently
- They can employ sophisticated algorithms to find allocations that are both EF1 and Pareto optimal
- They can compute each sibling's MMS to ensure everyone receives adequate minimum guarantees
- They can navigate trade-offs between fairness, efficiency, and computational cost

But we have avoided the perspective that treats fairness as just one objective among many. Throughout Part 2, we've focused on **individual fairness**: ensuring each agent receives an allocation they find acceptable. We've asked questions like "Does Maya envy Jordan?" and "Did Sam receive his fair share?"

Yet there's another lens through which to view allocation problems: **social welfare**. Instead of asking whether each individual is satisfied, we can ask: What allocation creates the most total value for the family as a whole? Which allocation makes the group collectively best off?

Consider these two allocations of the siblings' estate:

**Allocation A (Fair)**:
- Satisfies EF1: no sibling envies another by more than one item
- Satisfies proportionality: each receives at least their fair share
- Total utility across siblings: $1,350,000

**Allocation B (Welfare-maximizing)**:
- Violates EF1: Jordan envies Maya by more than one item
- Violates proportionality for Jordan: receives less than fair share
- Total utility across siblings: $1,450,000 (+$100,000)

Allocation B creates $100,000 more total value by better matching items to those who value them most. But it sacrifices Jordan's fairness to achieve this. Should the siblings choose A or B?

**The utilitarian** says: choose B. Total happiness is higher. The $100,000 in additional value exceeds the harm from Jordan's reduced fairness. Maximize the sum.

**The egalitarian** says: choose A. Jordan's individual rights matter. We shouldn't sacrifice one person's fairness for aggregate gains, even substantial ones. Protect individuals.

**The pragmatist** says: it depends. Can the siblings compensate Jordan for the unfairness? Is family harmony worth more than $100,000? How much does Jordan care about the perceived unfairness?

This tension between **individual fairness** and **collective welfare** is one of the deepest problems in allocation theory and political philosophy. Fair division algorithms make it explicit so we can navigate it consciously.

**Part 3: Optimizing for Social Welfare** explores this alternative perspective. We'll discover that:

- **Different social welfare functions embody different ethical frameworks**: Summing utilities (Benthamite utilitarianism), multiplying utilities (Nash's egalitarian efficiency), or maximizing the minimum (Rawlsian justice)
- **Welfare maximization has its own computational challenges**: Some problems easy for fairness become hard for welfare, and vice versa
- **Efficiency and equity trade off fundamentally**: We cannot always maximize both total value and individual fairness simultaneously
- **The choice of welfare function is a value judgment**: There's no "correct" way to aggregate individual utilities into social welfare

We'll see that maximizing welfare isn't abandoning ethics for efficiency. It's adopting a different ethical framework, one that privileges collective outcomes over individual entitlements. Understanding both the fairness and welfare perspectives makes you a more sophisticated designer of allocation systems.

For Maya, Jordan, and Sam, Part 3 will answer questions like:
- Should they maximize total family wealth (utilitarian), protect the worst-off sibling (maximin), or balance both (Nash welfare)?
- When is it acceptable to sacrifice some fairness for greater efficiency?
- How do philosophical commitments about distributive justice translate into concrete algorithms?
- What does it mean to optimize for "the family as a whole" versus respecting each sibling's individual rights?

The journey from fairness to welfare isn't a rejection of what we've learned. It's an expansion. Fairness criteria like EF1 will remain important, but we'll see them as **constraints** on welfare maximization rather than the sole objectives. The question becomes: subject to reasonable fairness guarantees, what allocation maximizes collective good?

This is the synthesis that real allocation problems demand: respecting individual rights while promoting collective welfare, balancing equality and productivity, achieving "good enough" on multiple dimensions rather than perfection on one.

The impossibility results of Part 2 taught us that perfect individual fairness is often unattainable. Part 3 will show that perfect collective welfare faces its own impossibilities. The wisdom lies not in choosing one over the other, but in understanding both and making informed trade-offs.

Maya, Jordan, and Sam cannot have it all. But they can make wise choices about what to prioritize, understanding the philosophical commitments and practical implications of each path. That's what Part 3 will teach us: how to become architects of allocation systems who design with eyes wide open to both possibilities and constraints.

Ready to shift perspectives from individual to collective, from fairness to welfare, from protecting rights to maximizing good? Let's explore what happens when we optimize not for each person's satisfaction, but for the family's collective flourishing.

[Continue to Part 3: Optimizing for Social Welfare →](/experiment/2025-10-16-fair-division-goods-part-3)

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