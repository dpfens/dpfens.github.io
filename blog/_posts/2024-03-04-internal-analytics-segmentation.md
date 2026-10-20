---
layout: post
title:  "Segmenting internal users on an external site"
description: A method for identifying internal users on an external site using VPN access
keywords: web analytics,segmentation,internal,external,vpn
tags: typescript analytics corporate

introduction: A technique for identifying internal users on a site without authentication, or on an external site
---

In a former position, the web team for the public-facing website was having trouble determining which content was being consumed to employees vs external users because there was no login for the external site by which to set a userID in the analytics platform, and there was no way to tell if the user was using the VPN.

I came up with a solution to this problem by setting up a simple `/ping` URL on the internal network.  This works by 

1.  User arrives at the external website
2.  The browser sends a `HEAD` request to our `internal.example.com/ping` URL
3.  Check `HEAD` HTTP status code:
    * If a 404 then the user is off the VPN
    * If not a 404, the user is on the VPN and therefore must be an employee

Non-employees will never have internal credentials, and thus will never login, so our `/ping` request will always fail for non-users.  But, this doesn't account for if the user/visitor is an employee, but simply didn't bother to get on the VPN. To solve for this, we can store the result of the `/ping` check in `LocalStorage` as a `userType` key.  Then, if a visitor returns, we can check the `userType`

{% highlight typescript linenos %}{% raw %}
type UserType = 'Anonymous' | 'Internal'
const internalUserType: UserType = 'Internal';
const defaultUserType: UserType = 'Anonymous'; // we don't know what kind of user they are
let userType: UserType = LocalStorage.getItem('userType') || defaultUserType;
if (usertype !== internalUserType) {
  // check userType via `/ping` request
  if (pingRequestStatusCode !== 404) {
    userType = internalUserType;
  }
}
// set userType dimension in Google Analytics, etc.
{% endraw %}{% endhighlight %}

This ensures that once someone has gone to the website after having connected to the VPN, all future visits/action will be recorded as having been from an employee / internal user.

This has a couple benefits:

1.  It's a quick test.  `HEAD` requests are typically very fast
2.  It's privacy preserving.  No personal data is transferred openly and no data needs to be sent in the response, as the success of the HTTP call is the test itself.

This is not perfect, it has an imperfection: If the user clears their cache, uses another browser, or an incognito window we lose the caching of our check, so we have to re-execute our check, resulting a very short delay in recorded the page view/action accurately.


Here is an abbreviated version of the script

{% highlight typescript linenos %}{% raw %}
const defaultUserType = 'Anonymous',
      internalUserType = 'Internal';
function pingUserType(url: string, callbackFn: ()) {
    /**
     * Pings the specified URL, and stores last result in localStorage,
     * if possible. If localStorage cache is marked as an internal user,
     * will send to Matomo without ping re-verification.
     **/
    const pingKey = 'userType';
    let userType: 'Anonymous' | 'Internal' = defaultUserType;

    // check localStorage cache (previous pings) for userType, if possible
    if ("localStorage" in window) {
        let storedUserType = localStorage.getItem(pingKey) || defaultUserType;
        // Only allow known values
        if (storedUserType !== internalUserType && storedUserType !== defaultUserType) {
            storedUserType = defaultUserType;
        }
        userType = storedUserType;
    }

    // if identified as internal from localStorage cache, record as internal
    if (userType === internalUserType) {
        recordUserType(userType);
        return;
    }

    // use ping URL to attempt to determine user type
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            var isSuccess = this.status !== 404;
            if (isSuccess) {
                userType = internalUserType;
            }
            recordUserType(userType);
        }
    };

    // consider a timeout to be an unsuccessful attempt
    xhr.ontimeout = function() {
        recordUserType(userType);
    };
    xhr.timeout = 500;
    xhr.open('GET', url, true);
    xhr.send();

    function recordUserType(userType) {
        // Only allow known values
        if (userType !== internalUserType) {
            userType = defaultUserType;
        }
        localStorage.setItem(pingKey, userType);
        callbackFn(userType);
    }
}
{% endraw %}{% endhighlight %}

We eventually went with this approach to ensure the code for tracking was consolidated in a single function.  And is used simply like this:

{% highlight typescript linenos %}{% raw %}
pingUserType('https://internal.example.com/ping/', function(userType) {
  gtag('set', 'user_properties', {'userType': userType});
  // record page view that will be associated with the user type
  gtag('event', 'page_type', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname
  });
});
{% endraw %}{% endhighlight %}

Abstractly, this approach could be taken for any attribute.  The `ping` URL doesn't need to be internal, it could be a URL of a different domain entirely to test for an entirely different attribute.