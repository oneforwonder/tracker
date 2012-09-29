(ns tracker.views.common
  (:use [clojure.java.io :only [resource]]
        [noir.core :only [defpartial]]
        [hiccup.page-helpers :only [include-css html5]]))

(defn serve-static [res]
  (slurp (resource (str "public/" res))))

(defpartial layout [& content]
  (html5 {:lang "en"}
    [:head
      [:meta {:charset "utf-8"}]
      [:title "Rob's And Alex's Tracker for Tracking Things And Stuff That Alex And Rob Want To Track!"]
      (include-css "http://netdna.bootstrapcdn.com/twitter-bootstrap/2.1.1/css/bootstrap-combined.min.css")
      (include-css "css/app.css")]
    [:body
      [:div {:class "container"} content]]))
