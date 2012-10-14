(ns tracker.diet.today
    (:use [tracker.util :only [log event-char]]))

(defn new-text-meal []
  (aset js/window "location" "/diet/new-text-meal"))

(defn onkeyup [e]
  (case (log (event-char e)) 
    "c" (new-text-meal)
    nil))

(defn ^:export initToday []
  (aset js/window "onkeyup" onkeyup))
