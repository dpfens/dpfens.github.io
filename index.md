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
            <p class="sub-headline" style="margin-left: 0.25em;">I build software for audacious projects, and for the people who use them.</p>
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
            <p>I used to run competitively. These days I chase solutions that work for real people in real places, not just demos that impress in conference rooms.</p>
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
            <p class="sub-headline">I like building sustainable solutions for specific problems. Here are some of the components that can be combined, adapted, and maintained long after the initial build.</p>
        </div>
    </div>

    <div class="grid gx-3 gy-3 px-3 pb-5">

{% capture panelContent %}
I build web applications from the backend up using Python, PHP, Java for the foundation, ReactJS and AngularJS for interfaces that work even when the wifi doesn't.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Web/App Development" content=panelContent extraClassName="bg-red-3" %}

{% capture panelContent %}
I turn messy datasets into something useful. Python for wrangling, anomaly detection, recommendation systems. ReactJS for making the results legible to humans.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Data Analysis" content=panelContent extraClassName="bg-green-2" %}

{% capture panelContent %}
I build and deploy NLP and computer vision models that run in production, not just notebooks. Custom loss functions like hierarchical cross-entropy when the problem needs nuance.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Machine Learning" content=panelContent extraClassName="bg-blue-4" %}

{% capture panelContent %}
I design systems where individual incentives align with collective goals, like markets, resource allocation, governance structures. Puzzles with purpose: guiding behavior without coercion.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Mechanism Design" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
When resource allocation gets tangled, I untangle it. Linear optimization, combinatorial methods, cost-minimization. Finding efficient paths through complicated constraints.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="Operations Research" content=panelContent extraClassName="bg-orange-2" %}
    
{% capture panelContent %}
Docker orchestration, microservices, REST APIs, GitLab CI/CD, etc. I build the infrastructure that lets applications scale without collapsing. Foundations for smooth, high-traffic experiences.
{% endcapture %}
    {% assign panelContent = panelContent | markdownify %}
    {% include components/panel.html title="System Architecture/Design" content=panelContent extraClassName="bg-pink-3" %}
    </div>
</div>

{% if site.posts and site.posts.size > 0 %}
<div class="bg-blue-1">
    <div class="row pt-5 pb-4 border-3 border-top border-black">
        <div class="col-12 offset-md-1 col-md-10 offset-lg-2 col-lg-8">
            <p class="sub-headline">My blog is where I think out loud about messy, real-world problems. Sustainable solutions, impact-driven design, practical approaches that outlast the next shiny framework.</p>
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