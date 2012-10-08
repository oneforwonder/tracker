(ns tracker.util)

(defn log [s]
  (.log js/console s)
  s)

(defn reverse-map [m]
  (into {} (map (fn [[k v]] [v k]) m)))

