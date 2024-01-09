---
layout: post
title:  "An Introduction to Optimization: Linear Programming"
description: Optimizing continuous variables based on constraints using Google's Operations Research library for Python, ORTools.
keywords: linear,programming,optimization,example,tutorial,simplex
tags: math operations-research python
---

{% include components/heading.html heading='Getting Started' level=2 %}

During my time working in fundraising, I worked on the web development side, building and maintaining websites and tools for public and internal use.  Many of the problems that kept coming up in my department were optimization problems, many of which were directly related to business operations.  Producing print collateral at optimal pricing, optimizing table layouts for events, scheduling/assigning work, minimizing travel costs, etc.  Here I learned that while rule-based programming was useful automating known processes, optimization problems tend to make the biggest difference and time commitment for business decisions.  These decisions ranged from simple (minimizing paper costs for print invitations), to complex (prioritizing content based on audience demographics/donation potential).  Since moving on to other opportunities, I still dwell on the value of solving these types of optimization problems in business scenarios.

There are many types of optimization problems, but in this post I'll just show how we can solve one type: linear optimization.  Put it simply (and generically), linear optimization is where we minimize or maximize an objective function based on a variable number of linear equality and inequality constraints.

{% include components/heading.html heading='What is Linear Programming' level=2 %}

Linear programming is where we find optimal values in a feasible vector space defined by constraints represented as linear equations.  The keyword here is "represented".  The most intuitive form of constraints may be nonlinear, but can be derived into a linear form for the purpose of the linear program. 

<blockquote cite="https://en.wikipedia.org/wiki/Linear_programming">a method to achieve the best outcome (such as maximum profit or lowest cost) in a mathematical model whose requirements are represented by linear relationships <footer>Wikipedia</footer></blockquote>

There are many ways to represent a linear programming problem, but the most generalized way to represent a linear programming problem is

$$ \begin{aligned}
   minimize\space \bold{c^Tx} \\
   subject\space to\space \bold{Ax \le b} \\
   and\space \bold{x \ge 0}
\end{aligned} $$

$$  x= \begin{bmatrix}
x_1 \\
x_2 \\
\cdots \\
x_n
\end{bmatrix} 

c = \begin{bmatrix}
a_1 \\
a_2 \\
\cdots \\
a_n
\end{bmatrix}

b = \begin{bmatrix}
a_1 \\
a_2 \\
\cdots \\
a_n
\end{bmatrix}

A = \begin{bmatrix}
   a_{11} & a_{12} & \cdots & a_{1n} \\
   a_{21} & a_{22} & \cdots & a_{2n} \\
   \cdots & \cdots & \ddots & \cdots \\
   a_{m1} & a_{m2} & \cdots & a_{mn} \\
\end{bmatrix} $$

Where $$ \bold{x} $$ represents the vector of $$ n $$ variables that we are attempting to find values for, $$ c $$ and $$ b $$ are vector of $$ n $$ coefficients corresponding to $$ \bold{x} $$, and $$ A $$ is a matrix of $$ m $$ rows of constraints and $$ n $$ columns of coefficients corresponding to$$ x $$, $$c$$, and $$b $$.

$$ c^Tx $$ is called our objective function.  The objective function is the function we seek to maximize or minimize.  So in a real-life example, it would be total costs, for minimization problem, or total profits for maximization.

The bulk of our time will be spent building the constraints for  $$ A $$.  $$ A $$  largely defines how our linear program concludes what is an optimal solution to $$ c^Tx $$.  $$ A $$ is made up of $$ m $$ rows of $$ n $$ coefficients which correspond to the $$ n $$ unknown variables in $$ x $$.   Each of the rows of coefficients represent a constraint on our objective function $$ c^Tx $$.

{% include components/heading.html heading='Example: Marketing Budget' level=2 %}

So let's make this easier to understand with a more concrete example.  Let's say I am working in marketing and I need to optimize how how many conversions we get based on our advertising budget.  But my director has some allocations that she wants to make.   She has increased our total advertising budget for the month to $5,000,  would like to allocate less than $50 to Social Media (spent too much last month), Direct advertising can only be up to 25% of our budget, we need to reserve at least $1500 to pay for our E-mail service, and need to allocate at least 12% of our budget to getting previous visitors to come back to our website.  And lastly, we need to aim to get 30,000 or more visitors.

Our objective is fairly straight-forward: To maximize the number of conversions that we have each month. I'll go ahead and translate the directives from my boss into constraints.  We have the following channels


*  Social media
*  Direct marketing
*  E-mail
*  Referral (Google Remarketing)
*  Organic Search


And the following constraints:


*  Total budget is $5,000 or less
*  Social media budget less than $50
*  Direct marketing budget < 25% of total budget
*  E-mail budget is $200 or more
*  Email budget less than 5x Social media budget
*  Referral (Google Remarketing) budget is 12% or more of total budget


In order to calculate how to maximize our revenue, we will need some metrics to determine how well each channel performs, and how many conversions we get per dollar of advertising in each channel.  Normally we would get these values from Google Ads or Google Analytics.  In our matrices, each column will correspond to a specific channel, in this order

{% highlight json %}{% raw %}["Social Media", "Referral", "Organic Search", "Email", "Direct"]{% endraw %}{% endhighlight %}

Let's say that these are our conversion rates $$ C $$ and reach $$ R $$ for each channel (based loosely on a website I used to manage)

$$ C = \begin{bmatrix}
   0.0675 \\
   0.128 \\
   0.0577 \\ 
   0.1723 \\
   0.7387 \\
\end{bmatrix}

R = \begin{bmatrix}
   2 \\
   0.05 \\
   0.5 \\
   0.0004 \\
   0.001 \\
\end{bmatrix} $$

Now we need to convert these into our matrix $$ A $$ of constraints, matrix $$ b $$ for our inequality values, our corresponding $$ x $$ variables, and the $$ bounds $$ of $$ x $$ we will be optimizing:

$$ A = \begin{bmatrix}
   1 & 1 & 1 & 1 & 1 \\
   -0.25 & -0.25 & -0.25 & -0.25 & -0.75 \\
    & -1 & 0 & 0 & 0 \\
   -5 & 0 & 0 & 1 & 0 \\
   0.12 &-0.88 & 0.12 & 0.12 & 0.12 \\
   1 & 0 & 0 & 0 & 0 \\
   2 & 0.05 & 0.5 & 0.0004 & 0.001 \\
\end{bmatrix}
b = \begin{bmatrix}
   5000 \\
   0 \\
   -200 \\
   0 \\
   0 \\
   50 \\
   30000 \\
\end{bmatrix}
x = \begin{bmatrix}
   x_{\text{social}} \\
   x_{\text{referral}} \\
   x_{\text{organic}} \\
   x_{\text{email}} \\
   x_{\text{direct}} \\
\end{bmatrix}
bounds = \begin{bmatrix}
    0 & \inf \\
    0 & \inf \\
    0 & \inf \\
    0 & \inf \\
    0 & \inf \\
\end{bmatrix} $$

We've now translated our linear programming problem into <i>standard form</i>.  Now let's convert into <i>matrix form</i>

$$ \max\begin{cases}
   \bold{c}^T\bold{x}\ |\ Ax \le b\ \land x \ge\ 0 \\
\end{cases} $$

So now we should be a little more familiar with the mathematical form of linear programming problems.  Now let's see how we can go about automatically solving them using <a href="https://docs.scipy.org/doc/scipy-0.18.1/reference/generated/scipy.optimize.linprog.html">scipy.optimize.linprog</a>.  <code>linprog</code> uses the simplex algorithm, which is a very common and efficient algorithms for solving linear programming problems.  However, the simplex algorithm can only solve minimization problems, not maximization problems, like ours.  So how do we solve our problem without having to find a library that supports a different algorithm?  The simplest method would be use the concept of <a href="https://en.wikipedia.org/wiki/Duality_(mathematics)#Dimension-reversing_dualities">duality</a> to invert the coefficients in $$ C $$, converting it into a dual minimization problem.  The concept of duality in the context of linear programming is this:  Every maximization problem has a dual minimization problem with the same optimal solution.

The simplex algorithm implementation in SciPy only allows a 1-dimensional matrix of coefficients.  So for the purposes of our demonstration of the simplex algorithm, we will focus on maximizing reach $$ R $$.

{% highlight python linenos %}{% raw %}from scipy.optimize import linprog
bounds = [
    (0, None),
    (0, None),
    (0, None),
    (0, None),
    (0, None),
]
b = [5000, 0, -200, 0, 0, 50]
coefficients = [-2, -0.05, -0.5, -0.0004, -0.001]
A = [
    [1, 1, 1, 1, 1],
   [-0.25, -0.25, -0.25, -0.25, -0.75],
   [0, -1, 0, 0, 0],
   [-5, 0, 0, 1, 0],
   [0.12, -0.88,  0.12, 0.12, 0.12],
   [1, 0, 0, 0, 0],
]
res = linprog(coefficients, A_ub=A, b_ub=b, bounds=bounds)
print res
"""
     fun: -2305.0
 message: 'Optimization terminated successfully.'
     nit: 4
   slack: array([   0., 1250.,  250.,    0.,    0.,    0.])
  status: 0
 success: True
       x: array([  50.,  600., 4350.,    0.,    0.])
"""{% endraw %}{% endhighlight   %}

Only being able to use a 1-dimensional matrix for coefficients is a major barrier for solving linear programming problems.  But scipy.optimize.linprog does have a couple benefits:  it allows the developer to clearly define mathematically how the problem is modeled, and to understand exactly how the program is going to solve the problem.  Experts with intimate knowledge of how the solver works and a strong mathematical background can model their program such that the simplex algorithm will identify a solution faster.

Many specialized optimization tools have their own language syntax for creating optimization programs, which makes building the problem at runtime more painful for developers.  While software engineers and developers should understand how their code/product works,  abstraction is a generally desireable concept to have in their code.   To have a balance between abstraction and detailed control, Google's <a hef="https://developers.google.com/optimization/">ORTools</a> was built. Google ORTools provides a Python interface to many of the specialized tools for linear optimization, allowing Python developers to leverage the benefits of those specialized libraries without needing to know how each of them work.  A significant benefit of ORTools is its ability to solve linear, integer and mixed-integer problems and to define the problem at runtime.  We can then build the inputs to our linear programming problem dynamically, such as pulling the values from a database, or using domain knowledge about the problem to compute the constraints when its executed (and therefore speed up solving the problem).

Here is an ORTools implementation of our marketing budget problem

{% highlight python linenos %}{% raw %}from ortools.linear_solver import pywraplp

if __name__ == '__main__':
    channels = ['Social Media', 'Referral', 'Organic Search', 'Email', 'Direct']
    # probabilities of conversion from each of the above channels
    conversion_probabilities = [0.0675, 0.128, 0.0577, 0.1723, 0.7387]
    customer_reach = [2, 0.3, 1.8, 0.9, 2]

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
    # E-mail budget is at least $1500
    solver.Add(budgets['Email'] >= 200)
    # Email budget < 5 x Social Media
    solver.Add(budgets['Email'] <= 5 * budgets['Social Media'])
    # Referral budget >= 12% of total budget
    solver.Add(budgets['Referral'] >= .12 * total_budget)
    # Reach 30,000 or more users
    total_reach = sum([budgets[channel] * reach for channel, reach in zip(channels, customer_reach)])
    solver.Add(total_reach >= 8000)

    status = solver.Solve()

    allocation = dict()
    for channel, value in budgets.items():
        allocation[channel] = value.solution_value()
    output = dict(total_budget=total_budget.solution_value(), reach=total_reach.solution_value(), allocation=allocation)
    if status == solver.OPTIMAL:
        print('Optimal budget: $%(total_budget)r, reaching %(reach)s users' % output)
    elif status == solver.FEASIBLE:
        print('A potential sub-optimal budget: $%(total_budget)r, reaching %(reach)s users' % output)
    else:
        raise ValueError('No feasible solution found')
    print output{% endraw %}{% endhighlight   %}

Using ORTools we don't have to present our problem as a matrix, and can focus on the clearest way to write the problem, so the next developer who works on it will be able to understand what it is doing.  ORtools also abstracts away how the problem is solved, so if another method will more quickly find an optimal solution, we can change it in the <code>solver</code> constructor without having to change the rest of our logic.

{% include components/heading.html heading='Example: Bakery' level=2 %}

Let's say we own a bakery and we make biscuits and pies.  We want to optimize our revenue, so we can expand our business and distribute more of our biscuits, breads and pies.  We know the demand for each product, and how much the ingredients cost but we don't know how many to make of each in order to maximize our profits.

Here we will be doing the same thing we did when creating our marketing budget optimization function:  We are writing code to describe the constraints of our problem, so that the solver will search only the feasible vector space for potential solutions to the problem.

{% highlight python linenos %}{% raw %}from ortools.linear_solver import pywraplp

def optimize_products(products, costs, ingredients):
    solver = pywraplp.Solver('Bakery Products', pywraplp.Solver.GLOP_LINEAR_PROGRAMMING)
    total_products = len(products)
    total_ingredients = len(costs)
    ingredient_mapping = ['Sugar', 'Flour', 'Yeast', 'Almonds','Pecans', 'Zucchini', 'Cherries', 'Lemons', 'Bananas']

    product_counts = dict((product_name, solver.NumVar(product_data[0], product_data[1], product_name)) for product_name, product_data in products.items())
    ingredient_matrix = dict()
    total_product_costs = dict()
    total_product_revenue = dict()
    for product in products.keys():
        ingredient_matrix[product] = dict()
        for index, ingredient in enumerate(ingredient_mapping):
            ingredient_matrix[product][ingredient] = solver.NumVar(0, 20000, '%s - %s' % (product, ingredient))
            solver.Add(ingredient_matrix[product][ingredient] == ingredients[product][index] * product_counts[product])
        total_product_cost = solver.Sum(ingredient_matrix[product][ingredient] * costs[ingredient] for index, ingredient in enumerate(ingredient_mapping))
        total_product_revenue[product] = product_counts[product] * products[product][2]
        total_product_costs[product] = total_product_cost

    total_costs = sum(total_product_costs[product_name] for product_name in products.keys())
    total_revenue = sum(total_product_revenue[product_name] for product_name in products.keys())
    profit = total_revenue - total_costs
    solver.Maximize(profit)

    status = solver.Solve()

    summary = dict(revenue=total_revenue.solution_value(), profit=profit.solution_value(), cost=total_costs.solution_value())
    product_output = dict()
    ingredient_output = dict()

    for product, ingredients in ingredient_matrix.items():
        total_produced = product_counts[product].solution_value()
        product_revenue = total_product_revenue[product].solution_value()
        product_cost = total_product_costs[product].solution_value()
        product_profit = product_revenue - product_cost

        ingredient_data = dict()
        for ingredient, cost, in ingredients.items():
            ingredient_cost = cost.solution_value()
            ingredient_amount = ingredient_cost / costs[ingredient]
            ingredient_data[ingredient] = dict(cost=ingredient_cost, amount=ingredient_amount)
            if ingredient not in ingredient_output:
                ingredient_output[ingredient] = dict(cost=0.0, amount=0.0)
            ingredient_output[ingredient]['cost'] += ingredient_cost
            ingredient_output[ingredient]['amount'] += ingredient_amount
        product_output[product] = dict(total=total_produced, profit=product_profit, revenue=product_revenue, cost=product_cost, ingredients=ingredient_data)
    if status == solver.INFEASIBLE:
        error_message = 'infeasible solution, %r' % products
        raise ValueError(error_message)
    return status, summary, product_output, ingredient_output


if __name__ == '__main__':
    """
    Bakery problem
    Objective: Maximize profits
    Products: Breads, Biscuits, and Pies
    """
    products = { # name, min_demand, max_demand, price
        'Zucchini Bread': [600, 1000, 8.50],
        'Banana Nut Bread': [100, 600, 4.75],
        'Lemon Tea Bread': [450, 750, 5.00],
        'Rolled Biscuits': [700, 2000, 3.00],
        'Short Cake': [350, 500, 5.25],
        'Cherry Scones': [200, 300, 6.00],
        'Cherry Pie': [200, 700, 4.25],
        'Pecan Pie': [600, 1200, 4.50],
        'Lemon Meringue Pie': [550, 1000, 7.00]
    }

    costs = { #
        'Zucchini': 3.00,
        'Flour': 0.75,
        'Sugar': 0.75,
        'Pecans': 15.00,
        'Almonds': 7.50,
        'Yeast': .60,
        'Cherries': 7.00,
        'Lemons': 6.50,
        'Bananas': 0.25
    }

    ingredients = { # ['Sugar', 'Flour', 'Yeast', 'Almonds','Pecans', 'Zucchini', 'Cherries', 'Lemons', 'Bananas']
        'Zucchini Bread':     [0.75,   1,     0.1,   0.01, 0.01, 0.5, 0,    0,   0],
        'Banana Nut Bread':   [0.75,   1,     0.1,   0.25, 0.25, 0,   0,    0.5, 1.5],
        'Lemon Tea Bread':    [0.75,   0.5,   0.25,  0,    0,    0,   0,    0.5, 0],
        'Rolled Biscuits':    [0.1,    0.5,   0.05,  0,    0,    0,   0,    0,   0],
        'Short Cake':         [0.2,    0.75,  0.05,  0,    0,    0,   0,    0,   0],
        'Cherry Scones':      [0.25,   2,     0.05,  0,    0,    0,   0.1,  0,   0],
        'Cherry Pie':         [0.25,   1,     0.2,   0,    0,    0,   2,    0,   0],
        'Pecan Pie':          [0.5,    0.5,   0.1,   0,    1,    0,   0,    0,   0],
        'Lemon Meringue Pie': [0.5,    1,     0.05,  0,    0,    0,   0,    0.5, 0],
    }
    status, summary, product_production, ingredient_costs = optimize_products(products, costs, ingredients)
    print summary
    print product_production
    print ingredient_costs{% endraw %}{% endhighlight   %}

{% include components/heading.html heading='Example: Blending' level=2 %}

Linear programming is a common tool used in operations research for optimizing blending problems, where a final product must be created by combining various ingredients in unknown proportions.  Some common blending problems include:


*  Oil Blending (blending oils get other oils of given octanes, maximizing profits of the sold products while meeting supply and demand constraints)
*  Metal blending (mixing metals to get alloys based on the contents of those metals, minimizing the costs of mixing while meeting production constraints)


<blockquote cite="https://www.ibm.com/support/knowledgecenter/en/SSSA5P_12.5.1/ilog.odms.ide.help/OPL_Studio/usroplexamples/topics/opl_mp_examples_blending.html">
Blending problems are a typical application of mixed integer-linear programming (MILP). They involve blending several resources or materials to create one or more products corresponding to a demand.
<footer>IBM</footer></blockquote>

Rather than coming up with my own, let's use an existing oil blending problem.  In this problem, we have raw oils with given octanes at given costs per barrel, and refined oils with given octanes, and price per barrel.  We want to blend the raw oils together together to have the specific octanes to meet the required demand, and to maximize our profits.

{% highlight python linenos %}{% raw %}from ortools.linear_solver import pywraplp


def optimize_blending(raw_ingredients, outputs):
    solver = pywraplp.Solver('Blending', pywraplp.Solver.GLOP_LINEAR_PROGRAMMING)
    raw_gases, refined_gases = raw_ingredients.keys(), outputs.keys()
    octane_key, raw_availability_key, raw_cost_key = 'octane', 'availability', 'cost'
    refined_min_demand_key, refined_max_demand_key, refined_price_key = 'min_demand','max_demand','price'
    mixes = dict()
    # build matrix of [raw_gas, refined gas] amounts
    for raw_gas in raw_gases:
        mixes[raw_gas] = dict((refined_gas, solver.NumVar(0.0, 1000,'%s-%s' % (raw_gas, refined_gas))) for refined_gas in refined_gases)
    # create auxillary variables for how much mixed total mixed gas will be used
    raw_gas_used = dict((raw_gas, solver.NumVar(0, raw_ingredients[raw_gas][raw_availability_key], '%s availability' % raw_gas)) for raw_gas in raw_gases)
    # create auxillary variables for how much of each refined gas will be produced
    refined_gas_produced = dict((refined_gas, solver.NumVar(outputs[refined_gas][refined_min_demand_key], outputs[refined_gas][refined_max_demand_key], refined_gas)) for refined_gas in refined_gases)
    # add constraints for ensuring the total amount of raw gas used is equal to the amount in the mixing matrix
    for raw_gas in raw_gases:
        solver.Add(raw_gas_used[raw_gas] == sum(mixes[raw_gas][refined_gas] for refined_gas in refined_gases))

    # refined gas produced must equal the the amount of raw gas used to produce it
    for refined_gas in refined_gases:
        solver.Add(refined_gas_produced[refined_gas] == sum(mixes[raw_gas][refined_gas] for raw_gas in raw_gases))
    # the raw gases mixed for a refined gas must be blended to be the octane of the refined gas
    for refined_gas in refined_gases:
        solver.Add(refined_gas_produced[refined_gas]*outputs[refined_gas][octane_key] == solver.Sum([mixes[raw_gas][refined_gas]*raw_ingredients[raw_gas][octane_key] for raw_gas in raw_gases]))
    Cost = solver.Sum(raw_gas_used[raw_gas]*raw_ingredients[raw_gas][raw_cost_key] for raw_gas in raw_gases)
    Price = solver.Sum(refined_gas_produced[refined_gas]*outputs[refined_gas][refined_price_key] for refined_gas in refined_gases)
    solver.Maximize(Price - Cost)
    status = solver.Solve()

    output = dict(price=Price.solution_value(), cost=Cost.solution_value(), production=dict())
    for raw_gas in raw_gases:
        for refined_gas in refined_gases:
            if refined_gas not in output['production']:
                output['production'][refined_gas] = dict()
            output['production'][refined_gas][raw_gas] = mixes[raw_gas][refined_gas].solution_value()
    return status, output


if __name__ == '__main__':
    crude_oil = {
        'r0': dict(octane=99, availability=872, cost=55.34),
        'r1': dict(octane=94, availability=894, cost=54.12),
        'r2': dict(octane=84, availability=631, cost=53.68),
        'r3': dict(octane=92, availability=648, cost=57.03),
        'r4': dict(octane=87, availability=956, cost=54.81),
        'r5': dict(octane=97, availability=647, cost=56.25),
        'r6': dict(octane=81, availability=989, cost=57.55),
        'r7': dict(octane=96, availability=609, cost=58.21),
    }
    refined_oil = {
        'f0': dict(octane=88, min_demand=415, max_demand=11707, price=61.97),
        'f1': dict(octane=94, min_demand=199, max_demand=7761, price=62.04),
        'f2': dict(octane=90, min_demand=479, max_demand=12596, price=61.99),
    }
    print optimize_blending(crude_oil, refined_oil){% endraw %}{% endhighlight %}


{% include components/heading.html heading='Conclusion' level=2 %}

Linear programming are numerous and can be applied in any scenario involving constraint-based optimization of continuous variables.  Linear programming has applications in computer science, sports, business, and many more industries and fields of study.  I hope you find it to be as useful as I have.