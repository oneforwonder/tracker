(ns tracker.util
  (:use [clojure.java.io :only [resource]]))

(defn serve-static [res]
  (slurp (resource (str "public/" res))))

