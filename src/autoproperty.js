"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SimpleSubject = (function () {
    function SimpleSubject() {
        this.listeners = [];
    }
    SimpleSubject.prototype.next = function (value) {
        for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i](value);
        }
    };
    SimpleSubject.prototype.subscribe = function (listener) {
        var _this = this;
        var index = this.listeners.length;
        this.listeners.push(listener);
        return {
            unsubscribe: function () {
                _this.listeners.splice(index, 1);
            }
        };
    };
    return SimpleSubject;
}());
exports.SimpleSubject = SimpleSubject;
var win = null;
try {
    win = window;
}
catch (e) {
    win = global;
}
var PropertyChangedEventArgsGeneric = (function () {
    function PropertyChangedEventArgsGeneric(propertyName, oldValue, newValue) {
        this.propertyName = propertyName;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
    return PropertyChangedEventArgsGeneric;
}());
exports.PropertyChangedEventArgsGeneric = PropertyChangedEventArgsGeneric;
var PropertyChangedEventArgs = (function (_super) {
    __extends(PropertyChangedEventArgs, _super);
    function PropertyChangedEventArgs() {
        _super.apply(this, arguments);
    }
    return PropertyChangedEventArgs;
}(PropertyChangedEventArgsGeneric));
exports.PropertyChangedEventArgs = PropertyChangedEventArgs;
var NotifyPropertyChanged = (function () {
    function NotifyPropertyChanged() {
        this.propertyChanged = new SimpleSubject();
    }
    NotifyPropertyChanged.prototype.onPropertyChanged = function (name, oldValue, newValue) {
        this.propertyChanged.next(new PropertyChangedEventArgs(name, oldValue, newValue));
    };
    return NotifyPropertyChanged;
}());
exports.NotifyPropertyChanged = NotifyPropertyChanged;
var typeMap = [];
var ArrayProxy = (function () {
    function ArrayProxy(runtimeTarget, keyName, protectedKeyName, _arr) {
        this.runtimeTarget = runtimeTarget;
        this.keyName = keyName;
        this.protectedKeyName = protectedKeyName;
        this._arr = _arr;
        this.subscriptions = [];
    }
    ArrayProxy.prototype.clear = function () {
        this.unsubscribe();
        this.subscriptions = undefined;
        this._arr = undefined;
    };
    ArrayProxy.prototype.unsubscribe = function (self) {
        if (!self) {
            self = this;
        }
        for (var i = 0; i < self.subscriptions.length; i++) {
            self.subscriptions[i].unsubscribe();
        }
        this.subscriptions = [];
    };
    ArrayProxy.prototype.subscribe = function (self) {
        self.unsubscribe(self);
        var _loop_1 = function(i) {
            elem = self._arr[i];
            if (elem instanceof NotifyPropertyChanged) {
                var index_1 = i;
                subscription = elem.propertyChanged.subscribe(function (args) {
                    self.runtimeTarget.onPropertyChanged(self.keyName + '[' + index_1 + ']' + '.' + args.propertyName, args.oldValue, args.newValue);
                });
                self.subscriptions.push(subscription);
            }
        };
        var elem, subscription;
        for (var i = 0; i < self._arr.length; i++) {
            _loop_1(i);
        }
    };
    Object.defineProperty(ArrayProxy.prototype, "arr", {
        get: function () {
            var arryToProxy = this._arr.slice();
            var self = this;
            arryToProxy.push = function () {
                var oldValue = self.runtimeTarget[self.protectedKeyName].slice();
                var ret = Array.prototype.push.apply(self.runtimeTarget[self.protectedKeyName], arguments);
                self.runtimeTarget.onPropertyChanged(self.keyName, oldValue, self.runtimeTarget[self.protectedKeyName]);
                self.subscribe(self);
                return ret;
            };
            arryToProxy.pop = function () {
                var oldValue = self.runtimeTarget[self.protectedKeyName].slice();
                var ret = Array.prototype.pop.apply(self.runtimeTarget[self.protectedKeyName], arguments);
                self.runtimeTarget.onPropertyChanged(self.keyName, oldValue, self.runtimeTarget[self.protectedKeyName]);
                self.subscribe(self);
                return ret;
            };
            arryToProxy.shift = function () {
                var oldValue = self.runtimeTarget[self.protectedKeyName].slice();
                var ret = Array.prototype.shift.apply(self.runtimeTarget[self.protectedKeyName], arguments);
                self.runtimeTarget.onPropertyChanged(self.keyName, oldValue, self.runtimeTarget[self.protectedKeyName]);
                self.subscribe(self);
                return ret;
            };
            arryToProxy.unshift = function () {
                var oldValue = self.runtimeTarget[self.protectedKeyName].slice();
                var ret = Array.prototype.unshift.apply(self.runtimeTarget[self.protectedKeyName], arguments);
                self.runtimeTarget.onPropertyChanged(self.keyName, oldValue, self.runtimeTarget[self.protectedKeyName]);
                self.subscribe(self);
                return ret;
            };
            arryToProxy.slice = function () {
                var oldValue = self.runtimeTarget[self.protectedKeyName].slice();
                var ret = Array.prototype.slice.apply(self.runtimeTarget[self.protectedKeyName], arguments);
                self.runtimeTarget.onPropertyChanged(self.keyName, oldValue, self.runtimeTarget[self.protectedKeyName]);
                self.subscribe(self);
                return ret;
            };
            return arryToProxy;
        },
        enumerable: true,
        configurable: true
    });
    return ArrayProxy;
}());
exports.ArrayProxy = ArrayProxy;
function autoproperty(target, keyName) {
    var protectedKeyName = '_' + keyName;
    var anyTarget = target;
    anyTarget[protectedKeyName] = anyTarget[keyName];
    var type;
    var typeMapHash = target.constructor['name'] + '.' + keyName;
    var getterProxyKey = '__getterProxy';
    Object.defineProperty(target, keyName, {
        get: function () {
            var ret = this[protectedKeyName];
            if (type === '[object Array]') {
                if (!this[getterProxyKey]) {
                    this[getterProxyKey] = new ArrayProxy(this, keyName, protectedKeyName, ret);
                }
                ret = this[getterProxyKey].arr;
            }
            return ret;
        },
        set: function (newValue) {
            var _this = this;
            var oldValue = this[protectedKeyName];
            this[protectedKeyName] = newValue;
            type = Object.prototype.toString.call(newValue);
            if (type === '[object Array]') {
                if (this[getterProxyKey]) {
                    this[getterProxyKey].clear();
                    this[getterProxyKey] = undefined;
                }
            }
            if (newValue instanceof NotifyPropertyChanged) {
                newValue.propertyChanged.subscribe(function (args) {
                    _this.onPropertyChanged(keyName + '.' + args.propertyName, args.oldValue, args.newValue);
                });
            }
            if (oldValue != newValue) {
                this.onPropertyChanged(keyName, oldValue, this[protectedKeyName]);
            }
        },
        enumerable: true,
        configurable: true
    });
}
exports.autoproperty = autoproperty;
