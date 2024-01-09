---
layout: post
title:  "Structuring Donor databases as networks"
description: Determining the dynamics of your donor network
keywords: graph,theory,network,college,university,education,donor,donation
tags: graph-theory math python
---

{% include components/heading.html heading='Getting Started' level=2 %}

Philanthropy provides the biggest opportunity for institutions for higher education to fund research for faculty and to provide opportunities for students.  In 2016, colleges and universities received $41 billion in philanthropic giving, over 50% of the total value provided by state institutions to higher education institutions.

While this charitable giving is becoming more important to institutions, regional institutions to compete with larger institutions for these donations.  Almost 30% of the total $41 billion given to higher education institutions were given to 1% of the higher education institutions in the US.  The rest of the institutions must compete for the rest of the gifts.  The most important competitive advantages an institution can have to compete for gifts are opportunities that potential donors are passionate about, and user-friendly digital services for potential donors.  I will spend my time here focused on the latter. Since regional institutions have smaller alumni bases and a smaller radius of influence, they generally do not have the data nor human resources needed to provide scale-able digital services that can compete with that of large institutions.  Regional institutions have to work smarter, with less data to be able to compete with these larger institutions.

One concept that smaller institutions can use to find more insights in multiple areas are donor networks.  A donor network is similar to a social network, it is a single data structure that contains all the relationships for all people in the network.  In this case, we will be creating a network that contains the donations of donors with funds for institutions.

To get started with networks, I would recommend [Networks, Crowds, and Markets: Reasoning about a Highly Connected World](https://www.amazon.com/gp/product/0521195330/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=0521195330&linkCode=as2&tag=dougfensterma-20&linkId=59630ca1c803fa257d9331fcb7cd3383), which is the book that got me started with using network-based reasoning and building network-based applications.  This book introduces centrality based measures, information cascades, network structure and other topics that will be discussed in this post.

{% include components/heading.html heading='Building a Graph' level=2 %}

To build our graph, we will be using [Graph Tool](https://graph-tool.skewed.de/), as it is a high-performance graphing library, so it can handle both small and large graphs.  To install graph_tool, see the [Download](https://graph-tool.skewed.de/download) page.

While waiting for graph_tool to compile, we can start preparing our vertex and edge data for our graph.  In our graph of transactions, our vertices will be our donors and funds, connected by edges which will represent donations made from the donor to the fund.   Since a donor does not make donations to other donors, but only to funds, our graph will not contain edges from donors to other donors, or from funds to other funds.  This is called a [bipartite graph](https://en.wikipedia.org/wiki/Bipartite_graph).

Insert example graph here

Each vertex can contain an arbitrary number of attributes that describe the donor or the institutional fund. In the case of a donor, the donor may have the following attributes


*  Last Name
*  First Name
*  Gender
*  Date of Birth
*  Marital Status
*  Geographic Location
*  Income bracket
*  Type - Alumni, Faculty, Staff, etc.


And fund attributes:


*  Name
*  Category - Research, Scholarship, etc
*  Associated Department - Athletics, 
*  Creation Date
*  Listed on website?
*  Promoted on website?
*  Associated with event?


And for our transaction edges:

*  Date
*  Amount
*  Device
*  Browser
*  Digital Referrer - Organic, Social Media, Direct, etc
*  Referring Campaign Name


We can use the above attributes to only filter on vertices and edges so we can examine the graph of subsets of our donations.  For example, we may only want to examine the graph of donations for gifts given for sports in the past year, and only sport-related funds that have been created in the past 5 years.

Let's get started in building our graph.  We will start with loading our 

{% highlight python linenos %}{% raw %}from graph_tool.all import Graph

graph = Graph(directed=False)

def add_fund_vertices(graph, file_name):
    node_id_key = 'FUND_CODE'
    label_key = 'SHORT_NAME'
    agency_key = 'AGENCY'
    status_key = 'STATUS_CODE'
    fund_codes = graph.new_vertex_property('string')
    names = graph.new_vertex_property('string')
    agencies = graph.new_vertex_property('string')
    statuses = graph.new_vertex_property('string')
    vertex_lookup = dict()
    with open(file_name, 'rb') as input_file:
        node_data = list(csv.DictReader(input_file))
    total_nodes = len(node_data)
    index = 0
    vertices = list(graph.add_vertex(total_nodes))
    for index in range(total_nodes):
        if index % 1000 == 0:
            print 'Adding Node #%s' % index
        row = node_data[index]
        fund_code = row[node_id_key]
        label = row[label_key]
        agency = row[agency_key]
        status = row[status_key]
        vertex = vertices[index]
        fund_codes[vertex] = fund_code
        names[vertex] = label
        agencies[vertex] = agency
        statuses[vertex] = status
        if fund_code not in vertex_lookup:
            vertex_lookup[fund_code] = vertex
    graph.vertex_properties["fund_codes"] = fund_codes
    graph.vertex_properties["names"] = names
    graph.vertex_properties["agencies"] = agencies
    graph.vertex_properties["statuses"] = statuses
    return vertex_lookup, graph

fund_lookup, graph = add_fund_nodes(graph, "funds.csv"){% endraw %}{% endhighlight %}

Now we have loaded our funds into the graph.  Now we can load our donors into the graph as well.

{% highlight python linenos %}{% raw %}def add_entity_nodes(graph, file_name):
    entity_id_key = 'ID'
    entity_type_key = 'PERSON_OR_ORG'
    gender_key = 'GENDER'
    record_type_key = 'ENTITY_TYPE'
    entity_ids = graph.new_vertex_property('string')
    genders = graph.new_vertex_property('string')
    entity_types = graph.new_vertex_property('string')
    record_types = graph.new_vertex_property('string')
    vertex_lookup = dict()
    with open(file_name, 'rb') as input_file:
        node_data = list(csv.DictReader(input_file))
    total_nodes = len(node_data)
    index = 0
    vertices = list(graph.add_vertex(total_nodes))
    for index in range(total_nodes):
        if index % 1000 == 0:
            print 'Adding Node #%s' % index
        row = node_data[index]
        entity_id = row[entity_id_key]
        gender_code = row[gender_key]
        entity_type = row[entity_type_key]
        record_type = row[record_type_key]
        vertex = vertices[index]
        entity_ids[vertex] = entity_id
        genders[vertex] = gender_code
        entity_types[vertex] = entity_type
        record_types[vertex] = record_type
        if entity_id not in vertex_lookup:
            vertex_lookup[entity_id] = vertex
    graph.vertex_properties["entity_ids"] = entity_ids
    graph.vertex_properties["genders"] = genders
    graph.vertex_properties["entity_types"] = entity_types
    graph.vertex_properties["record_types"] = record_types
    return vertex_lookup, graph

entity_lookup, graph = add_entity_nodes(graph, "entity.csv"){% endraw %}{% endhighlight %}

Now we have added all of our nodes into the graph.  We can finally move onto creating the last and most crucial structure in our graph: the edges

{% highlight python linenos %}{% raw %}def build_edges(graph,  file_name, entity_lookup, allocation_lookup):
    source_key = 'ENTITY_ID'
    target_key = 'FUND_CODE'
    dollar_key = 'DOLLAR_AMOUNT'
    count_key = 'GIFT_COUNT'
    amounts = graph.new_edge_property('double')
    counts = graph.new_edge_property('int')
    with open(file_name, 'rb') as input_file:
        edge_data = list(csv.DictReader(input_file))
    total_edges = len(edge_data)
    for index in range(total_edges):
        if index % 1000 == 0:
            print 'Adding Edge #%s' % index
        row = edge_data[index]
        dollar_amount = float(row[dollar_key])
        gift_count = int(row[count_key])
        source_index = row[source_key]
        target_index = row[target_key]
        if source_index not in entity_lookup:
            vertex = graph.add_vertex()
            entity_lookup[source_index] = vertex
        if target_index not in allocation_lookup:
            vertex = graph.add_vertex()
            allocation_lookup[target_index] = vertex
        source = entity_lookup[source_index]
        target = allocation_lookup[target_index]
        edge = graph.edge(source, target)
        if not edge:
            edge = graph.add_edge(source, target)

        amounts[edge] = dollar_amount
        counts[edge] = gift_count

    graph.edge_properties['amounts'] = amounts
    graph.edge_properties['counts'] = counts
    return graph

graph = build_edges(graph, "donations.csv"){% endraw %}{% endhighlight %}

And now the core aspects of our graph are complete.  It's taken some time for our script to build our graph, so let's go ahead and save it so we don't have to build it from scratch again later.

{% highlight python linenos %}{% raw %}file_name = 'donor-donations.xml.gz'
graph.save(file_name)

# the graph can be loaded very simply
from graph_tool.all import load_graph
graph = load_graph(file_name)
{% endraw %}{% endhighlight %}

{% include components/heading.html heading='Components and Connectedness' level=2 %}

So let's go ahead and get started using our graph.  First we may want to identify the components of our network.  A component in an undirected graph is an isolated vertices that all have a path to reach each other, but do not have any edges to vertices outside of their component.  In the context of our donor network we can think of these isolated clusters as groups of donors united by their mutual interests in particular funds.  So for example, if if there is a path between a donor/funds and all the other funds/donors in the network, there is only 1 component.  If there are two donors/funds that cannot be reached, but those two donors/funds do not have a path between them either, then there are 3 components.  Let's go ahead and get our component data

{% highlight python linenos %}{% raw %}from graph_tool import topology

components, histogram, is_attractor = topology.label_components(graph)
graph.vertex_properties['components'] = components{% endraw %}{% endhighlight %}

This allows us to identify the different communities within our donor network.  .

The next step is to evaluate how connected the donors/funds are, using [cluster coefficients](https://graph-tool.skewed.de/static/doc/clustering.html#graph_tool.clustering.local_clustering).

{% highlight python linenos %}{% raw %}from graph_tool import clustering

global_clustering, global_clustering_stddev = clustering.global_clustering(graph)
graph.graph_properties['global_clustering'] = global_clustering
graph.graph_properties['global_clustering_stddev'] = global_clustering_stddev

local_clusters = clustering.local_clustering(graph)
graph.vertex_properties['local_clusters'] = local_clusters{% endraw %}{% endhighlight %}

The local clustering coefficient tells us how connected a vertex (donors/funds) are to being complete interconnected.  This can tell us how tightly/loosely bound the funds/donors are.  A local clustering coefficient can be between 0 and 1, where a low number indicates the neighbors of the vertex are not very interconnected and a high number indicates the neighbors approach are a clique, or close to becoming one.

The existence of components in the donor network tells us that institution is attracting donors with interests in multiple areas which do not have any overlap.  These clusters can be used to develop donor personas or inform existing ones based on attributes of the donors/funds in the components.   Within each component, the local clustering coefficient can also be used to determine the extent to which a donor/fund is embedded within the component.

The closeness centrality and betweenness centrality can also be used to determine the role of the donor/fund within their centrality. 

{% include components/heading.html heading='Network Topology' level=2 %}

The most common computations used on graphs are [centralities](https://graph-tool.skewed.de/static/doc/centrality.html), which determine the relationships between each vertex and all other vertices.  We will calculate the closeness centrality and betweenness centrality of each node in our donor network.   We will have to do some light preprocessing our data before we can compute our closeness and betweenness centralities, but first we need to understand why we need to preprocess our data.

<blockquote cite="https://en.wikipedia.org/wiki/Betweenness_centrality">
For every pair of vertices in a connected graph, there exists at least one shortest path between the vertices such that either the number of edges that the path passes through (for unweighted graphs) or the sum of the weights of the edges (for weighted graphs) is minimized. The betweenness centrality for each vertex is the number of these shortest paths that pass through the vertex.
</blockquote>

Betweenness and closeness centralities are calculations of locations and roles of vertices in a given graph using shortest paths. The shortest path between two vertices is defined as the shortest path through a graph between two nodes.  If the weight of the edges are not considered, the shortest path is the path which uses the fewest edges.  If weights are considered, the shortest past is the path in which the weights of the edges between the two vertices is minimized.  This is important because we need to make sure that the weights that we use for these centralities have lower values for edges that we want to consider "shorter".

So we have to define how we consider a transaction edge to be short.  We could say that the more money a person donates to a given fund, the shorter the distance between the donor and the fund.  So let's say that Jane Doe gives $1 million dollars  to the General Fund, and John Smith gives $10 to the general fund.   With our above definition of closeness, Jane Doe is 100000x closer to the General Fund than John Doe.   By extension, if Bob gave $100,000 to the General Fund, Bob would be 10000x further away from John Smith than he would Jane Doe.  

In a perfect world, the most accurate distance would be the amount donated to a fund divided by their total available income at the time of donation. That way if a person who only has $10 and gave $5 donated $5 of it, would be considered closer than the person who donated $100,000 but has $50 billion to give.  However due to rightful privacy restrictions, we cannot perform that calculation due to the legal protections our donors have for their privacy.  So we will stick to our prior mentioned  metric of the total amount donated.

But, we still need to have update our numbers so that edges representing larger donations will have a lower weight, indicating that the edge is shorter.  The simplest to do this would be to take the inverse of the donated amount, so the larger the donation, the closer the edge's weight will be to zero, and the smaller the donation, the further it will be from zero.


{% highlight python linenos %}{% raw %}from graph_tool import centrality

# preprocess our donation amounts into a new property map
amount_distance = graph.new_edge_property('double')
for edge in graph.edges():
    if amounts[edge] != 0:
        amount_distance[edge] = 1.0 / amounts[edge]
    else:
        # if the donation amount is 0, make the distance extremely high
        amount_distance[edge] = 99999999

vertex_amount_betweenness, edge_amount_betweeness = centrality.betweenness(graph, weight=amount_distance)
vertex_amount_closeness = centrality.closeness(graph, weight=amount_distance)

# save our centralities so we won't have to re-compute them later
graph.vertex_properties['amount_betweenness'] = vertex_amount_betweenness
graph.edge_properties['amount_betweeness'] = edge_amount_betweenness
graph.vertex_properties['amount_closeness'] = vertex_amount_closeness
graph.save(file_name){% endraw %}{% endhighlight %}

Now we have our <code>amount_betweenness</code> and our <code>amount_closeness</code>. 
 You may notice that the above centralities can take hours to compute, which is why we saved our properties afterward.  This way we won't have to compute them everytime we want to use them.  Let's go ahead and preprocess our <code>counts</code> so we can save those values for later as well. 
 We will be performing exactly the same process as we did for <code>amounts</code>, as we want donors who gave more gifts multiple gifts to be considered closer to funds than donors who gave fewer gifts based on the <code>count_distance</code>.

{% highlight python linenos %}{% raw %}from graph_tool import centrality

# preprocess the number of donations into a new property map
count_distance = graph.new_edge_property('double')
for edge in graph.edges():
    if counts[edge] != 0:
        count_distance[edge] = 1 / counts[edge]

vertex_count_betweenness, edge_count_betweeness = centrality.betweenness(graph, weight=count_distance)
vertex_count_closeness = centrality.closeness(graph, weight=count_distance)

# save our centralities so we won't have to re-compute them later
graph.vertex_properties['count_betweenness'] = vertex_count_betweenness
graph.edge_properties['count_betweeness'] = edge_count_betweenness
graph.vertex_properties['count_closeness'] = vertex_count_closeness
graph.save(file_name){% endraw %}{% endhighlight %}

We can use the betweenness and closeness centralities, along with the degree of a vertex to determine its role within our donor network
<dl>
    <dt>High Betweenness, High Closeness</dt>
    <dd>The donor provide multiple high value gifts to funds that are commonly donation funds.  These would be VIP donors who donate generously to primary funds for the institution.
    Action:  Assign recommendations for other gifts that are popular, with a focus on gifts that are high-impact and/or are similar causes to their existing substantial gifts.  As the donor is a prominent donor, the assignment can be handled by a gift officer who can advocate for the fund in question.    If the objective is to decrease the diameter of the network, a niche gift could be assigned as a recommendation.  A niche gift with another prominent donor would be preferred as it could provide the donor with an opportunity to extend their personal network as well as decrease the diameter of the network.</dd>
    <dt>High Betweenness, Low Closeness</dt>
    <dd>The donor only provides high value gift to a set of of funds located outside the center of the network.  This donor may be the only donor connecting the niche funds to the rest of the network (they are the gatekeeper to the funds), or they may provide the most significant gifts to the funds in the niche (they have the largest investment in the niche funds) and the most popular funds in the center of the network.  An example would be a donor who provided a very large gift to a small athletic team, such as Men's Track & Field.  As the donor makes prominent gifts, their assignment can be handled by their gift officer(s).  The website can also account for these recommendations by personalizing content, but it will be unlikely their gift will be submitted online.
    Action:  If the objective is to decrease the diameter of the network, the donor could be recommended a high-needs niche fund in another section of the graph.  This would decrease the diameter of the graph by creating a strong connection between two niche clusters of the graph.  Otherwise, the donor could be recommended another fund within the same cluster of their niche.  As the donor makes prominent gifts, their assignment can be handled by their gift officer(s).  The website can also account for these recommendations by personalizing content, but it will be unlikely their gift will be submitted online.</dd>
    <dt>Low Betweenness, High Closeness</dt>
    <dd>The donor donates small amounts to funds that receive lots of gifts from most of the donor, and does not play an influential role in the donor network.  These donors donate small amounts to general purpose funds offered by the institution, but since their donations are small, they have little influence on institutional decisions in regards to the fund.
    Action:  The donor is not a prominent donor, so their motivations will likely be different.  The donor could be recommended similar general funds, as the donor likely does not have a specific cause they are passionate about.  If the donor has periodic gifts, the funds in those periodic gifts can be recommended towards the end of the period if the gift has not already been given.</dd>
    <dt>Low Betweenness, Low Closeness</dt>
    <dd>The donor donates small amounts to small funds that have not received large donations.  This would include donors to memorial funds by their family members, as these funds generally have a small number of donations by donors not affiliated with the institution.
    Action:  The fund the donor provided a gift to was small and therefore had few donors.  The donor can be recommended a fund that many of these donors also donated to.  This way the donor will only be prompted to donate to funds that are already associated with their niche.  The institution can also begin building out a donor profile based on the actions taken by the donor.</dd>
</dl>

We can also use the concept of the shortest path between two vertices.   A shortest path in a graph is the shortest path is a sequence of vertices that can be traversed in a graph that starts at a source vertex and ends at the target, minimizing either the number of vertices traversed, or the total value of a property of the edges between the vertices.  In our donor network, a shortest path could represent the degrees of separation between two vertices (donor/fund).  This shortest path could be used to identify the optimal path of influence (based on the magnitude of donations, based on total amount or total donations) between a fund and a specific donor.  The diameter of the graph can be used to compute an upper bound on the degrees of separation between a vertex and any other vertex.

{% highlight python linenos %}{% raw %}source_vertex= 1
target_vertex = 750000
diameter = topology.pseudo_diameter(graph, source)
shortest_paths = topology.shortest_paths(graph, source, target)
for shortest_path in shortest_paths:
    assert len(shortest_path) <= diameter

count_diameter = topology.pseudo_diameter(graph, source, weight=count_distance)
count_shortest_paths = topology.shortest_paths(graph, source, target, weights=count_distance)
for shortest_path in shortest_paths:
    assert len(shortest_path) <= diameter{% endraw %}{% endhighlight %}

{% include components/heading.html heading='Advanced - Partitioning' level=2 %}

Earlier, we discussed separating our undirected network into components, which is where we identify which sets of vertices do not share any edges with another component of our network.  While we have the ability to quickly identify and act on these components, we rarely have components that are completely isolated in the real-world.   Often these components  still have a small number of edges connecting them to other vertices in the network.  Since they have these connections to other parts of the graph, they are not considered their own components and thus are not identified as such. However, we still want to be able to identify these parts of the graphs with low connectivity as being unique.  Ino ther words, we want to identify the [graph partitions](https://en.wikipedia.org/wiki/Graph_partition) in our graph.  The process of identifying these partitions are actually identified is denser topic than we can cover here, so we will leave the in-depth discussion for another day.  Fortunately for us, graph_tool has already implemented the functionality to identify partitions already, so we do not have learn how to do it and implement it ourselves.  So, how would we go about partitioning our donor network using graph_tool?

Graph Tool is a very useful package in this area due to its specialized [inference](https://graph-tool.skewed.de/static/doc/inference.html) subpackage.  This subpackage implements stochastic block modeling, which is a statistical method in generating random graphs with specific properties.  These same mathematical approached used to generate random graphs with specific properties can be used to make inferences about naturally occurring graphs, such as a donor network.

The inference module contains functions that allow us to create and estimate partitions and subpartitions within a graph.  These processes can run for many hours or days on large graphs, even on an 8-core 3Ghz machine, so I would recommend not running these functions often.  I would also recommend saving these partitions to the graphs for intermediate uses of them between executions of the models.

{% highlight python linenos %}{% raw %}from graph_tool import inference

state = inference.minimize_blockmodel_dl(graph)

blocks = state.get_blocks()
partitions = graph.new_vertex_property('int')

for vertex in graph.vertices():
    partitions[vertex] = blocks[vertex]
        
graph.vertex_properties['partitions'] = partitions
{% endraw %}{% endhighlight %}

Models with variable numbers of nested subpartitions can also be trained.  Please note this model takes even longer to train that a single-level partition model.

{% highlight python linenos %}{% raw %}state = inference.minimize_nested_blockmodel_dl(graph)

levels = state.get_levels()

print 'assigning partitions'
vertex_partitions = dict((vertex, []) for vertex in graph.vertices())
for level in levels:
    level_blocks = level.get_blocks()
    for vertex in graph.vertices():
        vertex_partitions[vertex].append(level_blocks[vertex])

nested_partitions = graph.new_vertex_property('vector<int>')

for vertex, values in vertex_partitions.items():
        nested_partitions[vertex] = values

graph.vertex_properties['nested_partitions'] = nested_partitions{% endraw %}{% endhighlight %}

Now we know how to get started in identifying partitions within our networks.  But some models are better at predicting than others, so we need try comparing the results from other models to make sure we are getting the most accurate results.  Once we have identified the most accurate model, we can run <code>mcmc_equilibrate</code> method to further refine our model.

{% highlight python linenos %}{% raw %}state = inference.minimize_nested_blockmodel_dl(graph)

"""run mcmc_equilibrate to further refine our results
This process will stop once it has converged, indicating that our results should be more accurate
"""
inference.mcmc_equilibrate(state, wait=100, nbreaks=2, mcmc_args=dict(niter=10), verbose=True)

levels = state.get_levels()

print 'assigning partitions'
vertex_partitions = dict((vertex, []) for vertex in graph.vertices())
for level in levels:
    level_blocks = level.get_blocks()
    for vertex in graph.vertices():
        vertex_partitions[vertex].append(level_blocks[vertex])

nested_partitions = graph.new_vertex_property('vector<int>')

for vertex, values in vertex_partitions.items():
        nested_partitions[vertex] = values

graph.vertex_properties['nested_partitions'] = nested_partitions{% endraw %}{% endhighlight %}

Then these nested partitions can be used to determine properties about each partition and determine actions.  But since these partititions are non-deterministic, we may want to know what the probability is of a vertex being a member of a given partition.  We can run a Monte Carlo simulation on the stochastic block model until the partition assignments converge upon the expected values.

{% highlight python linenos %}{% raw %}class MonteCarloResults(object):

    def __init__(self, levels):
        self.vertex_partitions = [None] * len(levels)
        self.edge_partitions = [None] * len(levels)

    def nested_callback(self, state):
        levels = state.get_levels()
        for index, level in enumerate(levels):
            self.vertex_partitions[index] = level.collect_vertex_marginals(self.vertex_partitions[index])
            self.edge_partitions[index] = level.collect_edge_marginals(self.edge_partitions[index])

state = inference.minimize_nested_blockmodel_dl(graph)

results = MonteCarloResults(state.get_levels())

inference.mcmc_equilibrate(state, wait=100, nbreaks=2, mcmc_args=dict(niter=10), callback=results.nested_callback, verbose=True)

levels = state.get_levels()

state_0 = levels[0]
state_0.draw(vertex_shape="pie", vertex_pie_fractions=results.vertex_partitions[0],
             output_size=(5000, 5000), output="vertex_marginal_probabilities.png"){% endraw %}{% endhighlight %}

{% include components/heading.html heading='Co-occurrence Graphs' level=2 %}

Higher education philanthropy has many opportunities for giving to specific causes that donors identify with.  In fact, for some institutions there are so many opportunities that potential donors can suffer from [overchoice](https://en.wikipedia.org/wiki/Overchoice) or choice overload.  This occurs when When users suffer from overchoice, they often prefer to walk away rather than make a choice.  We must identify recommendations for each donor that maximize the likelihood of conversion (making a donation).

Above we discussed using the topology of the network to make decisions regarding recommendations of funds to donors based on components and topological traits.  But with large networks, it takes more time to identify the role of a donor, and to identify appropriate funds for recommendation.  For example, if we are attempting to recommend funds, then we have approximately \( D \) donor vertices that do not need to be a part of our graph and the accompanying edges.  Instead of using our total donor network, we can construct [co-occurrence networks](https://en.wikipedia.org/wiki/Co-occurrence_network) for trimming down on the number of edges and the number of vertices.

Co-occurrence networks allow us to simplify our graph for quickly determining objectives related to a specific type of object.  In this example we will only concern ourselves with our funds.  So in this graph we will not have any donors, just edges between different funds.  In this co-occurrence network, edges between funds will have a weight of the number of gifts given by personas identified by leadership.  So funds may have multiple edges between two funds. As we typically have many donors and fewer funds, the memory needed to hold our graph, as well as computation time to process it, will dramatically decrease.  Let's go ahead and build our co-occurrence graph.

{% highlight python linenos %}{% raw %}def create_entity_lookup(file_name):
   entity_id_key = 'ID_NUMBER'
   entity_type_key = 'PERSON_OR_ORG'
   gender_key = 'GENDER_CODE'
   record_type_key = 'RECORD_TYPE_CODE'
   vertex_lookup = dict()
   with open(file_name, 'rb') as input_file:
       node_data = list(csv.DictReader(input_file))
    total_nodes = len(node_data)
    index = 0
    for index in range(total_nodes):
        if index % 1000 == 0:
            print 'Adding Node #%s' % index
        row = node_data[index]
        entity_id = int(row[entity_id_key])
        vertex_lookup[entity_id] = row
    return vertex_lookup

def build_cooccurrence_edges(graph,  file_name, allocation_lookup, entity_lookup):
    source_key = 'ENTITY_ID'
    target_Ukey = 'FUND_CODE'
    dollar_key = 'DOLLAR_AMOUNT'
    count_key = 'GIFT_COUNT'
    entity_gifts = dict()
    with open(file_name, 'rb') as input_file:
        edge_data = list(csv.DictReader(input_file))
    total_edges = len(edge_data)
    genders = graph.new_edge_property('string')
    record_types = graph.new_edge_property('string')
    entity_types = graph.new_edge_property('string')
    donors = graph.new_edge_property('int')
    amounts = graph.new_edge_property('double')
    counts = graph.new_edge_property('int')
    donors = graph.new_edge_property('int')
    for index in range(total_edges):
        if index % 1000 == 0:
            print 'Adding Gift #%s' % index
        row = edge_data[index]
        dollar_amount = float(row[dollar_key])
        gift_count = int(row[count_key])
        entity = int(row[source_key])
        allocation = int(row[target_key])

        if entity not in entity_gifts:
            entity_gifts[entity] = list()
        if allocation not in entity_gifts[entity]:
            entity_gifts[entity].append(allocation)

        if allocation not in allocation_lookup:
            vertex = graph.add_vertex()
            allocation_lookup[allocation] = vertex
        source = allocation_lookup[allocation]

        if entity not in entity_lookup:
            continue
        entity_data = entity_lookup[entity]
        entity_gender = entity_data.get('GENDER_CODE', None)
        entity_record_type = entity_data.get('RECORD_TYPE_CODE', None)
        entity_type = entity_data.get('PERSON_OR_ORG', None)


        previous_gift_index = 0
        previous_gifts = entity_gifts[entity]
        previous_gift_count = len(previous_gifts)
        for previous_gift_index in range(previous_gift_count):
            target = allocation_lookup[previous_gifts[previous_gift_index]]
            if source == target:
                continue
            incremented_edge = False
            existing_edges = graph.edge(source, target, all_edges=True)
            existing_edge_count = len(existing_edges)
            existing_edge_index = 0
            for existing_edge_index in range(existing_edge_count):
                existing_edge = existing_edges[existing_edge_index]
                if entity_gender != genders[existing_edge] or entity_record_type != record_types[existing_edge] or entity_type != entity_types[existing_edge]:
                    continue
                amounts[existing_edge] += dollar_amount
                counts[existing_edge] += gift_count
                donors[existing_edge] += 1
                incremented_edge = True
                break

            if incremented_edge:
                continue
            existing_edge = graph.add_edge(source, target)

            genders[existing_edge] = entity_gender
            record_types[existing_edge] = entity_record_type
            entity_types[existing_edge] = entity_type

            amounts[existing_edge] = dollar_amount
            counts[existing_edge] = gift_count
            donors[existing_edge] = 1

    graph.edge_properties['gender'] = genders
    graph.edge_properties['record_type'] = record_types
    graph.edge_properties['entity_type'] = entity_types
    graph.edge_properties['amounts'] = amounts
    graph.edge_properties['counts'] = counts
    graph.edge_properties['donors'] = donors
    return graph


entity_lookup = create_entity_lookup(entity_file_name)
cooccurrence_graph = Graph(directed = True)
fund_lookup, cooccurrence_graph = add_fund_nodes(cooccurrence_graph, "funds.csv")
cooccurrence_graph = build_cooccurrence_edges(cooccurrence_graph, "gifts.csv"){% endraw %}{% endhighlight %}

Now that we have our co-occurrence graph, let's see what we can do with it.  We can do some tasks without even processing our data. For example, we can provide recommendations to donors based on their stored attributes and identifying mutual connections between funds that the donor has previously contributed towards.

{% highlight python linenos %}{% raw %}def role_based_recommendations(graph, attributes, *funds, **kwargs):
    betweenness_tolerance = closeness_tolerance = kwargs.get('tolerance', None)
    if not betweenness_tolerance and not closeness_tolerance:
        betweenness_tolerance = kwargs.get('betweenness_tolerance', 1)
        closeness_tolerance = kwargs.get('closeness_tolerance', 1)

    gift_counts = graph.edge_properties['counts']
    gift_amounts = graph.edge_properties['amounts']
    fund_closeness = graph.vertex_properties['count_closeness']
    fund_betweenness = graph.vertex_properties['count_betweenness']
    fund_count = len(funds)

    average_betweenness = sum(fund_betweenness[fund] for fund in funds) / fund_count
    min_betweenness = min(fund_betweenness[fund] for fund in funds)
    max_betweenness = max(fund_betweenness[fund] for fund in funds)
    lower_betweenness_threshold = average_betweenness - betweenness_tolerance
    upper_betweenness_threshold = average_betweenness + betweenness_tolerance

    average_closeness = sum(fund_closeness[fund] for fund in funds) / fund_count
    min_closeness = min(fund_closeness[fund] for fund in funds)
    max_closeness = max(fund_closeness[fund] for fund in funds)
    lower_closeness_threshold = average_closeness - closeness_tolerance
    upper_closeness_threshold = average_closeness + closeness_tolerance

    attribute_properties = dict()
    for key, value in attributes.items():
        attribute_properties[key] = graph.edge_properties[key]

    # basic recommendations
    recommendations = dict()
    total_donations = 0
    for fund in funds:
        # get potential recommendations based on other funds donated to
        for edge in fund.all_edges():
            potential_recommendation = edge.target()
            # do not include funds they have already donated to, and meets volume and network role thresholds
            if potential_recommendation in funds or kwargs.get('donor_threshold', 999999) < gift_donors[potential_recommendation] or kwargs.get('gift_count_threshold', 999999999) < gift_counts[potential_recommendation] and lower_closeness_threshold < fund_closeness[potential_recommendation] < upper_closeness_threshold and lower_betweenness_threshold < fund_betweenness[potential_recommendation] < upper_betweenness_threshold:
                continue
            # track total donations considered
            total_donations += gift_counts[edge]
            if  potential_recommendation not in recommendations:
                recommendations[potential_recommendation] = 0
            recommendations[potential_recommendation] += gift_counts[edge]

    if not recommendations:
        for fund in funds:
            center_betweenness = (lower_betweenness_threshold + upper_betweenness_threshold) / 2
            center_closeness = (lower_closeness_threshold + upper_closeness_threshold) / 2

            # get potential recommendations based on other funds donated to
            potential_recommendations = [edge.target() for edge in fund.all_edges()]
            # find fund close to being within the role thresholds
            optimal_recommendation = min(abs((fund_closeness[vertex] + fund_betweenness[vertex]) - (center_closeness + center_betweenness)) for vertex in potential_recommendations if vertex not in funds)
            recommendations[optimal_recommendation] = gift_counts[optimal_recommendation]

    # pick funds with the most total gifts
    return max(recommendations, key=recommendations.get){% endraw %}{% endhighlight %}

{% include components/heading.html heading='Advanced - Vertex Classification' level=2 %}

So far we have covered how to determine the different parts of a network topology using centralities, clustering coefficients, and and partitioning using Monte Carlo simulations.  But cases arise where the business needs to be able to infer qualities about a donor/fund/node based on the qualities of other nodes, but how to determine whether the node has those qualities is not known.  This would be a case that machine learning is equipped to handle.  In fact, we do not even need Tensorflow or MXNet, we can use sci-kit learn.

Sci-kit learn, like most machine learning libraries, requires training data to be vectors of numeric data representing each item to be classified in order to create a model.  We can create such a matrix using the [graph_tool.spectral](https://graph-tool.skewed.de/static/doc/spectral.html) module, which converts a graph into different matrices, which are exactly the format needed for a machine learning model.

{% highlight python linenos %}{% raw %}from graph_tool import spectral

adjacency_matrix = spectral.adjacency_matrix(graph)
dense_matrix = adjacency_matrix.todense()
{% endraw %}{% endhighlight %}

Now that we know how to effortlessly convert our graph into the format needed for our machine learning model, we can split our graph into training data and testing data.

{% highlight python linenos %}{% raw %}from sklearn.linear_model import SGDClassifier
import random

training_data, training_labels = [], []
test_data, test_labels = [], []
unseen_data = []

# splitting our adjacency matrix into a training set, test set and unseen set
label_property_map = graph.vertex_properties['label']
for vertex in graph.vertices():
    index = int(vertex)
    row = dense_matrix[index]
    label = label_property_map[index]
    if not label:
        unseen_data.append(row)
        continue
    if random.random() > 0.5:
        training_data.append(row)
        training_labels.append(label)
    else:
        test_data.append(row)
        test_labels.append(label)

clf = SGDClassifier()
clf.fit(training_data, training_labels)

score = clf.score(test_data, test_labels)
print score

predictions = clf.predict(unseen_data)
print predictions{% endraw %}{% endhighlight %}

The model is trained to classify vertices based on their connectivity to other vertices in the network.  In the case of our donor network, the model would be trained on the funds that the donor has contributed towards (and not contributed towards).

If the prediction should be inferred based particular edge rather than general connectivity, then classification we could use an incidence matrix instead of an adjacency matrix. If the prediction should be inferred based on the proportions of total wealth contributed towards a given fund by each donor, then we could use a transition matrix.  Or, if we want to use the partition divisions to be used to infer the prediction, we could use a modularity matrix as the input to our model.

Often we cannot make the best inferences by only looking at one aspect of a graph, because our predictions rely on multiple aspects of the graph's structure. In cases such as these, we can concatenate multiple matrices together to form a more informative dataset to plug into our models.

But even with concatenating matrices, we are still only making predictions based on the donor network's topological features and connectivity while ignoring the heuristic data.  For some classification or regression problems, the graph topology may not yield all the information needed for the model to make accurate predictions. The model may need the heuristic data that we added to the graph when we created it.  We can add these data features as additional dimensions to the adjacency matrix for our model so that the model can use that information while making predictions.

You may notice that our adjacency matrix only provides data regarding the immediate neighbors of a vertex, so adjacency matrices are inadequate for machine learning tasks which require knowledge about the higher level network structures around a vertex.  For that, we need [https://arxiv.org/abs/1607.00653](https://arxiv.org/abs/1607.00653).  Node2vec is a framework for creating graph embeddings that contain information about the surrounding network structure of each vertex using [random walks](https://en.wikipedia.org/wiki/Random_walk).

{% include components/heading.html heading='Conclusion' level=2 %}

Graph theory and networks definitely have a use case in philanthropy.  Institutions do not need to create a public social network in order to take advantage of them.  Graphs can be extended to include data regarding fundraising events and can hold an arbitrary number of attributes for edges and vertices. 
 As above, I would recommend using graph_tool for running graph computations in the absence of a graph database such as Neo4J.  As many regional institutions do not have as large of audiences, graph_tool may suffice, and allow the institution to process their networks for insights for free.