---
layout: post
title:  "Compositional Data Analysis"
description: Ratios and logratios are the standard metrics for working with compositional data and are the only metrics that allow for statistical analysis of compositions.
keywords: composition,data,analysis,percentage,logratio,ratio
tags: data math python
---

{% include components/heading.html heading='Overview' level=2 %}

Compositional Data Analysis is very useful for measuring the relative values of components within a larger whole.  For example, measuring the proportions of each mineral in a rock, the proportions of each color/flavor of Skittle in a bag, or the topics in a given document.  Compositional data analysis not complicated, but I have not found a quickstart guide for doing so.  This post is intended to be that quickstart guide.

{% include components/heading.html heading='Ratios and Logratios' level=2 %}

Subcompositional coherence says that subcomposition results should be same as those from the composition.  But parts of a composition are not subcompositionally coherent.  In other words, parts parts in a subcomposition differ from those in the original composition.  For example, when analyzing time spent on daily activities, excluding sleep will result in different results than if all activities were included.

|Sleeping|Eating|Exercising|Reading|Chores|Working|
|--- |--- |--- |--- |--- |--- |
|8 hrs|1 hr|2 hrs|1 hr|2 hrs|10 hrs|


Based on a 24 hour day, the parts of the compositional compositional data would then be 

|Sleeping|Eating|Exercising|Reading|Chores|Working|
|--- |--- |--- |--- |--- |--- |
|0.333|0.04166|0.0833|0.04166|0.0833|0.4166|


But if we were were to exclude sleep from this composition, the subcomposition would be based on a 16 hour day, which would cause the relationships between the parts to be different:

|Sleeping|Eating|Exercising|Reading|Chores|Working|
|--- |--- |--- |--- |--- |--- |
||0.0625|0.125|0.0625|0.125|0.625|


Which makes the values from the subcomposition incomparable to those of the original composition.  To resolve this discrepancy, we will use ratios between proportions to compare compositional data.  Ratios respect the principle of subcompositional coherence, which is why they are fundamental to compositional data analysis.  Respecting subcompositional coherence also allows summary statistics to be taken of compositional data, as the summary statistics will be the same for subcompositions and compositions of the same data.

|Eating / Working|Exercising / Working|Reading / Working|Chores / Working|Sleeping / Working|Eating / Sleeping|Exercising / Sleeping|Reading / Sleeping|Chores / Sleeping|Working / Sleeping|
|--- |--- |--- |--- |--- |--- |--- |--- |--- |--- |
|0.1|0.2|0.1|0.2|0.8|0.125|0.25|0.125|0.25|0.125|


|Eating / Working|Exercising / Working|Reading / Working|Chores / Working|Sleeping / Working|
|--- |--- |--- |--- |--- |
|0.1|0.2|0.1|0.2|0.8|


The ratio clearly respects the subcomposition coherence.  Ratios are strictly positive values, but can range widely based on the parts they are constructed from which can result in statistical distributions where two standard deviations from the mean are well below zero.  The common approach to solving this problem is converting the ratios to logratios using a log transformation to the ratios, which addresses this issue and provides a few other benefits as well:

<ul>
*  Converts the strictly positive values  into real number than can be positive or negative, which addresses the issue of standard deviations.
*  Makes the statistical distribution symmetric
*  Reduces the effect of outliers
*  Converts the ratios into interval scale, which is key statistical computations such as means, variances, and regression models.
</ul>

{% include components/heading.html heading='Code & Usage' level=2 %}

We have covered a couple approaches for compositional data analysis.  These calculations are all self-contained, which makes them low-hanging fruit for modularing these calculations.  I have done so which resulted in the following `Composition` class for build compositional data from raw values and for efficiently computing proportions, ratios and log-ratios from raw_values.

{% highlight python linenos %}{% raw %}import math
import itertools


class Composition(object):
    """
    A class for efficiently managing/updating values for compositional data
    analysis in Python
    """
    __slots__ = ('_values', '_proportions', '_ratios', '_logratios', '_base')

    def __init__(self, raw_values, base=math.e):
        self._values = raw_values
        self._proportions = self._proportions_from_raw_values(raw_values)
        self._ratios = self._ratios_from_proportions(self._proportions)
        self._logratios = self._logratios_from_proportions(self._proportions, base=base)
        self._base = base

    def __repr__(self):
        values = []
        for key in self._values:
            values.append('%r=%r' % (key, self._values[key]))

        values = ', '.join(values)
        return '<%s %s %s>' % (self.__class__.__name__, id(self), values)

    def __setitem__(self, key, value):
        """
        Set/update the value for a key
        """
        if not isinstance(value, (int, float)):
            raise ValueError('value (%r) must be an integer or a float' % value)

        if value <= 0:
            raise ValueError('value (%r) must be > 0' % value)
        self._values[key] = value
        updated_keys = set([key])
        self._proportions = self._proportions_from_raw_values(self._values, self._proportions, updated_keys)
        self._ratios = self._ratios_from_proportions(self._proportions, self._ratios, updated_keys)
        self._logratios = self._logratios_from_proportions(self._proportions, self._ratios, updated_keys)

    def __getitem__(self, key):
        return self._values[key]

    def __delitem__(self, key):
        self.pop(key)

    def __iter__(self):
        for key in self._values:
            yield key

    def __contains__(self, key):
        return key in self._values

    def pop(self, key):
        self.proportions.pop(key)
        self._ratios.pop(key)
        self._logratios.pop(key)
        for other_key in self._ratios:
            self._ratios[other_key].pop(key)
            self._logratios[other_key].pop(key)

    def keys(self):
        return self._values.keys()

    def values(self):
        return self._values.values()

    @property
    def base(self):
        return self._base

    @base.setter
    def base(self, value):
        self._base = value
        self._logratios = self._logratios_from_proportions(self._proportions, base=value)

    @property
    def proportions(self):
        return dict(**self._proportions)

    @property
    def ratios(self):
        output = dict()
        for key in self._ratios:
            output = dict(**self._ratios[key])
        return output

    @property
    def logratios(self):
        output = dict()
        for key in self._logratios:
            output = dict(**self._logratios[key])
        return output

    def euclidean_distance(self, other, normalize=False, attributes=None):
        self_keys = set(self.keys())
        other_keys = set(other.keys())
        shared_keys = self_keys & other_keys
        if not shared_keys:
            raise ValueError('These compositions share no attributes')

        if self.base != other.base:
            raise ValueError('Compositions must use the same base in the logratios(%r != %r)' % (self.base, other.base))

        if not attributes:
            attributes = list(itertools.combinations(shared_keys, 2))

        total = 0.0
        for numerator, denominator in attributes:
            y1 = self._logratios[numerator][denominator]
            x1 = other.logratios[numerator][denominator]
            value = math.pow(y1 - x1, 2)
            total += value
        output = math.sqrt(total)
        if normalize:
            part_count = len(self._values)
            output = output / part_count
        return output

    def alr(self, denominator):
        """
        Additive Logratio (ALR) transformation
        """
        if denominator not in self:
            raise ValueError('Denominator must be a part of the composition')

        keys = list(self.keys())
        keys.remove(denominator)
        keys.sort()
        output = dict()

        for numerator in keys:
            value = self._logratios[numerator][denominator]
            output[numerator] = value
        return tuple(output)

    def clr(self):
        """
        centred logratio (CLR) transformation
        """
        geometric_mean = self.geometric_mean()
        output = dict()
        for key in self.keys():
            output[key] = math.log(self._values[key], self._base) - geometric_mean
        return output

    def geometric_mean(self):
        parts = len(self._values)
        total = 0.0
        for key in self.keys():
            total += math.log(self._values[key], self._base)
        return total / parts

    @staticmethod
    def _proportions_from_raw_values(raw_values, proportions=None, updated_keys=None):
        """
        Calculates ratios from proportions

        Parameters:
            raw_values (dict):
            proportions (dict|None):
            updated_keys (list|tuple|set):

        Returns:
            dict<object, dict>: proportions between types
        """
        keys = tuple(raw_values)
        if updated_keys:
            other_keys = updated_keys
        else:
            other_keys = keys

        total = sum(list(raw_values.values()))
        total = float(total)

        if not proportions:
            proportions = dict()

        for key in other_keys:
            proportions[key] = raw_values[key] / total
        return proportions

    @staticmethod
    def _ratios_from_proportions(proportions, ratios=None, updated_keys=None):
        """
        Calculates ratios from proportions

        Parameters:
            proportions (dict):
            ratios (dict|None):
            updated_keys (list|tuple|set):

        Returns:
            dict<object, dict>: proportions between types
        """
        keys = tuple(proportions)

        if ratios:
            for key in keys:
                ratios.setdefault(key, dict())
        else:
            ratios = dict((key, dict()) for key in keys)

        if updated_keys:
            other_keys = updated_keys
        else:
            other_keys = keys

        for key in keys:
            key_value = float(proportions[key])
            for other_key in other_keys:
                if key == other_key:
                    continue
                other_key_value = proportions[other_key]
                ratios[key][other_key] = key_value / other_key_value
                ratios[other_key][key] = other_key_value / key_value
        return ratios

    @staticmethod
    def _logratios_from_proportions(proportions, logratios=None, updated_keys=None, base=10):
        """
        Calculates logratios from proportions

        Parameters:
            proportions (dict):
            ratios (dict|None):
            updated_keys (list|tuple|set):

        Returns:
            dict<object, dict>: proportions between types
        """
        keys = tuple(proportions)
        if updated_keys:
            other_keys = updated_keys
        else:
            other_keys = keys

        if logratios:
            for key in keys:
                logratios.setdefault(key, dict())
        else:
            logratios = dict((key, dict()) for key in keys)

        for key in keys:
            key_value = float(proportions[key])
            for other_key in other_keys:
                if key == other_key:
                    continue
                other_key_value = proportions[other_key]
                logratios[key][other_key] = math.log(key_value / other_key_value, base)
        return logratios


if __name__ == '__main__':
    asparagus = dict(carbohydrate=61.07, fat=3.27, protein=35.66)
    compositional_asparagus = Composition(asparagus)

    beans = dict(carbohydrate=35.88, fat=22.07, protein=42.05)
    compositional_beans = Composition(beans)
    euclidean_distance = compositional_asparagus.euclidean_distance(compositional_beans)
    print(euclidean_distance){% endraw %}{% endhighlight %}


This implementation also allows computation of additive logratios (ALRs), centered logratios (CLRs), and logratio euclidean distance between compositions with the same parts.  It also allows compositions to be updated over time by updating the raw_value of a part, and adding/removing parts to create sub-compositions as needed.

The Composition class has a number of helper method implemented to make interacting with the Composition instance easier.

{% highlight python %}{% raw %}asparagus = dict(carbohydrate=61.07, fat=3.27, protein=35.66)
compositional_asparagus = Composition(asparagus)
# check if a composition has a given part
'iron' in compositional_asparagus

#iterate over the parts in the composition
for part in compositional_asparagus:
    print(part)
    print('proportion of %r: %r' % (part, compositional_asparagus.proportions[part]))
    print('ratios of %r: %r' % (part, compositional_asparagus.ratios[part]))
    print('logratios (base %r) of %r: %r' % (compositional_asparagus.base, part, compositional_asparagus.logratios[part])){% endraw %}{% endhighlight %}

This application contains a test of the functionality, in the form of food macronutrient composition.  In the example, a dictionary of the macronutrients are passed in as arguments to the Composition class in their raw units (grams).  The composition class takes these raw values and calculates the proportions, rations and logratios.  The developer can also specify the base for the logratios, but it defaults to \( e \) as it is the most commonly used base for logratios. To update the logratios of an existing Composition instance, update `base` attribute:

{% highlight python %}{% raw %}asparagus = dict(carbohydrate=61.07, fat=3.27, protein=35.66)
compositional_asparagus = Composition(asparagus)
compositional_asparagus.base = 10{% endraw %}{% endhighlight %}

which will automatically update the logratios.

The developer can optionally add/update any part of the composition using the `__setitem__ (self, key)` method.  For example, if we wanted to update the amount of protein in asparagus:

{% highlight python %}{% raw %}asparagus = dict(carbohydrate=61.07, fat=3.27, protein=35.66)
compositional_asparagus = Composition(asparagus)
compositional_asparagus['protein'] = 30{% endraw %}{% endhighlight %}

One thing to note, is that raw values should be non-zero values, as zero values can result in `DivideByZero` errors when creating the ratios and logratios.  If a zero-value is necessary, I would recommend using an extremely small positive value instead, like `1e-28`.

Parts can be removed using the `__delitem__(self, key)` or `pop(self, key)` methods to create subcompositions.

{% highlight python %}{% raw %}asparagus = dict(carbohydrate=61.07, fat=3.27, protein=35.66)
compositional_asparagus = Composition(asparagus)
del compositional_asparagus['protein']{% endraw %}{% endhighlight %}

Any changes made using `__setitem__`, `pop`, or `__delitem__` will automatically be reflected in the ratios and logratios.

{% include components/heading.html heading='Conclusion and Further Reading' level=2 %}

We have gone over the basic components of why you should use ratios and logratios over proportions, and presented a simple wrapper for managing this conversion.  While this class does not provide analytical tools such as regression, it provides an interface by which to feed the data into regression models.  I believe that model could refined or combined with other tools to create a more comprehensive interface for compositional data analysis, but I hope it provides a good start.

For more information on compositional data analysis, see:

*  [Compositional data](https://en.wikipedia.org/wiki/Compositional_data)
*  [A Concise Guide to Compositional Data Analysis](http://www.leg.ufpr.br/lib/exe/fetch.php/pessoais:abtmartins:a_concise_guide_to_compositional_data_analysis.pdf)
*  [CoDa](http://www.compositionaldata.com/)
*  [Isometric Logratio Transformations for Compositional Data Analysis](https://link.springer.com/article/10.1023/A:1023818214614)
*  [Compositional Data Analysis in Practice](https://www.amazon.com/Compositional-Analysis-Practice-Interdisciplinary-Statistics/dp/1138316431)
