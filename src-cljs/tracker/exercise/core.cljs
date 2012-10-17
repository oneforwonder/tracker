(ns tracker.exercise.core
    (:use [tracker.util :only [log]]
          [domina :only [by-id]]
          [jayq.util :only [clj->js]]))

(defn chart-data []
  (doto (js/google.visualization.DataTable.)
        (.addColumn "date" "Date")
        (.addColumn "number" "Squat")
        (.addColumn "number" "Bench")
        (.addColumn "number" "Deadlift")
        (.addColumn "number" "Press")
        (.addColumn "number" "Clean")
        (.addColumn "number" "Chins")
        (.addRows (clj->js [[(js/Date. 2012 9 10) 65  65  45  nil nil nil]
                            [(js/Date. 2012 9 12) 70  nil nil 45  45  140]
                            [(js/Date. 2012 9 14) 95  80  65  nil nil nil]
                            [(js/Date. 2012 9 16) 105 nil nil 55  55  140]]))))

(defn chart-options []
  (clj->js {:title "Weight-Lifting PRs"
            :width 600
            :height 450
            ;:backgroundColor (js-obj "fill" "transparent")
            :displayRangeSelector false
            :displayZoomButtons false}))

(defn chart []
  (js/google.visualization.AnnotatedTimeLine. (by-id "pr-chart")))

(defn draw-chart []
  (.draw (chart) (chart-data) (chart-options)))

(defn ^:export loadChart []
  (.load js/google "visualization" "1" (clj->js {:packages ["corechart" "annotatedtimeline"]}))
  (.setOnLoadCallback js/google draw-chart))

