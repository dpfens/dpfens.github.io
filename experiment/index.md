---
title: Experiments
layout: default
---

<div class="hero bg-red-2">
    <div class="hero-left hero-top hero-content border-lg-3 border-end-lg border-lg-black min-vh-50" style="background: url('/assets/img/4bfbcf1d-ae32-4204-9b41-cfe6dd9c9e15.png') center center no-repeat; background-size: cover;">
    </div>
    <div class="hero-right hero-bottom hero-content d-flex align-items-center min-vh-50">
        <div class="mt-5 mb-3">
            <h1 class="headline text-center">Experiments</h1>
            <p class="sub-headline" style="margin-left: 0.25em;">These experiments are my messy playground, not polished products.</p>
            <p>The blog is where I write things up once I think I understand them. This is where things go before that. Some experiments became posts, some didn't, and some are still going.</p>
            <p>These tend to be written in roughly the order I worked through them, which isn't always the order that would make sense in retrospect. There usually isn't a linear path through these topics. The canonical starting point of of these topics connects to everything else in too many directions to lay out as a sequence, and reaching the interesting part often means following a related piece of math for a while before doubling back. I group things logically after the fact when I can.</p>
            <p>Most are interactive in some form, because there are ideas you can't develop a feel for without moving the parameters yourself. That's the line between an experiment and a post: when prose alone won't transmit the thing, it goes here.</p>
            <p>Treat the section like someone's garage. Useful things and half-finished things sitting next to each other, some of it dusty, most of it still where I left it.</p>
        </div>
    </div>
</div>

{% if site.categories.experiment != nil %}
    {% assign sortedPosts = site.categories.experiment | where_exp: "post", "post.hide != true" | sort: 'last_updated' | reverse %}
<div class="grid bg-red-2 gx-3 gy-3 p-3 py-5 border-3 border-top border-black">
    {% for post in sortedPosts %}
        {% capture colorClassName %}{% cycle "bg-purple-2", "bg-orange-2", "bg-green-2", "bg-blue-4", "bg-pink-3" %}{% endcapture %}
        {% include components/post-panel.html post=post extraClassName=colorClassName %}
    {% endfor %}
</div>
{% endif %}

