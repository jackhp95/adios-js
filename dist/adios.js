// super light lodash replacements

const kebabCase = (str) =>
  str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const camelCase = (str) => str.replace(/-./g, (m) => m.toUpperCase()[1]);

const intersection = (a, ...arr) =>
  [...new Set(a)].filter((v) => arr.every((b) => b.includes(v)));

const get = (obj, path) =>
  path.split(".").reduce((acc, c) => acc && acc[c], obj);

const set = (obj, path, value) =>
  path
    .split(".")
    .reduce(
      (acc = {}, c, i, { length }) =>
        i + 1 === length ? (acc[c] = value) : c in acc ? acc[c] : (acc[c] = {}),
      obj
    );

const isElement = (el) => el instanceof Element || el instanceof HTMLDocument;

const cloneDeep = (obj, hash = new WeakMap()) => {
  if (Object(obj) !== obj) return obj; // primitives
  if (hash.has(obj)) return hash.get(obj); // cyclic reference
  const result =
    obj instanceof Set
      ? new Set(obj) // See note about this!
      : obj instanceof Map
      ? new Map(Array.from(obj, ([key, val]) => [key, cloneDeep(val, hash)]))
      : obj instanceof Date
      ? new Date(obj)
      : obj instanceof RegExp
      ? new RegExp(obj.source, obj.flags)
      : // ... add here any specific treatment for other classes ...
      // and finally a catch-all:
      obj.constructor
      ? new obj.constructor()
      : Object.create(null);
  hash.set(obj, result);
  return Object.assign(
    result,
    ...Object.keys(obj).map((key) => ({ [key]: cloneDeep(obj[key], hash) }))
  );
};
const isString = (str) => typeof str === "string" || str instanceof String;

const isObject = (item) =>
  item && typeof item === "object" && !Array.isArray(item);

const merge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        merge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return merge(target, ...sources);
};

const withDefault = (maybe, fallback) =>
  maybe === undefined ? fallback : maybe;

const identity = (x) => x;

/*
 * 	Observable Slim
 *	Version 0.1.5
 * 	https://github.com/elliotnb/observable-slim
 *
 * 	Licensed under the MIT license:
 * 	http://www.opensource.org/licenses/MIT
 *
 *	Observable Slim is a singleton that allows you to observe changes made to an object and any nested
 *	children of that object. It is intended to assist with one-way data binding, that is, in MVC parlance,
 *	reflecting changes in the model to the view. Observable Slim aspires to be as lightweight and easily
 *	understood as possible. Minifies down to roughly 3000 characters.
 */
function prox () {
  // An array that stores all of the observables created through the public create() method below.
  var observables = [];
  // An array of all the objects that we have assigned Proxies to
  var targets = [];

  // An array of arrays containing the Proxies created for each target object. targetsProxy is index-matched with
  // 'targets' -- together, the pair offer a Hash table where the key is not a string nor number, but the actual target object
  var targetsProxy = [];

  // this variable tracks duplicate proxies assigned to the same target.
  // the 'set' handler below will trigger the same change on all other Proxies tracking the same target.
  // however, in order to avoid an infinite loop of Proxies triggering and re-triggering one another, we use dupProxy
  // to track that a given Proxy was modified from the 'set' handler
  var dupProxy = null;

  var _getProperty = (obj, path) => {
    return path.split(".").reduce((prev, curr) => {
      return prev ? prev[curr] : undefined;
    }, obj || self);
  };

  /*	Function: _create
				Private internal function that is invoked to create a new ES6 Proxy whose changes we can observe through
				the Observerable.observe() method.

			Parameters:
				target 				- required, plain JavaScript object that we want to observe for changes.
				domDelay 			- batch up changes on a 10ms delay so a series of changes can be processed in one DOM update.
				originalObservable 	- object, the original observable created by the user, exists for recursion purposes,
									  allows one observable to observe change on any nested/child objects.
				originalPath 		- array of objects, each object having the properties 'target' and 'property' -- target referring to the observed object itself
									  and property referring to the name of that object in the nested structure. the path of the property in relation to the target 
									  on the original observable, exists for recursion purposes, allows one observable to observe change on any nested/child objects. 

			Returns:
				An ES6 Proxy object.
	*/
  var _create = (target, originalObservable, originalPath) => {
    var observable = originalObservable || null;

    // record the nested path taken to access this object -- if there was no path then we provide the first empty entry
    var path = originalPath || [{ target: target, property: "" }];

    // in order to accurately report the "previous value" of the "length" property on an Array
    // we must use a helper property because intercepting a length change is not always possible as of 8/13/2018 in
    // Chrome -- the new `length` value is already set by the time the `set` handler is invoked
    if (target instanceof Array) target.__length = target.length;

    var changes = [];

    /*	Function: _getPath
				Returns a string of the nested path (in relation to the top-level observed object)
				of the property being modified or deleted.
			Parameters:
				target - the object whose property is being modified or deleted.
				property - the string name of the property
				jsonPointer - optional, set to true if the string path should be formatted as a JSON pointer.

			Returns:
				String of the nested path (e.g., hello.testing.1.bar or, if JSON pointer, /hello/testing/1/bar
		*/
    var _getPath = (target, property, jsonPointer) => {
      var fullPath = "";
      var lastTarget = null;

      // loop over each item in the path and append it to full path
      for (var i = 0; i < path.length; i++) {
        // if the current object was a member of an array, it's possible that the array was at one point
        // mutated and would cause the position of the current object in that array to change. we perform an indexOf
        // lookup here to determine the current position of that object in the array before we add it to fullPath
        if (lastTarget instanceof Array && !isNaN(path[i].property)) {
          path[i].property = lastTarget.indexOf(path[i].target);
        }

        fullPath = fullPath + "." + path[i].property;
        lastTarget = path[i].target;
      }

      // add the current property
      fullPath = fullPath + "." + property;

      // remove the beginning two dots -- ..foo.bar becomes foo.bar (the first item in the nested chain doesn't have a property name)
      fullPath = fullPath.substring(2);

      if (jsonPointer === true) fullPath = "/" + fullPath.replace(/\./g, "/");

      return fullPath;
    };

    var _notifyObservers = (numChanges) => {
      // if the observable is paused, then we don't want to execute any of the observer functions
      //   if (observable.paused === true) return;

      // execute observer functions on a 10ms settimeout, this prevents the observer functions from being executed
      // separately on every change -- this is necessary because the observer functions will often trigger UI updates
	  // was !!requestIdleCallback, but safari is too fickle.
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(() => {
          if (numChanges === changes.length) {
            // we create a copy of changes before passing it to the observer functions because even if the observer function
            // throws an error, we still need to ensure that changes is reset to an empty array so that old changes don't persist
            var changesCopy = [...changes];
            changes = [];

            // invoke any functions that are observing changes
            observable.observers.forEach((fn) => fn(changesCopy));
          }
        });
      } else {
        // we create a copy of changes before passing it to the observer functions because even if the observer function
        // throws an error, we still need to ensure that changes is reset to an empty array so that old changes don't persist
        var changesCopy = [...changes];
        changes = [];

        // invoke any functions that are observing changes
		observable.observers.forEach((fn) => fn(changesCopy));
      }
    };

    var handler = {
      get: (target, property) => {
        // implement a simple check for whether or not the object is a proxy, this helps the .create() method avoid
        // creating Proxies of Proxies.
        if (property === "__getTarget") {
          return target;
        } else if (property === "__isProxy") {
          return true;
          // from the perspective of a given observable on a parent object, return the parent object of the given nested object
        } else if (property === "__getParent") {
          return (i) => {
            if (typeof i === "undefined") var i = 1;
            var parentPath = _getPath(target, "__getParent").split(".");
            parentPath.splice(-(i + 1), i + 1);
            return _getProperty(observable.parentProxy, parentPath.join("."));
          };
          // return the full path of the current object relative to the parent observable
        } else if (property === "__getPath") {
          // strip off the 12 characters for ".__getParent"
          var parentPath = _getPath(target, "__getParent");
          return parentPath.slice(0, -12);
        }

        // for performance improvements, we assign this to a variable so we do not have to lookup the property value again
        var targetProp = target[property];
        if (
          target instanceof Date &&
          targetProp instanceof Function &&
          targetProp !== null
        ) {
          return targetProp.bind(target);
        }

        // if we are traversing into a new object, then we want to record path to that object and return a new observable.
        // recursively returning a new observable allows us a single Observable.observe() to monitor all changes on
        // the target object and any objects nested within.
        if (
          targetProp instanceof Object &&
          targetProp !== null &&
          target.hasOwnProperty(property)
        ) {
          // if we've found a proxy nested on the object, then we want to retrieve the original object behind that proxy
          if (targetProp.__isProxy === true)
            targetProp = targetProp.__getTarget;

          // if the object accessed by the user (targetProp) already has a __targetPosition AND the object
          // stored at target[targetProp.__targetPosition] is not null, then that means we are already observing this object
          // we might be able to return a proxy that we've already created for the object
          if (
            targetProp.__targetPosition > -1 &&
            targets[targetProp.__targetPosition] !== null
          ) {
            // loop over the proxies that we've created for this object
            var ttp = targetsProxy[targetProp.__targetPosition];
            for (var i = 0, l = ttp.length; i < l; i++) {
              // if we find a proxy that was setup for this particular observable, then return that proxy
              if (observable === ttp[i].observable) {
                return ttp[i].proxy;
              }
            }
          }

          // if we're arrived here, then that means there is no proxy for the object the user just accessed, so we
          // have to create a new proxy for it

          // create a shallow copy of the path array -- if we didn't create a shallow copy then all nested objects would share the same path array and the path wouldn't be accurate
          var newPath = [...path];
          newPath.push({ target: targetProp, property: property });
          return _create(targetProp, observable, newPath);
        } else {
          return targetProp;
        }
      },
      deleteProperty: (target, property) => {
        // was this change an original change or was it a change that was re-triggered below
        var originalChange = true;
        if (dupProxy === proxy) {
          originalChange = false;
          dupProxy = null;
        }

        // in order to report what the previous value was, we must make a copy of it before it is deleted
        var previousValue = Object.assign({}, target);

        // record the deletion that just took place
        changes.push({
          type: "delete",
          target: target,
          property: property,
          newValue: null,
          previousValue: previousValue[property],
          currentPath: _getPath(target, property),
          jsonPointer: _getPath(target, property, true),
          proxy: proxy,
        });

        if (originalChange === true) {
          // perform the delete that we've trapped if changes are not paused for this observable
          if (!observable.changesPaused) delete target[property];

          for (var a = 0, l = targets.length; a < l; a++)
            if (target === targets[a]) break;

          // loop over each proxy and see if the target for this change has any other proxies
          var currentTargetProxy = targetsProxy[a] || [];

          var b = currentTargetProxy.length;
          while (b--) {
            // if the same target has a different proxy
            if (currentTargetProxy[b].proxy !== proxy) {
              // !!IMPORTANT!! store the proxy as a duplicate proxy (dupProxy) -- this will adjust the behavior above appropriately (that is,
              // prevent a change on dupProxy from re-triggering the same change on other proxies)
              dupProxy = currentTargetProxy[b].proxy;

              // make the same delete on the different proxy for the same target object. it is important that we make this change *after* we invoke the same change
              // on any other proxies so that the previousValue can show up correct for the other proxies
              delete currentTargetProxy[b].proxy[property];
            }
          }
        }

        _notifyObservers(changes.length);

        return true;
      },
      set: (target, property, value, receiver) => {
        // if the value we're assigning is an object, then we want to ensure
        // that we're assigning the original object, not the proxy, in order to avoid mixing
        // the actual targets and proxies -- creates issues with path logging if we don't do this
        if (value && value.__isProxy) value = value.__getTarget;

        // was this change an original change or was it a change that was re-triggered below
        var originalChange = true;
        if (dupProxy === proxy) {
          originalChange = false;
          dupProxy = null;
        }

        // improve performance by saving direct references to the property
        var targetProp = target[property];

        // Only record this change if:
        // 	1. the new value differs from the old one
        //	2. OR if this proxy was not the original proxy to receive the change
        // 	3. OR the modified target is an array and the modified property is "length" and our helper property __length indicates that the array length has changed
        //
        // Regarding #3 above: mutations of arrays via .push or .splice actually modify the .length before the set handler is invoked
        // so in order to accurately report the correct previousValue for the .length, we have to use a helper property.
        if (
          targetProp !== value ||
          originalChange === false ||
          (property === "length" &&
            target instanceof Array &&
            target.__length !== value)
        ) {
          var foundObservable = true;

          var typeOfTargetProp = typeof targetProp;

          // determine if we're adding something new or modifying somethat that already existed
          var type = "update";
          if (typeOfTargetProp === "undefined") type = "add";

          // store the change that just occurred. it is important that we store the change before invoking the other proxies so that the previousValue is correct
          changes.push({
            type: type,
            target: target,
            property: property,
            newValue: value,
            previousValue: receiver[property],
            currentPath: _getPath(target, property),
            jsonPointer: _getPath(target, property, true),
            proxy: proxy,
          });

          // mutations of arrays via .push or .splice actually modify the .length before the set handler is invoked
          // so in order to accurately report the correct previousValue for the .length, we have to use a helper property.
          if (
            property === "length" &&
            target instanceof Array &&
            target.__length !== value
          ) {
            changes[changes.length - 1].previousValue = target.__length;
            target.__length = value;
          }

          // !!IMPORTANT!! if this proxy was the first proxy to receive the change, then we need to go check and see
          // if there are other proxies for the same project. if there are, then we will modify those proxies as well so the other
          // observers can be modified of the change that has occurred.
          if (originalChange === true) {
            // because the value actually differs than the previous value
            // we need to store the new value on the original target object,
            // but only as long as changes have not been paused
            if (!observable.changesPaused) target[property] = value;

            foundObservable = false;

            var targetPosition = target.__targetPosition;
            var z = targetsProxy[targetPosition].length;

            // find the parent target for this observable -- if the target for that observable has not been removed
            // from the targets array, then that means the observable is still active and we should notify the observers of this change
            while (z--) {
              if (observable === targetsProxy[targetPosition][z].observable) {
                if (
                  targets[
                    targetsProxy[targetPosition][z].observable.parentTarget
                      .__targetPosition
                  ] !== null
                ) {
                  foundObservable = true;
                  break;
                }
              }
            }

            // if we didn't find an observable for this proxy, then that means .remove(proxy) was likely invoked
            // so we no longer need to notify any observer function about the changes, but we still need to update the
            // value of the underlying original objectm see below: target[property] = value;
            if (foundObservable) {
              // loop over each proxy and see if the target for this change has any other proxies
              var currentTargetProxy = targetsProxy[targetPosition];
              for (var b = 0, l = currentTargetProxy.length; b < l; b++) {
                // if the same target has a different proxy
                if (currentTargetProxy[b].proxy !== proxy) {
                  // !!IMPORTANT!! store the proxy as a duplicate proxy (dupProxy) -- this will adjust the behavior above appropriately (that is,
                  // prevent a change on dupProxy from re-triggering the same change on other proxies)
                  dupProxy = currentTargetProxy[b].proxy;

                  // invoke the same change on the different proxy for the same target object. it is important that we make this change *after* we invoke the same change
                  // on any other proxies so that the previousValue can show up correct for the other proxies
                  currentTargetProxy[b].proxy[property] = value;
                }
              }

              // if the property being overwritten is an object, then that means this observable
              // will need to stop monitoring this object and any nested objects underneath the overwritten object else they'll become
              // orphaned and grow memory usage. we excute this on a setTimeout so that the clean-up process does not block
              // the UI rendering -- there's no need to execute the clean up immediately
              requestAnimationFrame(() =>
                setTimeout(() => {
                  if (typeOfTargetProp === "object" && targetProp !== null) {
                    // check if the to-be-overwritten target property still exists on the target object
                    // if it does still exist on the object, then we don't want to stop observing it. this resolves
                    // an issue where array .sort() triggers objects to be overwritten, but instead of being overwritten
                    // and discarded, they are shuffled to a new position in the array
                    var keys = Object.keys(target);
                    for (var i = 0, l = keys.length; i < l; i++) {
                      if (target[keys[i]] === targetProp) return;
                    }

                    var stillExists = false;

                    // now we perform the more expensive search recursively through the target object.
                    // if we find the targetProp (that was just overwritten) still exists somewhere else
                    // further down in the object, then we still need to observe the targetProp on this observable.
                    (function iterate(target) {
                      var keys = Object.keys(target);
                      for (var i = 0, l = keys.length; i < l; i++) {
                        var property = keys[i];
                        var nestedTarget = target[property];

                        if (
                          nestedTarget instanceof Object &&
                          nestedTarget !== null
                        )
                          iterate(nestedTarget);
                        if (nestedTarget === targetProp) {
                          stillExists = true;
                          return;
                        }
                      }
                    })(target);

                    // even though targetProp was overwritten, if it still exists somewhere else on the object,
                    // then we don't want to remove the observable for that object (targetProp)
                    if (stillExists === true) return;

                    // loop over each property and recursively invoke the `iterate` function for any
                    // objects nested on targetProp
                    (function iterate(obj) {
                      var keys = Object.keys(obj);
                      for (var i = 0, l = keys.length; i < l; i++) {
                        var objProp = obj[keys[i]];
                        if (objProp instanceof Object && objProp !== null)
                          iterate(objProp);
                      }

                      // if there are any existing target objects (objects that we're already observing)...
                      var c = -1;
                      for (var i = 0, l = targets.length; i < l; i++) {
                        if (obj === targets[i]) {
                          c = i;
                          break;
                        }
                      }
                      if (c > -1) {
                        // ...then we want to determine if the observables for that object match our current observable
                        var currentTargetProxy = targetsProxy[c];
                        var d = currentTargetProxy.length;

                        while (d--) {
                          // if we do have an observable monitoring the object thats about to be overwritten
                          // then we can remove that observable from the target object
                          if (observable === currentTargetProxy[d].observable) {
                            currentTargetProxy.splice(d, 1);
                            break;
                          }
                        }

                        // if there are no more observables assigned to the target object, then we can remove
                        // the target object altogether. this is necessary to prevent growing memory consumption particularly with large data sets
                        if (currentTargetProxy.length == 0) {
                          // targetsProxy.splice(c,1);
                          targets[c] = null;
                        }
                      }
                    })(targetProp);
                  }
                }, 0)
              );
            }

            // TO DO: the next block of code resolves test case #29, but it results in poor IE11 performance with very large objects.
            // UPDATE: need to re-evaluate IE11 performance due to major performance overhaul from 12/23/2018.
            //
            // if the value we've just set is an object, then we'll need to iterate over it in order to initialize the
            // observers/proxies on all nested children of the object
            /* if (value instanceof Object && value !== null) {
							(function iterate(proxy) {
								var target = proxy.__getTarget;
								var keys = Object.keys(target);
								for (var i = 0, l = keys.length; i < l; i++) {
									var property = keys[i];
									if (target[property] instanceof Object && target[property] !== null) iterate(proxy[property]);
								};
							})(proxy[property]);
						}; */
          }

          if (foundObservable) {
            // notify the observer functions that the target has been modified
            _notifyObservers(changes.length);
          }
        }
        return true;
      },
    };

    var __targetPosition = target.__targetPosition;
    if (!(__targetPosition > -1)) {
      Object.defineProperty(target, "__targetPosition", {
        value: targets.length,
        writable: false,
        enumerable: false,
        configurable: false,
      });
    }

    // create the proxy that we'll use to observe any changes
    var proxy = new Proxy(target, handler);

    // we don't want to create a new observable if this function was invoked recursively
    if (observable === null) {
      observable = {
        parentTarget: target,
        parentProxy: proxy,
        observers: [],
        paused: false,
        path: path,
        changesPaused: false,
      };
      observables.push(observable);
    }

    // store the proxy we've created so it isn't re-created unnecessairly via get handler
    var proxyItem = { target: target, proxy: proxy, observable: observable };

    // if we have already created a Proxy for this target object then we add it to the corresponding array
    // on targetsProxy (targets and targetsProxy work together as a Hash table indexed by the actual target object).
    if (__targetPosition > -1) {
      // the targets array is set to null for the position of this particular object, then we know that
      // the observable was removed some point in time for this object -- so we need to set the reference again
      if (targets[__targetPosition] === null) {
        targets[__targetPosition] = target;
      }

      targetsProxy[__targetPosition].push(proxyItem);

      // else this is a target object that we had not yet created a Proxy for, so we must add it to targets,
      // and push a new array on to targetsProxy containing the new Proxy
    } else {
      targets.push(target);
      targetsProxy.push([proxyItem]);
    }

    return proxy;
  };

  return {
    /*	Method:
				Public method that is invoked to create a new ES6 Proxy whose changes we can observe
				through the Observerable.observe() method.

			Parameters
				target - Object, required, plain JavaScript object that we want to observe for changes.
				domDelay - Boolean, required, if true, then batch up changes on a 10ms delay so a series of changes can be processed in one DOM update.
				observer - Function, optional, will be invoked when a change is made to the proxy.

			Returns:
				An ES6 Proxy object.
		*/
    create: function (target, observer) {
      // test if the target is a Proxy, if it is then we need to retrieve the original object behind the Proxy.
      // we do not allow creating proxies of proxies because -- given the recursive design of ObservableSlim -- it would lead to sharp increases in memory usage
      if (target.__isProxy === true) {
        var target = target.__getTarget;
        //if it is, then we should throw an error. we do not allow creating proxies of proxies
        // because -- given the recursive design of ObservableSlim -- it would lead to sharp increases in memory usage
        //throw new Error("ObservableSlim.create() cannot create a Proxy for a target object that is also a Proxy.");
      }

      // fire off the _create() method -- it will create a new observable and proxy and return the proxy
      var proxy = _create(target);

      // assign the observer function
      if (typeof observer === "function") this.observe(proxy, observer);

      // recursively loop over all nested objects on the proxy we've just created
      // this will allow the top observable to observe any changes that occur on a nested object
      (function iterate(proxy) {
        var target = proxy.__getTarget;
        var keys = Object.keys(target);
        for (var i = 0, l = keys.length; i < l; i++) {
          var property = keys[i];
          if (target[property] instanceof Object && target[property] !== null)
            iterate(proxy[property]);
        }
      })(proxy);

      return proxy;
    },

    /*	Method: observe
				This method is used to add a new observer function to an existing proxy.

			Parameters:
				proxy 	- the ES6 Proxy returned by the create() method. We want to observe changes made to this object.
				observer 	- this function will be invoked when a change is made to the observable (not to be confused with the
							  observer defined in the create() method).

			Returns:
				Nothing.
		*/
    observe: (proxy, observer) => {
      // loop over all the observables created by the _create() function
      var i = observables.length;
      while (i--) {
        if (observables[i].parentProxy === proxy) {
          observables[i].observers.push(observer);
          break;
        }
      }
    },

    // /*	Method: pause
    // 		This method will prevent any observer functions from being invoked when a change occurs to a proxy.

    // 	Parameters:
    // 		proxy 	- the ES6 Proxy returned by the create() method.
    // */
    // pause: (proxy) => {
    // 	var i = observables.length;
    // 	var foundMatch = false;
    // 	while (i--) {
    // 		if (observables[i].parentProxy === proxy) {
    // 			observables[i].paused = true;
    // 			foundMatch = true;
    // 			break;
    // 		}
    // 	};

    // 	if (foundMatch == false) throw new Error("ObseravableSlim could not pause observable -- matching proxy not found.");
    // },

    // /*	Method: resume
    // 		This method will resume execution of any observer functions when a change is made to a proxy.

    // 	Parameters:
    // 		proxy 	- the ES6 Proxy returned by the create() method.
    // */
    // resume: (proxy) => {
    // 	var i = observables.length;
    // 	var foundMatch = false;
    // 	while (i--) {
    // 		if (observables[i].parentProxy === proxy) {
    // 			observables[i].paused = false;
    // 			foundMatch = true;
    // 			break;
    // 		}
    // 	};

    // 	if (foundMatch == false) throw new Error("ObseravableSlim could not resume observable -- matching proxy not found.");
    // },

    // /*	Method: pauseChanges
    // 		This method will prevent any changes (i.e., set, and deleteProperty) from being written to the target
    // 		object.  However, the observer functions will still be invoked to let you know what changes WOULD have
    // 		been made.  This can be useful if the changes need to be approved by an external source before the
    // 		changes take effect.

    // 	Parameters:
    // 		proxy	- the ES6 Proxy returned by the create() method.
    //  */
    // pauseChanges: (proxy)=> {
    // 	var i = observables.length;
    // 	var foundMatch = false;
    // 	while (i--) {
    // 		if (observables[i].parentProxy === proxy) {
    // 			observables[i].changesPaused = true;
    // 			foundMatch = true;
    // 			break;
    // 		}
    // 	};

    // 	if (foundMatch == false) throw new Error("ObseravableSlim could not pause changes on observable -- matching proxy not found.");
    // },

    // /*	Method: resumeChanges
    // 		This method will resume the changes that were taking place prior to the call to pauseChanges().

    // 	Parameters:
    // 		proxy	- the ES6 Proxy returned by the create() method.
    //  */
    // resumeChanges: (proxy)=> {
    // 	var i = observables.length;
    // 	var foundMatch = false;
    // 	while (i--) {
    // 		if (observables[i].parentProxy === proxy) {
    // 			observables[i].changesPaused = false;
    // 			foundMatch = true;
    // 			break;
    // 		}
    // 	};

    // 	if (foundMatch == false) throw new Error("ObseravableSlim could not resume changes on observable -- matching proxy not found.");
    // },

    // /*	Method: remove
    // 		This method will remove the observable and proxy thereby preventing any further callback observers for
    // 		changes occuring to the target object.

    // 	Parameters:
    // 		proxy 	- the ES6 Proxy returned by the create() method.
    // */
    // remove: (proxy) => {

    // 	var matchedObservable = null;
    // 	var foundMatch = false;

    // 	var c = observables.length;
    // 	while (c--) {
    // 		if (observables[c].parentProxy === proxy) {
    // 			matchedObservable = observables[c];
    // 			foundMatch = true;
    // 			break;
    // 		}
    // 	};

    // 	var a = targetsProxy.length;
    // 	while (a--) {
    // 		var b = targetsProxy[a].length;
    // 		while (b--) {
    // 			if (targetsProxy[a][b].observable === matchedObservable) {
    // 				targetsProxy[a].splice(b,1);

    // 				// if there are no more proxies for this target object
    // 				// then we null out the position for this object on the targets array
    // 				// since we are essentially no longer observing this object.
    // 				// we do not splice it off the targets array, because if we re-observe the same
    // 				// object at a later time, the property __targetPosition cannot be redefined.
    // 				if (targetsProxy[a].length === 0) {
    // 					targets[a] = null;
    // 				};
    // 			}
    // 		};
    // 	};

    // 	if (foundMatch === true) {
    // 		observables.splice(c,1);
    // 	}
    // }
  };
}

/**
 * Codec
 * @typedef {Object} Codec
 * @property {Function} push -
 * @property {Function} pull -
 */

/**
 * This function will take any string of a property,
 * and return a codec for the property.
 *
 * @param {string} name - Name of the property
 * @returns {codec} - the codec object
 */
const prop = (name) => ({
  push: (el, val) => () => (el[name] = val),
  pull: (el) => el[name] || undefined,
});

const each = (me) => ({
  push: (el, val = {}) => {
    // console.log(el, val);
    const rootPath = el.dataset.each;
    // the filter function prevents __internal fields from being exposed
    const items = Object.keys(val).filter((s) => !/^__/.exec(s));
    const clone = () => el.content.firstElementChild.cloneNode(true);
    const parent = el.parentElement;
    const siblings = () => [...parent.children].filter((x) => x !== el);

    const [children, closures] = items
      .map((k) => {
        const child = clone();
        // don't forget to include the child itself, it's skipped in the querySelectorAll
        const binds = [child, ...child.querySelectorAll(me.util.selectors())];
        const asClosures = (ele) =>
          Object.entries(ele.dataset)
            .filter(([_codec, itemPath]) =>
              Object.keys(me.codecs).includes(_codec)
            )
            .flatMap(([_codec, itemPath]) => {
              // console.log("Pushing:", _codec, itemPath);
              //  if escaping scope
              const newPath = itemPath.startsWith("~")
                ? // then remove ~ so resolver works
                  itemPath.substring(1)
                : // otherwise, scope the path
                  `${rootPath}.${k}.${itemPath}`;
              ele.dataset[_codec] = newPath;
              // console.log(ele.dataset[_codec]);
              return me.codecs[_codec].push(ele, me.resolver(newPath));
            });

        return [child, binds.flatMap(asClosures)];
      })
      .reduce(
        ([children, acc], [child, cur]) => [
          [...children, child],
          [...acc, ...cur],
        ],
        [[], []]
      );
    // closures were previously included in the push closure
    // why tho? All the logic is happening in a clone,
    // the dom mods shouldn't fire a rerender since it's not in the doc.
    closures.map((fn) => fn());

    return () => {
      siblings().forEach((x) => x.remove());
      parent.append(...children);
    };
  },
  pull: (el) => {
    const prefix = el.dataset.each;
    const result = {};
    const els = me.util.elements(prefix, true);
    const codecs = Object.keys(me.codecs).filter((x) => x !== "each");
    els.forEach((ele) => {
      const hasCodecs = intersection(Object.keys(ele.dataset), codecs);
      hasCodecs.forEach((c) => {
        const pulledVal = me.codecs[c].pull(el);
        const subPath = ele.dataset[c].replace(prefix + ".", "");
        set(result, subPath, pulledVal);
      });
    });
    // console.log("Pulled from each", result);
    return result;
  },
  // parent.querySelectorAll("[data-codec^='path.starts.with']"), pull all into new reduced Object.
});

const inject = (me) => ({
  push: (el, val) => () =>
    // this ensures that all of the other codecs resolved before continuing
    requestAnimationFrame(() => {
      // could and should be improved by building in a cache
      // right now, the val will only be undefined because its cache isn't established
      const url = me.resolver(el.dataset.src);
      if (!url) {
        console.log("No data-src resolved for data-inject to inject", {
          el,
          src: el.dataset.src,
          url,
        });
        return;
      }

      fetch(url).then((response) =>
        response
          .text()
          .catch(console.log)
          .then((nodeStr) => {
            // prevent multiple injections
            if (el?.nextElementSibling?.dataset?.injected) {
              return;
            }
            const injectedEl = document.createElement("div");
            injectedEl.classList.add(...el.classList);
            injectedEl.innerHTML = nodeStr;
            // inserts the fetched text, and makes it the sibling of the element
            el.insertAdjacentElement("afterend", injectedEl);
            injectedEl.dataset.injected = true;
            me.util.hide(el);
          })
      );
    }),
  pull: (el) =>
    el?.nextElementSibling?.dataset?.injected &&
    el?.nextElementSibling?.outerHtml,
});

const codecs = (me = {}) => {
  // assign codec object if non exists
  const given = me.codecs || {};
  const defaults = {
    text: prop("textContent"),
    html: prop("innerHTML"),
    href: prop("href"),
    src: {
      push: (el, val) =>
        // is string, not empty, then set
        () => isString(val) && val && (el.src = val),
      pull: (el) => el.src || undefined,
    },
    replace: prop("outerHTML"),
    each: each(me),
    inject: inject(me),
  };
  // merge defaults, overwrite defaults with given.
  me.codecs = merge(defaults, given);
  return me;
};

const resolver = (me) => {
  me.resolver = (...args) => {
    const [path, value] = args;
    const switcher = {
      0: () => console.error("resolver has no args."),
      1: () => {
        const o = get(me.is, path);
        // console.log(path, o);
        return o;
      },
      2: () => set(me.is, path, value),
      3: () => console.error("resolver has 3 or more args:", args),
    };
    return switcher[Math.min(args.length, 3)]();
  };
  return me;
};

// Internal Utils
const typeOfObj = (arg) => {
  const element = arg instanceof HTMLElement && "element";
  const node = arg instanceof Node && "element";
  const array = arg instanceof HTMLElement && "array";
  const isNull = arg === null && "null";
  return isNull || element || node || array || "object";
};
const typer = (arg) => {
  const kind = typeof arg;
  return kind === "object" ? typeOfObj(arg) : kind;
};
const argo = (config) => (...args) => config[typer(args[0])](...args);

// Exposed Utils
const selectors = (me = {}) => {
  const asVal = (path, startsWith = false) =>
    path ? (startsWith ? `^="${path}"` : `="${path}"`) : "";
  // provides selector for all adios elements
  const all = () => Object.keys(me.codecs).map(codec).join(",");
  // provides selector for all elements using given codec
  const codec = (c) => `[data-${me.util.asAttr(c)}]`;
  // provides selector for all elements using given path
  const path = (p, startsWith) =>
    Object.keys(me.codecs)
      .map((c) => `[data-${me.util.asAttr(c)}${asVal(p, startsWith)}]`)
      .join(",");
  // provides selector for all elements using the same paths as the given element.
  const element = (el) => Object.values(el.dataset).map(path).join(",");
  const fn = argo({
    undefined: all,
    element: element,
    string: path,
    object: codec,
  });
  const methods = { element, path, codec, all };
  me.util.selectors = Object.assign(fn, methods);
  return me;
};

const elements = (me = {}) => {
  const root = me?.config?.root || document;
  const sels = me.util.selectors;
  const all = (...args) => [...root.querySelectorAll(sels.all(...args))];
  const codec = (...args) => [...root.querySelectorAll(sels.codec(...args))];
  const path = (...args) => [...root.querySelectorAll(sels.path(...args))];
  const element = (...args) => [
    ...root.querySelectorAll(sels.element(...args)),
  ];
  const fn = (...args) => [...root.querySelectorAll(sels(...args))];
  const methods = { element, path, codec, all };
  me.util.elements = Object.assign(fn, methods);
  return me;
};

const util = (me = {}) => {
  me.util = me.util || {};
  me.util.asAttr = kebabCase;
  me.util.asProp = camelCase;
  selectors(me);
  elements(me);
  me.util.hide = (el) => el.hidden = true;
  me.util.show = (el) => el.hidden = false;
  return me;
};

const fixed = {
  is: {},
  config: { root: document },
};
const dynamic = [resolver, util, codecs];
const config = (me) => dynamic.reduce((acc, cur) => cur(acc), merge(fixed, me));

const noop$1 = () => {};

const watch$1 = (target = {}, callback = noop$1, path = []) =>
  prox().create(target, callback);

const be = (rawObj, proxy) => (...args) => {
  const switcher = {
    0: () => cloneDeep(rawObj),
    1: (newObj) => merge(newObj, proxy),
    2: (path, newObj) => merge(newObj, get(path, proxy)),
  };
  return switcher[args.length](...args);
};

const monitor$1 = (
  me = {},
  callback = noop$1,
  path = false,
  method = false,
  raw = false
) => {
  // if path and raw is falsey provide an empty object to start
  const rawObj = get(me, path) || get(me, raw) || {};

  // create nested proxy, provide an the callback.
  const proxy = watch$1(rawObj, callback);

  // store the proxied data somewhere in the passed obj
  raw && set(me, raw, rawObj);

  // create method interface for proxy and raw data
  method && set(me, method, be(rawObj, proxy));

  // me now has the nested proxy at the path,
  // with the callback firing when a value is updated.
  path && set(me, path, proxy);
  // return the mutated me
  return proxy;
};

// can be throughly improved with a good map;
// pushCodecClosureMap.get(path)(val);
const push = (me) => (path = "") => {
  // console.log({ path, be: me.be() });
  const els = me.util.elements(path, true);
  // console.log("Relevant:", { type, usePath, isUpdate, els });
  // push updates to each codec on element
  const pushToCodec = (el) => (_codec) => {
    const value = el.dataset[_codec] && me.resolver(el.dataset[_codec]);
    const pushToView = () => {
      const closure = me.codecs[_codec].push(el, value);
      // console.log({ _codec, path, value });
      requestAnimationFrame(closure);
    };
    undefined !== value && queueMicrotask(pushToView);
  };
  // will be false if codec doesn't exist AND path doesn't match
  const isRelevant = (_codec) => _codec in me.codecs;
  // push updates to each element
  const pushToElement = (el) =>
    Object.keys(el.dataset).filter(isRelevant).forEach(pushToCodec(el));
  els.forEach(pushToElement);
};

// opinionated config for Adios
// takes me
// updates dom from to me.config.root || document
// puts proxy at .is
const pusher = (me = config) => {
  me.pushSet = new Set();
  me.pusher = (changes) =>
    changes.forEach(({ currentPath }) => push(me)(currentPath));
  me.push = push(me);
  monitor$1(me, me.pusher, "is", "be", "util.raw");
  return me;
};

const noop = () => {};
const watchOpts = {
  subtree: true,
  childList: true,
  attributes: true,
  //   attributeFilter: false,
  //   attributeOldValue: false,
  //   characterData: false,
  //   characterDataOldValue: false,
};

const mutsAsEls = (callback = noop) => (mutations) =>
  mutations.forEach((mutation) =>
    [mutation.target, ...mutation.addedNodes].forEach((node) =>
      // Makes a microtask
      Promise.resolve().then(() =>
        callback(isElement(node) ? node : node.parentElement)
      )
    )
  );

const watch = (callback = noop) => new MutationObserver(mutsAsEls(callback));

const monitor = (root = document, callback = noop, opts = watchOpts) =>
  watch(callback).observe(root, opts);

// can be throughly improved with a good map;
// pushCodecClosureMap.get(path)(val);
const pull = (me) => (el) => {
  // find all codecs.
  const codecs = intersection(Object.keys(el.dataset), Object.keys(me.codecs));

  codecs.forEach((codec) => {
    const path = el.dataset[codec];
    const pullWith = me.codecs[codec].pull;
    const domVal = pullWith(el);
    const dataVal = me.resolver(path);
    domVal === dataVal || me.resolver(path, domVal);
  });
};

// opinionated config for Adios
// takes me
// updates dom from to me.config.root || document
// puts proxy at .is
const puller = (me = config) => {
  me.puller = pull(me);
  me.pull = () => me.util.elements().forEach(me.puller);
  me.domobs = monitor(document, me.puller, watchOpts);
  me.pull();
  return me;
};

const Oath = (transform = identity) => ({
  oath: function (promise) {
    // console.log("this", this);
    promise
      .catch((err) => (this.err = err))
      .then((response) =>
        response
          .json()
          .catch((err) => (this.err = err))
          .then((raw) => withDefault(transform(raw, this.ok), raw))
          .then((ok) => (this.ok = ok))
      );
      // .then(console.log);
  },
});

const Adios = (me) => pusher(puller(config(me)));

export { Adios, Oath };
