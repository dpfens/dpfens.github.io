---
title: Home
layout: default
---
<link href="/assets/css/pages/home.css" rel="stylesheet" media="all" />

<div class="hero bg-orange-3">
    <div class="hero-left hero-content hero-top d-flex align-items-center py-4 px-3">
        <div>
            <p>My name is</p>
            <h1 class="headline"><span>Doug</span><br/><span>Fenstermacher</span></h1>
            <p class="sub-headline" style="margin-left: 0.25em;">A pragmatic software developer for audacious projects.</p>
            <a class="btn bg-blue-3" href="/project">My Projects</a>
        </div>
    </div>
    <div class="hero-right hero-content hero-bottom">
        <img class="maxw-30em" src="/assets/img/00e0c0bc-e146-43e7-b172-5ac748ec77bf.png" />
    </div>
</div>

<div class="hero border-3 border-top border-black bg-green-2">
    <div class="hero-left hero-top hero-content border-lg-3 border-end-lg border-lg-black min-vh-50" style="background: url('/assets/img/07068cc6-af89-4854-8c62-6790b5cc67da.png') center center no-repeat; background-size: cover;">
    </div>
    <div class="hero-right hero-bottom hero-content d-flex align-items-center pb-5 min-vh-50">
        <div>
            <h2 class="headline">From long runs to code sprints</h2>
            <p>As a former runner, I relentlessly pursue my goals. My finish line isn't a medal, it's a solution. My experiments aren't for headlines, but a better tomorrow.  I want to fill the cracks in the world rather than widen them.</p>
            <div class="d-flex justify-content-around">
                <a class="btn bg-purple-3" href="/about">About Me</a>
                <a class="btn bg-red-3" href="/experiment">My Experiments</a>
            </div>
        </div>
    </div>
</div>

<div class="bg-orange-1">
    <div class="row pt-5 pb-4 border-3 border-top border-black">
        <div class="col-12 offset-md-1 col-md-10 offset-lg-2 col-lg-8">
            <p class="sub-headline">I like to craft sustainable solutions tailored to specific challenges. Explore my snippets and mini-projects that serve as components of sustainable solutions.</p>
        </div>
    </div>

    <div class="grid gx-3 gy-3 px-3 pb-5">

{% capture panelContent %}
I craft dynamic web experiences from the ground up using Python, PHP, and Java to sculpt robust backends.  I use ReactJS and AngularJS to build apps that work even when the wifi doesn't.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Web/App Development" content=panelContent extraClassName="bg-red-3" %}

{% capture panelContent %}
I translate data into data-driven intelligence. Python helps me create wrangle complex datasets and create anomaly detectors and personalized recommendations systems, while ReactJS visualizes my creations.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Data Analysis" content=panelContent extraClassName="bg-green-2" %}

{% capture panelContent %}
I bring languages and visions to life – building and deploying Natural Language Processing and Computer Vision models used in real-world applications. My toolkit includes crafting tailored loss functions like hierarchical cross-entropy for nuanced learning and classification.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Machine Learning" content=panelContent extraClassName="bg-blue-4" %}

{% capture panelContent %}
I craft economic mechanisms that align individual actions with collective goals, like efficient markets or sustainable resource use. Think puzzles with purpose, building systems that guide behavior without coercion.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Mechanism Design" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
Unraveling the tangled threads of resource allocation through operations research, I wield linear and combinatorial tools to sculpt streamlined, cost-optimal solutions.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Operations Research" content=panelContent extraClassName="bg-orange-2" %}
    
{% capture panelContent %}
I architect resilient, scalable systems using Docker orchestration, microservices via REST APIs, and Gitlab CI/CD pipelines for robust development - I build the foundation for smooth, high-traffic experiences.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="System Architecture/Design" content=panelContent extraClassName="bg-pink-3" %}
    </div>
</div>

{% if site.posts and site.posts.size > 0 %}
<div class="bg-blue-1">
    <div class="row pt-5 pb-4 border-3 border-top border-black">
        <div class="col-12 offset-md-1 col-md-10 offset-lg-2 col-lg-8">
            <p class="sub-headline">My blog offers a glimpse into my mind, where I explore messy, real-world problems problems and their solutions. I look into sustainable solutions, impact-driven design, and practical approaches that go beyond the next shiny trend.</p>
        </div>
    </div>
    <div class="grid gx-3 gy-3 px-3 pb-5">
    {% for post in site.posts limit: 6 %}
        {% capture colorClassName %}{% cycle "bg-purple-2", "bg-red-2", "bg-orange-2", "bg-pink-3", "bg-blue-4", "bg-green-2" %}{% endcapture %}
        {% include components/post-panel.html post=post extraClassName=colorClassName postcategory=true %}
    {% endfor %}
    </div>
</div>
{% endif %}