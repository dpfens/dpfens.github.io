---
title: About Me
layout: default
---

<div class="hero bg-orange-3 border-3 border-bottom border-black">
    <div class="hero-left hero-content hero-top d-flex flex-column justify-content-center border-lg-3 border-end-lg border-lg-black py-4 min-vh-50">
        <h1 class="headline">Small-town developer building tomorrow's tech</h1>
        <p class="tagline">I'm Doug Fenstermacher, and I build software from a place where the internet still goes out when it storms.  Growing up in rural Gloucester, Virginia, where I downloaded MS-DOS games on dial-up as a child, I learned that great technology works everywhere.</p>
        <p class="tagline">I spent high school working at a funeral home, which sounds like a non sequitur next to a career in software, but both jobs are about solving problems for people during complicated moments.  The work has to be invisible, reliable, and exactly right. A decade working in research and higher education only sharpened that instinct to build things that are technically rigorous and genuinely useful to the people who need them.</p>
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
        <h2 class="headline">Engineering for both corporate and customer budgets</h2>
        <p class="tagline">The Tidewater region, like most of rural America, exists in a different technological reality than Silicon Valley assumes. Broadband and cell phone service are not ubiquitous and technical literacy varies dramatically. Rather than disrupting lives to fit technology, effective solutions meet people where they are, adapting to existing rhythms and realities.</p>
        <p class="tagline">These resource constraints require the same technical rigor I applied to distributed systems and NLP models, but demand software-defined solutions that can be remotely upgraded rather than expecting users on a budget to purchase new hardware. This discipline transforms how we think about impact. When rural students can access MIT courseware on limited connections, elderly neighbors on a fixed income consult specialists via telehealth, and local businesses reach customers beyond county lines, technology becomes a bridge rather than a barrier. Thoughtful engineering dismantles the structural disadvantages that separate resource & budget constrained communities from opportunity.</p>
    </div>
</div>

<div class="row pt-5">
    <div class="col-12 offset-md-2 col-md-8">
        <h2 class="headline text-center">Where Research Meets Resource Reality</h2>
        <p class="tagline">I've spent ten years in higher education and research. The skills below aren't exhaustive, but they are ones where I can walk into a project and deliver value immediately.</p>
        <p class="tagline">The common thread is that I think in systems. Whether I'm tinkering or working, I'm asking the same questions: What happens when this breaks? Who has to maintain it? What does this actually cost to run?</p>
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
Ten years with frameworks as they've come and gone: Previously BackboneJS & EmberJS, and now ReactJS & AngularJS. I build interfaces that work when the connection is solid and degrade gracefully when it isn't.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Front-end Web Development" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
I've trained and deployed PyTorch text classifiers via REST APIs trained on hierarchical loss functions, bulk evaluated corpuses with topic models, written information extractors from dependency tree rules, and used semantic embeddings for retrieval and classification. I like the puzzle of teaching machines to find meaning in messy human language.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Natural Language Processing" content=panelContent extraClassName="bg-blue-4" %}

{% capture panelContent %}
Resource allocation problems are puzzles I enjoy. Linear optimization, combinatorial optimization, min-cost flow, and graph coloring are all tools for untangling constraints and finding efficient paths through complicated systems. I've also done sensitivity analysis and risk modeling, because real-world solutions need to handle uncertainty.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Operations Research" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
I've managed Linux web servers across dozens of domains including SSL certificates, partition management, security patches, Docker deployments, load balancing, etc.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Server/Cloud Administration" content=panelContent extraClassName="bg-orange-2" %}

{% capture panelContent %}
Ten years building backends in Django, Adobe Experience Manager, Laravel, and more. APIs, WebSockets, database integrations.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="Server-Side Web Development" content=panelContent extraClassName="bg-purple-2" %}

{% capture panelContent %}
I design systems that can grow using Docker, orchestration, microservices, gRPC and REST APIs; components that communicate reliably and fail gracefully.
{% endcapture %}
{% assign panelContent = panelContent | markdownify %}
{% include components/panel.html title="System Architecture" content=panelContent extraClassName="bg-pink-3" %}

</div>

<div class="hero bg-blue-2 border-3 border-bottom border-black">
    <div class="hero-left hero-content hero-top border-lg-3 border-end-lg border-lg-black px-0 pt-0 min-vh-50 h-lg-100">
        <img class="w-100 h-100 object-fit-cover" src="/assets/img/3e7a9410-3454-4fbc-a75d-266be5048481.jpeg">
    </div>
    <div class="hero-right hero-content hero-bottom d-flex flex-column justify-content-center pt-3 min-vh-50">
        <h2 class="headline">Compounding Interest of Reading</h2>
        <p class="tagline">I read a lot. Speculative fiction, mostly, alongside the papers, essays, and textbooks that interest me.
        In fact, I credit reading about topics I didn't understand, or that made me uncomfortable for most of my successes. That curiosity has compounded over decades of grappling with hard questions and built fluency with pluralistic reality. Growing up somewhere small means the available answers come from a narrow set of sources and perspectives, and reading revealed there were others. Once I accepted the world isn't organized the only way it could be, there's nothing left to stop me from holding multiple truths at once.</p>
        <p class="tagline">Le Guin taught me that every system embeds values, whether it admits them or not. Butler showed me how power structures replicate themselves, even in new technologies. Gibson's reminder that <q class="tagline">the future is already here, it's just not very evenly distributed</q> feels different when you live in the unevenly-distributed part.</p>
        <p class="tagline">This matters for engineering. When you've spent years thinking about how societies might work differently, questioning assumptions becomes second nature and so does asking how things might be made better.</p>
    </div>
</div>


<div class="hero bg-red-2 border-3 border-bottom border-black">
    <div class="hero-left hero-content hero-top d-flex flex-column justify-content-center border-lg-3 border-end-lg border-lg-black py-4 px-5 min-vh-50">
        <h2 class="headline">The Long Run Home</h2>
        <p class="tagline">I run the same routes I trained on in high school, back when I was competitive enough to run Division I in college. There's a particular clarity in covering familiar ground with a decade of distance from it. Long-distance running and system architecture are not so different as they look. Each is built slowly, in long seasons, on foundations laid before the work is seen.</p>
        <p class="tagline">The night before a race I would feel pretty calm. The race was the culmination of the workouts and the recoveries of the weeks and months before. The same was true of everyone on the line. I (like everyone else) wanted to win, but the outcome had largely been decided already, in the choices we'd made. So there was nothing left to do but run my race.</p>
        <p class="tagline">Software is similar. Whether a thing turns out simple or complicated is usually the sum of small decisions made long ago. When a feature that seems hard goes in quickly, it's rarely momentary cleverness; it's mostly because the foundation was carefully laid long before in the pieces this new feature rests on. When it fights you, you're paying down a foundation laid carelessly. So the work is never only the work in front of you. It is laying the foundation for the features that, a few months from now, should be simple.</p>
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