---
layout: post
title: "FitnessJS"
description: A Typescript library for physical fitness calculations
keywords: exercise, cardio, weightlifting, body composition
tags: data math forecasting

introduction: FitnessJS started as a command-line utility to estimate running performances in college based on previous performances.  It became a general purpose library for building running-related applications to a general exercise physiology library
---

{% include components/heading.html heading='Origin' level=2 %}

FitnessJS started as a simple command-line utility to estimate running performances in college based on previous performances.  I wanted to know what my competitors could run for a 5k based on their latest personal record in the 8k.  Originally, it was a simple C program that simply distance running predictions using only 2 models.   In fact, this was the original code:
{% highlight c linenos %}{% raw %}#include <stdio.h>;
#include <math.h>;

#define MILEMETERS 1609.34

/*
	Riegel Running Model
	t1 = time
	d1 = old distance
	d2 = new distance
	d1 & d2 must be in the same unit
	return time in same unit as t1
*/
double riegel(double t1, double d1, double d2) {
        if(t1 <= 0 && d1 > 0 <= d2 <= 0) {
                return 0;
        }
        return t1 * pow( (d2/d1), 1.06 );
}

/*
	Cameron Running Model
	t1 = time in seconds
	d1 = distance in miles
	d2 = distance in miles
*/
double cameron(double t1, double d1, double d2) {
	double a = 13.49681 - 0.048865*d1 + 2.438936/pow(d1,0.7905);
	double b = 13.49681 - 0.048865*d2 + 2.438936/pow(d2,0.7905);
	return (t1/d1) * (a/b) * d2;
}

int main(int argc, char *argv[]) {
	double t1, d1, d2, riegelResult, cameronResult;

	if(argc != 4) {
		printf("This function takes three arguments:\n");
		printf("time1 (seconds), distance1 (meters), distance2(meters)");
		return 1;
	}
	sscanf(argv[1],"%lf",&t1);
	sscanf(argv[2],"%lf",&d1);
	sscanf(argv[3],"%lf",&d2);
	riegelResult = riegel(t1, d1, d2);
    cameronResult = cameron(t1, d1 / MILEMETERS, d2 / MILEMETERS);
	printf("Riegel: %f\n", riegelResult);
    printf("Cameron: %f\n", cameronResult);
	return 0;
}{% endraw %}{% endhighlight %}

As I progressed through college I was introduced to more broad health and fitness indicators with applications outside of track and field.  With over 30 calculations at the time, I decided to rewrite my simple program so that I would not have to remember all of the formulas, input units and output units we had in my classes and so I could build more interesting programs with these formulas and models.
At the time, NodeJS had just been released and Javascript was starting to become a language for both back-end and front-end programming (and I thought I might be able save money on hosting if I wrote front-end applications), so I chose Javascript as the language for version 1.0 of my FitnessJS library.

As time has passed, the FitnessJS project has grown both in purpose and in implementation. 
 This small project has expanded to include a sibling project for large-scale Python data analysis called <a href="">PyFit</a>.  The goal for FitnessJS (and PyFit) are to be the premiere open source libraries for creating fitness-based applications.

 {% include components/heading.html heading='Cardiovascular' level=2 %}

 The first and largest namespace in the library is the cardiovascular namespace.  The namespace contains estimators and formulas for determining heart rate, VO<sub>2 Max</sub>, and residual volumes, energy expenditure   The cardiovascular namespace contains 3 subspaces:


* Cardiac - Heart rate from age, age from heart rate, mean arterial pressure (MAP)
* Energy - Basal Metabolic Rate (BMR), Resting Metabolic Rate (RMR), Total Energy Expenditure (TEE)
* Respiration - Residual volume, VO<sub>2 Reserve</sub>, VO<sub>2 Max</sub>


{% include components/heading.html heading='Cardiac' level=3 %}
The Cardiac namespace contains 12 classes which can be used to estimate maximum heart rate rate from age, and to estimate age from maximum heart rate.  These class all use the same interface:

* predict - predicts maximum heart rate
* age - predicts age in years from maximum heart rate


Other methods in the namespace are the following functions:

* mean_arterial_pressure - used to calculate overall blood flow, and therefore nutrient delivery to organs
* Karvonen - Used to calculate exercise heart rate for a given training intensity (as a percentage)
* Zoladz - calculate heart rate zones based on maximum heart rate


{% include components/heading.html heading='Energy' level=3 %}

* Basal Metabolic Rate (BMR) - kilocalories needed to keep critical processes going while at rest.  BMR is usually measured under strict conditions: in a darkened room after waking up from 8 hours of sleep in the testing facility, and fasting for 12 hours.
* Resting Metabolic Rate (RMR) - kilocalories needed to keep critical processes going while at rest
* Resting Daily Energy Expenditure
* Total Energy Expenditure (TEE) - kilocalories needed to perform vital processes, and carry out physical functions
* Terrain - calculating energy expenditure of a traveler across a terrain at a given walking speed


{% include components/heading.html heading='Respiration' level=3 %}
Calculations for predicting residual volume, and VO<sub>2</sub>.  Residual volume can be used

{% include components/heading.html heading='Applications' level=3 %}
Within in the Cardio subnamespace, developers can predict the maximum heart for demographics based on age.  This can be used to identify the exertion of exercisers based on the percentage of their maximum heart rate they are exerting.  The maximum heart rate can then be used to calculate training zones for exercises regimens.
The energy subnamespace provides methods for calculating the amount of energy than people need to sustain their body, both for critical systems and for sustaining levels of physical activity.  The amount of energy can be used in nutrition systems to estimate if individuals caloric intake meets the essential needs of their bodies.  Adequate caloric intake is especially important for young athletes  for adequate recovery and long-term physical growth, and competitive athletes for increasing recovery times and sustaining a high level of training.

{% include components/heading.html heading='Composition' level=2 %}

Provides methods for predicting body composition and and formulas for evaluating results of body composition tests.

* Density - Provides methods for evaluating skinfold measures
* Fat - Provides methods for calculating body fat percentages
* Hydration - Estimate daily water intake in Liters per day
* Ideal - estimate ideal body weight, waist circumference
* Index - estimate body composition indices
* Mass - estimate fat-free mass
* Stature - estimate stature
* Surface Area - estimate surface area of an individual


Search trends on Google for weight loss and exercise are strongly correlated together, indicating a link between these two aspects.  This correlation indicated a need for a fitness library to address body weight and body composition calculations

<script type="text/javascript" src="https://ssl.gstatic.com/trends_nrtr/1435_RC10/embed_loader.js"></script> <script type="text/javascript"> trends.embed.renderExploreWidget("TIMESERIES", {"comparisonItem":[{"keyword":"/m/023s6n","geo":"US","time":"today 12-m"},{"keyword":"/m/019w6h","geo":"US","time":"today 12-m"}],"category":44,"property":""}, {"exploreQuery":"cat=44&geo=US&q=%2Fm%2F023s6n,%2Fm%2F019w6h&date=today 12-m,today 12-m","guestPath":"https://trends.google.com:443/trends/embed/"}); </script> 

{% include components/heading.html heading='Applications' level=3 %}
The most applicable namespaces are fat, hydration, ideal, and mass.  While the others have clinical significance, they do not tend to be as commonly useful.

When starting training for an individual, or when starting to analyze a population, the data is not the most detailed or informative.  Commonly, you request the basic information from the individual/users before you start collecting more detailed information.  The composition namespace helps developers to make general inferences about individuals, so they can identify the most effective for learning more about them.  For example, let's say I registered for an account on a fitness site where I gave the following information:

|Field|Value|
|--- |--- |
|Name|Doug Fenstermacher|
|Date of Birth|March 17th, 1990|
|Height|5'10"|
|Weight|145lb|
|5k personal record (running)|15:23|

The developer for that website can infer immediately that I am a young adult male of average height, and of relatively low weight compared to the rest of the U.S. population, and that at some point, I could run a fairly fast 5k.  Now, let's say they are using the composition namespace in the FitnessJS library:

* Based on the `adultBMI`` method, I am roughly 1.4% body fat
* Based on the `Ideal`` class, my naive ideal weight is 156lb, making me 16lb under ideal weight (which would not be uncommon for a runner with a 15:23 personal record)
* Based on the `Ideal`` class, my naive ideal waistline is 32" inches
* Based on the `SurfaceArea`` class, my surface area is 1.47m<sup>2</sup>
* I need to drink 2 Liters of water per day
* My stride length is estimated to be 73 centimeters


The developer could take next steps by prompting me to provide information regarding my current activity level, my current water intake, my waistline, and what my time was for my last race.  This way, the developer could learn if my water intake is adequate (from my current water intake), how far off my running performances are from my past peak running ability (based on my latest race results), and determine if the calculated BMI and body fat percentage is an accurate reflection of my current body composition.  Then the developer will have a fairly comprehensive view of the latest user, and be able provide recommendations based on an accurate view of the user.

 {% include components/heading.html heading='Models' level=2 %}

 The models namespace contains measures and predictors that were built using statistical analysis.  Currently the models are all under the aerobic subnamespace.  These models are the following:

* Riegel
* Cameron
* Vickers-Vertosick


{% include components/heading.html heading='Riegel' level=3 %}
The Riegel model has been expanded since my first implementation.  The current implementation allows users to optionally use a more specific factor for predicting performances based on gender, age group, and sport based on Peter Riegel's publication <a href="http://www.runscore.com/coursemeasurement/Articles/ARHE.pdf">Athletics Records and Human Endurance</a> published in <a href="">American Scientist</a> in 1981.   Riegel's model is accurate for performances between 3.5 minutes and 230 minutes.

{% include components/heading.html heading='Cameron' level=3 %}
The Cameron model hasn't changes since the first implementation.  The model performs well for races between 400m and 50 miles.  Dave Cameron came up with this model by taking some of the top times in the world for distances between 400m and 50 miles and using non-linear regression to fit a function.  You can read his email exchange provided by<a href="http://www.cs.uml.edu/~phoffman/cammod.html">UMass Lowell</a>

{% include components/heading.html heading='Vickers-Vertosick' level=3 %}
A new, experimental addition to the library.  This model focuses on recreational runners and uses average weekly mileage and previous race time to predict performances in the marathon.

{% include components/heading.html heading='Applications' level=3 %}
The Riegel and Cameron model were the original models I used in college to predict race performances.  These models continue to be the most common models used to predict athletic performances.  I used the Riegel and Cameron performance models for predicting my own performances in events and for predicting those of my teammates and competitors.  Regardless of whether either of us had competed in the event before these models enabled me to compare how I might fare against competitors, or my teammates.
Other uses of these formulas may be to predict how far a person ran if only the duration of their run is known.  If comparing a large number of athletes across distances, the models can be used to normalize endurance performances so that the runners can be seeded/ranked.

{% highlight javascript%}{% raw %}var performances = [
    {
        name: "Doug Funny",
        distance: 800, // meters
        time: 121.2 // seconds (2:01.2)
    },
    {
        name: "Skeeter Valentine",
        distance: 3200, // meters
        time: 528.3 // seconds (8:48.3)
    }
],
comparisonDistance = 1600; // meters

for(var i=0; i < performances.length;i++) {
    var performance = performances[i],
        model = new Fit.model.aerobic.Riegel(performance.distance, performance.time);
        console.log('predicted time for ' + performance.name + ' in the ' + comparisonDistance + 'm:', model.time(comparisonDistance));
}
// predicted time for Doug Funny in the 1600m: 252.69370042788785
// predicted time for Skeeter Valentine in the 1600m: 253.38961711976856
{% endraw %}{% endhighlight %}

According these calculations, Skeeter will lose to Doug in a 1600m race, but it will be a close race.

{% include components/heading.html heading='Sport' level=2 %}

Sport is for sport-specific calculations.  Currently, the namespace includes a single running namespace, which contains 4 namespaces within it:

* Adjustment - adjusting performances based on temperature
* Jack Daniels - uses Jack Daniel's formulas for calculating VO<sub>2 Max</sub>, velocity, pacing zones for training, and more
* Pace - Calculating pace and speed of a run


{% include components/heading.html heading='Applications' level=3 %}
The running module has calculations that are uniquely useful for coaches and running enthusiasts.  The jackdaniels namespace contains functions for calculating paces based on training zones for workouts, and for calculating the percent of VO2 a person is working at based on how long they have been running.
Performances can also be adjusted for temperature changes.  Although, the temperature can only be adjusted at 5 degree intervals.


{% include components/heading.html heading='Strength' level=2 %}

The strength namespace focuses on weightlifting exercises and vertical jump measurement.  This namespace has functions for comparing weightlifting performances across demographics, predicting 1 repetition maximums, and for estimating the amount of power in a vertical jump.  The most commonly used functionality is the RM calculations.  While running is my sport of choice, across the world weight training is currentyl the most popular method of exercise, making stable RM estimator calculations all the more essential to creating low-risk training programs

<script type="text/javascript" src="https://ssl.gstatic.com/trends_nrtr/1435_RC10/embed_loader.js"></script> <script type="text/javascript"> trends.embed.renderExploreWidget("TIMESERIES", {"comparisonItem":[{"keyword":"/m/0c4f_","geo":"","time":"today 12-m"},{"keyword":"/m/06h7j","geo":"","time":"today 12-m"},{"keyword":"/m/06z6r","geo":"","time":"today 12-m"},{"keyword":"/m/01sgl","geo":"","time":"today 12-m"}],"category":44,"property":""}, {"exploreQuery":"cat=44&date=today%2012-m,today%2012-m,today%2012-m,today%2012-m&geo=,,,&q=%2Fm%2F0c4f_,%2Fm%2F06h7j,%2Fm%2F06z6r,%2Fm%2F01sgl","guestPath":"https://trends.google.com:443/trends/embed/"}); </script>  

{% include components/heading.html heading='Applications' level=3 %}
Comparing weightlifting performances is a trivial task when one can control how the session will be performed, such as the activity, weight lifted, or the number of repetitions.  But what about comparing independent performances that have already occurred?
The strength module provided classes for comparing athletes of varying weight, weight lifted, and number of repetitions.  These methods were developed by weightlifters, for other weightlifters.

The strength namespace provides many models for predicting weight for 1 repetition maximums (1-RM), or n-RM.  These are useful for determining the weights beginner lifters should use for lower repetition sets while reducing the risk of adding too little weight, or more importantly, too much weight.  These models can also be used to calculate the weight lifted for a number of repetitions based on a lifter's 1-RM.

{% highlight javascript%}{% raw %}var performance = {
    name: "Doug Fenstermacher",
    exercise: "Bicep curls",
    repetitions: 7,
    weight: 60 // lb
},
model = new Fit.strength.Baechle(performance.repetitions);
console.log('1-RM: ' + model.predict(performance.weight) + 'lb');

// 1-RM: 73.86lb{% endraw %}{% endhighlight %}


{% include components/heading.html heading='Anthropometry (latest addition)' level=2 %}

A new addition to the FitnessJS library, anthropometry is the measurement of the human body.  This namespace is loosely affiliated with the exercise physiology.  The intent of this namespace is to be used to supplement the calculations from other measures, or to estimate the total height of an individual which then can used in other calculations.  Fun fact: Anthropometry is commonly used in fashion design when determine the range of sizes for clothing and the proportions between parts of clothing.


* Segment Height - estimated from total height
* Total Height - estimated from segment height


{% include components/heading.html heading='Applications' level=3 %}
Anthropometry allows developers to derive information about the dimensions of a person's body from other information about their body.  Currently, the anthropometry namespace contains functions regarding height, meaning that it can be used to determine the height of a person based on the height of other parts of their body.  For example, if a user were to provide information that their hips were 0.9434meters from the ground, the height_from_height_hips function could be used to determine that the user is roughly 1.78 meters tall.

{% highlight javascript%}{% raw %}var hipHeight = 0.9434; // meters

var totalHeight = Fit.anthropometry.height_from_height_hips(hipHeight); // 1.78 meters tall{% endraw %}{% endhighlight %}