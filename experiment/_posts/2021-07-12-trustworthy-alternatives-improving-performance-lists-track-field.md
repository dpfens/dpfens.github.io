---
layout: post
title: "2 Trustworthy Alternatives to Improving Performance Lists in Track & Field"
description: Improving meet performance lists in track & field using the previous performances of the competitors
keywords: track,field,performance,running,sprinting,jumping,polevault
tags: data running forecasting math

introduction: This was originally a thought experiment on providing a system of accountability for coaches and meet directors in regards to seed times provided to meets.  Improving seed times would improve the quality of competitions and their outcomes for athletes
---

{% include components/heading.html heading='Compounding White Lies' level=2 %}

While I was watching an IAAF track & field meet, I began thinking about when I used to compete in track & field and the performance lists that we used.  In prestigous sanctioned meets like NCAA and IAAF meets, meet directors ensure that the competitions are fair by validating the submitted athletes and their seed performances.  These performances are then used to partition the submitted athletes into optimal heats/flights.  This makes for good competition for athletes and good show for spectators.  But only a very small, elite group of athletes will ever compete in such an environment where fair opportunity is so aggressively pursued and strictly ensured.  For the vast majority of track & field athletes the system of seeding and heat placement is easily manipulated by coaches to the advantage of their athletes and to the detriment of the event participants.

The high school and college meets I have competed in required coaches to register athletes for events with the meet host/director including a corresponding performance.   As in professional meets, these hosts/directors would then use these submitted performances to decide how to split the athletes into heats and flights.  Unlike the NCAA or IAAF, most track & field programs do not the budget, staffing, or even the information to check whether the submitted performances for their meet is accurate or even realistic for each athlete.  Most coaches know these performances are not validated and knowingly inflate the submitted performances of their athletes beyond what they have performed or are capable of performing,  to ensure their own athletes are grouped into heats/flights with superior athletes.  While their athletes are less likely to win their heat or even place highly, the likelihood of the athlete setting a new personal record (PR) increases because the athlete will want to stay with the other athletes to avoid the embarrassment of coming in last place or prove they deserve to be there.

While we could make the argument that if all the coaches are inflating their seeds, then the playing field has been effectively leveled, this is not the case.


*  Seed inflation puts honest coaches and athletes at a disadvantage, and also reduces the quality of competition for spectators, which are equally important to the sport.  These spectators expect to come and watch competitive races with athletes on equal footing which cannot happen when flights/heats are full of athletes who do not deserve to be in it.  This practice results in races with faster runners in slower heats where they will have less competition merely because their coach submitted an accurate seed time, and slower runners placed in faster heats where they may reduce the competitiveness and entertainment value of the heat.
*  Seed inflation provides incentives for seed performances to be further inflated, resulting in  poorly regulated feedback loop.  For coaches to give their athletes an opportunity to be in the heat their athletes deserve, they must also inflate their submitted seeds, or inflate them beyond those of the other coaches.  Those coaches then inflate their seeds further to give their athletes better opportunities.  The only regulator of this feedback look is the meet host/director's willingness to recognize/allow the submission of the seeds, which can vary widely based on the host/director, the coach, and the athlete in question.  This perpetual inflation of seeds makes performance lists reflect the seeds of competitors, which results in heat/flight assignments being made using inaccurate information, and ends with a perpetual decrease in the competitiveness of heats/flights due to the wrong heat/flight assignments being made.


Both of these scenarios result in sub-optimal races which directly diminish both the opportunities for athletes and the entertainment value for spectators.

Now that we have effectively covered what the problem is, what causes the problem, why the problem matters, and why the problem will persist/grow we can move onto covering how this problem might be solved:

<ol>
*  Automatic validation of meet submissions and flagging suspicious performance submissions
*  Formalized coach/meet accountability
*  Largely removing the concept of performance submissions in meet registration
</ol>

{% include components/heading.html heading='A step towards accountability' level=2 %}

Given the small budget that many track & field programs have, the number of track & field meets each year, and the sheer number of athletes, a centralized service for validating athlete performances would be most effective, unbiased, and transparent.  A validation service would need to have a record of all athletes and their previous performances to validate submitted seed times for any existing entities.  Existing services like <a href="https://milesplit.com">Milesplit</a>, <a href="https://www.tfrrs.org/">TFRRS</a>, or <a href="https://www.iaaf.org">IAAF</a> who already have stored decades of performances are the most equipped to provide a scale-able validation services and, most importantly, have some degree of trust within the track & field community.  The validation services could be integrated into existing meet management software so that meet directors do not have to change their workflows.

These race result organizations could write API endpoints to their race results, which could sold be a subscription-based product to meet management software companies to use validate performances when seeds are submitted.  The service would provide an passive income stream to race result organizations from the meet management companies, while improving the quality of meet management software, providing a service to the track & field community.  The resulting data produced from track & field meets could then be loaded into the race result services and improve the quality of their validation services, resulting in a feedback loop, further reinforcing the quality, validity, and trust-worthiness of the service for athletic community.  This would produce a feedback loop with the validation service organizations, meet management software companies, and the track & field community.

{% include components/heading.html heading='Accountability through formalized trust' level=2 %}

In our daily lives we get many opportunities to establish trust and distrust between other people through repeated interactions.  If they live up their word and are honest then our trust in them increases, and if they do not and/or are dishonest, trust decreases. 
 These same interactions occur between meet directors and coaches.  If a coach continuously sends accurate seed performances, trust in the meet director increases. If they continuously inflate their performances, trust decreases.

But what about when a meet director receives seed performances from a new team or a new coach?  The meet director has never worked with them, and has no relationship on which to evaluate trust.  The meet director may not be able to interact with the coach/team enough to determine the degree of trust which they should have for them.  Well, what do you do when you hear from someone whom you don't know and need to know how much to trust them?  You find out if the people you know trust them.  Meet directors can do the same thing, using their existing network of relationships.  They can talk to coaches they trust and find out about if they trust this coach.  And if those coaches do not know if the coach in question is trustworthy they can reach out to the coaches they have worked with, and so on.  This allows coaches to get some idea of the trustworthiness of new coaches/teams without having to take the time to establish a relationship/reputation directly.  This concept of trusting people based on the trust someone else has for them is known as transitive trust.

In 2003, Stanford researchers published <a href="https://nlp.stanford.edu/pubs/eigentrust.pdf">The EigenTrust Algorithm for Reputation Management in P2P Networks</a>, which serves to manage reputation of large numbers of interconnected people in large networks.  The algorithm was built for usage in a peer-to-peer network, meaning that trust is based on the trustworthiness/quality of the assets exchanged between two peers in the network.  In our case, these assets, would be seed times.  The EigenTrust algorithm implements this idea of transitive trust by by having each member of the network provide a list of members of the network they trust.  These members are given high trust scores from their peer which listed them as trustworthy, forming the local trustworthy community around each peer in the network.  The algorithm then calculates a value of trust between all members of the network based on those pre-trusted members and the concept of trust transitivity.

A trust network would be made up of coaches and meet directors. Meets are almost always organized by other coaches, meaning that coaches attend meets held/hosted by other coaches.  This makes the host/meet director a consumer of seed performances from the attending coaches, and the coaches registering for the meet producers of seed performances.  This makes the track & field coaching community both the consumers and producers of seed performances, effectively creating a system which, as each coach submits more and more seed performances to other coaches, will converge upon accurate trust scores for all coaches.  As in the case of autovalidation, this results in a feedback loop by rewarding honest behaviors and punishing dishonest behavior.

But, EigenTrust has a couple of key issues which stem from the high trust that is initially given to pre-trusted peers:

*  Trustworthiness can change over time, so a pre-trusted peer is not prerequisite for trustworthiness into the indefinite future.  Trust is dynamic and can change over time, so a trustworthy peer at one point may not be trustworthy later.  EigenTrust does not account for such changes over time, potentially jeopardizing the reliability of the network
*  Some peers in the network may be trustworthy and provide honest performance seeds but still be given low trust.  Members of the network may overlook honest contributes of reliable members.  While they may be able to recover in the form of other peers identifying them as trustworthy, the lack of recorded trust by the forgetful peer may prevent them from achieving a high overall level of trust in the network
*  A dishonest performance seed from a highly trustworthy peer may result in a collapse of trust in the network.  In such a case, the member's trustworthiness could collapse and result in a significant drop in trust of their honest peers and potentially across the entire network due to the effects of trust transitivity.


These flaws resulted in the development of a many other systems for automated trust management, such as <a href="https://www.sciencedirect.com/science/article/pii/S1319157815000440">HonestPeer</a>  which manages for changing trust and the corruption of previously trusted entites, or the <a href="https://pdfs.semanticscholar.org/4a6f/6dc3ddda1b301a776d74883ba9bfc686ef2b.pdf">Trust Network Analysis with Subjective Logic (TNASL)</a> approach for managing multiple aspects of trustworthiness between entities.

It should also be noted that the EigenTrust, HonestPeer, and TNASL systems can be applied to other aspects of athletics by altering who the members of the network are, and what the assets being exchanged are.  For example, in a competition context the members of a network could be other athletes, and the assets they provide to other athletes is their performance in a shared competition at a athletics meet.  An athlete's performance can be judged by the other participants in their shared competition based on the legitimacy of their performance, such as fairness, lack of doping, etc . which will be reflected in other athlete's trust of them.  But as with performance seeds, we must consider that behavior can change over time, in that athletes currently distrusted may exhibit trustworthy behavior at a later point and that currently trustworthy peers may be come untrustworthy.  In this example, HonestPeer would account for changes in behavior in the form of updated trustworthiness scores, which would be important in a cheating/doping context. We can create similar applications for other aspects as well, such as sportsmanship, etc.

{% include components/heading.html heading='Automated performance lists' level=2 %}

This solution is the most radical solution, but I believe the technology to implement it exists and has a relatively low barrier to entry for organizations with a large database of race results.  The performance list has been necessary since the inception of track & field races.  However, the technology exists now to determine what an athlete is capable of based on their past performances. 
 Typically athletes do not make unpredictable significant leaps in their performances, but make small incremental improvements.  In fact, as athletes become better their performances tend to improve by smaller and smaller increments.  This makes estimating (with reasonable accuracy) what the expected performance of an athlete should be possible.

Let's say that we are a meet director for a large college meet and we received entries for 87 male competitors in the pole vault.  We had access to this season's performances for these athletes we could average their performances to get their average performance this season.  Using the averages for each athlete we would have an unbiased view of their capabilities to use to create the most competitive flights.

{% highlight python linenos %}{% raw %}

if __name__ == '__main__':
    import time
    import csv
    import datetime
    file_name = 'performance.csv'
    with open(file_name, 'rb') as input_file:
        data = list(csv.DictReader(input_file))
    athlete_lookup = dict()
    for performance in data:
        entity_id = performance['entity_id']

        performance['value'] = float(performance['value'])
        if entity_id not in athlete_lookup:
            athlete_lookup[entity_id] = dict(entity_id=entity_id, performances=[])
        if performance['value']:
            athlete_lookup[entity_id]['performances'].append(performance)

    athletes = []
    for athlete, performance_data in athlete_lookup.items():
        dated_performances = [(performance['date'], performance['value']) for performance in performance_data['performances'][::-1]]
        raw_performances = [performance['value'] for performance in performance_data['performances'][::-1]]
        performance_count = len(raw_performances)
        if performance_count:
            average = sum(raw_performances) / performance_count
        else:
            average = 0
        performance_data['average'] = average
        athletes.append(performance_data)
    heat_size = 10
    athlete_count = len(athletes)
    heat_count = athlete_count / heat_size
    if athlete_count % heat_size != 0:
        heat_count += 1
    heats = []
    athletes = sorted(athletes, key=lambda athlete: athlete['average'])
    for i in range(heat_count):
        print i, i * heat_size, (i*heat_size) + heat_size
        heat = athletes[i * heat_size:(i*heat_size) + heat_size]
        heats.append(heat)

    for heat_index, heat in enumerate(heats):
        print '\nHeat #%s' % (heat_index + 1)
        for athlete_index, athlete in enumerate(heat[::-1]):
            print 'Seed #%s: %s' % (athlete_index + 1, athlete['average']){% endraw %}{% endhighlight %}

This solution works.  But athletes usually improve throughout the season, or they get injured and their performances get worse.  Either way, the more recent performances of an athlete are more indicative of their future performance, so we need a measure which gives higher weight to more recent performances.  In this case we will use an <a href="https://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average">exponential moving average (EMA)</a>


{% highlight python linenos %}{% raw %}def exponential_moving_average(iterable, **kwargs):
    iterable_size = len(iterable)
    alpha = kwargs.get('alpha', 2.0 / (iterable_size + 1))
    numerator = 0
    denominator = 0
    base_factor = 1 - alpha
    for i in range(iterable_size):
        if not i:
            numerator = iterable[i]
            denominator = 1.0
            continue
        factor = math.pow(base_factor, i)
        numerator += factor * iterable[i]
        denominator += factor
    return numerator / denominator

if __name__ == '__main__':
    import time
    import csv
    import datetime
    file_name = 'performance.csv'
    with open(file_name, 'rb') as input_file:
        data = list(csv.DictReader(input_file))
    athlete_lookup = dict()
    for performance in data:
        entity_id = performance['entity_id']
        performance['value'] = float(performance['value'])
        if entity_id not in athlete_lookup:
            athlete_lookup[entity_id] = dict(entity_id=entity_id, performances=[])
        if performance['value']:
            athlete_lookup[entity_id]['performances'].append(performance)

    athletes = []
    for athlete, performance_data in athlete_lookup.items():
        raw_performances = [performance['value'] for performance in performance_data['performances'][::-1]]
        performance_count = len(raw_performances)
        if performance_count:
            ema = exponential_moving_average(raw_performances, alpha=0.5)
        else:
            ema = 0
        performance_data['ema'] = average
        athletes.append(performance_data)
    heat_size = 10
    athlete_count = len(athletes)
    heat_count = athlete_count / heat_size
    if athlete_count % heat_size != 0:
        heat_count += 1
    heats = []
    athletes = sorted(athletes, key=lambda athlete: athlete['ema'])
    for i in range(heat_count):
        print i, i * heat_size, (i*heat_size) + heat_size
        heat = athletes[i * heat_size:(i*heat_size) + heat_size]
        heats.append(heat)

    for heat_index, heat in enumerate(heats):
        print '\nHeat #%s' % (heat_index + 1)
        for athlete_index, athlete in enumerate(heat[::-1]):
            print 'Seed #%s: %s' % (athlete_index + 1, athlete['ema']){% endraw %}{% endhighlight %}

This is much better.  This approach gives the most recent performance of an athlete twice weight as their second most recent performance, and 4 times as much weight as their third most recent performance and so on.  The weight that is given to each performance is configurable using the <code>alpha</code> keyword argument in <code>exponential_moving_average</code>.  But we have one more issue:  What if they only started pole vaulting very recently?
 What if their second most recent performance was months ago at the beginning of the season?  The exponential moving average would still give it a fairly high weight.  An even better measure of the athlete's ability would be an exponential moving average that would take into account the time differences between performances

{% highlight python linenos %}{% raw %}import math


def time_series_exponential_moving_average(iterable, **kwargs):
    iterable_size = len(iterable)
    alpha = kwargs.get('alpha', 2.0 / (iterable_size + 1))
    numerator = 0
    denominator = 0
    base_factor = 1.0 - alpha
    for i in range(iterable_size):
        date, value = iterable[i]
        if not i:
            numerator = value
            denominator = 1.0
            previous_date = date
            time_difference = 0.0
            continue
        time_difference = time_difference + (previous_date - date).days  + kwargs.get('normalization', 1.0)
        if not time_difference:
            time_difference = 1.0
        factor = math.pow(base_factor, time_difference)
        numerator += factor * value
        denominator += factor
        previous_date = date
    return numerator / denominator


if __name__ == '__main__':
    import csv
    import datetime
    file_name = 'performance.csv'
    with open(file_name, 'rb') as input_file:
        data = list(csv.DictReader(input_file))
    athlete_lookup = dict()
    for performance in data:
        entity_id = performance['entity_id']
        performance['date'] = datetime.datetime.strptime(performance['date'], '%Y-%m-%d')

        performance['value'] = float(performance['value'])
        if entity_id not in athlete_lookup:
            athlete_lookup[entity_id] = dict(entity_id=entity_id, performances=[])
        if performance['value']:
            athlete_lookup[entity_id]['performances'].append(performance)

    athletes = []
    for athlete, performance_data in athlete_lookup.items():
        dated_performances = [(performance['date'], performance['value']) for performance in performance_data['performances'][::-1]]
        performance_count = len(dated_performances)
        if performance_count:
            ts_ema = time_series_exponential_moving_average(dated_performances, alpha=0.5)
        else:
            tsema = 0
        performance_data['tsema'] = ts_ema
        athletes.append(performance_data)
    heat_size = 10
    athlete_count = len(athletes)
    heat_count = athlete_count / heat_size
    if athlete_count % heat_size != 0:
        heat_count += 1
    heats = []
    athletes = sorted(athletes, key=lambda athlete: athlete['ts_ema'])
    for i in range(heat_count):
        print i, i * heat_size, (i*heat_size) + heat_size
        heat = athletes[i * heat_size:(i*heat_size) + heat_size]
        heats.append(heat)
    for heat_index, heat in enumerate(heats):
        print '\nHeat #%s' % (heat_index + 1)
        for athlete_index, athlete in enumerate(heat[::-1]):
            print 'Seed #%s: %s' % (athlete_index + 1, athlete['ts_ema'])
{% endraw %}{% endhighlight %}

Now we have a more optimal solution to our problem of generating an accurate measure of athlete capability at a given time.  All of these implementation of averages performance run in linear time which should be scale-able to hundreds of thousands of athletes.  We could create a more detailed measure using exponential moving standard deviation, but I believe we have adequately shown that we can use moving averages to get a fairly accurate measure for seeding heats/flights.  This concept can be expanded upon by taking into account the specific attributes of a given competitions, such as topography, terrain, and the weather forecast for the given competition.

This solution would eliminate the practice of seed submission entirely, and could potentially result in an unbiased, transparent, and audit-able method for creating performance lists and heat/flight assignments.  But, it does come with a different set of potential issues.

*  If such a measure were used, it would still not address how to seed athletes that are new to the sport.  Meet directors would still need to rely on seed times from coaches to determine how these newcomers should be seeded in their heats/flights.
*  Implementation would require skilled mathematicians/statisticians, and software developers to implement the automated feedback system for determining how to change the prediction calculations based on the results of each competition.  As the system is in-place over time, the predictions would likely improve, and could yield information regarding athletes, competitions, and courses.
*  This system would cost money to calculate/predict the seed times for each competition.


{% include components/heading.html heading='Holding a new system accountable' level=2 %}

While the methods we discussed hold promise, we still need the capability of quantitatively evaluating the precision/accuracy of our performance lists.  Since the performance list is intended to estimate the performances of the respective athletes in the competition, we can use the actual performances from the competitions to evaluate the accuracy/precision of the generated performance lists.

If the automated trust management approach is used, the trust of the submitter of a performance can be updated according to the accuracy of the submitted performance.  For example, If Jane Doe were to submit the seed time for Jill Doe in the 1600m at 4:02.00, but she only ran 4:24 (my PR), then the trust for Jane Doe would decrease according to the magnitude of the inaccuracy of the seed.

If using the auto-generated approach, the model/equation used to estimate the performance for that individual would be updated.  In the case of distance running, specifically the Riegel model, the exponent coefficient could be adjusted based on the magnitude of the inaccuracy of the current coefficient used for Jill.

{% include components/heading.html heading='Conclusion' level=2 %}
This was a thought experiment that I came up with while watching the IAAF meet on the internet. 
 I understand that inflating seed performances is far from the biggest problem in track & field, as I have been following the news on WADA and the Russian doping stories.  Based on my reading during the meet and that evening, I think that the above approaches have applications in other sports, such as swimming and diving, as well as applications to other community-based problems (ex. doping, ) in sports.