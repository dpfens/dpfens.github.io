---
title: About Me
layout: default
---

<div class="hero bg-orange-3 border-3 border-bottom border-black">
    <div class="hero-left hero-content hero-top d-flex flex-column justify-content-center border-lg-3 border-end-lg border-lg-black py-4 min-vh-50">
        <h1 class="headline">Small-town developer building tomorrow's tech</h1>
        <p class="tagline">I'm Doug Fenstermacher, and I build software from a place where the internet still goes out when it storms.  Growing up in rural Gloucester, Virginia where I downloaded MS-DOS games on dial-up as a child, taught me that great technology works everywhere, not just in tech hubs.</p>
        <p class="tagline">My path from funeral home assistant in high school to engineer wasn't straight, but those detours taught me real solutions come from intimately understanding real problems. After 10 years building cutting-edge systems in tech research, I bring both the theoretical depth to build it right and the practical wisdom to build what matters.</p>
    </div>
    <div class="hero-right hero-content hero-bottom px-0 pt-0 min-vh-50 h-lg-100">
        <img class="w-100 h-100 object-fit-cover" src="/assets/img/1cdaab4b-605f-4c49-92fb-338f65ddf1b6.jpeg">
    </div>
</div>

<div class="hero bg-orange-3 border-3 border-bottom border-black">
    <div class="hero-left hero-bottom hero-content border-lg-3 border-end-lg border-lg-black px-0 pt-0 min-vh-50 h-lg-100">
        <img class="w-100 h-100 object-fit-cover" src="/assets/img/53c23ce7-7706-405d-a366-2a5e85e46749.jpg">
    </div>
    <div class="hero-right hero-top hero-content d-flex flex-column justify-content-center pt-3 min-vh-50">
        <h2 class="headline">Engineering for the other 70%</h2>
        <p class="tagline">The Tidewater region, like most of rural America, exists in a different technological reality than Silicon Valley assumes. Broadband and cell phone service are not ubiquitous and technical literacy varies dramatically. Rather than disrupting lives to fit technology, effective solutions meet people where they are, adapting to existing rhythms and realities. These aren't just obstacles, they're design constraints that forge better engineering.</p>
        <p class="tagline">These resource constraints require the same technical rigor I applied to distributed systems and NLP models, but demand software-defined solutions that can be remotely upgraded rather than expecting users on a budget to purchase new hardware. This discipline transforms how we think about impact. When rural students can access MIT courseware on limited connections, when elderly neighbors consult specialists via telehealth, when local businesses reach customers beyond county lines, technology becomes a bridge rather than a barrier. Thoughtful engineering doesn't just solve technical problems; it dismantles the structural disadvantages that separate communities from opportunity.</p>
    </div>
</div>

<div class="row pt-5">
    <div class="col-12 offset-md-2 col-md-8">
        <h2 class="headline text-center">Where Research Meets Resource Reality</h2>
        <p class="tagline">My skillset reflects a decade of work in higher education and research institutions filtered through the lens of real-world applicability. Each capability listed below has been tested at scale and refined for environments where resources cannot be taken for granted.</p>
        <p class="tagline">This isn't a comprehensive inventory but a curated selection of where I can deliver immediate value. The connecting thread is systems thinking: whether optimizing database queries, implementing ML pipelines, or architecting distributed systems, I approach problems holistically, considering not just technical elegance but operational reality.</p>
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
        <h2 class="headline">Through the Looking Glass of Literature</h2>
        <p class="tagline">My reading habits, ranging from speculative fiction to technical papers, reflect a Tidewater upbringing where books were windows to elsewhere. This wasn't escapism but education in perspective. Le Guin taught me that all systems embed values. Butler showed how power structures replicate in new technologies. Gibson reminded me that the future is unevenly distributed.</p>
        <p class="tagline">This literary foundation matters in engineering. When you've spent years thinking about alternative worlds, questioning the architecture of a system comes naturally. The same critical lens I apply to narrative structures helps me identify unstated assumptions in codebases.</p>
    </div>
</div>


<div class="hero bg-red-2 border-3 border-bottom border-black">
    <div class="hero-left hero-content hero-top d-flex flex-column justify-content-center border-lg-3 border-end-lg border-lg-black py-4 px-5 min-vh-50">
        <h2 class="headline">The Long Run Home</h2>
        <p class="tagline">There's a particular clarity that comes from running the same routes where I trained in high school, now with a decade of Silicon Valley experience to reflect on. The patience required for long-distance running directly translates to system architecture: both require thinking in longer cycles than the industry typically rewards.</p>
    </div>
    <div class="hero-right hero-content hero-bottom px-0 pt-0 min-vh-50 h-lg-100">
        <img class="w-100 h-100 object-fit-cover" src="/assets/img/e75eeaea-6eb8-4869-81c3-4444517da83d.jpeg">
    </div>
</div>

<div class="row pt-5">
    <div class="col-12 offset-md-2 col-md-8">
        <h2 class="headline text-center">The View from Between</h2>
        <p class="tagline">I work from the Tidewater by choice, not circumstance. This position, physically removed from tech hubs, offers perspective that pure immersion cannot. I see both what technology promises and where it fails to deliver.</p>
        <p class="tagline">My value lies not in bridging worlds but in understanding why they diverged in the first place.</p>
    </div>
</div>