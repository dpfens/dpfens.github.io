---
title: Blog
layout: default
---

<div class="hero">
    <div class="hero-left hero-top hero-content border-lg-3 border-end-lg border-lg-black min-vh-50" style="background: url('/assets/img/8366c17a-d202-408d-a7f3-983daadf399c.png') center center no-repeat; background-size: cover;">
    </div>
    <div class="hero-right hero-bottom hero-content d-flex align-items-center min-vh-50">
        <div class="mt-5 mb-3">
            <h1 class="headline text-center">Blog</h1>
            <p>Everything here is something I found interesting enough to want to write down. Sometimes it turned out to be useful for work; that was never the reason it got posted. The bar is whether I think someone else might find it interesting too.</p>
            <p>The topics range widely because where I live they have to, and because the underlying math tends to be the same across them anyway. I work on stuff the industry overlooks, namely real, but unprofitable enough problems to not build the tools for. I'd rather those tools exist than not, and I like building for the people who actually use the tools.</p>
            <p>Most of these posts sit somewhere between a research paper and production code. Papers tend to stop once the result is established; production code tends to start once the choice has already been made. I'm usually more interested in the space between, like what a technique actually implies once you take it seriously, where else it might apply, which assumptions matter and which ones were incidental. That's the part I find worth writing down, partly because it's the part that's hardest to find written down anywhere else.</p>
        </div>
    </div>
</div>

{% if site.categories.blog != nil %}
    {% assign sortedPosts = site.categories.blog | where_exp: "post", "post.hide != true" | sort: 'last_updated' | reverse %}
<div class="grid gx-3 gy-3 px-3 py-5 border-3 border-top border-black">
    {% for post in sortedPosts %}
        {% capture colorClassName %}{% cycle "bg-purple-2", "bg-red-2", "bg-orange-2", "bg-pink-3", "bg-blue-4", "bg-green-2" %}{% endcapture %}
        {% include components/post-panel.html post=post extraClassName=colorClassName %}
    {% endfor %}
</div>
{% endif %}