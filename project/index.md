---
title: Projects
layout: default
---


<div class="hero">
    <div class="hero-left hero-top hero-content border-lg-3 border-end-lg border-lg-black min-vh-50" style="background: url('/assets/img/0a6072b5-f344-4435-9ed6-1a7e22f09ccd.jpeg') center center no-repeat; background-size: cover;">
    </div>
    <div class="hero-right hero-bottom hero-content d-flex align-items-center min-vh-50">
        <div class="mt-5 mb-3">
            <h1 class="headline text-center">Scarred & Polished Portfolio</h1>
            <p class="tagline mt-4">From personal passions to professional projects, these are the creations that got me tinkering, learning, and (hopefully) making a dent in the world. See below for the fruits of my labor, polished and not-so-polished alike.</p>
        </div>
    </div>
</div>

{% if site.categories.project != nil %}
    {% assign sortedPosts = site.categories.project | sort: 'last_updated' | reverse %}
<div class="grid gx-3 gy-3 p-3 border-3 border-top border-black">
    {% for post in sortedPosts %}
        {% capture colorClassName %}{% cycle "bg-purple-2", "bg-red-2", "bg-orange-2", "bg-pink-3", "bg-blue-4", "bg-green-2" %}{% endcapture %}
        {% include components/post-panel.html post=post extraClassName=colorClassName %}
    {% endfor %}
</div>
{% endif %}