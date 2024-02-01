---
layout: post
title:  "Data-driven Track & Field/Cross Country"
description: Tired of plateaus? This article reveals powerful data-driven metrics derived from splits, pace & consistency to hack your training and dominate the competition. Learn how data analysis can revolutionize track & field performance!
keywords: data,measurement,metric,speed,pace,rabbit,efficiency,track,field,jump,run,throw
tags: data math clustering python
---

{% include components/heading.html heading='Overview' level=2 %}

In the past 20 years the cost of storing data on a computer has plummeted and machine learning and data science have risen as methods for extracting more information from data.  Almost every aspect of track & field is measurable and can be recorded, making it primed to take advantage of these innovations and improve the sport.  But these innovations never happened in track & field, not because of failure, but because the implementations were never attempted.  The only significant development has been the <a href="https://www.tfrrs.org/">Track & Field Results Reporting System (TFRRS)</a> by <a href="https://www.directathletics.com/">Direct Athletics</a> as an authoritative data source for cross country and track & field results for United States university competitions backed by the USATF.  The TFRRS is a step in the right direction by making data publicly available for free (see <a href="https://dougfenstermacher.com/blog/efficient-interchangeable-race-result-communication">Fast, Efficient Communication of Race Results</a>), but the narrow scope of the system falls far short of what could have been delivered to the track & field community.

Track is primed for expanding this functionality to include large-scale analysis using statistics, data science and machine learning.  Performances from most venues are comparable due to the standardization of competition arenas.  This comparability allows statisticians (such as the <a href="https://more.arrs.run/">ARRS</a>) to analyze these performances.  But the main factor that would allow this analysis is the sentiment towards data analysis in recent years.  Since the mid-2000s data storage costs and plummetted, data analysis tools have become cheaper and more common, and data analysis skills and educational tools have become widely available.  This change in culture primes the athletics community for moving successfully towards an analytical approach.
Performance can contain information regarding how the athlete's performance was achieved, and/or the conditions under which the performance was achieved.  For example, long jump analysis could discover that my best long jumps tend to be on my latter attempts, or that I tend to run my faster 3000m times when I start slower and avoid leading the race from the start.  When gathered in large numbers, these recorded metrics may contain information regarding significant trends in athletes, teams, communities, or even the sport worldwide that have yet to be identified.  Analytical approaches such as data science and machine learning techniques can identify these trends, forecast results, and automate tasks.

To take advantage of these innovations, datasets need to contain many samples with many dimensions of data.  But track & field meets currently record only the minimal metrics needed to determine the outcome of the competitions.  Most high school meets only record the final times in running events, and only the final distances/heights in jumps and throws.  WorldAthletics is the leader in data collection for the sport, regularly recording reaction times off of the blocks for sprinting events, the splits of runners at periodic intervals in distance events, and the wind speed in throwing, jumping, and sprint events.  However, no analysis on that data is available, and the data is exclusively stored on the WorldAthletics website with no API access (that I know of) between WorldAthletics and any other organization.  Again, like TFRRS, the steps taken by WorldAthletics are in the right direction but there are many more performances to be collected and many more dimensions to be collected about those performances before data science and machine learning can make a significant impact.

By recording mathematical descriptions of performances through metrics instead of only the outcomes, track & field can establish itself as a pioneer of innovation and flagship sport in data-driven improvement.  Computers can be used to identify patterns, trends, and anomalies in performances for coaches to enhance their athletes by optimizing training and competitive strategies.  Coaches and athletes in the present and in the future can learn from the physical/technical/strategic successes and failures of their peers and predecessors.  Instead of forgetting the past successes/failures of track & field to history, present and future coaches/athletes can learn from them instead of repeating past failed experiments, and instead use the effective approaches that their predecessors invented, or invent new approaches that will surpass them and be made evident in the performances that use them.

By giving open, programmatic access of that data, track & field businesses can develop new applications for the community, innovative projects from enthusiastic software developers, and research from academia, and new insights from data enthusiasts.  Such applications could include a reputation management system based on the quality of performances by an athlete and their disciplinary records (or lack thereof), identifying suspected doping using network science and anomaly detection, or an early detection system for identifying potentially promising coaches/athletes for optimal allocation of coaching/training resources for those individuals.

Collecting more metrics regarding track & field events is the first step towards a data-driven sport.  First and foremost, recorded metrics should be simple to measure/calculate, easy to interpret, and yield meaningful information about a particular type of performance.  I have identified some technical metrics and strategic metrics that could provide more detail into athletic performances and would be useful in bringing track & field for the digital, data-driven world.  Technical metrics such as splits provide feedback to coaches and competitors regarding how behavior during the race results in better/worse absolute outcomes (ex. duration in a running event, distance in a throwing event, etc.).  Strategic metrics indicate if the competitor is improving relative to the other competitors (i.e. is the competitor any closer to winning the competition).

{% include components/heading.html heading='Rankings' level=2 %}

Track & field and cross country at all levels have rankings, but these rankings do not yield value for the athletes, or athletic community as they could.   Rankings are currently based on the best performance of the athlete's season into account, which makes the rankings good for comparing athletes based on their peak performances.  While these ranking are easy to calculate and easy to understand, these rankings do not give a complete picture of the athletes' skill and contributions.  We first need to define what qualities are valued in rankings.  Based on my assumptions, I will put forth the qualities that I see to be valuable:

*  Quality of performance.  What is the quality of the performances of the athlete?   To calculate this, this could be considered the average time/distance of performances from the world record in the  event, where the athlete with the closest average time/distance from the world record is considered the highest ranked.
*  Consistency of performance.  How consistent are the performances of the athlete?  How volatile is the quality of performances by the athlete?  This could be measured as the <a href="https://en.wikipedia.org/wiki/Standard_deviation">standard deviation</a>, or <a href="https://en.wikipedia.org/wiki/Standard_error">standard error</a> of all performances in an event during a given time period, where the athlete with the lowest standard deviation is considered the highest ranked.
*  Diversity of performance.  How widely across the range of events can the athlete perform?


We also need to define how to evaluate the athletes in the context of competition:

*  Performance maximization:  Maximizing the quality of performance in a single event.   This is the individualistic approach to athletics, where the athlete is focused on either winning (ex. <q>If you're not first you're last</q>) or performing their best in a single event.  This approach tends to be most important when evaluating the capability of an athlete to compete at a higher level of competition and tends to get the most publicity.
*  Point maximization: Maximizing the overall aggregate quality of performances over a set of events.  In track & field, a team does not necessarily need to have anyone win any event in order to win a meet overall.  An athlete can be a major contributor to their teams overall goal by being good at many events, but not the best in any single event.  This also applies to multi-events, where athletes to do not need to have the best performance in any event in order to win their overall mult-event, but need to performance consistently well across all the events so that the aggregate sum of the points they have earned is higher than their competitors.
The current approach to rankings focus solely on the performance maximization objective by using the best performance of the athlete. The consistency and diversity of performances are not taken into account, thus ignoring the value of point maximization.  By excluding the diversity of competition, multi-event athletes cannot be recognized for their aggregate contributions across multiple events. By excluding consistency, the dependable athletes who perform reasonably well (but never win) at meets cannot be recognized. Instead of replacing the existing approach to rankings, multiple approaches to rankings could be created for the athletics community to highlight the strengths of the athletes.  Being a good athlete

{% include components/heading.html heading='Distance Events' level=2 %}

Competitors in running races have ultimately have two metrics that measures the success/failure of their performance: final placement at the end of the completed, and the time in which the competition was completed.  Both of these metrics are outcome-based but determined by the competitor's behavior throughout the race.  But there are no metrics that quantify the performance throughout their race. 
 Such metrics could be used to differentiate between the behaviors of athletes.

Before we go on, we need to be able to make better use of what we already have: splits.  To do so, we need to be able to approximate distance/time/positions of competitors at any time thoughout a race based on known splits.  For example, if we have split data for a person at the 100m and 200m marks in a race, we should be able to approximate where they are at the 150m mark.  Here is some code which makes this possible:

{% highlight python %}{% raw %}class Race(object):
    __slots__ = ('entities', 'race_distance')

    def __init__(self, race_distance):
        self.entities = dict()
        self.race_distance = race_distance

    def add_split(self, distance, duration, entity, is_final=False):
        """
        Adds a split to a race for a given entity

        Parameters:
            distance (int|float):  The distance the entity has travelled
            duration (int|float):  The duration of the race
            entity (object):  A unique identifier of an entity

        Returns:
            None
        """
        if (distance <= 0 or distance >= self.race_distance):
            raise ValueError('distance must be between 0 and the race distance (%r)' % (self.race_distance, ))
        if duration <= 0:
            raise ValueError('duration must be > 0')

        distance = float(distance)
        duration = float(duration)
        if entity in self.entities and distance in self.entities[entity]:
            raise ValueError('entity %r already has a split for %r' % (entity, distance))

        self.entities.setdefault(entity, dict())
        self.entities[entity].setdefault(distance, duration)

    def has_split(self, distance, entity):
        """
        Adds a split to a race for a given entity

        Parameters:
            distance (int|float):  The distance the entity has travelled
            entity (object):  A unique identifier of an entity

        Returns:
            bool: indicates if the entity already has a split for the given distance
        """
        if (distance <= 0 or distance >= self.race_distance):
            raise ValueError('distance must be between 0 and the race distance (%r)' % (self.race_distance, ))
        return entity in self.entities and distance in self.entities[entity]

    def remove_split(self, distance, entity):
        """
        Removes a split from a given entity

        Parameters:
            distance (int|float):  The distance of the split to be removed
            entity (object):  A unique identifier of an entity

        Returns:
            None
        """
        if entity in self.entities and distance in self.entities[entity]:
            del self.entities[entity][distance]

    def duration(self, distance, entity):
        """
        Approximates the duration of the race when the given entity was at a
        given distance.

        Parameters:
            distance (int|float):  The distance of the split to be removed
            entity (object):  A unique identifier of an entity

        Returns:
            float: race duration when the given entity was at the given distance.
        """
        if (distance <= 0 or distance >= self.race_distance):
            raise ValueError('distance must be between 0 and the race distance (%r)' % (self.race_distance, ))
        if entity not in self.entities:
            raise ValueError('Entity %r not in race' % (entity, ))

        if distance in self.entities[entity]:
            return self.entities[entity][distance]

        distances = list(self.entities[entity])
        distances.sort()
        closest_distance = min(self.entities[entity], key=lambda x: abs(x - distance), default=0)

        distance_difference = closest_distance - distance
        closest_distance_index = distances.index(closest_distance)
        if closest_distance_index:
            closest_previous_distance = distances[closest_distance_index - 1]
            split_distance = closest_distance - closest_previous_distance
            split_duration = self.entities[entity][closest_distance] - self.entities[entity][closest_previous_distance]
        else:
            split_distance = closest_distance
            split_duration = self.entities[entity][closest_distance]
        split_speed = split_distance / split_duration

        added_duration = abs(distance_difference / split_speed)
        closest_duration = self.entities[entity][closest_distance]
        if distance_difference < 0:
            output = closest_duration + added_duration
        else:
            output = closest_duration - added_duration
        return output

    def entity(self, duration, position):
        """
        Gives the entity at the given position at the given distance/duration

        Parameters:
            duration (int|float):  The duration of the race
            position (int):  The desired position

        Returns:
            object: unique identifier of the entity at the given position at the given race duration
        """
        if duration <= 0:
            raise ValueError('duration must be > 0')
        if 1 > position or position > len(self.entities):
            raise ValueError('Must specify a position between 1 and %i' % (len(self.entities), ))
        estimated_values = dict()
        for competitor in self.entities:
            estimated_distance = self.distance(duration, competitor)
            estimated_values[competitor] = estimated_distance
        sorted_entities = sorted(estimated_values.keys(), key=lambda e: estimated_values[e], reverse=True)
        return sorted_entities[position - 1]

    def position(self, entity, distance=None, duration=None):
        """
        Approximates the entity position at a given distance/duration.
        """
        if entity not in self.entities:
            raise ValueError('Entity %r not in race' % (entity, ))
        if bool(distance) == bool(duration):
            raise ValueError('Must specify either distance or duration')

        if duration and duration <= 0:
            raise ValueError('duration must be > 0')

        if distance and (distance <= 0 or distance >= self.race_distance):
            raise ValueError('distance must be between 0 and the race distance (%r)' % (self.race_distance, ))

        estimated_values = dict()
        if distance:
            for competitor in self.entities:
                estimated_duration = self.duration(distance, competitor)
                estimated_values[competitor] = estimated_duration
            sorted_entities = sorted(estimated_values.keys(), key=lambda e: estimated_values[e])
        else:
            for competitor in self.entities:
                estimated_distance = self.distance(duration, competitor)
                estimated_values[competitor] = estimated_distance
            sorted_entities = sorted(estimated_values.keys(), key=lambda e: estimated_values[e], reverse=True)
        return sorted_entities.index(entity) + 1

    def distance(self, duration, entity):
        """
        Approximates the distance of an entity at a given duration of the race

        Parameters:
            duration (int|float):  The duration of the race
            entity (object):  A unique identifier of an entity

        Returns:
            float: distance travelled by the given entity after the given race duration.
        """
        if duration <= 0:
            raise ValueError('duration must be > 0')
        if entity not in self.entities:
            raise ValueError('Entity %r not in race' % (entity, ))

        distances = list(self.entities[entity])
        distances.sort()
        closest_previous_distance = max([previous_distance for previous_distance in self.entities[entity] if self.entities[entity][previous_distance] < duration], default=0)
        closest_next_distance = min([previous_distance for previous_distance in self.entities[entity] if self.entities[entity][previous_distance] >= duration], default=None)
        if closest_next_distance:
            closest_distance = min([closest_previous_distance, closest_next_distance], key=lambda x: abs(self.entities[entity][x] - duration))
        else:
            closest_distance = closest_previous_distance
        closest_duration = self.entities[entity][closest_distance]

        duration_difference = closest_duration - duration
        closest_distance_index = distances.index(closest_distance)
        if closest_distance_index:
            closest_previous_distance = distances[closest_distance_index - 1]
            split_distance = closest_distance - closest_previous_distance
            split_duration = self.entities[entity][closest_distance] - self.entities[entity][closest_previous_distance]
        else:
            split_distance = closest_distance
            split_duration = self.entities[entity][closest_distance]
        split_speed = split_distance / split_duration
        added_distance = abs(split_speed * duration_difference)
        if duration_difference < 0:
            output = closest_distance + added_distance
        else:
            output = closest_distance - added_distance
        return min(output, self.race_distance)


if __name__ == '__main__':
    race = Race(5000)
    race.add_split(1000, 163, "Doug")
    race.add_split(2000, 370, "Doug")
    race.add_split(1000, 161, "Joe")
    race.add_split(2000, 373, "Joe")
    print(race.duration(900, "Doug"))  # Doug will cross the 900m mark at approximately 146.7 seconds
    print(race.distance(375, "Doug"))  # At 375 seconds into the race, Doug will be at approximately 2024.15m 
    print(race.position("Doug", distance=2000))  # At the 2000m mark, Doug is in 1st place
    print(race.position("Joe", duration=200))  # 1  200 seconds into the race, Joe was in 1st place
    print(race.entity(200, 1))  # 200 seconds into the race, Joe was/is in 1st place{% endraw %}{% endhighlight %}

This `Race` class encapsulates functionality to determine where a competitor was in a course at a given time, when a competitor was at a given distance, and their position at a given time/distance all based on the available split data for the competitor.  As more split data becomes available, the approximations become more accurate.  This creates a baseline for further metrics.  This class can also be used to estimate splits for approximating <a href="https://dougfenstermacher.com/blog/pack-behavior-classifications-competition">pack membership throughout a race</a>.

We could go about creating our own custom metrics for distance running, which would no doubt be valuable.  But I think we need to start with metrics that are universal to all races, and NASCAR and Formula One have plenty of them:

#### Competitor


<dl>
    <dt>Opening position</dt>
    <dd>The position obtained by a competitor in the opening of the race.  This period of time would be from when the starting gun goes of, to when the competitors have all reached the inside of the track.</dd>

    <dt>Early/middle/closing position improvement</dt>
    <dd>These 3 metrics number of positions a competitor improves  over the first/middle/last x% of a race.  If this number is negative, indicates that they their position worsened during that period.</dd>

    <dt>Mean Early/Middle/ Closing position improvement</dt>
    <dd>These 3 metrics are the number of positions a competitor improves  over the last x% of a race.  If this number is negative, indicates that they their position tends to worsen during that period of races.  A moving average could also be taken to avoid giving too much weight to outliers.</dd>

    <dt>Consecutive laps/segments without being passed</dt>
    <dd>number of consecutive laps/segments a competitor has gone while only maintaining/improving their position.</dd>

    <dt>Fastest n-meters</dt>
    <dd>Fastest time the competitor traverses n-meters throughout the race</dd>

    <dt>passes</dt>
    <dd>Total number of times the competitor passes other competitors over a given time/distance interval.</dd>

    <dt>passed</dt>
    <dd>Total number of times the competitor is passed by other competitors over a given time/distance interval.</dd>

    <dt>net position change</dt>
    <dd>Indicates the change in position at two points in distance/time during the race.  If a competitor is in 4th place at the start of the interval and in 6th place at the end of the interval, then the net position change is +2.  If they are in 4th place at the start of the interval and in 1st place at the end of the interval, the next position change is -3.  If they have the same position at the start and end of the interval, then it is 0.</dd>

    <dt>total position changes</dt>
    <dd>Indicates the total number of times the competitor's position changed in a time/distance interval during the race.  For example, if during an interval the competitor drops back 2 positions, then the total positions changes is two.  But, if the competitor loses 2 positions and then regains one of the positions, then the total position changes is 3.</dd>

    <dt>consecutive passes</dt>
    <dd>The maximum number of consecutive passes the competitor made without being passed themselves in a given time/distance interval.</dd>

    <dt>laps/segments where position was/was not improved</dt>
    <dd>The number of laps/segments where the competitor did/did not improve their position.</dd>

    <dt>mean finish position</dt>
    <dd>The average of the finish positions that the competitor over the course of multiple races.</dd>

    <dt>laps/segments led</dt>
    <dd>The number of laps/segments that the competitor led the race.</dd>

    <dt>laps/segments at position n</dt>
    <dd>The number of laps/segments that the competitor held position n.  This metrics can be recorded for as many position the competitor held through the race</dd>

    <dt>Margin of defeat</dt>
    <dd>The time/distance of the competitor to the first place finisher.  The margin of defeat for the victor would be 0.</dd>

    <dt>Correlation between Splits</dt>
    <dd>Do strong performances in one segment tend to predict good times in others? This can reveal pacing patterns and identify key sections for success.  This can be applied to individual athletes level or to thousands of runners to identify trends.</dd>
</dd>
</dl>

The metrics quantify a specific aspect of a competitor's performance, and describe their behavior throughout the race in terms of time and position.  For example, If a competitor has an opening position of 1, and a net position change of 0, and a total position change of 0, then the competitor was the leader of the entire race.  If the competitor had a high (worse) opening position and an above-zero early/middle/closing position improvement then the competitor had a bad start but made up for it throughout the race.  Competitors can be evaluated in terms of tactical behavior using these metrics, and further quantify the nature of racing.

#### Race
Next we have metrics that can be used 

<dl>
    <dt>Negative split ratio</dt>
    <dd>The percentage of race participants who ran negative splits (finishing faster in the second half). This metric indicates the prevalence of strong finishes and race strategies.  This can also be calculated for an individual across multiple races.</dd>
    <dt>Slowest race segment</dt>
    <dd>Cross country and road races have different terrain in different segments.  By identifying which segments/splits are consistently fastest or slowest, we can estimate a difficulty of the segments.  The splits for these segments cna also be compared to the splits of participants from other races to further refine the validity of the measure.</dd>
    <dt>Mean/Median race time/split</dt>
    <dd>Compare the mean and median race/split times to identify if the race/segment skewed faster or slower, in a simple measure for anyone to understand.</dd>
</dl>

#### Clusters/Packs
<b>EDIT</b>: I originally wrote extensively on how to pack detection based on density.  I decided to split that into its <a href="https://dougfenstermacher.com/blog/pack-behavior-classifications-competition">own post</a>.  In short, pack membership can and should be tracked over time in races as well as the role competitors have in each pack.  Pack membership can be performed on a computer very cheaply and quickly, to the point that it can be done in real-time.  Below is a alluvial representing the creation and disbanding of packs over time, as well as the changes in membership.

<div class="flourish-embed" data-src="visualisation/559694"></div><script src="https://public.flourish.studio/resources/embed.js"></script>

By tracking packs, competitions can have another layer of analysis beyond the individual athlete or team.  Coaches and athletes could  look at trends of how their runners behave relative to their surrounding competitors over multiple competitions. They can ask questions such as "how does this runner tend to perform when they are the front/middle/back of a pack?", or "When in a competition does this runner tend to transition between packs?".

#### Rabbits
These metrics above cover all competitors within a distance running competition.  But there is one type of runner which these metrics do not apply to at all: rabbits.  Rabbits are an emergent product of distance running.  Unlike competitors, rabbits do not have the outcome-based goal of winning the race, but the behavioral objective ensuring the race progresses at a predefined pace up until a certain distance in a race.  These fundamental differences in the nature of their objectives, reflects that most metrics applied to competitors are not applicable to rabbits.  For example, if a rabbit hits the predefined pace in the race but other competitors do not follow, did the rabbit result in increasing the pace of the race?  By the conventional metrics used for evaluating rabbits (splits), the rabbit did their job perfectly, however, their performance did not have the behavioral outcome on the race that was intended by their running the predefined pace.  The competitors did not run faster due to the rabbit's efforts.  So, was the rabbit successful? I would argue that while they met their technical expectations of hitting the pace, they did not meet their strategic expectation of increasing the pace of the race.   Different metrics need to be used to mathematically determine the success/failure of a rabbit in a competition based on the actual need that caused the emergence of the role of rabbit in the first place:  did they make the race faster?

##### Difference between actual pace and predefined pace
This technical metric is simple:  the difference between the predefined pace and the rabbit's actual pace.

$$  \varDelta{p} = p_{predefined} - p_{actual} $$

##### Predefined pacing strategy vs. actual pacing strategy
This metric is a measure of how closely the rabbit's actual pacing strategy matches the predefined pacing strategy and is a more specific version of the above metric.  Typically predefined paces 
 are expected to be even, but in some cases a rabbit may be expected to run specific negative splits or positive splits.  This metric is useful for determining whether or not the rabbit is going hit the predefined splits when they are not even.

$$ 
\Large
{ {\sum_{i=1}^S{p_i - a_i} \over |S| }}
$$

where  $$ p_i $$ is the predetermined split and $$ a_i $$ is the actual split by the rabbit and $$ | S | $$ is the total number of splits.

##### Ability to hit predefined pace for given distance
This metric is an indicator of the capability of an athlete to meet the pace required for required distance.  This metric can be defined as how many times in a given time frame the athlete has exceeded the predefined pace, and by how much was the pace missed or exceeded.  For example, a slower runner is less likely to be able to to sustain a faster pace, and therefore may not be a reliable rabbit for races where the rabbit is expected to maintain a faster pace.

$$ \text{successful attempts}  \over \text{total attempts} $$

##### Distance to race leader/lead pack
This outcome-based metric tells us how far away the lead competitors are from the rabbit, and in what direction.  The rabbit is only effective if the lead competitors maintain or close the distance between themselves and the rabbit, indicating that the rabbit is influencing the pace.  If the distance is increasing, the rabbit is not influencing the pace.  This strategic metric can be used in combination with the technical metric of the distance of the rabbit's pace from the predefined pace to determine whether the success/failure of the rabbit to influence the pace of the race lies with the rabbit for not hitting the predefined pace, or if fault lies with the competitors for ignoring the rabbit altogether.

$$ \varDelta{d}_\text{rabbit\ leader} = d_\text{rabbit} - d_\text{leader} $$

This last metric raises a new question:  If the competitors are not responding to the rabbit when they are hitting the predefined pace, would the rabbit be right to deviate from the predefined place in effort to influence the competitors' pace?  If the rabbit continues at the predefined pace (their technical metric), they will likely continue to have no influence on the competitor's pace (their strategic metric).  If the rabbit changes their pace to deviate from their expected metric and allow the competitors to close the distance between them, they may have a chance at influencing the pace of the race.

##### Average position
This metric is used to assess whether the rabbit is generally successful in leading the pack during their required interval, and if not, how close to being the leader they were.  If the rabbit is being successful, their average position during their assigned pacing laps should approach (or be) 1.  This value can be calculated by summing the rabbit's position of each lap/segment of the race, divided by the total number of laps/segments in the race. 
 In the case where each lap is of the same length, the following formula can be used

$$ p_{avg} = { \displaystyle\sum_{i=1}^\text{laps} {p_i \over |\text{laps}|}  } $$

In the case where the segments are not of the same length, the following formula can be used

$$ p_{avg} = { \displaystyle\sum_{i=1}^\text{segments} {p_is_i \over |\text{segments}|}  } $$

where $$ s_i $$ is the length of the segment.  This formula can be used in any race for any competitor as a method for assessing what position the competitor spent the majority of the race in relative to the other competitors.  This ensures that position changes that occur at the end of a race have minimal influence over the output position.  If a competitor's average position is lower than another, it indicates that the competitor spent the majority of the race behind the other.  If the difference between two average positions is small, then the two competitors were relatively near to each other position-wise for the majority of the race, if large, they were relatively far from each other position-wise.

#### Identifying important events
There are many important events in a race, such when a serious contender trips, or when competitors change position.  Ideally, these events would be recorded by spectators, officials or a timing system but that is not always possible.  Instead we can estimate when a competitor was passed by another using their splits immediately before and after they were passed.

{% highlight python %}{% raw %}def intersect_time(speed1, speed2, gap):
    """
    Returns the time it takes for 2 objects travelling in the same direction
    to intersect

    Parameters:
        speed1 (float): speed of an object
        speed2 (float): speed of the other object
        gap (float): Distance between the two objects

    Returns:
        float: time until they intersect
    Raises:
        ValueError
    """
    if speed1 < 0 or speed2 < 0:
        raise ValueError('Object speeds must be positive')
    if speed1 == speed2:
        raise ValueError('Objects will never intersect')
    speed_difference = abs(speed2 - speed1)
    closing_time = gap / speed_difference
    return closing_time


def intersection_distance(speed1, distance1, speed2, distance2):
    """
    Calculated the time it takes for 2 objects travelling in the same direction
    to intersect

    Parameters:
        speed1 (float): speed of an object
        distance1 (float): distance of an object
        speed2 (float): speed of the other object
        distance2 (float): distance of the other object

    Returns:
        float: distance where the objects intersect
    Raises:
        ValueError
    """
    if speed1 < 0 or speed2 < 0:
        raise ValueError('Object speeds must be positive')
    if speed1 == speed2:
        raise ValueError('Objects will never intersect')
    gap = abs(distance2 - distance1)
    closing_time = intersect_time(speed1, speed2, gap)
    closing_distance = closing_time * speed1
    return distance1 + closing_distance{% endraw %}{% endhighlight %}

{% include components/heading.html heading='Sprints & Hurdles' level=2 %}

Sprints and distance events share many of the same qualities.  Sprints have a few unique qualities: 

<ul>
*  Sprinters have more strategic value in the context of a team.  Sprinters tend to perform better when competing in multiple events, and thus tend to yield more points in team competitions.  This means that coaches correctly allocating sprinters to the optimal events can yield more benefits to the team.
*  Sprint events are less strategic.  Most sprinting events do not have time for  many events to occur that require conscious decision-making, so in-race strategic metrics will not likely lead to significant changes in the race outcome.
*  The act of sprinting/hurdling is more technical than distance events.  The sprint events require more tactical expertise such as coming out of blocks, maintaining sprinting form throughout the race, proper hurdle form, and dipping at the finish line.  Based on the importance of these technical skills, sprinters and sprint coaches could benefit by having more technical metrics to evaluate their performances.
</ul>

Based on these qualities, we will be focusing more on technical metrics than strategic metrics for sprinting/hurdles.

##### Distance and Hurdle-based Splits
Sprinters can benefit from splits.  Even in 100m races, splits can be beneficial for sprinters learning where they are slow, and where they are fast.  The more splits that are measured, the more fluctuations that can be identified throughout a race.

The most significant splits for hurdle events would be hurdle-based splits.   A hurdle-based split would be where a split is measured at every hurdle.  Hurdle-based splits would break hurdle events into the segments of the race between hurdles.  The slpits could let hurdlers and hurdle coaches evaluate 

##### Reaction Time
The reaction time has started to be measured by the IAAF.  The reaction time is the time it takes for a sprinter to exit their blocks.  The reaction is considered a major factor indicator regarding the relative and absolute performance of sprinters.

##### Distance from inside of the lane
Running lanes in track & field have a width that the runner can use.  Runners can use any part of the lane without disqualification.  Runners have a strong incentive to run in the inside of the lane when going around turns as running the inside of the lane allows the runner to run a shorter distance, thus gaining an advantage in the race.  By measuring how far from the inside of the lane an athlete is running, runners, coaches can determine how much less/more distance an athlete is running based on their position in their lane. 
 While this metric could be significant in all running events, sprinters have the most to gain from it due to the proportion of the small time differences between first and second place finishers.  There are scenarios where if a competitor had ran 6 inches closer to the inside of their lane, they would have beat their opponent, because they traveled less distance than than their adversary.


##### Time spent traversing each hurdle
For every moment that is not spent pushing off the ground, hurdlers are losing speed.  Therefore, hurdlers want to be in the air as little as possible, and running on the ground as much as possible.  By recording the time spent traversing each hurdle, hurdlers and hurdle coaches could accurately attribute bigger decreases in speed to the increased time traversing of the hurdle.  This will also help hurdlers and coaches to prioritize speed vs hurdle techniques in training.

##### If each hurdle was cleared/impacted
Recording whether a hurdler came in contact with a hurdle or not allows hurdlers and coaches to determine the role (or lack thereof) impacting a hurdle had their performance  Many hurdlers, both in grade school and elite, come into contact with hurdles regularly.  Running into a hurdle can take away momentum from the hurdler, requiring them to exert more energy to speed up (if they have enough energy left to do so), directly impacting the outcome of their race.

##### Hurdle technique used
Over the course of modern athletics, many techniques for traversing hurdles have existed.  While some have been determined to be superior to others, others have simply gone out of style. For example, <a href="https://en.wikipedia.org/wiki/Rod_Milburn">Rod Milburn</a> used the double-arm lead technique to go over hurdles to reduce his time in the air. 
 This technique was prominent and (to my knowledge), was never proven to inferior to modern techniques.  The technique lost popularity and fell into obscurity.  I learned of this because the sprinting coach at Virginia Tech while I was running there was <a href="https://en.wikipedia.org/wiki/Charles_Foster_(hurdler)">Charles Foster</a> raced against Milburn as an athlete, and went on to use the technique himself during his career.  Like the double-arm lead, it is very possible that some techniques that are not popularity may have merit as an effective technique.  Recording the technique used will allow the track & field community to evaluate old and new techniques more methodically, so, hopefully, superior techniques are chosen over the popular ones.  Such records of a hurdle technique can inform the decision of other coaches/athletes regarding whether or not to adopt the hurdling technique, or, in the case of the athlete who executed the performance, whether or not to continue with it.

 ## Jumps

 #### Technical metrics

##### Lefts/Rights/Strides count
The total number of strides leading up to take-off, commonly referred to lefts/rights in pole vault, and determine how far a jumper has to accelerate before take-off.  Jumpers/vaulters are capable of different performances when using different numbers of strides.  Recording the number used for a jump allows all coaches/athletes to determine whether the strides contributed to the quality (or lack thereof) of a given jump.  Katie Nageotte excellently describes how the terms "lefts"/"rights" came about in her <a href="https://knageotte.wixsite.com/polevault/post/pole-vault-101">Pole Vault 101</a> post under the <strong>In the Jump/Technique</strong> section.

##### Speed at take-off
The speed at take-off directly correlates with the distance/height of the jump.  The number of lefts/rights/strides a jumper uses in a given jump serves as a limit on the distance the jumper has to accelerate before take-off.  But some athletes are able to accelerate faster than others, resulting in them running faster at take-off, making the number of lefts/rights/strides a tertiary predictor of the quality of a jump.

##### Individual distances of the hop, skip, and jump (triple jump)
The triple jump is normally measured as the cumulative distance of the hop, skip, and jump.  I would propose also measuring these individual components as a breakdown of how each component contributes towards the total distance of the triple jump.

 $$  d_{TJ} = d_\text{hop} + d_\text{skip} + d_\text{jump} $$

##### Take-off distance from measuring point
In the long jump and the triple jump there is a board in the lane that the athlete must jump before, which also serves as the point at which the start of the jump is measured.  The  further the athlete takes-off before that barrier, the more distance the athlete lose on their jump because their jump includes a larger distance that isn't measured.  Therefore, the shorter the distance between the take-off and measuring point, the better.  This metric tells us how much distance was lost on their recorded jump due to a premature take-off, and tells us how far the actual distance jumped was.

$$ d_\text{measured} = d_\text{actual} - d_\text{measuring\ point} $$

{% include components/heading.html heading='Throws' level=2 %}


To be quite honest, I know very little about throwing events.  I understand that it is a very strategic event in terms of team competition, but I know very little regarding the technical aspects of the event.  Unfortunately I can't think of any good metrics to add to throwing events.  But if/when I come up with them, I will add them here.

<dl>
    <dt>Variance</dt>
    <dd>A statistical measure of how consistent the throwers performances are.  Can be applied both intra-competition and inter-competition.</dd>

   <dt>Covariance</dt>
   <dd>A statistical measure of whether the thrower tends to improve, stay consistent, or decay throughout a competition.  Can also be applied inter-competition.</dd>

    <dt>Margin of defeat</dt>
    <dd>The distance of the competitor to the winner.  The margin of defeat for the victor would be 0.</dd>
</dl>

{% include components/heading.html heading='Update: Rendering results tables' level=2 %}

While visiting some race results,  I noticed that many of the table rows carry reduntant information.  An important part of a data-driven culture is ensuring that the data can be rendered simply for the viewer to understand. I think that race results tables could be made smaller and clearer using a minimal HMTL cell attribute: <a href="https://www.w3schools.com/tags/att_td_rowspan.asp">rowspan</a>.

When multiple athletes from the same team finish sequentially, the "Team" row could be merged together to reduce the amount of text in the table, and visually show that athletes from the same team finished together by adding color.  I've created the following results table from the <a href="https://www.tfrrs.org/results/xc/15281/Hokie_Open">2019 Womens' Hokie Open</a> to demonstrate this:


<style>
.liberty, .vt, .hollins {
    color: white;
}

.liberty {
    background: #990000;
}

.vt {
    background: #6A2C3E;
}

.hollins {
    background: #0a6649;
}

table.results-table {
    position: relative;
    vertical-align: top;
}

table.results-table td[rowspan] {
    position: relative;
    vertical-align: top;
}

table.results-table td[rowspan] span {
    position: sticky;
    top: 0;
}
</style>

<table class="table results-table">
   <caption>2019 Womens' Hokie Open - Rendering example</caption>
   <thead>
      <tr>
         <th>Place</th>
         <th>Name</th>
         <th>Team</th>
         <th>Time</th>
      </tr>
   </thead>
   <tbody>
      <tr>
         <td>1</td>
         <td>Pocratsky, Rachel</td>
         <td class="una" rowspan="2"><span>Unattached</span></td>
         <td>14:17.0</td>
      </tr>
      <tr>
         <td>2</td>
         <td>Wiemerslage, Julie</td>
         <td>14:39.2</td>
      </tr>
      <tr>
         <td>3</td>
         <td>Hassebrock, Ava</td>
         <td class="vt" rowspan="2"><span>Virginia Tech</span></td>
         <td>14:50.6</td>
      </tr>
      <tr>
         <td>4</td>
         <td>Breidenstine, Ella</td>
         <td>14:53.4</td>
      </tr>
      <tr>
         <td>5</td>
         <td>Sorg, Kyley</td>
         <td class="liberty">Liberty</td>
         <td>15:06.9</td>
      </tr>
      <tr>
         <td>6</td>
         <td>Schiesl, Emily</td>
         <td class="vt" rowspan="2"><span>Virginia Tech</span></td>
         <td>15:07.7</td>
      </tr>
      <tr>
         <td>7</td>
         <td>Zolkiewicz, Allison</td>
         <td>15:16.9</td>
      </tr>
      <tr>
         <td>8</td>
         <td>Stocki, Chelsea</td>
         <td class="liberty" rowspan="4"><span>Liberty</span></td>
         <td>15:23.4</td>
      </tr>
      <tr>
         <td>9</td>
         <td>Reed, Vivian</td>
         <td>15:38.8</td>
      </tr>
      <tr>
         <td>10</td>
         <td>Jantomaso, Sophia</td>
         <td>15:43.6</td>
      </tr>
      <tr>
         <td>11</td>
         <td>Zealand, Emma</td>
         <td>16:47.4</td>
      </tr>
      <tr>
         <td>12</td>
         <td>Re, Nicole</td>
         <td class="una">Unattached</td>
         <td>16:54.1</td>
      </tr>
      <tr>
         <td>13</td>
         <td>Stone, Cate</td>
         <td class="vt">Virginia Tech</td>
         <td>16:54.4</td>
      </tr>
      <tr>
         <td>14</td>
         <td>Reilly, Francesca</td>
         <td class="hollins" rowspan="4"><span>Hollins</span></td>
         <td>18:34.1</td>
      </tr>
      <tr>
         <td>15</td>
         <td>Shifflett, Kacie</td>
         <td>18:56.7</td>
      </tr>
      <tr>
         <td>16</td>
         <td>Contri, Olivia</td>
         <td>19:26.2</td>
      </tr>
      <tr>
         <td>17</td>
         <td>James, Carla</td>
         <td>23:39.5</td>
      </tr>
   </tbody>
</table>

These consecutive "Team" cells form the same team were merged using the <a href="https://www.w3schools.com/tags/att_td_rowspan.asp">rowspan</a> attribute for the cells that I wanted to merge.  By keeping the label <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/position">sticky</a> to the top of the cells spanning multiple rows, a label will always be visible for 
 each cell.  This could easily be applied to larger races, and could result in significant less markup being sent to the user's browser, in addition to reducing the amount of text that users need to read.


But developers need to be able to automatically generate the markup to render these results, as its not practical to manually write/edit them for all past/future race results.   Calculating the number of spans would be calculated by the view logic, and used in rendering in the template.

{% highlight python %}{% raw %}from django.shortcuts import renderfrom django.shortcuts import render
from django.views.decorators.http import require_http_methods
from athletics import models


def calculate_spans(performances):
    output = []
    current_organization = None
    current_span = 0
    performance_count = len(performances)
    for performance in performances:
        if performance.organization != current_team or performance == performances[-1]:
            output.append(current_span)
            current_span = 0
            current_organization = performance.organization
        else:
            current_span += 1
    return output


@require_http_methods(["GET"])
def results(request, competition_id):
    competition_instance = models.Competition.objects.get(competition_id)
    performances = models.Performance.objects.filter(competition=competition_instance),order_by('place').all()
    spans = calculate_spans(performances)
    performance_iterable = zip(performances, spans)
    context = dict(competition=competition, performances=performance_iterable)
    return render(request, 'results_template.html', context)
{% endraw %}{% endhighlight %}

`calculate_spans` is used to determine how many rows each cell should span.  That information is passed into the `results_template.html` template for rendering:

{% highlight html %}{% raw %}
<table>
    <caption>
        {{ competition.name }} - {{ competition.event.name }}
    <thead>
        <tr>
            <th>Place</th>
            <th>Athlete</th>
            <th>Affiliate</th>
            <th>Time</th>
        </tr>
    </thead>

    <tbody>
        {% for performance, span in performance_iterable %}
            <tr>
                <td>{{ performance.place }}</td>
                <td>{{ performance.entity.name }}</td>
                {% if span %}
                    <td class="{{ performance.organization.slug }}" rowspan="{{ span }}"><span>{{ performance.organization.name }}</span></td>
                {% elif span == 1 %}
                    <td class="{{ performance.organization.slug }}">{{ performance.organization.name }}</td>
                {% endif %}
                <td>{{ performance.formatted_value }}</td>
            </tr>
        {% endfor %}
    </tbody>
</table>
{% endraw %}{% endhighlight %}

Calculating the variables needed for rendering can be done linearly, making it possible render results of very large results without causing significant latency due to rendering while reducing the amount of data that needs to be downloaded by the end user.  That makes this very simple approach to rendering results viable for use on production websites.

High jump and pole vault results can be simplified as well.  Typically, websites such as TFRRS itemize each jump as a P (for "Pass"), an X (for "Miss" or "Fail") and O (for "Success" or "Cleared") in a row below each of the competitors.  While this is allows them to use their preferred format without going off the side of the page, it is not efficient for the viewer.  The attempts at each height are separated by the data about the athlete and there is a lot of text that the viewer needs to mentally process.  By putting the attempt data against each other and by reducing the amount of text, we can convey the same information, and make it easier for the viewer to process quickly.

<style>
.fail {
  background: red;
}

.success {
  background: green;
}

.pass {
  background: rgba(127, 127, 127, 0.5);
}

.ineligible {
  opacity: 0;
}
</style>
<table style="border-collapse: initial; border-spacing: 0.1em;">
  <thead>
    <tr>
      <th>Place</th>
      <th>Name</th>
      <th>Affiliation</th>
      <th>Performance</th>
      <th colspan="24">Attempts</th>
    </tr>
    <tr>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th colspan="3">2.00m</th>
      <th colspan="3">2.05m</th>
      <th colspan="3">2.08m</th>
      <th colspan="3">2.11m</th>
      <th colspan="3">2.14m</th>
      <th colspan="3">2.17m</th>
      <th colspan="3">2.20m</th>
      <th colspan="3">2.23m</th>
      
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
      <tr>
        <td>
          1<sup class="ordinal">st</sup>
        </td>
        <td>
          John Doe
        </td>
        <td>Example University</td>
        <td>2.20m</td>
        
        <td data-height="2.0" class="pass"></td>
        <td data-height="2.0" class="pass"></td>
        <td data-height="2.0" class="pass"></td>
     
        
        <td data-height="2.05" class="success"></td>
        <td data-height="2.05" class="pass"></td>
        <td data-height="2.05" class="pass"></td>
       
        <td data-height="2.08" class="success"></td>
        <td data-height="2.08" class="pass"></td>
        <td data-height="2.08" class="pass"></td>
        
        <td data-height="2.11" class="fail"></td>
        <td data-height="2.11" class="success"></td>
        <td data-height="2.11" class="pass"></td>
        
        <td data-height="2.14" class="fail"></td>
        <td data-height="2.14" class="success"></td>
        <td data-height="2.14" class="pass"></td>
        
        <td data-height="2.17" class="fail"></td>
        <td data-height="2.17" class="fail"></td>
        <td data-height="2.17" class="success"></td>
        
        <td data-height="2.20" class="fail"></td>
        <td data-height="2.20" class="success"></td>
        <td data-height="2.20" class="pass"></td>
        
        <td data-height="2.23" class="fail"></td>
        <td data-height="2.23" class="fail"></td>
        <td data-height="2.23" class="fail"></td>
  
      </tr>
    
    <tr>
        <td>
          2<sup class="ordinal">nd</sup>
        </td>
        <td>
          Jack Smith
        </td>
        <td>Rival University</td>
        <td>2.17m</td>
        
        <td data-height="2.0" class="pass"></td>
        <td data-height="2.0" class="pass"></td>
        <td data-height="2.0" class="pass"></td>
     
        
        <td data-height="2.05" class="pass"></td>
        <td data-height="2.05" class="pass"></td>
        <td data-height="2.05" class="pass"></td>
       
        <td data-height="2.08" class="success"></td>
        <td data-height="2.08" class="pass"></td>
        <td data-height="2.08" class="pass"></td>
        
        <td data-height="2.11" class="success"></td>
        <td data-height="2.11" class="pass"></td>
        <td data-height="2.11" class="pass"></td>
        
        <td data-height="2.14" class="fail"></td>
        <td data-height="2.14" class="success"></td>
        <td data-height="2.14" class="pass"></td>
        
        <td data-height="2.17" class="fail"></td>
        <td data-height="2.17" class="success"></td>
        <td data-height="2.17" class="pass"></td>
        
        <td data-height="2.20" class="fail"></td>
        <td data-height="2.20" class="fail"></td>
        <td data-height="2.20" class="fail"></td>
        
        <td data-height="2.23" class="ineligible" colspan="3"></td>
      </tr>
    
      <tr>
        <td>
          3<sup class="ordinal">rd</sup>
        </td>
        <td>
          Jack Johnson
        </td>
        <td>Rival University</td>
        <td>2.14m</td>
        
        <td data-height="2.0" class="pass"></td>
        <td data-height="2.0" class="pass"></td>
        <td data-height="2.0" class="pass"></td>
     
        
        <td data-height="2.05" class="pass"></td>
        <td data-height="2.05" class="pass"></td>
        <td data-height="2.05" class="pass"></td>
       
        <td data-height="2.08" class="fail"></td>
        <td data-height="2.08" class="success"></td>
        <td data-height="2.08" class="pass"></td>
        
        <td data-height="2.11" class="fail"></td>
        <td data-height="2.11" class="success"></td>
        <td data-height="2.11" class="pass"></td>
        
        <td data-height="2.14" class="success"></td>
        <td data-height="2.14" class="pass"></td>
        <td data-height="2.14" class="pass"></td>
        
        <td data-height="2.17" class="fail"></td>
        <td data-height="2.17" class="fail"></td>
        <td data-height="2.17" class="fail"></td>
        
        <td data-height="2.20" class="ineligible" colspan="6"></td>
      </tr>
    
  </tbody>
</table>

By using color instead of characters to denote the outcome of each attempt, we can show the outcomes of the attempts as a heatmap using less space and keep the attempts next to each other to make them easy to compare.  In my example, I have used grey to denote passes, red to denote failures, and green to denote clearances but any color scheme is valid.  Using this approach viewers can quickly tell the differences between attempts at each step in the progression of competition.  Tooltips can also be added to show additional information about each attempt.

{% include components/heading.html heading='Update: What-if scenarios' level=2 %}

Many competitive runners are not satisfied for long after a good race, even when they exceeded their own expectations.  They like to go through what-if scenarios to determine how well they would have done if they ran faster.  These calculations are very simple, and ought to be built-in to more tools so that users can go through these what-if scenarios without having to do the math themselves, or go to a different site.

There are a couple common what-if scenarios:

1. I wanted to beat runner x. What speed would I have needed to ran to beat them?
2. How much faster would I have needed to run to gain a place in the results?
3. If I sustained a given pace from a given distance onward, how many places would I have gained in the results if all else stayed the same?


We can do all of these calculations of these calculationwithout using any advanced math:
{% highlight python %}{% raw %}def calc_speed(time, distance):
    """
    Parameters:
        time (float):  Amount of time needed to travel the given distance
        distance (float):  Distance travelled in the given amount of time

    Returns:
        float: Speed of a competitor
    """
    return float(distance) / time


def calc_time(speed, distance):
    """
    Parameters:
        time (float):  Speed at which the given distance was travelled
        distance (float):  Distance travelled at the given speed

    Returns:
        float: Amount of time needed to travel the given distance
    """
    return distance / float(speed)


def intercept_speed(distance_delta, speed, distance_remaining):
    """
    Parameters:
        distance_delta (float):  Distance between the competitor and a given runner
        speed (float):  Speed of the competitor
        distance_remaining (float):  Distance remaining in the race for the competitor

    Returns:
        float: speed required to catch the competitor by the time they travel the
            remaining distance in the race.
    """
    total_distance = distance_delta + distance_remaining
    time_to_beat = calc_time(speed, distance_remaining)
    return calc_speed(time_to_beat, total_distance)


def calc_pace(speed):
    return 1.0 / speed{% endraw %}{% endhighlight %}

We can use the code above like so:

{% highlight python %}{% raw %}MILE_METERS = 1609.34
distance_behind = 200.0 / MILE_METERS
distance_remaining = 500.0 / MILE_METERS
total_distance = distance_behind + distance_remaining

speed = 1 / 6.0 # 6.0 minutes/mile
pace = calc_pace(speed)

print('Speed: %r mile/min (%r min/mile pace)' % (speed, pace))
required_speed = intercept_speed(distance_behind, speed, distance_remaining)
print('Required speed to catch up in %s miles: %r  mile/min (%r min/mile pace)' % (total_distance, required_speed, calc_pace(required_speed)))
# Speed: 0.16666666666666666 mile/min (6.0 min/mile pace)
# Required speed to catch up in 0.4349609156548647 miles: 0.23333333333333334  mile/min (4.285714285714286 min/mile pace){% endraw %}{% endhighlight %}

These calculations actually can be used as they are to answer the first two questions.  Also, thse calculations can be used to determine how much a competitor slow down and still not be passed by the person behind them.  This is relevant in championship races where only the finishing position is relevant, such as the medal/final races in the Olympics Games.

Moving on to the last question last question:  <q>If I sustained a given pace from a given distance onward, how many places would I have gained in the results if all else stayed the same?</q>  We can do most of the calculations needed to answer this question using the code we have written already:

{% highlight python %}{% raw %}def maximum_place_improvement(max_speed, competitor_speeds, competitor_distances, competitor_distances_remaining):
    """
    The maximum number of places an entity could gain by meeting a given speed.

    Parameters:
        max_speed (float):  The maximum speed of the entity
        competitor_speeds (list|tuple):  The speeds of the competitors
        competitor_distances (list|tuple):  Distance of the competitors from the entity
        competitor_distances_remaining (list|tuple):  Distances remaining in the race for each competitor

    Returns:
        int: Number of places that can be gained at the max_speed
    """
    places = 0
    for speed, distance_delta, distance_remaining in zip(competitor_speeds, competitor_distances, competitor_distances_remaining):
        required_speed = intercept_speed(distance_delta, speed, distance_remaining)
        if required_speed > max_speed:
            break
        places += 1
    return places{% endraw %}{% endhighlight %}

This logic looks at each competitor until it finds one that the person in question cannot beat without exceeding the maximum speed that they provided.  In practice, that maximum speed would most likely be their personal best pace for the given distance, but could vary depending on how they are evaluating their performance.  Let's see an example

{% highlight python %}{% raw %}competitor_speeds = [1 / 6.0, 1 / 5.75, 1 / 5.5, 1 / 4.75]
distances_from_competitor = [50 / MILE_METERS, 125 / MILE_METERS, 250 / MILE_METERS]
competitor_distances_remaining = [(0.5 - distance) for distance in distances_from_competitor]

maximum_speed = 1 / 4.85 # 4.85 min/ mile pace
maximum_places_gained = maximum_place_improvement(maximum_speed, competitor_speeds, distances_from_competitor, competitor_distances_remaining)
print('Maximum places gained in scenario: %r' % maximum_places_gained) # Maximum places gained in scenario: 2{% endraw %}{% endhighlight %}

These scenarios are very simple to implement, have a very short execution time, and have direct applications to runners, competitors, coaches, and others.  As such, I believe that these calculations have a role in data-driven sport such as track & field, cross country, and road racing.

{% include components/heading.html heading='Conclusion' level=2 %}

A data-driven approach would make the sport among the most technologically advanced sports in the world, and be come a resource for developing new applications, developing training plans, discovering optimal competitive strategies, as well as a resource for other sports development through the distribution and application of the sport's data.

But, a data-driven sport is only the first step.  By becoming a data-driven sport, large parts of the administration of the sport can be automated through the development of new applications to minimize the costs of the administrative tasks while adding new abilities for the coaches, athletes and enthusiasts in the community.  With the recent rise of decentralized governance methods through <a href="https://en.wikipedia.org/wiki/Mechanism_design">mechanism design</a>, <a href="https://en.wikipedia.org/wiki/Decentralized_autonomous_organization"> Decentralized Autonous Organizations (DAOs)</a>, <a href="https://en.wikipedia.org/wiki/Quadratic_voting">quadratic voting</a> and other mechanisms, the governance of athletics can be re-structured to be governed by the participants of the sport at a fraction of the cost of a closed-door federation with little oversight or the best interests of the everyday athlete.  But, how that might work is a topic for another time.  I will be sure to link that post to this one as soon as it is complete.