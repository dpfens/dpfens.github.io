---
layout: post
title:  "High Level Analysis of Race Results"
description: Providing insights for spectators of races at scale
keywords: racing,running,track,python,pandas,insights
tags: running math python pandas

introduction: We have race results dating back for decades which all contain meticulously accurate race results.  Detailed analysis of races and comparisons of athletes and performances of these results may unlock more useful information.
---

{% include components/heading.html heading='Overview' level=2 %}

Coaches, athletes, and enthusiasts use race results to compare athletes, performances, and courses.  Using the right metrics can enable simple, quick comparisons and evaluations of race results at scale.  These metrics should enable viewers to:

*  Quickly identify the relative speed of a course, and compare the speed of a course to another of the same distance
*  Compare the spread of performances of a course and compare the spread of performances of another race on the same course, or a different course of the same distance
*  Obtain team scores and compare scores of teams across courses and races (if applicable)
*  Determine how far ahead/behind an athlete finished from another on the same course

{% include components/heading.html heading='Basic Analysis' level=2 %}

We will be using Pandas to analyze race data, but these changes can be done raw Python as well.  First, we'll clone our data from my [Github Repository](https://github.com/dpfens/ncaa_xc_races).

{% highlight bash %}
git clone https://github.com/dpfens/ncaa_xc_races.git
cd ncaa_xc_races
{% endhighlight %}

Then we will load in on our data and create `pandas.DataFrame` instances.

{% highlight python %}
import pandas as pd
import json

with open('accchampionshipsmenresults.json', 'rb') as input_file:
    data = json.load(input_file)

athletes = data['athletes']

# restructuring splits as columns in Dataframe
for index, athlete in enumerate(athletes):
    for split in athlete['splits']:
        athletes[index]['%sm' % split['distance']] = split['seconds']
    athletes[index].pop('splits', None)
    athletes[index]['final_time'] = athlete['seconds']
    athletes[index].pop('seconds')
    athletes[index]['human_readable_time'] = athlete['time']
    athletes[index].pop('time')

athlete_df = pd.DataFrame(athletes)
{% endhighlight %}

Now that we have preprocessed and loaded our data, we can get to actually processing the data.  We will start with some simple aggregate measures, such as mean, median, and standard deviation:

{% highlight python %}
athlete_df.mean()
"""
2000m         6.584473
5000m        33.603705
final_time    189.561995
dtype: float64"""

athlete_df.median()
"""
2000m           362.1
5000m           943.3
final_time    1496.8
dtype: float64
"""

athlete_df.std()
"""
2000m            6.584473
5000m           33.603705
final_time    189.561995
dtype: float64
"""
{% endhighlight %}

These simple calculations number give a surprising amount of information about the race itself.  We now know the average time that the runners passed through the 2000m, 5000m, and finish line (8000m), and the dispersion of those times.  The median tells us if there were any performances which skewed the data at each split and in the last leg of the race.

According to these results, the mean values are being heavily skewed by low values, as no race can reasonably have mean 2000m and 5000m splits of 6.5 and 33.6 seconds.  This may be due to some runners not completing the race, so we will see if there were any DNF's and remove them if they exist


{% highlight python %}
{% raw %}
# check for any DNF performances
athlete_df[athlete_df['human_readable_time'] == 'DNF']
      2000   5000                    affiliation age gender          name  \
137  364.2    NaN  Florida State UniversityState  SO   Male  Grant Nykaza   
138  364.4  956.9                Duke University  FR   Male  Josiah Hanko

    place  final_time human_readable_time  
137    --         0.0                 DNF  
138    --         0.0                 DNF

# remove DNF performances
finisher_df = athlete_df[athlete_df['human_readable_time'] != 'DNF']
{% endraw %}
{% endhighlight %}

<div class="flourish-embed" data-src="visualisation/96287"></div><script src="https://public.flourish.studio/resources/embed.js"></script>

The race had 2 DNF performances, which we removed.  Let's check the mean, median, and standard deviation again to see how they affected our results:

{% highlight python %}
finisher_df.mean()
"""
2000m           363.509489
5000m           942.774265
place           69.000000
final_time    1503.321898
dtype: float64
"""

finisher_df.median()
"""
2000m           361.70
5000m           943.25
place           69.00
final_time    1497.00
dtype: float64
"""

finisher_df.std()
"""
2000m           6.632018
5000m          33.706175
place         39.692569
final_time    60.872295
dtype: float64
"""
{% endhighlight %}

There was some skewing of the data, but it looks like now that we've removed the DNF performances, our mean values align more with our data, and our standard deviation is significantly smaller.  We can use the `quantile` method to fetch the quantiles at 0.25 and 0.75, to learn more about the distributions of the data

{% highlight python %}
finisher_df.quantile(0.75)
"""
2000m           368.200
5000m           965.075
final_time    1541.500
Name: 0.75, dtype: float64
"""

finisher_df.quantile(0.5)
"""
2000m           361.70
5000m           943.25
final_time    1497.00
Name: 0.5, dtype: float64
"""

finisher_df.quantile(0.25)
"""
2000m           357.800
5000m           917.425
final_time    1460.600
Name: 0.25, dtype: float64
"""
{% endhighlight %}

It appears that the distance between the 25th and the 50th quartile is much smaller than from the 50th quartile to the 75th quartile.  This means that this race had a long tail (which is pretty normal for a race), meaning that the slower performances were much further from the average performance than the best performance was.

Let's get the splits from 2000m to 5000m, and from 500m to 8000m

{% highlight python %}
# 2000m to 5000m
print finisher_df['5000m'] - finisher_df['2000m']
print finisher_df['final_time'] - finisher_df['5000m']
{% endhighlight %}

We can see that the top finishers of the race had fairly even splits, and in some cases, negative splits.  It seems that the slower runners generally tended to run positive splits (with a few exceptions).  In general, we could say that [negative/even splitting](https://en.wikipedia.org/wiki/Negative_split) is generally associated with better performances on this course.

{% include components/heading.html heading='Team Analysis' level=2 %}

Let's start with a basic analysis of each team:

{% highlight python %}
team_summary = finisher_df.groupby('affiliation').describe()
print team_summary

{% endhighlight %}

These basic calculations allow us to learn the average time, spread, and the skew for each team.  These calculations also allow us to compare teams by each metric.  But the most important metric is the team score:

{% highlight python %}
def score(df, places=5):
    return df.iloc[:places]['place'].sum()

team_scores = finisher_df.groupby('affiliation').agg(score)
print team_scores
{% endhighlight %}

Now that we can calculate team scores, we can move on to comparing teams.  What are some of the things we would want to compare about teams?

*  Average time of the top $$n$$ runners
*  Spread of top $$n$$ runners
*  Fastest runner performances
*  Compare the top $$n$$ runners to see which team is favored to win

Let's start by comparing the average time, standard deviations (spread), and variance of the top runners

{% highlight python %}
teams = finisher_df.groupby('affiliation')
teams.agg['mean', 'std', 'var'])
{% endhighlight %}

This tells us that the team winner of the meet had the lowest average time (23:47.22) as well as the smallest standard deviation (8.15 seconds)

{% include components/heading.html heading='Athletes' level=2 %}

Today, competitive runners expect access to meet results, but desire insights about competitors and their own performance based on those results.  These runners would like to compare their performance to their competitors who participated in another event that weekend, without having to remember the math to do it.  They want to compare results from races without having to bring a calculator. They want to know which races each weekend were significant, without having to look at the individual results from the hundreds of meets that occurred.  Runners have moved from wanting raw data to wanting the derived information from that data, from finding insights themselves to having them delivered directly to them.  Fortunately, race results typically do not change after the meet is over, so these measures can be calculated at upload time and then stored in the database to save money on cloud services.  While some of these measures can be more difficult to implement, cost-efficient ways exist to calculate them.

Median/average times can be used to provide runners with a simple way to compare any set of races.  By providing both median and average times, users can determine if the race results were skewed by unusually fast top finishers, or if the rest of pack ran slower than usual.  In combination with standard deviation and variance, developers can even quantify the spread of the runners over time and run outlier detection to determine which performances were notable.

Users comparing athletes tend to have a specific question in mind when doing their comparisons  They may be a fan of an athlete, or they may be one of these athletes attempting to determine who their competition will be at a given race.  Either way, these users have a specific reason for comparing them:

*  Who would win a race between them at a given distance?
*  Who is better?
*  Who are the main competitors of these athletes?

As all runners know, these are not simple questions to answer, as their are many variables that can play into a race: the conditions of the actual race, the weather, health conditions, taper time between races, and most of all, time since their last performance.  Predicting race outcomes can be difficult due to the low sampling frequency of athletics, random events that can occur leading up to the predicted race, variables during the race, and the non-deterministic nature of running.  However, instead of trying to find a deterministic solution to all of these problems, we can take each of these questions in turn to come up with a fairly accurate solutions.

We will start with the first question:  Who would win a race between the compared athletes?  We want to be able to compare a variable number of athletes to predict the outcome of a race between at a given distance.  We can use a conversion model such as the Riegel or Cameron models to convert the latest performances to the given distance, or use their latest performance in the case where it is the same as the given distance.  The Riegel model can be defined as

$$  \tag{Eq. 2} R(distance_1, time_1, distance_2) = time_1 * \frac{distance_2}{distance_1}^{1.06} $$

In the following equations $$ N $$ is the number of athletes, $$ D $$ is the set of distances, and $$ P $$ is a 3-d matrix of athlete $$ i $$ performances for $$ j $$ distance and $$ Distance_{target} $$ is the distance to rank the athletes in.  First, we build a matrix of Personal records $$ Pr $$ for athlete $$ i $$ at distance $$  D_i$$ 

$$ \tag{Eq. 3} Pr_{ij} = min(P_{ij}),  \{ j \in D \},  \{ i < N \} $$

Then we create a matrix $$ T $$ of personal records converted to distance $$ Distance_{target} $$

$$ \tag{Eq. 4} T_{ij} =  R(D_j, Pr_{ij}, Distance_{target}), \{ j \in D \}, \{ i < N \} $$

Then we find the lowest converted time for each athlete $$ i $$

$$ \tag{Eq. 5} C_i = min(T_i), \{ i < N \} $$

Then we have an array $$ C $$  of the $$ N $$ athletes ranked by their projected finish times, which allows us to compare a variable number of athletes for a distance $$ Distance_{target} $$

Second question:  How do these athletes stack up against each other overall?  We can interpret this question a couple of different ways.  We can assume that the user wants to compare the athletes' careers, or we can assume that the runner wants to rank the athletes based on how they would perform in all events.  We will start with the first and simpler of the two interpretations. We can actually re-use $$ Eq. 3 $$ to get the personal records of all the compared athletes.  However, these are not normalized.  We can then use the world records $$ D_{records} $$ for each distance to normalize the times into a number between 0 and 1

$$ \tag{Eq. 6} Pr_{normalized ij} = \frac {D_{records j}} {P_{ij}}  \{ j < D \}  \{ i < N  \} $$

The normalized personal records for each athlete in the $$ Pr_{normalized} $$ matrix can then be averaged together to provide a score between 0 and 1 for each athlete.  These scores can then be used to rank the careers of the athletes based on their personal records.  To score athletes based on all times from all events, we would normalize all the times in the matrix $$ P $$ of all times for all athletes.

Lastly: Who are the main competitors of these athletes?  This question is usually asked in the context on an athletic conference, a geographic area, or a championship meet, such as the Olympic Games.  This question can be answered by taking all eligible athletes in the context (conference, region/country/etc, championship athletes), and identifying athletes who have similar performances than them in their competition events.

Some cross country and road race courses are faster than others, which makes it difficult to compare performances that occurred on different courses at face value.   By determining the difference in average times between the courses, developers should be able to compare the performances between the courses.

{% include components/heading.html heading='Performances' level=2 %}

Now that we have covered basic analysis of race results and team results for a race, we can move into analysis beyond a single race.  Before we get started, we will need to preprocess and load  data for all NCAA Cross Country Championship meets through Fall 2009 into a DataFrame.

{% highlight python %}
with open('NCAA_D1_XC_Meets.json', 'rb') as input_file:
    ncaa_data = json.load(input_file)

# preprocess race performances so all necessary data will be a column
performances = []
for ncaa_meet in ncaa_data:
    meet_name = ncaa_meet['name']
    for ncaa_race in ncaa_meet['races']:
        meet = ncaa_race['name']
        date = ncaa_race['date']
        distance = ncaa_race['distance']
        for athlete in ncaa_race['athletes']:
            athlete['meet'] = meet
            athlete['date'] = date
            athlete['distance'] = distance
            performances.append(athlete)

ncaa_performances = pd.DataFrame(performances)
{% endhighlight %}

When using data from only one race, we cannot compare athletes beyond the difference in placement and difference in times.  

{% highlight python %}
athlete_performances = ncaa_performances.groupby(['affiliation', 'name', 'distance']).sortby('date')
athlete_means  = athlete_performances['final_time'].mean()
athlete_standard_deviation = athlete_performances['final_time'].mean()
athlete_covariance = athlete_performances['final_time'].cov()
{% endhighlight %}

Now that we have multiple races, we can compare athletes progress over the course of their running career.  We will using Pandas window functions to analyze athlete's progressions through each of the distances that they race in.  We will can compare rolling averages:

{% highlight python %}
window = 2
windowed_performances = athlete_performance.rolling(window, center=True)
windowed_standard_deviation = windowed_performances['final_time'].std()
windowed_covariance = windowed_performances['final_time'].cov()
windowed_percent_change = windowed_performances['final_time'].pct_change()
{% endhighlight %}

As athletes get faster in one distance they tend to get faster in other distances of the same type.  But is there a way to track this improvement across events?  We can do this by calculating the correlation between distances of an athlete

{% highlight python %}
athlete_performances = ncaa_performances.groupby(['affiliation', 'name']).sortby('date')

distance_correlations = athlete_performances.reset_index().groupby('distance').corr()
{% endhighlight %}

{% include components/heading.html heading='Time Series Analysis' level=2 %}

All athletes past performances can provide insights about the runner and their future performances.  If an athlete continues to get personal records by significant amounts, one can infer that their performances will likely continue to improve. If their performances are getting worse, then we can infer that their performances will continue to diminish.  For example, if a runner drops a minute off of her PR in a distance running event, we can expect her performances in other distance events to improve as well.  If her future performances don't improve, or get worse, it's possible that her PR was an anomaly or that her performances tend to fluctuate.  These trends can be significant when predicting how runners will perform in future races.

A simple way to get started with time series analysis is to perform time series analysis over recurring meets.  Championship series races are reliable recurring meets such as NCAA Championships, Pan-American Games, IAAF World Championships, Olympic Games, etc.

<div class="flourish-embed" data-src="visualisation/96351"></div><script src="https://public.flourish.studio/resources/embed.js"></script>

A more intermediate way to analyze athlete performances over time would be using the <a href="https://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average">exponential moving average (EMA)</a>.  The exponential moving average applies more weight to performances the closer they are to the present, which holds true with more recent performances tend to be more indicative of future performances than older ones.

{% highlight python %}
def exponential_moving_average(iterable, **kwargs):
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

person_1 = [874.0200, 907.0900, 874.9600, 912.2200, 911.9300, 884.2800, 870.9400, 932.1200, 869.9600, 871.0600, 898.6500, 992.0200,1024.460]
person_2 = [839.0300, 1018.9300, 1017.3000, 1007.3900, 977.0200, 838.7500, 928.0200, 1003.5700, 852.5600, 953.1000]
print exponential_moving_average(person_1, alpha=1.0) # 874.02
print exponential_moving_average(person_2, alpha=1.0) # 879.03

print exponential_moving_average(person_1, 0.5)  # 886.390279575
print exponential_moving_average(person_2, 0.5)  # 922.676539589

print exponential_moving_average(person_1, 0.8)  # 879.637343529
print exponential_moving_average(person_2, 0.8)  # 874.779018791
{% endhighlight %}

Above we apply exponential moving average to the 5k times of a college athlete.  `alpha` is the degree of weight decrease over time, must be between 0 and 1.  As you may have noticed, as `alpha` gets closer to 0, the average performance increases, based on the higher weights applied to earlier performances.  While `person_1` as a higher weighted average with an `alpha &gt; 0.75`, when `alpha &le; 0.75` `person_2` has a higher time.  By using metric that accounts for the recency of performances, we can gather more informed information regarding the trends of an athlete's performances over time.

Another form of trend analysis would be fitting a line to the time series of performances of an athlete.  `numpy.linalg` contains a `lstsq` function which allows us to estimate the equation based on least square error

{% highlight python %}
import numpy as np
A = np.vstack([range(len(person_1)), np.ones(len(person_1))]).T
print np.linalg.lstsq(A, person_1)[0] # [  6.93664835 867.89626374]

A = np.vstack([range(len(person_2)), np.ones(len(person_2))]).T
print  np.linalg.lstsq(A, person_2)[0] # [ -3.53327273 959.46672727]
{% endhighlight %}

If the linear equation does not fit the series of performances very well, they may also try `numpy.polyfit` to attempt to fit their performances to a polynomial curve:

{% highlight python %}
import numpy as np
for i in range(3):
    print np.polyfit(range(len(person_2)), person_2, i)
    print np.polyfit(range(len(person_2)), person_2, i)

{% endhighlight %}

How closely the data can be fitted can determine how closely the athlete's performances follow a trend.  This technique can be applied to finding the strengths/weaknesses of teammates or finding the strengths/weaknesses of rival athletes.   These coefficients can also be used as a metric for determining the rates of improvement of athletes based on their sequential performances, and for clustering those athletes based on their rates of improvement (or lack thereof)

{% include components/heading.html heading='Machine Learning' level=2 %}

For large amounts of race data, a more scaleable approach machine learning approach may be be required.  Machine learning can allow developers to train a model against their dataset and then use the trained model to make predictions for data that the model has not been trained on. We classified some running logs in <a href="https://dougfenstermacher.com/blog/reusable-machine-learning-python">Writing Machine Learning Models for Track & Field</a> as an introductory example on how to write machine learning classifiers with scikit-learn.

The most important part of training a model is preprocessing data.  Developers must translate their data into a numerical format so their chosen machine learning model interpret the data to make inferences from.  For example, category names in a text format must be changed to numerical labels, as machine learning models do not understand text.  Some machine learning models are sensitive to the range of continuous data, so it must be scaled so the data ranges between 0 and 1. scikit-learn provides classes for making all the aforementioned transformations so it should meet all our needs for these examples.

{% highlight python %}
import pandas as pd
from sklearn.svm import OneClassSVM
from sklearn.model_selection import train_test_split

df = pd.read_csv('track_field.csv')

# clean data of all times that are DNS (0) or DNF (999999) using my dataset
df = df[0 < df['time']< 999999]

data = data.values.tolist()

training_data, test_data = train_test_split(data, test_size=0.5)

# define and train our model based on training data
clf = OneClassSVM()
clf.fit(training_data)

# make predictions on our test_data that the model has not seen before
predictions = clf.predict(test_data)
# create separate arrays of normal performances and anomalies
normal = test_data[predictions == 1]
anomalies = test_data[predictions == -1]

print 'Normal: %r' % normal
print 'Normal Data Points: %r' % len(normal)

print 'Anomalies: %s' % anomalies
print 'Anomalous Data Points: %r' %  len(anomalies)
{% endhighlight %}

We just constructed a simple anomaly detector model trained on half of all our performances.  There are multiple types of anomaly detection.  The  
 `OneClassSVM` performed novelty detection, which is defined by scikit-learn as:

> The training data is not polluted by outliers, and we are interested in detecting anomalies in new observations.

Based on this definition, `OneClassSVM` was a poor choice of detector for creating a general purpose model.  Since we fit the detector on most of our data the only performances that are different "novel" compared to the rest of our data (such as times faster than world records) will appear to be anomalies.  So this model does have some applicable uses but it could be more useful.  `OneClassSVM` would be would be very useful if trained on performances for an individual athlete.  This way any times that are considerably different from their existing performances would be identified as an anomaly.

Now, back to a general purpose anomaly detector.  The other type of anomaly detection is outlier detection.  Once again, scikit-learn provides a simple explanation

> The training data contains outliers, and we need to fit the central mode of the training data, ignoring the deviant observations.

This type of anomaly detection identifies performances that are outside the distribution of of performances that it was trained on.  We can use the `sklearn.covariance.EllipticEnvelope` model for training our data.  

{% highlight python %}
import pandas as pd
from sklearn.covariance import EllipticEnvelope
from sklearn.model_selection import train_test_split

df = pd.read_csv('track_field.csv')

# clean data of all times that are DNS (0) or DNF (999999) using my dataset
df = df[0 < df['time']< 999999]

data = data.values.tolist()

training_data, test_data = train_test_split(data, test_size=0.5)

# define and train our model based on training data
clf = OneClassSVM()
clf.fit(training_data)

# make predictions on our test_data that the model has not seen before
predictions = clf.predict(test_data)

# create separate arrays of normal performances and anomalies
non_anomalies = test_data[predictions == 1]
anomalies = test_data[predictions == -1]

print 'Normal: %r' % non_anomalies
print 'Normal Data Points: %r' % len(non_anomalies)

print 'Anomalies: %s' % anomalies
print 'Anomalous Data Points: %r' %  len(anomalies)
{% endhighlight %}

As you can see above and in my <a href="https://dougfenstermacher.com/blog/reusable-machine-learning-python">intro to machine learning in sports</a> post, scikit-learn library offers a simple, effective starting point for deploying machine learning models that can provide useful information to runners and developers.  While other libraries such as MXNet and Tensorflow provide methods for creating more advanced machine learning models, they require a more intimate knowledge of machine learning and the math behind them so we will save those for another post.

These comparisons and metrics are the end goal of race results websites.  Competitive athletes want to know if they or their team is better than their competitors and by how much.  Coaches want to know how their athletes performed at each stage of the race.  Recreational athletes want to know if they improved, and by how much.  And spectators want to know which athletes to watch for, and who will be competitive in the next big race.  These can all be calculated using basic math and statistics.  So why aren't race result website providing these insights?  They already have the data, a platform to calculate them on, and the audience that wants it.  As the data is likely stored in a SQL or NoSQL database, developers can make perform many of these calculations in the database, or make the calculation at upload time and store it in the database, making the process of delivering these insights even easier.  So the big question I have is, why aren't these websites providing this simple service?
