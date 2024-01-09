---
title: Blog
layout: default
---

<div class="hero">
    <div class="hero-left hero-top hero-content border-lg-3 border-end-lg border-lg-black min-vh-50" style="background: url('/assets/img/411dc997-6da9-4e1f-9cad-e7804b5495da.jpeg') center center no-repeat; background-size: cover;">
    </div>
    <div class="hero-right hero-bottom hero-content d-flex align-items-center min-vh-50">
        <div class="mt-5 mb-3">
            <h1 class="headline text-center">Unpolished Ideas & Pioneering Code: Unplugging the Filter, Plugging in the Curiosity.</h1>
            <p class="tagline mt-4">My blog is a messy desk, littered with code snippets, brain dumps, and the occasional half-baked theory. Here's where I dump the bubbling brew of ideas, code snippets, and the occasional rant about a library's weird quirks. Don't expect polished prose, expect raw curiosity with an occasional intellectual scorch mark.</p>
        </div>
    </div>
</div>

{% if site.categories.blog != nil %}
    {% assign sortedPosts = site.categories.blog | sort: 'last_updated' | reverse %}
<div class="grid gx-3 gy-3 px-3 py-5 border-3 border-top border-black">
    {% for post in sortedPosts %}
        {% capture colorClassName %}{% cycle "bg-purple-2", "bg-red-2", "bg-orange-2", "bg-pink-3", "bg-blue-4", "bg-green-2" %}{% endcapture %}
        {% include components/post-panel.html post=post extraClassName=colorClassName %}
    {% endfor %}
</div>
{% endif %}