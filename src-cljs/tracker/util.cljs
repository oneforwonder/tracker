(ns tracker.util
    (:require [clojure.string :as str])) 

(defn log [s]
  (.log js/console s)
  s)

(defn reverse-map [m]
  (into {} (map (fn [[k v]] [v k]) m)))

(defn event-char [e]
 (let [k (or (.-keyCode e) (.-charCode e))
       c (.fromCharCode js/String k)]
   (if (.-shiftKey e) c (str/lower-case c))))

