---
title: Experiments
layout: default
---

<div class="hero bg-red-2">
    <div class="hero-left hero-top hero-content border-lg-3 border-end-lg border-lg-black min-vh-50" style="background: url('/assets/img/4bfbcf1d-ae32-4204-9b41-cfe6dd9c9e15.png') center center no-repeat; background-size: cover;">
    </div>
    <div class="hero-right hero-bottom hero-content d-flex align-items-center min-vh-50">
        <div class="mt-5 mb-3">
            <h1 class="headline text-center">Simmering Ideas, Not Prepackaged Solutions.</h1>
            <p class="sub-headline" style="margin-left: 0.25em;">These experiments are my messy playground, not polished products. Dive in, tinker, and maybe uncover a gem amongst the sandcastles.</p>
            <p>This is the messy backstage of a curious coder. Dive into experiments in progress, untamed ideas, and code that might just change the game (or accidentally set your cat on fire).</p>
            <p>Think of it like a science fair after dark. Some experiments might blow your mind, others might blow up in your face. That's the beauty of exploration, the thrill of seeing where curiosity leads. So, put on your lab coat (or pajamas, no judgment), and take a peek behind the curtain. You might just stumble upon a diamond in the rough, or at least a good laugh at my expense.</p>
        </div>
    </div>
</div>

{% if site.categories.experiment != nil %}
    {% assign sortedPosts = site.categories.experiment | sort: 'last_updated' | reverse %}
<div class="grid bg-red-2 gx-3 gy-3 p-3 py-5 border-3 border-top border-black">
    {% for post in sortedPosts %}
        {% capture colorClassName %}{% cycle "bg-purple-2", "bg-orange-2", "bg-green-2", "bg-blue-4", "bg-pink-3" %}{% endcapture %}
        {% include components/post-panel.html post=post extraClassName=colorClassName %}
    {% endfor %}
</div>
{% endif %}

