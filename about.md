---
title: About Me
layout: default
---

<div class="hero bg-orange-3 border-3 border-bottom border-black">
    <div class="hero-left hero-content hero-top d-flex flex-column justify-content-center border-lg-3 border-end-lg border-lg-black py-4 min-vh-50">
        <h1 class="headline">Escapist reader turned digital architect</h1>
        <p class="tagline">I'm Doug Fenstermacher, a web developer by day, bookworm by night, and a proud native of Gloucester, Virginia. Growing up in a small town on dial-up internet surrounded by the salty breeze, I developed a knack for computers and for DIY. These days, I channel that coastal curiosity into crafting elegant applications and diving into the depths of modern technology.</p>
        <p class="tagline">From being a funeral home assistant to health studies, my path to software development has not been a straight line. But the detours along that path taught me relentless determination, empathy, and the importance of balance—all skills that now shape my approach to building digital experiences.</p>
    </div>
    <div class="hero-right hero-content hero-bottom px-0 pt-0 min-vh-50 h-lg-100">
        <img class="w-100 h-100 object-fit-cover" src="/assets/img/1cdaab4b-605f-4c49-92fb-338f65ddf1b6.jpeg">
    </div>
</div>

<div class="hero bg-orange-3 border-3 border-bottom border-black">
    <div class="hero-left hero-bottom hero-content border-lg-3 border-end-lg border-lg-black px-0 pt-0 min-vh-50 h-lg-100">
        <img class="w-100 h-100 object-fit-cover" src="/assets/img/53c23ce7-7706-405d-a366-2a5e85e46749.jpeg">
    </div>
    <div class="hero-right hero-top hero-content d-flex flex-column justify-content-center pt-3 min-vh-50">
        <h2 class="headline">From algorithms to altruism: How I code for a cause</h2>
        <p class="tagline">My hometown, nestled in a world increasingly driven by technology, faces the risk of falling through the cracks. The digital divide widens, leaving some behind. But I refuse to accept a future where anyone is left behind.</p>
        <p class="tagline">I believe tech can be a powerful force for good, and I want to be a part of that movement. I've seen how code can connect isolated communities, provide education to underserved areas, and empower those who've been marginalized. It's not always easy, but the moments when my work makes a real impact in someone's life make it all worthwhile.</p>
    </div>
</div>

<div class="row pt-5">
    <div class="col-12 offset-md-2 col-md-8">
        <h2 class="headline text-center">The palette of my skills</h2>
        <p class="tagline">My skills are a work in progress, a symphony with some beautiful movements and a few off-key notes. Web dev, systems, ML, and OR are a few of the instruments I've learned, but my performance is not over. Expect passion, curiosity, and a constant drive to improve. Take a peek below at the instruments I've mastered (and still learning to tune) and those I'm just picking up.</p>
    </div>
</div>

<div class="grid gx-3 gy-3 p-3">

{% capture panelContent %}
Data architect at heart, I build robust database bridges, connecting applications to their information lifeblood. Performance matters, so I wield MySQL/PL/SQL and NoSQL like finely honed tools, sculpting schemas and optimizing queries for speed and stability.
{% endcapture %}
{% include components/panel.html title="Data Persistence" content=panelContent extraClassName="bg-red-2" %}

{% capture panelContent %}
My DevOps toolkit revolves around automating the noise away. I've built robust Gitlab CI/CD pipelines for websites, from linting code to deploying releases, ensuring pristine pixels and seamless updates. Monitoring dashboards and intelligent alerts keep me in the loop, letting me focus on innovation, not firefighting.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="DevOps" content=panelContent extraClassName="bg-green-2" %}

{% capture panelContent %}
For over 10 years, I've tackled front-end challenges with frameworks like BackboneJS, EmberJS, AngularJS, and ReactJS. Whether online or offline, I build solutions that are both delightful and dependable.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Front-end Web Development" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
I've delved deep into natural language processing, training and serving PyTorch text classifiers through REST APIs. My toolbox includes hierarchical loss functions and classification methods, diverse topic modeling approaches like multi-grain and hierarchical pachinko allocation, and even crafting information extractors from dependency tree rules. In short, I'm passionate about extracting meaning from text, whatever form it takes.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Natural Language Processing" content=panelContent extraClassName="bg-blue-4" %}

{% capture panelContent %}
I navigate complex resource allocation challenges with the power of operations research (OR). From linear and combinatorial optimization to min cost flow and graph coloring, I untangle intricate problems and find efficient solutions. My expertise extends to sensitivity analysis and risk management, ensuring my recommendations adapt to real-world uncertainties.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Operations Research" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
I manage Linux web servers for dozens of domains, ensuring smooth sailing with SSL certificates, partition management, security updates, and Docker deployments and load balancing. Disaster recovery? Prepped and ready. No drama, no stress, just dependable infrastructure for online ventures.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Server/Cloud Administration" content=panelContent extraClassName="bg-orange-2" %}

{% capture panelContent %}
Over 10 years crafting server-side magic in Django, Adobe Experience Manager (AEM), Laravel, and more. SQL dance at my fingertips, weaving APIs and WebSockets that sing in harmony with the front-end. I bridge the gap between server and screen, building cohesive experiences that users simply enjoy.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Server-Side Web Development" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
Craft resilient, scalable systems that hum without ego. I wield Docker, orchestration, and microservices like sculpting tools, shaping architectures that handle heavy loads gracefully. My systems dance and communicate via gRPC/REST APIs, forming a resilient mesh fueled by experience, not hype.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="System Architecture" content=panelContent extraClassName="bg-pink-3" %}

</div>

<div class="hero bg-blue-2 border-3 border-bottom border-black">
    <div class="hero-left hero-content hero-top border-lg-3 border-end-lg border-lg-black px-0 pt-0 min-vh-50 h-lg-100">
        <img class="w-100 h-100 object-fit-cover" src="/assets/img/3e7a9410-3454-4fbc-a75d-266be5048481.jpeg">
    </div>
    <div class="hero-right hero-content hero-bottom d-flex flex-column justify-content-center pt-3 min-vh-50">
        <h2 class="headline">From Narnia to neural networks</h2>
        <p class="tagline">My childhood was a literary safari, devouring Christian fables, whimsical fantasies, and breathless escapades in running books. College opened a banquet of knowledge: philosophy's mind-bending riddles, biology's intricate ecosystems, the dizzying ballet of finance and management. Each bite exposed the world's dizzying vastness, igniting a lifelong quest to understand its complexities and dream on its scale. Now, I dive into the densest textbooks and dissect the elegance of source code, fueling my passion to craft digital experiences that mirror this breathtaking reality, not just sell it.</p>
    </div>
</div>


<div class="hero bg-red-2 border-3 border-bottom border-black">
    <div class="hero-left hero-content hero-top d-flex flex-column justify-content-center border-lg-3 border-end-lg border-lg-black py-4 px-5 min-vh-50">
        <h2 class="headline">Trailblazing code, then trail running</h2>
        <p class="tagline">My creative process isn't fueled by trendy brainstorming sessions or noisy workspaces. It thrives in the quiet moments—amidst the rustling of leaves, the rhythmic pounding of footsteps on trails, and the whispered words on pages. It's a homegrown, small-town approach to tech, where inspiration blooms organically, not manufactured.</p>
    </div>
    <div class="hero-right hero-content hero-bottom px-0 pt-0 min-vh-50 h-lg-100">
        <img class="w-100 h-100 object-fit-cover" src="/assets/img/e75eeaea-6eb8-4869-81c3-4444517da83d.jpeg">
    </div>
</div>