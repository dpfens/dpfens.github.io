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

Now we have loaded our funds into the graph. Each fund is represented as a vertex with attributes that describe its purpose, department, and status. Next, we need to add our donors as vertices. Once both donors and funds exist in the graph, we can create edges between them representing donation transactions. This bipartite structure of donors connected to funds, but not to other donors, will allow us to analyze which donors have similar giving patterns based on the funds they support in common.

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

And now the core aspects of our graph are complete. We've created a network where donors and funds are vertices, connected by edges that capture not just whether a gift occurred, but the amount and frequency of giving. This structure will enable us to answer questions like "which donors have similar interests?" and "which funds attract similar types of supporters?" It's taken some time for our script to build this graph from our CSV files, so let's save it to avoid rebuilding from scratch each time we want to run an analysis.

{% highlight python linenos %}{% raw %}file_name = 'donor-donations.xml.gz'
graph.save(file_name)

# the graph can be loaded very simply
from graph_tool.all import load_graph
graph = load_graph(file_name)
{% endraw %}{% endhighlight %}

{% include components/heading.html heading='Components and Connectedness' level=2 %}

So let's go ahead and get started using our graph. The first structural insight we want is whether our donor network forms a single connected community or multiple isolated clusters. If we discover multiple components, groups of donors and funds with no paths connecting them to other groups—this tells us the institution is attracting support for distinct, non-overlapping causes. These isolated communities might represent different donor personas: perhaps athletics supporters who never give to academics, or local community donors who don't overlap with alumni. Identifying these components helps us understand the fundamental structure of our philanthropic base and informs how we organize fundraising teams and campaigns.

{% highlight python linenos %}{% raw %}from graph_tool import topology

components, histogram, is_attractor = topology.label_components(graph)
graph.vertex_properties['components'] = components{% endraw %}{% endhighlight %}

This allows us to identify the different communities within our donor network. But component analysis only tells us about complete isolation.  It doesn't reveal how tightly interconnected donors and funds are within each component. Two donors might both be in the same component but have very different roles: one might be deeply embedded in a tight-knit group of supporters, while another might be loosely connected with few shared interests. To understand these differences in network cohesion, we need to calculate clustering coefficients.

The next step is to evaluate how connected the donors/funds are, using [cluster coefficients](https://graph-tool.skewed.de/static/doc/clustering.html#graph_tool.clustering.local_clustering).

{% highlight python linenos %}{% raw %}from graph_tool import clustering

global_clustering, global_clustering_stddev = clustering.global_clustering(graph)
graph.graph_properties['global_clustering'] = global_clustering
graph.graph_properties['global_clustering_stddev'] = global_clustering_stddev

local_clusters = clustering.local_clustering(graph)
graph.vertex_properties['local_clusters'] = local_clusters{% endraw %}{% endhighlight %}

The local clustering coefficient tells us how connected a vertex (donors/funds) are to being complete interconnected.  This can tell us how tightly/loosely bound the funds/donors are.  A local clustering coefficient can be between 0 and 1, where a low number indicates the neighbors of the vertex are not very interconnected and a high number indicates the neighbors approach are a clique, or close to becoming one.  A donor with a high clustering coefficient is embedded in a cohesive community where most supporters know of each other's giving (through shared fund connections), while a low coefficient suggests the donor bridges between different giving communities. But clustering only captures local neighborhood structure. To understand a donor's role in the broader network—whether they're central influencers or peripheral supporters—we need to calculate centrality measures that consider the entire graph topology.

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

Earlier, we discussed separating our undirected network into components, which is where we identify sets of vertices that do not share any edges with other components in our network. While we have the ability to quickly identify and act on these components, we rarely have components that are completely isolated in the real-world. Often these loosely-connected clusters still have a small number of edges connecting them to other vertices in the network. Since they have these connections to other parts of the graph, they are not considered their own components and thus are not identified as such. However, we still want to be able to identify these parts of the graphs with low connectivity as being unique communities. In other words, we want to identify the [graph partitions](https://en.wikipedia.org/wiki/Graph_partition) in our graph.

Understanding partitions in our donor network allows us to identify natural groupings of donors and funds that share common characteristics or giving patterns. For example, we might discover that donors who give to athletic programs form a distinct community from those who support academic scholarships, even if there's some overlap. These insights can inform targeted fundraising campaigns, help us understand donor motivations, and identify opportunities to bridge disconnected communities within our network.

The challenge with partitioning is that unlike component detection, there's no single "correct" answer. Different partitioning methods will yield different results, and the best approach depends on what questions we're trying to answer about our donor network. This is where stochastic block models become invaluable.

{% include components/heading.html heading='Understanding Stochastic Block Models' level=3 %}

Stochastic block models (SBMs) are a family of statistical models that help us discover community structure in networks. At their core, SBMs work by assuming that vertices in a network can be grouped into blocks (or communities), and that the probability of an edge existing between two vertices depends primarily on which blocks they belong to. Rather than us manually defining communities, SBMs infer them from the network structure itself.

The process of identifying these partitions is actually a denser topic than we can fully cover here, but fortunately for us, graph_tool has already implemented sophisticated functionality to identify partitions, so we do not need to learn how to implement these algorithms ourselves and can focus on understanding when to use each approach.

Graph Tool's [inference](https://graph-tool.skewed.de/static/doc/inference.html) subpackage implements several variants of stochastic block modeling. These same mathematical approaches used to generate random graphs with specific properties can be used to make inferences about naturally occurring graphs, such as a donor network. Let's explore the different types of stochastic block models available and when each is most appropriate for analyzing donor networks.

{% include components/heading.html heading='Standard Stochastic Block Model' level=3 %}

The standard SBM is the simplest and most fundamental partitioning approach. It assumes that all vertices within a block have similar connectivity patterns, and it attempts to group vertices into blocks that maximize the likelihood of the observed network structure.

For donor networks, the standard SBM is most useful when we want to identify broad donor segments based purely on giving patterns. For instance, it might reveal that we have a group of donors who give exclusively to athletics, another group focused on academic programs, and a third group that supports general institutional funds.

{% highlight python linenos %}{% raw %}from graph_tool import inference

# Standard stochastic block model
state = inference.minimize_blockmodel_dl(graph)

blocks = state.get_blocks()
partitions = graph.new_vertex_property('int')

for vertex in graph.vertices():
    partitions[vertex] = blocks[vertex]
        
graph.vertex_properties['partitions'] = partitions

# Examine the number of blocks discovered
num_blocks = len(set(blocks.a))
print 'Discovered %s blocks in the donor network' % num_blocks
{% endraw %}{% endhighlight %}

The standard SBM works well when:
- You want a simple, interpretable partition of your donor network
- The communities in your network have relatively uniform internal connectivity
- You're doing exploratory analysis to get a first understanding of donor segments
- Computational resources are limited (it's faster than more complex models)

However, the standard SBM has limitations. It doesn't account for the fact that some donors or funds might naturally have more connections than others (what we call "degree heterogeneity"), and it assumes each vertex belongs to exactly one community.

{% include components/heading.html heading='Degree-Corrected Stochastic Block Model' level=3 %}

In real donor networks, we often observe high degree heterogeneity. Some funds receive donations from hundreds of donors (like a general scholarship fund), while others might only receive gifts from a handful of supporters (like a memorial fund). Similarly, some donors give to many different funds while others focus their philanthropy narrowly.

The degree-corrected SBM (dc-SBM) accounts for this heterogeneity by allowing vertices within the same block to have different degrees. This prevents the model from placing all high-degree vertices into the same block simply because they have many connections.

For donor networks, this is particularly important. Without degree correction, a standard SBM might incorrectly group all major donors together simply because they each give to many funds, even if those funds serve completely different purposes. The dc-SBM can identify that a major donor to athletics and a major donor to medical research belong to different communities, even though both have high degrees.

{% highlight python linenos %}{% raw %}from graph_tool import inference

# Degree-corrected stochastic block model
state = inference.minimize_blockmodel_dl(graph, deg_corr=True)

blocks = state.get_blocks()
dc_partitions = graph.new_vertex_property('int')

for vertex in graph.vertices():
    dc_partitions[vertex] = blocks[vertex]
        
graph.vertex_properties['dc_partitions'] = dc_partitions
{% endraw %}{% endhighlight %}

Use the degree-corrected SBM when:
- Your donor network has significant variation in the number of connections per vertex
- You have both major donors (giving to many funds) and focused donors (giving to few funds)
- You want to identify communities based on giving patterns rather than giving volume
- You need more nuanced segmentation that accounts for donor behavior heterogeneity

{% include components/heading.html heading='Nested Hierarchical Block Models' level=3 %}

Donor communities often have natural hierarchies. For example, at the broadest level you might have donors interested in "Academic Programs" versus "Athletic Programs." Within academic programs, you might have sub-communities supporting "STEM Fields," "Liberal Arts," and "Professional Programs." Within STEM, you might find even finer divisions between donors supporting "Engineering," "Natural Sciences," and "Computer Science."

The nested (or hierarchical) SBM captures these multi-level community structures by fitting a hierarchy of partitions, where blocks at one level are themselves partitioned into sub-blocks at the next level. This reveals the full organizational structure of your donor network at multiple scales.

{% highlight python linenos %}{% raw %}from graph_tool import inference

# Nested hierarchical block model
state = inference.minimize_nested_blockmodel_dl(graph)

levels = state.get_levels()

print 'Discovered %s levels in the hierarchy' % len(levels)

# Extract partition assignments at each level
vertex_partitions = dict((vertex, []) for vertex in graph.vertices())
for level_index, level in enumerate(levels):
    level_blocks = level.get_blocks()
    num_blocks_at_level = len(set(level_blocks.a))
    print 'Level %s has %s blocks' % (level_index, num_blocks_at_level)
    
    for vertex in graph.vertices():
        vertex_partitions[vertex].append(level_blocks[vertex])

nested_partitions = graph.new_vertex_property('vector<int>')

for vertex, values in vertex_partitions.items():
    nested_partitions[vertex] = values

graph.vertex_properties['nested_partitions'] = nested_partitions
{% endraw %}{% endhighlight %}

The nested model is particularly powerful for donor networks because:
- It reveals how donor interests are organized at multiple levels of granularity
- It can inform targeted fundraising at different scales (broad campaigns vs. niche appeals)
- It helps identify which funds serve as "bridges" between different parts of the hierarchy
- It provides insights for fund development - you might create new funds that serve underrepresented niches in the hierarchy

Use nested models when:
- You suspect your donor network has multi-level community structure
- You want to understand both broad donor segments and fine-grained sub-communities
- You're planning campaigns that need to target at different levels of specificity
- You have sufficient data to support hierarchical inference (generally, larger networks)

Note that nested models take significantly longer to train than single-level models, even on powerful machines. For networks with tens of thousands of vertices, expect training to take hours or even days.

{% include components/heading.html heading='Overlapping Block Models' level=3 %}

All the models we've discussed so far assume that each vertex belongs to exactly one community. But in reality, donors often have multiple interests. A donor might support both athletics and academic scholarships, genuinely belonging to both communities. Similarly, some funds might naturally attract donors from multiple distinct communities.

Overlapping block models allow vertices to belong to multiple blocks simultaneously. In the context of donor networks, this can reveal:
- Donors with diverse philanthropic interests who bridge multiple communities
- Funds that appeal across traditional community boundaries
- Opportunities for cross-community fundraising initiatives

{% highlight python linenos %}{% raw %}from graph_tool import inference

# For overlapping communities, we use a different approach
# Graph-tool's overlapping SBM is accessed through the layered model
state = inference.minimize_blockmodel_dl(graph, 
                                         layers=True,
                                         deg_corr=True)

# Extract overlapping memberships
# Each vertex can now belong to multiple blocks across different "layers"
overlapping_blocks = state.get_overlap_blocks()
{% endraw %}{% endhighlight %}

Overlapping models are most useful when:
- You know donors often support multiple unrelated causes
- You want to identify "bridge" donors who connect different communities
- You're interested in understanding how different giving areas overlap
- You want to find funds that have cross-community appeal

However, overlapping models are more complex to interpret and computationally intensive, so use them when the additional complexity is justified by your analytical needs.


{% include components/heading.html heading='Planted Partition Model' level=3 %}

The Planted Partition Model (PPM) is useful when you have strong prior hypotheses about community structure that you want to test against your data. Unlike the exploratory models we've discussed, PPM allows you to specify expected community structure and then evaluate how well your donor network conforms to this structure.

This is particularly valuable when you want to validate existing donor segmentation schemes. For example, your advancement office might categorize donors as "Athletics Supporters," "Academic Donors," "Healthcare Philanthropists," and "General Contributors" based on their primary giving area. The planted partition model can test whether this categorization actually reflects the underlying network structure, or whether the data suggests different natural communities.

{% highlight python linenos %}{% raw %}from graph_tool import inference

# Define your hypothesized partition structure
# For example, based on existing donor classifications
hypothesized_blocks = graph.new_vertex_property('int')

# Assign vertices to hypothesized blocks based on your classification scheme
# This could come from your CRM system's donor segments
for vertex in graph.vertices():
    donor_id = entity_ids[vertex]
    # Look up the donor's hypothesized community from your existing classification
    hypothesized_blocks[vertex] = get_donor_segment(donor_id)

# Fit the planted partition model
state = inference.PPBlockState(graph, b=hypothesized_blocks)

# Evaluate how well the hypothesized structure fits the data
# Lower values indicate better fit
description_length = state.entropy()
print 'Description length of hypothesized partition: %s' % description_length

# Compare to the optimal partition found by standard SBM
optimal_state = inference.minimize_blockmodel_dl(graph)
optimal_dl = optimal_state.entropy()
print 'Description length of optimal partition: %s' % optimal_dl

if description_length < optimal_dl * 1.1:  # Within 10% of optimal
    print 'Hypothesized partition is reasonably good'
else:
    print 'Data suggests different community structure than hypothesized'
{% endraw %}{% endhighlight %}

Use the Planted Partition Model when:
- You have existing donor segmentation schemes you want to validate
- Leadership has proposed a specific way to organize fundraising teams and you want to test if it aligns with actual donor behavior
- You're migrating from another institution and want to see if their donor categories apply to your network
- You want to test specific hypotheses about community structure (e.g., "Are our alumni donors really distinct from our non-alumni donors?")

The key insight from PPM isn't just whether your hypothesis is perfect, but how much better (or worse) it is compared to the data-driven partition. This can inform whether you should maintain existing categories or restructure your donor organization.

{% include components/heading.html heading='Ranked Stochastic Block Model' level=3 %}

The Ranked Stochastic Block Model introduces an ordered hierarchy to blocks, which is perfect for donor networks where communities have natural rankings or tiers. Unlike the nested models which create tree-like hierarchies, the ranked model assumes blocks exist on a spectrum or ladder.

In fundraising, we often think in terms of donor pyramids or giving tiers. The ranked SBM can identify these tiers directly from the network structure rather than relying solely on gift amounts. This reveals which donors are "climbing the ladder" of institutional engagement and which funds serve as gateways between tiers.

{% highlight python linenos %}{% raw %}from graph_tool import inference

# Fit a ranked stochastic block model
# This will identify both the blocks and their ranking
state = inference.RankedBlockState(graph)

# Minimize to find optimal ranked partition
for i in range(1000):
    state.multiflip_mcmc_sweep(niter=10, beta=float('inf'))

# Extract both block assignments and their ranks
blocks = state.get_blocks()
block_ranks = state.get_block_rank()

# Create property maps
ranked_partitions = graph.new_vertex_property('int')
rank_levels = graph.new_vertex_property('int')

for vertex in graph.vertices():
    block_id = blocks[vertex]
    ranked_partitions[vertex] = block_id
    rank_levels[vertex] = block_ranks[block_id]

graph.vertex_properties['ranked_partitions'] = ranked_partitions
graph.vertex_properties['rank_levels'] = rank_levels

# Analyze the ranking structure
num_ranks = len(set(block_ranks.a))
print 'Discovered %s ranked levels in the donor network' % num_ranks

# Identify donors in each rank
for rank in range(num_ranks):
    vertices_at_rank = [v for v in graph.vertices() 
                        if rank_levels[v] == rank]
    print 'Rank %s contains %s vertices' % (rank, len(vertices_at_rank))
{% endraw %}{% endhighlight %}

The ranked model is particularly insightful for:
- **Donor Cultivation Pathways**: Identify the natural progression of donor engagement from entry-level to major gifts
- **Fund Positioning**: Understand which funds appeal to which tiers, allowing you to create "starter funds" for newer donors and "prestige funds" for established philanthropists
- **Predictive Analytics**: Identify which donors are positioned to move to the next tier and focus cultivation efforts accordingly
- **Event Stratification**: Design events appropriate for each tier rather than one-size-fits-all approaches

Use the Ranked Stochastic Block Model when:
- Your donor network has clear hierarchical tiers based on engagement level
- You want to understand donor progression and cultivation pathways
- You need to identify "bridge" donors who connect different tiers
- You're designing tiered recognition programs and want them to match natural network structure

{% include components/heading.html heading='Modularity Maximization' level=3 %}

Newman's modularity is one of the most well-known approaches to community detection in networks. Modularity measures how well a partition divides a network into communities by comparing the actual number of edges within communities to what you'd expect in a random network with the same degree distribution.

While modularity optimization is conceptually simpler than Bayesian approaches, it has well-documented limitations, particularly the "resolution limit" - it may fail to detect small communities in large networks. However, it's computationally efficient and produces results that are often easier to explain to non-technical stakeholders.

{% highlight python linenos %}{% raw %}from graph_tool import inference

# Fit a modularity-based partition
state = inference.ModularityState(graph)

# Optimize modularity
for i in range(1000):
    state.multiflip_mcmc_sweep(niter=10, beta=float('inf'))

# Extract partition
blocks = state.get_blocks()
modularity_partitions = graph.new_vertex_property('int')

for vertex in graph.vertices():
    modularity_partitions[vertex] = blocks[vertex]

graph.vertex_properties['modularity_partitions'] = modularity_partitions

# Calculate the modularity score
modularity_value = state.modularity()
print 'Network modularity: %s' % modularity_value
print 'Number of communities: %s' % len(set(blocks.a))
{% endraw %}{% endhighlight %}

For donor networks, modularity optimization works well when:
- You need quick, interpretable results for reporting to leadership
- Your network doesn't have extremely small communities you need to detect
- You're doing comparative analysis across multiple time periods (modularity scores are comparable)
- You want a well-established method that stakeholders may already understand from the literature

However, be cautious of modularity's limitations:
- It may merge small but meaningful donor communities into larger groups
- The resolution limit means you might miss niche fundraising opportunities
- It doesn't handle degree heterogeneity as well as degree-corrected models

In practice, modularity optimization is often a good starting point for exploratory analysis, but consider more sophisticated models like degree-corrected SBM for final analyses that will drive fundraising strategy.

{% include components/heading.html heading='Normalized Cut Partitioning' level=3 %}

The Normalized Cut approach comes from the graph partitioning literature and focuses on finding balanced partitions that minimize connections between communities while accounting for community size. Unlike modularity, which can produce very unbalanced partitions, normalized cuts tend to create more evenly-sized communities.

For donor networks, this can be valuable when you want to divide donors into groups of roughly equal size for assignment to development officers or for creating balanced comparison groups in A/B testing of fundraising strategies.

{% highlight python linenos %}{% raw %}from graph_tool import inference

# Fit a normalized cut partition
# You can specify the number of blocks you want
desired_blocks = 8  # e.g., one per development officer
state = inference.NormCutState(graph, B=desired_blocks)

# Optimize the normalized cut
for i in range(1000):
    state.multiflip_mcmc_sweep(niter=10, beta=float('inf'))

# Extract partition
blocks = state.get_blocks()
normcut_partitions = graph.new_vertex_property('int')

for vertex in graph.vertices():
    normcut_partitions[vertex] = blocks[vertex]

graph.vertex_properties['normcut_partitions'] = normcut_partitions

# Analyze partition balance
block_sizes = dict()
for vertex in graph.vertices():
    block_id = blocks[vertex]
    if block_id not in block_sizes:
        block_sizes[block_id] = 0
    block_sizes[block_id] += 1

print 'Block sizes:'
for block_id, size in sorted(block_sizes.items()):
    print 'Block %s: %s vertices' % (block_id, size)

# Calculate normalized cut value
cut_value = state.cut()
print 'Normalized cut value: %s' % cut_value
{% endraw %}{% endhighlight %}

Normalized cut partitioning is particularly useful for:
- **Workload Balancing**: Assign donors to development officers in balanced groups
- **A/B Testing**: Create comparable donor segments for testing fundraising appeals
- **Regional Organization**: Divide donors geographically while maintaining balanced territories
- **Campaign Planning**: Create balanced donor pools for simultaneous campaigns

Use Normalized Cut when:
- You need partitions of approximately equal size
- You're distributing donors among a fixed number of staff members or campaigns
- Balance is more important than finding the "most natural" communities
- You're doing experimental design and need comparable treatment groups

Keep in mind that enforcing balance may split natural communities, so normalized cut partitions may be less interpretable than those found by community detection methods. Use it when operational constraints require balance.

{% include components/heading.html heading='Parallel Tempering for Robust Inference' level=3 %}

All the partitioning methods we've discussed face a common challenge: the optimization landscape is complex with many local optima. You might find a good partition, but not the best partition. Parallel tempering is an advanced MCMC technique that helps overcome this by running multiple "replicas" of your model at different "temperatures" simultaneously.

Higher temperature replicas explore the partition space more freely, potentially finding better regions of the optimization landscape. Lower temperature replicas refine these discoveries. The replicas occasionally swap states, allowing good solutions found at high temperatures to be refined at low temperatures.

{% highlight python linenos %}{% raw %}from graph_tool import inference

# First, create multiple state instances at different temperatures
# We'll use degree-corrected SBM as our base model
states = []
betas = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0]  # Inverse temperatures

for beta in betas:
    state = inference.minimize_blockmodel_dl(graph, deg_corr=True)
    states.append(state)

# Create the parallel tempering state
tempering_state = inference.TemperingState(states, betas)

# Run parallel tempering
# The states will explore and exchange configurations
for i in range(1000):
    # Perform MCMC sweeps on all replicas
    ret = tempering_state.multiflip_mcmc_sweep(niter=10)
    
    # Attempt replica exchanges
    tempering_state.swap_move()
    
    if i % 100 == 0:
        # Check the lowest-temperature (most refined) state
        best_state = states[-1]  # Highest beta = lowest temperature
        best_dl = best_state.entropy()
        print 'Iteration %s: Best description length = %s' % (i, best_dl)

# Extract the best partition from the lowest-temperature replica
best_state = states[-1]
blocks = best_state.get_blocks()
tempered_partitions = graph.new_vertex_property('int')

for vertex in graph.vertices():
    tempered_partitions[vertex] = blocks[vertex]

graph.vertex_properties['tempered_partitions'] = tempered_partitions
{% endraw %}{% endhighlight %}

Parallel tempering is most valuable when:
- You're working with large, complex donor networks where standard optimization might get stuck
- You need the highest quality partition possible for critical strategic decisions
- You have computational resources to run extended optimization (multiple hours or days)
- Previous optimization attempts have produced inconsistent results across runs
- You're publishing results or presenting to leadership and need confidence in the partition quality

The computational cost is significant - you're essentially running multiple models simultaneously - but for important strategic analyses, parallel tempering can provide more reliable results than single-run optimization.

Don't use parallel tempering for:
- Exploratory analysis where approximate results are sufficient
- Time-sensitive analyses where you need quick results
- Small networks where standard optimization works well
- Routine reporting where the computational cost isn't justified

{% include components/heading.html heading='Clique Detection for Tight-Knit Communities' level=3 %}

A clique is a subset of vertices where every vertex is connected to every other vertex - a completely interconnected group. In donor networks, cliques represent the tightest possible communities: groups of donors who have all given to all the same funds (or vice versa for fund cliques).

While perfect cliques are rare in real networks, near-cliques and clique-like structures reveal important patterns. They might represent:
- Coordinated giving circles or family foundations
- Event-driven giving (all attendees of a gala supporting the same funds)
- Funds that always appear together in donor portfolios
- Boards or committees whose members all support related initiatives

{% highlight python linenos %}{% raw %}from graph_tool import inference

# Find clique decomposition of the network
state = inference.CliqueState(graph)

# The clique state represents the network as an overlap of cliques
# Extract clique memberships
clique_membership = state.get_clique_membership()

# Analyze clique structure
cliques = dict()
for vertex in graph.vertices():
    vertex_cliques = clique_membership[vertex]
    for clique_id in vertex_cliques:
        if clique_id not in cliques:
            cliques[clique_id] = []
        cliques[clique_id].append(vertex)

# Find largest cliques
clique_sizes = [(cid, len(members)) for cid, members in cliques.items()]
clique_sizes.sort(key=lambda x: x[1], reverse=True)

print 'Top 10 largest cliques:'
for i, (clique_id, size) in enumerate(clique_sizes[:10]):
    print 'Clique %s: %s members' % (clique_id, size)
    
    # Examine members of large cliques
    if size > 5:  # Focus on substantial cliques
        members = cliques[clique_id]
        print 'Members: %s' % [entity_ids[v] for v in members]

# Identify vertices that belong to multiple cliques
# These are "connector" donors/funds
clique_counts = graph.new_vertex_property('int')
for vertex in graph.vertices():
    clique_counts[vertex] = len(clique_membership[vertex])

graph.vertex_properties['clique_counts'] = clique_counts

# Find highly connected vertices
high_clique_vertices = [v for v in graph.vertices() 
                        if clique_counts[v] > 3]
print '%s vertices belong to 4+ cliques' % len(high_clique_vertices)
{% endraw %}{% endhighlight %}

Clique detection is particularly insightful for:
- **Identifying Giving Circles**: Groups of donors who coordinate their philanthropy
- **Event Analysis**: Which funds are consistently supported together at fundraising events
- **Bundle Opportunities**: Which funds should be packaged together in appeals
- **Network Influencers**: Donors or funds that participate in many tight-knit groups
- **Coordinated Campaigns**: Understanding which donor groups move together

Use clique detection when:
- You suspect coordinated giving behavior in your network
- You want to identify natural fund bundles for marketing
- You're analyzing event-based fundraising and need to understand co-attendance patterns
- You want to find the "core" of different donor communities
- You're looking for giving circles or donor networks that operate semi-independently

However, note that:
- True cliques are rare in large networks, so you may need to relax the definition
- Clique detection can be computationally intensive on large graphs
- Results may be more useful for identifying patterns than for comprehensive network partitioning

{% include components/heading.html heading='Comparing and Selecting Block Models' level=3 %}

With so many block model options available, how do you choose? Here's a practical decision framework based on your analytical goals:

**Start with these questions:**

1. **Do you have hypotheses to test?** → Use Planted Partition Model
2. **Do you need balanced groups?** → Use Normalized Cut
3. **Is there a natural hierarchy or ranking?** → Use Ranked or Nested models
4. **Are you looking for tight-knit subgroups?** → Use Clique Detection
5. **Do you need a quick, explainable result?** → Use Modularity
6. **Do you need the highest quality partition?** → Use Degree-Corrected SBM with Parallel Tempering
7. **Is this exploratory or strategic?** → Exploratory: Modularity or Standard SBM; Strategic: Degree-Corrected SBM

**Comparing model quality:**

With so many partitioning approaches available, choosing the right one requires more than intuition.  We need quantitative comparison. Different models make different assumptions about community structure, and the best choice depends on both your data characteristics and your fundraising goals. Fortunately, we can compare partition quality objectively using description length for Bayesian models or modularity scores for optimization-based approaches. This allows us to evaluate whether the added complexity of degree-corrected or nested models actually improves our understanding of the donor network:

{% highlight python linenos %}{% raw %}# Fit multiple models
standard_state = inference.minimize_blockmodel_dl(graph)
dc_state = inference.minimize_blockmodel_dl(graph, deg_corr=True)
modularity_state = inference.ModularityState(graph)

# Compare description lengths (lower is better for SBM-based models)
print 'Standard SBM: %s' % standard_state.entropy()
print 'Degree-Corrected SBM: %s' % dc_state.entropy()

# For modularity, higher scores indicate better partitioning
print 'Modularity: %s' % modularity_state.modularity()

# You can also compare based on your specific criteria
# For example, how balanced are the partitions?
def partition_balance(state):
    blocks = state.get_blocks()
    block_sizes = dict()
    for vertex in graph.vertices():
        bid = blocks[vertex]
        block_sizes[bid] = block_sizes.get(bid, 0) + 1
    
    sizes = list(block_sizes.values())
    return max(sizes) / min(sizes)  # Ratio of largest to smallest

print 'Standard SBM balance ratio: %s' % partition_balance(standard_state)
print 'DC-SBM balance ratio: %s' % partition_balance(dc_state)
{% endraw %}{% endhighlight %}

These quantitative comparisons reveal important trade-offs. A model with lower description length isn't necessarily "better" if it produces partitions that don't align with actionable fundraising segments. Similarly, perfect balance (from normalized cuts) may split natural donor communities that should be kept together. Use these metrics to narrow your choices, but always validate that the resulting partitions make practical sense for your institution's fundraising strategy. The best partition is one that both fits the data well and translates into clear, actionable donor segments.

**Practical recommendations:**

For most donor network analyses, I recommend this workflow:

1. **Start with Degree-Corrected SBM** for initial exploration - it handles degree heterogeneity well and provides good general-purpose partitions
2. **Add MCMC Equilibration** to refine results and ensure quality
3. **Compute Marginal Probabilities** to understand confidence in assignments
4. **Use Specialized Models** for specific questions:
   - Planted Partition to validate existing segments
   - Ranked models to understand donor progression
   - Clique detection to find coordinated giving
   - Normalized cuts when you need operational balance

5. **Apply Parallel Tempering** only for final strategic analyses where you need maximum confidence

{% include components/heading.html heading='Practical Applications of Different Partition Types' level=3 %}

Different partition models naturally lead to different fundraising strategies:

**Standard/Degree-Corrected SBM Partitions:**
- Design community-specific fundraising campaigns
- Allocate development officers by community rather than geography
- Create targeted donor recognition programs
- Identify underserved communities for fund development

**Ranked Model Partitions:**
- Build donor cultivation ladders with clear progression paths
- Design tier-appropriate solicitation strategies
- Identify donors ready to move to the next level
- Create recognition programs that match natural network tiers

**Planted Partition Results:**
- Validate or revise existing donor segmentation
- Assess whether organizational structure aligns with actual donor behavior
- Identify misclassified donors for reclassification
- Justify data-driven reorganizations to leadership

**Normalized Cut Partitions:**
- Assign balanced donor portfolios to development officers
- Create equivalent test groups for A/B testing appeals
- Organize territories for annual campaigns
- Structure volunteer committees with balanced member bases

**Clique Detection Results:**
- Identify giving circles for targeted group solicitations
- Find natural fund bundles for packaged appeals
- Discover coordinated donor groups for event planning
- Locate "connector" donors who bridge multiple communities

The key is matching the model to both your analytical question and your intended action. A perfect partition that doesn't lead to actionable insights is less valuable than an approximate partition that clearly informs fundraising strategy.

{% include components/heading.html heading='Refining Models with MCMC Equilibration' level=3 %}

Once we've selected an appropriate model type, we need to ensure we've found the best possible partition rather than settling for a mediocre one. Stochastic block models optimize over a vast landscape of possible partitions, and initial fitting can get stuck in local optima—similar to a hiker finding a nearby hilltop but missing the actual mountain peak. Markov Chain Monte Carlo (MCMC) equilibration systematically explores this landscape to refine our partition assignments. This iterative process continues until the model converges on stable, high-quality results that we can trust for strategic fundraising decisions:

{% highlight python linenos %}{% raw %}# Start with your chosen model (standard, degree-corrected, or nested)
state = inference.minimize_nested_blockmodel_dl(graph, deg_corr=True)

# Run MCMC equilibration to refine results
# wait: number of iterations to wait for convergence
# nbreaks: number of consecutive convergence checks needed
# niter: number of iterations per MCMC sweep
inference.mcmc_equilibrate(state, 
                          wait=100, 
                          nbreaks=2, 
                          mcmc_args=dict(niter=10), 
                          verbose=True)

# Extract refined partitions
levels = state.get_levels()
vertex_partitions = dict((vertex, []) for vertex in graph.vertices())

for level in levels:
    level_blocks = level.get_blocks()
    for vertex in graph.vertices():
        vertex_partitions[vertex].append(level_blocks[vertex])

refined_nested_partitions = graph.new_vertex_property('vector<int>')

for vertex, values in vertex_partitions.items():
    refined_nested_partitions[vertex] = values

graph.vertex_properties['refined_nested_partitions'] = refined_nested_partitions
graph.save(file_name)
{% endraw %}{% endhighlight %}

The equilibration process is especially valuable because it provides confidence that our partitions represent genuine community structure rather than artifacts of initialization. Without equilibration, running the same analysis twice might yield different donor segments which is an unacceptable inconsistency when these partitions will inform fundraising strategy and staff assignments. While equilibration adds computational time, it's a worthwhile investment for any analysis that will drive significant resource allocation or campaign planning decisions.

{% include components/heading.html heading='Assessing Partition Uncertainty' level=3 %}

Since these partitions are inferred probabilistically rather than deterministically, it's valuable to understand the confidence of our partition assignments. We can quantify this uncertainty by running Monte Carlo simulations that estimate the probability of each vertex belonging to each block.

This is particularly important for donor networks because it tells us which donor-community assignments are confident (this donor definitely belongs to the athletics community) versus uncertain (this donor might belong to either athletics or general giving communities). Understanding this uncertainty can inform how we approach donor engagement.

{% highlight python linenos %}{% raw %}class MonteCarloResults(object):
    """Container for collecting marginal probabilities during MCMC"""
    
    def __init__(self, levels):
        self.vertex_partitions = [None] * len(levels)
        self.edge_partitions = [None] * len(levels)

    def nested_callback(self, state):
        """Called after each MCMC sweep to collect marginals"""
        levels = state.get_levels()
        for index, level in enumerate(levels):
            self.vertex_partitions[index] = level.collect_vertex_marginals(
                self.vertex_partitions[index])
            self.edge_partitions[index] = level.collect_edge_marginals(
                self.edge_partitions[index])

# Initialize the model
state = inference.minimize_nested_blockmodel_dl(graph, deg_corr=True)

# Create results container
results = MonteCarloResults(state.get_levels())

# Run MCMC with marginal collection
inference.mcmc_equilibrate(state, 
                          wait=100, 
                          nbreaks=2, 
                          mcmc_args=dict(niter=10), 
                          callback=results.nested_callback, 
                          verbose=True)

# Visualize partition uncertainty
# Vertices will be drawn as pie charts showing probability of block membership
levels = state.get_levels()
state_0 = levels[0]
state_0.draw(vertex_shape="pie", 
            vertex_pie_fractions=results.vertex_partitions[0],
            output_size=(5000, 5000), 
            output="vertex_marginal_probabilities.png")

# Access marginal probabilities for decision-making
# For example, only target donors with >80% confidence in their block assignment
for vertex in graph.vertices():
    marginals = results.vertex_partitions[0][vertex]
    max_probability = max(marginals)
    if max_probability > 0.8:
        # High confidence assignment - safe to act on
        print 'Vertex %s: confident assignment' % vertex
    else:
        # Uncertain assignment - may need manual review or additional data
        print 'Vertex %s: uncertain assignment' % vertex
{% endraw %}{% endhighlight %}

{% include components/heading.html heading='Practical Applications of Partitions' level=3 %}

Once we've identified partitions in our donor network, we can leverage them for numerous fundraising activities:

**Targeted Campaigns**: Design fundraising campaigns specific to each community. Donors in the athletics partition receive appeals about sports programs, while those in the academic partition hear about scholarships and research.

**Cross-Community Opportunities**: Identify donors at the boundaries between communities who might be receptive to causes in adjacent partitions. A donor giving to both athletics and general operations might be open to supporting student-athlete academic support programs.

**Fund Development Strategy**: Use hierarchical partitions to identify gaps in your fund portfolio. If you discover a large donor community but few funds serving that community's interests, you have an opportunity to create new funds.

**Donor Cultivation Paths**: Understand how donors might naturally progress through communities over time. A new donor might start in the general giving community, then specialize into a specific area as their relationship with the institution deepens.

**Event Planning**: Design donor events that bring together members of specific communities, or intentionally create events that bridge communities to expand donor networks.

**Resource Allocation**: Allocate fundraising staff based on the size and giving potential of different communities rather than arbitrary geographic or alphabetical divisions.


{% include components/heading.html heading='Choosing the Right Model' level=3 %}

Here's a decision framework for selecting the appropriate stochastic block model for your donor network analysis:

1. **Start with Standard SBM** if you're doing exploratory analysis and want quick, interpretable results
2. **Add Degree Correction** if your network has significant variation in vertex degrees (which most donor networks do)
3. **Use Nested Models** when you need multi-scale insights or suspect hierarchical community structure
4. **Consider Overlapping Models** only when non-overlapping communities would miss critical insights about multi-interest donors
5. **Always apply MCMC Equilibration** to refine your results and escape local optima
6. **Compute Marginal Probabilities** when you need to understand confidence in assignments or when making high-stakes decisions based on partitions

Remember that model selection is not just about computational considerations - it should be driven by the questions you're trying to answer about your donor network. A simpler model that provides actionable insights is better than a complex model that's difficult to interpret and act upon.



{% include components/heading.html heading='Co-occurrence Graphs' level=2 %}

Higher education philanthropy offers many opportunities for giving to specific causes that donors identify with. In fact, for some institutions there are so many opportunities that potential donors can suffer from overchoice or choice overload, leading them to walk away rather than make a choice. We must identify fund recommendations for each donor that maximize the likelihood of conversion.

Above we discussed using the full network topology to make recommendations based on components and centrality measures. But with large networks containing hundreds of thousands of donors, computing paths through the entire graph becomes computationally expensive. For fund recommendation specifically, we don't actually need the donor vertices in our calculations—we only need to know which funds tend to attract the same types of donors. This insight leads us to co-occurrence networks, a simplified graph structure that dramatically reduces both memory requirements and computation time while still enabling sophisticated recommendation algorithms.

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

Now that we have our co-occurrence graph, we've dramatically simplified our computational problem. By eliminating donor vertices and connecting funds directly through their shared supporters, we've reduced memory requirements while preserving the essential relationship patterns we need for recommendations. A full bipartite graph with 50,000 donors and 5,000 funds would require storing 55,000 vertices; our co-occurrence graph needs only 5,000. More importantly, computing paths and similarities between funds is now orders of magnitude faster since we're not traversing through intermediate donor vertices. This makes real-time recommendation systems feasible even for institutions without extensive computational infrastructure.

We can now provide fund recommendations using just the edge properties that capture donor attributes and giving patterns. For instance, if we want to recommend funds to female alumni donors, we can traverse edges labeled with those attributes without needing to query individual donor records.

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

Up to this point, we've analyzed our donor network using structural features like centrality, clustering, and partitioning. These approaches help us understand the overall topology and identify communities within the network. However, many fundraising challenges require us to make predictions about individual donors or funds based on their network position and the characteristics of similar vertices. For instance, we might want to predict which donors are likely to increase their giving next year, or which new donors will become long-term supporters, or which funds a particular donor might be receptive to supporting.

These prediction tasks require us to represent donors and funds as feature vectors that machine learning algorithms can process. The challenge is capturing the rich relational information in our network—a donor's connections, their position in the topology, their similarity to other donors—in a numerical format. This is where vertex classification and graph embeddings become essential tools.

{% include components/heading.html heading='Understanding Vertex Similarity' level=3 %}

Vertex similarity is the foundation for many predictive tasks in donor networks. Two donors might be considered similar if they:
- Give to many of the same funds
- Occupy similar positions in the network topology (similar centrality, clustering, etc.)
- Share demographic or behavioral attributes
- Are connected through short paths in the network
- Belong to the same communities or partitions

Understanding similarity allows us to make powerful inferences. If we know that Donor A is highly similar to Donor B, and Donor B recently made a major gift to Fund X, we can predict that Donor A might also be receptive to solicitations for Fund X. Similarly, if most donors similar to Donor C tend to increase their giving over time, we might predict that Donor C is also a good cultivation prospect.

The challenge is that "similarity" is multifaceted. Two donors might be topologically similar (occupying equivalent positions in the network structure) without being behaviorally similar (giving to completely different types of funds). Conversely, two donors might support identical causes but have very different levels of engagement with the institution. Effective similarity measures must balance these different dimensions based on the specific prediction task at hand.

{% include components/heading.html heading='Matrix Representations of Graphs' level=3 %}

The most straightforward way to represent vertex relationships is through matrices. Graph-tool's spectral module provides several matrix representations, each capturing different aspects of network structure:

{% highlight python linenos %}{% raw %}from graph_tool import spectral

# Adjacency Matrix: Most basic representation
# Entry (i,j) is 1 if edge exists from vertex i to vertex j, 0 otherwise
# For weighted graphs, entries contain edge weights
adjacency_matrix = spectral.adjacency(graph, weight=amounts)

# Convert to dense matrix for machine learning (only for smaller graphs)
dense_adjacency = adjacency_matrix.todense()

# Laplacian Matrix: Captures graph structure for spectral analysis
# Useful for understanding graph connectivity and finding clusters
laplacian_matrix = spectral.laplacian(graph, weight=amounts)

# Normalized Laplacian: Better for graphs with varying vertex degrees
# Accounts for degree heterogeneity in the network
norm_laplacian = spectral.laplacian(graph, weight=amounts, normalized=True)

# Incidence Matrix: Represents vertex-edge relationships
# Entry (i,j) indicates if vertex i is connected to edge j
# Useful when edge properties are important for classification
incidence_matrix = spectral.incidence(graph)

# Transition Matrix: Represents random walk probabilities
# Entry (i,j) is probability of moving from vertex i to vertex j
# Useful for capturing flow dynamics in the network
transition_matrix = spectral.transition(graph, weight=amounts)
{% endraw %}{% endhighlight %}

Each matrix type serves different analytical purposes in donor networks:

**Adjacency matrices** are ideal when you want to classify donors based on which funds they support. The presence or absence of connections directly informs the model. For weighted adjacency matrices using donation amounts, similar donors are those who give similar amounts to similar funds.

**Laplacian matrices** are particularly useful for spectral clustering and understanding how information or influence might spread through the network. In fundraising, this can help identify which donors are positioned to influence others or which funds serve as bridges between communities.

**Incidence matrices** shine when edge properties matter more than just connectivity. If you're trying to predict whether a donor will give during a specific campaign based on the characteristics of previous campaign gifts, incidence matrices capture these edge-level features.

**Transition matrices** represent the probability of "moving" from one vertex to another in a random walk. In donor networks, this captures the likelihood that a donor who supports Fund A will also support Fund B. These matrices are foundational for recommendation systems and understanding donor journey pathways.

{% include components/heading.html heading='Spectral Features for Vertex Classification' level=3 %}

While we can use raw matrix entries as features, this approach has a critical limitation: the dimensionality equals the number of vertices in the graph. For a network with 50,000 donors and funds, each vertex would have 50,000 features, most of which are zeros. This high dimensionality makes machine learning computationally expensive and can lead to overfitting.

A more powerful approach is to extract spectral features—the eigenvectors of various matrix representations. These eigenvectors capture the dominant patterns of connectivity in much lower dimensions. Rather than 50,000 sparse features, we might represent each vertex with just 50 or 100 dense features that encode its position in the network's fundamental structure. Moreover, spectral features implicitly capture multi-hop relationships, meaning donors who occupy similar structural positions will have similar feature vectors even if they're not directly connected.

{% highlight python linenos %}{% raw %}from graph_tool import spectral
import numpy as np

# Extract leading eigenvectors of the adjacency matrix
# These capture the dominant patterns of connectivity
eigenvalues, eigenvectors = spectral.adjacency(graph, weight=amounts)

# The number of eigenvectors to use depends on your graph size
# Generally, use k eigenvectors where k << number of vertices
num_features = min(50, graph.num_vertices() // 10)

# Create feature matrix where each row is a vertex
# and columns are the eigenvector components
spectral_features = np.zeros((graph.num_vertices(), num_features))

for i in range(num_features):
    eigenvector = eigenvectors[:, i]
    spectral_features[:, i] = eigenvector

# Similarly extract Laplacian eigenvectors
# These are particularly good for clustering-aware classification
lap_eigenvalues, lap_eigenvectors = spectral.laplacian(graph, 
                                                         weight=amounts,
                                                         normalized=True)

# Combine spectral features from different matrices
combined_features = np.hstack([
    spectral_features,
    lap_eigenvectors[:, :num_features]
])
{% endraw %}{% endhighlight %}

Spectral features are powerful because they implicitly capture multi-hop relationships. A donor's position in the first eigenvector doesn't just depend on their immediate connections, but on the entire network structure. This means donors who occupy similar structural positions (even if they're not directly connected) will have similar spectral features.

In practice, spectral features excel at:
- **Donor segmentation**: Identifying donors with similar network roles
- **Fund categorization**: Grouping funds that attract structurally similar donor bases
- **Anomaly detection**: Finding donors whose giving patterns don't match their network position
- **Potential prediction**: Identifying which donors are positioned similarly to known major donors

{% include components/heading.html heading='Practical Vertex Classification with Scikit-Learn' level=3 %}

Now let's apply these matrix representations to actual classification tasks relevant to donor networks:

{% highlight python linenos %}{% raw %}from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import random

# Example 1: Predicting donor upgrade potential
# We want to predict which donors will increase giving next year

# Combine multiple feature sources
adjacency_matrix = spectral.adjacency(graph, weight=amounts)
transition_matrix = spectral.transition(graph, weight=amounts)

# Extract donor vertices only (exclude fund vertices in bipartite graph)
donor_mask = graph.new_vertex_property('bool')
for vertex in graph.vertices():
    # Assuming you have a vertex property indicating type
    donor_mask[vertex] = (entity_ids[vertex] is not None)

donor_indices = [int(v) for v in graph.vertices() if donor_mask[v]]

# Build feature matrix for donors
feature_list = []
label_list = []

# Assume we have a property indicating if donor upgraded
upgrade_property = graph.vertex_properties['upgraded_giving']

for vertex_idx in donor_indices:
    vertex = graph.vertex(vertex_idx)
    
    # Structural features from adjacency matrix
    connectivity = adjacency_matrix[vertex_idx, :].toarray().flatten()
    
    # Flow features from transition matrix  
    flow_probs = transition_matrix[vertex_idx, :].toarray().flatten()
    
    # Topological features we computed earlier
    betweenness = amount_betweenness[vertex]
    closeness = amount_closeness[vertex]
    clustering = local_clusters[vertex]
    degree = vertex.out_degree()
    
    # Combine all features
    features = np.concatenate([
        connectivity,
        flow_probs,
        [betweenness, closeness, clustering, degree]
    ])
    
    feature_list.append(features)
    label_list.append(upgrade_property[vertex])

# Convert to numpy arrays
X = np.array(feature_list)
y = np.array(label_list)

# Split into training and test sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# Scale features for better model performance
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train classifier
classifier = RandomForestClassifier(n_estimators=100, random_state=42)
classifier.fit(X_train_scaled, y_train)

# Evaluate
train_score = classifier.score(X_train_scaled, y_train)
test_score = classifier.score(X_test_scaled, y_test)

print('Training accuracy: %.3f' % train_score)
print('Test accuracy: %.3f' % test_score)

# Predict upgrade potential for all donors
predictions = classifier.predict_proba(scaler.transform(X))
upgrade_probabilities = predictions[:, 1]  # Probability of upgrade class

# Identify high-potential donors for targeted cultivation
high_potential_threshold = 0.7
high_potential_donors = [
    donor_indices[i] for i, prob in enumerate(upgrade_probabilities)
    if prob > high_potential_threshold
]

print('Identified %d high-potential donors for cultivation' % 
      len(high_potential_donors))
{% endraw %}{% endhighlight %}

This classification approach works well for many practical fundraising tasks:

**Lapsed donor re-engagement**: Predict which lapsed donors are most likely to resume giving based on their network position and historical patterns of similar donors.

**Major gift potential**: Identify donors with network positions and giving patterns similar to existing major donors, even if their current giving levels are modest.

**Planned giving prospects**: Find donors whose long-term engagement patterns and network embedding suggest receptiveness to planned giving conversations.

**Fund affinity prediction**: Predict which funds a donor might support based on the network positions and giving patterns of similar donors.

**Attrition risk**: Identify donors whose network position and recent activity patterns suggest elevated risk of ceasing engagement.

{% include components/heading.html heading='Limitations of Matrix-Based Approaches' level=3 %}

While matrix representations are powerful and computationally efficient for many tasks, they have important limitations for donor network analysis:

**Scalability concerns**: Dense matrix representations require O(n²) memory, where n is the number of vertices. For institutions with hundreds of thousands of donors and funds, even sparse matrices become unwieldy.

**Local neighborhood only**: Adjacency matrices only capture immediate connections. They don't inherently encode information about a vertex's broader neighborhood structure or its position in the global network topology.

**Fixed feature dimensions**: The dimensionality of matrix-based features is determined by the graph size, not by the inherent complexity of the patterns you're trying to capture. You either use all vertices as features (high dimensionality, many irrelevant features) or apply dimensionality reduction (potentially losing important information).

**Static representations**: Matrices represent a snapshot of the network. As donations occur and the network evolves, you must recompute the entire matrix representation.

**Attribute integration challenges**: While you can concatenate vertex attributes with matrix features, there's no principled way to weight the importance of network structure versus attributes. Should a donor's $10,000 gift count more or less than their structural position in the network?

These limitations motivate more sophisticated approaches to vertex representation.

{% include components/heading.html heading='Graph Embeddings and Random Walks' level=3 %}

Graph embeddings address many limitations of direct matrix representations by learning low-dimensional vector representations of vertices that preserve important network properties. Instead of representing each donor as a sparse vector of size equal to the number of vertices, we represent them as a dense vector of perhaps 128 or 256 dimensions.

The key insight is that we can learn these embeddings by simulating random walks through the network. A random walk starts at a vertex and randomly moves to connected vertices, creating a sequence of visited vertices. If we think of these walks as "sentences" and vertices as "words," we can apply techniques from natural language processing to learn vertex embeddings.

Graph-tool provides infrastructure for generating random walks, which can then be used with embedding algorithms:

{% highlight python linenos %}{% raw %}from graph_tool import topology
import random

def generate_random_walks(graph, num_walks=10, walk_length=80):
    """
    Generate random walks from each vertex in the graph.
    
    Args:
        graph: The donor network graph
        num_walks: Number of walks to generate per vertex
        walk_length: Length of each walk
        
    Returns:
        List of walks, where each walk is a list of vertex indices
    """
    walks = []
    
    vertices = list(graph.vertices())
    
    for walk_num in range(num_walks):
        if walk_num % 10 == 0:
            print('Generating walk set %d/%d' % (walk_num + 1, num_walks))
            
        # Shuffle vertices to get different starting points
        random.shuffle(vertices)
        
        for start_vertex in vertices:
            walk = [int(start_vertex)]
            current_vertex = start_vertex
            
            for step in range(walk_length - 1):
                neighbors = list(current_vertex.out_neighbors())
                
                if not neighbors:
                    # Dead end - restart from current position
                    break
                    
                # Random walk: choose next vertex uniformly
                next_vertex = random.choice(neighbors)
                walk.append(int(next_vertex))
                current_vertex = next_vertex
            
            walks.append(walk)
    
    return walks

# Generate walks for the donor network
walks = generate_random_walks(graph, num_walks=10, walk_length=80)

print('Generated %d random walks' % len(walks))
print('Example walk:', walks[0][:10])  # Show first 10 steps

# These walks capture local neighborhood structure
# Vertices that frequently appear together in walks are structurally similar
{% endraw %}{% endhighlight %}

For donor networks, random walks naturally capture giving pathways. If many walks move from Donor A to Fund X to Donor B, this suggests that these entities are closely related in the network. Donors who appear together frequently in random walks likely have similar giving patterns or support related funds.

We can enhance random walks with biased strategies that better capture different notions of similarity:

{% highlight python linenos %}{% raw %}def generate_biased_random_walks(graph, num_walks=10, walk_length=80, 
                                  return_param=1.0, explore_param=1.0):
    """
    Generate biased random walks similar to node2vec approach.
    
    Args:
        graph: The donor network graph
        num_walks: Number of walks per vertex
        walk_length: Length of each walk
        return_param (p): Return parameter (lower = more likely to return)
        explore_param (q): Exploration parameter (lower = stay local)
        
    Returns:
        List of walks
    """
    walks = []
    vertices = list(graph.vertices())
    
    for walk_num in range(num_walks):
        random.shuffle(vertices)
        
        for start_vertex in vertices:
            walk = [int(start_vertex)]
            current_vertex = start_vertex
            previous_vertex = None
            
            for step in range(walk_length - 1):
                neighbors = list(current_vertex.out_neighbors())
                
                if not neighbors:
                    break
                
                if previous_vertex is None:
                    # First step: uniform random choice
                    next_vertex = random.choice(neighbors)
                else:
                    # Biased choice based on relationship to previous vertex
                    weights = []
                    for neighbor in neighbors:
                        if neighbor == previous_vertex:
                            # Return to previous: weight by 1/p
                            weight = 1.0 / return_param
                        elif graph.edge(previous_vertex, neighbor):
                            # Common neighbor: weight by 1
                            weight = 1.0
                        else:
                            # Exploration: weight by 1/q
                            weight = 1.0 / explore_param
                        weights.append(weight)
                    
                    # Normalize weights
                    total_weight = sum(weights)
                    probabilities = [w / total_weight for w in weights]
                    
                    # Choose next vertex based on probabilities
                    next_vertex = random.choices(neighbors, 
                                                 weights=probabilities)[0]
                
                walk.append(int(next_vertex))
                previous_vertex = current_vertex
                current_vertex = next_vertex
            
            walks.append(walk)
    
    return walks

# Generate biased walks that balance local and global structure
# Lower return_param = more breadth-first (explore far)
# Lower explore_param = more depth-first (stay local)
biased_walks = generate_biased_random_walks(
    graph, 
    num_walks=10, 
    walk_length=80,
    return_param=1.0,   # Balanced return tendency
    explore_param=0.5   # Prefer staying in local neighborhood
)
{% endraw %}{% endhighlight %}

The biased random walk approach allows us to tune what "similarity" means for our specific use case:

- **Low explore_param (q)**: Creates walks that stay within local neighborhoods. Good for finding donors with similar immediate giving patterns.

- **Low return_param (p)**: Creates walks that explore broadly across the network. Good for finding donors with similar global network positions.

- **Balanced parameters**: Captures both local and global similarity, useful for general-purpose donor recommendations.

{% include components/heading.html heading='Applications in Donor Networks' level=3 %}

These embedding approaches enable sophisticated fundraising applications:

**Personalized fund recommendations**: By embedding both donors and funds in the same vector space, we can recommend funds by finding those closest to a donor's embedding. This captures both direct connections (funds they've supported) and indirect relationships (funds supported by similar donors).

**Donor segmentation**: Rather than partitioning based solely on network topology, we can cluster donor embeddings to find groups with similar overall network positions and giving patterns. These clusters often reveal nuanced donor personas that topology-only methods miss.

**Transfer learning across institutions**: Embeddings learned from one institution's donor network can potentially be fine-tuned for another institution, allowing smaller organizations to benefit from patterns in larger networks.

**Temporal prediction**: By learning embeddings at different time points, we can model how donors' network positions evolve and predict future engagement based on trajectory in the embedding space.

**Cold start problem**: For new donors with limited giving history, we can infer initial embeddings based on their attributes and sparse early interactions, then refine as more data accumulates.

{% include components/heading.html heading='Towards Modern Graph Neural Networks' level=3 %}

While graph-tool provides excellent infrastructure for traditional graph analysis and basic embedding approaches through random walks, the cutting edge of graph representation learning has moved toward graph neural networks (GNNs). These deep learning approaches can learn much more sophisticated vertex representations by directly encoding the graph structure into neural network architectures.

{% include components/heading.html heading='Node2Vec with PyTorch Geometric' level=3 %}

While matrix-based spectral features are powerful, they still have limitations. The dimensionality is fixed by the graph size, they primarily capture global structure, and they don't easily incorporate vertex attributes like donor demographics or fund characteristics. Modern graph embedding methods address these limitations by learning flexible, low-dimensional representations optimized for specific tasks.

Node2Vec, one of the most successful embedding approaches, works by simulating random walks through the network and then learning embeddings that predict walk co-occurrence patterns. Think of it as treating the network like a corpus of text: random walks are "sentences," vertices are "words," and we learn embeddings that capture which vertices appear in similar contexts. This approach naturally captures both local neighborhood structure and global network position, while allowing us to tune what "similarity" means for our specific fundraising applications.

{% highlight python linenos %}{% raw %}import torch
from torch_geometric.data import Data
from torch_geometric.nn import Node2Vec
import numpy as np

def graph_tool_to_pyg(graph, vertex_features=None):
    """
    Convert a graph-tool graph to PyTorch Geometric format.
    
    Args:
        graph: graph-tool Graph object
        vertex_features: Optional dict of vertex property names to include
        
    Returns:
        PyTorch Geometric Data object
    """
    # Extract edge list
    edge_list = []
    edge_weights = []
    
    amounts = graph.edge_properties.get('amounts', None)
    
    for edge in graph.edges():
        source = int(edge.source())
        target = int(edge.target())
        edge_list.append([source, target])
        
        if amounts:
            edge_weights.append(amounts[edge])
    
    # Convert to PyTorch tensors
    edge_index = torch.tensor(edge_list, dtype=torch.long).t().contiguous()
    
    # Prepare vertex features if provided
    x = None
    if vertex_features:
        num_vertices = graph.num_vertices()
        feature_list = []
        
        for vertex in graph.vertices():
            vertex_feats = []
            for feat_name in vertex_features:
                prop = graph.vertex_properties[feat_name]
                vertex_feats.append(float(prop[vertex]))
            feature_list.append(vertex_feats)
        
        x = torch.tensor(feature_list, dtype=torch.float)
    
    # Create PyG Data object
    data = Data(edge_index=edge_index, x=x, num_nodes=graph.num_vertices())
    
    if amounts:
        data.edge_attr = torch.tensor(edge_weights, dtype=torch.float).unsqueeze(1)
    
    return data

# Convert our donor network to PyG format
# Include centrality measures as initial features
data = graph_tool_to_pyg(
    graph, 
    vertex_features=['amount_betweenness', 'amount_closeness', 'local_clusters']
)

print('Converted graph: %d nodes, %d edges' % 
      (data.num_nodes, data.edge_index.size(1)))
{% endraw %}{% endhighlight %}

With our donor network converted to PyTorch Geometric format, we can now train the Node2Vec model to learn meaningful embeddings. This training process simulates millions of random walks through the network, then optimizes embeddings so that donors who frequently appear together in walks have similar vector representations. The model effectively compresses the complex web of donor-fund relationships into dense, low-dimensional vectors that capture both local giving patterns and global network position. Training typically takes 10-20 minutes on networks with tens of thousands of vertices:

{% highlight python linenos %}{% raw %}# Initialize Node2Vec model
device = 'cuda' if torch.cuda.is_available() else 'cpu'

node2vec = Node2Vec(
    data.edge_index,
    embedding_dim=128,      # Dimensionality of embeddings
    walk_length=20,         # Length of random walks
    context_size=10,        # Context window for skip-gram
    walks_per_node=10,      # Number of walks per node
    num_negative_samples=1, # Negative samples for training
    p=1.0,                  # Return parameter (inverse)
    q=0.5,                  # In-out parameter (lower = stay local)
    sparse=True
).to(device)

# Set up optimizer
optimizer = torch.optim.SparseAdam(list(node2vec.parameters()), lr=0.01)

# Training loop
def train_node2vec(model, optimizer, num_epochs=100):
    model.train()
    
    for epoch in range(1, num_epochs + 1):
        optimizer.zero_grad()
        loss = model.loss(data.edge_index.to(device))
        loss.backward()
        optimizer.step()
        
        if epoch % 10 == 0:
            print('Epoch: %03d, Loss: %.4f' % (epoch, loss.item()))
    
    return model

# Train the model
trained_node2vec = train_node2vec(node2vec, optimizer, num_epochs=100)

# Extract embeddings for all vertices
node2vec.eval()
with torch.no_grad():
    embeddings = trained_node2vec().cpu().numpy()

print('Generated embeddings shape:', embeddings.shape)

# Save embeddings as graph-tool vertex property
embedding_prop = graph.new_vertex_property('vector<double>')
for vertex in graph.vertices():
    vertex_idx = int(vertex)
    embedding_prop[vertex] = embeddings[vertex_idx].tolist()

graph.vertex_properties['node2vec_embeddings'] = embedding_prop
graph.save(file_name)
{% endraw %}{% endhighlight %}

These embeddings transform our donor network from a complex graph structure into a format that standard machine learning algorithms can process. Each donor is now represented by a 128-dimensional vector that encodes their network position, giving patterns, and similarity to other donors. We can measure similarity with simple distance metrics, cluster donors using k-means, or feed these embeddings into classification models—all techniques that would be impossible with raw graph structure. More importantly, donors with similar embeddings share similar network roles, even if they've never directly interacted or donated to the exact same funds.

{% highlight python linenos %}{% raw %}from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans

# Find similar donors/funds using cosine similarity
def find_similar_vertices(vertex_idx, embeddings, top_k=10):
    """
    Find the most similar vertices to a given vertex.
    
    Args:
        vertex_idx: Index of the query vertex
        embeddings: Node2Vec embeddings matrix
        top_k: Number of similar vertices to return
        
    Returns:
        List of (vertex_index, similarity_score) tuples
    """
    query_embedding = embeddings[vertex_idx].reshape(1, -1)
    similarities = cosine_similarity(query_embedding, embeddings)[0]
    
    # Get indices of top-k most similar (excluding self)
    similar_indices = np.argsort(similarities)[::-1][1:top_k+1]
    
    results = [(idx, similarities[idx]) for idx in similar_indices]
    return results

# Example: Find donors similar to a major donor
major_donor_vertex = 12345  # Replace with actual vertex index
similar_donors = find_similar_vertices(major_donor_vertex, embeddings, top_k=10)

print('Donors similar to vertex %d:' % major_donor_vertex)
for vertex_idx, similarity in similar_donors:
    print('Vertex %d: %.4f similarity' % (vertex_idx, similarity))

# Cluster donors based on embeddings
num_clusters = 8
kmeans = KMeans(n_clusters=num_clusters, random_state=42)
cluster_labels = kmeans.fit_predict(embeddings)

# Save clusters as vertex property
cluster_prop = graph.new_vertex_property('int')
for vertex in graph.vertices():
    vertex_idx = int(vertex)
    cluster_prop[vertex] = int(cluster_labels[vertex_idx])

graph.vertex_properties['node2vec_clusters'] = cluster_prop

# Analyze cluster characteristics
for cluster_id in range(num_clusters):
    cluster_vertices = [v for v in graph.vertices() 
                       if cluster_prop[v] == cluster_id]
    print('Cluster %d: %d vertices' % (cluster_id, len(cluster_vertices)))
{% endraw %}{% endhighlight %}

The real power of Node2Vec embeddings emerges in recommendation systems. Because we've embedded both donors and funds in the same vector space, we can recommend funds by finding those closest to a donor's position. This captures not just which funds a donor has directly supported, but which funds are supported by donors in similar network positions—donors who give to the same types of funds, occupy similar network roles, and share similar giving patterns. These recommendations often surface opportunities that simple co-occurrence analysis would miss:

{% highlight python linenos %}{% raw %}def recommend_funds_node2vec(donor_vertex, embeddings, graph, top_k=5):
    """
    Recommend funds to a donor based on Node2Vec embeddings.
    
    Args:
        donor_vertex: The donor vertex to recommend for
        embeddings: Node2Vec embeddings
        graph: The donor network graph
        top_k: Number of recommendations
        
    Returns:
        List of (fund_vertex, score) recommendations
    """
    donor_idx = int(donor_vertex)
    donor_embedding = embeddings[donor_idx]
    
    # Find funds the donor hasn't supported yet
    supported_funds = set()
    for edge in donor_vertex.out_edges():
        supported_funds.add(int(edge.target()))
    
    # Score all unsupported funds
    fund_scores = []
    for vertex in graph.vertices():
        vertex_idx = int(vertex)
        
        # Skip if already supported or if this is another donor
        if vertex_idx in supported_funds:
            continue
        
        # Check if this is a fund (you may need to adapt this check)
        # For example, checking if vertex has fund_codes property
        if graph.vertex_properties.get('fund_codes'):
            fund_code = graph.vertex_properties['fund_codes'][vertex]
            if not fund_code:
                continue
        
        # Calculate similarity
        fund_embedding = embeddings[vertex_idx]
        similarity = cosine_similarity(
            donor_embedding.reshape(1, -1),
            fund_embedding.reshape(1, -1)
        )[0][0]
        
        fund_scores.append((vertex, similarity))
    
    # Return top-k recommendations
    fund_scores.sort(key=lambda x: x[1], reverse=True)
    return fund_scores[:top_k]

# Example usage
donor = graph.vertex(12345)
recommendations = recommend_funds_node2vec(donor, embeddings, graph, top_k=5)

print('Recommended funds for donor %d:' % int(donor))
for fund_vertex, score in recommendations:
    fund_name = graph.vertex_properties['names'][fund_vertex]
    print('  %s (score: %.4f)' % (fund_name, score))
{% endraw %}{% endhighlight %}

Node2Vec embeddings provide a powerful foundation for donor similarity analysis and recommendation systems. The random walk approach naturally captures multi-hop relationships and community structure, making it excellent for discovering donors with similar network positions. However, Node2Vec has a fundamental limitation for operational fundraising systems: it's transductive, meaning it can only generate embeddings for donors who existed during training.

Consider the practical challenge: a new donor makes their first gift tomorrow morning. With Node2Vec, we can't embed them without retraining the entire model—a process requiring hours of computation. During that delay, they receive no personalized recommendations, no upgrade potential assessment, no intelligent cultivation assignment. For institutions onboarding dozens of new donors daily, this creates an unacceptable operational bottleneck.

Additionally, Node2Vec learns solely from network topology, ignoring valuable donor attributes like demographics, engagement history, and giving capacity indicators. While we can concatenate these features with Node2Vec embeddings afterward, this treats network structure and attributes as separate information sources rather than learning how they interact.

{% include components/heading.html heading='GraphSAGE for Inductive Learning' level=3 %}

Node2Vec embeddings are powerful for understanding donor similarity and making recommendations within our existing network. However, they have a fundamental limitation: they're transductive, meaning they can only generate embeddings for vertices that existed during training. When a new donor makes their first gift tomorrow, we can't immediately embed them without retraining the entire model—a process that might take hours on a large network.

This limitation is particularly problematic for donor management. New donors join continuously, and we want to make immediate predictions about their potential: Are they likely to become regular supporters? Which funds should we recommend for their second gift? What cultivation pathway should we design? Waiting days or weeks to retrain Node2Vec before we can analyze a new donor means missing critical early engagement opportunities.

GraphSAGE (Graph Sample and Aggregate) solves this problem through inductive learning. Instead of learning a fixed embedding for each vertex, GraphSAGE learns a function that generates embeddings by aggregating information from a vertex's neighborhood. This means we can immediately embed new donors based on their first few gifts and the characteristics of the funds they support, without any retraining. Additionally, GraphSAGE naturally incorporates vertex attributes—demographics, engagement history, giving capacity indicators—alongside network structure, creating richer representations than topology-based methods alone.

{% highlight python linenos %}{% raw %}import torch
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv
from torch.nn import Linear

class GraphSAGE(torch.nn.Module):
    """
    GraphSAGE model for donor network embeddings.
    
    This model learns to aggregate information from a vertex's neighborhood
    to generate embeddings, allowing it to generalize to unseen vertices.
    """
    def __init__(self, in_channels, hidden_channels, out_channels, num_layers=2):
        super(GraphSAGE, self).__init__()
        
        self.convs = torch.nn.ModuleList()
        
        # First layer
        self.convs.append(SAGEConv(in_channels, hidden_channels))
        
        # Hidden layers
        for _ in range(num_layers - 2):
            self.convs.append(SAGEConv(hidden_channels, hidden_channels))
        
        # Output layer
        self.convs.append(SAGEConv(hidden_channels, out_channels))
    
    def forward(self, x, edge_index):
        for i, conv in enumerate(self.convs):
            x = conv(x, edge_index)
            if i != len(self.convs) - 1:  # No activation on last layer
                x = F.relu(x)
                x = F.dropout(x, p=0.5, training=self.training)
        return x

# Prepare input features
# If we don't have initial features, use identity matrix or degree
if data.x is None:
    # Use degree as initial feature
    degree = torch.zeros(data.num_nodes, 1)
    for i in range(data.num_nodes):
        mask = (data.edge_index[0] == i)
        degree[i] = mask.sum().float()
    data.x = degree

# Initialize model
model = GraphSAGE(
    in_channels=data.x.size(1),
    hidden_channels=64,
    out_channels=128,
    num_layers=3
).to(device)

print(model)
{% endraw %}{% endhighlight %}

GraphSAGE models learn embeddings through prediction tasks rather than random walks, which allows us to directly optimize for the outcomes we care about. Link prediction, predicting whether edges exist between vertices, serves as an effective self-supervised learning signal that requires no manual labeling. The model learns that donors who should be connected (because they support similar funds) need similar embeddings, while donors who shouldn't be connected need dissimilar embeddings. This approach naturally captures the network structure that determines donor similarity, and the resulting embeddings can be used for any downstream fundraising task:

{% highlight python linenos %}{% raw %}from torch_geometric.utils import negative_sampling
from sklearn.metrics import roc_auc_score

def train_link_prediction(model, data, optimizer, epochs=100):
    """
    Train GraphSAGE using link prediction as a self-supervised task.
    
    The model learns to predict whether edges exist between vertices,
    forcing it to learn meaningful embeddings.
    """
    model.train()
    
    for epoch in range(1, epochs + 1):
        optimizer.zero_grad()
        
        # Forward pass to get embeddings
        z = model(data.x.to(device), data.edge_index.to(device))
        
        # Positive edges (actual edges in the graph)
        pos_edge_index = data.edge_index.to(device)
        
        # Negative edges (randomly sampled non-existent edges)
        neg_edge_index = negative_sampling(
            edge_index=pos_edge_index,
            num_nodes=data.num_nodes,
            num_neg_samples=pos_edge_index.size(1)
        )
        
        # Compute edge scores using dot product
        pos_scores = (z[pos_edge_index[0]] * z[pos_edge_index[1]]).sum(dim=1)
        neg_scores = (z[neg_edge_index[0]] * z[neg_edge_index[1]]).sum(dim=1)
        
        # Binary cross-entropy loss
        pos_loss = -torch.log(torch.sigmoid(pos_scores) + 1e-15).mean()
        neg_loss = -torch.log(1 - torch.sigmoid(neg_scores) + 1e-15).mean()
        loss = pos_loss + neg_loss
        
        loss.backward()
        optimizer.step()
        
        if epoch % 10 == 0:
            # Compute AUC for monitoring
            with torch.no_grad():
                pos_pred = torch.sigmoid(pos_scores).cpu()
                neg_pred = torch.sigmoid(neg_scores).cpu()
                
                y_true = [1] * len(pos_pred) + [0] * len(neg_pred)
                y_pred = torch.cat([pos_pred, neg_pred]).numpy()
                
                auc = roc_auc_score(y_true, y_pred)
                print('Epoch: %03d, Loss: %.4f, AUC: %.4f' % 
                      (epoch, loss.item(), auc))
    
    return model

# Train GraphSAGE
optimizer = torch.optim.Adam(model.parameters(), lr=0.01, weight_decay=5e-4)
trained_model = train_link_prediction(model, data, optimizer, epochs=100)

# Generate embeddings
model.eval()
with torch.no_grad():
    sage_embeddings = model(
        data.x.to(device), 
        data.edge_index.to(device)
    ).cpu().numpy()

print('GraphSAGE embeddings shape:', sage_embeddings.shape)

# Save to graph-tool
sage_embedding_prop = graph.new_vertex_property('vector<double>')
for vertex in graph.vertices():
    vertex_idx = int(vertex)
    sage_embedding_prop[vertex] = sage_embeddings[vertex_idx].tolist()

graph.vertex_properties['graphsage_embeddings'] = sage_embedding_prop
graph.save(file_name)
{% endraw %}{% endhighlight %}

The real power of GraphSAGE is handling new donors without retraining. Remember that Node2Vec learns fixed embeddings for each vertex during training.  So if a new donor joins tomorrow, we'd need to retrain the entire model to embed them, a process that might take hours on a large network. GraphSAGE, by contrast, learns a function that generates embeddings by aggregating neighborhood information. This means we can immediately embed new donors based on their first few gifts without any retraining. For fundraising operations, this is transformative: when someone makes their first donation, we can instantly predict their upgrade potential, recommend their next gift, and assign them to the right cultivation pathway within seconds of the transaction:

{% highlight python linenos %}{% raw %}def embed_new_donor(model, new_donor_features, neighbor_indices, 
                     neighbor_edge_index, device='cpu'):
    """
    Generate embedding for a new donor without retraining.
    
    Args:
        model: Trained GraphSAGE model
        new_donor_features: Feature vector for the new donor
        neighbor_indices: Indices of funds the donor has supported
        neighbor_edge_index: Edge structure for the subgraph
        device: CPU or CUDA
        
    Returns:
        Embedding vector for the new donor
    """
    model.eval()
    
    with torch.no_grad():
        # Create mini-batch with new donor and their neighborhood
        x = torch.cat([
            new_donor_features.unsqueeze(0),
            data.x[neighbor_indices]
        ]).to(device)
        
        # Adjust edge indices for the subgraph
        edge_index = neighbor_edge_index.to(device)
        
        # Forward pass
        embeddings = model(x, edge_index)
        
        # Return embedding for the new donor (index 0)
        return embeddings[0].cpu().numpy()

# Example: Embed a brand new donor
# Assume they've made one gift to fund index 500
new_donor_features = torch.tensor([1.0])  # Degree = 1
neighbor_fund = 500
neighbor_edge_index = torch.tensor([[0], [neighbor_fund]], dtype=torch.long)

new_embedding = embed_new_donor(
    trained_model,
    new_donor_features,
    [neighbor_fund],
    neighbor_edge_index,
    device=device
)

print('Generated embedding for new donor:', new_embedding.shape)

# Find similar existing donors to understand this new donor's potential
similarities = cosine_similarity(
    new_embedding.reshape(1, -1),
    sage_embeddings
)[0]

most_similar = np.argsort(similarities)[::-1][:10]
print('New donor is most similar to existing donors:')
for idx in most_similar:
    print('  Vertex %d (similarity: %.4f)' % (idx, similarities[idx]))
{% endraw %}{% endhighlight %}

This inductive capability transforms GraphSAGE from an analytical tool into an operational system. New donor onboarding can be fully automated: as soon as a first gift is recorded, the system generates an embedding, identifies similar existing donors, predicts upgrade potential, and recommends next steps without human intervention or model retraining. This is particularly valuable for institutions processing hundreds or thousands of new donors annually, where manual analysis of each new donor would be infeasible. The embeddings also remain stable as the network grows, unlike transductive methods where adding vertices can shift all embeddings.

{% include components/heading.html heading='Supervised Learning with GraphSAGE' level=3 %}

So far we've trained GraphSAGE using link prediction—a self-supervised approach where the model learns to predict whether edges exist between vertices. This works well for generating general-purpose embeddings that capture network structure, and those embeddings can then be used for downstream tasks like similarity search or clustering.

However, link prediction is a proxy task. What we really care about in fundraising isn't whether a donor will give to a fund (we often already know this from transaction records), but whether they'll upgrade their giving, whether they'll lapse, or whether they'll respond to a specific campaign. These are classification problems with clear business value, and we have labeled training data from historical donor behavior.

When we have specific prediction targets and labeled examples, we can train GraphSAGE end-to-end for those exact tasks rather than relying on generic embeddings. By adding a classification head on top of GraphSAGE and training the entire model to predict donor outcomes directly, we often achieve significantly better performance than using pre-trained embeddings. The model learns to encode precisely the network patterns that predict our target outcomes, rather than general structural patterns that may or may not be relevant.

{% highlight python linenos %}{% raw %}class GraphSAGEClassifier(torch.nn.Module):
    """
    GraphSAGE with classification head for donor predictions.
    """
    def __init__(self, in_channels, hidden_channels, num_classes):
        super(GraphSAGEClassifier, self).__init__()
        
        self.sage = GraphSAGE(in_channels, hidden_channels, hidden_channels, num_layers=3)
        self.classifier = Linear(hidden_channels, num_classes)
    
    def forward(self, x, edge_index):
        # Get embeddings
        embeddings = self.sage(x, edge_index)
        
        # Classify
        out = self.classifier(embeddings)
        return out, embeddings

def train_classifier(model, data, train_mask, val_mask, labels, 
                     optimizer, epochs=200):
    """
    Train GraphSAGE for vertex classification.
    
    Args:
        model: GraphSAGE classifier model
        data: PyG Data object
        train_mask: Boolean mask for training vertices
        val_mask: Boolean mask for validation vertices
        labels: Ground truth labels
        optimizer: PyTorch optimizer
        epochs: Number of training epochs
    """
    best_val_acc = 0
    
    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad()
        
        out, _ = model(data.x.to(device), data.edge_index.to(device))
        
        # Compute loss only on training set
        loss = F.cross_entropy(out[train_mask], labels[train_mask].to(device))
        
        loss.backward()
        optimizer.step()
        
        # Evaluate
        if epoch % 10 == 0:
            model.eval()
            with torch.no_grad():
                pred, embeddings = model(data.x.to(device), data.edge_index.to(device))
                
                train_acc = (pred[train_mask].argmax(dim=1) == 
                           labels[train_mask].to(device)).float().mean()
                val_acc = (pred[val_mask].argmax(dim=1) == 
                          labels[val_mask].to(device)).float().mean()
                
                print('Epoch: %03d, Loss: %.4f, Train Acc: %.4f, Val Acc: %.4f' %
                      (epoch, loss.item(), train_acc, val_acc))
                
                if val_acc > best_val_acc:
                    best_val_acc = val_acc
    
    return model

# Example: Predict donor upgrade potential
# Prepare labels (1 = upgraded, 0 = did not upgrade)
labels = torch.zeros(data.num_nodes, dtype=torch.long)
train_mask = torch.zeros(data.num_nodes, dtype=torch.bool)
val_mask = torch.zeros(data.num_nodes, dtype=torch.bool)

# Populate labels and masks from your donor data
upgrade_prop = graph.vertex_properties.get('upgraded_giving', None)
if upgrade_prop:
    for vertex in graph.vertices():
        idx = int(vertex)
        labels[idx] = int(upgrade_prop[vertex])
        
        # 70% train, 30% validation split
        if np.random.random() < 0.7:
            train_mask[idx] = True
        else:
            val_mask[idx] = True

# Initialize and train classifier
classifier = GraphSAGEClassifier(
    in_channels=data.x.size(1),
    hidden_channels=64,
    num_classes=2  # Binary classification
).to(device)

optimizer = torch.optim.Adam(classifier.parameters(), lr=0.01)
trained_classifier = train_classifier(
    classifier, data, train_mask, val_mask, labels, optimizer, epochs=200
)

# Make predictions on all donors
classifier.eval()
with torch.no_grad():
    predictions, final_embeddings = classifier(
        data.x.to(device),
        data.edge_index.to(device)
    )
    upgrade_probabilities = F.softmax(predictions, dim=1)[:, 1].cpu().numpy()

# Identify high-potential donors
high_potential_indices = np.where(upgrade_probabilities > 0.75)[0]
print('Identified %d high-potential upgrade prospects' % len(high_potential_indices))

# Save predictions
upgrade_potential_prop = graph.new_vertex_property('double')
for vertex in graph.vertices():
    idx = int(vertex)
    upgrade_potential_prop[vertex] = float(upgrade_probabilities[idx])

graph.vertex_properties['upgrade_potential'] = upgrade_potential_prop
graph.save(file_name)
{% endraw %}{% endhighlight %}

This supervised approach transforms GraphSAGE from a general embedding tool into a purpose-built prediction system for specific fundraising outcomes. By training end-to-end on labeled examples, the model learns which aspects of network structure actually predict donor behavior rather than capturing all structural patterns equally. The upgrade potential scores we've generated aren't just measures of network similarity—they're direct predictions of future giving behavior, trained on what actually happened with similar donors in the past.

Moreover, because GraphSAGE is inductive, this trained classifier immediately works for new donors. When someone makes their first gift tomorrow, we can generate an upgrade potential score without retraining, enabling immediate intelligent cultivation decisions. This combination of predictive accuracy and operational flexibility makes supervised GraphSAGE particularly valuable for production fundraising systems where both prediction quality and real-time responsiveness matter.

The question remains: when should we use this supervised approach versus the self-supervised embeddings we generated with link prediction or Node2Vec? Each approach has distinct strengths that make it optimal for different fundraising scenarios.

{% include components/heading.html heading='Comparing Node2Vec and GraphSAGE' level=3 %}

Both approaches have distinct advantages for donor network analysis:

**Node2Vec Advantages:**
- Simpler to implement and tune
- Excellent for pure similarity-based tasks
- Faster training on smaller networks
- Interpretable random walk parameters (p and q)
- Works well without vertex features

**GraphSAGE Advantages:**
- Handles new donors without retraining (inductive)
- Naturally incorporates vertex attributes
- Can be trained end-to-end for specific tasks
- Better for supervised prediction problems
- Scales to very large networks with mini-batch training

**Practical recommendations:**

Use **Node2Vec** when:
- You have a static donor network that changes infrequently
- Your primary goal is finding similar donors or funds
- You don't have rich vertex attributes
- You want quick, interpretable embeddings
- Network topology is more important than attributes

Use **GraphSAGE** when:
- New donors join frequently and you need immediate predictions
- You have rich donor attributes (demographics, engagement history, etc.)
- You're solving specific prediction tasks (upgrade potential, lapse risk, etc.)
- You need embeddings that incorporate both structure and attributes
- You're building a production system that must handle dynamic data

**Combining both approaches:**

In practice, many sophisticated donor analytics platforms use both:

{% highlight python linenos %}{% raw %}# Combine Node2Vec and GraphSAGE embeddings for best results
combined_embeddings = np.hstack([
    embeddings,          # Node2Vec: captures pure network topology
    sage_embeddings      # GraphSAGE: captures topology + attributes
])

# Use combined embeddings for classification
from sklearn.ensemble import GradientBoostingClassifier

clf = GradientBoostingClassifier(n_estimators=100, random_state=42)
clf.fit(combined_embeddings[train_mask], labels[train_mask].numpy())

# Evaluate
predictions = clf.predict_proba(combined_embeddings)[:, 1]
val_auc = roc_auc_score(labels[val_mask].numpy(), predictions[val_mask])

print('Combined embeddings validation AUC: %.4f' % val_auc)
{% endraw %}{% endhighlight %}

{% include components/heading.html heading='Production Deployment Considerations' level=3 %}

When deploying these embeddings in production fundraising systems, consider:

**Model Updates:** Retrain Node2Vec periodically (monthly/quarterly) as the network evolves. GraphSAGE can handle new donors immediately but should be retrained when fund structures change significantly.

**Feature Engineering:** The quality of input features for GraphSAGE dramatically impacts performance. Invest time in feature engineering - recency/frequency/monetary value (RFM) scores, engagement metrics, and demographic data all improve embeddings.

**Embedding Drift:** Monitor embedding quality over time. As donor behavior shifts, embeddings trained on historical data may become less predictive. Set up regular evaluation on held-out test sets.

**Computational Resources:** Node2Vec training is CPU-intensive. GraphSAGE benefits from GPU acceleration but can run on CPUs for smaller networks. For institutions with >100,000 donors, plan for GPU infrastructure.

**Interpretability:** While embeddings are powerful, they're black boxes. Supplement them with interpretable features and maintain model explanation capabilities for fundraising staff who need to understand why donors received specific recommendations.

The combination of graph-tool's robust infrastructure for network analysis and PyTorch Geometric's modern deep learning approaches provides a complete toolkit for sophisticated donor network analytics. By understanding both the theoretical foundations covered earlier and these practical implementation details, institutions can build state-of-the-art fundraising intelligence systems that maximize donor engagement and philanthropic impact.

{% include components/heading.html heading='Conclusion' level=2 %}

The shift from viewing donors as independent records to understanding them as nodes in an interconnected system changes everything. When we analyze donors in isolation, we miss the influence patterns, affinity clusters, and community structures that actually drive philanthropic behavior. Network position predicts giving patterns as reliably as wealth indicators—sometimes more so. A donor embedded in a tight-knit community of athletics supporters behaves fundamentally differently from an isolated donor with identical demographics and capacity.

Each analytical layer we've covered compounds the previous one. Centrality measures reveal influential nodes. Clustering identifies cohesive communities. Partitioning discovers hierarchical organization. Embeddings compress all of this into vectors that power machine learning. And critically, each layer reveals patterns completely invisible to the others. You can't predict a donor's upgrade potential from centrality alone, just as you can't design effective communities from embeddings alone. The power comes from understanding how these perspectives interact.

This matters strategically because it means fundraising effectiveness isn't just about identifying prospects—it's about understanding the relational fabric that connects them. When you recommend a fund to a donor, you're not just matching interests; you're leveraging the accumulated signals from thousands of similar network positions. When you assign donors to gift officers, you're not just balancing portfolios; you're respecting (or disrupting) natural community boundaries. The network is the fundamental structure, and everything else operates within it.

{% include components/heading.html heading='Where This Is Going' level=3 %}

Everything we've discussed treats the donor network as a snapshot, but real networks pulse with temporal dynamics. Relationships strengthen and decay. Communities form and dissolve. A donor's position in January predicts different behaviors than their position in December. The next generation of methods—temporal graph networks and dynamic embeddings—model these evolution patterns directly. This enables fundamentally different questions: not just "who is similar now" but "whose relationship trajectory matches this pattern" and "which intervention will shift this donor's pathway." You can start to anticipate relationship decay before it happens and understand how cultivation activities compound over time.

Current methods excel at correlation: these donors are similar, these funds co-occur. But causation remains elusive. Why do donors in this network position upgrade? What happens if we add a fund that bridges these communities? Which cultivation sequence actually changes behavior versus merely correlates with it? Causal inference on graphs is an active research frontier, combining network structure with techniques like propensity score matching and instrumental variables. As these methods mature, we move from describing donor networks to actually understanding the mechanisms that drive them.

Geometric deep learning represents something bigger: the realization that graphs, images, text, and other structured data share fundamental symmetries. The same mathematical framework that powers image recognition can be adapted to donor networks, and insights from natural language processing translate to graph embeddings. This unification means techniques advance across domains simultaneously. When computer vision researchers develop better attention mechanisms, graph researchers adapt them within months. The pace of innovation in graph neural networks reflects this cross-pollination, and it's accelerating. Methods that seemed cutting-edge when we wrote this post may be foundational primitives by the time you read it.

{% include components/heading.html heading='From Analysis to Production' level=3 %}

Everything we've covered uses graph-tool for analysis, which works well for research and periodic insight generation. But when you're ready to build production systems—real-time recommendation engines, live cultivation scoring, operational dashboards—graph databases become essential. [Neo4j](https://neo4j.com/) stores your network natively as a graph rather than forcing it into relational tables, which means queries that traverse relationships execute orders of magnitude faster. The difference is dramatic: finding all donors within three degrees of a major gift prospect might take minutes with SQL joins but milliseconds with Neo4j's Cypher query language.

Graph databases also handle updates elegantly. When a new donation arrives, you update a single edge rather than recomputing aggregate tables. This makes them ideal for systems that need fresh recommendations immediately after transactions. Neo4j's [Graph Data Science library](https://neo4j.com/docs/graph-data-science/current/) implements many of the algorithms we've discussed—centrality measures, community detection, even graph embeddings—as native database operations. You can run PageRank on your donor network directly in your production database without exporting data to Python.

The tradeoff is infrastructure complexity. Graph-tool runs wherever Python does; Neo4j requires dedicated database infrastructure, cluster management for scale, and specialized knowledge. For many institutions, the right approach is hybrid: use graph-tool for research and model development, then deploy proven analyses to Neo4j for operational use. Start with graph-tool until you're confident which analyses matter, then productionize the valuable ones.

{% include components/heading.html heading='Building Your Foundation of Knowledge' level=3 %}

If this post resonates with you, here's where to go deeper. These are some genuinely excellent resources that will expand how you think about networks and what's possible with them.

{% include components/heading.html heading='Essential Theory' level=4 %}

Start with [Networks, Crowds, and Markets](http://www.cs.cornell.edu/home/kleinber/networks-book/) by Easley and Kleinberg. The entire book is free online, and chapters 3-4 on strong/weak ties and network effects directly explain why donor communities behave the way they do. This is the text that makes network reasoning intuitive rather than mechanical. Read it first.

For embeddings and modern graph representation learning, [Graph Representation Learning](https://www.cs.mcgill.ca/~wlh/grl_book/) by William Hamilton is the authoritative reference and also freely available. It bridges classical graph theory and deep learning clearly, explaining why methods work rather than just how to implement them. The chapters on random walk methods and graph neural networks will deepen your understanding of everything we covered in the vertex classification section.

Albert-László Barabási's [Network Science](http://networksciencebook.com/) textbook is comprehensive and gorgeous, with interactive visualizations that make complex concepts tangible. The chapters on scale-free networks and community detection provide the theoretical foundations for understanding why donor networks have the structure they do. It's also free online and constantly updated.

{% include components/heading.html heading='Advanced Structures' level=4 %}

Real donor networks aren't simple graphs—they're richer. Multi-layer networks let you model different relationship types simultaneously: monetary donations, event attendance, volunteer activities, and social connections as separate layers that interact. [Multilayer Networks](https://global.oup.com/academic/product/multilayer-networks-9780198753919) by Kivelä et al. shows how to analyze these structures, revealing patterns invisible when you flatten everything into a single graph. You might discover that donors who never co-give still cluster through event attendance, or that volunteer relationships predict future monetary contributions through mechanisms that single-layer analysis misses.

Hypergraphs extend beyond pairwise relationships to model group interactions directly. A fundraising event isn't just multiple donor-donor connections—it's a single hyperedge connecting all attendees simultaneously. [Hypergraph Theory](https://link.springer.com/book/10.1007/978-3-319-00080-0) by Bretto provides the foundations, but the real excitement is in applications: hypergraph neural networks can predict which donor combinations are most likely to support a fund together, or which event configurations maximize cross-pollination between communities. This is particularly powerful for planned giving circles and family foundations where group dynamics matter more than individual relationships.

Temporal networks add the time dimension explicitly rather than treating evolution as a sequence of snapshots. [Temporal Network Theory](https://link.springer.com/book/10.1007/978-3-030-23495-9) by Holme and Saramäki shows how to model relationship timing, duration, and sequencing. In fundraising, this reveals critical patterns: donors who give within days of each other may be coordinating; the time between someone's first and second gift predicts lifetime value; cultivation activities have time-delayed effects that only show up when you model temporal structure properly. You can start to understand contagion dynamics—how giving behavior actually spreads through networks rather than just correlating across them.

{% include components/heading.html heading='Graph Neural Networks and Deep Learning' level=3 %}

Stanford's [CS224W course](http://web.stanford.edu/class/cs224w/) (freely available) is the best introduction to modern graph machine learning. The lectures, notes, and assignments walk you through the mathematics and intuition behind GNNs. Pay particular attention to the sections on expressive power—understanding what different architectures can and cannot learn matters enormously when choosing methods.

[Distill.pub](https://distill.pub/) publishes exceptional visual explanations of deep learning concepts. Their articles on attention mechanisms and graph convolutions make abstract operations tangible. These aren't just pedagogical tools—the clarity they provide often reveals new research directions.

For implementation, [PyTorch Geometric](https://pytorch-geometric.readthedocs.io/) has extensive tutorials and examples. Start with their colab notebooks on node classification and link prediction, then progress to custom architectures. The library is production-ready, and the documentation includes model comparisons that guide architecture selection.

{% include components/heading.html heading='Stochastic Block Models' level=3 %}

For the mathematical foundations of the partitioning methods we covered, Tiago Peixoto's [review papers](https://arxiv.org/abs/1705.10225) on hierarchical inference are essential. They explain not just how SBMs work but why they're the principled approach to community detection. The [graph-tool documentation](https://graph-tool.skewed.de/static/doc/inference.html) includes worked examples that connect theory to practice.

{% include components/heading.html heading='Communities and Continued Learning' level=3 %}

The [Santa Fe Institute](https://www.santafe.edu/) is the premier research center for complex systems and network science. Their working papers, lecture series, and summer schools explore network phenomena ranging from ecosystems to economies to social systems. The [Complexity Explorer](https://www.complexityexplorer.org/) platform offers free online courses on network theory and computational methods. Following SFI's research gives you early exposure to frameworks that will shape how we understand networks years before they reach mainstream practice.

The [Network Science Society](https://netscisociety.net/) connects researchers and practitioners. Their mailing lists and regional meetups (NetSci conferences) are where you'll encounter people applying these methods to everything from epidemiology to social movements. The cross-domain pollination is invaluable—seeing how other fields solve similar problems often suggests approaches for fundraising analytics.

For fundraising-specific applications, CASE (Council for Advancement and Support of Education) analytics groups are beginning to explore network methods. You'll be early, which means opportunities to shape how these techniques evolve within advancement practice.

Conference proceedings from [KDD](https://kdd.org/) (Knowledge Discovery and Data Mining) and [ICML](https://icml.cc/) (International Conference on Machine Learning) publish cutting-edge graph learning research. Following the graph neural network tracks reveals methods that will become standard tools within 2-3 years. ArXiv preprints appear even earlier, though quality varies.

{% include components/heading.html heading='Final Thought' level=3 %}

Five years ago, the methods we've covered required research lab infrastructure and specialist knowledge. Today, they run on modest hardware with open-source tools and accessible documentation. The technical barriers are falling rapidly, which creates a genuine opportunity for regional institutions competing against resource-rich peers. Network analysis provides leverage—you're not trying to outspend larger institutions on wealth screening or donor research; you're finding patterns in data you already have that reveal insights they're missing.

Start simple. Even basic component analysis and clustering coefficients reveal donor communities and suggest reorganization opportunities. Build from there as patterns emerge and questions sharpen. The network perspective isn't replacing relationship fundraising—it's formalizing the intuitions that excellent gift officers already have about donor communities and influence patterns. When analytics and relationship knowledge align, you get both scale and nuance.

There's significant competitive advantage in getting this right now, while the approaches are still novel enough that execution matters more than having heard of them.

Graph theory gives us the language to describe what we've always known intuitively about donors: they don't exist in isolation. Their relationships, positions, and communities matter as much as their individual characteristics. We finally have the tools to analyze those relationships rigorously. Use them.