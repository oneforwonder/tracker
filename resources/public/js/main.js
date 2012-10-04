var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6138 = x == null ? null : x;
  if(p[goog.typeOf(x__6138)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6139__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6139 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6139__delegate.call(this, array, i, idxs)
    };
    G__6139.cljs$lang$maxFixedArity = 2;
    G__6139.cljs$lang$applyTo = function(arglist__6140) {
      var array = cljs.core.first(arglist__6140);
      var i = cljs.core.first(cljs.core.next(arglist__6140));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6140));
      return G__6139__delegate(array, i, idxs)
    };
    G__6139.cljs$lang$arity$variadic = G__6139__delegate;
    return G__6139
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6225 = this$;
      if(and__3822__auto____6225) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6225
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2399__auto____6226 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6227 = cljs.core._invoke[goog.typeOf(x__2399__auto____6226)];
        if(or__3824__auto____6227) {
          return or__3824__auto____6227
        }else {
          var or__3824__auto____6228 = cljs.core._invoke["_"];
          if(or__3824__auto____6228) {
            return or__3824__auto____6228
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6229 = this$;
      if(and__3822__auto____6229) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6229
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2399__auto____6230 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6231 = cljs.core._invoke[goog.typeOf(x__2399__auto____6230)];
        if(or__3824__auto____6231) {
          return or__3824__auto____6231
        }else {
          var or__3824__auto____6232 = cljs.core._invoke["_"];
          if(or__3824__auto____6232) {
            return or__3824__auto____6232
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6233 = this$;
      if(and__3822__auto____6233) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6233
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2399__auto____6234 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6235 = cljs.core._invoke[goog.typeOf(x__2399__auto____6234)];
        if(or__3824__auto____6235) {
          return or__3824__auto____6235
        }else {
          var or__3824__auto____6236 = cljs.core._invoke["_"];
          if(or__3824__auto____6236) {
            return or__3824__auto____6236
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6237 = this$;
      if(and__3822__auto____6237) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6237
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2399__auto____6238 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6239 = cljs.core._invoke[goog.typeOf(x__2399__auto____6238)];
        if(or__3824__auto____6239) {
          return or__3824__auto____6239
        }else {
          var or__3824__auto____6240 = cljs.core._invoke["_"];
          if(or__3824__auto____6240) {
            return or__3824__auto____6240
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6241 = this$;
      if(and__3822__auto____6241) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6241
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2399__auto____6242 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6243 = cljs.core._invoke[goog.typeOf(x__2399__auto____6242)];
        if(or__3824__auto____6243) {
          return or__3824__auto____6243
        }else {
          var or__3824__auto____6244 = cljs.core._invoke["_"];
          if(or__3824__auto____6244) {
            return or__3824__auto____6244
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6245 = this$;
      if(and__3822__auto____6245) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6245
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2399__auto____6246 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6247 = cljs.core._invoke[goog.typeOf(x__2399__auto____6246)];
        if(or__3824__auto____6247) {
          return or__3824__auto____6247
        }else {
          var or__3824__auto____6248 = cljs.core._invoke["_"];
          if(or__3824__auto____6248) {
            return or__3824__auto____6248
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6249 = this$;
      if(and__3822__auto____6249) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6249
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2399__auto____6250 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6251 = cljs.core._invoke[goog.typeOf(x__2399__auto____6250)];
        if(or__3824__auto____6251) {
          return or__3824__auto____6251
        }else {
          var or__3824__auto____6252 = cljs.core._invoke["_"];
          if(or__3824__auto____6252) {
            return or__3824__auto____6252
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6253 = this$;
      if(and__3822__auto____6253) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6253
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2399__auto____6254 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6255 = cljs.core._invoke[goog.typeOf(x__2399__auto____6254)];
        if(or__3824__auto____6255) {
          return or__3824__auto____6255
        }else {
          var or__3824__auto____6256 = cljs.core._invoke["_"];
          if(or__3824__auto____6256) {
            return or__3824__auto____6256
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6257 = this$;
      if(and__3822__auto____6257) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6257
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2399__auto____6258 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6259 = cljs.core._invoke[goog.typeOf(x__2399__auto____6258)];
        if(or__3824__auto____6259) {
          return or__3824__auto____6259
        }else {
          var or__3824__auto____6260 = cljs.core._invoke["_"];
          if(or__3824__auto____6260) {
            return or__3824__auto____6260
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6261 = this$;
      if(and__3822__auto____6261) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6261
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2399__auto____6262 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6263 = cljs.core._invoke[goog.typeOf(x__2399__auto____6262)];
        if(or__3824__auto____6263) {
          return or__3824__auto____6263
        }else {
          var or__3824__auto____6264 = cljs.core._invoke["_"];
          if(or__3824__auto____6264) {
            return or__3824__auto____6264
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6265 = this$;
      if(and__3822__auto____6265) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6265
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2399__auto____6266 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6267 = cljs.core._invoke[goog.typeOf(x__2399__auto____6266)];
        if(or__3824__auto____6267) {
          return or__3824__auto____6267
        }else {
          var or__3824__auto____6268 = cljs.core._invoke["_"];
          if(or__3824__auto____6268) {
            return or__3824__auto____6268
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6269 = this$;
      if(and__3822__auto____6269) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6269
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2399__auto____6270 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6271 = cljs.core._invoke[goog.typeOf(x__2399__auto____6270)];
        if(or__3824__auto____6271) {
          return or__3824__auto____6271
        }else {
          var or__3824__auto____6272 = cljs.core._invoke["_"];
          if(or__3824__auto____6272) {
            return or__3824__auto____6272
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6273 = this$;
      if(and__3822__auto____6273) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6273
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2399__auto____6274 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6275 = cljs.core._invoke[goog.typeOf(x__2399__auto____6274)];
        if(or__3824__auto____6275) {
          return or__3824__auto____6275
        }else {
          var or__3824__auto____6276 = cljs.core._invoke["_"];
          if(or__3824__auto____6276) {
            return or__3824__auto____6276
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6277 = this$;
      if(and__3822__auto____6277) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6277
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2399__auto____6278 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6279 = cljs.core._invoke[goog.typeOf(x__2399__auto____6278)];
        if(or__3824__auto____6279) {
          return or__3824__auto____6279
        }else {
          var or__3824__auto____6280 = cljs.core._invoke["_"];
          if(or__3824__auto____6280) {
            return or__3824__auto____6280
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6281 = this$;
      if(and__3822__auto____6281) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6281
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2399__auto____6282 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6283 = cljs.core._invoke[goog.typeOf(x__2399__auto____6282)];
        if(or__3824__auto____6283) {
          return or__3824__auto____6283
        }else {
          var or__3824__auto____6284 = cljs.core._invoke["_"];
          if(or__3824__auto____6284) {
            return or__3824__auto____6284
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6285 = this$;
      if(and__3822__auto____6285) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6285
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2399__auto____6286 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6287 = cljs.core._invoke[goog.typeOf(x__2399__auto____6286)];
        if(or__3824__auto____6287) {
          return or__3824__auto____6287
        }else {
          var or__3824__auto____6288 = cljs.core._invoke["_"];
          if(or__3824__auto____6288) {
            return or__3824__auto____6288
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6289 = this$;
      if(and__3822__auto____6289) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6289
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2399__auto____6290 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6291 = cljs.core._invoke[goog.typeOf(x__2399__auto____6290)];
        if(or__3824__auto____6291) {
          return or__3824__auto____6291
        }else {
          var or__3824__auto____6292 = cljs.core._invoke["_"];
          if(or__3824__auto____6292) {
            return or__3824__auto____6292
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6293 = this$;
      if(and__3822__auto____6293) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6293
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2399__auto____6294 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6295 = cljs.core._invoke[goog.typeOf(x__2399__auto____6294)];
        if(or__3824__auto____6295) {
          return or__3824__auto____6295
        }else {
          var or__3824__auto____6296 = cljs.core._invoke["_"];
          if(or__3824__auto____6296) {
            return or__3824__auto____6296
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6297 = this$;
      if(and__3822__auto____6297) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6297
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2399__auto____6298 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6299 = cljs.core._invoke[goog.typeOf(x__2399__auto____6298)];
        if(or__3824__auto____6299) {
          return or__3824__auto____6299
        }else {
          var or__3824__auto____6300 = cljs.core._invoke["_"];
          if(or__3824__auto____6300) {
            return or__3824__auto____6300
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6301 = this$;
      if(and__3822__auto____6301) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6301
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2399__auto____6302 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6303 = cljs.core._invoke[goog.typeOf(x__2399__auto____6302)];
        if(or__3824__auto____6303) {
          return or__3824__auto____6303
        }else {
          var or__3824__auto____6304 = cljs.core._invoke["_"];
          if(or__3824__auto____6304) {
            return or__3824__auto____6304
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6305 = this$;
      if(and__3822__auto____6305) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6305
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2399__auto____6306 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6307 = cljs.core._invoke[goog.typeOf(x__2399__auto____6306)];
        if(or__3824__auto____6307) {
          return or__3824__auto____6307
        }else {
          var or__3824__auto____6308 = cljs.core._invoke["_"];
          if(or__3824__auto____6308) {
            return or__3824__auto____6308
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6313 = coll;
    if(and__3822__auto____6313) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6313
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2399__auto____6314 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6315 = cljs.core._count[goog.typeOf(x__2399__auto____6314)];
      if(or__3824__auto____6315) {
        return or__3824__auto____6315
      }else {
        var or__3824__auto____6316 = cljs.core._count["_"];
        if(or__3824__auto____6316) {
          return or__3824__auto____6316
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6321 = coll;
    if(and__3822__auto____6321) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6321
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2399__auto____6322 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6323 = cljs.core._empty[goog.typeOf(x__2399__auto____6322)];
      if(or__3824__auto____6323) {
        return or__3824__auto____6323
      }else {
        var or__3824__auto____6324 = cljs.core._empty["_"];
        if(or__3824__auto____6324) {
          return or__3824__auto____6324
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6329 = coll;
    if(and__3822__auto____6329) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6329
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2399__auto____6330 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6331 = cljs.core._conj[goog.typeOf(x__2399__auto____6330)];
      if(or__3824__auto____6331) {
        return or__3824__auto____6331
      }else {
        var or__3824__auto____6332 = cljs.core._conj["_"];
        if(or__3824__auto____6332) {
          return or__3824__auto____6332
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6341 = coll;
      if(and__3822__auto____6341) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6341
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2399__auto____6342 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6343 = cljs.core._nth[goog.typeOf(x__2399__auto____6342)];
        if(or__3824__auto____6343) {
          return or__3824__auto____6343
        }else {
          var or__3824__auto____6344 = cljs.core._nth["_"];
          if(or__3824__auto____6344) {
            return or__3824__auto____6344
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6345 = coll;
      if(and__3822__auto____6345) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6345
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2399__auto____6346 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6347 = cljs.core._nth[goog.typeOf(x__2399__auto____6346)];
        if(or__3824__auto____6347) {
          return or__3824__auto____6347
        }else {
          var or__3824__auto____6348 = cljs.core._nth["_"];
          if(or__3824__auto____6348) {
            return or__3824__auto____6348
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6353 = coll;
    if(and__3822__auto____6353) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6353
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2399__auto____6354 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6355 = cljs.core._first[goog.typeOf(x__2399__auto____6354)];
      if(or__3824__auto____6355) {
        return or__3824__auto____6355
      }else {
        var or__3824__auto____6356 = cljs.core._first["_"];
        if(or__3824__auto____6356) {
          return or__3824__auto____6356
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6361 = coll;
    if(and__3822__auto____6361) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6361
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2399__auto____6362 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6363 = cljs.core._rest[goog.typeOf(x__2399__auto____6362)];
      if(or__3824__auto____6363) {
        return or__3824__auto____6363
      }else {
        var or__3824__auto____6364 = cljs.core._rest["_"];
        if(or__3824__auto____6364) {
          return or__3824__auto____6364
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6369 = coll;
    if(and__3822__auto____6369) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6369
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2399__auto____6370 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6371 = cljs.core._next[goog.typeOf(x__2399__auto____6370)];
      if(or__3824__auto____6371) {
        return or__3824__auto____6371
      }else {
        var or__3824__auto____6372 = cljs.core._next["_"];
        if(or__3824__auto____6372) {
          return or__3824__auto____6372
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6381 = o;
      if(and__3822__auto____6381) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6381
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2399__auto____6382 = o == null ? null : o;
      return function() {
        var or__3824__auto____6383 = cljs.core._lookup[goog.typeOf(x__2399__auto____6382)];
        if(or__3824__auto____6383) {
          return or__3824__auto____6383
        }else {
          var or__3824__auto____6384 = cljs.core._lookup["_"];
          if(or__3824__auto____6384) {
            return or__3824__auto____6384
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6385 = o;
      if(and__3822__auto____6385) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6385
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2399__auto____6386 = o == null ? null : o;
      return function() {
        var or__3824__auto____6387 = cljs.core._lookup[goog.typeOf(x__2399__auto____6386)];
        if(or__3824__auto____6387) {
          return or__3824__auto____6387
        }else {
          var or__3824__auto____6388 = cljs.core._lookup["_"];
          if(or__3824__auto____6388) {
            return or__3824__auto____6388
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6393 = coll;
    if(and__3822__auto____6393) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6393
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2399__auto____6394 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6395 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2399__auto____6394)];
      if(or__3824__auto____6395) {
        return or__3824__auto____6395
      }else {
        var or__3824__auto____6396 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6396) {
          return or__3824__auto____6396
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6401 = coll;
    if(and__3822__auto____6401) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6401
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2399__auto____6402 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6403 = cljs.core._assoc[goog.typeOf(x__2399__auto____6402)];
      if(or__3824__auto____6403) {
        return or__3824__auto____6403
      }else {
        var or__3824__auto____6404 = cljs.core._assoc["_"];
        if(or__3824__auto____6404) {
          return or__3824__auto____6404
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6409 = coll;
    if(and__3822__auto____6409) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6409
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2399__auto____6410 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6411 = cljs.core._dissoc[goog.typeOf(x__2399__auto____6410)];
      if(or__3824__auto____6411) {
        return or__3824__auto____6411
      }else {
        var or__3824__auto____6412 = cljs.core._dissoc["_"];
        if(or__3824__auto____6412) {
          return or__3824__auto____6412
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6417 = coll;
    if(and__3822__auto____6417) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6417
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2399__auto____6418 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6419 = cljs.core._key[goog.typeOf(x__2399__auto____6418)];
      if(or__3824__auto____6419) {
        return or__3824__auto____6419
      }else {
        var or__3824__auto____6420 = cljs.core._key["_"];
        if(or__3824__auto____6420) {
          return or__3824__auto____6420
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6425 = coll;
    if(and__3822__auto____6425) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6425
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2399__auto____6426 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6427 = cljs.core._val[goog.typeOf(x__2399__auto____6426)];
      if(or__3824__auto____6427) {
        return or__3824__auto____6427
      }else {
        var or__3824__auto____6428 = cljs.core._val["_"];
        if(or__3824__auto____6428) {
          return or__3824__auto____6428
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6433 = coll;
    if(and__3822__auto____6433) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6433
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2399__auto____6434 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6435 = cljs.core._disjoin[goog.typeOf(x__2399__auto____6434)];
      if(or__3824__auto____6435) {
        return or__3824__auto____6435
      }else {
        var or__3824__auto____6436 = cljs.core._disjoin["_"];
        if(or__3824__auto____6436) {
          return or__3824__auto____6436
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6441 = coll;
    if(and__3822__auto____6441) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6441
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2399__auto____6442 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6443 = cljs.core._peek[goog.typeOf(x__2399__auto____6442)];
      if(or__3824__auto____6443) {
        return or__3824__auto____6443
      }else {
        var or__3824__auto____6444 = cljs.core._peek["_"];
        if(or__3824__auto____6444) {
          return or__3824__auto____6444
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6449 = coll;
    if(and__3822__auto____6449) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6449
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2399__auto____6450 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6451 = cljs.core._pop[goog.typeOf(x__2399__auto____6450)];
      if(or__3824__auto____6451) {
        return or__3824__auto____6451
      }else {
        var or__3824__auto____6452 = cljs.core._pop["_"];
        if(or__3824__auto____6452) {
          return or__3824__auto____6452
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6457 = coll;
    if(and__3822__auto____6457) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6457
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2399__auto____6458 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6459 = cljs.core._assoc_n[goog.typeOf(x__2399__auto____6458)];
      if(or__3824__auto____6459) {
        return or__3824__auto____6459
      }else {
        var or__3824__auto____6460 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6460) {
          return or__3824__auto____6460
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6465 = o;
    if(and__3822__auto____6465) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6465
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2399__auto____6466 = o == null ? null : o;
    return function() {
      var or__3824__auto____6467 = cljs.core._deref[goog.typeOf(x__2399__auto____6466)];
      if(or__3824__auto____6467) {
        return or__3824__auto____6467
      }else {
        var or__3824__auto____6468 = cljs.core._deref["_"];
        if(or__3824__auto____6468) {
          return or__3824__auto____6468
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6473 = o;
    if(and__3822__auto____6473) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6473
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2399__auto____6474 = o == null ? null : o;
    return function() {
      var or__3824__auto____6475 = cljs.core._deref_with_timeout[goog.typeOf(x__2399__auto____6474)];
      if(or__3824__auto____6475) {
        return or__3824__auto____6475
      }else {
        var or__3824__auto____6476 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6476) {
          return or__3824__auto____6476
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6481 = o;
    if(and__3822__auto____6481) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6481
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2399__auto____6482 = o == null ? null : o;
    return function() {
      var or__3824__auto____6483 = cljs.core._meta[goog.typeOf(x__2399__auto____6482)];
      if(or__3824__auto____6483) {
        return or__3824__auto____6483
      }else {
        var or__3824__auto____6484 = cljs.core._meta["_"];
        if(or__3824__auto____6484) {
          return or__3824__auto____6484
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6489 = o;
    if(and__3822__auto____6489) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6489
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2399__auto____6490 = o == null ? null : o;
    return function() {
      var or__3824__auto____6491 = cljs.core._with_meta[goog.typeOf(x__2399__auto____6490)];
      if(or__3824__auto____6491) {
        return or__3824__auto____6491
      }else {
        var or__3824__auto____6492 = cljs.core._with_meta["_"];
        if(or__3824__auto____6492) {
          return or__3824__auto____6492
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6501 = coll;
      if(and__3822__auto____6501) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6501
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2399__auto____6502 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6503 = cljs.core._reduce[goog.typeOf(x__2399__auto____6502)];
        if(or__3824__auto____6503) {
          return or__3824__auto____6503
        }else {
          var or__3824__auto____6504 = cljs.core._reduce["_"];
          if(or__3824__auto____6504) {
            return or__3824__auto____6504
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6505 = coll;
      if(and__3822__auto____6505) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6505
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2399__auto____6506 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6507 = cljs.core._reduce[goog.typeOf(x__2399__auto____6506)];
        if(or__3824__auto____6507) {
          return or__3824__auto____6507
        }else {
          var or__3824__auto____6508 = cljs.core._reduce["_"];
          if(or__3824__auto____6508) {
            return or__3824__auto____6508
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6513 = coll;
    if(and__3822__auto____6513) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6513
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2399__auto____6514 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6515 = cljs.core._kv_reduce[goog.typeOf(x__2399__auto____6514)];
      if(or__3824__auto____6515) {
        return or__3824__auto____6515
      }else {
        var or__3824__auto____6516 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6516) {
          return or__3824__auto____6516
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6521 = o;
    if(and__3822__auto____6521) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6521
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2399__auto____6522 = o == null ? null : o;
    return function() {
      var or__3824__auto____6523 = cljs.core._equiv[goog.typeOf(x__2399__auto____6522)];
      if(or__3824__auto____6523) {
        return or__3824__auto____6523
      }else {
        var or__3824__auto____6524 = cljs.core._equiv["_"];
        if(or__3824__auto____6524) {
          return or__3824__auto____6524
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6529 = o;
    if(and__3822__auto____6529) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6529
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2399__auto____6530 = o == null ? null : o;
    return function() {
      var or__3824__auto____6531 = cljs.core._hash[goog.typeOf(x__2399__auto____6530)];
      if(or__3824__auto____6531) {
        return or__3824__auto____6531
      }else {
        var or__3824__auto____6532 = cljs.core._hash["_"];
        if(or__3824__auto____6532) {
          return or__3824__auto____6532
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6537 = o;
    if(and__3822__auto____6537) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6537
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2399__auto____6538 = o == null ? null : o;
    return function() {
      var or__3824__auto____6539 = cljs.core._seq[goog.typeOf(x__2399__auto____6538)];
      if(or__3824__auto____6539) {
        return or__3824__auto____6539
      }else {
        var or__3824__auto____6540 = cljs.core._seq["_"];
        if(or__3824__auto____6540) {
          return or__3824__auto____6540
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____6545 = coll;
    if(and__3822__auto____6545) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6545
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2399__auto____6546 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6547 = cljs.core._rseq[goog.typeOf(x__2399__auto____6546)];
      if(or__3824__auto____6547) {
        return or__3824__auto____6547
      }else {
        var or__3824__auto____6548 = cljs.core._rseq["_"];
        if(or__3824__auto____6548) {
          return or__3824__auto____6548
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6553 = coll;
    if(and__3822__auto____6553) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6553
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2399__auto____6554 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6555 = cljs.core._sorted_seq[goog.typeOf(x__2399__auto____6554)];
      if(or__3824__auto____6555) {
        return or__3824__auto____6555
      }else {
        var or__3824__auto____6556 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6556) {
          return or__3824__auto____6556
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6561 = coll;
    if(and__3822__auto____6561) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6561
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2399__auto____6562 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6563 = cljs.core._sorted_seq_from[goog.typeOf(x__2399__auto____6562)];
      if(or__3824__auto____6563) {
        return or__3824__auto____6563
      }else {
        var or__3824__auto____6564 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6564) {
          return or__3824__auto____6564
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6569 = coll;
    if(and__3822__auto____6569) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6569
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2399__auto____6570 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6571 = cljs.core._entry_key[goog.typeOf(x__2399__auto____6570)];
      if(or__3824__auto____6571) {
        return or__3824__auto____6571
      }else {
        var or__3824__auto____6572 = cljs.core._entry_key["_"];
        if(or__3824__auto____6572) {
          return or__3824__auto____6572
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6577 = coll;
    if(and__3822__auto____6577) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6577
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2399__auto____6578 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6579 = cljs.core._comparator[goog.typeOf(x__2399__auto____6578)];
      if(or__3824__auto____6579) {
        return or__3824__auto____6579
      }else {
        var or__3824__auto____6580 = cljs.core._comparator["_"];
        if(or__3824__auto____6580) {
          return or__3824__auto____6580
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____6585 = o;
    if(and__3822__auto____6585) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6585
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2399__auto____6586 = o == null ? null : o;
    return function() {
      var or__3824__auto____6587 = cljs.core._pr_seq[goog.typeOf(x__2399__auto____6586)];
      if(or__3824__auto____6587) {
        return or__3824__auto____6587
      }else {
        var or__3824__auto____6588 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6588) {
          return or__3824__auto____6588
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____6593 = d;
    if(and__3822__auto____6593) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6593
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2399__auto____6594 = d == null ? null : d;
    return function() {
      var or__3824__auto____6595 = cljs.core._realized_QMARK_[goog.typeOf(x__2399__auto____6594)];
      if(or__3824__auto____6595) {
        return or__3824__auto____6595
      }else {
        var or__3824__auto____6596 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6596) {
          return or__3824__auto____6596
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____6601 = this$;
    if(and__3822__auto____6601) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6601
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2399__auto____6602 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6603 = cljs.core._notify_watches[goog.typeOf(x__2399__auto____6602)];
      if(or__3824__auto____6603) {
        return or__3824__auto____6603
      }else {
        var or__3824__auto____6604 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6604) {
          return or__3824__auto____6604
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6609 = this$;
    if(and__3822__auto____6609) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6609
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2399__auto____6610 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6611 = cljs.core._add_watch[goog.typeOf(x__2399__auto____6610)];
      if(or__3824__auto____6611) {
        return or__3824__auto____6611
      }else {
        var or__3824__auto____6612 = cljs.core._add_watch["_"];
        if(or__3824__auto____6612) {
          return or__3824__auto____6612
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6617 = this$;
    if(and__3822__auto____6617) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6617
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2399__auto____6618 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6619 = cljs.core._remove_watch[goog.typeOf(x__2399__auto____6618)];
      if(or__3824__auto____6619) {
        return or__3824__auto____6619
      }else {
        var or__3824__auto____6620 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6620) {
          return or__3824__auto____6620
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____6625 = coll;
    if(and__3822__auto____6625) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6625
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2399__auto____6626 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6627 = cljs.core._as_transient[goog.typeOf(x__2399__auto____6626)];
      if(or__3824__auto____6627) {
        return or__3824__auto____6627
      }else {
        var or__3824__auto____6628 = cljs.core._as_transient["_"];
        if(or__3824__auto____6628) {
          return or__3824__auto____6628
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____6633 = tcoll;
    if(and__3822__auto____6633) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6633
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2399__auto____6634 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6635 = cljs.core._conj_BANG_[goog.typeOf(x__2399__auto____6634)];
      if(or__3824__auto____6635) {
        return or__3824__auto____6635
      }else {
        var or__3824__auto____6636 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6636) {
          return or__3824__auto____6636
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6641 = tcoll;
    if(and__3822__auto____6641) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6641
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2399__auto____6642 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6643 = cljs.core._persistent_BANG_[goog.typeOf(x__2399__auto____6642)];
      if(or__3824__auto____6643) {
        return or__3824__auto____6643
      }else {
        var or__3824__auto____6644 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6644) {
          return or__3824__auto____6644
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____6649 = tcoll;
    if(and__3822__auto____6649) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6649
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2399__auto____6650 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6651 = cljs.core._assoc_BANG_[goog.typeOf(x__2399__auto____6650)];
      if(or__3824__auto____6651) {
        return or__3824__auto____6651
      }else {
        var or__3824__auto____6652 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6652) {
          return or__3824__auto____6652
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____6657 = tcoll;
    if(and__3822__auto____6657) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6657
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2399__auto____6658 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6659 = cljs.core._dissoc_BANG_[goog.typeOf(x__2399__auto____6658)];
      if(or__3824__auto____6659) {
        return or__3824__auto____6659
      }else {
        var or__3824__auto____6660 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6660) {
          return or__3824__auto____6660
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____6665 = tcoll;
    if(and__3822__auto____6665) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6665
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2399__auto____6666 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6667 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2399__auto____6666)];
      if(or__3824__auto____6667) {
        return or__3824__auto____6667
      }else {
        var or__3824__auto____6668 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6668) {
          return or__3824__auto____6668
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6673 = tcoll;
    if(and__3822__auto____6673) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6673
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2399__auto____6674 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6675 = cljs.core._pop_BANG_[goog.typeOf(x__2399__auto____6674)];
      if(or__3824__auto____6675) {
        return or__3824__auto____6675
      }else {
        var or__3824__auto____6676 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6676) {
          return or__3824__auto____6676
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____6681 = tcoll;
    if(and__3822__auto____6681) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6681
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2399__auto____6682 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6683 = cljs.core._disjoin_BANG_[goog.typeOf(x__2399__auto____6682)];
      if(or__3824__auto____6683) {
        return or__3824__auto____6683
      }else {
        var or__3824__auto____6684 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6684) {
          return or__3824__auto____6684
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____6689 = x;
    if(and__3822__auto____6689) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6689
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2399__auto____6690 = x == null ? null : x;
    return function() {
      var or__3824__auto____6691 = cljs.core._compare[goog.typeOf(x__2399__auto____6690)];
      if(or__3824__auto____6691) {
        return or__3824__auto____6691
      }else {
        var or__3824__auto____6692 = cljs.core._compare["_"];
        if(or__3824__auto____6692) {
          return or__3824__auto____6692
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____6697 = coll;
    if(and__3822__auto____6697) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6697
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2399__auto____6698 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6699 = cljs.core._drop_first[goog.typeOf(x__2399__auto____6698)];
      if(or__3824__auto____6699) {
        return or__3824__auto____6699
      }else {
        var or__3824__auto____6700 = cljs.core._drop_first["_"];
        if(or__3824__auto____6700) {
          return or__3824__auto____6700
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____6705 = coll;
    if(and__3822__auto____6705) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6705
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2399__auto____6706 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6707 = cljs.core._chunked_first[goog.typeOf(x__2399__auto____6706)];
      if(or__3824__auto____6707) {
        return or__3824__auto____6707
      }else {
        var or__3824__auto____6708 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6708) {
          return or__3824__auto____6708
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6713 = coll;
    if(and__3822__auto____6713) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6713
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2399__auto____6714 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6715 = cljs.core._chunked_rest[goog.typeOf(x__2399__auto____6714)];
      if(or__3824__auto____6715) {
        return or__3824__auto____6715
      }else {
        var or__3824__auto____6716 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6716) {
          return or__3824__auto____6716
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____6721 = coll;
    if(and__3822__auto____6721) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6721
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2399__auto____6722 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6723 = cljs.core._chunked_next[goog.typeOf(x__2399__auto____6722)];
      if(or__3824__auto____6723) {
        return or__3824__auto____6723
      }else {
        var or__3824__auto____6724 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6724) {
          return or__3824__auto____6724
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____6726 = x === y;
    if(or__3824__auto____6726) {
      return or__3824__auto____6726
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6727__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6728 = y;
            var G__6729 = cljs.core.first.call(null, more);
            var G__6730 = cljs.core.next.call(null, more);
            x = G__6728;
            y = G__6729;
            more = G__6730;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6727 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6727__delegate.call(this, x, y, more)
    };
    G__6727.cljs$lang$maxFixedArity = 2;
    G__6727.cljs$lang$applyTo = function(arglist__6731) {
      var x = cljs.core.first(arglist__6731);
      var y = cljs.core.first(cljs.core.next(arglist__6731));
      var more = cljs.core.rest(cljs.core.next(arglist__6731));
      return G__6727__delegate(x, y, more)
    };
    G__6727.cljs$lang$arity$variadic = G__6727__delegate;
    return G__6727
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6732 = null;
  var G__6732__2 = function(o, k) {
    return null
  };
  var G__6732__3 = function(o, k, not_found) {
    return not_found
  };
  G__6732 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6732__2.call(this, o, k);
      case 3:
        return G__6732__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6732
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6733 = null;
  var G__6733__2 = function(_, f) {
    return f.call(null)
  };
  var G__6733__3 = function(_, f, start) {
    return start
  };
  G__6733 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6733__2.call(this, _, f);
      case 3:
        return G__6733__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6733
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6734 = null;
  var G__6734__2 = function(_, n) {
    return null
  };
  var G__6734__3 = function(_, n, not_found) {
    return not_found
  };
  G__6734 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6734__2.call(this, _, n);
      case 3:
        return G__6734__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6734
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____6735 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6735) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6735
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6748 = cljs.core._count.call(null, cicoll);
    if(cnt__6748 === 0) {
      return f.call(null)
    }else {
      var val__6749 = cljs.core._nth.call(null, cicoll, 0);
      var n__6750 = 1;
      while(true) {
        if(n__6750 < cnt__6748) {
          var nval__6751 = f.call(null, val__6749, cljs.core._nth.call(null, cicoll, n__6750));
          if(cljs.core.reduced_QMARK_.call(null, nval__6751)) {
            return cljs.core.deref.call(null, nval__6751)
          }else {
            var G__6760 = nval__6751;
            var G__6761 = n__6750 + 1;
            val__6749 = G__6760;
            n__6750 = G__6761;
            continue
          }
        }else {
          return val__6749
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6752 = cljs.core._count.call(null, cicoll);
    var val__6753 = val;
    var n__6754 = 0;
    while(true) {
      if(n__6754 < cnt__6752) {
        var nval__6755 = f.call(null, val__6753, cljs.core._nth.call(null, cicoll, n__6754));
        if(cljs.core.reduced_QMARK_.call(null, nval__6755)) {
          return cljs.core.deref.call(null, nval__6755)
        }else {
          var G__6762 = nval__6755;
          var G__6763 = n__6754 + 1;
          val__6753 = G__6762;
          n__6754 = G__6763;
          continue
        }
      }else {
        return val__6753
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6756 = cljs.core._count.call(null, cicoll);
    var val__6757 = val;
    var n__6758 = idx;
    while(true) {
      if(n__6758 < cnt__6756) {
        var nval__6759 = f.call(null, val__6757, cljs.core._nth.call(null, cicoll, n__6758));
        if(cljs.core.reduced_QMARK_.call(null, nval__6759)) {
          return cljs.core.deref.call(null, nval__6759)
        }else {
          var G__6764 = nval__6759;
          var G__6765 = n__6758 + 1;
          val__6757 = G__6764;
          n__6758 = G__6765;
          continue
        }
      }else {
        return val__6757
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6778 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6779 = arr[0];
      var n__6780 = 1;
      while(true) {
        if(n__6780 < cnt__6778) {
          var nval__6781 = f.call(null, val__6779, arr[n__6780]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6781)) {
            return cljs.core.deref.call(null, nval__6781)
          }else {
            var G__6790 = nval__6781;
            var G__6791 = n__6780 + 1;
            val__6779 = G__6790;
            n__6780 = G__6791;
            continue
          }
        }else {
          return val__6779
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6782 = arr.length;
    var val__6783 = val;
    var n__6784 = 0;
    while(true) {
      if(n__6784 < cnt__6782) {
        var nval__6785 = f.call(null, val__6783, arr[n__6784]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6785)) {
          return cljs.core.deref.call(null, nval__6785)
        }else {
          var G__6792 = nval__6785;
          var G__6793 = n__6784 + 1;
          val__6783 = G__6792;
          n__6784 = G__6793;
          continue
        }
      }else {
        return val__6783
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6786 = arr.length;
    var val__6787 = val;
    var n__6788 = idx;
    while(true) {
      if(n__6788 < cnt__6786) {
        var nval__6789 = f.call(null, val__6787, arr[n__6788]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6789)) {
          return cljs.core.deref.call(null, nval__6789)
        }else {
          var G__6794 = nval__6789;
          var G__6795 = n__6788 + 1;
          val__6787 = G__6794;
          n__6788 = G__6795;
          continue
        }
      }else {
        return val__6787
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6796 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6797 = this;
  if(this__6797.i + 1 < this__6797.a.length) {
    return new cljs.core.IndexedSeq(this__6797.a, this__6797.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6798 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6799 = this;
  var c__6800 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6800 > 0) {
    return new cljs.core.RSeq(coll, c__6800 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6801 = this;
  var this__6802 = this;
  return cljs.core.pr_str.call(null, this__6802)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6803 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6803.a)) {
    return cljs.core.ci_reduce.call(null, this__6803.a, f, this__6803.a[this__6803.i], this__6803.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6803.a[this__6803.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6804 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6804.a)) {
    return cljs.core.ci_reduce.call(null, this__6804.a, f, start, this__6804.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6805 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6806 = this;
  return this__6806.a.length - this__6806.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6807 = this;
  return this__6807.a[this__6807.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6808 = this;
  if(this__6808.i + 1 < this__6808.a.length) {
    return new cljs.core.IndexedSeq(this__6808.a, this__6808.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6809 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6810 = this;
  var i__6811 = n + this__6810.i;
  if(i__6811 < this__6810.a.length) {
    return this__6810.a[i__6811]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6812 = this;
  var i__6813 = n + this__6812.i;
  if(i__6813 < this__6812.a.length) {
    return this__6812.a[i__6813]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6814 = null;
  var G__6814__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6814__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6814 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6814__2.call(this, array, f);
      case 3:
        return G__6814__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6814
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6815 = null;
  var G__6815__2 = function(array, k) {
    return array[k]
  };
  var G__6815__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6815 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6815__2.call(this, array, k);
      case 3:
        return G__6815__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6815
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6816 = null;
  var G__6816__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6816__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6816 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6816__2.call(this, array, n);
      case 3:
        return G__6816__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6816
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6817 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6818 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6819 = this;
  var this__6820 = this;
  return cljs.core.pr_str.call(null, this__6820)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6821 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6822 = this;
  return this__6822.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6823 = this;
  return cljs.core._nth.call(null, this__6823.ci, this__6823.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6824 = this;
  if(this__6824.i > 0) {
    return new cljs.core.RSeq(this__6824.ci, this__6824.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6825 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6826 = this;
  return new cljs.core.RSeq(this__6826.ci, this__6826.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6827 = this;
  return this__6827.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6831__6832 = coll;
      if(G__6831__6832) {
        if(function() {
          var or__3824__auto____6833 = G__6831__6832.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6833) {
            return or__3824__auto____6833
          }else {
            return G__6831__6832.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6831__6832.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6831__6832)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6831__6832)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6838__6839 = coll;
      if(G__6838__6839) {
        if(function() {
          var or__3824__auto____6840 = G__6838__6839.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6840) {
            return or__3824__auto____6840
          }else {
            return G__6838__6839.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6838__6839.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6838__6839)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6838__6839)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6841 = cljs.core.seq.call(null, coll);
      if(s__6841 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6841)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6846__6847 = coll;
      if(G__6846__6847) {
        if(function() {
          var or__3824__auto____6848 = G__6846__6847.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6848) {
            return or__3824__auto____6848
          }else {
            return G__6846__6847.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6846__6847.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6846__6847)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6846__6847)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6849 = cljs.core.seq.call(null, coll);
      if(!(s__6849 == null)) {
        return cljs.core._rest.call(null, s__6849)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6853__6854 = coll;
      if(G__6853__6854) {
        if(function() {
          var or__3824__auto____6855 = G__6853__6854.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6855) {
            return or__3824__auto____6855
          }else {
            return G__6853__6854.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6853__6854.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6853__6854)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6853__6854)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6857 = cljs.core.next.call(null, s);
    if(!(sn__6857 == null)) {
      var G__6858 = sn__6857;
      s = G__6858;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6859__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6860 = conj.call(null, coll, x);
          var G__6861 = cljs.core.first.call(null, xs);
          var G__6862 = cljs.core.next.call(null, xs);
          coll = G__6860;
          x = G__6861;
          xs = G__6862;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6859 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6859__delegate.call(this, coll, x, xs)
    };
    G__6859.cljs$lang$maxFixedArity = 2;
    G__6859.cljs$lang$applyTo = function(arglist__6863) {
      var coll = cljs.core.first(arglist__6863);
      var x = cljs.core.first(cljs.core.next(arglist__6863));
      var xs = cljs.core.rest(cljs.core.next(arglist__6863));
      return G__6859__delegate(coll, x, xs)
    };
    G__6859.cljs$lang$arity$variadic = G__6859__delegate;
    return G__6859
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6866 = cljs.core.seq.call(null, coll);
  var acc__6867 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6866)) {
      return acc__6867 + cljs.core._count.call(null, s__6866)
    }else {
      var G__6868 = cljs.core.next.call(null, s__6866);
      var G__6869 = acc__6867 + 1;
      s__6866 = G__6868;
      acc__6867 = G__6869;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6876__6877 = coll;
        if(G__6876__6877) {
          if(function() {
            var or__3824__auto____6878 = G__6876__6877.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6878) {
              return or__3824__auto____6878
            }else {
              return G__6876__6877.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6876__6877.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6876__6877)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6876__6877)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6879__6880 = coll;
        if(G__6879__6880) {
          if(function() {
            var or__3824__auto____6881 = G__6879__6880.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6881) {
              return or__3824__auto____6881
            }else {
              return G__6879__6880.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6879__6880.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6879__6880)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6879__6880)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6884__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6883 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6885 = ret__6883;
          var G__6886 = cljs.core.first.call(null, kvs);
          var G__6887 = cljs.core.second.call(null, kvs);
          var G__6888 = cljs.core.nnext.call(null, kvs);
          coll = G__6885;
          k = G__6886;
          v = G__6887;
          kvs = G__6888;
          continue
        }else {
          return ret__6883
        }
        break
      }
    };
    var G__6884 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6884__delegate.call(this, coll, k, v, kvs)
    };
    G__6884.cljs$lang$maxFixedArity = 3;
    G__6884.cljs$lang$applyTo = function(arglist__6889) {
      var coll = cljs.core.first(arglist__6889);
      var k = cljs.core.first(cljs.core.next(arglist__6889));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6889)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6889)));
      return G__6884__delegate(coll, k, v, kvs)
    };
    G__6884.cljs$lang$arity$variadic = G__6884__delegate;
    return G__6884
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6892__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6891 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6893 = ret__6891;
          var G__6894 = cljs.core.first.call(null, ks);
          var G__6895 = cljs.core.next.call(null, ks);
          coll = G__6893;
          k = G__6894;
          ks = G__6895;
          continue
        }else {
          return ret__6891
        }
        break
      }
    };
    var G__6892 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6892__delegate.call(this, coll, k, ks)
    };
    G__6892.cljs$lang$maxFixedArity = 2;
    G__6892.cljs$lang$applyTo = function(arglist__6896) {
      var coll = cljs.core.first(arglist__6896);
      var k = cljs.core.first(cljs.core.next(arglist__6896));
      var ks = cljs.core.rest(cljs.core.next(arglist__6896));
      return G__6892__delegate(coll, k, ks)
    };
    G__6892.cljs$lang$arity$variadic = G__6892__delegate;
    return G__6892
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6900__6901 = o;
    if(G__6900__6901) {
      if(function() {
        var or__3824__auto____6902 = G__6900__6901.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6902) {
          return or__3824__auto____6902
        }else {
          return G__6900__6901.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6900__6901.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6900__6901)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6900__6901)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6905__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6904 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6906 = ret__6904;
          var G__6907 = cljs.core.first.call(null, ks);
          var G__6908 = cljs.core.next.call(null, ks);
          coll = G__6906;
          k = G__6907;
          ks = G__6908;
          continue
        }else {
          return ret__6904
        }
        break
      }
    };
    var G__6905 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6905__delegate.call(this, coll, k, ks)
    };
    G__6905.cljs$lang$maxFixedArity = 2;
    G__6905.cljs$lang$applyTo = function(arglist__6909) {
      var coll = cljs.core.first(arglist__6909);
      var k = cljs.core.first(cljs.core.next(arglist__6909));
      var ks = cljs.core.rest(cljs.core.next(arglist__6909));
      return G__6905__delegate(coll, k, ks)
    };
    G__6905.cljs$lang$arity$variadic = G__6905__delegate;
    return G__6905
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6911 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6911;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6911
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6913 = cljs.core.string_hash_cache[k];
  if(!(h__6913 == null)) {
    return h__6913
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____6915 = goog.isString(o);
      if(and__3822__auto____6915) {
        return check_cache
      }else {
        return and__3822__auto____6915
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6919__6920 = x;
    if(G__6919__6920) {
      if(function() {
        var or__3824__auto____6921 = G__6919__6920.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6921) {
          return or__3824__auto____6921
        }else {
          return G__6919__6920.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6919__6920.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6919__6920)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6919__6920)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6925__6926 = x;
    if(G__6925__6926) {
      if(function() {
        var or__3824__auto____6927 = G__6925__6926.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6927) {
          return or__3824__auto____6927
        }else {
          return G__6925__6926.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6925__6926.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6925__6926)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6925__6926)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6931__6932 = x;
  if(G__6931__6932) {
    if(function() {
      var or__3824__auto____6933 = G__6931__6932.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6933) {
        return or__3824__auto____6933
      }else {
        return G__6931__6932.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6931__6932.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6931__6932)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6931__6932)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6937__6938 = x;
  if(G__6937__6938) {
    if(function() {
      var or__3824__auto____6939 = G__6937__6938.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6939) {
        return or__3824__auto____6939
      }else {
        return G__6937__6938.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6937__6938.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6937__6938)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6937__6938)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6943__6944 = x;
  if(G__6943__6944) {
    if(function() {
      var or__3824__auto____6945 = G__6943__6944.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6945) {
        return or__3824__auto____6945
      }else {
        return G__6943__6944.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6943__6944.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6943__6944)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6943__6944)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6949__6950 = x;
  if(G__6949__6950) {
    if(function() {
      var or__3824__auto____6951 = G__6949__6950.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6951) {
        return or__3824__auto____6951
      }else {
        return G__6949__6950.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6949__6950.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6949__6950)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6949__6950)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6955__6956 = x;
  if(G__6955__6956) {
    if(function() {
      var or__3824__auto____6957 = G__6955__6956.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6957) {
        return or__3824__auto____6957
      }else {
        return G__6955__6956.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6955__6956.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6955__6956)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6955__6956)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6961__6962 = x;
    if(G__6961__6962) {
      if(function() {
        var or__3824__auto____6963 = G__6961__6962.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6963) {
          return or__3824__auto____6963
        }else {
          return G__6961__6962.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6961__6962.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6961__6962)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6961__6962)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6967__6968 = x;
  if(G__6967__6968) {
    if(function() {
      var or__3824__auto____6969 = G__6967__6968.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6969) {
        return or__3824__auto____6969
      }else {
        return G__6967__6968.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6967__6968.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6967__6968)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6967__6968)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6973__6974 = x;
  if(G__6973__6974) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6975 = null;
      if(cljs.core.truth_(or__3824__auto____6975)) {
        return or__3824__auto____6975
      }else {
        return G__6973__6974.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6973__6974.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6973__6974)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6973__6974)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6976__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6976 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6976__delegate.call(this, keyvals)
    };
    G__6976.cljs$lang$maxFixedArity = 0;
    G__6976.cljs$lang$applyTo = function(arglist__6977) {
      var keyvals = cljs.core.seq(arglist__6977);
      return G__6976__delegate(keyvals)
    };
    G__6976.cljs$lang$arity$variadic = G__6976__delegate;
    return G__6976
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6979 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6979.push(key)
  });
  return keys__6979
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6983 = i;
  var j__6984 = j;
  var len__6985 = len;
  while(true) {
    if(len__6985 === 0) {
      return to
    }else {
      to[j__6984] = from[i__6983];
      var G__6986 = i__6983 + 1;
      var G__6987 = j__6984 + 1;
      var G__6988 = len__6985 - 1;
      i__6983 = G__6986;
      j__6984 = G__6987;
      len__6985 = G__6988;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6992 = i + (len - 1);
  var j__6993 = j + (len - 1);
  var len__6994 = len;
  while(true) {
    if(len__6994 === 0) {
      return to
    }else {
      to[j__6993] = from[i__6992];
      var G__6995 = i__6992 - 1;
      var G__6996 = j__6993 - 1;
      var G__6997 = len__6994 - 1;
      i__6992 = G__6995;
      j__6993 = G__6996;
      len__6994 = G__6997;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7001__7002 = s;
    if(G__7001__7002) {
      if(function() {
        var or__3824__auto____7003 = G__7001__7002.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7003) {
          return or__3824__auto____7003
        }else {
          return G__7001__7002.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7001__7002.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7001__7002)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7001__7002)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7007__7008 = s;
  if(G__7007__7008) {
    if(function() {
      var or__3824__auto____7009 = G__7007__7008.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7009) {
        return or__3824__auto____7009
      }else {
        return G__7007__7008.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7007__7008.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7007__7008)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7007__7008)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7012 = goog.isString(x);
  if(and__3822__auto____7012) {
    return!function() {
      var or__3824__auto____7013 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7013) {
        return or__3824__auto____7013
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7012
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7015 = goog.isString(x);
  if(and__3822__auto____7015) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7015
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7017 = goog.isString(x);
  if(and__3822__auto____7017) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7017
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7022 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7022) {
    return or__3824__auto____7022
  }else {
    var G__7023__7024 = f;
    if(G__7023__7024) {
      if(function() {
        var or__3824__auto____7025 = G__7023__7024.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7025) {
          return or__3824__auto____7025
        }else {
          return G__7023__7024.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7023__7024.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7023__7024)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7023__7024)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7027 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7027) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7027
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7030 = coll;
    if(cljs.core.truth_(and__3822__auto____7030)) {
      var and__3822__auto____7031 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7031) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7031
      }
    }else {
      return and__3822__auto____7030
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7040__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7036 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7037 = more;
        while(true) {
          var x__7038 = cljs.core.first.call(null, xs__7037);
          var etc__7039 = cljs.core.next.call(null, xs__7037);
          if(cljs.core.truth_(xs__7037)) {
            if(cljs.core.contains_QMARK_.call(null, s__7036, x__7038)) {
              return false
            }else {
              var G__7041 = cljs.core.conj.call(null, s__7036, x__7038);
              var G__7042 = etc__7039;
              s__7036 = G__7041;
              xs__7037 = G__7042;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7040 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7040__delegate.call(this, x, y, more)
    };
    G__7040.cljs$lang$maxFixedArity = 2;
    G__7040.cljs$lang$applyTo = function(arglist__7043) {
      var x = cljs.core.first(arglist__7043);
      var y = cljs.core.first(cljs.core.next(arglist__7043));
      var more = cljs.core.rest(cljs.core.next(arglist__7043));
      return G__7040__delegate(x, y, more)
    };
    G__7040.cljs$lang$arity$variadic = G__7040__delegate;
    return G__7040
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7047__7048 = x;
            if(G__7047__7048) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7049 = null;
                if(cljs.core.truth_(or__3824__auto____7049)) {
                  return or__3824__auto____7049
                }else {
                  return G__7047__7048.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7047__7048.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7047__7048)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7047__7048)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7054 = cljs.core.count.call(null, xs);
    var yl__7055 = cljs.core.count.call(null, ys);
    if(xl__7054 < yl__7055) {
      return-1
    }else {
      if(xl__7054 > yl__7055) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7054, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7056 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7057 = d__7056 === 0;
        if(and__3822__auto____7057) {
          return n + 1 < len
        }else {
          return and__3822__auto____7057
        }
      }()) {
        var G__7058 = xs;
        var G__7059 = ys;
        var G__7060 = len;
        var G__7061 = n + 1;
        xs = G__7058;
        ys = G__7059;
        len = G__7060;
        n = G__7061;
        continue
      }else {
        return d__7056
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7063 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7063)) {
        return r__7063
      }else {
        if(cljs.core.truth_(r__7063)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7065 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7065, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7065)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7071 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7071) {
      var s__7072 = temp__3971__auto____7071;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7072), cljs.core.next.call(null, s__7072))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7073 = val;
    var coll__7074 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7074) {
        var nval__7075 = f.call(null, val__7073, cljs.core.first.call(null, coll__7074));
        if(cljs.core.reduced_QMARK_.call(null, nval__7075)) {
          return cljs.core.deref.call(null, nval__7075)
        }else {
          var G__7076 = nval__7075;
          var G__7077 = cljs.core.next.call(null, coll__7074);
          val__7073 = G__7076;
          coll__7074 = G__7077;
          continue
        }
      }else {
        return val__7073
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7079 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7079);
  return cljs.core.vec.call(null, a__7079)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7086__7087 = coll;
      if(G__7086__7087) {
        if(function() {
          var or__3824__auto____7088 = G__7086__7087.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7088) {
            return or__3824__auto____7088
          }else {
            return G__7086__7087.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7086__7087.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7086__7087)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7086__7087)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7089__7090 = coll;
      if(G__7089__7090) {
        if(function() {
          var or__3824__auto____7091 = G__7089__7090.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7091) {
            return or__3824__auto____7091
          }else {
            return G__7089__7090.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7089__7090.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7089__7090)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7089__7090)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7092 = this;
  return this__7092.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7093__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7093 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7093__delegate.call(this, x, y, more)
    };
    G__7093.cljs$lang$maxFixedArity = 2;
    G__7093.cljs$lang$applyTo = function(arglist__7094) {
      var x = cljs.core.first(arglist__7094);
      var y = cljs.core.first(cljs.core.next(arglist__7094));
      var more = cljs.core.rest(cljs.core.next(arglist__7094));
      return G__7093__delegate(x, y, more)
    };
    G__7093.cljs$lang$arity$variadic = G__7093__delegate;
    return G__7093
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7095__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7095 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7095__delegate.call(this, x, y, more)
    };
    G__7095.cljs$lang$maxFixedArity = 2;
    G__7095.cljs$lang$applyTo = function(arglist__7096) {
      var x = cljs.core.first(arglist__7096);
      var y = cljs.core.first(cljs.core.next(arglist__7096));
      var more = cljs.core.rest(cljs.core.next(arglist__7096));
      return G__7095__delegate(x, y, more)
    };
    G__7095.cljs$lang$arity$variadic = G__7095__delegate;
    return G__7095
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7097__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7097 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7097__delegate.call(this, x, y, more)
    };
    G__7097.cljs$lang$maxFixedArity = 2;
    G__7097.cljs$lang$applyTo = function(arglist__7098) {
      var x = cljs.core.first(arglist__7098);
      var y = cljs.core.first(cljs.core.next(arglist__7098));
      var more = cljs.core.rest(cljs.core.next(arglist__7098));
      return G__7097__delegate(x, y, more)
    };
    G__7097.cljs$lang$arity$variadic = G__7097__delegate;
    return G__7097
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7099__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7099 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7099__delegate.call(this, x, y, more)
    };
    G__7099.cljs$lang$maxFixedArity = 2;
    G__7099.cljs$lang$applyTo = function(arglist__7100) {
      var x = cljs.core.first(arglist__7100);
      var y = cljs.core.first(cljs.core.next(arglist__7100));
      var more = cljs.core.rest(cljs.core.next(arglist__7100));
      return G__7099__delegate(x, y, more)
    };
    G__7099.cljs$lang$arity$variadic = G__7099__delegate;
    return G__7099
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7101__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7102 = y;
            var G__7103 = cljs.core.first.call(null, more);
            var G__7104 = cljs.core.next.call(null, more);
            x = G__7102;
            y = G__7103;
            more = G__7104;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7101 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7101__delegate.call(this, x, y, more)
    };
    G__7101.cljs$lang$maxFixedArity = 2;
    G__7101.cljs$lang$applyTo = function(arglist__7105) {
      var x = cljs.core.first(arglist__7105);
      var y = cljs.core.first(cljs.core.next(arglist__7105));
      var more = cljs.core.rest(cljs.core.next(arglist__7105));
      return G__7101__delegate(x, y, more)
    };
    G__7101.cljs$lang$arity$variadic = G__7101__delegate;
    return G__7101
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7106__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7107 = y;
            var G__7108 = cljs.core.first.call(null, more);
            var G__7109 = cljs.core.next.call(null, more);
            x = G__7107;
            y = G__7108;
            more = G__7109;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7106 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7106__delegate.call(this, x, y, more)
    };
    G__7106.cljs$lang$maxFixedArity = 2;
    G__7106.cljs$lang$applyTo = function(arglist__7110) {
      var x = cljs.core.first(arglist__7110);
      var y = cljs.core.first(cljs.core.next(arglist__7110));
      var more = cljs.core.rest(cljs.core.next(arglist__7110));
      return G__7106__delegate(x, y, more)
    };
    G__7106.cljs$lang$arity$variadic = G__7106__delegate;
    return G__7106
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7111__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7112 = y;
            var G__7113 = cljs.core.first.call(null, more);
            var G__7114 = cljs.core.next.call(null, more);
            x = G__7112;
            y = G__7113;
            more = G__7114;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7111 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7111__delegate.call(this, x, y, more)
    };
    G__7111.cljs$lang$maxFixedArity = 2;
    G__7111.cljs$lang$applyTo = function(arglist__7115) {
      var x = cljs.core.first(arglist__7115);
      var y = cljs.core.first(cljs.core.next(arglist__7115));
      var more = cljs.core.rest(cljs.core.next(arglist__7115));
      return G__7111__delegate(x, y, more)
    };
    G__7111.cljs$lang$arity$variadic = G__7111__delegate;
    return G__7111
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7116__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7117 = y;
            var G__7118 = cljs.core.first.call(null, more);
            var G__7119 = cljs.core.next.call(null, more);
            x = G__7117;
            y = G__7118;
            more = G__7119;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7116 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7116__delegate.call(this, x, y, more)
    };
    G__7116.cljs$lang$maxFixedArity = 2;
    G__7116.cljs$lang$applyTo = function(arglist__7120) {
      var x = cljs.core.first(arglist__7120);
      var y = cljs.core.first(cljs.core.next(arglist__7120));
      var more = cljs.core.rest(cljs.core.next(arglist__7120));
      return G__7116__delegate(x, y, more)
    };
    G__7116.cljs$lang$arity$variadic = G__7116__delegate;
    return G__7116
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7121__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7121 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7121__delegate.call(this, x, y, more)
    };
    G__7121.cljs$lang$maxFixedArity = 2;
    G__7121.cljs$lang$applyTo = function(arglist__7122) {
      var x = cljs.core.first(arglist__7122);
      var y = cljs.core.first(cljs.core.next(arglist__7122));
      var more = cljs.core.rest(cljs.core.next(arglist__7122));
      return G__7121__delegate(x, y, more)
    };
    G__7121.cljs$lang$arity$variadic = G__7121__delegate;
    return G__7121
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7123__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7123 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7123__delegate.call(this, x, y, more)
    };
    G__7123.cljs$lang$maxFixedArity = 2;
    G__7123.cljs$lang$applyTo = function(arglist__7124) {
      var x = cljs.core.first(arglist__7124);
      var y = cljs.core.first(cljs.core.next(arglist__7124));
      var more = cljs.core.rest(cljs.core.next(arglist__7124));
      return G__7123__delegate(x, y, more)
    };
    G__7123.cljs$lang$arity$variadic = G__7123__delegate;
    return G__7123
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7126 = n % d;
  return cljs.core.fix.call(null, (n - rem__7126) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7128 = cljs.core.quot.call(null, n, d);
  return n - d * q__7128
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7131 = v - (v >> 1 & 1431655765);
  var v__7132 = (v__7131 & 858993459) + (v__7131 >> 2 & 858993459);
  return(v__7132 + (v__7132 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7133__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7134 = y;
            var G__7135 = cljs.core.first.call(null, more);
            var G__7136 = cljs.core.next.call(null, more);
            x = G__7134;
            y = G__7135;
            more = G__7136;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7133 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7133__delegate.call(this, x, y, more)
    };
    G__7133.cljs$lang$maxFixedArity = 2;
    G__7133.cljs$lang$applyTo = function(arglist__7137) {
      var x = cljs.core.first(arglist__7137);
      var y = cljs.core.first(cljs.core.next(arglist__7137));
      var more = cljs.core.rest(cljs.core.next(arglist__7137));
      return G__7133__delegate(x, y, more)
    };
    G__7133.cljs$lang$arity$variadic = G__7133__delegate;
    return G__7133
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7141 = n;
  var xs__7142 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7143 = xs__7142;
      if(and__3822__auto____7143) {
        return n__7141 > 0
      }else {
        return and__3822__auto____7143
      }
    }())) {
      var G__7144 = n__7141 - 1;
      var G__7145 = cljs.core.next.call(null, xs__7142);
      n__7141 = G__7144;
      xs__7142 = G__7145;
      continue
    }else {
      return xs__7142
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7146__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7147 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7148 = cljs.core.next.call(null, more);
            sb = G__7147;
            more = G__7148;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7146 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7146__delegate.call(this, x, ys)
    };
    G__7146.cljs$lang$maxFixedArity = 1;
    G__7146.cljs$lang$applyTo = function(arglist__7149) {
      var x = cljs.core.first(arglist__7149);
      var ys = cljs.core.rest(arglist__7149);
      return G__7146__delegate(x, ys)
    };
    G__7146.cljs$lang$arity$variadic = G__7146__delegate;
    return G__7146
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7150__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7151 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7152 = cljs.core.next.call(null, more);
            sb = G__7151;
            more = G__7152;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7150 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7150__delegate.call(this, x, ys)
    };
    G__7150.cljs$lang$maxFixedArity = 1;
    G__7150.cljs$lang$applyTo = function(arglist__7153) {
      var x = cljs.core.first(arglist__7153);
      var ys = cljs.core.rest(arglist__7153);
      return G__7150__delegate(x, ys)
    };
    G__7150.cljs$lang$arity$variadic = G__7150__delegate;
    return G__7150
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7154) {
    var fmt = cljs.core.first(arglist__7154);
    var args = cljs.core.rest(arglist__7154);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7157 = cljs.core.seq.call(null, x);
    var ys__7158 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7157 == null) {
        return ys__7158 == null
      }else {
        if(ys__7158 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7157), cljs.core.first.call(null, ys__7158))) {
            var G__7159 = cljs.core.next.call(null, xs__7157);
            var G__7160 = cljs.core.next.call(null, ys__7158);
            xs__7157 = G__7159;
            ys__7158 = G__7160;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7161_SHARP_, p2__7162_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7161_SHARP_, cljs.core.hash.call(null, p2__7162_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7166 = 0;
  var s__7167 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7167) {
      var e__7168 = cljs.core.first.call(null, s__7167);
      var G__7169 = (h__7166 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7168)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7168)))) % 4503599627370496;
      var G__7170 = cljs.core.next.call(null, s__7167);
      h__7166 = G__7169;
      s__7167 = G__7170;
      continue
    }else {
      return h__7166
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7174 = 0;
  var s__7175 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7175) {
      var e__7176 = cljs.core.first.call(null, s__7175);
      var G__7177 = (h__7174 + cljs.core.hash.call(null, e__7176)) % 4503599627370496;
      var G__7178 = cljs.core.next.call(null, s__7175);
      h__7174 = G__7177;
      s__7175 = G__7178;
      continue
    }else {
      return h__7174
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7199__7200 = cljs.core.seq.call(null, fn_map);
  if(G__7199__7200) {
    var G__7202__7204 = cljs.core.first.call(null, G__7199__7200);
    var vec__7203__7205 = G__7202__7204;
    var key_name__7206 = cljs.core.nth.call(null, vec__7203__7205, 0, null);
    var f__7207 = cljs.core.nth.call(null, vec__7203__7205, 1, null);
    var G__7199__7208 = G__7199__7200;
    var G__7202__7209 = G__7202__7204;
    var G__7199__7210 = G__7199__7208;
    while(true) {
      var vec__7211__7212 = G__7202__7209;
      var key_name__7213 = cljs.core.nth.call(null, vec__7211__7212, 0, null);
      var f__7214 = cljs.core.nth.call(null, vec__7211__7212, 1, null);
      var G__7199__7215 = G__7199__7210;
      var str_name__7216 = cljs.core.name.call(null, key_name__7213);
      obj[str_name__7216] = f__7214;
      var temp__3974__auto____7217 = cljs.core.next.call(null, G__7199__7215);
      if(temp__3974__auto____7217) {
        var G__7199__7218 = temp__3974__auto____7217;
        var G__7219 = cljs.core.first.call(null, G__7199__7218);
        var G__7220 = G__7199__7218;
        G__7202__7209 = G__7219;
        G__7199__7210 = G__7220;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7221 = this;
  var h__2228__auto____7222 = this__7221.__hash;
  if(!(h__2228__auto____7222 == null)) {
    return h__2228__auto____7222
  }else {
    var h__2228__auto____7223 = cljs.core.hash_coll.call(null, coll);
    this__7221.__hash = h__2228__auto____7223;
    return h__2228__auto____7223
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7224 = this;
  if(this__7224.count === 1) {
    return null
  }else {
    return this__7224.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7225 = this;
  return new cljs.core.List(this__7225.meta, o, coll, this__7225.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7226 = this;
  var this__7227 = this;
  return cljs.core.pr_str.call(null, this__7227)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7228 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7229 = this;
  return this__7229.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7230 = this;
  return this__7230.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7231 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7232 = this;
  return this__7232.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7233 = this;
  if(this__7233.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7233.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7234 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7235 = this;
  return new cljs.core.List(meta, this__7235.first, this__7235.rest, this__7235.count, this__7235.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7236 = this;
  return this__7236.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7237 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7238 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7239 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7240 = this;
  return new cljs.core.List(this__7240.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7241 = this;
  var this__7242 = this;
  return cljs.core.pr_str.call(null, this__7242)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7243 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7244 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7245 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7246 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7247 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7248 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7249 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7250 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7251 = this;
  return this__7251.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7252 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7256__7257 = coll;
  if(G__7256__7257) {
    if(function() {
      var or__3824__auto____7258 = G__7256__7257.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7258) {
        return or__3824__auto____7258
      }else {
        return G__7256__7257.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7256__7257.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7256__7257)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7256__7257)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7259__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7259 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7259__delegate.call(this, x, y, z, items)
    };
    G__7259.cljs$lang$maxFixedArity = 3;
    G__7259.cljs$lang$applyTo = function(arglist__7260) {
      var x = cljs.core.first(arglist__7260);
      var y = cljs.core.first(cljs.core.next(arglist__7260));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7260)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7260)));
      return G__7259__delegate(x, y, z, items)
    };
    G__7259.cljs$lang$arity$variadic = G__7259__delegate;
    return G__7259
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7261 = this;
  var h__2228__auto____7262 = this__7261.__hash;
  if(!(h__2228__auto____7262 == null)) {
    return h__2228__auto____7262
  }else {
    var h__2228__auto____7263 = cljs.core.hash_coll.call(null, coll);
    this__7261.__hash = h__2228__auto____7263;
    return h__2228__auto____7263
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7264 = this;
  if(this__7264.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7264.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7265 = this;
  return new cljs.core.Cons(null, o, coll, this__7265.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7266 = this;
  var this__7267 = this;
  return cljs.core.pr_str.call(null, this__7267)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7268 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7269 = this;
  return this__7269.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7270 = this;
  if(this__7270.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7270.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7271 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7272 = this;
  return new cljs.core.Cons(meta, this__7272.first, this__7272.rest, this__7272.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7273 = this;
  return this__7273.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7274 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7274.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7279 = coll == null;
    if(or__3824__auto____7279) {
      return or__3824__auto____7279
    }else {
      var G__7280__7281 = coll;
      if(G__7280__7281) {
        if(function() {
          var or__3824__auto____7282 = G__7280__7281.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7282) {
            return or__3824__auto____7282
          }else {
            return G__7280__7281.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7280__7281.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7280__7281)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7280__7281)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7286__7287 = x;
  if(G__7286__7287) {
    if(function() {
      var or__3824__auto____7288 = G__7286__7287.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7288) {
        return or__3824__auto____7288
      }else {
        return G__7286__7287.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7286__7287.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7286__7287)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7286__7287)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7289 = null;
  var G__7289__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7289__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7289 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7289__2.call(this, string, f);
      case 3:
        return G__7289__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7289
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7290 = null;
  var G__7290__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7290__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7290 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7290__2.call(this, string, k);
      case 3:
        return G__7290__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7290
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7291 = null;
  var G__7291__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7291__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7291 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7291__2.call(this, string, n);
      case 3:
        return G__7291__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7291
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7303 = null;
  var G__7303__2 = function(this_sym7294, coll) {
    var this__7296 = this;
    var this_sym7294__7297 = this;
    var ___7298 = this_sym7294__7297;
    if(coll == null) {
      return null
    }else {
      var strobj__7299 = coll.strobj;
      if(strobj__7299 == null) {
        return cljs.core._lookup.call(null, coll, this__7296.k, null)
      }else {
        return strobj__7299[this__7296.k]
      }
    }
  };
  var G__7303__3 = function(this_sym7295, coll, not_found) {
    var this__7296 = this;
    var this_sym7295__7300 = this;
    var ___7301 = this_sym7295__7300;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7296.k, not_found)
    }
  };
  G__7303 = function(this_sym7295, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7303__2.call(this, this_sym7295, coll);
      case 3:
        return G__7303__3.call(this, this_sym7295, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7303
}();
cljs.core.Keyword.prototype.apply = function(this_sym7292, args7293) {
  var this__7302 = this;
  return this_sym7292.call.apply(this_sym7292, [this_sym7292].concat(args7293.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7312 = null;
  var G__7312__2 = function(this_sym7306, coll) {
    var this_sym7306__7308 = this;
    var this__7309 = this_sym7306__7308;
    return cljs.core._lookup.call(null, coll, this__7309.toString(), null)
  };
  var G__7312__3 = function(this_sym7307, coll, not_found) {
    var this_sym7307__7310 = this;
    var this__7311 = this_sym7307__7310;
    return cljs.core._lookup.call(null, coll, this__7311.toString(), not_found)
  };
  G__7312 = function(this_sym7307, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7312__2.call(this, this_sym7307, coll);
      case 3:
        return G__7312__3.call(this, this_sym7307, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7312
}();
String.prototype.apply = function(this_sym7304, args7305) {
  return this_sym7304.call.apply(this_sym7304, [this_sym7304].concat(args7305.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7314 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7314
  }else {
    lazy_seq.x = x__7314.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7315 = this;
  var h__2228__auto____7316 = this__7315.__hash;
  if(!(h__2228__auto____7316 == null)) {
    return h__2228__auto____7316
  }else {
    var h__2228__auto____7317 = cljs.core.hash_coll.call(null, coll);
    this__7315.__hash = h__2228__auto____7317;
    return h__2228__auto____7317
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7318 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7319 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7320 = this;
  var this__7321 = this;
  return cljs.core.pr_str.call(null, this__7321)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7322 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7323 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7324 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7325 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7326 = this;
  return new cljs.core.LazySeq(meta, this__7326.realized, this__7326.x, this__7326.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7327 = this;
  return this__7327.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7328 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7328.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7329 = this;
  return this__7329.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7330 = this;
  var ___7331 = this;
  this__7330.buf[this__7330.end] = o;
  return this__7330.end = this__7330.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7332 = this;
  var ___7333 = this;
  var ret__7334 = new cljs.core.ArrayChunk(this__7332.buf, 0, this__7332.end);
  this__7332.buf = null;
  return ret__7334
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7335 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7335.arr[this__7335.off], this__7335.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7336 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7336.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7337 = this;
  if(this__7337.off === this__7337.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7337.arr, this__7337.off + 1, this__7337.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7338 = this;
  return this__7338.arr[this__7338.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7339 = this;
  if(function() {
    var and__3822__auto____7340 = i >= 0;
    if(and__3822__auto____7340) {
      return i < this__7339.end - this__7339.off
    }else {
      return and__3822__auto____7340
    }
  }()) {
    return this__7339.arr[this__7339.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7341 = this;
  return this__7341.end - this__7341.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7342 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7343 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7344 = this;
  return cljs.core._nth.call(null, this__7344.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7345 = this;
  if(cljs.core._count.call(null, this__7345.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7345.chunk), this__7345.more, this__7345.meta)
  }else {
    if(this__7345.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7345.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7346 = this;
  if(this__7346.more == null) {
    return null
  }else {
    return this__7346.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7347 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7348 = this;
  return new cljs.core.ChunkedCons(this__7348.chunk, this__7348.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7349 = this;
  return this__7349.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7350 = this;
  return this__7350.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7351 = this;
  if(this__7351.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7351.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7355__7356 = s;
    if(G__7355__7356) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7357 = null;
        if(cljs.core.truth_(or__3824__auto____7357)) {
          return or__3824__auto____7357
        }else {
          return G__7355__7356.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7355__7356.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7355__7356)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7355__7356)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7360 = [];
  var s__7361 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7361)) {
      ary__7360.push(cljs.core.first.call(null, s__7361));
      var G__7362 = cljs.core.next.call(null, s__7361);
      s__7361 = G__7362;
      continue
    }else {
      return ary__7360
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7366 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7367 = 0;
  var xs__7368 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7368) {
      ret__7366[i__7367] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7368));
      var G__7369 = i__7367 + 1;
      var G__7370 = cljs.core.next.call(null, xs__7368);
      i__7367 = G__7369;
      xs__7368 = G__7370;
      continue
    }else {
    }
    break
  }
  return ret__7366
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7378 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7379 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7380 = 0;
      var s__7381 = s__7379;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7382 = s__7381;
          if(and__3822__auto____7382) {
            return i__7380 < size
          }else {
            return and__3822__auto____7382
          }
        }())) {
          a__7378[i__7380] = cljs.core.first.call(null, s__7381);
          var G__7385 = i__7380 + 1;
          var G__7386 = cljs.core.next.call(null, s__7381);
          i__7380 = G__7385;
          s__7381 = G__7386;
          continue
        }else {
          return a__7378
        }
        break
      }
    }else {
      var n__2563__auto____7383 = size;
      var i__7384 = 0;
      while(true) {
        if(i__7384 < n__2563__auto____7383) {
          a__7378[i__7384] = init_val_or_seq;
          var G__7387 = i__7384 + 1;
          i__7384 = G__7387;
          continue
        }else {
        }
        break
      }
      return a__7378
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7395 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7396 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7397 = 0;
      var s__7398 = s__7396;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7399 = s__7398;
          if(and__3822__auto____7399) {
            return i__7397 < size
          }else {
            return and__3822__auto____7399
          }
        }())) {
          a__7395[i__7397] = cljs.core.first.call(null, s__7398);
          var G__7402 = i__7397 + 1;
          var G__7403 = cljs.core.next.call(null, s__7398);
          i__7397 = G__7402;
          s__7398 = G__7403;
          continue
        }else {
          return a__7395
        }
        break
      }
    }else {
      var n__2563__auto____7400 = size;
      var i__7401 = 0;
      while(true) {
        if(i__7401 < n__2563__auto____7400) {
          a__7395[i__7401] = init_val_or_seq;
          var G__7404 = i__7401 + 1;
          i__7401 = G__7404;
          continue
        }else {
        }
        break
      }
      return a__7395
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7412 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7413 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7414 = 0;
      var s__7415 = s__7413;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7416 = s__7415;
          if(and__3822__auto____7416) {
            return i__7414 < size
          }else {
            return and__3822__auto____7416
          }
        }())) {
          a__7412[i__7414] = cljs.core.first.call(null, s__7415);
          var G__7419 = i__7414 + 1;
          var G__7420 = cljs.core.next.call(null, s__7415);
          i__7414 = G__7419;
          s__7415 = G__7420;
          continue
        }else {
          return a__7412
        }
        break
      }
    }else {
      var n__2563__auto____7417 = size;
      var i__7418 = 0;
      while(true) {
        if(i__7418 < n__2563__auto____7417) {
          a__7412[i__7418] = init_val_or_seq;
          var G__7421 = i__7418 + 1;
          i__7418 = G__7421;
          continue
        }else {
        }
        break
      }
      return a__7412
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7426 = s;
    var i__7427 = n;
    var sum__7428 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7429 = i__7427 > 0;
        if(and__3822__auto____7429) {
          return cljs.core.seq.call(null, s__7426)
        }else {
          return and__3822__auto____7429
        }
      }())) {
        var G__7430 = cljs.core.next.call(null, s__7426);
        var G__7431 = i__7427 - 1;
        var G__7432 = sum__7428 + 1;
        s__7426 = G__7430;
        i__7427 = G__7431;
        sum__7428 = G__7432;
        continue
      }else {
        return sum__7428
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7437 = cljs.core.seq.call(null, x);
      if(s__7437) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7437)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7437), concat.call(null, cljs.core.chunk_rest.call(null, s__7437), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7437), concat.call(null, cljs.core.rest.call(null, s__7437), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7441__delegate = function(x, y, zs) {
      var cat__7440 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7439 = cljs.core.seq.call(null, xys);
          if(xys__7439) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7439)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7439), cat.call(null, cljs.core.chunk_rest.call(null, xys__7439), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7439), cat.call(null, cljs.core.rest.call(null, xys__7439), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7440.call(null, concat.call(null, x, y), zs)
    };
    var G__7441 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7441__delegate.call(this, x, y, zs)
    };
    G__7441.cljs$lang$maxFixedArity = 2;
    G__7441.cljs$lang$applyTo = function(arglist__7442) {
      var x = cljs.core.first(arglist__7442);
      var y = cljs.core.first(cljs.core.next(arglist__7442));
      var zs = cljs.core.rest(cljs.core.next(arglist__7442));
      return G__7441__delegate(x, y, zs)
    };
    G__7441.cljs$lang$arity$variadic = G__7441__delegate;
    return G__7441
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7443__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7443 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7443__delegate.call(this, a, b, c, d, more)
    };
    G__7443.cljs$lang$maxFixedArity = 4;
    G__7443.cljs$lang$applyTo = function(arglist__7444) {
      var a = cljs.core.first(arglist__7444);
      var b = cljs.core.first(cljs.core.next(arglist__7444));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7444)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7444))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7444))));
      return G__7443__delegate(a, b, c, d, more)
    };
    G__7443.cljs$lang$arity$variadic = G__7443__delegate;
    return G__7443
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7486 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7487 = cljs.core._first.call(null, args__7486);
    var args__7488 = cljs.core._rest.call(null, args__7486);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7487)
      }else {
        return f.call(null, a__7487)
      }
    }else {
      var b__7489 = cljs.core._first.call(null, args__7488);
      var args__7490 = cljs.core._rest.call(null, args__7488);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7487, b__7489)
        }else {
          return f.call(null, a__7487, b__7489)
        }
      }else {
        var c__7491 = cljs.core._first.call(null, args__7490);
        var args__7492 = cljs.core._rest.call(null, args__7490);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7487, b__7489, c__7491)
          }else {
            return f.call(null, a__7487, b__7489, c__7491)
          }
        }else {
          var d__7493 = cljs.core._first.call(null, args__7492);
          var args__7494 = cljs.core._rest.call(null, args__7492);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7487, b__7489, c__7491, d__7493)
            }else {
              return f.call(null, a__7487, b__7489, c__7491, d__7493)
            }
          }else {
            var e__7495 = cljs.core._first.call(null, args__7494);
            var args__7496 = cljs.core._rest.call(null, args__7494);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7487, b__7489, c__7491, d__7493, e__7495)
              }else {
                return f.call(null, a__7487, b__7489, c__7491, d__7493, e__7495)
              }
            }else {
              var f__7497 = cljs.core._first.call(null, args__7496);
              var args__7498 = cljs.core._rest.call(null, args__7496);
              if(argc === 6) {
                if(f__7497.cljs$lang$arity$6) {
                  return f__7497.cljs$lang$arity$6(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497)
                }else {
                  return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497)
                }
              }else {
                var g__7499 = cljs.core._first.call(null, args__7498);
                var args__7500 = cljs.core._rest.call(null, args__7498);
                if(argc === 7) {
                  if(f__7497.cljs$lang$arity$7) {
                    return f__7497.cljs$lang$arity$7(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499)
                  }else {
                    return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499)
                  }
                }else {
                  var h__7501 = cljs.core._first.call(null, args__7500);
                  var args__7502 = cljs.core._rest.call(null, args__7500);
                  if(argc === 8) {
                    if(f__7497.cljs$lang$arity$8) {
                      return f__7497.cljs$lang$arity$8(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501)
                    }else {
                      return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501)
                    }
                  }else {
                    var i__7503 = cljs.core._first.call(null, args__7502);
                    var args__7504 = cljs.core._rest.call(null, args__7502);
                    if(argc === 9) {
                      if(f__7497.cljs$lang$arity$9) {
                        return f__7497.cljs$lang$arity$9(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503)
                      }else {
                        return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503)
                      }
                    }else {
                      var j__7505 = cljs.core._first.call(null, args__7504);
                      var args__7506 = cljs.core._rest.call(null, args__7504);
                      if(argc === 10) {
                        if(f__7497.cljs$lang$arity$10) {
                          return f__7497.cljs$lang$arity$10(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505)
                        }else {
                          return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505)
                        }
                      }else {
                        var k__7507 = cljs.core._first.call(null, args__7506);
                        var args__7508 = cljs.core._rest.call(null, args__7506);
                        if(argc === 11) {
                          if(f__7497.cljs$lang$arity$11) {
                            return f__7497.cljs$lang$arity$11(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507)
                          }else {
                            return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507)
                          }
                        }else {
                          var l__7509 = cljs.core._first.call(null, args__7508);
                          var args__7510 = cljs.core._rest.call(null, args__7508);
                          if(argc === 12) {
                            if(f__7497.cljs$lang$arity$12) {
                              return f__7497.cljs$lang$arity$12(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509)
                            }else {
                              return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509)
                            }
                          }else {
                            var m__7511 = cljs.core._first.call(null, args__7510);
                            var args__7512 = cljs.core._rest.call(null, args__7510);
                            if(argc === 13) {
                              if(f__7497.cljs$lang$arity$13) {
                                return f__7497.cljs$lang$arity$13(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511)
                              }else {
                                return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511)
                              }
                            }else {
                              var n__7513 = cljs.core._first.call(null, args__7512);
                              var args__7514 = cljs.core._rest.call(null, args__7512);
                              if(argc === 14) {
                                if(f__7497.cljs$lang$arity$14) {
                                  return f__7497.cljs$lang$arity$14(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513)
                                }else {
                                  return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513)
                                }
                              }else {
                                var o__7515 = cljs.core._first.call(null, args__7514);
                                var args__7516 = cljs.core._rest.call(null, args__7514);
                                if(argc === 15) {
                                  if(f__7497.cljs$lang$arity$15) {
                                    return f__7497.cljs$lang$arity$15(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515)
                                  }else {
                                    return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515)
                                  }
                                }else {
                                  var p__7517 = cljs.core._first.call(null, args__7516);
                                  var args__7518 = cljs.core._rest.call(null, args__7516);
                                  if(argc === 16) {
                                    if(f__7497.cljs$lang$arity$16) {
                                      return f__7497.cljs$lang$arity$16(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515, p__7517)
                                    }else {
                                      return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515, p__7517)
                                    }
                                  }else {
                                    var q__7519 = cljs.core._first.call(null, args__7518);
                                    var args__7520 = cljs.core._rest.call(null, args__7518);
                                    if(argc === 17) {
                                      if(f__7497.cljs$lang$arity$17) {
                                        return f__7497.cljs$lang$arity$17(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515, p__7517, q__7519)
                                      }else {
                                        return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515, p__7517, q__7519)
                                      }
                                    }else {
                                      var r__7521 = cljs.core._first.call(null, args__7520);
                                      var args__7522 = cljs.core._rest.call(null, args__7520);
                                      if(argc === 18) {
                                        if(f__7497.cljs$lang$arity$18) {
                                          return f__7497.cljs$lang$arity$18(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515, p__7517, q__7519, r__7521)
                                        }else {
                                          return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515, p__7517, q__7519, r__7521)
                                        }
                                      }else {
                                        var s__7523 = cljs.core._first.call(null, args__7522);
                                        var args__7524 = cljs.core._rest.call(null, args__7522);
                                        if(argc === 19) {
                                          if(f__7497.cljs$lang$arity$19) {
                                            return f__7497.cljs$lang$arity$19(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515, p__7517, q__7519, r__7521, s__7523)
                                          }else {
                                            return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515, p__7517, q__7519, r__7521, s__7523)
                                          }
                                        }else {
                                          var t__7525 = cljs.core._first.call(null, args__7524);
                                          var args__7526 = cljs.core._rest.call(null, args__7524);
                                          if(argc === 20) {
                                            if(f__7497.cljs$lang$arity$20) {
                                              return f__7497.cljs$lang$arity$20(a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515, p__7517, q__7519, r__7521, s__7523, t__7525)
                                            }else {
                                              return f__7497.call(null, a__7487, b__7489, c__7491, d__7493, e__7495, f__7497, g__7499, h__7501, i__7503, j__7505, k__7507, l__7509, m__7511, n__7513, o__7515, p__7517, q__7519, r__7521, s__7523, t__7525)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7541 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7542 = cljs.core.bounded_count.call(null, args, fixed_arity__7541 + 1);
      if(bc__7542 <= fixed_arity__7541) {
        return cljs.core.apply_to.call(null, f, bc__7542, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7543 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7544 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7545 = cljs.core.bounded_count.call(null, arglist__7543, fixed_arity__7544 + 1);
      if(bc__7545 <= fixed_arity__7544) {
        return cljs.core.apply_to.call(null, f, bc__7545, arglist__7543)
      }else {
        return f.cljs$lang$applyTo(arglist__7543)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7543))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7546 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7547 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7548 = cljs.core.bounded_count.call(null, arglist__7546, fixed_arity__7547 + 1);
      if(bc__7548 <= fixed_arity__7547) {
        return cljs.core.apply_to.call(null, f, bc__7548, arglist__7546)
      }else {
        return f.cljs$lang$applyTo(arglist__7546)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7546))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7549 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7550 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7551 = cljs.core.bounded_count.call(null, arglist__7549, fixed_arity__7550 + 1);
      if(bc__7551 <= fixed_arity__7550) {
        return cljs.core.apply_to.call(null, f, bc__7551, arglist__7549)
      }else {
        return f.cljs$lang$applyTo(arglist__7549)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7549))
    }
  };
  var apply__6 = function() {
    var G__7555__delegate = function(f, a, b, c, d, args) {
      var arglist__7552 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7553 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7554 = cljs.core.bounded_count.call(null, arglist__7552, fixed_arity__7553 + 1);
        if(bc__7554 <= fixed_arity__7553) {
          return cljs.core.apply_to.call(null, f, bc__7554, arglist__7552)
        }else {
          return f.cljs$lang$applyTo(arglist__7552)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7552))
      }
    };
    var G__7555 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7555__delegate.call(this, f, a, b, c, d, args)
    };
    G__7555.cljs$lang$maxFixedArity = 5;
    G__7555.cljs$lang$applyTo = function(arglist__7556) {
      var f = cljs.core.first(arglist__7556);
      var a = cljs.core.first(cljs.core.next(arglist__7556));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7556)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7556))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7556)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7556)))));
      return G__7555__delegate(f, a, b, c, d, args)
    };
    G__7555.cljs$lang$arity$variadic = G__7555__delegate;
    return G__7555
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7557) {
    var obj = cljs.core.first(arglist__7557);
    var f = cljs.core.first(cljs.core.next(arglist__7557));
    var args = cljs.core.rest(cljs.core.next(arglist__7557));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7558__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7558 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7558__delegate.call(this, x, y, more)
    };
    G__7558.cljs$lang$maxFixedArity = 2;
    G__7558.cljs$lang$applyTo = function(arglist__7559) {
      var x = cljs.core.first(arglist__7559);
      var y = cljs.core.first(cljs.core.next(arglist__7559));
      var more = cljs.core.rest(cljs.core.next(arglist__7559));
      return G__7558__delegate(x, y, more)
    };
    G__7558.cljs$lang$arity$variadic = G__7558__delegate;
    return G__7558
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7560 = pred;
        var G__7561 = cljs.core.next.call(null, coll);
        pred = G__7560;
        coll = G__7561;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____7563 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7563)) {
        return or__3824__auto____7563
      }else {
        var G__7564 = pred;
        var G__7565 = cljs.core.next.call(null, coll);
        pred = G__7564;
        coll = G__7565;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7566 = null;
    var G__7566__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7566__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7566__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7566__3 = function() {
      var G__7567__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7567 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7567__delegate.call(this, x, y, zs)
      };
      G__7567.cljs$lang$maxFixedArity = 2;
      G__7567.cljs$lang$applyTo = function(arglist__7568) {
        var x = cljs.core.first(arglist__7568);
        var y = cljs.core.first(cljs.core.next(arglist__7568));
        var zs = cljs.core.rest(cljs.core.next(arglist__7568));
        return G__7567__delegate(x, y, zs)
      };
      G__7567.cljs$lang$arity$variadic = G__7567__delegate;
      return G__7567
    }();
    G__7566 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7566__0.call(this);
        case 1:
          return G__7566__1.call(this, x);
        case 2:
          return G__7566__2.call(this, x, y);
        default:
          return G__7566__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7566.cljs$lang$maxFixedArity = 2;
    G__7566.cljs$lang$applyTo = G__7566__3.cljs$lang$applyTo;
    return G__7566
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7569__delegate = function(args) {
      return x
    };
    var G__7569 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7569__delegate.call(this, args)
    };
    G__7569.cljs$lang$maxFixedArity = 0;
    G__7569.cljs$lang$applyTo = function(arglist__7570) {
      var args = cljs.core.seq(arglist__7570);
      return G__7569__delegate(args)
    };
    G__7569.cljs$lang$arity$variadic = G__7569__delegate;
    return G__7569
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7577 = null;
      var G__7577__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7577__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7577__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7577__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7577__4 = function() {
        var G__7578__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7578 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7578__delegate.call(this, x, y, z, args)
        };
        G__7578.cljs$lang$maxFixedArity = 3;
        G__7578.cljs$lang$applyTo = function(arglist__7579) {
          var x = cljs.core.first(arglist__7579);
          var y = cljs.core.first(cljs.core.next(arglist__7579));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7579)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7579)));
          return G__7578__delegate(x, y, z, args)
        };
        G__7578.cljs$lang$arity$variadic = G__7578__delegate;
        return G__7578
      }();
      G__7577 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7577__0.call(this);
          case 1:
            return G__7577__1.call(this, x);
          case 2:
            return G__7577__2.call(this, x, y);
          case 3:
            return G__7577__3.call(this, x, y, z);
          default:
            return G__7577__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7577.cljs$lang$maxFixedArity = 3;
      G__7577.cljs$lang$applyTo = G__7577__4.cljs$lang$applyTo;
      return G__7577
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7580 = null;
      var G__7580__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7580__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7580__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7580__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7580__4 = function() {
        var G__7581__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7581 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7581__delegate.call(this, x, y, z, args)
        };
        G__7581.cljs$lang$maxFixedArity = 3;
        G__7581.cljs$lang$applyTo = function(arglist__7582) {
          var x = cljs.core.first(arglist__7582);
          var y = cljs.core.first(cljs.core.next(arglist__7582));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7582)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7582)));
          return G__7581__delegate(x, y, z, args)
        };
        G__7581.cljs$lang$arity$variadic = G__7581__delegate;
        return G__7581
      }();
      G__7580 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7580__0.call(this);
          case 1:
            return G__7580__1.call(this, x);
          case 2:
            return G__7580__2.call(this, x, y);
          case 3:
            return G__7580__3.call(this, x, y, z);
          default:
            return G__7580__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7580.cljs$lang$maxFixedArity = 3;
      G__7580.cljs$lang$applyTo = G__7580__4.cljs$lang$applyTo;
      return G__7580
    }()
  };
  var comp__4 = function() {
    var G__7583__delegate = function(f1, f2, f3, fs) {
      var fs__7574 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7584__delegate = function(args) {
          var ret__7575 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7574), args);
          var fs__7576 = cljs.core.next.call(null, fs__7574);
          while(true) {
            if(fs__7576) {
              var G__7585 = cljs.core.first.call(null, fs__7576).call(null, ret__7575);
              var G__7586 = cljs.core.next.call(null, fs__7576);
              ret__7575 = G__7585;
              fs__7576 = G__7586;
              continue
            }else {
              return ret__7575
            }
            break
          }
        };
        var G__7584 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7584__delegate.call(this, args)
        };
        G__7584.cljs$lang$maxFixedArity = 0;
        G__7584.cljs$lang$applyTo = function(arglist__7587) {
          var args = cljs.core.seq(arglist__7587);
          return G__7584__delegate(args)
        };
        G__7584.cljs$lang$arity$variadic = G__7584__delegate;
        return G__7584
      }()
    };
    var G__7583 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7583__delegate.call(this, f1, f2, f3, fs)
    };
    G__7583.cljs$lang$maxFixedArity = 3;
    G__7583.cljs$lang$applyTo = function(arglist__7588) {
      var f1 = cljs.core.first(arglist__7588);
      var f2 = cljs.core.first(cljs.core.next(arglist__7588));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7588)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7588)));
      return G__7583__delegate(f1, f2, f3, fs)
    };
    G__7583.cljs$lang$arity$variadic = G__7583__delegate;
    return G__7583
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7589__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7589 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7589__delegate.call(this, args)
      };
      G__7589.cljs$lang$maxFixedArity = 0;
      G__7589.cljs$lang$applyTo = function(arglist__7590) {
        var args = cljs.core.seq(arglist__7590);
        return G__7589__delegate(args)
      };
      G__7589.cljs$lang$arity$variadic = G__7589__delegate;
      return G__7589
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7591__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7591 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7591__delegate.call(this, args)
      };
      G__7591.cljs$lang$maxFixedArity = 0;
      G__7591.cljs$lang$applyTo = function(arglist__7592) {
        var args = cljs.core.seq(arglist__7592);
        return G__7591__delegate(args)
      };
      G__7591.cljs$lang$arity$variadic = G__7591__delegate;
      return G__7591
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7593__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7593 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7593__delegate.call(this, args)
      };
      G__7593.cljs$lang$maxFixedArity = 0;
      G__7593.cljs$lang$applyTo = function(arglist__7594) {
        var args = cljs.core.seq(arglist__7594);
        return G__7593__delegate(args)
      };
      G__7593.cljs$lang$arity$variadic = G__7593__delegate;
      return G__7593
    }()
  };
  var partial__5 = function() {
    var G__7595__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7596__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7596 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7596__delegate.call(this, args)
        };
        G__7596.cljs$lang$maxFixedArity = 0;
        G__7596.cljs$lang$applyTo = function(arglist__7597) {
          var args = cljs.core.seq(arglist__7597);
          return G__7596__delegate(args)
        };
        G__7596.cljs$lang$arity$variadic = G__7596__delegate;
        return G__7596
      }()
    };
    var G__7595 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7595__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7595.cljs$lang$maxFixedArity = 4;
    G__7595.cljs$lang$applyTo = function(arglist__7598) {
      var f = cljs.core.first(arglist__7598);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7598));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7598)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7598))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7598))));
      return G__7595__delegate(f, arg1, arg2, arg3, more)
    };
    G__7595.cljs$lang$arity$variadic = G__7595__delegate;
    return G__7595
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7599 = null;
      var G__7599__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7599__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7599__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7599__4 = function() {
        var G__7600__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7600 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7600__delegate.call(this, a, b, c, ds)
        };
        G__7600.cljs$lang$maxFixedArity = 3;
        G__7600.cljs$lang$applyTo = function(arglist__7601) {
          var a = cljs.core.first(arglist__7601);
          var b = cljs.core.first(cljs.core.next(arglist__7601));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7601)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7601)));
          return G__7600__delegate(a, b, c, ds)
        };
        G__7600.cljs$lang$arity$variadic = G__7600__delegate;
        return G__7600
      }();
      G__7599 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7599__1.call(this, a);
          case 2:
            return G__7599__2.call(this, a, b);
          case 3:
            return G__7599__3.call(this, a, b, c);
          default:
            return G__7599__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7599.cljs$lang$maxFixedArity = 3;
      G__7599.cljs$lang$applyTo = G__7599__4.cljs$lang$applyTo;
      return G__7599
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7602 = null;
      var G__7602__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7602__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7602__4 = function() {
        var G__7603__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7603 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7603__delegate.call(this, a, b, c, ds)
        };
        G__7603.cljs$lang$maxFixedArity = 3;
        G__7603.cljs$lang$applyTo = function(arglist__7604) {
          var a = cljs.core.first(arglist__7604);
          var b = cljs.core.first(cljs.core.next(arglist__7604));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7604)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7604)));
          return G__7603__delegate(a, b, c, ds)
        };
        G__7603.cljs$lang$arity$variadic = G__7603__delegate;
        return G__7603
      }();
      G__7602 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7602__2.call(this, a, b);
          case 3:
            return G__7602__3.call(this, a, b, c);
          default:
            return G__7602__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7602.cljs$lang$maxFixedArity = 3;
      G__7602.cljs$lang$applyTo = G__7602__4.cljs$lang$applyTo;
      return G__7602
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7605 = null;
      var G__7605__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7605__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7605__4 = function() {
        var G__7606__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7606 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7606__delegate.call(this, a, b, c, ds)
        };
        G__7606.cljs$lang$maxFixedArity = 3;
        G__7606.cljs$lang$applyTo = function(arglist__7607) {
          var a = cljs.core.first(arglist__7607);
          var b = cljs.core.first(cljs.core.next(arglist__7607));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7607)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7607)));
          return G__7606__delegate(a, b, c, ds)
        };
        G__7606.cljs$lang$arity$variadic = G__7606__delegate;
        return G__7606
      }();
      G__7605 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7605__2.call(this, a, b);
          case 3:
            return G__7605__3.call(this, a, b, c);
          default:
            return G__7605__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7605.cljs$lang$maxFixedArity = 3;
      G__7605.cljs$lang$applyTo = G__7605__4.cljs$lang$applyTo;
      return G__7605
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7623 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7631 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7631) {
        var s__7632 = temp__3974__auto____7631;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7632)) {
          var c__7633 = cljs.core.chunk_first.call(null, s__7632);
          var size__7634 = cljs.core.count.call(null, c__7633);
          var b__7635 = cljs.core.chunk_buffer.call(null, size__7634);
          var n__2563__auto____7636 = size__7634;
          var i__7637 = 0;
          while(true) {
            if(i__7637 < n__2563__auto____7636) {
              cljs.core.chunk_append.call(null, b__7635, f.call(null, idx + i__7637, cljs.core._nth.call(null, c__7633, i__7637)));
              var G__7638 = i__7637 + 1;
              i__7637 = G__7638;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7635), mapi.call(null, idx + size__7634, cljs.core.chunk_rest.call(null, s__7632)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7632)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7632)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7623.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7648 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7648) {
      var s__7649 = temp__3974__auto____7648;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7649)) {
        var c__7650 = cljs.core.chunk_first.call(null, s__7649);
        var size__7651 = cljs.core.count.call(null, c__7650);
        var b__7652 = cljs.core.chunk_buffer.call(null, size__7651);
        var n__2563__auto____7653 = size__7651;
        var i__7654 = 0;
        while(true) {
          if(i__7654 < n__2563__auto____7653) {
            var x__7655 = f.call(null, cljs.core._nth.call(null, c__7650, i__7654));
            if(x__7655 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7652, x__7655)
            }
            var G__7657 = i__7654 + 1;
            i__7654 = G__7657;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7652), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7649)))
      }else {
        var x__7656 = f.call(null, cljs.core.first.call(null, s__7649));
        if(x__7656 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7649))
        }else {
          return cljs.core.cons.call(null, x__7656, keep.call(null, f, cljs.core.rest.call(null, s__7649)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7683 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7693 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7693) {
        var s__7694 = temp__3974__auto____7693;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7694)) {
          var c__7695 = cljs.core.chunk_first.call(null, s__7694);
          var size__7696 = cljs.core.count.call(null, c__7695);
          var b__7697 = cljs.core.chunk_buffer.call(null, size__7696);
          var n__2563__auto____7698 = size__7696;
          var i__7699 = 0;
          while(true) {
            if(i__7699 < n__2563__auto____7698) {
              var x__7700 = f.call(null, idx + i__7699, cljs.core._nth.call(null, c__7695, i__7699));
              if(x__7700 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7697, x__7700)
              }
              var G__7702 = i__7699 + 1;
              i__7699 = G__7702;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7697), keepi.call(null, idx + size__7696, cljs.core.chunk_rest.call(null, s__7694)))
        }else {
          var x__7701 = f.call(null, idx, cljs.core.first.call(null, s__7694));
          if(x__7701 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7694))
          }else {
            return cljs.core.cons.call(null, x__7701, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7694)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7683.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7788 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7788)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7788
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7789 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7789)) {
            var and__3822__auto____7790 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7790)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7790
            }
          }else {
            return and__3822__auto____7789
          }
        }())
      };
      var ep1__4 = function() {
        var G__7859__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7791 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7791)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7791
            }
          }())
        };
        var G__7859 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7859__delegate.call(this, x, y, z, args)
        };
        G__7859.cljs$lang$maxFixedArity = 3;
        G__7859.cljs$lang$applyTo = function(arglist__7860) {
          var x = cljs.core.first(arglist__7860);
          var y = cljs.core.first(cljs.core.next(arglist__7860));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7860)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7860)));
          return G__7859__delegate(x, y, z, args)
        };
        G__7859.cljs$lang$arity$variadic = G__7859__delegate;
        return G__7859
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7803 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7803)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7803
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7804 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7804)) {
            var and__3822__auto____7805 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7805)) {
              var and__3822__auto____7806 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7806)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7806
              }
            }else {
              return and__3822__auto____7805
            }
          }else {
            return and__3822__auto____7804
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7807 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7807)) {
            var and__3822__auto____7808 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7808)) {
              var and__3822__auto____7809 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7809)) {
                var and__3822__auto____7810 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7810)) {
                  var and__3822__auto____7811 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7811)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7811
                  }
                }else {
                  return and__3822__auto____7810
                }
              }else {
                return and__3822__auto____7809
              }
            }else {
              return and__3822__auto____7808
            }
          }else {
            return and__3822__auto____7807
          }
        }())
      };
      var ep2__4 = function() {
        var G__7861__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7812 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7812)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7658_SHARP_) {
                var and__3822__auto____7813 = p1.call(null, p1__7658_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7813)) {
                  return p2.call(null, p1__7658_SHARP_)
                }else {
                  return and__3822__auto____7813
                }
              }, args)
            }else {
              return and__3822__auto____7812
            }
          }())
        };
        var G__7861 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7861__delegate.call(this, x, y, z, args)
        };
        G__7861.cljs$lang$maxFixedArity = 3;
        G__7861.cljs$lang$applyTo = function(arglist__7862) {
          var x = cljs.core.first(arglist__7862);
          var y = cljs.core.first(cljs.core.next(arglist__7862));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7862)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7862)));
          return G__7861__delegate(x, y, z, args)
        };
        G__7861.cljs$lang$arity$variadic = G__7861__delegate;
        return G__7861
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7832 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7832)) {
            var and__3822__auto____7833 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7833)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7833
            }
          }else {
            return and__3822__auto____7832
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7834 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7834)) {
            var and__3822__auto____7835 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7835)) {
              var and__3822__auto____7836 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7836)) {
                var and__3822__auto____7837 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7837)) {
                  var and__3822__auto____7838 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7838)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7838
                  }
                }else {
                  return and__3822__auto____7837
                }
              }else {
                return and__3822__auto____7836
              }
            }else {
              return and__3822__auto____7835
            }
          }else {
            return and__3822__auto____7834
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7839 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7839)) {
            var and__3822__auto____7840 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7840)) {
              var and__3822__auto____7841 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7841)) {
                var and__3822__auto____7842 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7842)) {
                  var and__3822__auto____7843 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7843)) {
                    var and__3822__auto____7844 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7844)) {
                      var and__3822__auto____7845 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7845)) {
                        var and__3822__auto____7846 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7846)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7846
                        }
                      }else {
                        return and__3822__auto____7845
                      }
                    }else {
                      return and__3822__auto____7844
                    }
                  }else {
                    return and__3822__auto____7843
                  }
                }else {
                  return and__3822__auto____7842
                }
              }else {
                return and__3822__auto____7841
              }
            }else {
              return and__3822__auto____7840
            }
          }else {
            return and__3822__auto____7839
          }
        }())
      };
      var ep3__4 = function() {
        var G__7863__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7847 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7847)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7659_SHARP_) {
                var and__3822__auto____7848 = p1.call(null, p1__7659_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7848)) {
                  var and__3822__auto____7849 = p2.call(null, p1__7659_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7849)) {
                    return p3.call(null, p1__7659_SHARP_)
                  }else {
                    return and__3822__auto____7849
                  }
                }else {
                  return and__3822__auto____7848
                }
              }, args)
            }else {
              return and__3822__auto____7847
            }
          }())
        };
        var G__7863 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7863__delegate.call(this, x, y, z, args)
        };
        G__7863.cljs$lang$maxFixedArity = 3;
        G__7863.cljs$lang$applyTo = function(arglist__7864) {
          var x = cljs.core.first(arglist__7864);
          var y = cljs.core.first(cljs.core.next(arglist__7864));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7864)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7864)));
          return G__7863__delegate(x, y, z, args)
        };
        G__7863.cljs$lang$arity$variadic = G__7863__delegate;
        return G__7863
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7865__delegate = function(p1, p2, p3, ps) {
      var ps__7850 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7660_SHARP_) {
            return p1__7660_SHARP_.call(null, x)
          }, ps__7850)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7661_SHARP_) {
            var and__3822__auto____7855 = p1__7661_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7855)) {
              return p1__7661_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7855
            }
          }, ps__7850)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7662_SHARP_) {
            var and__3822__auto____7856 = p1__7662_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7856)) {
              var and__3822__auto____7857 = p1__7662_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7857)) {
                return p1__7662_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7857
              }
            }else {
              return and__3822__auto____7856
            }
          }, ps__7850)
        };
        var epn__4 = function() {
          var G__7866__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7858 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7858)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7663_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7663_SHARP_, args)
                }, ps__7850)
              }else {
                return and__3822__auto____7858
              }
            }())
          };
          var G__7866 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7866__delegate.call(this, x, y, z, args)
          };
          G__7866.cljs$lang$maxFixedArity = 3;
          G__7866.cljs$lang$applyTo = function(arglist__7867) {
            var x = cljs.core.first(arglist__7867);
            var y = cljs.core.first(cljs.core.next(arglist__7867));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7867)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7867)));
            return G__7866__delegate(x, y, z, args)
          };
          G__7866.cljs$lang$arity$variadic = G__7866__delegate;
          return G__7866
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7865 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7865__delegate.call(this, p1, p2, p3, ps)
    };
    G__7865.cljs$lang$maxFixedArity = 3;
    G__7865.cljs$lang$applyTo = function(arglist__7868) {
      var p1 = cljs.core.first(arglist__7868);
      var p2 = cljs.core.first(cljs.core.next(arglist__7868));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7868)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7868)));
      return G__7865__delegate(p1, p2, p3, ps)
    };
    G__7865.cljs$lang$arity$variadic = G__7865__delegate;
    return G__7865
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____7949 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7949)) {
          return or__3824__auto____7949
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7950 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7950)) {
          return or__3824__auto____7950
        }else {
          var or__3824__auto____7951 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7951)) {
            return or__3824__auto____7951
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8020__delegate = function(x, y, z, args) {
          var or__3824__auto____7952 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7952)) {
            return or__3824__auto____7952
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8020 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8020__delegate.call(this, x, y, z, args)
        };
        G__8020.cljs$lang$maxFixedArity = 3;
        G__8020.cljs$lang$applyTo = function(arglist__8021) {
          var x = cljs.core.first(arglist__8021);
          var y = cljs.core.first(cljs.core.next(arglist__8021));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8021)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8021)));
          return G__8020__delegate(x, y, z, args)
        };
        G__8020.cljs$lang$arity$variadic = G__8020__delegate;
        return G__8020
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____7964 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7964)) {
          return or__3824__auto____7964
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7965 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7965)) {
          return or__3824__auto____7965
        }else {
          var or__3824__auto____7966 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7966)) {
            return or__3824__auto____7966
          }else {
            var or__3824__auto____7967 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7967)) {
              return or__3824__auto____7967
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7968 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7968)) {
          return or__3824__auto____7968
        }else {
          var or__3824__auto____7969 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7969)) {
            return or__3824__auto____7969
          }else {
            var or__3824__auto____7970 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7970)) {
              return or__3824__auto____7970
            }else {
              var or__3824__auto____7971 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7971)) {
                return or__3824__auto____7971
              }else {
                var or__3824__auto____7972 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7972)) {
                  return or__3824__auto____7972
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8022__delegate = function(x, y, z, args) {
          var or__3824__auto____7973 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7973)) {
            return or__3824__auto____7973
          }else {
            return cljs.core.some.call(null, function(p1__7703_SHARP_) {
              var or__3824__auto____7974 = p1.call(null, p1__7703_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7974)) {
                return or__3824__auto____7974
              }else {
                return p2.call(null, p1__7703_SHARP_)
              }
            }, args)
          }
        };
        var G__8022 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8022__delegate.call(this, x, y, z, args)
        };
        G__8022.cljs$lang$maxFixedArity = 3;
        G__8022.cljs$lang$applyTo = function(arglist__8023) {
          var x = cljs.core.first(arglist__8023);
          var y = cljs.core.first(cljs.core.next(arglist__8023));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8023)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8023)));
          return G__8022__delegate(x, y, z, args)
        };
        G__8022.cljs$lang$arity$variadic = G__8022__delegate;
        return G__8022
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____7993 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7993)) {
          return or__3824__auto____7993
        }else {
          var or__3824__auto____7994 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7994)) {
            return or__3824__auto____7994
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____7995 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7995)) {
          return or__3824__auto____7995
        }else {
          var or__3824__auto____7996 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7996)) {
            return or__3824__auto____7996
          }else {
            var or__3824__auto____7997 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7997)) {
              return or__3824__auto____7997
            }else {
              var or__3824__auto____7998 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7998)) {
                return or__3824__auto____7998
              }else {
                var or__3824__auto____7999 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7999)) {
                  return or__3824__auto____7999
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8000 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8000)) {
          return or__3824__auto____8000
        }else {
          var or__3824__auto____8001 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8001)) {
            return or__3824__auto____8001
          }else {
            var or__3824__auto____8002 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8002)) {
              return or__3824__auto____8002
            }else {
              var or__3824__auto____8003 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8003)) {
                return or__3824__auto____8003
              }else {
                var or__3824__auto____8004 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8004)) {
                  return or__3824__auto____8004
                }else {
                  var or__3824__auto____8005 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8005)) {
                    return or__3824__auto____8005
                  }else {
                    var or__3824__auto____8006 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8006)) {
                      return or__3824__auto____8006
                    }else {
                      var or__3824__auto____8007 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8007)) {
                        return or__3824__auto____8007
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8024__delegate = function(x, y, z, args) {
          var or__3824__auto____8008 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8008)) {
            return or__3824__auto____8008
          }else {
            return cljs.core.some.call(null, function(p1__7704_SHARP_) {
              var or__3824__auto____8009 = p1.call(null, p1__7704_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8009)) {
                return or__3824__auto____8009
              }else {
                var or__3824__auto____8010 = p2.call(null, p1__7704_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8010)) {
                  return or__3824__auto____8010
                }else {
                  return p3.call(null, p1__7704_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8024 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8024__delegate.call(this, x, y, z, args)
        };
        G__8024.cljs$lang$maxFixedArity = 3;
        G__8024.cljs$lang$applyTo = function(arglist__8025) {
          var x = cljs.core.first(arglist__8025);
          var y = cljs.core.first(cljs.core.next(arglist__8025));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8025)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8025)));
          return G__8024__delegate(x, y, z, args)
        };
        G__8024.cljs$lang$arity$variadic = G__8024__delegate;
        return G__8024
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8026__delegate = function(p1, p2, p3, ps) {
      var ps__8011 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7705_SHARP_) {
            return p1__7705_SHARP_.call(null, x)
          }, ps__8011)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7706_SHARP_) {
            var or__3824__auto____8016 = p1__7706_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8016)) {
              return or__3824__auto____8016
            }else {
              return p1__7706_SHARP_.call(null, y)
            }
          }, ps__8011)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7707_SHARP_) {
            var or__3824__auto____8017 = p1__7707_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8017)) {
              return or__3824__auto____8017
            }else {
              var or__3824__auto____8018 = p1__7707_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8018)) {
                return or__3824__auto____8018
              }else {
                return p1__7707_SHARP_.call(null, z)
              }
            }
          }, ps__8011)
        };
        var spn__4 = function() {
          var G__8027__delegate = function(x, y, z, args) {
            var or__3824__auto____8019 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8019)) {
              return or__3824__auto____8019
            }else {
              return cljs.core.some.call(null, function(p1__7708_SHARP_) {
                return cljs.core.some.call(null, p1__7708_SHARP_, args)
              }, ps__8011)
            }
          };
          var G__8027 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8027__delegate.call(this, x, y, z, args)
          };
          G__8027.cljs$lang$maxFixedArity = 3;
          G__8027.cljs$lang$applyTo = function(arglist__8028) {
            var x = cljs.core.first(arglist__8028);
            var y = cljs.core.first(cljs.core.next(arglist__8028));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8028)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8028)));
            return G__8027__delegate(x, y, z, args)
          };
          G__8027.cljs$lang$arity$variadic = G__8027__delegate;
          return G__8027
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8026 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8026__delegate.call(this, p1, p2, p3, ps)
    };
    G__8026.cljs$lang$maxFixedArity = 3;
    G__8026.cljs$lang$applyTo = function(arglist__8029) {
      var p1 = cljs.core.first(arglist__8029);
      var p2 = cljs.core.first(cljs.core.next(arglist__8029));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8029)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8029)));
      return G__8026__delegate(p1, p2, p3, ps)
    };
    G__8026.cljs$lang$arity$variadic = G__8026__delegate;
    return G__8026
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8048 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8048) {
        var s__8049 = temp__3974__auto____8048;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8049)) {
          var c__8050 = cljs.core.chunk_first.call(null, s__8049);
          var size__8051 = cljs.core.count.call(null, c__8050);
          var b__8052 = cljs.core.chunk_buffer.call(null, size__8051);
          var n__2563__auto____8053 = size__8051;
          var i__8054 = 0;
          while(true) {
            if(i__8054 < n__2563__auto____8053) {
              cljs.core.chunk_append.call(null, b__8052, f.call(null, cljs.core._nth.call(null, c__8050, i__8054)));
              var G__8066 = i__8054 + 1;
              i__8054 = G__8066;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8052), map.call(null, f, cljs.core.chunk_rest.call(null, s__8049)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8049)), map.call(null, f, cljs.core.rest.call(null, s__8049)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8055 = cljs.core.seq.call(null, c1);
      var s2__8056 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8057 = s1__8055;
        if(and__3822__auto____8057) {
          return s2__8056
        }else {
          return and__3822__auto____8057
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8055), cljs.core.first.call(null, s2__8056)), map.call(null, f, cljs.core.rest.call(null, s1__8055), cljs.core.rest.call(null, s2__8056)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8058 = cljs.core.seq.call(null, c1);
      var s2__8059 = cljs.core.seq.call(null, c2);
      var s3__8060 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8061 = s1__8058;
        if(and__3822__auto____8061) {
          var and__3822__auto____8062 = s2__8059;
          if(and__3822__auto____8062) {
            return s3__8060
          }else {
            return and__3822__auto____8062
          }
        }else {
          return and__3822__auto____8061
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8058), cljs.core.first.call(null, s2__8059), cljs.core.first.call(null, s3__8060)), map.call(null, f, cljs.core.rest.call(null, s1__8058), cljs.core.rest.call(null, s2__8059), cljs.core.rest.call(null, s3__8060)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8067__delegate = function(f, c1, c2, c3, colls) {
      var step__8065 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8064 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8064)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8064), step.call(null, map.call(null, cljs.core.rest, ss__8064)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7869_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7869_SHARP_)
      }, step__8065.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8067 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8067__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8067.cljs$lang$maxFixedArity = 4;
    G__8067.cljs$lang$applyTo = function(arglist__8068) {
      var f = cljs.core.first(arglist__8068);
      var c1 = cljs.core.first(cljs.core.next(arglist__8068));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8068)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8068))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8068))));
      return G__8067__delegate(f, c1, c2, c3, colls)
    };
    G__8067.cljs$lang$arity$variadic = G__8067__delegate;
    return G__8067
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8071 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8071) {
        var s__8072 = temp__3974__auto____8071;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8072), take.call(null, n - 1, cljs.core.rest.call(null, s__8072)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8078 = function(n, coll) {
    while(true) {
      var s__8076 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8077 = n > 0;
        if(and__3822__auto____8077) {
          return s__8076
        }else {
          return and__3822__auto____8077
        }
      }())) {
        var G__8079 = n - 1;
        var G__8080 = cljs.core.rest.call(null, s__8076);
        n = G__8079;
        coll = G__8080;
        continue
      }else {
        return s__8076
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8078.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8083 = cljs.core.seq.call(null, coll);
  var lead__8084 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8084) {
      var G__8085 = cljs.core.next.call(null, s__8083);
      var G__8086 = cljs.core.next.call(null, lead__8084);
      s__8083 = G__8085;
      lead__8084 = G__8086;
      continue
    }else {
      return s__8083
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8092 = function(pred, coll) {
    while(true) {
      var s__8090 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8091 = s__8090;
        if(and__3822__auto____8091) {
          return pred.call(null, cljs.core.first.call(null, s__8090))
        }else {
          return and__3822__auto____8091
        }
      }())) {
        var G__8093 = pred;
        var G__8094 = cljs.core.rest.call(null, s__8090);
        pred = G__8093;
        coll = G__8094;
        continue
      }else {
        return s__8090
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8092.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8097 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8097) {
      var s__8098 = temp__3974__auto____8097;
      return cljs.core.concat.call(null, s__8098, cycle.call(null, s__8098))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8103 = cljs.core.seq.call(null, c1);
      var s2__8104 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8105 = s1__8103;
        if(and__3822__auto____8105) {
          return s2__8104
        }else {
          return and__3822__auto____8105
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8103), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8104), interleave.call(null, cljs.core.rest.call(null, s1__8103), cljs.core.rest.call(null, s2__8104))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8107__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8106 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8106)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8106), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8106)))
        }else {
          return null
        }
      }, null)
    };
    var G__8107 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8107__delegate.call(this, c1, c2, colls)
    };
    G__8107.cljs$lang$maxFixedArity = 2;
    G__8107.cljs$lang$applyTo = function(arglist__8108) {
      var c1 = cljs.core.first(arglist__8108);
      var c2 = cljs.core.first(cljs.core.next(arglist__8108));
      var colls = cljs.core.rest(cljs.core.next(arglist__8108));
      return G__8107__delegate(c1, c2, colls)
    };
    G__8107.cljs$lang$arity$variadic = G__8107__delegate;
    return G__8107
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8118 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8116 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8116) {
        var coll__8117 = temp__3971__auto____8116;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8117), cat.call(null, cljs.core.rest.call(null, coll__8117), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8118.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8119__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8119 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8119__delegate.call(this, f, coll, colls)
    };
    G__8119.cljs$lang$maxFixedArity = 2;
    G__8119.cljs$lang$applyTo = function(arglist__8120) {
      var f = cljs.core.first(arglist__8120);
      var coll = cljs.core.first(cljs.core.next(arglist__8120));
      var colls = cljs.core.rest(cljs.core.next(arglist__8120));
      return G__8119__delegate(f, coll, colls)
    };
    G__8119.cljs$lang$arity$variadic = G__8119__delegate;
    return G__8119
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8130 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8130) {
      var s__8131 = temp__3974__auto____8130;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8131)) {
        var c__8132 = cljs.core.chunk_first.call(null, s__8131);
        var size__8133 = cljs.core.count.call(null, c__8132);
        var b__8134 = cljs.core.chunk_buffer.call(null, size__8133);
        var n__2563__auto____8135 = size__8133;
        var i__8136 = 0;
        while(true) {
          if(i__8136 < n__2563__auto____8135) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8132, i__8136)))) {
              cljs.core.chunk_append.call(null, b__8134, cljs.core._nth.call(null, c__8132, i__8136))
            }else {
            }
            var G__8139 = i__8136 + 1;
            i__8136 = G__8139;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8134), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8131)))
      }else {
        var f__8137 = cljs.core.first.call(null, s__8131);
        var r__8138 = cljs.core.rest.call(null, s__8131);
        if(cljs.core.truth_(pred.call(null, f__8137))) {
          return cljs.core.cons.call(null, f__8137, filter.call(null, pred, r__8138))
        }else {
          return filter.call(null, pred, r__8138)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8142 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8142.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8140_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8140_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8146__8147 = to;
    if(G__8146__8147) {
      if(function() {
        var or__3824__auto____8148 = G__8146__8147.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8148) {
          return or__3824__auto____8148
        }else {
          return G__8146__8147.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8146__8147.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8146__8147)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8146__8147)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8149__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8149 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8149__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8149.cljs$lang$maxFixedArity = 4;
    G__8149.cljs$lang$applyTo = function(arglist__8150) {
      var f = cljs.core.first(arglist__8150);
      var c1 = cljs.core.first(cljs.core.next(arglist__8150));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8150)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8150))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8150))));
      return G__8149__delegate(f, c1, c2, c3, colls)
    };
    G__8149.cljs$lang$arity$variadic = G__8149__delegate;
    return G__8149
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8157 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8157) {
        var s__8158 = temp__3974__auto____8157;
        var p__8159 = cljs.core.take.call(null, n, s__8158);
        if(n === cljs.core.count.call(null, p__8159)) {
          return cljs.core.cons.call(null, p__8159, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8158)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8160 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8160) {
        var s__8161 = temp__3974__auto____8160;
        var p__8162 = cljs.core.take.call(null, n, s__8161);
        if(n === cljs.core.count.call(null, p__8162)) {
          return cljs.core.cons.call(null, p__8162, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8161)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8162, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8167 = cljs.core.lookup_sentinel;
    var m__8168 = m;
    var ks__8169 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8169) {
        var m__8170 = cljs.core._lookup.call(null, m__8168, cljs.core.first.call(null, ks__8169), sentinel__8167);
        if(sentinel__8167 === m__8170) {
          return not_found
        }else {
          var G__8171 = sentinel__8167;
          var G__8172 = m__8170;
          var G__8173 = cljs.core.next.call(null, ks__8169);
          sentinel__8167 = G__8171;
          m__8168 = G__8172;
          ks__8169 = G__8173;
          continue
        }
      }else {
        return m__8168
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8174, v) {
  var vec__8179__8180 = p__8174;
  var k__8181 = cljs.core.nth.call(null, vec__8179__8180, 0, null);
  var ks__8182 = cljs.core.nthnext.call(null, vec__8179__8180, 1);
  if(cljs.core.truth_(ks__8182)) {
    return cljs.core.assoc.call(null, m, k__8181, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8181, null), ks__8182, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8181, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8183, f, args) {
    var vec__8188__8189 = p__8183;
    var k__8190 = cljs.core.nth.call(null, vec__8188__8189, 0, null);
    var ks__8191 = cljs.core.nthnext.call(null, vec__8188__8189, 1);
    if(cljs.core.truth_(ks__8191)) {
      return cljs.core.assoc.call(null, m, k__8190, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8190, null), ks__8191, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8190, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8190, null), args))
    }
  };
  var update_in = function(m, p__8183, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8183, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8192) {
    var m = cljs.core.first(arglist__8192);
    var p__8183 = cljs.core.first(cljs.core.next(arglist__8192));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8192)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8192)));
    return update_in__delegate(m, p__8183, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8195 = this;
  var h__2228__auto____8196 = this__8195.__hash;
  if(!(h__2228__auto____8196 == null)) {
    return h__2228__auto____8196
  }else {
    var h__2228__auto____8197 = cljs.core.hash_coll.call(null, coll);
    this__8195.__hash = h__2228__auto____8197;
    return h__2228__auto____8197
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8198 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8199 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8200 = this;
  var new_array__8201 = this__8200.array.slice();
  new_array__8201[k] = v;
  return new cljs.core.Vector(this__8200.meta, new_array__8201, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8232 = null;
  var G__8232__2 = function(this_sym8202, k) {
    var this__8204 = this;
    var this_sym8202__8205 = this;
    var coll__8206 = this_sym8202__8205;
    return coll__8206.cljs$core$ILookup$_lookup$arity$2(coll__8206, k)
  };
  var G__8232__3 = function(this_sym8203, k, not_found) {
    var this__8204 = this;
    var this_sym8203__8207 = this;
    var coll__8208 = this_sym8203__8207;
    return coll__8208.cljs$core$ILookup$_lookup$arity$3(coll__8208, k, not_found)
  };
  G__8232 = function(this_sym8203, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8232__2.call(this, this_sym8203, k);
      case 3:
        return G__8232__3.call(this, this_sym8203, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8232
}();
cljs.core.Vector.prototype.apply = function(this_sym8193, args8194) {
  var this__8209 = this;
  return this_sym8193.call.apply(this_sym8193, [this_sym8193].concat(args8194.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8210 = this;
  var new_array__8211 = this__8210.array.slice();
  new_array__8211.push(o);
  return new cljs.core.Vector(this__8210.meta, new_array__8211, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8212 = this;
  var this__8213 = this;
  return cljs.core.pr_str.call(null, this__8213)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8214 = this;
  return cljs.core.ci_reduce.call(null, this__8214.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8215 = this;
  return cljs.core.ci_reduce.call(null, this__8215.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8216 = this;
  if(this__8216.array.length > 0) {
    var vector_seq__8217 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8216.array.length) {
          return cljs.core.cons.call(null, this__8216.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8217.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8218 = this;
  return this__8218.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8219 = this;
  var count__8220 = this__8219.array.length;
  if(count__8220 > 0) {
    return this__8219.array[count__8220 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8221 = this;
  if(this__8221.array.length > 0) {
    var new_array__8222 = this__8221.array.slice();
    new_array__8222.pop();
    return new cljs.core.Vector(this__8221.meta, new_array__8222, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8223 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8224 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8225 = this;
  return new cljs.core.Vector(meta, this__8225.array, this__8225.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8226 = this;
  return this__8226.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8227 = this;
  if(function() {
    var and__3822__auto____8228 = 0 <= n;
    if(and__3822__auto____8228) {
      return n < this__8227.array.length
    }else {
      return and__3822__auto____8228
    }
  }()) {
    return this__8227.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8229 = this;
  if(function() {
    var and__3822__auto____8230 = 0 <= n;
    if(and__3822__auto____8230) {
      return n < this__8229.array.length
    }else {
      return and__3822__auto____8230
    }
  }()) {
    return this__8229.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8231 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8231.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2346__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8234 = pv.cnt;
  if(cnt__8234 < 32) {
    return 0
  }else {
    return cnt__8234 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8240 = level;
  var ret__8241 = node;
  while(true) {
    if(ll__8240 === 0) {
      return ret__8241
    }else {
      var embed__8242 = ret__8241;
      var r__8243 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8244 = cljs.core.pv_aset.call(null, r__8243, 0, embed__8242);
      var G__8245 = ll__8240 - 5;
      var G__8246 = r__8243;
      ll__8240 = G__8245;
      ret__8241 = G__8246;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8252 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8253 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8252, subidx__8253, tailnode);
    return ret__8252
  }else {
    var child__8254 = cljs.core.pv_aget.call(null, parent, subidx__8253);
    if(!(child__8254 == null)) {
      var node_to_insert__8255 = push_tail.call(null, pv, level - 5, child__8254, tailnode);
      cljs.core.pv_aset.call(null, ret__8252, subidx__8253, node_to_insert__8255);
      return ret__8252
    }else {
      var node_to_insert__8256 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8252, subidx__8253, node_to_insert__8256);
      return ret__8252
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8260 = 0 <= i;
    if(and__3822__auto____8260) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8260
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8261 = pv.root;
      var level__8262 = pv.shift;
      while(true) {
        if(level__8262 > 0) {
          var G__8263 = cljs.core.pv_aget.call(null, node__8261, i >>> level__8262 & 31);
          var G__8264 = level__8262 - 5;
          node__8261 = G__8263;
          level__8262 = G__8264;
          continue
        }else {
          return node__8261.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8267 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8267, i & 31, val);
    return ret__8267
  }else {
    var subidx__8268 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8267, subidx__8268, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8268), i, val));
    return ret__8267
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8274 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8275 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8274));
    if(function() {
      var and__3822__auto____8276 = new_child__8275 == null;
      if(and__3822__auto____8276) {
        return subidx__8274 === 0
      }else {
        return and__3822__auto____8276
      }
    }()) {
      return null
    }else {
      var ret__8277 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8277, subidx__8274, new_child__8275);
      return ret__8277
    }
  }else {
    if(subidx__8274 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8278 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8278, subidx__8274, null);
        return ret__8278
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8281 = this;
  return new cljs.core.TransientVector(this__8281.cnt, this__8281.shift, cljs.core.tv_editable_root.call(null, this__8281.root), cljs.core.tv_editable_tail.call(null, this__8281.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8282 = this;
  var h__2228__auto____8283 = this__8282.__hash;
  if(!(h__2228__auto____8283 == null)) {
    return h__2228__auto____8283
  }else {
    var h__2228__auto____8284 = cljs.core.hash_coll.call(null, coll);
    this__8282.__hash = h__2228__auto____8284;
    return h__2228__auto____8284
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8285 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8286 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8287 = this;
  if(function() {
    var and__3822__auto____8288 = 0 <= k;
    if(and__3822__auto____8288) {
      return k < this__8287.cnt
    }else {
      return and__3822__auto____8288
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8289 = this__8287.tail.slice();
      new_tail__8289[k & 31] = v;
      return new cljs.core.PersistentVector(this__8287.meta, this__8287.cnt, this__8287.shift, this__8287.root, new_tail__8289, null)
    }else {
      return new cljs.core.PersistentVector(this__8287.meta, this__8287.cnt, this__8287.shift, cljs.core.do_assoc.call(null, coll, this__8287.shift, this__8287.root, k, v), this__8287.tail, null)
    }
  }else {
    if(k === this__8287.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8287.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8337 = null;
  var G__8337__2 = function(this_sym8290, k) {
    var this__8292 = this;
    var this_sym8290__8293 = this;
    var coll__8294 = this_sym8290__8293;
    return coll__8294.cljs$core$ILookup$_lookup$arity$2(coll__8294, k)
  };
  var G__8337__3 = function(this_sym8291, k, not_found) {
    var this__8292 = this;
    var this_sym8291__8295 = this;
    var coll__8296 = this_sym8291__8295;
    return coll__8296.cljs$core$ILookup$_lookup$arity$3(coll__8296, k, not_found)
  };
  G__8337 = function(this_sym8291, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8337__2.call(this, this_sym8291, k);
      case 3:
        return G__8337__3.call(this, this_sym8291, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8337
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8279, args8280) {
  var this__8297 = this;
  return this_sym8279.call.apply(this_sym8279, [this_sym8279].concat(args8280.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8298 = this;
  var step_init__8299 = [0, init];
  var i__8300 = 0;
  while(true) {
    if(i__8300 < this__8298.cnt) {
      var arr__8301 = cljs.core.array_for.call(null, v, i__8300);
      var len__8302 = arr__8301.length;
      var init__8306 = function() {
        var j__8303 = 0;
        var init__8304 = step_init__8299[1];
        while(true) {
          if(j__8303 < len__8302) {
            var init__8305 = f.call(null, init__8304, j__8303 + i__8300, arr__8301[j__8303]);
            if(cljs.core.reduced_QMARK_.call(null, init__8305)) {
              return init__8305
            }else {
              var G__8338 = j__8303 + 1;
              var G__8339 = init__8305;
              j__8303 = G__8338;
              init__8304 = G__8339;
              continue
            }
          }else {
            step_init__8299[0] = len__8302;
            step_init__8299[1] = init__8304;
            return init__8304
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8306)) {
        return cljs.core.deref.call(null, init__8306)
      }else {
        var G__8340 = i__8300 + step_init__8299[0];
        i__8300 = G__8340;
        continue
      }
    }else {
      return step_init__8299[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8307 = this;
  if(this__8307.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8308 = this__8307.tail.slice();
    new_tail__8308.push(o);
    return new cljs.core.PersistentVector(this__8307.meta, this__8307.cnt + 1, this__8307.shift, this__8307.root, new_tail__8308, null)
  }else {
    var root_overflow_QMARK___8309 = this__8307.cnt >>> 5 > 1 << this__8307.shift;
    var new_shift__8310 = root_overflow_QMARK___8309 ? this__8307.shift + 5 : this__8307.shift;
    var new_root__8312 = root_overflow_QMARK___8309 ? function() {
      var n_r__8311 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8311, 0, this__8307.root);
      cljs.core.pv_aset.call(null, n_r__8311, 1, cljs.core.new_path.call(null, null, this__8307.shift, new cljs.core.VectorNode(null, this__8307.tail)));
      return n_r__8311
    }() : cljs.core.push_tail.call(null, coll, this__8307.shift, this__8307.root, new cljs.core.VectorNode(null, this__8307.tail));
    return new cljs.core.PersistentVector(this__8307.meta, this__8307.cnt + 1, new_shift__8310, new_root__8312, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8313 = this;
  if(this__8313.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8313.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8314 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8315 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8316 = this;
  var this__8317 = this;
  return cljs.core.pr_str.call(null, this__8317)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8318 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8319 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8320 = this;
  if(this__8320.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8321 = this;
  return this__8321.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8322 = this;
  if(this__8322.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8322.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8323 = this;
  if(this__8323.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8323.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8323.meta)
    }else {
      if(1 < this__8323.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8323.meta, this__8323.cnt - 1, this__8323.shift, this__8323.root, this__8323.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8324 = cljs.core.array_for.call(null, coll, this__8323.cnt - 2);
          var nr__8325 = cljs.core.pop_tail.call(null, coll, this__8323.shift, this__8323.root);
          var new_root__8326 = nr__8325 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8325;
          var cnt_1__8327 = this__8323.cnt - 1;
          if(function() {
            var and__3822__auto____8328 = 5 < this__8323.shift;
            if(and__3822__auto____8328) {
              return cljs.core.pv_aget.call(null, new_root__8326, 1) == null
            }else {
              return and__3822__auto____8328
            }
          }()) {
            return new cljs.core.PersistentVector(this__8323.meta, cnt_1__8327, this__8323.shift - 5, cljs.core.pv_aget.call(null, new_root__8326, 0), new_tail__8324, null)
          }else {
            return new cljs.core.PersistentVector(this__8323.meta, cnt_1__8327, this__8323.shift, new_root__8326, new_tail__8324, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8329 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8330 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8331 = this;
  return new cljs.core.PersistentVector(meta, this__8331.cnt, this__8331.shift, this__8331.root, this__8331.tail, this__8331.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8332 = this;
  return this__8332.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8333 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8334 = this;
  if(function() {
    var and__3822__auto____8335 = 0 <= n;
    if(and__3822__auto____8335) {
      return n < this__8334.cnt
    }else {
      return and__3822__auto____8335
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8336 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8336.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8341 = xs.length;
  var xs__8342 = no_clone === true ? xs : xs.slice();
  if(l__8341 < 32) {
    return new cljs.core.PersistentVector(null, l__8341, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8342, null)
  }else {
    var node__8343 = xs__8342.slice(0, 32);
    var v__8344 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8343, null);
    var i__8345 = 32;
    var out__8346 = cljs.core._as_transient.call(null, v__8344);
    while(true) {
      if(i__8345 < l__8341) {
        var G__8347 = i__8345 + 1;
        var G__8348 = cljs.core.conj_BANG_.call(null, out__8346, xs__8342[i__8345]);
        i__8345 = G__8347;
        out__8346 = G__8348;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8346)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8349) {
    var args = cljs.core.seq(arglist__8349);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8350 = this;
  if(this__8350.off + 1 < this__8350.node.length) {
    var s__8351 = cljs.core.chunked_seq.call(null, this__8350.vec, this__8350.node, this__8350.i, this__8350.off + 1);
    if(s__8351 == null) {
      return null
    }else {
      return s__8351
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8352 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8353 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8354 = this;
  return this__8354.node[this__8354.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8355 = this;
  if(this__8355.off + 1 < this__8355.node.length) {
    var s__8356 = cljs.core.chunked_seq.call(null, this__8355.vec, this__8355.node, this__8355.i, this__8355.off + 1);
    if(s__8356 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8356
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8357 = this;
  var l__8358 = this__8357.node.length;
  var s__8359 = this__8357.i + l__8358 < cljs.core._count.call(null, this__8357.vec) ? cljs.core.chunked_seq.call(null, this__8357.vec, this__8357.i + l__8358, 0) : null;
  if(s__8359 == null) {
    return null
  }else {
    return s__8359
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8360 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8361 = this;
  return cljs.core.chunked_seq.call(null, this__8361.vec, this__8361.node, this__8361.i, this__8361.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8362 = this;
  return this__8362.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8363 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8363.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8364 = this;
  return cljs.core.array_chunk.call(null, this__8364.node, this__8364.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8365 = this;
  var l__8366 = this__8365.node.length;
  var s__8367 = this__8365.i + l__8366 < cljs.core._count.call(null, this__8365.vec) ? cljs.core.chunked_seq.call(null, this__8365.vec, this__8365.i + l__8366, 0) : null;
  if(s__8367 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8367
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8370 = this;
  var h__2228__auto____8371 = this__8370.__hash;
  if(!(h__2228__auto____8371 == null)) {
    return h__2228__auto____8371
  }else {
    var h__2228__auto____8372 = cljs.core.hash_coll.call(null, coll);
    this__8370.__hash = h__2228__auto____8372;
    return h__2228__auto____8372
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8373 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8374 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8375 = this;
  var v_pos__8376 = this__8375.start + key;
  return new cljs.core.Subvec(this__8375.meta, cljs.core._assoc.call(null, this__8375.v, v_pos__8376, val), this__8375.start, this__8375.end > v_pos__8376 + 1 ? this__8375.end : v_pos__8376 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8402 = null;
  var G__8402__2 = function(this_sym8377, k) {
    var this__8379 = this;
    var this_sym8377__8380 = this;
    var coll__8381 = this_sym8377__8380;
    return coll__8381.cljs$core$ILookup$_lookup$arity$2(coll__8381, k)
  };
  var G__8402__3 = function(this_sym8378, k, not_found) {
    var this__8379 = this;
    var this_sym8378__8382 = this;
    var coll__8383 = this_sym8378__8382;
    return coll__8383.cljs$core$ILookup$_lookup$arity$3(coll__8383, k, not_found)
  };
  G__8402 = function(this_sym8378, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8402__2.call(this, this_sym8378, k);
      case 3:
        return G__8402__3.call(this, this_sym8378, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8402
}();
cljs.core.Subvec.prototype.apply = function(this_sym8368, args8369) {
  var this__8384 = this;
  return this_sym8368.call.apply(this_sym8368, [this_sym8368].concat(args8369.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8385 = this;
  return new cljs.core.Subvec(this__8385.meta, cljs.core._assoc_n.call(null, this__8385.v, this__8385.end, o), this__8385.start, this__8385.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8386 = this;
  var this__8387 = this;
  return cljs.core.pr_str.call(null, this__8387)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8388 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8389 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8390 = this;
  var subvec_seq__8391 = function subvec_seq(i) {
    if(i === this__8390.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8390.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8391.call(null, this__8390.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8392 = this;
  return this__8392.end - this__8392.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8393 = this;
  return cljs.core._nth.call(null, this__8393.v, this__8393.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8394 = this;
  if(this__8394.start === this__8394.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8394.meta, this__8394.v, this__8394.start, this__8394.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8395 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8396 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8397 = this;
  return new cljs.core.Subvec(meta, this__8397.v, this__8397.start, this__8397.end, this__8397.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8398 = this;
  return this__8398.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8399 = this;
  return cljs.core._nth.call(null, this__8399.v, this__8399.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8400 = this;
  return cljs.core._nth.call(null, this__8400.v, this__8400.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8401 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8401.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8404 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8404, 0, tl.length);
  return ret__8404
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8408 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8409 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8408, subidx__8409, level === 5 ? tail_node : function() {
    var child__8410 = cljs.core.pv_aget.call(null, ret__8408, subidx__8409);
    if(!(child__8410 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8410, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8408
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8415 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8416 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8417 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8415, subidx__8416));
    if(function() {
      var and__3822__auto____8418 = new_child__8417 == null;
      if(and__3822__auto____8418) {
        return subidx__8416 === 0
      }else {
        return and__3822__auto____8418
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8415, subidx__8416, new_child__8417);
      return node__8415
    }
  }else {
    if(subidx__8416 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8415, subidx__8416, null);
        return node__8415
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8423 = 0 <= i;
    if(and__3822__auto____8423) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8423
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8424 = tv.root;
      var node__8425 = root__8424;
      var level__8426 = tv.shift;
      while(true) {
        if(level__8426 > 0) {
          var G__8427 = cljs.core.tv_ensure_editable.call(null, root__8424.edit, cljs.core.pv_aget.call(null, node__8425, i >>> level__8426 & 31));
          var G__8428 = level__8426 - 5;
          node__8425 = G__8427;
          level__8426 = G__8428;
          continue
        }else {
          return node__8425.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8468 = null;
  var G__8468__2 = function(this_sym8431, k) {
    var this__8433 = this;
    var this_sym8431__8434 = this;
    var coll__8435 = this_sym8431__8434;
    return coll__8435.cljs$core$ILookup$_lookup$arity$2(coll__8435, k)
  };
  var G__8468__3 = function(this_sym8432, k, not_found) {
    var this__8433 = this;
    var this_sym8432__8436 = this;
    var coll__8437 = this_sym8432__8436;
    return coll__8437.cljs$core$ILookup$_lookup$arity$3(coll__8437, k, not_found)
  };
  G__8468 = function(this_sym8432, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8468__2.call(this, this_sym8432, k);
      case 3:
        return G__8468__3.call(this, this_sym8432, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8468
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8429, args8430) {
  var this__8438 = this;
  return this_sym8429.call.apply(this_sym8429, [this_sym8429].concat(args8430.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8439 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8440 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8441 = this;
  if(this__8441.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8442 = this;
  if(function() {
    var and__3822__auto____8443 = 0 <= n;
    if(and__3822__auto____8443) {
      return n < this__8442.cnt
    }else {
      return and__3822__auto____8443
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8444 = this;
  if(this__8444.root.edit) {
    return this__8444.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8445 = this;
  if(this__8445.root.edit) {
    if(function() {
      var and__3822__auto____8446 = 0 <= n;
      if(and__3822__auto____8446) {
        return n < this__8445.cnt
      }else {
        return and__3822__auto____8446
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8445.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8451 = function go(level, node) {
          var node__8449 = cljs.core.tv_ensure_editable.call(null, this__8445.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8449, n & 31, val);
            return node__8449
          }else {
            var subidx__8450 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8449, subidx__8450, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8449, subidx__8450)));
            return node__8449
          }
        }.call(null, this__8445.shift, this__8445.root);
        this__8445.root = new_root__8451;
        return tcoll
      }
    }else {
      if(n === this__8445.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8445.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8452 = this;
  if(this__8452.root.edit) {
    if(this__8452.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8452.cnt) {
        this__8452.cnt = 0;
        return tcoll
      }else {
        if((this__8452.cnt - 1 & 31) > 0) {
          this__8452.cnt = this__8452.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8453 = cljs.core.editable_array_for.call(null, tcoll, this__8452.cnt - 2);
            var new_root__8455 = function() {
              var nr__8454 = cljs.core.tv_pop_tail.call(null, tcoll, this__8452.shift, this__8452.root);
              if(!(nr__8454 == null)) {
                return nr__8454
              }else {
                return new cljs.core.VectorNode(this__8452.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8456 = 5 < this__8452.shift;
              if(and__3822__auto____8456) {
                return cljs.core.pv_aget.call(null, new_root__8455, 1) == null
              }else {
                return and__3822__auto____8456
              }
            }()) {
              var new_root__8457 = cljs.core.tv_ensure_editable.call(null, this__8452.root.edit, cljs.core.pv_aget.call(null, new_root__8455, 0));
              this__8452.root = new_root__8457;
              this__8452.shift = this__8452.shift - 5;
              this__8452.cnt = this__8452.cnt - 1;
              this__8452.tail = new_tail__8453;
              return tcoll
            }else {
              this__8452.root = new_root__8455;
              this__8452.cnt = this__8452.cnt - 1;
              this__8452.tail = new_tail__8453;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8458 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8459 = this;
  if(this__8459.root.edit) {
    if(this__8459.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8459.tail[this__8459.cnt & 31] = o;
      this__8459.cnt = this__8459.cnt + 1;
      return tcoll
    }else {
      var tail_node__8460 = new cljs.core.VectorNode(this__8459.root.edit, this__8459.tail);
      var new_tail__8461 = cljs.core.make_array.call(null, 32);
      new_tail__8461[0] = o;
      this__8459.tail = new_tail__8461;
      if(this__8459.cnt >>> 5 > 1 << this__8459.shift) {
        var new_root_array__8462 = cljs.core.make_array.call(null, 32);
        var new_shift__8463 = this__8459.shift + 5;
        new_root_array__8462[0] = this__8459.root;
        new_root_array__8462[1] = cljs.core.new_path.call(null, this__8459.root.edit, this__8459.shift, tail_node__8460);
        this__8459.root = new cljs.core.VectorNode(this__8459.root.edit, new_root_array__8462);
        this__8459.shift = new_shift__8463;
        this__8459.cnt = this__8459.cnt + 1;
        return tcoll
      }else {
        var new_root__8464 = cljs.core.tv_push_tail.call(null, tcoll, this__8459.shift, this__8459.root, tail_node__8460);
        this__8459.root = new_root__8464;
        this__8459.cnt = this__8459.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8465 = this;
  if(this__8465.root.edit) {
    this__8465.root.edit = null;
    var len__8466 = this__8465.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8467 = cljs.core.make_array.call(null, len__8466);
    cljs.core.array_copy.call(null, this__8465.tail, 0, trimmed_tail__8467, 0, len__8466);
    return new cljs.core.PersistentVector(null, this__8465.cnt, this__8465.shift, this__8465.root, trimmed_tail__8467, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8469 = this;
  var h__2228__auto____8470 = this__8469.__hash;
  if(!(h__2228__auto____8470 == null)) {
    return h__2228__auto____8470
  }else {
    var h__2228__auto____8471 = cljs.core.hash_coll.call(null, coll);
    this__8469.__hash = h__2228__auto____8471;
    return h__2228__auto____8471
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8472 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8473 = this;
  var this__8474 = this;
  return cljs.core.pr_str.call(null, this__8474)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8475 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8476 = this;
  return cljs.core._first.call(null, this__8476.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8477 = this;
  var temp__3971__auto____8478 = cljs.core.next.call(null, this__8477.front);
  if(temp__3971__auto____8478) {
    var f1__8479 = temp__3971__auto____8478;
    return new cljs.core.PersistentQueueSeq(this__8477.meta, f1__8479, this__8477.rear, null)
  }else {
    if(this__8477.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8477.meta, this__8477.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8480 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8481 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8481.front, this__8481.rear, this__8481.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8482 = this;
  return this__8482.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8483 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8483.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8484 = this;
  var h__2228__auto____8485 = this__8484.__hash;
  if(!(h__2228__auto____8485 == null)) {
    return h__2228__auto____8485
  }else {
    var h__2228__auto____8486 = cljs.core.hash_coll.call(null, coll);
    this__8484.__hash = h__2228__auto____8486;
    return h__2228__auto____8486
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8487 = this;
  if(cljs.core.truth_(this__8487.front)) {
    return new cljs.core.PersistentQueue(this__8487.meta, this__8487.count + 1, this__8487.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8488 = this__8487.rear;
      if(cljs.core.truth_(or__3824__auto____8488)) {
        return or__3824__auto____8488
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8487.meta, this__8487.count + 1, cljs.core.conj.call(null, this__8487.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8489 = this;
  var this__8490 = this;
  return cljs.core.pr_str.call(null, this__8490)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8491 = this;
  var rear__8492 = cljs.core.seq.call(null, this__8491.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8493 = this__8491.front;
    if(cljs.core.truth_(or__3824__auto____8493)) {
      return or__3824__auto____8493
    }else {
      return rear__8492
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8491.front, cljs.core.seq.call(null, rear__8492), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8494 = this;
  return this__8494.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8495 = this;
  return cljs.core._first.call(null, this__8495.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8496 = this;
  if(cljs.core.truth_(this__8496.front)) {
    var temp__3971__auto____8497 = cljs.core.next.call(null, this__8496.front);
    if(temp__3971__auto____8497) {
      var f1__8498 = temp__3971__auto____8497;
      return new cljs.core.PersistentQueue(this__8496.meta, this__8496.count - 1, f1__8498, this__8496.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8496.meta, this__8496.count - 1, cljs.core.seq.call(null, this__8496.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8499 = this;
  return cljs.core.first.call(null, this__8499.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8500 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8501 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8502 = this;
  return new cljs.core.PersistentQueue(meta, this__8502.count, this__8502.front, this__8502.rear, this__8502.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8503 = this;
  return this__8503.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8504 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8505 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8508 = array.length;
  var i__8509 = 0;
  while(true) {
    if(i__8509 < len__8508) {
      if(k === array[i__8509]) {
        return i__8509
      }else {
        var G__8510 = i__8509 + incr;
        i__8509 = G__8510;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8513 = cljs.core.hash.call(null, a);
  var b__8514 = cljs.core.hash.call(null, b);
  if(a__8513 < b__8514) {
    return-1
  }else {
    if(a__8513 > b__8514) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8522 = m.keys;
  var len__8523 = ks__8522.length;
  var so__8524 = m.strobj;
  var out__8525 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8526 = 0;
  var out__8527 = cljs.core.transient$.call(null, out__8525);
  while(true) {
    if(i__8526 < len__8523) {
      var k__8528 = ks__8522[i__8526];
      var G__8529 = i__8526 + 1;
      var G__8530 = cljs.core.assoc_BANG_.call(null, out__8527, k__8528, so__8524[k__8528]);
      i__8526 = G__8529;
      out__8527 = G__8530;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8527, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8536 = {};
  var l__8537 = ks.length;
  var i__8538 = 0;
  while(true) {
    if(i__8538 < l__8537) {
      var k__8539 = ks[i__8538];
      new_obj__8536[k__8539] = obj[k__8539];
      var G__8540 = i__8538 + 1;
      i__8538 = G__8540;
      continue
    }else {
    }
    break
  }
  return new_obj__8536
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8543 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8544 = this;
  var h__2228__auto____8545 = this__8544.__hash;
  if(!(h__2228__auto____8545 == null)) {
    return h__2228__auto____8545
  }else {
    var h__2228__auto____8546 = cljs.core.hash_imap.call(null, coll);
    this__8544.__hash = h__2228__auto____8546;
    return h__2228__auto____8546
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8547 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8548 = this;
  if(function() {
    var and__3822__auto____8549 = goog.isString(k);
    if(and__3822__auto____8549) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8548.keys) == null)
    }else {
      return and__3822__auto____8549
    }
  }()) {
    return this__8548.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8550 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8551 = this__8550.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8551) {
        return or__3824__auto____8551
      }else {
        return this__8550.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8550.keys) == null)) {
        var new_strobj__8552 = cljs.core.obj_clone.call(null, this__8550.strobj, this__8550.keys);
        new_strobj__8552[k] = v;
        return new cljs.core.ObjMap(this__8550.meta, this__8550.keys, new_strobj__8552, this__8550.update_count + 1, null)
      }else {
        var new_strobj__8553 = cljs.core.obj_clone.call(null, this__8550.strobj, this__8550.keys);
        var new_keys__8554 = this__8550.keys.slice();
        new_strobj__8553[k] = v;
        new_keys__8554.push(k);
        return new cljs.core.ObjMap(this__8550.meta, new_keys__8554, new_strobj__8553, this__8550.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8555 = this;
  if(function() {
    var and__3822__auto____8556 = goog.isString(k);
    if(and__3822__auto____8556) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8555.keys) == null)
    }else {
      return and__3822__auto____8556
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8578 = null;
  var G__8578__2 = function(this_sym8557, k) {
    var this__8559 = this;
    var this_sym8557__8560 = this;
    var coll__8561 = this_sym8557__8560;
    return coll__8561.cljs$core$ILookup$_lookup$arity$2(coll__8561, k)
  };
  var G__8578__3 = function(this_sym8558, k, not_found) {
    var this__8559 = this;
    var this_sym8558__8562 = this;
    var coll__8563 = this_sym8558__8562;
    return coll__8563.cljs$core$ILookup$_lookup$arity$3(coll__8563, k, not_found)
  };
  G__8578 = function(this_sym8558, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8578__2.call(this, this_sym8558, k);
      case 3:
        return G__8578__3.call(this, this_sym8558, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8578
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8541, args8542) {
  var this__8564 = this;
  return this_sym8541.call.apply(this_sym8541, [this_sym8541].concat(args8542.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8565 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8566 = this;
  var this__8567 = this;
  return cljs.core.pr_str.call(null, this__8567)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8568 = this;
  if(this__8568.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8531_SHARP_) {
      return cljs.core.vector.call(null, p1__8531_SHARP_, this__8568.strobj[p1__8531_SHARP_])
    }, this__8568.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8569 = this;
  return this__8569.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8570 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8571 = this;
  return new cljs.core.ObjMap(meta, this__8571.keys, this__8571.strobj, this__8571.update_count, this__8571.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8572 = this;
  return this__8572.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8573 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8573.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8574 = this;
  if(function() {
    var and__3822__auto____8575 = goog.isString(k);
    if(and__3822__auto____8575) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8574.keys) == null)
    }else {
      return and__3822__auto____8575
    }
  }()) {
    var new_keys__8576 = this__8574.keys.slice();
    var new_strobj__8577 = cljs.core.obj_clone.call(null, this__8574.strobj, this__8574.keys);
    new_keys__8576.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8576), 1);
    cljs.core.js_delete.call(null, new_strobj__8577, k);
    return new cljs.core.ObjMap(this__8574.meta, new_keys__8576, new_strobj__8577, this__8574.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8582 = this;
  var h__2228__auto____8583 = this__8582.__hash;
  if(!(h__2228__auto____8583 == null)) {
    return h__2228__auto____8583
  }else {
    var h__2228__auto____8584 = cljs.core.hash_imap.call(null, coll);
    this__8582.__hash = h__2228__auto____8584;
    return h__2228__auto____8584
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8585 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8586 = this;
  var bucket__8587 = this__8586.hashobj[cljs.core.hash.call(null, k)];
  var i__8588 = cljs.core.truth_(bucket__8587) ? cljs.core.scan_array.call(null, 2, k, bucket__8587) : null;
  if(cljs.core.truth_(i__8588)) {
    return bucket__8587[i__8588 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8589 = this;
  var h__8590 = cljs.core.hash.call(null, k);
  var bucket__8591 = this__8589.hashobj[h__8590];
  if(cljs.core.truth_(bucket__8591)) {
    var new_bucket__8592 = bucket__8591.slice();
    var new_hashobj__8593 = goog.object.clone(this__8589.hashobj);
    new_hashobj__8593[h__8590] = new_bucket__8592;
    var temp__3971__auto____8594 = cljs.core.scan_array.call(null, 2, k, new_bucket__8592);
    if(cljs.core.truth_(temp__3971__auto____8594)) {
      var i__8595 = temp__3971__auto____8594;
      new_bucket__8592[i__8595 + 1] = v;
      return new cljs.core.HashMap(this__8589.meta, this__8589.count, new_hashobj__8593, null)
    }else {
      new_bucket__8592.push(k, v);
      return new cljs.core.HashMap(this__8589.meta, this__8589.count + 1, new_hashobj__8593, null)
    }
  }else {
    var new_hashobj__8596 = goog.object.clone(this__8589.hashobj);
    new_hashobj__8596[h__8590] = [k, v];
    return new cljs.core.HashMap(this__8589.meta, this__8589.count + 1, new_hashobj__8596, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8597 = this;
  var bucket__8598 = this__8597.hashobj[cljs.core.hash.call(null, k)];
  var i__8599 = cljs.core.truth_(bucket__8598) ? cljs.core.scan_array.call(null, 2, k, bucket__8598) : null;
  if(cljs.core.truth_(i__8599)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8624 = null;
  var G__8624__2 = function(this_sym8600, k) {
    var this__8602 = this;
    var this_sym8600__8603 = this;
    var coll__8604 = this_sym8600__8603;
    return coll__8604.cljs$core$ILookup$_lookup$arity$2(coll__8604, k)
  };
  var G__8624__3 = function(this_sym8601, k, not_found) {
    var this__8602 = this;
    var this_sym8601__8605 = this;
    var coll__8606 = this_sym8601__8605;
    return coll__8606.cljs$core$ILookup$_lookup$arity$3(coll__8606, k, not_found)
  };
  G__8624 = function(this_sym8601, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8624__2.call(this, this_sym8601, k);
      case 3:
        return G__8624__3.call(this, this_sym8601, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8624
}();
cljs.core.HashMap.prototype.apply = function(this_sym8580, args8581) {
  var this__8607 = this;
  return this_sym8580.call.apply(this_sym8580, [this_sym8580].concat(args8581.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8608 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8609 = this;
  var this__8610 = this;
  return cljs.core.pr_str.call(null, this__8610)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8611 = this;
  if(this__8611.count > 0) {
    var hashes__8612 = cljs.core.js_keys.call(null, this__8611.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8579_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8611.hashobj[p1__8579_SHARP_]))
    }, hashes__8612)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8613 = this;
  return this__8613.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8614 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8615 = this;
  return new cljs.core.HashMap(meta, this__8615.count, this__8615.hashobj, this__8615.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8616 = this;
  return this__8616.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8617 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8617.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8618 = this;
  var h__8619 = cljs.core.hash.call(null, k);
  var bucket__8620 = this__8618.hashobj[h__8619];
  var i__8621 = cljs.core.truth_(bucket__8620) ? cljs.core.scan_array.call(null, 2, k, bucket__8620) : null;
  if(cljs.core.not.call(null, i__8621)) {
    return coll
  }else {
    var new_hashobj__8622 = goog.object.clone(this__8618.hashobj);
    if(3 > bucket__8620.length) {
      cljs.core.js_delete.call(null, new_hashobj__8622, h__8619)
    }else {
      var new_bucket__8623 = bucket__8620.slice();
      new_bucket__8623.splice(i__8621, 2);
      new_hashobj__8622[h__8619] = new_bucket__8623
    }
    return new cljs.core.HashMap(this__8618.meta, this__8618.count - 1, new_hashobj__8622, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8625 = ks.length;
  var i__8626 = 0;
  var out__8627 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8626 < len__8625) {
      var G__8628 = i__8626 + 1;
      var G__8629 = cljs.core.assoc.call(null, out__8627, ks[i__8626], vs[i__8626]);
      i__8626 = G__8628;
      out__8627 = G__8629;
      continue
    }else {
      return out__8627
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8633 = m.arr;
  var len__8634 = arr__8633.length;
  var i__8635 = 0;
  while(true) {
    if(len__8634 <= i__8635) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8633[i__8635], k)) {
        return i__8635
      }else {
        if("\ufdd0'else") {
          var G__8636 = i__8635 + 2;
          i__8635 = G__8636;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8639 = this;
  return new cljs.core.TransientArrayMap({}, this__8639.arr.length, this__8639.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8640 = this;
  var h__2228__auto____8641 = this__8640.__hash;
  if(!(h__2228__auto____8641 == null)) {
    return h__2228__auto____8641
  }else {
    var h__2228__auto____8642 = cljs.core.hash_imap.call(null, coll);
    this__8640.__hash = h__2228__auto____8642;
    return h__2228__auto____8642
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8643 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8644 = this;
  var idx__8645 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8645 === -1) {
    return not_found
  }else {
    return this__8644.arr[idx__8645 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8646 = this;
  var idx__8647 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8647 === -1) {
    if(this__8646.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8646.meta, this__8646.cnt + 1, function() {
        var G__8648__8649 = this__8646.arr.slice();
        G__8648__8649.push(k);
        G__8648__8649.push(v);
        return G__8648__8649
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8646.arr[idx__8647 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8646.meta, this__8646.cnt, function() {
          var G__8650__8651 = this__8646.arr.slice();
          G__8650__8651[idx__8647 + 1] = v;
          return G__8650__8651
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8652 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8684 = null;
  var G__8684__2 = function(this_sym8653, k) {
    var this__8655 = this;
    var this_sym8653__8656 = this;
    var coll__8657 = this_sym8653__8656;
    return coll__8657.cljs$core$ILookup$_lookup$arity$2(coll__8657, k)
  };
  var G__8684__3 = function(this_sym8654, k, not_found) {
    var this__8655 = this;
    var this_sym8654__8658 = this;
    var coll__8659 = this_sym8654__8658;
    return coll__8659.cljs$core$ILookup$_lookup$arity$3(coll__8659, k, not_found)
  };
  G__8684 = function(this_sym8654, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8684__2.call(this, this_sym8654, k);
      case 3:
        return G__8684__3.call(this, this_sym8654, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8684
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8637, args8638) {
  var this__8660 = this;
  return this_sym8637.call.apply(this_sym8637, [this_sym8637].concat(args8638.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8661 = this;
  var len__8662 = this__8661.arr.length;
  var i__8663 = 0;
  var init__8664 = init;
  while(true) {
    if(i__8663 < len__8662) {
      var init__8665 = f.call(null, init__8664, this__8661.arr[i__8663], this__8661.arr[i__8663 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8665)) {
        return cljs.core.deref.call(null, init__8665)
      }else {
        var G__8685 = i__8663 + 2;
        var G__8686 = init__8665;
        i__8663 = G__8685;
        init__8664 = G__8686;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8666 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8667 = this;
  var this__8668 = this;
  return cljs.core.pr_str.call(null, this__8668)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8669 = this;
  if(this__8669.cnt > 0) {
    var len__8670 = this__8669.arr.length;
    var array_map_seq__8671 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8670) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8669.arr[i], this__8669.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8671.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8672 = this;
  return this__8672.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8673 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8674 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8674.cnt, this__8674.arr, this__8674.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8675 = this;
  return this__8675.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8676 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8676.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8677 = this;
  var idx__8678 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8678 >= 0) {
    var len__8679 = this__8677.arr.length;
    var new_len__8680 = len__8679 - 2;
    if(new_len__8680 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8681 = cljs.core.make_array.call(null, new_len__8680);
      var s__8682 = 0;
      var d__8683 = 0;
      while(true) {
        if(s__8682 >= len__8679) {
          return new cljs.core.PersistentArrayMap(this__8677.meta, this__8677.cnt - 1, new_arr__8681, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8677.arr[s__8682])) {
            var G__8687 = s__8682 + 2;
            var G__8688 = d__8683;
            s__8682 = G__8687;
            d__8683 = G__8688;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8681[d__8683] = this__8677.arr[s__8682];
              new_arr__8681[d__8683 + 1] = this__8677.arr[s__8682 + 1];
              var G__8689 = s__8682 + 2;
              var G__8690 = d__8683 + 2;
              s__8682 = G__8689;
              d__8683 = G__8690;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8691 = cljs.core.count.call(null, ks);
  var i__8692 = 0;
  var out__8693 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8692 < len__8691) {
      var G__8694 = i__8692 + 1;
      var G__8695 = cljs.core.assoc_BANG_.call(null, out__8693, ks[i__8692], vs[i__8692]);
      i__8692 = G__8694;
      out__8693 = G__8695;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8693)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8696 = this;
  if(cljs.core.truth_(this__8696.editable_QMARK_)) {
    var idx__8697 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8697 >= 0) {
      this__8696.arr[idx__8697] = this__8696.arr[this__8696.len - 2];
      this__8696.arr[idx__8697 + 1] = this__8696.arr[this__8696.len - 1];
      var G__8698__8699 = this__8696.arr;
      G__8698__8699.pop();
      G__8698__8699.pop();
      G__8698__8699;
      this__8696.len = this__8696.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8700 = this;
  if(cljs.core.truth_(this__8700.editable_QMARK_)) {
    var idx__8701 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8701 === -1) {
      if(this__8700.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8700.len = this__8700.len + 2;
        this__8700.arr.push(key);
        this__8700.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8700.len, this__8700.arr), key, val)
      }
    }else {
      if(val === this__8700.arr[idx__8701 + 1]) {
        return tcoll
      }else {
        this__8700.arr[idx__8701 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8702 = this;
  if(cljs.core.truth_(this__8702.editable_QMARK_)) {
    if(function() {
      var G__8703__8704 = o;
      if(G__8703__8704) {
        if(function() {
          var or__3824__auto____8705 = G__8703__8704.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8705) {
            return or__3824__auto____8705
          }else {
            return G__8703__8704.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8703__8704.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8703__8704)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8703__8704)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8706 = cljs.core.seq.call(null, o);
      var tcoll__8707 = tcoll;
      while(true) {
        var temp__3971__auto____8708 = cljs.core.first.call(null, es__8706);
        if(cljs.core.truth_(temp__3971__auto____8708)) {
          var e__8709 = temp__3971__auto____8708;
          var G__8715 = cljs.core.next.call(null, es__8706);
          var G__8716 = tcoll__8707.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8707, cljs.core.key.call(null, e__8709), cljs.core.val.call(null, e__8709));
          es__8706 = G__8715;
          tcoll__8707 = G__8716;
          continue
        }else {
          return tcoll__8707
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8710 = this;
  if(cljs.core.truth_(this__8710.editable_QMARK_)) {
    this__8710.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8710.len, 2), this__8710.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8711 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8712 = this;
  if(cljs.core.truth_(this__8712.editable_QMARK_)) {
    var idx__8713 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8713 === -1) {
      return not_found
    }else {
      return this__8712.arr[idx__8713 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8714 = this;
  if(cljs.core.truth_(this__8714.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8714.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8719 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8720 = 0;
  while(true) {
    if(i__8720 < len) {
      var G__8721 = cljs.core.assoc_BANG_.call(null, out__8719, arr[i__8720], arr[i__8720 + 1]);
      var G__8722 = i__8720 + 2;
      out__8719 = G__8721;
      i__8720 = G__8722;
      continue
    }else {
      return out__8719
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2346__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8727__8728 = arr.slice();
    G__8727__8728[i] = a;
    return G__8727__8728
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8729__8730 = arr.slice();
    G__8729__8730[i] = a;
    G__8729__8730[j] = b;
    return G__8729__8730
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8732 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8732, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8732, 2 * i, new_arr__8732.length - 2 * i);
  return new_arr__8732
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8735 = inode.ensure_editable(edit);
    editable__8735.arr[i] = a;
    return editable__8735
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8736 = inode.ensure_editable(edit);
    editable__8736.arr[i] = a;
    editable__8736.arr[j] = b;
    return editable__8736
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8743 = arr.length;
  var i__8744 = 0;
  var init__8745 = init;
  while(true) {
    if(i__8744 < len__8743) {
      var init__8748 = function() {
        var k__8746 = arr[i__8744];
        if(!(k__8746 == null)) {
          return f.call(null, init__8745, k__8746, arr[i__8744 + 1])
        }else {
          var node__8747 = arr[i__8744 + 1];
          if(!(node__8747 == null)) {
            return node__8747.kv_reduce(f, init__8745)
          }else {
            return init__8745
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8748)) {
        return cljs.core.deref.call(null, init__8748)
      }else {
        var G__8749 = i__8744 + 2;
        var G__8750 = init__8748;
        i__8744 = G__8749;
        init__8745 = G__8750;
        continue
      }
    }else {
      return init__8745
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8751 = this;
  var inode__8752 = this;
  if(this__8751.bitmap === bit) {
    return null
  }else {
    var editable__8753 = inode__8752.ensure_editable(e);
    var earr__8754 = editable__8753.arr;
    var len__8755 = earr__8754.length;
    editable__8753.bitmap = bit ^ editable__8753.bitmap;
    cljs.core.array_copy.call(null, earr__8754, 2 * (i + 1), earr__8754, 2 * i, len__8755 - 2 * (i + 1));
    earr__8754[len__8755 - 2] = null;
    earr__8754[len__8755 - 1] = null;
    return editable__8753
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8756 = this;
  var inode__8757 = this;
  var bit__8758 = 1 << (hash >>> shift & 31);
  var idx__8759 = cljs.core.bitmap_indexed_node_index.call(null, this__8756.bitmap, bit__8758);
  if((this__8756.bitmap & bit__8758) === 0) {
    var n__8760 = cljs.core.bit_count.call(null, this__8756.bitmap);
    if(2 * n__8760 < this__8756.arr.length) {
      var editable__8761 = inode__8757.ensure_editable(edit);
      var earr__8762 = editable__8761.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8762, 2 * idx__8759, earr__8762, 2 * (idx__8759 + 1), 2 * (n__8760 - idx__8759));
      earr__8762[2 * idx__8759] = key;
      earr__8762[2 * idx__8759 + 1] = val;
      editable__8761.bitmap = editable__8761.bitmap | bit__8758;
      return editable__8761
    }else {
      if(n__8760 >= 16) {
        var nodes__8763 = cljs.core.make_array.call(null, 32);
        var jdx__8764 = hash >>> shift & 31;
        nodes__8763[jdx__8764] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8765 = 0;
        var j__8766 = 0;
        while(true) {
          if(i__8765 < 32) {
            if((this__8756.bitmap >>> i__8765 & 1) === 0) {
              var G__8819 = i__8765 + 1;
              var G__8820 = j__8766;
              i__8765 = G__8819;
              j__8766 = G__8820;
              continue
            }else {
              nodes__8763[i__8765] = !(this__8756.arr[j__8766] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8756.arr[j__8766]), this__8756.arr[j__8766], this__8756.arr[j__8766 + 1], added_leaf_QMARK_) : this__8756.arr[j__8766 + 1];
              var G__8821 = i__8765 + 1;
              var G__8822 = j__8766 + 2;
              i__8765 = G__8821;
              j__8766 = G__8822;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8760 + 1, nodes__8763)
      }else {
        if("\ufdd0'else") {
          var new_arr__8767 = cljs.core.make_array.call(null, 2 * (n__8760 + 4));
          cljs.core.array_copy.call(null, this__8756.arr, 0, new_arr__8767, 0, 2 * idx__8759);
          new_arr__8767[2 * idx__8759] = key;
          new_arr__8767[2 * idx__8759 + 1] = val;
          cljs.core.array_copy.call(null, this__8756.arr, 2 * idx__8759, new_arr__8767, 2 * (idx__8759 + 1), 2 * (n__8760 - idx__8759));
          added_leaf_QMARK_.val = true;
          var editable__8768 = inode__8757.ensure_editable(edit);
          editable__8768.arr = new_arr__8767;
          editable__8768.bitmap = editable__8768.bitmap | bit__8758;
          return editable__8768
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8769 = this__8756.arr[2 * idx__8759];
    var val_or_node__8770 = this__8756.arr[2 * idx__8759 + 1];
    if(key_or_nil__8769 == null) {
      var n__8771 = val_or_node__8770.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8771 === val_or_node__8770) {
        return inode__8757
      }else {
        return cljs.core.edit_and_set.call(null, inode__8757, edit, 2 * idx__8759 + 1, n__8771)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8769)) {
        if(val === val_or_node__8770) {
          return inode__8757
        }else {
          return cljs.core.edit_and_set.call(null, inode__8757, edit, 2 * idx__8759 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8757, edit, 2 * idx__8759, null, 2 * idx__8759 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8769, val_or_node__8770, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8772 = this;
  var inode__8773 = this;
  return cljs.core.create_inode_seq.call(null, this__8772.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8774 = this;
  var inode__8775 = this;
  var bit__8776 = 1 << (hash >>> shift & 31);
  if((this__8774.bitmap & bit__8776) === 0) {
    return inode__8775
  }else {
    var idx__8777 = cljs.core.bitmap_indexed_node_index.call(null, this__8774.bitmap, bit__8776);
    var key_or_nil__8778 = this__8774.arr[2 * idx__8777];
    var val_or_node__8779 = this__8774.arr[2 * idx__8777 + 1];
    if(key_or_nil__8778 == null) {
      var n__8780 = val_or_node__8779.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8780 === val_or_node__8779) {
        return inode__8775
      }else {
        if(!(n__8780 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8775, edit, 2 * idx__8777 + 1, n__8780)
        }else {
          if(this__8774.bitmap === bit__8776) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8775.edit_and_remove_pair(edit, bit__8776, idx__8777)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8778)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8775.edit_and_remove_pair(edit, bit__8776, idx__8777)
      }else {
        if("\ufdd0'else") {
          return inode__8775
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8781 = this;
  var inode__8782 = this;
  if(e === this__8781.edit) {
    return inode__8782
  }else {
    var n__8783 = cljs.core.bit_count.call(null, this__8781.bitmap);
    var new_arr__8784 = cljs.core.make_array.call(null, n__8783 < 0 ? 4 : 2 * (n__8783 + 1));
    cljs.core.array_copy.call(null, this__8781.arr, 0, new_arr__8784, 0, 2 * n__8783);
    return new cljs.core.BitmapIndexedNode(e, this__8781.bitmap, new_arr__8784)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8785 = this;
  var inode__8786 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8785.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8787 = this;
  var inode__8788 = this;
  var bit__8789 = 1 << (hash >>> shift & 31);
  if((this__8787.bitmap & bit__8789) === 0) {
    return not_found
  }else {
    var idx__8790 = cljs.core.bitmap_indexed_node_index.call(null, this__8787.bitmap, bit__8789);
    var key_or_nil__8791 = this__8787.arr[2 * idx__8790];
    var val_or_node__8792 = this__8787.arr[2 * idx__8790 + 1];
    if(key_or_nil__8791 == null) {
      return val_or_node__8792.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8791)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8791, val_or_node__8792], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8793 = this;
  var inode__8794 = this;
  var bit__8795 = 1 << (hash >>> shift & 31);
  if((this__8793.bitmap & bit__8795) === 0) {
    return inode__8794
  }else {
    var idx__8796 = cljs.core.bitmap_indexed_node_index.call(null, this__8793.bitmap, bit__8795);
    var key_or_nil__8797 = this__8793.arr[2 * idx__8796];
    var val_or_node__8798 = this__8793.arr[2 * idx__8796 + 1];
    if(key_or_nil__8797 == null) {
      var n__8799 = val_or_node__8798.inode_without(shift + 5, hash, key);
      if(n__8799 === val_or_node__8798) {
        return inode__8794
      }else {
        if(!(n__8799 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8793.bitmap, cljs.core.clone_and_set.call(null, this__8793.arr, 2 * idx__8796 + 1, n__8799))
        }else {
          if(this__8793.bitmap === bit__8795) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8793.bitmap ^ bit__8795, cljs.core.remove_pair.call(null, this__8793.arr, idx__8796))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8797)) {
        return new cljs.core.BitmapIndexedNode(null, this__8793.bitmap ^ bit__8795, cljs.core.remove_pair.call(null, this__8793.arr, idx__8796))
      }else {
        if("\ufdd0'else") {
          return inode__8794
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8800 = this;
  var inode__8801 = this;
  var bit__8802 = 1 << (hash >>> shift & 31);
  var idx__8803 = cljs.core.bitmap_indexed_node_index.call(null, this__8800.bitmap, bit__8802);
  if((this__8800.bitmap & bit__8802) === 0) {
    var n__8804 = cljs.core.bit_count.call(null, this__8800.bitmap);
    if(n__8804 >= 16) {
      var nodes__8805 = cljs.core.make_array.call(null, 32);
      var jdx__8806 = hash >>> shift & 31;
      nodes__8805[jdx__8806] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8807 = 0;
      var j__8808 = 0;
      while(true) {
        if(i__8807 < 32) {
          if((this__8800.bitmap >>> i__8807 & 1) === 0) {
            var G__8823 = i__8807 + 1;
            var G__8824 = j__8808;
            i__8807 = G__8823;
            j__8808 = G__8824;
            continue
          }else {
            nodes__8805[i__8807] = !(this__8800.arr[j__8808] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8800.arr[j__8808]), this__8800.arr[j__8808], this__8800.arr[j__8808 + 1], added_leaf_QMARK_) : this__8800.arr[j__8808 + 1];
            var G__8825 = i__8807 + 1;
            var G__8826 = j__8808 + 2;
            i__8807 = G__8825;
            j__8808 = G__8826;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8804 + 1, nodes__8805)
    }else {
      var new_arr__8809 = cljs.core.make_array.call(null, 2 * (n__8804 + 1));
      cljs.core.array_copy.call(null, this__8800.arr, 0, new_arr__8809, 0, 2 * idx__8803);
      new_arr__8809[2 * idx__8803] = key;
      new_arr__8809[2 * idx__8803 + 1] = val;
      cljs.core.array_copy.call(null, this__8800.arr, 2 * idx__8803, new_arr__8809, 2 * (idx__8803 + 1), 2 * (n__8804 - idx__8803));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8800.bitmap | bit__8802, new_arr__8809)
    }
  }else {
    var key_or_nil__8810 = this__8800.arr[2 * idx__8803];
    var val_or_node__8811 = this__8800.arr[2 * idx__8803 + 1];
    if(key_or_nil__8810 == null) {
      var n__8812 = val_or_node__8811.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8812 === val_or_node__8811) {
        return inode__8801
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8800.bitmap, cljs.core.clone_and_set.call(null, this__8800.arr, 2 * idx__8803 + 1, n__8812))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8810)) {
        if(val === val_or_node__8811) {
          return inode__8801
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8800.bitmap, cljs.core.clone_and_set.call(null, this__8800.arr, 2 * idx__8803 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8800.bitmap, cljs.core.clone_and_set.call(null, this__8800.arr, 2 * idx__8803, null, 2 * idx__8803 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8810, val_or_node__8811, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8813 = this;
  var inode__8814 = this;
  var bit__8815 = 1 << (hash >>> shift & 31);
  if((this__8813.bitmap & bit__8815) === 0) {
    return not_found
  }else {
    var idx__8816 = cljs.core.bitmap_indexed_node_index.call(null, this__8813.bitmap, bit__8815);
    var key_or_nil__8817 = this__8813.arr[2 * idx__8816];
    var val_or_node__8818 = this__8813.arr[2 * idx__8816 + 1];
    if(key_or_nil__8817 == null) {
      return val_or_node__8818.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8817)) {
        return val_or_node__8818
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8834 = array_node.arr;
  var len__8835 = 2 * (array_node.cnt - 1);
  var new_arr__8836 = cljs.core.make_array.call(null, len__8835);
  var i__8837 = 0;
  var j__8838 = 1;
  var bitmap__8839 = 0;
  while(true) {
    if(i__8837 < len__8835) {
      if(function() {
        var and__3822__auto____8840 = !(i__8837 === idx);
        if(and__3822__auto____8840) {
          return!(arr__8834[i__8837] == null)
        }else {
          return and__3822__auto____8840
        }
      }()) {
        new_arr__8836[j__8838] = arr__8834[i__8837];
        var G__8841 = i__8837 + 1;
        var G__8842 = j__8838 + 2;
        var G__8843 = bitmap__8839 | 1 << i__8837;
        i__8837 = G__8841;
        j__8838 = G__8842;
        bitmap__8839 = G__8843;
        continue
      }else {
        var G__8844 = i__8837 + 1;
        var G__8845 = j__8838;
        var G__8846 = bitmap__8839;
        i__8837 = G__8844;
        j__8838 = G__8845;
        bitmap__8839 = G__8846;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8839, new_arr__8836)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8847 = this;
  var inode__8848 = this;
  var idx__8849 = hash >>> shift & 31;
  var node__8850 = this__8847.arr[idx__8849];
  if(node__8850 == null) {
    var editable__8851 = cljs.core.edit_and_set.call(null, inode__8848, edit, idx__8849, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8851.cnt = editable__8851.cnt + 1;
    return editable__8851
  }else {
    var n__8852 = node__8850.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8852 === node__8850) {
      return inode__8848
    }else {
      return cljs.core.edit_and_set.call(null, inode__8848, edit, idx__8849, n__8852)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8853 = this;
  var inode__8854 = this;
  return cljs.core.create_array_node_seq.call(null, this__8853.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8855 = this;
  var inode__8856 = this;
  var idx__8857 = hash >>> shift & 31;
  var node__8858 = this__8855.arr[idx__8857];
  if(node__8858 == null) {
    return inode__8856
  }else {
    var n__8859 = node__8858.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8859 === node__8858) {
      return inode__8856
    }else {
      if(n__8859 == null) {
        if(this__8855.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8856, edit, idx__8857)
        }else {
          var editable__8860 = cljs.core.edit_and_set.call(null, inode__8856, edit, idx__8857, n__8859);
          editable__8860.cnt = editable__8860.cnt - 1;
          return editable__8860
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8856, edit, idx__8857, n__8859)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8861 = this;
  var inode__8862 = this;
  if(e === this__8861.edit) {
    return inode__8862
  }else {
    return new cljs.core.ArrayNode(e, this__8861.cnt, this__8861.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8863 = this;
  var inode__8864 = this;
  var len__8865 = this__8863.arr.length;
  var i__8866 = 0;
  var init__8867 = init;
  while(true) {
    if(i__8866 < len__8865) {
      var node__8868 = this__8863.arr[i__8866];
      if(!(node__8868 == null)) {
        var init__8869 = node__8868.kv_reduce(f, init__8867);
        if(cljs.core.reduced_QMARK_.call(null, init__8869)) {
          return cljs.core.deref.call(null, init__8869)
        }else {
          var G__8888 = i__8866 + 1;
          var G__8889 = init__8869;
          i__8866 = G__8888;
          init__8867 = G__8889;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8867
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8870 = this;
  var inode__8871 = this;
  var idx__8872 = hash >>> shift & 31;
  var node__8873 = this__8870.arr[idx__8872];
  if(!(node__8873 == null)) {
    return node__8873.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8874 = this;
  var inode__8875 = this;
  var idx__8876 = hash >>> shift & 31;
  var node__8877 = this__8874.arr[idx__8876];
  if(!(node__8877 == null)) {
    var n__8878 = node__8877.inode_without(shift + 5, hash, key);
    if(n__8878 === node__8877) {
      return inode__8875
    }else {
      if(n__8878 == null) {
        if(this__8874.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8875, null, idx__8876)
        }else {
          return new cljs.core.ArrayNode(null, this__8874.cnt - 1, cljs.core.clone_and_set.call(null, this__8874.arr, idx__8876, n__8878))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8874.cnt, cljs.core.clone_and_set.call(null, this__8874.arr, idx__8876, n__8878))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8875
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8879 = this;
  var inode__8880 = this;
  var idx__8881 = hash >>> shift & 31;
  var node__8882 = this__8879.arr[idx__8881];
  if(node__8882 == null) {
    return new cljs.core.ArrayNode(null, this__8879.cnt + 1, cljs.core.clone_and_set.call(null, this__8879.arr, idx__8881, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8883 = node__8882.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8883 === node__8882) {
      return inode__8880
    }else {
      return new cljs.core.ArrayNode(null, this__8879.cnt, cljs.core.clone_and_set.call(null, this__8879.arr, idx__8881, n__8883))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8884 = this;
  var inode__8885 = this;
  var idx__8886 = hash >>> shift & 31;
  var node__8887 = this__8884.arr[idx__8886];
  if(!(node__8887 == null)) {
    return node__8887.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8892 = 2 * cnt;
  var i__8893 = 0;
  while(true) {
    if(i__8893 < lim__8892) {
      if(cljs.core.key_test.call(null, key, arr[i__8893])) {
        return i__8893
      }else {
        var G__8894 = i__8893 + 2;
        i__8893 = G__8894;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8895 = this;
  var inode__8896 = this;
  if(hash === this__8895.collision_hash) {
    var idx__8897 = cljs.core.hash_collision_node_find_index.call(null, this__8895.arr, this__8895.cnt, key);
    if(idx__8897 === -1) {
      if(this__8895.arr.length > 2 * this__8895.cnt) {
        var editable__8898 = cljs.core.edit_and_set.call(null, inode__8896, edit, 2 * this__8895.cnt, key, 2 * this__8895.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8898.cnt = editable__8898.cnt + 1;
        return editable__8898
      }else {
        var len__8899 = this__8895.arr.length;
        var new_arr__8900 = cljs.core.make_array.call(null, len__8899 + 2);
        cljs.core.array_copy.call(null, this__8895.arr, 0, new_arr__8900, 0, len__8899);
        new_arr__8900[len__8899] = key;
        new_arr__8900[len__8899 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8896.ensure_editable_array(edit, this__8895.cnt + 1, new_arr__8900)
      }
    }else {
      if(this__8895.arr[idx__8897 + 1] === val) {
        return inode__8896
      }else {
        return cljs.core.edit_and_set.call(null, inode__8896, edit, idx__8897 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8895.collision_hash >>> shift & 31), [null, inode__8896, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8901 = this;
  var inode__8902 = this;
  return cljs.core.create_inode_seq.call(null, this__8901.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8903 = this;
  var inode__8904 = this;
  var idx__8905 = cljs.core.hash_collision_node_find_index.call(null, this__8903.arr, this__8903.cnt, key);
  if(idx__8905 === -1) {
    return inode__8904
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8903.cnt === 1) {
      return null
    }else {
      var editable__8906 = inode__8904.ensure_editable(edit);
      var earr__8907 = editable__8906.arr;
      earr__8907[idx__8905] = earr__8907[2 * this__8903.cnt - 2];
      earr__8907[idx__8905 + 1] = earr__8907[2 * this__8903.cnt - 1];
      earr__8907[2 * this__8903.cnt - 1] = null;
      earr__8907[2 * this__8903.cnt - 2] = null;
      editable__8906.cnt = editable__8906.cnt - 1;
      return editable__8906
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8908 = this;
  var inode__8909 = this;
  if(e === this__8908.edit) {
    return inode__8909
  }else {
    var new_arr__8910 = cljs.core.make_array.call(null, 2 * (this__8908.cnt + 1));
    cljs.core.array_copy.call(null, this__8908.arr, 0, new_arr__8910, 0, 2 * this__8908.cnt);
    return new cljs.core.HashCollisionNode(e, this__8908.collision_hash, this__8908.cnt, new_arr__8910)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8911 = this;
  var inode__8912 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8911.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8913 = this;
  var inode__8914 = this;
  var idx__8915 = cljs.core.hash_collision_node_find_index.call(null, this__8913.arr, this__8913.cnt, key);
  if(idx__8915 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8913.arr[idx__8915])) {
      return cljs.core.PersistentVector.fromArray([this__8913.arr[idx__8915], this__8913.arr[idx__8915 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8916 = this;
  var inode__8917 = this;
  var idx__8918 = cljs.core.hash_collision_node_find_index.call(null, this__8916.arr, this__8916.cnt, key);
  if(idx__8918 === -1) {
    return inode__8917
  }else {
    if(this__8916.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8916.collision_hash, this__8916.cnt - 1, cljs.core.remove_pair.call(null, this__8916.arr, cljs.core.quot.call(null, idx__8918, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8919 = this;
  var inode__8920 = this;
  if(hash === this__8919.collision_hash) {
    var idx__8921 = cljs.core.hash_collision_node_find_index.call(null, this__8919.arr, this__8919.cnt, key);
    if(idx__8921 === -1) {
      var len__8922 = this__8919.arr.length;
      var new_arr__8923 = cljs.core.make_array.call(null, len__8922 + 2);
      cljs.core.array_copy.call(null, this__8919.arr, 0, new_arr__8923, 0, len__8922);
      new_arr__8923[len__8922] = key;
      new_arr__8923[len__8922 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8919.collision_hash, this__8919.cnt + 1, new_arr__8923)
    }else {
      if(cljs.core._EQ_.call(null, this__8919.arr[idx__8921], val)) {
        return inode__8920
      }else {
        return new cljs.core.HashCollisionNode(null, this__8919.collision_hash, this__8919.cnt, cljs.core.clone_and_set.call(null, this__8919.arr, idx__8921 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8919.collision_hash >>> shift & 31), [null, inode__8920])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8924 = this;
  var inode__8925 = this;
  var idx__8926 = cljs.core.hash_collision_node_find_index.call(null, this__8924.arr, this__8924.cnt, key);
  if(idx__8926 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8924.arr[idx__8926])) {
      return this__8924.arr[idx__8926 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8927 = this;
  var inode__8928 = this;
  if(e === this__8927.edit) {
    this__8927.arr = array;
    this__8927.cnt = count;
    return inode__8928
  }else {
    return new cljs.core.HashCollisionNode(this__8927.edit, this__8927.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8933 = cljs.core.hash.call(null, key1);
    if(key1hash__8933 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8933, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8934 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8933, key1, val1, added_leaf_QMARK___8934).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8934)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8935 = cljs.core.hash.call(null, key1);
    if(key1hash__8935 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8935, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8936 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8935, key1, val1, added_leaf_QMARK___8936).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8936)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8937 = this;
  var h__2228__auto____8938 = this__8937.__hash;
  if(!(h__2228__auto____8938 == null)) {
    return h__2228__auto____8938
  }else {
    var h__2228__auto____8939 = cljs.core.hash_coll.call(null, coll);
    this__8937.__hash = h__2228__auto____8939;
    return h__2228__auto____8939
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8940 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8941 = this;
  var this__8942 = this;
  return cljs.core.pr_str.call(null, this__8942)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8943 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8944 = this;
  if(this__8944.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8944.nodes[this__8944.i], this__8944.nodes[this__8944.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8944.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8945 = this;
  if(this__8945.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8945.nodes, this__8945.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8945.nodes, this__8945.i, cljs.core.next.call(null, this__8945.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8946 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8947 = this;
  return new cljs.core.NodeSeq(meta, this__8947.nodes, this__8947.i, this__8947.s, this__8947.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8948 = this;
  return this__8948.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8949 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8949.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8956 = nodes.length;
      var j__8957 = i;
      while(true) {
        if(j__8957 < len__8956) {
          if(!(nodes[j__8957] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8957, null, null)
          }else {
            var temp__3971__auto____8958 = nodes[j__8957 + 1];
            if(cljs.core.truth_(temp__3971__auto____8958)) {
              var node__8959 = temp__3971__auto____8958;
              var temp__3971__auto____8960 = node__8959.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8960)) {
                var node_seq__8961 = temp__3971__auto____8960;
                return new cljs.core.NodeSeq(null, nodes, j__8957 + 2, node_seq__8961, null)
              }else {
                var G__8962 = j__8957 + 2;
                j__8957 = G__8962;
                continue
              }
            }else {
              var G__8963 = j__8957 + 2;
              j__8957 = G__8963;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8964 = this;
  var h__2228__auto____8965 = this__8964.__hash;
  if(!(h__2228__auto____8965 == null)) {
    return h__2228__auto____8965
  }else {
    var h__2228__auto____8966 = cljs.core.hash_coll.call(null, coll);
    this__8964.__hash = h__2228__auto____8966;
    return h__2228__auto____8966
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8967 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8968 = this;
  var this__8969 = this;
  return cljs.core.pr_str.call(null, this__8969)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8970 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8971 = this;
  return cljs.core.first.call(null, this__8971.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8972 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8972.nodes, this__8972.i, cljs.core.next.call(null, this__8972.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8973 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8974 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8974.nodes, this__8974.i, this__8974.s, this__8974.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8975 = this;
  return this__8975.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8976 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8976.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8983 = nodes.length;
      var j__8984 = i;
      while(true) {
        if(j__8984 < len__8983) {
          var temp__3971__auto____8985 = nodes[j__8984];
          if(cljs.core.truth_(temp__3971__auto____8985)) {
            var nj__8986 = temp__3971__auto____8985;
            var temp__3971__auto____8987 = nj__8986.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____8987)) {
              var ns__8988 = temp__3971__auto____8987;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8984 + 1, ns__8988, null)
            }else {
              var G__8989 = j__8984 + 1;
              j__8984 = G__8989;
              continue
            }
          }else {
            var G__8990 = j__8984 + 1;
            j__8984 = G__8990;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8993 = this;
  return new cljs.core.TransientHashMap({}, this__8993.root, this__8993.cnt, this__8993.has_nil_QMARK_, this__8993.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8994 = this;
  var h__2228__auto____8995 = this__8994.__hash;
  if(!(h__2228__auto____8995 == null)) {
    return h__2228__auto____8995
  }else {
    var h__2228__auto____8996 = cljs.core.hash_imap.call(null, coll);
    this__8994.__hash = h__2228__auto____8996;
    return h__2228__auto____8996
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8997 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8998 = this;
  if(k == null) {
    if(this__8998.has_nil_QMARK_) {
      return this__8998.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8998.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8998.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8999 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9000 = this__8999.has_nil_QMARK_;
      if(and__3822__auto____9000) {
        return v === this__8999.nil_val
      }else {
        return and__3822__auto____9000
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8999.meta, this__8999.has_nil_QMARK_ ? this__8999.cnt : this__8999.cnt + 1, this__8999.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9001 = new cljs.core.Box(false);
    var new_root__9002 = (this__8999.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8999.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9001);
    if(new_root__9002 === this__8999.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8999.meta, added_leaf_QMARK___9001.val ? this__8999.cnt + 1 : this__8999.cnt, new_root__9002, this__8999.has_nil_QMARK_, this__8999.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9003 = this;
  if(k == null) {
    return this__9003.has_nil_QMARK_
  }else {
    if(this__9003.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9003.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9026 = null;
  var G__9026__2 = function(this_sym9004, k) {
    var this__9006 = this;
    var this_sym9004__9007 = this;
    var coll__9008 = this_sym9004__9007;
    return coll__9008.cljs$core$ILookup$_lookup$arity$2(coll__9008, k)
  };
  var G__9026__3 = function(this_sym9005, k, not_found) {
    var this__9006 = this;
    var this_sym9005__9009 = this;
    var coll__9010 = this_sym9005__9009;
    return coll__9010.cljs$core$ILookup$_lookup$arity$3(coll__9010, k, not_found)
  };
  G__9026 = function(this_sym9005, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9026__2.call(this, this_sym9005, k);
      case 3:
        return G__9026__3.call(this, this_sym9005, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9026
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8991, args8992) {
  var this__9011 = this;
  return this_sym8991.call.apply(this_sym8991, [this_sym8991].concat(args8992.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9012 = this;
  var init__9013 = this__9012.has_nil_QMARK_ ? f.call(null, init, null, this__9012.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9013)) {
    return cljs.core.deref.call(null, init__9013)
  }else {
    if(!(this__9012.root == null)) {
      return this__9012.root.kv_reduce(f, init__9013)
    }else {
      if("\ufdd0'else") {
        return init__9013
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9014 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9015 = this;
  var this__9016 = this;
  return cljs.core.pr_str.call(null, this__9016)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9017 = this;
  if(this__9017.cnt > 0) {
    var s__9018 = !(this__9017.root == null) ? this__9017.root.inode_seq() : null;
    if(this__9017.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9017.nil_val], true), s__9018)
    }else {
      return s__9018
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9019 = this;
  return this__9019.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9020 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9021 = this;
  return new cljs.core.PersistentHashMap(meta, this__9021.cnt, this__9021.root, this__9021.has_nil_QMARK_, this__9021.nil_val, this__9021.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9022 = this;
  return this__9022.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9023 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9023.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9024 = this;
  if(k == null) {
    if(this__9024.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9024.meta, this__9024.cnt - 1, this__9024.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9024.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9025 = this__9024.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9025 === this__9024.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9024.meta, this__9024.cnt - 1, new_root__9025, this__9024.has_nil_QMARK_, this__9024.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9027 = ks.length;
  var i__9028 = 0;
  var out__9029 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9028 < len__9027) {
      var G__9030 = i__9028 + 1;
      var G__9031 = cljs.core.assoc_BANG_.call(null, out__9029, ks[i__9028], vs[i__9028]);
      i__9028 = G__9030;
      out__9029 = G__9031;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9029)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9032 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9033 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9034 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9035 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9036 = this;
  if(k == null) {
    if(this__9036.has_nil_QMARK_) {
      return this__9036.nil_val
    }else {
      return null
    }
  }else {
    if(this__9036.root == null) {
      return null
    }else {
      return this__9036.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9037 = this;
  if(k == null) {
    if(this__9037.has_nil_QMARK_) {
      return this__9037.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9037.root == null) {
      return not_found
    }else {
      return this__9037.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9038 = this;
  if(this__9038.edit) {
    return this__9038.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9039 = this;
  var tcoll__9040 = this;
  if(this__9039.edit) {
    if(function() {
      var G__9041__9042 = o;
      if(G__9041__9042) {
        if(function() {
          var or__3824__auto____9043 = G__9041__9042.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9043) {
            return or__3824__auto____9043
          }else {
            return G__9041__9042.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9041__9042.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9041__9042)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9041__9042)
      }
    }()) {
      return tcoll__9040.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9044 = cljs.core.seq.call(null, o);
      var tcoll__9045 = tcoll__9040;
      while(true) {
        var temp__3971__auto____9046 = cljs.core.first.call(null, es__9044);
        if(cljs.core.truth_(temp__3971__auto____9046)) {
          var e__9047 = temp__3971__auto____9046;
          var G__9058 = cljs.core.next.call(null, es__9044);
          var G__9059 = tcoll__9045.assoc_BANG_(cljs.core.key.call(null, e__9047), cljs.core.val.call(null, e__9047));
          es__9044 = G__9058;
          tcoll__9045 = G__9059;
          continue
        }else {
          return tcoll__9045
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9048 = this;
  var tcoll__9049 = this;
  if(this__9048.edit) {
    if(k == null) {
      if(this__9048.nil_val === v) {
      }else {
        this__9048.nil_val = v
      }
      if(this__9048.has_nil_QMARK_) {
      }else {
        this__9048.count = this__9048.count + 1;
        this__9048.has_nil_QMARK_ = true
      }
      return tcoll__9049
    }else {
      var added_leaf_QMARK___9050 = new cljs.core.Box(false);
      var node__9051 = (this__9048.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9048.root).inode_assoc_BANG_(this__9048.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9050);
      if(node__9051 === this__9048.root) {
      }else {
        this__9048.root = node__9051
      }
      if(added_leaf_QMARK___9050.val) {
        this__9048.count = this__9048.count + 1
      }else {
      }
      return tcoll__9049
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9052 = this;
  var tcoll__9053 = this;
  if(this__9052.edit) {
    if(k == null) {
      if(this__9052.has_nil_QMARK_) {
        this__9052.has_nil_QMARK_ = false;
        this__9052.nil_val = null;
        this__9052.count = this__9052.count - 1;
        return tcoll__9053
      }else {
        return tcoll__9053
      }
    }else {
      if(this__9052.root == null) {
        return tcoll__9053
      }else {
        var removed_leaf_QMARK___9054 = new cljs.core.Box(false);
        var node__9055 = this__9052.root.inode_without_BANG_(this__9052.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9054);
        if(node__9055 === this__9052.root) {
        }else {
          this__9052.root = node__9055
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9054[0])) {
          this__9052.count = this__9052.count - 1
        }else {
        }
        return tcoll__9053
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9056 = this;
  var tcoll__9057 = this;
  if(this__9056.edit) {
    this__9056.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9056.count, this__9056.root, this__9056.has_nil_QMARK_, this__9056.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9062 = node;
  var stack__9063 = stack;
  while(true) {
    if(!(t__9062 == null)) {
      var G__9064 = ascending_QMARK_ ? t__9062.left : t__9062.right;
      var G__9065 = cljs.core.conj.call(null, stack__9063, t__9062);
      t__9062 = G__9064;
      stack__9063 = G__9065;
      continue
    }else {
      return stack__9063
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9066 = this;
  var h__2228__auto____9067 = this__9066.__hash;
  if(!(h__2228__auto____9067 == null)) {
    return h__2228__auto____9067
  }else {
    var h__2228__auto____9068 = cljs.core.hash_coll.call(null, coll);
    this__9066.__hash = h__2228__auto____9068;
    return h__2228__auto____9068
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9069 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9070 = this;
  var this__9071 = this;
  return cljs.core.pr_str.call(null, this__9071)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9072 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9073 = this;
  if(this__9073.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9073.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9074 = this;
  return cljs.core.peek.call(null, this__9074.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9075 = this;
  var t__9076 = cljs.core.first.call(null, this__9075.stack);
  var next_stack__9077 = cljs.core.tree_map_seq_push.call(null, this__9075.ascending_QMARK_ ? t__9076.right : t__9076.left, cljs.core.next.call(null, this__9075.stack), this__9075.ascending_QMARK_);
  if(!(next_stack__9077 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9077, this__9075.ascending_QMARK_, this__9075.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9078 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9079 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9079.stack, this__9079.ascending_QMARK_, this__9079.cnt, this__9079.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9080 = this;
  return this__9080.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9082 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9082) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9082
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9084 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9084) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9084
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9088 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9088)) {
    return cljs.core.deref.call(null, init__9088)
  }else {
    var init__9089 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9088) : init__9088;
    if(cljs.core.reduced_QMARK_.call(null, init__9089)) {
      return cljs.core.deref.call(null, init__9089)
    }else {
      var init__9090 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9089) : init__9089;
      if(cljs.core.reduced_QMARK_.call(null, init__9090)) {
        return cljs.core.deref.call(null, init__9090)
      }else {
        return init__9090
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9093 = this;
  var h__2228__auto____9094 = this__9093.__hash;
  if(!(h__2228__auto____9094 == null)) {
    return h__2228__auto____9094
  }else {
    var h__2228__auto____9095 = cljs.core.hash_coll.call(null, coll);
    this__9093.__hash = h__2228__auto____9095;
    return h__2228__auto____9095
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9096 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9097 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9098 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9098.key, this__9098.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9146 = null;
  var G__9146__2 = function(this_sym9099, k) {
    var this__9101 = this;
    var this_sym9099__9102 = this;
    var node__9103 = this_sym9099__9102;
    return node__9103.cljs$core$ILookup$_lookup$arity$2(node__9103, k)
  };
  var G__9146__3 = function(this_sym9100, k, not_found) {
    var this__9101 = this;
    var this_sym9100__9104 = this;
    var node__9105 = this_sym9100__9104;
    return node__9105.cljs$core$ILookup$_lookup$arity$3(node__9105, k, not_found)
  };
  G__9146 = function(this_sym9100, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9146__2.call(this, this_sym9100, k);
      case 3:
        return G__9146__3.call(this, this_sym9100, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9146
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9091, args9092) {
  var this__9106 = this;
  return this_sym9091.call.apply(this_sym9091, [this_sym9091].concat(args9092.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9107 = this;
  return cljs.core.PersistentVector.fromArray([this__9107.key, this__9107.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9108 = this;
  return this__9108.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9109 = this;
  return this__9109.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9110 = this;
  var node__9111 = this;
  return ins.balance_right(node__9111)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9112 = this;
  var node__9113 = this;
  return new cljs.core.RedNode(this__9112.key, this__9112.val, this__9112.left, this__9112.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9114 = this;
  var node__9115 = this;
  return cljs.core.balance_right_del.call(null, this__9114.key, this__9114.val, this__9114.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9116 = this;
  var node__9117 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9118 = this;
  var node__9119 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9119, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9120 = this;
  var node__9121 = this;
  return cljs.core.balance_left_del.call(null, this__9120.key, this__9120.val, del, this__9120.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9122 = this;
  var node__9123 = this;
  return ins.balance_left(node__9123)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9124 = this;
  var node__9125 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9125, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9147 = null;
  var G__9147__0 = function() {
    var this__9126 = this;
    var this__9128 = this;
    return cljs.core.pr_str.call(null, this__9128)
  };
  G__9147 = function() {
    switch(arguments.length) {
      case 0:
        return G__9147__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9147
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9129 = this;
  var node__9130 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9130, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9131 = this;
  var node__9132 = this;
  return node__9132
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9133 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9134 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9135 = this;
  return cljs.core.list.call(null, this__9135.key, this__9135.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9136 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9137 = this;
  return this__9137.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9138 = this;
  return cljs.core.PersistentVector.fromArray([this__9138.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9139 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9139.key, this__9139.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9140 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9141 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9141.key, this__9141.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9142 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9143 = this;
  if(n === 0) {
    return this__9143.key
  }else {
    if(n === 1) {
      return this__9143.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9144 = this;
  if(n === 0) {
    return this__9144.key
  }else {
    if(n === 1) {
      return this__9144.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9145 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9150 = this;
  var h__2228__auto____9151 = this__9150.__hash;
  if(!(h__2228__auto____9151 == null)) {
    return h__2228__auto____9151
  }else {
    var h__2228__auto____9152 = cljs.core.hash_coll.call(null, coll);
    this__9150.__hash = h__2228__auto____9152;
    return h__2228__auto____9152
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9153 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9154 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9155 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9155.key, this__9155.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9203 = null;
  var G__9203__2 = function(this_sym9156, k) {
    var this__9158 = this;
    var this_sym9156__9159 = this;
    var node__9160 = this_sym9156__9159;
    return node__9160.cljs$core$ILookup$_lookup$arity$2(node__9160, k)
  };
  var G__9203__3 = function(this_sym9157, k, not_found) {
    var this__9158 = this;
    var this_sym9157__9161 = this;
    var node__9162 = this_sym9157__9161;
    return node__9162.cljs$core$ILookup$_lookup$arity$3(node__9162, k, not_found)
  };
  G__9203 = function(this_sym9157, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9203__2.call(this, this_sym9157, k);
      case 3:
        return G__9203__3.call(this, this_sym9157, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9203
}();
cljs.core.RedNode.prototype.apply = function(this_sym9148, args9149) {
  var this__9163 = this;
  return this_sym9148.call.apply(this_sym9148, [this_sym9148].concat(args9149.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9164 = this;
  return cljs.core.PersistentVector.fromArray([this__9164.key, this__9164.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9165 = this;
  return this__9165.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9166 = this;
  return this__9166.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9167 = this;
  var node__9168 = this;
  return new cljs.core.RedNode(this__9167.key, this__9167.val, this__9167.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9169 = this;
  var node__9170 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9171 = this;
  var node__9172 = this;
  return new cljs.core.RedNode(this__9171.key, this__9171.val, this__9171.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9173 = this;
  var node__9174 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9175 = this;
  var node__9176 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9176, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9177 = this;
  var node__9178 = this;
  return new cljs.core.RedNode(this__9177.key, this__9177.val, del, this__9177.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9179 = this;
  var node__9180 = this;
  return new cljs.core.RedNode(this__9179.key, this__9179.val, ins, this__9179.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9181 = this;
  var node__9182 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9181.left)) {
    return new cljs.core.RedNode(this__9181.key, this__9181.val, this__9181.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9181.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9181.right)) {
      return new cljs.core.RedNode(this__9181.right.key, this__9181.right.val, new cljs.core.BlackNode(this__9181.key, this__9181.val, this__9181.left, this__9181.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9181.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9182, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9204 = null;
  var G__9204__0 = function() {
    var this__9183 = this;
    var this__9185 = this;
    return cljs.core.pr_str.call(null, this__9185)
  };
  G__9204 = function() {
    switch(arguments.length) {
      case 0:
        return G__9204__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9204
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9186 = this;
  var node__9187 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9186.right)) {
    return new cljs.core.RedNode(this__9186.key, this__9186.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9186.left, null), this__9186.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9186.left)) {
      return new cljs.core.RedNode(this__9186.left.key, this__9186.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9186.left.left, null), new cljs.core.BlackNode(this__9186.key, this__9186.val, this__9186.left.right, this__9186.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9187, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9188 = this;
  var node__9189 = this;
  return new cljs.core.BlackNode(this__9188.key, this__9188.val, this__9188.left, this__9188.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9190 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9191 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9192 = this;
  return cljs.core.list.call(null, this__9192.key, this__9192.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9193 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9194 = this;
  return this__9194.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9195 = this;
  return cljs.core.PersistentVector.fromArray([this__9195.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9196 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9196.key, this__9196.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9197 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9198 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9198.key, this__9198.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9199 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9200 = this;
  if(n === 0) {
    return this__9200.key
  }else {
    if(n === 1) {
      return this__9200.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9201 = this;
  if(n === 0) {
    return this__9201.key
  }else {
    if(n === 1) {
      return this__9201.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9202 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9208 = comp.call(null, k, tree.key);
    if(c__9208 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9208 < 0) {
        var ins__9209 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9209 == null)) {
          return tree.add_left(ins__9209)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9210 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9210 == null)) {
            return tree.add_right(ins__9210)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9213 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9213)) {
            return new cljs.core.RedNode(app__9213.key, app__9213.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9213.left, null), new cljs.core.RedNode(right.key, right.val, app__9213.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9213, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9214 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9214)) {
              return new cljs.core.RedNode(app__9214.key, app__9214.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9214.left, null), new cljs.core.BlackNode(right.key, right.val, app__9214.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9214, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9220 = comp.call(null, k, tree.key);
    if(c__9220 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9220 < 0) {
        var del__9221 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9222 = !(del__9221 == null);
          if(or__3824__auto____9222) {
            return or__3824__auto____9222
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9221, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9221, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9223 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9224 = !(del__9223 == null);
            if(or__3824__auto____9224) {
              return or__3824__auto____9224
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9223)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9223, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9227 = tree.key;
  var c__9228 = comp.call(null, k, tk__9227);
  if(c__9228 === 0) {
    return tree.replace(tk__9227, v, tree.left, tree.right)
  }else {
    if(c__9228 < 0) {
      return tree.replace(tk__9227, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9227, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9231 = this;
  var h__2228__auto____9232 = this__9231.__hash;
  if(!(h__2228__auto____9232 == null)) {
    return h__2228__auto____9232
  }else {
    var h__2228__auto____9233 = cljs.core.hash_imap.call(null, coll);
    this__9231.__hash = h__2228__auto____9233;
    return h__2228__auto____9233
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9234 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9235 = this;
  var n__9236 = coll.entry_at(k);
  if(!(n__9236 == null)) {
    return n__9236.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9237 = this;
  var found__9238 = [null];
  var t__9239 = cljs.core.tree_map_add.call(null, this__9237.comp, this__9237.tree, k, v, found__9238);
  if(t__9239 == null) {
    var found_node__9240 = cljs.core.nth.call(null, found__9238, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9240.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9237.comp, cljs.core.tree_map_replace.call(null, this__9237.comp, this__9237.tree, k, v), this__9237.cnt, this__9237.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9237.comp, t__9239.blacken(), this__9237.cnt + 1, this__9237.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9241 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9275 = null;
  var G__9275__2 = function(this_sym9242, k) {
    var this__9244 = this;
    var this_sym9242__9245 = this;
    var coll__9246 = this_sym9242__9245;
    return coll__9246.cljs$core$ILookup$_lookup$arity$2(coll__9246, k)
  };
  var G__9275__3 = function(this_sym9243, k, not_found) {
    var this__9244 = this;
    var this_sym9243__9247 = this;
    var coll__9248 = this_sym9243__9247;
    return coll__9248.cljs$core$ILookup$_lookup$arity$3(coll__9248, k, not_found)
  };
  G__9275 = function(this_sym9243, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9275__2.call(this, this_sym9243, k);
      case 3:
        return G__9275__3.call(this, this_sym9243, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9275
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9229, args9230) {
  var this__9249 = this;
  return this_sym9229.call.apply(this_sym9229, [this_sym9229].concat(args9230.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9250 = this;
  if(!(this__9250.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9250.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9251 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9252 = this;
  if(this__9252.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9252.tree, false, this__9252.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9253 = this;
  var this__9254 = this;
  return cljs.core.pr_str.call(null, this__9254)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9255 = this;
  var coll__9256 = this;
  var t__9257 = this__9255.tree;
  while(true) {
    if(!(t__9257 == null)) {
      var c__9258 = this__9255.comp.call(null, k, t__9257.key);
      if(c__9258 === 0) {
        return t__9257
      }else {
        if(c__9258 < 0) {
          var G__9276 = t__9257.left;
          t__9257 = G__9276;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9277 = t__9257.right;
            t__9257 = G__9277;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9259 = this;
  if(this__9259.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9259.tree, ascending_QMARK_, this__9259.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9260 = this;
  if(this__9260.cnt > 0) {
    var stack__9261 = null;
    var t__9262 = this__9260.tree;
    while(true) {
      if(!(t__9262 == null)) {
        var c__9263 = this__9260.comp.call(null, k, t__9262.key);
        if(c__9263 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9261, t__9262), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9263 < 0) {
              var G__9278 = cljs.core.conj.call(null, stack__9261, t__9262);
              var G__9279 = t__9262.left;
              stack__9261 = G__9278;
              t__9262 = G__9279;
              continue
            }else {
              var G__9280 = stack__9261;
              var G__9281 = t__9262.right;
              stack__9261 = G__9280;
              t__9262 = G__9281;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9263 > 0) {
                var G__9282 = cljs.core.conj.call(null, stack__9261, t__9262);
                var G__9283 = t__9262.right;
                stack__9261 = G__9282;
                t__9262 = G__9283;
                continue
              }else {
                var G__9284 = stack__9261;
                var G__9285 = t__9262.left;
                stack__9261 = G__9284;
                t__9262 = G__9285;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9261 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9261, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9264 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9265 = this;
  return this__9265.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9266 = this;
  if(this__9266.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9266.tree, true, this__9266.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9267 = this;
  return this__9267.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9268 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9269 = this;
  return new cljs.core.PersistentTreeMap(this__9269.comp, this__9269.tree, this__9269.cnt, meta, this__9269.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9270 = this;
  return this__9270.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9271 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9271.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9272 = this;
  var found__9273 = [null];
  var t__9274 = cljs.core.tree_map_remove.call(null, this__9272.comp, this__9272.tree, k, found__9273);
  if(t__9274 == null) {
    if(cljs.core.nth.call(null, found__9273, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9272.comp, null, 0, this__9272.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9272.comp, t__9274.blacken(), this__9272.cnt - 1, this__9272.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9288 = cljs.core.seq.call(null, keyvals);
    var out__9289 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9288) {
        var G__9290 = cljs.core.nnext.call(null, in__9288);
        var G__9291 = cljs.core.assoc_BANG_.call(null, out__9289, cljs.core.first.call(null, in__9288), cljs.core.second.call(null, in__9288));
        in__9288 = G__9290;
        out__9289 = G__9291;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9289)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9292) {
    var keyvals = cljs.core.seq(arglist__9292);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9293) {
    var keyvals = cljs.core.seq(arglist__9293);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9297 = [];
    var obj__9298 = {};
    var kvs__9299 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9299) {
        ks__9297.push(cljs.core.first.call(null, kvs__9299));
        obj__9298[cljs.core.first.call(null, kvs__9299)] = cljs.core.second.call(null, kvs__9299);
        var G__9300 = cljs.core.nnext.call(null, kvs__9299);
        kvs__9299 = G__9300;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9297, obj__9298)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9301) {
    var keyvals = cljs.core.seq(arglist__9301);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9304 = cljs.core.seq.call(null, keyvals);
    var out__9305 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9304) {
        var G__9306 = cljs.core.nnext.call(null, in__9304);
        var G__9307 = cljs.core.assoc.call(null, out__9305, cljs.core.first.call(null, in__9304), cljs.core.second.call(null, in__9304));
        in__9304 = G__9306;
        out__9305 = G__9307;
        continue
      }else {
        return out__9305
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9308) {
    var keyvals = cljs.core.seq(arglist__9308);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9311 = cljs.core.seq.call(null, keyvals);
    var out__9312 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9311) {
        var G__9313 = cljs.core.nnext.call(null, in__9311);
        var G__9314 = cljs.core.assoc.call(null, out__9312, cljs.core.first.call(null, in__9311), cljs.core.second.call(null, in__9311));
        in__9311 = G__9313;
        out__9312 = G__9314;
        continue
      }else {
        return out__9312
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9315) {
    var comparator = cljs.core.first(arglist__9315);
    var keyvals = cljs.core.rest(arglist__9315);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9316_SHARP_, p2__9317_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9319 = p1__9316_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9319)) {
            return or__3824__auto____9319
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9317_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9320) {
    var maps = cljs.core.seq(arglist__9320);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9328 = function(m, e) {
        var k__9326 = cljs.core.first.call(null, e);
        var v__9327 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9326)) {
          return cljs.core.assoc.call(null, m, k__9326, f.call(null, cljs.core._lookup.call(null, m, k__9326, null), v__9327))
        }else {
          return cljs.core.assoc.call(null, m, k__9326, v__9327)
        }
      };
      var merge2__9330 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9328, function() {
          var or__3824__auto____9329 = m1;
          if(cljs.core.truth_(or__3824__auto____9329)) {
            return or__3824__auto____9329
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9330, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9331) {
    var f = cljs.core.first(arglist__9331);
    var maps = cljs.core.rest(arglist__9331);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9336 = cljs.core.ObjMap.EMPTY;
  var keys__9337 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9337) {
      var key__9338 = cljs.core.first.call(null, keys__9337);
      var entry__9339 = cljs.core._lookup.call(null, map, key__9338, "\ufdd0'cljs.core/not-found");
      var G__9340 = cljs.core.not_EQ_.call(null, entry__9339, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9336, key__9338, entry__9339) : ret__9336;
      var G__9341 = cljs.core.next.call(null, keys__9337);
      ret__9336 = G__9340;
      keys__9337 = G__9341;
      continue
    }else {
      return ret__9336
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9345 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9345.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9346 = this;
  var h__2228__auto____9347 = this__9346.__hash;
  if(!(h__2228__auto____9347 == null)) {
    return h__2228__auto____9347
  }else {
    var h__2228__auto____9348 = cljs.core.hash_iset.call(null, coll);
    this__9346.__hash = h__2228__auto____9348;
    return h__2228__auto____9348
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9349 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9350 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9350.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9371 = null;
  var G__9371__2 = function(this_sym9351, k) {
    var this__9353 = this;
    var this_sym9351__9354 = this;
    var coll__9355 = this_sym9351__9354;
    return coll__9355.cljs$core$ILookup$_lookup$arity$2(coll__9355, k)
  };
  var G__9371__3 = function(this_sym9352, k, not_found) {
    var this__9353 = this;
    var this_sym9352__9356 = this;
    var coll__9357 = this_sym9352__9356;
    return coll__9357.cljs$core$ILookup$_lookup$arity$3(coll__9357, k, not_found)
  };
  G__9371 = function(this_sym9352, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9371__2.call(this, this_sym9352, k);
      case 3:
        return G__9371__3.call(this, this_sym9352, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9371
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9343, args9344) {
  var this__9358 = this;
  return this_sym9343.call.apply(this_sym9343, [this_sym9343].concat(args9344.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9359 = this;
  return new cljs.core.PersistentHashSet(this__9359.meta, cljs.core.assoc.call(null, this__9359.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9360 = this;
  var this__9361 = this;
  return cljs.core.pr_str.call(null, this__9361)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9362 = this;
  return cljs.core.keys.call(null, this__9362.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9363 = this;
  return new cljs.core.PersistentHashSet(this__9363.meta, cljs.core.dissoc.call(null, this__9363.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9364 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9365 = this;
  var and__3822__auto____9366 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9366) {
    var and__3822__auto____9367 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9367) {
      return cljs.core.every_QMARK_.call(null, function(p1__9342_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9342_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9367
    }
  }else {
    return and__3822__auto____9366
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9368 = this;
  return new cljs.core.PersistentHashSet(meta, this__9368.hash_map, this__9368.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9369 = this;
  return this__9369.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9370 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9370.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9372 = cljs.core.count.call(null, items);
  var i__9373 = 0;
  var out__9374 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9373 < len__9372) {
      var G__9375 = i__9373 + 1;
      var G__9376 = cljs.core.conj_BANG_.call(null, out__9374, items[i__9373]);
      i__9373 = G__9375;
      out__9374 = G__9376;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9374)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9394 = null;
  var G__9394__2 = function(this_sym9380, k) {
    var this__9382 = this;
    var this_sym9380__9383 = this;
    var tcoll__9384 = this_sym9380__9383;
    if(cljs.core._lookup.call(null, this__9382.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9394__3 = function(this_sym9381, k, not_found) {
    var this__9382 = this;
    var this_sym9381__9385 = this;
    var tcoll__9386 = this_sym9381__9385;
    if(cljs.core._lookup.call(null, this__9382.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9394 = function(this_sym9381, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9394__2.call(this, this_sym9381, k);
      case 3:
        return G__9394__3.call(this, this_sym9381, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9394
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9378, args9379) {
  var this__9387 = this;
  return this_sym9378.call.apply(this_sym9378, [this_sym9378].concat(args9379.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9388 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9389 = this;
  if(cljs.core._lookup.call(null, this__9389.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9390 = this;
  return cljs.core.count.call(null, this__9390.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9391 = this;
  this__9391.transient_map = cljs.core.dissoc_BANG_.call(null, this__9391.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9392 = this;
  this__9392.transient_map = cljs.core.assoc_BANG_.call(null, this__9392.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9393 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9393.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9397 = this;
  var h__2228__auto____9398 = this__9397.__hash;
  if(!(h__2228__auto____9398 == null)) {
    return h__2228__auto____9398
  }else {
    var h__2228__auto____9399 = cljs.core.hash_iset.call(null, coll);
    this__9397.__hash = h__2228__auto____9399;
    return h__2228__auto____9399
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9400 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9401 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9401.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9427 = null;
  var G__9427__2 = function(this_sym9402, k) {
    var this__9404 = this;
    var this_sym9402__9405 = this;
    var coll__9406 = this_sym9402__9405;
    return coll__9406.cljs$core$ILookup$_lookup$arity$2(coll__9406, k)
  };
  var G__9427__3 = function(this_sym9403, k, not_found) {
    var this__9404 = this;
    var this_sym9403__9407 = this;
    var coll__9408 = this_sym9403__9407;
    return coll__9408.cljs$core$ILookup$_lookup$arity$3(coll__9408, k, not_found)
  };
  G__9427 = function(this_sym9403, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9427__2.call(this, this_sym9403, k);
      case 3:
        return G__9427__3.call(this, this_sym9403, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9427
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9395, args9396) {
  var this__9409 = this;
  return this_sym9395.call.apply(this_sym9395, [this_sym9395].concat(args9396.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9410 = this;
  return new cljs.core.PersistentTreeSet(this__9410.meta, cljs.core.assoc.call(null, this__9410.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9411 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9411.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9412 = this;
  var this__9413 = this;
  return cljs.core.pr_str.call(null, this__9413)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9414 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9414.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9415 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9415.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9416 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9417 = this;
  return cljs.core._comparator.call(null, this__9417.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9418 = this;
  return cljs.core.keys.call(null, this__9418.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9419 = this;
  return new cljs.core.PersistentTreeSet(this__9419.meta, cljs.core.dissoc.call(null, this__9419.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9420 = this;
  return cljs.core.count.call(null, this__9420.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9421 = this;
  var and__3822__auto____9422 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9422) {
    var and__3822__auto____9423 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9423) {
      return cljs.core.every_QMARK_.call(null, function(p1__9377_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9377_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9423
    }
  }else {
    return and__3822__auto____9422
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9424 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9424.tree_map, this__9424.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9425 = this;
  return this__9425.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9426 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9426.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9432__delegate = function(keys) {
      var in__9430 = cljs.core.seq.call(null, keys);
      var out__9431 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9430)) {
          var G__9433 = cljs.core.next.call(null, in__9430);
          var G__9434 = cljs.core.conj_BANG_.call(null, out__9431, cljs.core.first.call(null, in__9430));
          in__9430 = G__9433;
          out__9431 = G__9434;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9431)
        }
        break
      }
    };
    var G__9432 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9432__delegate.call(this, keys)
    };
    G__9432.cljs$lang$maxFixedArity = 0;
    G__9432.cljs$lang$applyTo = function(arglist__9435) {
      var keys = cljs.core.seq(arglist__9435);
      return G__9432__delegate(keys)
    };
    G__9432.cljs$lang$arity$variadic = G__9432__delegate;
    return G__9432
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9436) {
    var keys = cljs.core.seq(arglist__9436);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9438) {
    var comparator = cljs.core.first(arglist__9438);
    var keys = cljs.core.rest(arglist__9438);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9444 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9445 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9445)) {
        var e__9446 = temp__3971__auto____9445;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9446))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9444, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9437_SHARP_) {
      var temp__3971__auto____9447 = cljs.core.find.call(null, smap, p1__9437_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9447)) {
        var e__9448 = temp__3971__auto____9447;
        return cljs.core.second.call(null, e__9448)
      }else {
        return p1__9437_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9478 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9471, seen) {
        while(true) {
          var vec__9472__9473 = p__9471;
          var f__9474 = cljs.core.nth.call(null, vec__9472__9473, 0, null);
          var xs__9475 = vec__9472__9473;
          var temp__3974__auto____9476 = cljs.core.seq.call(null, xs__9475);
          if(temp__3974__auto____9476) {
            var s__9477 = temp__3974__auto____9476;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9474)) {
              var G__9479 = cljs.core.rest.call(null, s__9477);
              var G__9480 = seen;
              p__9471 = G__9479;
              seen = G__9480;
              continue
            }else {
              return cljs.core.cons.call(null, f__9474, step.call(null, cljs.core.rest.call(null, s__9477), cljs.core.conj.call(null, seen, f__9474)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9478.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9483 = cljs.core.PersistentVector.EMPTY;
  var s__9484 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9484)) {
      var G__9485 = cljs.core.conj.call(null, ret__9483, cljs.core.first.call(null, s__9484));
      var G__9486 = cljs.core.next.call(null, s__9484);
      ret__9483 = G__9485;
      s__9484 = G__9486;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9483)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9489 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9489) {
        return or__3824__auto____9489
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9490 = x.lastIndexOf("/");
      if(i__9490 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9490 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9493 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9493) {
      return or__3824__auto____9493
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9494 = x.lastIndexOf("/");
    if(i__9494 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9494)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9501 = cljs.core.ObjMap.EMPTY;
  var ks__9502 = cljs.core.seq.call(null, keys);
  var vs__9503 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9504 = ks__9502;
      if(and__3822__auto____9504) {
        return vs__9503
      }else {
        return and__3822__auto____9504
      }
    }()) {
      var G__9505 = cljs.core.assoc.call(null, map__9501, cljs.core.first.call(null, ks__9502), cljs.core.first.call(null, vs__9503));
      var G__9506 = cljs.core.next.call(null, ks__9502);
      var G__9507 = cljs.core.next.call(null, vs__9503);
      map__9501 = G__9505;
      ks__9502 = G__9506;
      vs__9503 = G__9507;
      continue
    }else {
      return map__9501
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9510__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9495_SHARP_, p2__9496_SHARP_) {
        return max_key.call(null, k, p1__9495_SHARP_, p2__9496_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9510 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9510__delegate.call(this, k, x, y, more)
    };
    G__9510.cljs$lang$maxFixedArity = 3;
    G__9510.cljs$lang$applyTo = function(arglist__9511) {
      var k = cljs.core.first(arglist__9511);
      var x = cljs.core.first(cljs.core.next(arglist__9511));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9511)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9511)));
      return G__9510__delegate(k, x, y, more)
    };
    G__9510.cljs$lang$arity$variadic = G__9510__delegate;
    return G__9510
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9512__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9508_SHARP_, p2__9509_SHARP_) {
        return min_key.call(null, k, p1__9508_SHARP_, p2__9509_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9512 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9512__delegate.call(this, k, x, y, more)
    };
    G__9512.cljs$lang$maxFixedArity = 3;
    G__9512.cljs$lang$applyTo = function(arglist__9513) {
      var k = cljs.core.first(arglist__9513);
      var x = cljs.core.first(cljs.core.next(arglist__9513));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9513)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9513)));
      return G__9512__delegate(k, x, y, more)
    };
    G__9512.cljs$lang$arity$variadic = G__9512__delegate;
    return G__9512
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9516 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9516) {
        var s__9517 = temp__3974__auto____9516;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9517), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9517)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9520 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9520) {
      var s__9521 = temp__3974__auto____9520;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9521)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9521), take_while.call(null, pred, cljs.core.rest.call(null, s__9521)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9523 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9523.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9535 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9536 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9536)) {
        var vec__9537__9538 = temp__3974__auto____9536;
        var e__9539 = cljs.core.nth.call(null, vec__9537__9538, 0, null);
        var s__9540 = vec__9537__9538;
        if(cljs.core.truth_(include__9535.call(null, e__9539))) {
          return s__9540
        }else {
          return cljs.core.next.call(null, s__9540)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9535, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9541 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9541)) {
      var vec__9542__9543 = temp__3974__auto____9541;
      var e__9544 = cljs.core.nth.call(null, vec__9542__9543, 0, null);
      var s__9545 = vec__9542__9543;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9544)) ? s__9545 : cljs.core.next.call(null, s__9545))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9557 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9558 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9558)) {
        var vec__9559__9560 = temp__3974__auto____9558;
        var e__9561 = cljs.core.nth.call(null, vec__9559__9560, 0, null);
        var s__9562 = vec__9559__9560;
        if(cljs.core.truth_(include__9557.call(null, e__9561))) {
          return s__9562
        }else {
          return cljs.core.next.call(null, s__9562)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9557, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9563 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9563)) {
      var vec__9564__9565 = temp__3974__auto____9563;
      var e__9566 = cljs.core.nth.call(null, vec__9564__9565, 0, null);
      var s__9567 = vec__9564__9565;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9566)) ? s__9567 : cljs.core.next.call(null, s__9567))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9568 = this;
  var h__2228__auto____9569 = this__9568.__hash;
  if(!(h__2228__auto____9569 == null)) {
    return h__2228__auto____9569
  }else {
    var h__2228__auto____9570 = cljs.core.hash_coll.call(null, rng);
    this__9568.__hash = h__2228__auto____9570;
    return h__2228__auto____9570
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9571 = this;
  if(this__9571.step > 0) {
    if(this__9571.start + this__9571.step < this__9571.end) {
      return new cljs.core.Range(this__9571.meta, this__9571.start + this__9571.step, this__9571.end, this__9571.step, null)
    }else {
      return null
    }
  }else {
    if(this__9571.start + this__9571.step > this__9571.end) {
      return new cljs.core.Range(this__9571.meta, this__9571.start + this__9571.step, this__9571.end, this__9571.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9572 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9573 = this;
  var this__9574 = this;
  return cljs.core.pr_str.call(null, this__9574)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9575 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9576 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9577 = this;
  if(this__9577.step > 0) {
    if(this__9577.start < this__9577.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9577.start > this__9577.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9578 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9578.end - this__9578.start) / this__9578.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9579 = this;
  return this__9579.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9580 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9580.meta, this__9580.start + this__9580.step, this__9580.end, this__9580.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9581 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9582 = this;
  return new cljs.core.Range(meta, this__9582.start, this__9582.end, this__9582.step, this__9582.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9583 = this;
  return this__9583.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9584 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9584.start + n * this__9584.step
  }else {
    if(function() {
      var and__3822__auto____9585 = this__9584.start > this__9584.end;
      if(and__3822__auto____9585) {
        return this__9584.step === 0
      }else {
        return and__3822__auto____9585
      }
    }()) {
      return this__9584.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9586 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9586.start + n * this__9586.step
  }else {
    if(function() {
      var and__3822__auto____9587 = this__9586.start > this__9586.end;
      if(and__3822__auto____9587) {
        return this__9586.step === 0
      }else {
        return and__3822__auto____9587
      }
    }()) {
      return this__9586.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9588 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9588.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9591 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9591) {
      var s__9592 = temp__3974__auto____9591;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9592), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9592)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9599 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9599) {
      var s__9600 = temp__3974__auto____9599;
      var fst__9601 = cljs.core.first.call(null, s__9600);
      var fv__9602 = f.call(null, fst__9601);
      var run__9603 = cljs.core.cons.call(null, fst__9601, cljs.core.take_while.call(null, function(p1__9593_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9602, f.call(null, p1__9593_SHARP_))
      }, cljs.core.next.call(null, s__9600)));
      return cljs.core.cons.call(null, run__9603, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9603), s__9600))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9618 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9618) {
        var s__9619 = temp__3971__auto____9618;
        return reductions.call(null, f, cljs.core.first.call(null, s__9619), cljs.core.rest.call(null, s__9619))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9620 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9620) {
        var s__9621 = temp__3974__auto____9620;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9621)), cljs.core.rest.call(null, s__9621))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9624 = null;
      var G__9624__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9624__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9624__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9624__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9624__4 = function() {
        var G__9625__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9625 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9625__delegate.call(this, x, y, z, args)
        };
        G__9625.cljs$lang$maxFixedArity = 3;
        G__9625.cljs$lang$applyTo = function(arglist__9626) {
          var x = cljs.core.first(arglist__9626);
          var y = cljs.core.first(cljs.core.next(arglist__9626));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9626)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9626)));
          return G__9625__delegate(x, y, z, args)
        };
        G__9625.cljs$lang$arity$variadic = G__9625__delegate;
        return G__9625
      }();
      G__9624 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9624__0.call(this);
          case 1:
            return G__9624__1.call(this, x);
          case 2:
            return G__9624__2.call(this, x, y);
          case 3:
            return G__9624__3.call(this, x, y, z);
          default:
            return G__9624__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9624.cljs$lang$maxFixedArity = 3;
      G__9624.cljs$lang$applyTo = G__9624__4.cljs$lang$applyTo;
      return G__9624
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9627 = null;
      var G__9627__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9627__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9627__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9627__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9627__4 = function() {
        var G__9628__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9628 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9628__delegate.call(this, x, y, z, args)
        };
        G__9628.cljs$lang$maxFixedArity = 3;
        G__9628.cljs$lang$applyTo = function(arglist__9629) {
          var x = cljs.core.first(arglist__9629);
          var y = cljs.core.first(cljs.core.next(arglist__9629));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9629)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9629)));
          return G__9628__delegate(x, y, z, args)
        };
        G__9628.cljs$lang$arity$variadic = G__9628__delegate;
        return G__9628
      }();
      G__9627 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9627__0.call(this);
          case 1:
            return G__9627__1.call(this, x);
          case 2:
            return G__9627__2.call(this, x, y);
          case 3:
            return G__9627__3.call(this, x, y, z);
          default:
            return G__9627__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9627.cljs$lang$maxFixedArity = 3;
      G__9627.cljs$lang$applyTo = G__9627__4.cljs$lang$applyTo;
      return G__9627
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9630 = null;
      var G__9630__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9630__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9630__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9630__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9630__4 = function() {
        var G__9631__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9631 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9631__delegate.call(this, x, y, z, args)
        };
        G__9631.cljs$lang$maxFixedArity = 3;
        G__9631.cljs$lang$applyTo = function(arglist__9632) {
          var x = cljs.core.first(arglist__9632);
          var y = cljs.core.first(cljs.core.next(arglist__9632));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9632)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9632)));
          return G__9631__delegate(x, y, z, args)
        };
        G__9631.cljs$lang$arity$variadic = G__9631__delegate;
        return G__9631
      }();
      G__9630 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9630__0.call(this);
          case 1:
            return G__9630__1.call(this, x);
          case 2:
            return G__9630__2.call(this, x, y);
          case 3:
            return G__9630__3.call(this, x, y, z);
          default:
            return G__9630__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9630.cljs$lang$maxFixedArity = 3;
      G__9630.cljs$lang$applyTo = G__9630__4.cljs$lang$applyTo;
      return G__9630
    }()
  };
  var juxt__4 = function() {
    var G__9633__delegate = function(f, g, h, fs) {
      var fs__9623 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9634 = null;
        var G__9634__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9604_SHARP_, p2__9605_SHARP_) {
            return cljs.core.conj.call(null, p1__9604_SHARP_, p2__9605_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9623)
        };
        var G__9634__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9606_SHARP_, p2__9607_SHARP_) {
            return cljs.core.conj.call(null, p1__9606_SHARP_, p2__9607_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9623)
        };
        var G__9634__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9608_SHARP_, p2__9609_SHARP_) {
            return cljs.core.conj.call(null, p1__9608_SHARP_, p2__9609_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9623)
        };
        var G__9634__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9610_SHARP_, p2__9611_SHARP_) {
            return cljs.core.conj.call(null, p1__9610_SHARP_, p2__9611_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9623)
        };
        var G__9634__4 = function() {
          var G__9635__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9612_SHARP_, p2__9613_SHARP_) {
              return cljs.core.conj.call(null, p1__9612_SHARP_, cljs.core.apply.call(null, p2__9613_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9623)
          };
          var G__9635 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9635__delegate.call(this, x, y, z, args)
          };
          G__9635.cljs$lang$maxFixedArity = 3;
          G__9635.cljs$lang$applyTo = function(arglist__9636) {
            var x = cljs.core.first(arglist__9636);
            var y = cljs.core.first(cljs.core.next(arglist__9636));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9636)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9636)));
            return G__9635__delegate(x, y, z, args)
          };
          G__9635.cljs$lang$arity$variadic = G__9635__delegate;
          return G__9635
        }();
        G__9634 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9634__0.call(this);
            case 1:
              return G__9634__1.call(this, x);
            case 2:
              return G__9634__2.call(this, x, y);
            case 3:
              return G__9634__3.call(this, x, y, z);
            default:
              return G__9634__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9634.cljs$lang$maxFixedArity = 3;
        G__9634.cljs$lang$applyTo = G__9634__4.cljs$lang$applyTo;
        return G__9634
      }()
    };
    var G__9633 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9633__delegate.call(this, f, g, h, fs)
    };
    G__9633.cljs$lang$maxFixedArity = 3;
    G__9633.cljs$lang$applyTo = function(arglist__9637) {
      var f = cljs.core.first(arglist__9637);
      var g = cljs.core.first(cljs.core.next(arglist__9637));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9637)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9637)));
      return G__9633__delegate(f, g, h, fs)
    };
    G__9633.cljs$lang$arity$variadic = G__9633__delegate;
    return G__9633
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9640 = cljs.core.next.call(null, coll);
        coll = G__9640;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9639 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9639) {
          return n > 0
        }else {
          return and__3822__auto____9639
        }
      }())) {
        var G__9641 = n - 1;
        var G__9642 = cljs.core.next.call(null, coll);
        n = G__9641;
        coll = G__9642;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9644 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9644), s)) {
    if(cljs.core.count.call(null, matches__9644) === 1) {
      return cljs.core.first.call(null, matches__9644)
    }else {
      return cljs.core.vec.call(null, matches__9644)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9646 = re.exec(s);
  if(matches__9646 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9646) === 1) {
      return cljs.core.first.call(null, matches__9646)
    }else {
      return cljs.core.vec.call(null, matches__9646)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9651 = cljs.core.re_find.call(null, re, s);
  var match_idx__9652 = s.search(re);
  var match_str__9653 = cljs.core.coll_QMARK_.call(null, match_data__9651) ? cljs.core.first.call(null, match_data__9651) : match_data__9651;
  var post_match__9654 = cljs.core.subs.call(null, s, match_idx__9652 + cljs.core.count.call(null, match_str__9653));
  if(cljs.core.truth_(match_data__9651)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9651, re_seq.call(null, re, post_match__9654))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9661__9662 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9663 = cljs.core.nth.call(null, vec__9661__9662, 0, null);
  var flags__9664 = cljs.core.nth.call(null, vec__9661__9662, 1, null);
  var pattern__9665 = cljs.core.nth.call(null, vec__9661__9662, 2, null);
  return new RegExp(pattern__9665, flags__9664)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9655_SHARP_) {
    return print_one.call(null, p1__9655_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____9675 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9675)) {
            var and__3822__auto____9679 = function() {
              var G__9676__9677 = obj;
              if(G__9676__9677) {
                if(function() {
                  var or__3824__auto____9678 = G__9676__9677.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9678) {
                    return or__3824__auto____9678
                  }else {
                    return G__9676__9677.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9676__9677.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9676__9677)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9676__9677)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9679)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9679
            }
          }else {
            return and__3822__auto____9675
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9680 = !(obj == null);
          if(and__3822__auto____9680) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9680
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9681__9682 = obj;
          if(G__9681__9682) {
            if(function() {
              var or__3824__auto____9683 = G__9681__9682.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9683) {
                return or__3824__auto____9683
              }else {
                return G__9681__9682.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9681__9682.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9681__9682)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9681__9682)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9703 = new goog.string.StringBuffer;
  var G__9704__9705 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9704__9705) {
    var string__9706 = cljs.core.first.call(null, G__9704__9705);
    var G__9704__9707 = G__9704__9705;
    while(true) {
      sb__9703.append(string__9706);
      var temp__3974__auto____9708 = cljs.core.next.call(null, G__9704__9707);
      if(temp__3974__auto____9708) {
        var G__9704__9709 = temp__3974__auto____9708;
        var G__9722 = cljs.core.first.call(null, G__9704__9709);
        var G__9723 = G__9704__9709;
        string__9706 = G__9722;
        G__9704__9707 = G__9723;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9710__9711 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9710__9711) {
    var obj__9712 = cljs.core.first.call(null, G__9710__9711);
    var G__9710__9713 = G__9710__9711;
    while(true) {
      sb__9703.append(" ");
      var G__9714__9715 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9712, opts));
      if(G__9714__9715) {
        var string__9716 = cljs.core.first.call(null, G__9714__9715);
        var G__9714__9717 = G__9714__9715;
        while(true) {
          sb__9703.append(string__9716);
          var temp__3974__auto____9718 = cljs.core.next.call(null, G__9714__9717);
          if(temp__3974__auto____9718) {
            var G__9714__9719 = temp__3974__auto____9718;
            var G__9724 = cljs.core.first.call(null, G__9714__9719);
            var G__9725 = G__9714__9719;
            string__9716 = G__9724;
            G__9714__9717 = G__9725;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9720 = cljs.core.next.call(null, G__9710__9713);
      if(temp__3974__auto____9720) {
        var G__9710__9721 = temp__3974__auto____9720;
        var G__9726 = cljs.core.first.call(null, G__9710__9721);
        var G__9727 = G__9710__9721;
        obj__9712 = G__9726;
        G__9710__9713 = G__9727;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9703
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9729 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9729.append("\n");
  return[cljs.core.str(sb__9729)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9748__9749 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9748__9749) {
    var string__9750 = cljs.core.first.call(null, G__9748__9749);
    var G__9748__9751 = G__9748__9749;
    while(true) {
      cljs.core.string_print.call(null, string__9750);
      var temp__3974__auto____9752 = cljs.core.next.call(null, G__9748__9751);
      if(temp__3974__auto____9752) {
        var G__9748__9753 = temp__3974__auto____9752;
        var G__9766 = cljs.core.first.call(null, G__9748__9753);
        var G__9767 = G__9748__9753;
        string__9750 = G__9766;
        G__9748__9751 = G__9767;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9754__9755 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9754__9755) {
    var obj__9756 = cljs.core.first.call(null, G__9754__9755);
    var G__9754__9757 = G__9754__9755;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9758__9759 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9756, opts));
      if(G__9758__9759) {
        var string__9760 = cljs.core.first.call(null, G__9758__9759);
        var G__9758__9761 = G__9758__9759;
        while(true) {
          cljs.core.string_print.call(null, string__9760);
          var temp__3974__auto____9762 = cljs.core.next.call(null, G__9758__9761);
          if(temp__3974__auto____9762) {
            var G__9758__9763 = temp__3974__auto____9762;
            var G__9768 = cljs.core.first.call(null, G__9758__9763);
            var G__9769 = G__9758__9763;
            string__9760 = G__9768;
            G__9758__9761 = G__9769;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9764 = cljs.core.next.call(null, G__9754__9757);
      if(temp__3974__auto____9764) {
        var G__9754__9765 = temp__3974__auto____9764;
        var G__9770 = cljs.core.first.call(null, G__9754__9765);
        var G__9771 = G__9754__9765;
        obj__9756 = G__9770;
        G__9754__9757 = G__9771;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9772) {
    var objs = cljs.core.seq(arglist__9772);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9773) {
    var objs = cljs.core.seq(arglist__9773);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9774) {
    var objs = cljs.core.seq(arglist__9774);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9775) {
    var objs = cljs.core.seq(arglist__9775);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9776) {
    var objs = cljs.core.seq(arglist__9776);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9777) {
    var objs = cljs.core.seq(arglist__9777);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9778) {
    var objs = cljs.core.seq(arglist__9778);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9779) {
    var objs = cljs.core.seq(arglist__9779);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9780) {
    var fmt = cljs.core.first(arglist__9780);
    var args = cljs.core.rest(arglist__9780);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9781 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9781, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9782 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9782, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9783 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9783, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____9784 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9784)) {
        var nspc__9785 = temp__3974__auto____9784;
        return[cljs.core.str(nspc__9785), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9786 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9786)) {
          var nspc__9787 = temp__3974__auto____9786;
          return[cljs.core.str(nspc__9787), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9788 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9788, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9790 = function(n, len) {
    var ns__9789 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9789) < len) {
        var G__9792 = [cljs.core.str("0"), cljs.core.str(ns__9789)].join("");
        ns__9789 = G__9792;
        continue
      }else {
        return ns__9789
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9790.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9790.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9790.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9790.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9790.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9790.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9791 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9791, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9793 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9794 = this;
  var G__9795__9796 = cljs.core.seq.call(null, this__9794.watches);
  if(G__9795__9796) {
    var G__9798__9800 = cljs.core.first.call(null, G__9795__9796);
    var vec__9799__9801 = G__9798__9800;
    var key__9802 = cljs.core.nth.call(null, vec__9799__9801, 0, null);
    var f__9803 = cljs.core.nth.call(null, vec__9799__9801, 1, null);
    var G__9795__9804 = G__9795__9796;
    var G__9798__9805 = G__9798__9800;
    var G__9795__9806 = G__9795__9804;
    while(true) {
      var vec__9807__9808 = G__9798__9805;
      var key__9809 = cljs.core.nth.call(null, vec__9807__9808, 0, null);
      var f__9810 = cljs.core.nth.call(null, vec__9807__9808, 1, null);
      var G__9795__9811 = G__9795__9806;
      f__9810.call(null, key__9809, this$, oldval, newval);
      var temp__3974__auto____9812 = cljs.core.next.call(null, G__9795__9811);
      if(temp__3974__auto____9812) {
        var G__9795__9813 = temp__3974__auto____9812;
        var G__9820 = cljs.core.first.call(null, G__9795__9813);
        var G__9821 = G__9795__9813;
        G__9798__9805 = G__9820;
        G__9795__9806 = G__9821;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9814 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9814.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9815 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9815.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9816 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9816.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9817 = this;
  return this__9817.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9818 = this;
  return this__9818.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9819 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9833__delegate = function(x, p__9822) {
      var map__9828__9829 = p__9822;
      var map__9828__9830 = cljs.core.seq_QMARK_.call(null, map__9828__9829) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9828__9829) : map__9828__9829;
      var validator__9831 = cljs.core._lookup.call(null, map__9828__9830, "\ufdd0'validator", null);
      var meta__9832 = cljs.core._lookup.call(null, map__9828__9830, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9832, validator__9831, null)
    };
    var G__9833 = function(x, var_args) {
      var p__9822 = null;
      if(goog.isDef(var_args)) {
        p__9822 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9833__delegate.call(this, x, p__9822)
    };
    G__9833.cljs$lang$maxFixedArity = 1;
    G__9833.cljs$lang$applyTo = function(arglist__9834) {
      var x = cljs.core.first(arglist__9834);
      var p__9822 = cljs.core.rest(arglist__9834);
      return G__9833__delegate(x, p__9822)
    };
    G__9833.cljs$lang$arity$variadic = G__9833__delegate;
    return G__9833
  }();
  atom = function(x, var_args) {
    var p__9822 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____9838 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9838)) {
    var validate__9839 = temp__3974__auto____9838;
    if(cljs.core.truth_(validate__9839.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9840 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9840, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9841__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9841 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9841__delegate.call(this, a, f, x, y, z, more)
    };
    G__9841.cljs$lang$maxFixedArity = 5;
    G__9841.cljs$lang$applyTo = function(arglist__9842) {
      var a = cljs.core.first(arglist__9842);
      var f = cljs.core.first(cljs.core.next(arglist__9842));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9842)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9842))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9842)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9842)))));
      return G__9841__delegate(a, f, x, y, z, more)
    };
    G__9841.cljs$lang$arity$variadic = G__9841__delegate;
    return G__9841
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9843) {
    var iref = cljs.core.first(arglist__9843);
    var f = cljs.core.first(cljs.core.next(arglist__9843));
    var args = cljs.core.rest(cljs.core.next(arglist__9843));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9844 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9844.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9845 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9845.state, function(p__9846) {
    var map__9847__9848 = p__9846;
    var map__9847__9849 = cljs.core.seq_QMARK_.call(null, map__9847__9848) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9847__9848) : map__9847__9848;
    var curr_state__9850 = map__9847__9849;
    var done__9851 = cljs.core._lookup.call(null, map__9847__9849, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9851)) {
      return curr_state__9850
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9845.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9872__9873 = options;
    var map__9872__9874 = cljs.core.seq_QMARK_.call(null, map__9872__9873) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9872__9873) : map__9872__9873;
    var keywordize_keys__9875 = cljs.core._lookup.call(null, map__9872__9874, "\ufdd0'keywordize-keys", null);
    var keyfn__9876 = cljs.core.truth_(keywordize_keys__9875) ? cljs.core.keyword : cljs.core.str;
    var f__9891 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2498__auto____9890 = function iter__9884(s__9885) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9885__9888 = s__9885;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9885__9888)) {
                        var k__9889 = cljs.core.first.call(null, s__9885__9888);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9876.call(null, k__9889), thisfn.call(null, x[k__9889])], true), iter__9884.call(null, cljs.core.rest.call(null, s__9885__9888)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2498__auto____9890.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9891.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9892) {
    var x = cljs.core.first(arglist__9892);
    var options = cljs.core.rest(arglist__9892);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9897 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9901__delegate = function(args) {
      var temp__3971__auto____9898 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9897), args, null);
      if(cljs.core.truth_(temp__3971__auto____9898)) {
        var v__9899 = temp__3971__auto____9898;
        return v__9899
      }else {
        var ret__9900 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9897, cljs.core.assoc, args, ret__9900);
        return ret__9900
      }
    };
    var G__9901 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9901__delegate.call(this, args)
    };
    G__9901.cljs$lang$maxFixedArity = 0;
    G__9901.cljs$lang$applyTo = function(arglist__9902) {
      var args = cljs.core.seq(arglist__9902);
      return G__9901__delegate(args)
    };
    G__9901.cljs$lang$arity$variadic = G__9901__delegate;
    return G__9901
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9904 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9904)) {
        var G__9905 = ret__9904;
        f = G__9905;
        continue
      }else {
        return ret__9904
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9906__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9906 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9906__delegate.call(this, f, args)
    };
    G__9906.cljs$lang$maxFixedArity = 1;
    G__9906.cljs$lang$applyTo = function(arglist__9907) {
      var f = cljs.core.first(arglist__9907);
      var args = cljs.core.rest(arglist__9907);
      return G__9906__delegate(f, args)
    };
    G__9906.cljs$lang$arity$variadic = G__9906__delegate;
    return G__9906
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9909 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9909, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9909, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____9918 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9918) {
      return or__3824__auto____9918
    }else {
      var or__3824__auto____9919 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9919) {
        return or__3824__auto____9919
      }else {
        var and__3822__auto____9920 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9920) {
          var and__3822__auto____9921 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9921) {
            var and__3822__auto____9922 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9922) {
              var ret__9923 = true;
              var i__9924 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9925 = cljs.core.not.call(null, ret__9923);
                  if(or__3824__auto____9925) {
                    return or__3824__auto____9925
                  }else {
                    return i__9924 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9923
                }else {
                  var G__9926 = isa_QMARK_.call(null, h, child.call(null, i__9924), parent.call(null, i__9924));
                  var G__9927 = i__9924 + 1;
                  ret__9923 = G__9926;
                  i__9924 = G__9927;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9922
            }
          }else {
            return and__3822__auto____9921
          }
        }else {
          return and__3822__auto____9920
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__9936 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9937 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9938 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9939 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9940 = cljs.core.contains_QMARK_.call(null, tp__9936.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9938.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9938.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9936, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9939.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9937, parent, ta__9938), "\ufdd0'descendants":tf__9939.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9938, tag, td__9937)})
    }();
    if(cljs.core.truth_(or__3824__auto____9940)) {
      return or__3824__auto____9940
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9945 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9946 = cljs.core.truth_(parentMap__9945.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9945.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9947 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9946)) ? cljs.core.assoc.call(null, parentMap__9945, tag, childsParents__9946) : cljs.core.dissoc.call(null, parentMap__9945, tag);
    var deriv_seq__9948 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9928_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9928_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9928_SHARP_), cljs.core.second.call(null, p1__9928_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9947)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9945.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9929_SHARP_, p2__9930_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9929_SHARP_, p2__9930_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9948))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9956 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9958 = cljs.core.truth_(function() {
    var and__3822__auto____9957 = xprefs__9956;
    if(cljs.core.truth_(and__3822__auto____9957)) {
      return xprefs__9956.call(null, y)
    }else {
      return and__3822__auto____9957
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9958)) {
    return or__3824__auto____9958
  }else {
    var or__3824__auto____9960 = function() {
      var ps__9959 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9959) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9959), prefer_table))) {
          }else {
          }
          var G__9963 = cljs.core.rest.call(null, ps__9959);
          ps__9959 = G__9963;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9960)) {
      return or__3824__auto____9960
    }else {
      var or__3824__auto____9962 = function() {
        var ps__9961 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9961) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9961), y, prefer_table))) {
            }else {
            }
            var G__9964 = cljs.core.rest.call(null, ps__9961);
            ps__9961 = G__9964;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9962)) {
        return or__3824__auto____9962
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9966 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9966)) {
    return or__3824__auto____9966
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9984 = cljs.core.reduce.call(null, function(be, p__9976) {
    var vec__9977__9978 = p__9976;
    var k__9979 = cljs.core.nth.call(null, vec__9977__9978, 0, null);
    var ___9980 = cljs.core.nth.call(null, vec__9977__9978, 1, null);
    var e__9981 = vec__9977__9978;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9979)) {
      var be2__9983 = cljs.core.truth_(function() {
        var or__3824__auto____9982 = be == null;
        if(or__3824__auto____9982) {
          return or__3824__auto____9982
        }else {
          return cljs.core.dominates.call(null, k__9979, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9981 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9983), k__9979, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9979), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9983)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9983
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9984)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9984));
      return cljs.core.second.call(null, best_entry__9984)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____9989 = mf;
    if(and__3822__auto____9989) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____9989
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2399__auto____9990 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9991 = cljs.core._reset[goog.typeOf(x__2399__auto____9990)];
      if(or__3824__auto____9991) {
        return or__3824__auto____9991
      }else {
        var or__3824__auto____9992 = cljs.core._reset["_"];
        if(or__3824__auto____9992) {
          return or__3824__auto____9992
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____9997 = mf;
    if(and__3822__auto____9997) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____9997
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2399__auto____9998 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9999 = cljs.core._add_method[goog.typeOf(x__2399__auto____9998)];
      if(or__3824__auto____9999) {
        return or__3824__auto____9999
      }else {
        var or__3824__auto____10000 = cljs.core._add_method["_"];
        if(or__3824__auto____10000) {
          return or__3824__auto____10000
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10005 = mf;
    if(and__3822__auto____10005) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10005
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2399__auto____10006 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10007 = cljs.core._remove_method[goog.typeOf(x__2399__auto____10006)];
      if(or__3824__auto____10007) {
        return or__3824__auto____10007
      }else {
        var or__3824__auto____10008 = cljs.core._remove_method["_"];
        if(or__3824__auto____10008) {
          return or__3824__auto____10008
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10013 = mf;
    if(and__3822__auto____10013) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10013
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2399__auto____10014 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10015 = cljs.core._prefer_method[goog.typeOf(x__2399__auto____10014)];
      if(or__3824__auto____10015) {
        return or__3824__auto____10015
      }else {
        var or__3824__auto____10016 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10016) {
          return or__3824__auto____10016
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10021 = mf;
    if(and__3822__auto____10021) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10021
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2399__auto____10022 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10023 = cljs.core._get_method[goog.typeOf(x__2399__auto____10022)];
      if(or__3824__auto____10023) {
        return or__3824__auto____10023
      }else {
        var or__3824__auto____10024 = cljs.core._get_method["_"];
        if(or__3824__auto____10024) {
          return or__3824__auto____10024
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10029 = mf;
    if(and__3822__auto____10029) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10029
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2399__auto____10030 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10031 = cljs.core._methods[goog.typeOf(x__2399__auto____10030)];
      if(or__3824__auto____10031) {
        return or__3824__auto____10031
      }else {
        var or__3824__auto____10032 = cljs.core._methods["_"];
        if(or__3824__auto____10032) {
          return or__3824__auto____10032
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10037 = mf;
    if(and__3822__auto____10037) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10037
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2399__auto____10038 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10039 = cljs.core._prefers[goog.typeOf(x__2399__auto____10038)];
      if(or__3824__auto____10039) {
        return or__3824__auto____10039
      }else {
        var or__3824__auto____10040 = cljs.core._prefers["_"];
        if(or__3824__auto____10040) {
          return or__3824__auto____10040
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10045 = mf;
    if(and__3822__auto____10045) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10045
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2399__auto____10046 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10047 = cljs.core._dispatch[goog.typeOf(x__2399__auto____10046)];
      if(or__3824__auto____10047) {
        return or__3824__auto____10047
      }else {
        var or__3824__auto____10048 = cljs.core._dispatch["_"];
        if(or__3824__auto____10048) {
          return or__3824__auto____10048
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10051 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10052 = cljs.core._get_method.call(null, mf, dispatch_val__10051);
  if(cljs.core.truth_(target_fn__10052)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10051)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10052, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10053 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10054 = this;
  cljs.core.swap_BANG_.call(null, this__10054.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10054.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10054.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10054.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10055 = this;
  cljs.core.swap_BANG_.call(null, this__10055.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10055.method_cache, this__10055.method_table, this__10055.cached_hierarchy, this__10055.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10056 = this;
  cljs.core.swap_BANG_.call(null, this__10056.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10056.method_cache, this__10056.method_table, this__10056.cached_hierarchy, this__10056.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10057 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10057.cached_hierarchy), cljs.core.deref.call(null, this__10057.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10057.method_cache, this__10057.method_table, this__10057.cached_hierarchy, this__10057.hierarchy)
  }
  var temp__3971__auto____10058 = cljs.core.deref.call(null, this__10057.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10058)) {
    var target_fn__10059 = temp__3971__auto____10058;
    return target_fn__10059
  }else {
    var temp__3971__auto____10060 = cljs.core.find_and_cache_best_method.call(null, this__10057.name, dispatch_val, this__10057.hierarchy, this__10057.method_table, this__10057.prefer_table, this__10057.method_cache, this__10057.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10060)) {
      var target_fn__10061 = temp__3971__auto____10060;
      return target_fn__10061
    }else {
      return cljs.core.deref.call(null, this__10057.method_table).call(null, this__10057.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10062 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10062.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10062.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10062.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10062.method_cache, this__10062.method_table, this__10062.cached_hierarchy, this__10062.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10063 = this;
  return cljs.core.deref.call(null, this__10063.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10064 = this;
  return cljs.core.deref.call(null, this__10064.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10065 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10065.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10067__delegate = function(_, args) {
    var self__10066 = this;
    return cljs.core._dispatch.call(null, self__10066, args)
  };
  var G__10067 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10067__delegate.call(this, _, args)
  };
  G__10067.cljs$lang$maxFixedArity = 1;
  G__10067.cljs$lang$applyTo = function(arglist__10068) {
    var _ = cljs.core.first(arglist__10068);
    var args = cljs.core.rest(arglist__10068);
    return G__10067__delegate(_, args)
  };
  G__10067.cljs$lang$arity$variadic = G__10067__delegate;
  return G__10067
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10069 = this;
  return cljs.core._dispatch.call(null, self__10069, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2345__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10070 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10072, _) {
  var this__10071 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10071.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10073 = this;
  var and__3822__auto____10074 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10074) {
    return this__10073.uuid === other.uuid
  }else {
    return and__3822__auto____10074
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10075 = this;
  var this__10076 = this;
  return cljs.core.pr_str.call(null, this__10076)
};
cljs.core.UUID;
goog.provide("tracker.diet.new_meal");
goog.require("cljs.core");
tracker.diet.new_meal.add_food_input = function add_food_input(n) {
  return console.log("aFI")
};
