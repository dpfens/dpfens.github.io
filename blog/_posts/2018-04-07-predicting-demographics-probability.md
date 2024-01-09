---
layout: post
title:  "Predicting Attributes/Demographics"
description: Using probability to estimate demographics while managing uncertainty
keywords: demographics,survey,probability,math,running,graph,bayes,bayesian
tags: math python

introduction: When attempting to identify specific attributes or demographics, we often resort to machine learning techniques to predict the value.   Basic probability can often be used to predict values from aggregate statistics to estimate a value
---

{% include components/heading.html heading='Overview' level=2 %}

It's common practice for websites,web analytics tools (like [Google Analytics Demographics & Interests](https://support.google.com/analytics/answer/2799357?hl=en)), and recommendation systems to collect information from users to create user demographics for analysis, recommending content, and audience targeting.  However, this raises a couple of problems for different types of businesses:

*  These services do not indicate what data was used to make the prediction, nor provide a measure of uncertainty for the predictions.
*  Most websites do not have enough visitors to get a decent sample of their audience, which makes analysis difficult and  audience segmentation nearly impossible.
*  For websites attempting to attract new visitors, discovering information about new visitors can be problematic.  When a visitor comes to their website, they know little to nothing about them and over the course of their visit they learn more about them.  How can they provide their visitor with content they will find most satisfying when they do not have much (or any data) about them?
*  Large scale websites can have issues maximizing use of their pages and their data.  With many landing pages, new visitors can arrive to their website at many landing pages, many of which can provide different types of data on the user.. However, sites cannot predict which data points they will get about a user, due to the wide variety of entry points to the website.  How can they progressively enhance their recommendations and user profile in real-time when they do not know where the user will land on their website, or the order in which they will receive information?


These problems can be mitigated by taking user data from and combining it with relevant statistics with data with larger sample sizes from reputable sources.  Statistics based on a larger sample size can provide a more accurate measure regarding segments in a larger setting.  While this measure also has flaws,  it can provide a starting point for analysis and content recommendation.

I will start with of how to get probabilities from summary statistics of external data.  Then cover how to use this output data for probability-based fuzzy segmentation, and to dynamically predict atttributes (in this case, demographics).  These example will all be based on athletics demographics and segmentation.

{% include components/heading.html heading='Probability from External Data' level=2 %}

The data sets we will be using are sampled from the [Running USA National Runner Survey](https://www.runningusa.org/) and the [Datalys](http://www.datalyscenter.org) publications, specifically those from the [Journal of Athletic Training](http://natajournals.org/) publication [Epidemiology of National Collegiate Athletic Association Men’s and Women’s Cross-Country Injuries, 2009–2010 Through 2013–2014](http://natajournals.org/doi/pdf/10.4085/1062-6050-51.1.10?code=nata-site).

The data is divided into 2 files:

*  A `total_statistics.csv` file, which contains the top level statistics about each group
*  A `runner_type_statistics.csv` file, which contains probabilities for the same fields, but broken down by runner types (which will be covered shortly)


The `total_statistics.csv` file contains the following data (truncated for brevity):

|category|name|probability|
|--- |--- |--- |
|Gender|Female|0.73|
|Gender|Male|0.27|


The `` file contains data in the following format (again, truncated for brevity):

|category|runner type|name|probability|
|--- |--- |--- |--- |
|Health|serious & competitive|Excellent|0.52|
|Health|frequent/fitness|Excellent|0.2|
|Health|walker/jogger/recreational|Excellent|0.2|
|Health|obstacle event participant|Excellent|0.19|


Please use these samples as a reference for the Python code samples later in this post.

We will be loading these files into `Pandas DataFrames` to work with the data more efficiently and to reduce the boilerplate code to demonstrate the concept:

{% highlight python %}
import pandas as pd

totals = pd.read_csv('total_statistics.csv')
runner_type_statistics = pd.read_csv('runner_type_statistics.csv')
{% endhighlight %}

For each of the category, name pairings in `total_statistics.csv`, we will calculate the probability of being of a particular `runner type` or a particular `gender` given that a person has a particular category-name pairing.  We already know the likelihood of a person of a given gender or certain type of runner having a particular demographic. 
We know the probability of a person fits into a particular demographic given they are a particular gender/certain type of runner. But what about the other way around?    *Given that a person fits in a particular demographic, what is the likelihood that the person is a particular gender/is a certain type of runner?*

The following script breaks down the data from both files using Baye's Theorem to calculate the probability of

{% highlight python %}
{% raw %}
group_name = 'running type'
running_type_groups = runner_type_statistics.groupby(group_name)
for running_type_name, running_type_group in main_groups:
    # sum probabilities of being a particular type of runner
    running_type_total_rows = totals[totals['category'] == group_name]
    running_group_probability = running_type_total_rows[group_total_rows['name']==running_type_name]['probability'].sum()

    # break down types of runners by their demographics
    demographic_groups = running_type_group.groupby('category')
    for demographic_group_name, demographic_group_data in demographic_groups:

        for index, row in demographic_group_data.iterrows():
            if row['probability'] == 0.0:
                continue

            demographic_probability = totals[(totals['category'] == row['category']) & (totals['name']==row['name'])]['probability'].sum()

            if not demographic_probability:
                continue
            # calculate conditional probability using Baye's Theorem ( P(B|A) * P(A) ) / P(B)
            conditional_probability = (row['probability'] * running_group_probability) / demographic_probability
            print 'P(%s | %s: %s)' % (running_type_name, row['category'], row['name']), conditional_probability

"""
P(walker/jogger/recreational | training: I don't run if I'm not training for an event) 0.56
P(walker/jogger/recreational | training: I run a few weeks during the year) 0.608
P(walker/jogger/recreational | training: I run a few months during the year) 0.434285714286
P(walker/jogger/recreational | training: I run six months or more during the year) 0.16
P(walker/jogger/recreational | training: I run throughout the year; even if I'm not training for an event) 0.0842105263158
P(walker/jogger/recreational | volunteer for event: Yes) 0.131764705882
P(walker/jogger/recreational | volunteer for event: No) 0.174545454545
P(walker/jogger/recreational | weight: healthy) 0.11027027027
P(walker/jogger/recreational | weight: overweight) 0.292173913043
P(walker/jogger/recreational | weight: obese) 0.8
P(walker/jogger/recreational | weight: underweight) 0.08
P(walker/jogger/recreational | years running: 1-5) 0.21
P(walker/jogger/recreational | years running: 6-10) 0.131428571429
P(walker/jogger/recreational | years running: 11-25) 0.0973913043478
...
"""{% endraw %}{% endhighlight %}

The printed statements are the output probabilities in the format `P( &lt;unknown variable/variable being predicted&gt; | &lt;known variable/demographic&gt; )`

In order to convert probabilities to classifications, we need to set a probability threshold for the probability of category types.  Setting a lower threshold means that we will get more information, but the information may be less reliable, but a higher threshold will provide less information, but the information will be more reliable.  You may have to experiment with a threshold based on your acceptable level of risk.   If no category types are above this threshold, we can conclude that we do not yet have enough information:

{% highlight python %}
# probabilities of runner types
runner_types = {
    'Serious & competitive':	0.18,
    'frequent/fitness':	0.65,
    'walker/jogger/recreational':	0.16,
    'obstacle event participant':	0.01,
}
threshold = 0.6 # a very low threshold, for very low risk scenarios

most_likely_runner_type = max(runner_types, key=running_types.get)  #  'frequent/fitness'
if runner_types[most_likely_runner_type] >= threshold:
    running_type = most_likely_runner_type
else:
    running_type = None
{% endhighlight %}

{% include components/heading.html heading='Estimating demographics using larger datasets' level=2 %}

Small businesses and startups have to find their audiences in order to know who to market their products/services to.  Many companies like [MileStat](https://va.milesplit.com), [Flash Results, Inc.](http://flashresults.com/), and [RunCoach](https://runcoach.com) have niche audiences that their services are catered towards.  But however small a niche is, they still need to identify audiences with highest conversion rates, and the ones who are not converting at all.  Finding who the converting audiences are is possibly the easier of the two groups, this is because many of these services request demographic information from users when setting up their services, like gender, age, physical activity level, etc.   This information is generally more trustworthy and accurate, because the user expects for this information to be used to provide a more useful service for them.  Finding who the users are that are not converting is the harder problem.  These visitors may not explicitly provide information to the company, and if they do they do not have incentives to do so truthfully.  Business analysts have to manage this uncertainty in their predictions and classifications, which larger data sets help manage.  These data sets should be a fairly accurate distribution of the total population, which (in the absence of significant customer data) can act as a crude but effective way of predicting visitor demographics.  It does not matter that the distribution may not be exact, so long as the correlations are close to those of the actual population.   While this method has its flaws its meant to be a temporary complement to a growing, but currently small, data set

Here is a relatively common example *A race results website is trying to identify who their most active audiences are, but they have no visitor logins and only recently deployed tracking tools like Google Tag Manager / Google Analytics*.  Many smaller content-driven websites are in the same boat:  Boatloads of content, but no way of finding out who is reading and who is bouncing from their website.  There are a couple high-level demographics that will be useful for this website:

*  Gender
*  Role: Race Official, Coach, Athlete or Enthusiast
*  Event Preferences: Distance running vs Sprints vs Field events
*  Team Association (if any or if applicable)


We can use the [Running USA 2012 Survey](http://cdn.trustedpartner.com/docs/library/RunningUSA2012/RunningUSA_NRS_2016_RUSA_F.pdf) to enhance our predictions.  But before we dive into solving our problem, let's explore the data.

|category|subcategory|dimension|dimension name|name|probability|
|--- |--- |--- |--- |--- |--- |
|demographics|gender|all|all|female|0.37|
|demographics|gender|all|all|male|0.63|
|demographics|age group|all|all|18-24|0.04|
|demographics|age group|all|all|25-34|0.19|
|demographics|age group|all|all|35-44|0.28|
|demographics|age group|all|all|45-54|0.27|
|demographics|age group|all|all|55-64|0.17|
|demographics|age group|all|all|65-74|0.05|
|demographics|age group|all|all|>75|0.01|
|demographics|marital status|all|all|married|0.68|
|demographics|marital status|all|all|single, never married|0.2|
|demographics|marital status|all|all|divorced|0.08|
|demographics|marital status|all|all|domestic partner|0.03|
|demographics|marital status|all|all|widowed|0.01|
|demographics|marital status|all|all|separated|0.01|
|demographics|household composition|all|all|1|0.14|
|demographics|household composition|all|all|2|0.32|
|demographics|household composition|all|all|3|0.16|
|demographics|household composition|all|all|4|0.23|
|demographics|household composition|all|all|>5|0.14|
|demographics|children under 19|all|all|0|0.52|
|demographics|children under 19|all|all|1|0.16|
|demographics|children under 19|all|all|2|0.22|
|demographics|children under 19|all|all|3|0.08|
|demographics|children under 19|all|all|>4|0.03|
|demographics|education|all|all|Currently full-time student and under 19|0.04|
|demographics|education|all|all|Attended college 1-3 years|0.08|
|demographics|education|all|all|Associate’s degree|0.06|
|demographics|education|all|all|Technical or Trade degree|0.02|
|demographics|education|all|all|Graduated from 4-year college|0.36|
|demographics|education|all|all|Post-grad study without degree|0.06|
|demographics|education|all|all|Master’s degree|0.29|
|demographics|education|all|all|Doctoral degree|0.08|
|demographics|employment|all|all|Employed full-time|0.87|
|demographics|employment|all|all|student|0.03|
|demographics|employment|all|all|retired|0.03|
|demographics|employment|all|all|homemaker|0.06|
|demographics|employment|all|all|unemployed|0.02|
|demographics|ethnicity|all|all|white/caucasian|0.84|
|demographics|ethnicity|all|all|black/african american|0.07|
|demographics|ethnicity|all|all|asian/pacific islander|0.06|
|demographics|ethnicity|all|all|hispanic|0.04|
|demographics|ethnicity|all|all|american indian|0.01|
|demographics|ethnicity|all|all|other|0.02|
|demographics|annual income (employed)|all|all|< $15,000|0.03|
|demographics|annual income (employed)|all|all|$15,000-$24,999|0.03|
|demographics|annual income (employed)|all|all|$25,000-$34,999|0.04|
|demographics|annual income (employed)|all|all|$35,000-$49,999|0.12|
|demographics|annual income (employed)|all|all|$50,000-$74,999|0.24|
|demographics|annual income (employed)|all|all|$75,000-$99,999|0.15|
|demographics|annual income (employed)|all|all|$100,000-$124,999|0.1|
|demographics|annual income (employed)|all|all|$125,000-$149,999|0.04|
|demographics|annual income (employed)|all|all|$150,000-$174,999|0.03|
|demographics|annual income (employed)|all|all|$175,000-$199,999|0.01|
|demographics|annual income (employed)|all|all|>$200,000|0.04|
|demographics|annual income (employed)|all|all|Don’t Know/Refused|0.17|
|demographics|runner type|all|all|Jogger / Recreational Runner|0.21|
|demographics|runner type|all|all|Serious & Competitive Runner|0.15|
|demographics|runner type|all|all|Frequent / Fitness Runner|0.62|
|habits|time ran per year|all|all|12 months / year|0.76|
|habits|time ran per week|all|all|>= 4 days / week|0.56|
|motivators|start running|all|all|for exercise|0.24|
|motivators|start running|all|all|weight concerns|0.14|
|motivators|start running|all|all|Friend / family encouragement|0.09|
|motivators|start running|all|all|To enter a race|0.08|
|motivators|start running|all|all|Competed in school and never stopped|0.08|
|motivators|start running|all|all|Because I enjoy it|0.06|
|motivators|start running|all|all|Needed a new challenge|0.06|
|motivators|start running|all|all|To relieve stress|0.06|
|motivators|start running|all|all|Health concerns besides weight|0.05|
|motivators|start running|all|all|To get in shape for another sport|0.03|
|motivators|continue to run|all|all|staying healthy|0.77|
|motivators|continue to run|all|all|staying in shape|0.73|
|motivators|continue to run|all|all|relieving stress|0.62|
|motivators|continue to run|all|all|to enter / train for a race|0.62|
|motivators|continue to run|all|all|having fun|0.55|
|motivators|continue to run|all|all|achieving a goal|0.54|
|motivators|continue to run|all|all|meeting a personal challenge|0.53|
|motivators|continue to run|all|all|improving my state pf mind|0.53|
|motivators|continue to run|all|all|controlling my weight|0.53|
|motivators|continue to run|all|all|improving speed or endurance|0.46|
|motivators|continue to run|all|all|socializing with friends/family/others|0.41|
|motivators|continue to run|all|all|appreciating nature, scenery|0.39|
|motivators|continue to run|all|all|being by myself for awhile|0.39|
|motivators|continue to run|all|all|getting into the natural environment|0.31|
|motivators|continue to run|all|all|competing against others|0.22|
|motivators|continue to run|all|all|stay injury free|0.13|
|motivators|goals|all|all|stay healthy|0.68|
|motivators|goals|all|all|set a new PR|0.43|
|motivators|goals|all|all|Run a new race|0.4|
|motivators|goals|all|all|lose weight|0.32|
|motivators|goals|all|all|run a marathon|0.29|
|motivators|goals|all|all|keep a running streak|0.13|
|motivators|goals|all|all|Run 2017+ miles|0.05|
|motivators|goals|all|all|Run 1+ mile/day|0.03|
|activity|regular activities as part of running|all|all|warm up/stretch|0.55|
|activity|regular activities as part of running|all|all|use machines/weight|0.49|
|activity|regular activities as part of running|all|all|walk|0.47|
|activity|regular activities as part of running|all|all|bike|0.27|
|activity|regular activities as part of running|all|all|yoga/pilates|0.26|
|activity|regular activities as part of running|all|all|hike|0.21|
|activity|regular activities as part of running|all|all|HIIT Training|0.21|
|activity|regular activities as part of running|all|all|Spin|0.18|
|activity|regular activities as part of running|all|all|Swim|0.14|
|activity|regular activities as part of running|all|all|Aerobics|0.11|
|activity|regular activities as part of running|all|all|Crossfit|0.1|
|activity|regular activities as part of running|all|all|Form Drills|0.09|
|preferences|time to run|all|all|early AM|0.64|
|preferences|time to run|all|all|Mid-morning|0.25|
|preferences|time to run|all|all|Noon|0.06|
|preferences|time to run|all|all|Early afternoon|0.06|
|preferences|time to run|all|all|Mid-afternoon|0.11|
|preferences|time to run|all|all|Early evening|0.39|
|preferences|time to run|all|all|Late evening|0.09|
|preferences|regular running workouts|all|all|easy runs (aerobic)|0.86|
|preferences|regular running workouts|all|all|long runs (>1 hour)|0.79|
|preferences|regular running workouts|all|all|hill training|0.44|
|preferences|regular running workouts|all|all|pace workouts|0.44|
|preferences|regular running workouts|all|all|tempo runs|0.38|
|preferences|regular running workouts|all|all|recovery runs|0.31|
|preferences|regular running workouts|all|all|fartlek|0.17|
|preferences|regular running workouts|all|all|pickups|0.08|
|preferences|social runs|all|all|alone|0.55|
|preferences|social runs|all|all|with one other person|0.16|
|preferences|social runs|all|all|in a group|0.14|
|preferences|social runs|all|all|no preference|0.16|
|preferences|venue/surface|all|all|paved path|0.67|
|preferences|venue/surface|all|all|urban road|0.54|
|preferences|venue/surface|all|all|park|0.47|
|preferences|venue/surface|all|all|rural road|0.44|
|preferences|venue/surface|all|all|dirt trail|0.4|
|preferences|venue/surface|all|all|outdoor track|0.2|
|preferences|venue/surface|all|all|mountains|0.16|
|preferences|venue/surface|all|all|treadmill|0.14|
|preferences|venue/surface|all|all|beach|0.12|
|preferences|season|all|all|fall|0.46|
|preferences|season|all|all|winter|0.1|
|preferences|season|all|all|spring|0.34|
|preferences|season|all|all|summer|0.11|
|preferences|prevent running outside|all|all|too icy|0.69|
|preferences|prevent running outside|all|all|don’t feel safe|0.48|
|preferences|prevent running outside|all|all|windchill too low|0.44|
|preferences|prevent running outside|all|all|too rainy|0.35|
|preferences|prevent running outside|all|all|too dark|0.34|
|preferences|prevent running outside|all|all|too cold|0.31|
|preferences|prevent running outside|all|all|too hot|0.31|
|preferences|prevent running outside|all|all|nothing|0.07|
|preferences|group involvement|all|all|Local running club|0.34|
|preferences|group involvement|all|all|Social groups / informal groups|0.29|
|preferences|group involvement|all|all|running store group runs|0.18|
|preferences|group involvement|all|all|virtual running club / challenge group|0.11|
|preferences|group involvement|all|all|meetup running group|0.06|
|preferences|group involvement|all|all|rrca|0.06|
|preferences|group involvement|all|all|usa track & field|0.04|
|preferences|group involvement|all|all|none|0.4|
|preferences|carrying items|all|all|personal ID|0.34|
|preferences|carrying items|all|all|fitness tracker|0.3|
|preferences|carrying items|all|all|water bottle|0.28|
|preferences|carrying items|all|all|energy bars/gel|0.24|
|preferences|carrying items|all|all|portable audio sysem/ipod/MP3|0.23|
|preferences|carrying items|all|all|hydration accessories (belt, backpack)|0.21|
|preferences|carrying items|all|all|Spibelt (or similar waist belt)|0.21|
|preferences|carrying items|all|all|sunscreen|0.2|
|preferences|carrying items|all|all|reflective gear|0.19|
|preferences|carrying items|all|all|heart rate monitor|0.18|
|preferences|carrying items|all|all|cash/credit card|0.17|
|preferences|carrying items|all|all|chapstick/lipgloss|0.16|
|preferences|carrying items|all|all|compression gear|0.15|
|preferences|carrying items|all|all|sports drink|0.09|
|preferences|carrying items|all|all|sweatband|0.08|
|preferences|carrying items|all|all|dog|0.07|
|preferences|carrying items|all|all|pepper spray|0.07|
|preferences|carrying items|all|all|sleeves|0.04|
|preferences|carrying items|all|all|toilet paper|0.04|
|preferences|carrying items|all|all|inhaler|0.04|
|racing|runner type|all|all|competitor|0.56|
|racing|runner type|all|all|fun runner|0.52|
|racing|runner type|all|all|fitness participant|0.37|
|racing|runner type|all|all|outdoor enthusiast|0.15|
|racing|Preferred distance|all|all|5k|0.14|
|racing|Preferred distance|all|all|10k|0.18|
|racing|Preferred distance|all|all|12k, 15k, 10 mile|0.06|
|racing|Preferred distance|all|all|half marathon|0.43|
|racing|Preferred distance|all|all|marathon|0.1|
|racing|entered last 2 years|all|all|5k|0.82|
|racing|entered last 2 years|all|all|half marathon|0.8|
|racing|entered last 2 years|all|all|10k|0.67|
|racing|entered last 2 years|all|all|marathon|0.43|
|racing|entered last 2 years|all|all|12k, 15k, 10 mile|0.37|
|racing|entered last 2 years|all|all|4 mile, 8k, or 5 mile|0.33|
|racing|entered last 2 years|all|all|fun run or untimed run|0.24|
|racing|entered last 2 years|all|all|trail race|0.23|
|racing|entered last 2 years|all|all|road running relay|0.13|
|racing|entered last 2 years|all|all|triathlon/duathlon|0.12|
|racing|entered last 2 years|all|all|mud/obstacle|0.1|
|racing|entered last 2 years|all|all|color|0.08|
|racing|entered last 2 years|all|all|1 mile or 2 mile|0.11|
|racing|entered last 2 years|all|all|Glow / night|0.08|
|racing|entered last 2 years|all|all|20k, 25k, or 30k|0.07|
|racing|entered last 2 years|all|all|ultra distance|0.08|
|racing|entered last 2 years|all|all|untimed walk event|0.06|
|racing|entered last 2 years|all|all|Cross-country race|0.05|
|racing|most interested in upcoming year|all|all|5k|0.56|
|racing|most interested in upcoming year|all|all|half marathon|0.75|
|racing|most interested in upcoming year|all|all|10k|0.56|
|racing|most interested in upcoming year|all|all|marathon|0.41|
|racing|most interested in upcoming year|all|all|12k, 15k, 10 mile|0.3|
|racing|most interested in upcoming year|all|all|4 mile, 8k, or 5 mile|0.21|
|racing|most interested in upcoming year|all|all|fun run or untimed run|0.08|
|racing|most interested in upcoming year|all|all|trail race|0.23|
|racing|most interested in upcoming year|all|all|road running relay|0.12|
|racing|most interested in upcoming year|all|all|triathlon/duathlon|0.13|
|racing|most interested in upcoming year|all|all|mud/obstacle|0.1|
|racing|most interested in upcoming year|all|all|color|0.05|
|racing|most interested in upcoming year|all|all|1 mile or 2 mile|0.06|
|racing|most interested in upcoming year|all|all|Glow / night|0.07|
|racing|most interested in upcoming year|all|all|20k, 25k, or 30k|0.08|
|racing|most interested in upcoming year|all|all|ultra distance|0.1|
|racing|most interested in upcoming year|all|all|untimed walk event|0.02|
|racing|most interested in upcoming year|all|all|Cross-country race|0.05|
|racing|holiday event|all|all|thanksgiving|0.54|
|racing|holiday event|all|all|fourth of july|0.26|
|racing|holiday event|all|all|st patrick’s day|0.2|
|racing|holiday event|all|all|new years|0.18|
|racing|holiday event|all|all|christmas|0.15|
|racing|holiday event|all|all|halloween|0.13|
|racing|holiday event|all|all|valentine’s day|0.08|
|racing|participation change last year|all|all|decrease|0.2|
|racing|participation change last year|all|all|same|0.5|
|racing|participation change last year|all|all|increase|0.3|
|racing|Planned participation change next year|all|all|decrease|0.08|
|racing|Planned participation change next year|all|all|same|0.56|
|racing|Planned participation change next year|all|all|increase|0.36|
|racing|Half-marathons completed|all|all|0|0.1|
|racing|Half-marathons completed|all|all|1|0.08|
|racing|Half-marathons completed|all|all|2|0.07|
|racing|Half-marathons completed|all|all|3-5|0.16|
|racing|Half-marathons completed|all|all|6-10|0.2|
|racing|Half-marathons completed|all|all|11-15|0.13|
|racing|Half-marathons completed|all|all|16-20|0.09|
|racing|Half-marathons completed|all|all|21-25|0.04|
|racing|Half-marathons completed|all|all|>=25|0.13|
|racing|marathons completed|all|all|0|0.38|
|racing|marathons completed|all|all|1|0.15|
|racing|marathons completed|all|all|2|0.08|
|racing|marathons completed|all|all|3-5|0.14|
|racing|marathons completed|all|all|6-10|0.1|
|racing|marathons completed|all|all|11-15|0.05|
|racing|marathons completed|all|all|16-20|0.03|
|racing|marathons completed|all|all|21-25|0.01|
|racing|marathons completed|all|all|>=25|0.05|
|racing|Top factors effecting participation|all|all|preferred distance|0.81|
|racing|Top factors effecting participation|all|all|date of event|0.78|
|racing|Top factors effecting participation|all|all|location is convenient|0.7|
|racing|Top factors effecting participation|all|all|have time to train|0.67|
|racing|Top factors effecting participation|all|all|health/injury|0.67|
|racing|Top factors effecting participation|all|all|sounds fun|0.66|
|racing|Top factors effecting participation|all|all|chip timed|0.65|
|racing|Top factors effecting participation|all|all|scenic course|0.61|
|racing|Top factors effecting participation|all|all|cost/entry fee|0.59|
|racing|Top factors effecting participation|all|all|reputation of event organizers|0.58|
|racing|Other factors effecting participation|all|all|accurate, vertified course|0.52|
|racing|Other factors effecting participation|all|all|medal or other momento for finishers|0.49|
|racing|Other factors effecting participation|all|all|quality t-shirt|0.44|
|racing|Other factors effecting participation|all|all|fun post-race experience|0.38|
|racing|Other factors effecting participation|all|all|it benefits an important cause|0.35|
|racing|Other factors effecting participation|all|all|no crowds/traffic/hassles expected|0.34|
|racing|Other factors effecting participation|all|all|my friends are doing it|0.34|
|racing|Other factors effecting participation|all|all|promise of a unique event|0.31|
|racing|Other factors effecting participation|all|all|It is an event I participated In before|0.29|
|racing|Other factors effecting participation|all|all|Fast course|0.26|
|racing|Other factors effecting participation|all|all|free race photos or videos|0.24|
|racing|Other factors effecting participation|all|all|entertainment on course or finish|0.24|
|racing|Other factors effecting participation|all|all|good age group awards|0.19|
|racing|Other factors effecting participation|all|all|sustainable event/ has an environmental initiative|0.18|
|racing|Other factors effecting participation|all|all|there Is an expo|0.15|
|racing|Other factors effecting participation|all|all|qualifier|0.15|
|racing|Other factors effecting participation|all|all|recycled/sustainable race t-shirt|0.12|
|racing|Other factors effecting participation|all|all|something offered to other family members|0.11|
|racing|Other factors effecting participation|all|all|it is a new event|0.1|
|racing|Other factors effecting participation|all|all|has a social media app / site for sharing experience|0.1|
|racing|Other factors effecting participation|all|all|random participant awards|0.1|
|racing|Other factors effecting participation|all|all|appropriate training group is available|0.06|
|racing|Other factors effecting participation|all|all|race Is part of a local grand prix|0.05|
|racing|Other factors effecting participation|all|all|elite runners in the field|0.05|
|racing|Other factors effecting participation|all|all|expo has guest speakers I am interested In meeting|0.04|
|racing|Other factors effecting participation|all|all|Women only event|0.04|
|racing|primary source of information|all|all|facebook|0.43|
|racing|primary source of information|all|all|word of mouth|0.37|
|racing|primary source of information|all|all|individual race website|0.35|
|racing|primary source of information|all|all|registration website|0.27|
|racing|primary source of information|all|all|running store group runs|0.23|
|racing|primary source of information|all|all|local club / city website|0.18|
|racing|primary source of information|all|all|race calendar apps|0.18|
|racing|primary source of information|all|all|national website|0.15|
|racing|primary source of information|all|all|Expos|0.11|
|racing|primary source of information|all|all|Regional / state website|0.1|
|racing|primary source of information|all|all|national magazine|0.09|
|racing|primary source of information|all|all|local publications|0.09|
|racing|primary source of information|all|all|instagram|0.05|
|racing|primary source of information|all|all|state or regional publication|0.04|
|racing|primary source of information|all|all|twitter|0.04|
|racing|primary source of information|all|all|GroupOn / Living Social / Rush 49|0.02|
|racing|Attitudes & behaviors|all|all|I prefer a tech finisher t-shirt to a cotton finisher t-shirt|0.73|
|racing|Attitudes & behaviors|all|all|It is easy to find an event I want to participate in|0.73|
|racing|Attitudes & behaviors|all|all|I would participate in more events if entry feeds were lower|0.62|
|racing|Attitudes & behaviors|all|all|I prefer traditional to non-traditional (i.e. mud, obstacle, color) running events|0.58|
|racing|Attitudes & behaviors|all|all|Race fees are too expensive|0.56|
|racing|Attitudes & behaviors|all|all|I receive good value for my race fee|0.51|
|racing|Attitudes & behaviors|all|all|I like participating in the same events every year|0.49|
|racing|Attitudes & behaviors|all|all|I am always looking for a new event experience|0.48|
|racing|Attitudes & behaviors|all|all|I like to share my race experience with others via social media|0.45|
|racing|Attitudes & behaviors|all|all|I wish races offered something other than a finisher t-shirt for SWAG|0.4|
|racing|Attitudes & behaviors|all|all|you should get a race finisher t-shirt for finishing shorter distances like a 5k or 10k|0.33|
|racing|Attitudes & behaviors|all|all|Social media is my first choice for event information|0.28|
|racing|Attitudes & behaviors|all|all|You should only get a race finisher medal for a half-marathon or marathon|0.27|
|racing|Attitudes & behaviors|all|all|I prefer larger races to smaller races|0.26|
|racing|Attitudes & behaviors|all|all|Race medals are getting too big|0.23|
|racing|Attitudes & behaviors|all|all|I like to take pictures while I am participating in an event|0.2|
|racing|Attitudes & behaviors|all|all|There are too many events to choose from|0.16|
|racing|Attitudes & behaviors|all|all|I would pay more for a VIP race experience (race day packet pickup, access to special porto potties, front on the starting line access, etc)|0.15|
|racing|Attitudes & behaviors|all|all|I don’t care about my race time|0.12|
|racing|Attitudes & behaviors|all|all|I would prefer to participate in events as a group vs individually|0.11|
|racing|Attitudes & behaviors|all|all|I like events where I can dress up in a costume / there is a theme|0.09|
|racing|Attitudes & behaviors|all|all|I prefer untimed events to times events|0.03|
|social media|follows|all|all|Running stores|0.4|
|social media|follows|all|all|Running brands|0.37|
|social media|follows|all|all|Local runners|0.32|
|social media|follows|all|all|Elite runners|0.29|
|social media|follows|all|all|Bloggers|0.19|
|social media|follows|all|all|Celebrities|0.05|
|social media|follows|all|all|None of these|0.16|
|social media|follows|all|all|I don’t follow any running-related accounts|0.21|
|technology|app usage|all|all|I like to have / track all of my running statistics|0.82|
|technology|app usage|all|all|It helps me train better|0.65|
|technology|app usage|all|all|It makes me feel good to see what I ran|0.61|
|technology|app usage|all|all|I like to share the information with others on social media|0.17|
|technology|app usage|all|all|I like to see how I compare to other runners|0.15|
|technology|app usage|all|all|I like to share the information with a running coach|0.07|
|technology|app usage|all|all|Everyone else is using them so I do too|0.02|
|technology|tracking|device|Phone / app on phone|track mileage|0.45|
|technology|tracking|device|Phone / app on phone|GPS|0.36|
|technology|tracking|device|Phone / app on phone|track nutrition / calories|0.29|
|technology|tracking|device|Phone / app on phone|track steps|0.21|
|technology|tracking|device|Phone / app on phone|map routes|0.38|
|technology|tracking|device|Phone / app on phone|play music|0.55|
|technology|tracking|device|Phone / app on phone|training programs|0.22|
|technology|tracking|device|Phone / app on phone|tracking workouts|0.4|
|technology|tracking|device|Phone / app on phone|interval training|0.17|
|technology|tracking|device|Phone / app on phone|virtual coach|0.11|
|technology|tracking|device|Phone / app on phone|none of these|0.08|
|technology|tracking|device|watch|track mileage|0.48|
|technology|tracking|device|watch|GPS|0.52|
|technology|tracking|device|watch|track nutrition / calories|0.07|
|technology|tracking|device|watch|track steps|0.28|
|technology|tracking|device|watch|map routes|0.17|
|technology|tracking|device|watch|play music|0.04|
|technology|tracking|device|watch|training programs|0.08|
|technology|tracking|device|watch|tracking workouts|0.34|
|technology|tracking|device|watch|interval training|0.27|
|technology|tracking|device|watch|virtual coach|0.04|
|technology|tracking|device|watch|none of these|0.08|
|technology|tracking|device|wearable tracking device|track mileage|0.23|
|technology|tracking|device|wearable tracking device|GPS|0.16|
|technology|tracking|device|wearable tracking device|track nutrition / calories|0.05|
|technology|tracking|device|wearable tracking device|track steps|0.26|
|technology|tracking|device|wearable tracking device|map routes|0.08|
|technology|tracking|device|wearable tracking device|play music|0.04|
|technology|tracking|device|wearable tracking device|training programs|0.04|
|technology|tracking|device|wearable tracking device|tracking workouts|0.17|
|technology|tracking|device|wearable tracking device|interval training|0.09|
|technology|tracking|device|wearable tracking device|virtual coach|0.02|
|technology|tracking|device|wearable tracking device|none of these|0.11|
|technology|tracking|device|online website|track mileage|0.12|
|technology|tracking|device|online website|GPS|0.04|
|technology|tracking|device|online website|track nutrition / calories|0.06|
|technology|tracking|device|online website|track steps|0.02|
|technology|tracking|device|online website|map routes|0.24|
|technology|tracking|device|online website|play music|0.01|
|technology|tracking|device|online website|training programs|0.18|
|technology|tracking|device|online website|tracking workouts|0.12|
|technology|tracking|device|online website|interval training|0.04|
|technology|tracking|device|online website|virtual coach|0.04|
|technology|tracking|device|online website|none of these|0.09|
|social media|activity|platform|all|fundraise for a charity event|0.62|
|social media|activity|platform|all|discuss running-related activities|0.62|
|social media|activity|platform|all|look for running motivation|0.49|
|social media|activity|platform|all|recruit others to join me at an upcoming race|0.49|
|social media|activity|platform|all|share your current training|0.47|
|social media|activity|platform|all|communicate with training partners|0.43|
|social media|activity|platform|all|recruit others to train with you|0.42|
|social media|activity|platform|all|post your race results|0.42|
|social media|activity|platform|all|follow events|0.4|
|social media|activity|platform|all|post general running photos and videos|0.38|
|social media|activity|platform|all|look for running training advice|0.37|
|social media|activity|platform|all|track friends / family in a race|0.33|
|social media|activity|platform|all|follow other runners (non-professional)|0.31|
|social media|activity|platform|all|Follow professional runners|0.29|
|social media|activity|platform|all|Post your mileage / running routes|0.29|
|social media|activity|platform|all|Post race photos and videos|0.26|
|social media|activity|platform|all|None of these|0.15|
|social media|activity|platform|facebook|fundraise for a charity event|0.07|
|social media|activity|platform|facebook|discuss running-related activities|0.11|
|social media|activity|platform|facebook|look for running motivation|0.06|
|social media|activity|platform|facebook|recruit others to join me at an upcoming race|0.06|
|social media|activity|platform|facebook|share your current training|0.06|
|social media|activity|platform|facebook|communicate with training partners|0.08|
|social media|activity|platform|facebook|recruit others to train with you|0.04|
|social media|activity|platform|facebook|post your race results|0.09|
|social media|activity|platform|facebook|follow events|0.05|
|social media|activity|platform|facebook|post general running photos and videos|0.06|
|social media|activity|platform|facebook|look for running training advice|0.03|
|social media|activity|platform|facebook|track friends / family in a race|0.05|
|social media|activity|platform|facebook|follow other runners (non-professional)|0.02|
|social media|activity|platform|facebook|Follow professional runners|0.04|
|social media|activity|platform|facebook|Post your mileage / running routes|0.04|
|social media|activity|platform|facebook|Post race photos and videos|0.11|
|social media|activity|platform|facebook|None of these|0.22|
|social media|activity|platform|twitter|fundraise for a charity event|0.26|
|social media|activity|platform|twitter|discuss running-related activities|0.16|
|social media|activity|platform|twitter|look for running motivation|0.21|
|social media|activity|platform|twitter|recruit others to join me at an upcoming race|0.16|
|social media|activity|platform|twitter|share your current training|0.1|
|social media|activity|platform|twitter|communicate with training partners|0.2|
|social media|activity|platform|twitter|recruit others to train with you|0.07|
|social media|activity|platform|twitter|post your race results|0.2|
|social media|activity|platform|twitter|follow events|0.07|
|social media|activity|platform|twitter|post general running photos and videos|0.09|
|social media|activity|platform|twitter|look for running training advice|0.06|
|social media|activity|platform|twitter|track friends / family in a race|0.12|
|social media|activity|platform|twitter|follow other runners (non-professional)|0.05|
|social media|activity|platform|twitter|Follow professional runners|0.1|
|social media|activity|platform|twitter|Post your mileage / running routes|0.06|
|social media|activity|platform|twitter|Post race photos and videos|0.18|
|social media|activity|platform|twitter|None of these|0.2|
|social media|activity|platform|instagram|fundraise for a charity event|0.01|
|social media|activity|platform|instagram|discuss running-related activities|0.01|
|social media|activity|platform|instagram|look for running motivation|0.01|
|social media|activity|platform|instagram|recruit others to join me at an upcoming race|0|
|social media|activity|platform|instagram|share your current training|0.01|
|social media|activity|platform|instagram|communicate with training partners|0.13|
|social media|activity|platform|instagram|recruit others to train with you|0|
|social media|activity|platform|instagram|post your race results|0.01|
|social media|activity|platform|instagram|follow events|0.01|
|social media|activity|platform|instagram|post general running photos and videos|0.08|
|social media|activity|platform|instagram|look for running training advice|0|
|social media|activity|platform|instagram|track friends / family in a race|0|
|social media|activity|platform|instagram|follow other runners (non-professional)|0|
|social media|activity|platform|instagram|Follow professional runners|0|
|social media|activity|platform|instagram|Post your mileage / running routes|0|
|social media|activity|platform|instagram|Post race photos and videos|0.01|
|social media|activity|platform|instagram|None of these|0.24|
|social media|activity|platform|pinterest|fundraise for a charity event|0.07|
|social media|activity|platform|pinterest|discuss running-related activities|0.07|
|social media|activity|platform|pinterest|look for running motivation|0.09|
|social media|activity|platform|pinterest|recruit others to join me at an upcoming race|0.11|
|social media|activity|platform|pinterest|share your current training|0.11|
|social media|activity|platform|pinterest|communicate with training partners|0.1|
|social media|activity|platform|pinterest|recruit others to train with you|0.13|
|social media|activity|platform|pinterest|post your race results|0.11|
|social media|activity|platform|pinterest|follow events|0.14|
|social media|activity|platform|pinterest|post general running photos and videos|0.13|
|social media|activity|platform|pinterest|look for running training advice|0.15|
|social media|activity|platform|pinterest|track friends / family in a race|0.15|
|social media|activity|platform|pinterest|follow other runners (non-professional)|0.17|
|social media|activity|platform|pinterest|Follow professional runners|0.16|
|social media|activity|platform|pinterest|Post your mileage / running routes|0.17|
|social media|activity|platform|pinterest|Post race photos and videos|0.15|
|social media|activity|platform|pinterest|None of these|0.12|
|technology|tracking|all|all|App on my phone|0.63|
|technology|tracking|all|all|hard copy log or journal|0.23|
|technology|tracking|all|all|computer software|0.15|
|technology|tracking|all|all|online software|0.14|
|technology|tracking|all|all|None, do not track at all|0.09|
|preferences|general|all|all|Run in a lower-cost, no frills, less swag race|0.55|
|preferences|general|all|all|Run in a higher-cost, fuller experience, more swag race|0.45|
|preferences|general|all|all|Run outside during harsher weather|0.57|
|preferences|general|all|all|Run inside during harsher weather|0.43|
|preferences|general|all|all|Only run as exercise|0.23|
|preferences|general|all|all|Supplement running with other exercise|0.77|
|preferences|general|all|all|Stretch|0.71|
|preferences|general|all|all|Not stretch|0.29|
|preferences|general|all|all|Run on trails|0.37|
|preferences|general|all|all|Run on the roads|0.64|
|preferences|general|all|all|Run with a watch or tracking device|0.93|
|preferences|general|all|all|Run without a watch or tracking device|0.07|
|preferences|general|all|all|Run with music|0.6|
|preferences|general|all|all|Run without music|0.4|
|preferences|general|all|all|Share your running with others on social media|0.35|
|preferences|general|all|all|Keep my running to myself and close friends|0.65|
|learning|general|all|all|Best places to run when on vacation|0.49|
|learning|general|all|all|Best places to run in your area|0.47|
|learning|general|all|all|How to avoid injuries|0.46|
|learning|general|all|all|How to cross train to supplement your running|0.42|
|learning|general|all|all|Easy ways to find races to partipicate in|0.38|
|learning|general|all|all|What to eat before a big race|0.35|
|learning|general|all|all|How to select the best running shoes|0.34|
|learning|general|all|all|What pace you should run when racing|0.31|
|learning|general|all|all|How to be safe when running|0.26|
|learning|general|all|all|How to run in inclement weather|0.2|
|learning|general|all|all|How to find a good running coach|0.14|
|learning|general|all|all|How to run at night|0.12|
|injuries|Past 12 months|all|all|blisters|0.29|
|injuries|Past 12 months|all|all|knee|0.22|
|injuries|Past 12 months|all|all|hips|0.14|
|injuries|Past 12 months|all|all|plantar fasciitis|0.14|
|injuries|Past 12 months|all|all|foot|0.13|
|injuries|Past 12 months|all|all|IT Band Syndrome|0.12|
|injuries|Past 12 months|all|all|Lower back|0.11|
|injuries|Past 12 months|all|all|shin splints|0.11|
|injuries|Past 12 months|all|all|hasmstring|0.1|
|injuries|Past 12 months|all|all|calf|0.09|
|injuries|Past 12 months|all|all|ankle|0.08|
|injuries|Past 12 months|all|all|achilles tendon|0.07|
|injuries|Past 12 months|all|all|stress fracture|0.03|
|injuries|Past 12 months|all|all|quadriceps|0.02|
|injuries|Past 12 months|all|all|None of these|0.23|
|injuries|how to deal with|all|all|take time off|0.66|
|injuries|how to deal with|all|all|take anti-inflammatory|0.58|
|injuries|how to deal with|all|all|stretch|0.57|
|injuries|how to deal with|all|all|ice|0.53|
|injuries|how to deal with|all|all|cross train|0.32|
|injuries|how to deal with|all|all|run through it|0.32|
|injuries|how to deal with|all|all|seek advice from other runners|0.29|
|injuries|how to deal with|all|all|seek advice online|0.27|
|injuries|how to deal with|all|all|see doctor|0.27|

As you can see **Gender** can be estimated by tracking the gender of the races that the visitor views.  For example if the visitor only views a number of women's races, we can assume that the user has a strong affinity for women's racing (through friendship, family, coaching, or themselves).  According to the Running USA 2012 Survey,  63% of runners in the adult running community are female.  Using this information, and the users trend of only looking a women's races, we can estimate that the person is most likely a woman, or has a strong affinity for women's running.

**Runner Type** can be estimated by looking at the types of race results that a visitor tends to view.  Do they prefer looking at championship races, or do they prefer looking at Tough Mudder results?  The Running USA survey divides runners into 4 groups:

*  Competitors - The people who enjoy running solely for the competition.  These are the people who want to get a personal record, beat their friends, win their age group or win the whole race.
*  Fun Runners - People who enjoy running, and do it purely for the enjoyment of the activity and the events
*  Fitness Participants - Runners who participate in races to stay fit and keep a healthy lifestyle
*  Outdoor Enthusiasts - People who enjoy being outdoors and do many outdoor activities, not just running


These runners can be identified by the types of runs that they participate in, and more importantly for us, the race results that they view.  IF a visitor only tends to look at championship events, college meets, or only tends to view the results at the top of the page (indicating they only looked at the winners), it likely that this person has an affinity for competitive racing.  On the other hand, if the runner only tends to look at less competition-focused events, like Color Me Rad, or Tough Mudder races, it is possible they are more interested in less competitive, fun races.  According to the Running USA Survey, the majority of runners tend to more strongly identify as competitive runners (56%) who run for fun (52%).  The fewest runners, 15% identify as outdoor enthusiasts.   So, if a person only tends to look at the  NCAA championships, World Championships, and Rock N Roll Half Marathon results, it is likely this person strongly prefers competitive racing.

**Preferred Event Types**  While the Running USA Survey has limited coverage of this dimension, this is a very simple dimension to identify without using other data sets.  For example, a visitor who only looks at a specific type of event can be identified as an enthusiast for that event.  For example, if a visitor only tends to look at sprinting events (races <= 400m), it is not likely that they will click on an ad for the Rock N Roll Half Marathon.

|Name|Events|
|--- |--- |
|Track & Field - Sprints|Distance <=400m|
|Track & Field - Mid-Distance|400m < distance <= 1600m|
|Distance|1600 < Distance >= 5k|
|Field Events|Distance >Pole Vault, Hammer Throw, etc|


**Team Affiliations/Interests**  Identifying what teams a user may be interested in can allow developers to recommend race results a user may be interested in based on the teams participating.   While this approach also does not involve external datasets, it is incredibly simple to implement and (if done responsibly) can yield very informative information to visitors.  This information can be found by  finding the teams that participate in the races viewed by a visitor.   If a user comes to the site and only looks at results for the Music City Challenge, the Tiger Paw Invitational, Penn Relays and the ACC Outdoor Championships, it is possible the visitor was looking at the Virginia Tech Hokies, as they attended 3/4 of those college track meets.   We can also learn that they tend to enjoy competitive racing. This technique can also be used in non-team races to narrow down who a visitor may be a fan of (or who they may be), although, depending of the size of the races, may require many more race examples to adequately narrow down the potential list of participants.

{% highlight python %}
def intersction(*sets):
    sets = [set(items) for items in sets]
    matches = set()
    [matches.union(items)for items in sets[1:]]
    for subset in sets:
        matches = matches.intersection(subset)
        if not matches:
            return matches
    return matches{% endhighlight %}

Although, it is very unlikely that ALL the races that a visitor views will have their team in them.  So we may want to use a softer, more forgiving approach by introducing an optional `threshold` argument:
{% highlight python %}
from collections import Counter

def intersection(*sets, **kwargs):
    threshold = kwargs.get('threshold', 1)
    sets = [set(subset) for subset in sets]
    set_count = len(sets)
    # create a set containing all potential matches
    items = set()
    [items.union(item_set)for item_set in sets]
    counts = Counter()
    proportions = dict()
    [counts.update(subset) for subset in sets]
    for key, occurrence_count in counts.items():
        if occurrence_count / set_count >= threshold:
            proportions[key] = occurrence_count / set_count
    return proportions{% endhighlight %}

{% include components/heading.html heading='Narrowing Down Attributes: Injuries' level=2 %}

The previous scenario allows us to predict a set of attributes about any visitor where every page allows us to learn about each attribute.  But many scenarios do not provide information on all potential attributes simultaneously.  we may only learn about a subset of attributes at a time.  In fact, in many cases we can't even predict the order in which we will learn information about an attribute.   These uncertainties can be resolved using conditional probabilities.  A perfect example of this is information regarding athletic injuries.  Obtaining accurate information regarding injuries can be difficult, as some athletes cannot provide all the details of their injury.  Fortunately we can use existing datasets to narrow down injury attributes. We will be using data from [publications](http://www.datalyscenter.org/publications/) from the [Datalys Center](http://www.datalyscenter.org/).

Let's say that a female cross country athlete provides us with pieces of information regarding an injury she received but is having trouble remembering the details, so we don't know they remember or when/if she will remember them.   As she is collegiate cross country runner, we can use the publication [Epidemiology of National Collegiate Athletic Association Men’s and Women’s Cross-Country Injuries, 2009–2010 Through 2013–2014](http://natajournals.org/doi/pdf/10.4085/1062-6050-51.1.10?code=nata-site) from the [Journal of Athletic Training](http://natajournals.org/).

The first detail is that **she injured her lower leg**.  We can cross-reference this information with the data extracted from the Datalys Journal:

|gender|part|percent of sample|rate per 1000 athlete exposures|time loss (%)|severe injuries (%)|
|--- |--- |--- |--- |--- |--- |
|female|head/face|0.008|0.04|0|0|
|female|neck|0.008|0.04|0|0|
|female|shoulder/clavicle|0|0|0|0|
|female|arm/elbow|0.004|0.02|0|0|
|female|hand/wrist|0.004|0.02|0|0|
|female|trunk|0.085|0.49|0.636|0.227|
|female|hip/groin|0.112|0.65|0.586|0.138|
|female|thigh|0.146|0.85|0.605|0.184|
|female|knee|0.123|0.72|0.688|0.031|
|female|lower leg|0.235|1.37|0.574|0.131|
|female|ankle|0.05|0.29|0.615|0|
|female|foot|0.154|0.9|0.525|0.225|
|female|other|0.073|0.43|0.579|0|
|female|total|1|5.83|0.588|0.131|
|male|head/face|0.009|0.04|0|0|
|male|neck|0|0|0|0|
|male|shoulder/clavicle|0|0|0|0|
|male|arm/elbow|0|0|0|0|
|male|hand/wrist|0|0|0|0|
|male|trunk|0.056|0.26|0.667|0.167|
|male|hip/groin|0.032|0.15|0.571|0.143|
|male|thigh|0.125|0.58|0.593|0.037|
|male|knee|0.107|0.5|0.609|0.087|
|male|lower leg|0.352|1.64|0.605|0.132|
|male|ankle|0.13|0.6|0.464|0|
|male|foot|0.157|0.73|0.765|0.059|
|male|other|0.032|0.15|0.429|0|
|male|total|1|4.66|0.611|0.083|


According to the study, 23.5% of injuries to female collegiate cross country athletes are lower leg injuries.  This calculation can be represented as `P(Lower Leg | Female and College XC ) = 0.235` meaning the probability of a lower leg injury given being female and a collegiate cross country runner.   According to this same study, 57% of female athletes with lower leg injuries were not able to compete for some length of time, but only 13%of lower leg injuries were serious injuries.

To take this a step further, of the 3 types of recorded injuries that occur to female cross country runners with lower leg injuries, inflammation is the most typical injury at 35% of injuries.  The other injuries are only slightly less likely, making no injury type significantly likely.

|gender|part|Injury|percent of sample|rate per 1000 athlete exposures|time loss (%)|severe injuries (%)|
|--- |--- |--- |--- |--- |--- |--- |
|female|thigh|strain|0.065|0.38|0.588|0.059|
|female|lower leg|inflammation|0.065|0.38|0.706|0.059|
|female|lower leg|tendinitis|0.062|0.36|0.688|0.063|
|female|lower leg|strain|0.058|0.34|0.467|0.067|
|female|foot|inflammation|0.058|0.34|0.667|0.2|
|female|thigh|inflammation|0.05|0.29|0.769|0.231|
|female|knee|inflammation|0.05|0.29|0.692|0.077|
|female|ankle|sprain|0.042|0.25|0.545|0|
|female|hip/groin|strain|0.039|0.22|0.6|0.1|
|female|respiratory|respiratory|0.035|0.2|0.444|0|
|male|ankle|sprain|0.111|0.52|0.458|0|
|male|lower leg|tendinitis|0.097|0.45|0.571|0.048|
|male|lower leg|inflammation|0.083|0.39|0.889|0|
|male|thigh|strain|0.069|0.32|0.667|0|
|male|lower leg|strain|0.069|0.32|0.6|0.133|
|male|foot|inflammation|0.046|0.22|1|0|
|male|knee|inflammation|0.032|0.15|0.714|0|
|male|hip/groin|strain|0.028|0.13|0.667|0.167|
|male|knee|tendinitis|0.028|0.13|0.5|0.167|
|male|lower leg|stress fracture|0.023|0.11|0|0.4|


At this point we have the following information:

*  A Female colliegiate athlete injured her lower leg, which is a fairly common injury
*  She will likely need to take/or has taken time off to recover
*  There is only a 13% chance that it is a severe injury


So we actually already know a fair amount of information.  She later recalls that <b>She thinks she got injured during a race</b>. Using high-level data on the [participation rate](https://www.ncaa.org/sites/default/files/Participation%20Rates%20Final.pdf) of female cross-country athletes in the NCAA across the Divisions, we can use this information to determine what the most likely division she is in using Baye's  theorem.

|category|division|gender|name|rate per 1000 athlete exposures|
|--- |--- |--- |--- |--- |
|injury rates|1|female|practice|6.52|
|injury rates|1|male|practice|5.7|
|injury rates|1|female|competition|9.5|
|injury rates|1|male|competition|3.41|
|injury rates|1|female|total|6.75|
|injury rates|1|male|total|5.53|
|injury rates|2|female|practice|1.96|
|injury rates|2|male|practice|1.62|
|injury rates|2|female|competition|6.41|
|injury rates|2|male|competition|2.82|
|injury rates|2|female|total|2.28|
|injury rates|2|male|total|1.71|
|injury rates|3|female|practice|6.13|
|injury rates|3|male|practice|5.14|
|injury rates|3|female|competition|5.77|
|injury rates|3|male|competition|5.77|
|injury rates|3|female|total|6.09|
|injury rates|3|male|total|5.21|
|injury rates|overall|female|practice|5.69|
|injury rates|overall|male|practice|4.7|
|injury rates|overall|female|competition|7.46|
|injury rates|overall|male|competition|4.22|
|injury rates|overall|female|total|5.85|
|injury rates|overall|male|total|4.66|


Baye's theorem allows us to still find probabilities, regardless of the order in which we receive information.  In order to get a probability for a value, we just need the probability of `a` and `b`, and the `conditional_probability` of `b given a` to find the conditional probability of`a given b`

{% highlight python %}
def bayes(conditional_probability, a, b):
    return (conditional_probability * a) / b

print 'P(Division 1 | competition and female and cross country) = %s' % bayes(0.0095, 0.37, 0.00746)  # P(Division 1 | competition) = 0.4711796246648794
print 'P(Division 2 | competition and female and cross country) = %s' % bayes(0.0641, 0.23, 0.076)  # P(Division 2 | competition) = 0.19762734584450403
print 'P(Division 3 | competition and female and cross country) = %s' % bayes(0.0577, 0.388, 0.076)  # P(Division 3 | competition) = 0.3001018766756033
{% endhighlight %}

Based on Baye's theorem, given that she was injured during competition, it is most likely that she competes for a Division 1 school or a Division 3 school (77%).

To be clear: I would never recommend using this as an actual method for making medical decisions.  Please leave that to the certified professionals.   I chose an example involving athletics because I enjoy the sport, not in order to advocate for using it.  While this method of inference can be applied to just about any field, there are some (like individual health-care) where some restraint should be taken before applying this method.  The above example is simply a demonstration of how these aggregate statistics can be used to infer knowledge in cases where uncertainty is very high.


{% include components/heading.html heading='Finding and selecting datasets' level=2 %}
Identifying reputable sources for data sets can be crucial for applying these techniques for narrowing down information.


*  [Pew Research](http://www.pewresearch.org/)
*  [Gallup](http://www.gallup.com)
*  [World Bank](http://www.data.worldbank.org/)
*  [Center for Disease Control](http://www.who.int/)
*  [Food and Agriculture of the United Nations](http://www.fao.org/faostat)
*  [World Health Organization (WHO)](https://www.cdc.gov/)
*  [Google Big Query](https://factfinder.census.gov">American FactFinder</a> or <a href="https://cloud.google.com/bigquery/public-data/us-census) for U.S. Census data
*  [NCAA Statistics](https://stats.ncaa.org/)
*  [Datalys](http://www.datalyscenter.org/)


The keys to a good dataset are this

*  Large datasets
*  Unbiased data
*  Population of data is directly relevant to what you are trying to predict

When you are finding datasets, be sure that the dataset is similar to the data you will be applying the produced statistics to.  For example, if you are collecting demographic data to be used on estimating demographics of new users in Virginia, using demographics statistics from Virginia in the 1970's or the state of North Carolina will most likely not provide very accurate estimations of Virginia users in the present day. Due to changes in job market, ease of travel, and immigration trends, Virginia does not have the same demographic as it did in the 1970s, so the predictions would reflect the demographics of the 1970s, not the demographics of the present day.

{% include components/heading.html heading='Conclusion' level=2 %}
Using Baye's Theorem for predictive purposes can be useful, especially when only aggregate statistics are available.  The areas of application for this technique are wide, but I would not recommend using it for making decisions where the risk of a wrong decision can have life-altering consequences (ex. cancer detection).  This technique is for use in cases where the cost of making a wrong decision can be recovered from.

I have applied this technique to internal business processes for my work, predicting characteristics of individuals based on demographic information, and for analyzing extensive running data (as demonstrated above).  I hope you find this technique as useful and as simple as I did.