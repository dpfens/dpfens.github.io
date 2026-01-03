---
title: About Me
layout: default
---

<div class="hero bg-orange-3 border-3 border-bottom border-black">
    <div class="hero-left hero-content hero-top d-flex flex-column justify-content-center border-lg-3 border-end-lg border-lg-black py-4 min-vh-50">
        <h1 class="headline">Small-town developer building tomorrow's tech</h1>
        <p class="tagline">I'm Doug Fenstermacher, and I build software from a place where the internet still goes out when it storms.  Growing up in rural Gloucester, Virginia where I downloaded MS-DOS games on dial-up as a child, taught me that great technology works everywhere</p>
        <p class="tagline">I spent high school working at a funeral home, which sounds like a non sequitur until you realize that both jobs are about solving problems for people during complicated moments. After a decade inresearch and higher education, I've learned to build things that are technically rigorous and actually useful to the people who need them.</p>
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
        <p class="tagline">I've spent ten years in higher education and research. The skills below aren't exhautive, but they are ones where I can walk into a project and deliver value immediately.</p>
        <p class="tagline">The common thread is that I think in systems. Whether I'm tinkering and when I'm working, I'm asking the same questions: What happens when this breaks? Who has to maintain it? What does this actually cost to run?</p>
    </div>
</div>

<div class="grid gx-3 gy-3 p-3">

{% capture panelContent %}
I architect databases that applications can rely on. MySQL, PL/SQL, NoSQL, whatever fits the problem. I design schemas for clarity and optimize queries for speed, because performance matters most when resources are tight.
{% endcapture %}
{% include components/panel.html title="Data Persistence" content=panelContent extraClassName="bg-red-2" %}

{% capture panelContent %}
I automate the tedious stuff so teams can focus on building. GitLab CI/CD pipelines from linting to deployment. Monitoring dashboards that surface real problems. Alerts that mean something. Less firefighting, more shipping.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="DevOps" content=panelContent extraClassName="bg-green-2" %}

{% capture panelContent %}
Ten years with frameworks as they've come and gone: BackboneJS, EmberJS, ReactJS, AngularJS. I build interfaces that work when the connection is solid and degrade gracefully when it isn't.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Front-end Web Development" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
I've trained and deployed PyTorch text classifiers via REST APIs, built hierarchical loss functions for nuanced classification, experimented with topic modeling (multi-grain, hierarchical pachinko allocation), and written information extractors from dependency tree rules. I like the puzzle of teaching machines to find meaning in messy human language.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Natural Language Processing" content=panelContent extraClassName="bg-blue-4" %}

{% capture panelContent %}
Resource allocation problems are puzzles I enjoy. Linear optimization, combinatorial optimization, min-cost flow, and graph coloring are all tools for untangling constraints and finding efficient paths through complicated systems. I've also done sensitivity analysis and risk modeling, because real-world solutions need to handle uncertainty.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Operations Research" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
I've manage Linux web servers across dozens of domains. SSL certificates, partition management, security patches, Docker deployments, load balancing. Disaster recovery plans that actually get tested. Dependable infrastructure without drama.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Server/Cloud Administration" content=panelContent extraClassName="bg-orange-2" %}

{% capture panelContent %}
Ten years building backends in Django, Adobe Experience Manager, Laravel, and more. APIs, WebSockets, database integrations—the invisible plumbing that makes front-ends feel seamless.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Server-Side Web Development" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
I design systems that scale without ego. Docker, orchestration, microservices, gRPC and REST APIs—components that communicate reliably and fail gracefully. Architecture shaped by experience, not trend-chasing.
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
        <p class="tagline">I read a lot. Speculative fiction, mostly, alongside the technical papers and textbooks that interest me. Growing up in Tidewater, books were how I learned that other ways of organizing the world existed.</p>
        <p class="tagline">Le Guin taught me that every system embeds values, whether it admits them or not. Butler showed me how power structures replicate themselves, even in new technologies. Gibson's reminder that "the future is already here, it's just not evenly distributed" feels different when you live in the unevenly-distributed part.</p>
        <p class="tagline">This matters for engineering. When you've spent years thinking about how societies might work differently, questioning a system's assumptions becomes second nature. The same instinct that spots a flawed premise in a novel helps me find the unstated assumptions buried in a codebase.</p>
    </div>
</div>


<div class="hero bg-red-2 border-3 border-bottom border-black">
    <div class="hero-left hero-content hero-top d-flex flex-column justify-content-center border-lg-3 border-end-lg border-lg-black py-4 px-5 min-vh-50">
        <h2 class="headline">The Long Run Home</h2>
        <p class="tagline">I run the same routes I trained on in high school, back when I was competitive enough to run Division I in college. There's a particular clarity in covering familiar ground with a decade of distance from it.</p>
        <p>Long-distance running and system architecture ask for the same thing: patience. Both reward thinking in longer cycles than most people find comfortable. The work that matters rarely looks impressive in the moment.</p>
    </div>
    <div class="hero-right hero-content hero-bottom px-0 pt-0 min-vh-50 h-lg-100">
        <img class="w-100 h-100 object-fit-cover" src="/assets/img/e75eeaea-6eb8-4869-81c3-4444517da83d.jpeg">
    </div>
</div>

<div class="row pt-5">
    <div class="col-12 offset-md-2 col-md-8">
        <h2 class="headline text-center">The View from Between</h2>
        <p class="tagline">I live in Tidewater by choice. Being physically removed from tech hubs gives me something immersion can't: perspective on both what technology promises and where it actually fails to deliver.</p>
        <p class="tagline">I'm interested in bridging worlds but also understanding what parts to take from each to build the world we aspire to.</p>
    </div>
</div>