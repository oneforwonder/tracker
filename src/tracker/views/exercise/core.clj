(ns tracker.views.exercise.core
  (:require [tracker.views.common :as common])
  (:use [noir.core]
        [hiccup.core :only [html]]))

(defpartial exercise-today []
  [:div {:id "exercise-today"}
   [:h3 "Today"]
   [:p "Aerobic exercise: run, hike, swim, bike"]])

(defpartial exercise-progress []
  [:div {:id "exercise-progress"}
   [:h3 "Progress"]
   [:div {:id "pr-chart"}]])

(defpage "/exercise" []
  (common/layout {:js-src ["tracker.exercise.core.loadChart()"]}
    [:h1 "Exercise"]
    (exercise-today)
    (exercise-progress)))

