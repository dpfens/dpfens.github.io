---
title: Projects
layout: default
---


<div class="hero">
    <div class="hero-left hero-top hero-content border-lg-3 border-end-lg border-lg-black min-vh-50" style="background: url('/assets/img/0a6072b5-f344-4435-9ed6-1a7e22f09ccd.jpeg') center center no-repeat; background-size: cover;">
    </div>
    <div class="hero-right hero-bottom hero-content d-flex align-items-center min-vh-50">
        <div class="mt-5 mb-3">
            <h1 class="headline text-center">Projects</h1>
            <p>These are things I've built that landed with the people who used them, or that meant something to me, or both. The stopwatch is here because a small number of track coaches actually found it useful, which mattered more to me than anything technically clever about it. A few reached farther than that, serving large institutions or running at a scale I didn't fully appreciate until later, and those worth listing will turn up here over time.</p>
            <p>Some were personal, some were professional. The reason for building was the same in both cases: the thing needed to exist, and I was in a position to build it.</p>
        </div>
    </div>
</div>

{% if site.categories.project != nil %}
    {% assign sortedPosts = site.categories.project | where_exp: "post", "post.hide != true" | sort: 'last_updated' | reverse %}
<div class="grid gx-3 gy-3 p-3 border-3 border-top border-black">
    {% for post in sortedPosts %}
        {% capture colorClassName %}{% cycle "bg-purple-2", "bg-red-2", "bg-orange-2", "bg-pink-3", "bg-blue-4", "bg-green-2" %}{% endcapture %}
        {% include components/post-panel.html post=post extraClassName=colorClassName %}
    {% endfor %}
</div>
{% endif %}