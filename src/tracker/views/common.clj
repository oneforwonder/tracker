(ns tracker.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.page-helpers :only [include-css html5]]))

(def sidebar-links (array-map 
  :Overview    "overview"
  :To-Do       "todo"
  :Diet        "diet"
  :Exercise    "exercise"
  :Financial   "financial"
  :Programming "programming"
  :Music       "music"
  :Mind        "mind"
  :Social      "social"))

(defpartial sidebar []
  [:div {:class "span3"}
    [:ul {:class "nav nav-tabs nav-stacked sidenav"}
      (map 
        (fn [[section address]]
          [:li
            [:a {:href address} 
              [:i {:class "icon-chevron-right"}]
              (name section)]])
        sidebar-links)]])

(defpartial layout [& content]
  (html5 {:lang "en"}
    [:head
      [:meta {:charset "utf-8"}]
      [:title "Rob's And Alex's Tracker for Tracking Things and Stuff That Alex And Rob Want To Track!"]
      (include-css "http://netdna.bootstrapcdn.com/twitter-bootstrap/2.1.1/css/bootstrap-combined.min.css")
      (include-css "css/app.css")]
    [:body
      [:div {:class "container"} 
        [:div {:class "row"}
          (sidebar)
          [:div {:class "span9 content"} content]]]]))
