# Adios.js

## Get started.
Script Tag, That's it.
Down the line, I'll get Treeshaking working nicely! 

## Here's the quick pitch: 
The goal behind Adios.js is in the name. The hope is you'll be able to build interactive web pages without writing any js!

## What's different?
Different is a relative word! Let's talk about the web today!
HTML is pretty limited in what it can do! From this simple fact, thousand of solutions have been built!

### Imperative Solutions: jQuery, Cashdom
  It's a very cool javascript API for modifying HTML, with a couple extras thrown in there.
  However, it can be easy to get lost in the spagettii sauce. 
    - Selectors can fall out of sync with the HTML. 
    - Lots of context switching. 
    - Casues verbose code and is quite large.

### Client side JS frameworks: React, Vue, Angular
  Ditch HTML, Viva la JS! You'll have all of the power you'll ever need.
  However, they can be limiting in other ways, you're fighting the platform!
    - You ultimately need to render to HTML, how and where has its costs.
      - Client-side: You'll need to deliver a bunch of JS, just to build some HTML.
      - SSR: You'll need to deliver a bunch of js to explain what the HTML means. (Hydration)
    - You'll also find yourself likely learning a dialect of HTML or inheriting a build process just to get a web page.
    
### HTML First Approaches: Alpine.js, Stimulus, Hyperscript, and HTMX
  Embrace HTML, Just augment it with the JS you need! 
  These solutions great and are the most similar to Adios JS, but let's talk about them breifly! 
    - Alpine.js: Vue inspired, onevents aren't HTML spec and can be quite verbose with logic.
    - Stimulus: Can be pretty verbose, onevents are even stranger, and is strongly Object oriented if that's your thing.
    - Hyperscript: Small and terse language which is evaluated clientside.
    - HTMX: Leverages HTTP within HTML for updating dom.
  These are all cool solutions, but I had some ideas which sets Adios apart.
  
### Adios.js Features
Think of it like the inverse of a JS framework. It swaps data and view with a lot of the claims.
- Hydration: You can run `$().pull()` on any HTML page using Adios.js and hydrate/update the *data*. 
- Templating: You can update the $ object and run `$().push()` to apply the data changes to your HTML.
- Self-documenting HTML: You'll never need to leave your HTML to understand what's happening with Adios.js.
- Extensible: Simple API which allows you to create your own codecs! (Html -> Data & Data -> Html);
- Customizable: Tons of ways to make Adios work for you. Change namespaces, Change resolver, etc.
- Easy to Treeshake: HTML can be used as a guide to determine what parts of Adios are being used on your page.
- Utility JS: Like Utility CSS, Utility JS allows you to use JS within HTML easily! Toggle classes, update dom, fetch data.
- No Opinions: No new syntax, build process, or language. It's the same HTML you know and love. Drop in a script tag, and you're ready!
- Lightweight: No template literals, no transpliling, no clientside rendering, no serverside rendering, 


## Principles 
- Idempotent: Running push again and again shouldn't change the html unless the data changed. Running Pull shouldn't change the data if the HTML hasn't changed.
- Isomorphic: Data should be able to be pulled from the HTML and HTML should be able to be built on that template with that data.
- Views and Behavior(onevents) should live in HTML.
- Logic and Data should live in Javascript.
- Event -> Logic -> Data Update -> View Update.


## Roadmap
- Treeshaking
- Catch undefined actions
- Catch undefined codecs
- Smarter updates (only update dom nodes where the codec uses data which has changed.)
- New Events (entrance, exit, scrollend)
- Improve Resolver ["json.data", ".class". "#id", "property", "/absolute", "http://www.url.tld"]
